import { RESOURCE } from "../views/chapter_diagnostic_questions"

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

const DEFAULT_DIAGNOSTIC_SIZE = 10;
const MIN_DIAGNOSTIC_SIZE = 8;
export const generateChapterDiagnosticQuestions =  async(chapterId:any) => {
    try{
        const dataProvider = (window as any).swanAppFunctions.dataProvider;
        //Filter MCQs for the chapter
        const {data:mcqs} = await dataProvider.getList('questions',{
            meta:{prefetch:['concepts']},
            filter:{concept:{chapter_id:chapterId },type:'MCQ'}}
            );
        console.log("Fetched Questions for Diagnostic: ", mcqs);
        if (mcqs.length === 0) return [];

        // Step 2: Diagnostic size
        const totalMcqs = mcqs.length;
        const concepts = [...new Set(mcqs.map(q => q.conceptId))];
        const totalConcepts = concepts.length;

        let diagnosticSize;
        if (totalMcqs <= 15) diagnosticSize = Math.min(MIN_DIAGNOSTIC_SIZE, totalMcqs);
        else if (totalMcqs <= 60) diagnosticSize = Math.max(MIN_DIAGNOSTIC_SIZE, Math.round(totalMcqs * 0.25));
        else diagnosticSize = DEFAULT_DIAGNOSTIC_SIZE;

        // Step 3: Group by concept
        const byConcept = {};
        for (const q of mcqs) {
            byConcept[q.conceptId] ??= [];
            byConcept[q.conceptId].push(q);
        }

        // Step 4: Allocate per concept
        const allocation = {};
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

        // Step 5: Random pick
        const shuffle = arr => arr.sort(() => Math.random() - 0.5);

        let selected = [];
        for (const [conceptId, conceptQuestions] of Object.entries(byConcept)) {
            const count = allocation[conceptId] ?? 0;
            selected.push(
                ...shuffle(conceptQuestions).slice(0, count)
            );
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
    }
    catch(Error){
        console.log("Error generating diagnostic questions: ", Error);
    }
}

export const uploadChapterDiagnosticQuestions = async(chapterId:any, questionIds:any[]) => {
    try{
        const dataProvider = (window as any).swanAppFunctions.dataProvider;
        const questionRecords = [];
        for (const questionId of questionIds) {
            const questionData = {
                question_id: questionId,
                question_order_number: questionRecords.length + 1,
            };
            questionRecords.push(questionData);
        }

        const { data: existingQuestions } = await dataProvider.getList('chapter_diagnostic_questions');
        if (existingQuestions.length > 0) {
            await dataProvider.deleteMany('chapter_diagnostic_questions', {
                ids: existingQuestions.map((exQ: {
                    id: any;
                }) => exQ.id)
            });
        }

        const bulkCreateRequests = [];
        for (const questionRecord of questionRecords) {
            bulkCreateRequests.push(
                {
                    type: 'create',
                    resource: 'chapter_diagnostic_questions',
                    params: {
                        data: {
                            ...questionRecord
                        }
                    }
                }
            );
        }
        if (bulkCreateRequests.length > 0) {
            const dbTransactionId = await dataProvider.beginTransaction();
            await dataProvider.executeBatch(bulkCreateRequests, dbTransactionId);
            await dataProvider.commitTransaction(dbTransactionId);
        }
    } catch (Error) {
        console.log("Error uploading diagnostic questions: ", Error);
    }
}