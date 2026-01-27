import { humanize } from "@mahaswami/swan-frontend";
import { Box, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { stringify } from "query-string";
import { useCallback, useEffect, useState } from "react";
import { Link, useRecordContext, useResourceContext } from "react-admin";
import { questionTypeChoices } from "../views/questions";


type QuestionCountsProps = {
    questionCounts: Record<number, any>;
};

export type QuestionCountsType = {
    totalQuestions: number;
    activeQuestions: number;
    diagnosticQuestions: number;
    nonDiagnosticQuestions: number;
    questionTypes: Record<string, { E: number; M: number; H: number; total: number }>;
};

export const QuestionCounts = ({ questionCounts }: QuestionCountsProps) => {
    const record = useRecordContext();
    if (!record) return null;
    const stats = questionCounts[record?.id];
    if (!stats) return null;
    return (
        <Box sx={{ p: 2 }}>
            <Box>
                <Stack direction="row" spacing={0.5} gap="0.5em" flexWrap="wrap">
                    <Chip size="small" label={`Total Questions: ${stats.totalQuestions}`} />
                    {Object.entries(stats.questionTypes || {}).map(([type, counts]: any) => (
                        <Chip
                            key={type}
                            size="small"
                            label={`${questionTypeChoices.find(c => c.id === type)?.name || type}: ${counts.total} (${counts.E}E • ${counts.M}M • ${counts.H}H)`}
                            sx={{ mb: 0.5 }}
                        />
                    ))}
                </Stack>
            </Box>
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
            (acc: Record<string, { E: number; M: number; H: number; total: number }>, q) => {
                const type = q.type;
                if (type) {
                    if (!acc[type]) acc[type] = { E: 0, M: 0, H: 0, total: 0 };
                    acc[type].total++;
                    if (q.difficulty === 'Easy') acc[type].E++;
                    else if (q.difficulty === 'Medium') acc[type].M++;
                    else if (q.difficulty === 'Hard') acc[type].H++;
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
            (acc: Record<string, { E: number; M: number; H: number; total: number }>, q) => {
                const type = q.type;
                if (type) {
                    if (!acc[type]) acc[type] = { E: 0, M: 0, H: 0, total: 0 };
                    acc[type].total++;
                    if (q.difficulty === 'Easy') acc[type].E++;
                    else if (q.difficulty === 'Medium') acc[type].M++;
                    else if (q.difficulty === 'Hard') acc[type].H++;
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

type QuestionStatus =
    | "in_active"
    | "need_verification"
    | "need_correction"
    | "active";

const INITIAL_VALUES: Record<QuestionStatus, number> = {
    in_active: 0,
    need_verification: 0,
    need_correction: 0,
    active: 0,
};

export const ShowQuestionDetails = () => {
    const resource = useResourceContext();
    const isConcept = resource === "concepts";
    const record = useRecordContext();
    const [questions, setQuestions] = useState<any>(INITIAL_VALUES);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<any>({ concept_id: record?.id });
    const dataProvider = (window as any).swanAppFunctions.dataProvider;

    useEffect(() => {
        if (!record?.id) return;

        const fetchQuestions = async () => {
            setLoading(true);
            try {
                let newFilter: any = {};

                if (isConcept) {
                    newFilter = { concept_id: record.id };
                } else {
                    const { data: chapterConcepts } =
                        await dataProvider.getList("concepts", {
                            filter: { chapter_id: record.id },
                            pagination: { page: 1, perPage: 1000 },
                        });

                    const conceptIds = chapterConcepts
                        .map((c: any) => c.id)
                        .filter(Boolean);

                    newFilter = { concept_id_eq_any: conceptIds };
                }
                setFilter(newFilter);
                const { data: questions } = await dataProvider.getList("questions", {
                    filter: newFilter,
                    pagination: { page: 1, perPage: 1000 },
                });

                const grouped = questions.reduce((acc: any, question: any) => {
                    const status = question.status;
                    if (!acc[status]) acc[status] = 0;
                    acc[status]++;
                    return acc;
                }, { ...INITIAL_VALUES });

                setQuestions(grouped);
            } catch (error) {
                console.log("Error fetching questions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [record, resource]);

    const buildQuestionsLink = useCallback(
        (extraFilter = {}) => ({
            pathname: "/questions",
            search: stringify({
                filter: JSON.stringify({
                    ...filter,
                    ...extraFilter,
                }),
            }),
        }),
        [filter]
    );

    if (loading) return <Skeleton height={120} />;
    if (!record) return <Typography>No questions found.</Typography>;


    return (
        <Box display="flex" flexDirection="column" gap="0.5em" width={"100%"}>
            <Typography variant="caption">Questions Details</Typography>
            {Object.entries(questions).map(([status, count]: any) => (
                <Box key={status}>
                    <Link to={buildQuestionsLink({ status })}>
                        <Typography variant="body1">
                            {humanize(status)} – ({count})
                        </Typography>
                    </Link>
                </Box>
            ))}
        </Box>
    );
};
