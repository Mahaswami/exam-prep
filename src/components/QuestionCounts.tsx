import { Box, Chip, Stack } from "@mui/material";
import { useRecordContext } from "react-admin";
import { questionTypeChoices } from "../views/questions";


type QuestionCountsProps = {
    questionCounts: Record<number, any>;
};

export type QuestionCountsType = {
    totalQuestions: number;
    activeQuestions: number;
    diagnosticQuestions: number;
    nonDiagnosticQuestions: number;
    questionTypes: Record<string, number>;
};

export const QuestionCounts = ({ questionCounts }: QuestionCountsProps) => {
    const record = useRecordContext();
    if (!record) return null;
    const stats = questionCounts[record?.id];
    if (!stats) return null;
    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={1} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Stack direction="row" spacing={2}>
                    <Chip label={`Total Questions: ${stats.totalQuestions}`} />
                    <Chip label={`Active Questions: ${stats.activeQuestions}`} color="success" />
                    <Chip label={`Diagnostic Questions: ${stats.diagnosticQuestions}`} color="warning" />
                    <Chip label={`Non-Diagnostic Questions: ${stats.nonDiagnosticQuestions}`} color="info" />
                </Stack>
                <Box>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {Object.entries(stats.questionTypes || {}).map(([type, count]) => (
                            <Chip
                                key={type}
                                size="small"
                                label={`${questionTypeChoices.find(c => c.id === type)?.name || type}: ${count}`}
                                sx={{ mb: 0.5 }}
                            />
                        ))}
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
};

export const getChaptersQuestionCounts = async () => {
    const dataProvider = (window as any).swanAppFunctions.dataProvider;
    let chapters: any[] = [];
    let concepts: any[] = [];
    let questions: any[] = [];
    let chapterDiagnosticQuestions: any[] = [];
    const questionCounts: Record<number, QuestionCountsType> = {};

    const batchRequests = [
        { type: "getList", resource: "chapters", params: { pagination: false } },
        { type: "getList", resource: "concepts", params: { pagination: false } },
        { type: "getList", resource: "questions", params: { pagination: false } },
        { type: "getList", resource: "chapter_diagnostic_questions", params: { pagination: false } },
    ];

    const batchResults = await dataProvider.executeBatch(batchRequests);

    batchResults.results.forEach((result: any) => {
        if (!result?.data) return;
        const resource = result.request.resource;
        if (resource === "chapters") {
            chapters = result.data;
        } else if (resource === "concepts") {
            concepts = result.data;
        } else if (resource === "questions") {
            questions = result.data;
        } else if (resource === "chapter_diagnostic_questions") {
            chapterDiagnosticQuestions = result.data;
        }
    });

    if (!chapters.length || !concepts.length || !questions.length) {
        return questionCounts;
    }
    chapters.forEach((chapter: any) => {
        const chapterConceptIds = concepts.filter(c => c.chapter_id === chapter.id).map(c => c.id);
        const chapterQuestions = questions.filter(q => chapterConceptIds.includes(q.concept_id));
        const activeQuestions = chapterQuestions.filter(q => q.status === 'active');

        const diagnosticQuestionIds = chapterDiagnosticQuestions
            .filter(dq => dq.chapter_id === chapter.id)
            .map(dq => dq.question_id);

        const diagnosticQs = chapterQuestions.filter(q => diagnosticQuestionIds.includes(q.id));
        const nonDiagnosticQs = chapterQuestions.filter(q => !diagnosticQuestionIds.includes(q.id));

        const questionTypes = chapterQuestions.reduce(
            (acc: Record<string, number>, q) => {
                const type = q.type;
                if (type) {
                    acc[type] = (acc[type] || 0) + 1;
                }
                return acc;
            }, {}
        );
        questionCounts[chapter.id] = {
            totalQuestions: chapterQuestions.length,
            activeQuestions: activeQuestions.length,
            diagnosticQuestions: diagnosticQs.length,
            nonDiagnosticQuestions: nonDiagnosticQs.length,
            questionTypes,
        };
    });

    return questionCounts;
}

export const getConceptQuestionCounts = async () => {
    const dataProvider = (window as any).swanAppFunctions.dataProvider;
    const questionCounts: Record<number, QuestionCountsType> = {};

    let concepts: any[] = [];
    let questions: any[] = [];
    let conceptDiagnosticQuestions: any[] = [];

    const batchRequests = [
        { type: "getList", resource: "concepts", params: { pagination: false } },
        { type: "getList", resource: "questions", params: { pagination: false } },
        { type: "getList", resource: "chapter_diagnostic_questions", params: { pagination: false } },
    ];

    const batchResults = await dataProvider.executeBatch(batchRequests);

    batchResults.results.forEach((result: any) => {
        if (!result?.data) return;
        const resource = result.request.resource;
        if (resource === "concepts") {
            concepts = result.data;
        } else if (resource === "questions") {
            questions = result.data;
        } else if (resource === "chapter_diagnostic_questions") {
            conceptDiagnosticQuestions = result.data;
        }
    });

    if (!concepts.length || !questions.length) {
        return questionCounts;
    }

    concepts.forEach((concept: any) => {
        const conceptQuestions = questions.filter(q => concept.id === q.concept_id);
        const activeQuestions = conceptQuestions.filter(q => q.status === 'active');

        const diagnosticQuestionIds = conceptDiagnosticQuestions
            .filter(dq => dq.chapter_id === concept.id)
            .map(dq => dq.question_id);

        const diagnosticQs = conceptQuestions.filter(q => diagnosticQuestionIds.includes(q.id));
        const nonDiagnosticQs = conceptQuestions.filter(q => !diagnosticQuestionIds.includes(q.id));

        const questionTypes = conceptQuestions.reduce(
            (acc: Record<string, number>, q) => {
                const type = q.type;
                if (type) {
                    acc[type] = (acc[type] || 0) + 1;
                }
                return acc;
            }, {}
        );
        questionCounts[concept.id] = {
            totalQuestions: conceptQuestions.length,
            activeQuestions: activeQuestions.length,
            diagnosticQuestions: diagnosticQs.length,
            nonDiagnosticQuestions: nonDiagnosticQs.length,
            questionTypes,
        };
    });

    return questionCounts;
}