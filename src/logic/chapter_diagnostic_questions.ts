import { RESOURCE } from "../views/chapter_diagnostic_questions"
import { shuffle } from "./roundConfigs"
import { SELECTION_CONFIGS } from "./selectionConfigs"

interface Question {
    id: number;
    concept_id: number;
    [key: string]: any;
}

export const ChapterDiagnosticQuestionsLogic: any = {
    resource: RESOURCE,
    afterCreate: [],
    afterDelete: [],
    afterDeleteMany: [],
    afterGetList: [(params: any) => {
        console.log('ChapterDiagnosticQuestionsLogic: Sample: afterGetList hook executed');
        return params;
    }],
    afterGetMany: [],
    afterGetManyReference: [],
    afterGetOne: [],
    afterUpdate: [],
    afterUpdateMany: [],
    beforeCreate: [],
    beforeDelete: [],
    beforeDeleteMany: [],
    beforeGetList: [],
    beforeGetMany: [],
    beforeGetManyReference: [],
    beforeGetOne: [],
    beforeUpdate: [],
    beforeUpdateMany: [],
    beforeSave: [],
    afterRead: [],
    afterSave: [],
}

const diagnosticConfig = SELECTION_CONFIGS.diagnostic;

export const generateChapterDiagnosticQuestions =  async(chapterId:any) => {
    try{
        const dataProvider = (window as any).swanAppFunctions.dataProvider;
        const { type, status } = diagnosticConfig.poolFilter;
        const {data:mcqs} = await dataProvider.getList('questions',{
            meta:{prefetch:['concepts']},
            filter:{concept:{chapter_id:chapterId }, type, status}}
            );
        console.log("Fetched Questions for Diagnostic: ", mcqs);
        if (mcqs.length === 0) return [];

        const totalMcqs = mcqs.length;
        const concepts = [...new Set(mcqs.map((q: Question) => q.concept_id))];
        const totalConcepts = concepts.length;

        let diagnosticSize;
        if (totalMcqs <= 15) diagnosticSize = Math.min(diagnosticConfig.minSize, totalMcqs);
        else if (totalMcqs <= 60) diagnosticSize = Math.max(diagnosticConfig.minSize, Math.round(totalMcqs * 0.25));
        else diagnosticSize = diagnosticConfig.maxSize;

        // Step 3: Group by concept
        const byConcept: Record<number, Question[]> = {};
        for (const q of mcqs) {
            byConcept[q.concept_id] ??= [];
            byConcept[q.concept_id].push(q);
        }

        // Step 4: Allocate per concept
        const allocation: Record<number, number> = {};
        const remainingSlots = Math.max(0, diagnosticSize - totalConcepts);

        for (const [conceptId, conceptQuestions] of Object.entries(byConcept)) {
            const proportional = Math.round(
                (conceptQuestions.length / totalMcqs) * remainingSlots
            );

            allocation[conceptId] = Math.min(
                conceptQuestions.length,
                1 + Math.max(0, proportional)
            );
        }

        let selected: Question[] = [];
        for (const [conceptId, conceptQuestions] of Object.entries(byConcept)) {
            const count = allocation[conceptId] ?? 0;
            if (count === 0) continue;
            
            const hard = shuffle(conceptQuestions.filter(q => q.difficulty === 'Hard'));
            const medium = shuffle(conceptQuestions.filter(q => q.difficulty === 'Medium'));
            const easy = shuffle(conceptQuestions.filter(q => q.difficulty === 'Easy'));
            
            const conceptSelected: Question[] = [];
            const hardToTake = Math.min(hard.length, diagnosticConfig.perConceptMinHard, count);
            conceptSelected.push(...hard.slice(0, hardToTake));
            
            const remaining = count - conceptSelected.length;
            const fillPool = [...medium, ...easy, ...hard.slice(hardToTake)];
            conceptSelected.push(...fillPool.slice(0, remaining));
            
            selected.push(...conceptSelected);
        }

        if (selected.length < diagnosticSize) {
            const selectedIds = new Set(selected.map(q => q.id));

            const remainingPool = shuffle(
                mcqs.filter(q => !selectedIds.has(q.id))
            );

            selected.push(
                ...remainingPool.slice(0, diagnosticSize - selected.length)
            );
        }

        // Step 6: Final trim
        selected = shuffle(selected).slice(0, diagnosticSize);

        return selected.map(q => q.id);
    } catch (error) {
        console.error("Error generating diagnostic questions: ", error);
        return [];
    }
}

export const uploadChapterDiagnosticQuestions = async(chapterId:any, questionIds:any[]) => {
    try{
        const dataProvider = (window as any).swanAppFunctions.dataProvider;
        const questionRecords = [];
        for (const questionId of questionIds) {
            const questionData = {
                chapter_id: chapterId,
                question_id: questionId,
                question_order_number: questionRecords.length + 1,
            };
            questionRecords.push(questionData);
        }
        const { data: chapterQuestions } = await dataProvider.getList('chapter_diagnostic_questions', {
            filter: { chapter_id: chapterId }
        });
        const bulkRequests = [];
        for (const chapterQuestion of chapterQuestions) {
            bulkRequests.push({
                type: 'delete',
                resource: 'chapter_diagnostic_questions',
                params: { id: chapterQuestion.id }
            });
        }
        for (const questionRecord of questionRecords) {
            bulkRequests.push({
                type: 'create',
                resource: 'chapter_diagnostic_questions',
                params: {
                    data: { ...questionRecord }
                }
            });
        }
        return bulkRequests;
    } catch (error) {
        console.error("Error uploading diagnostic questions: ", error);
        return [];
    }
}