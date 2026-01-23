import * as React from "react";
import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Stack,
    Chip,
    CircularProgress,
} from "@mui/material";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import { useDataProvider, useRecordContext, usePermissions } from "react-admin";
import { RelativeDateField } from "@mahaswami/swan-frontend";
import { QuestionRound } from "./QuestionRound";
import { type QuestionData, type AnswerResult, type Difficulty } from "./QuestionDisplay";
import { ComfortLevelWithTrend } from "./ComfortLevelChip";

type RoundType = 'diagnostic' | 'revision' | 'test';

type RoundConfig = {
    detailResource: string;
    masterIdField: string;
    answerField: string | null;
    timeField: string;
    correctnessField: string | null;
    marksField: string | null;
    allowSolution: boolean;
    showCorrectAnswer: boolean;
    showUserAnswers: boolean;
};

const ROUND_CONFIG: Record<RoundType, RoundConfig> = {
    diagnostic: {
        detailResource: 'diagnostic_test_details',
        masterIdField: 'diagnostic_test_id',
        answerField: 'selected_answer',
        timeField: 'time_taken_seconds_number',
        correctnessField: 'is_correct',
        marksField: null,
        allowSolution: true,
        showCorrectAnswer: true,
        showUserAnswers: true,
    },
    revision: {
        detailResource: 'revision_round_details',
        masterIdField: 'revision_round_id',
        answerField: null,
        timeField: 'time_viewed_seconds_number',
        correctnessField: null,
        marksField: null,
        allowSolution: true,
        showCorrectAnswer: false,
        showUserAnswers: false,
    },
    test: {
        detailResource: 'test_round_details',
        masterIdField: 'test_round_id',
        answerField: 'selected_answer',
        timeField: 'time_taken_seconds_number',
        correctnessField: 'is_correct',
        marksField: 'marks_obtained',
        allowSolution: true,
        showCorrectAnswer: true,
        showUserAnswers: true,
    },
};

const formatTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
};

const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
};

type SummaryBarProps = {
    roundType: RoundType;
    record: any;
    totalQuestions: number;
    correctCount: number;
    isStudent: boolean;
};

const SummaryBar: React.FC<SummaryBarProps> = ({ roundType, record, totalQuestions, correctCount, isStudent }) => {
    const totalTimeField = roundType === 'diagnostic' 
        ? 'total_time_taken_seconds_number' 
        : 'total_time_seconds_number';
    
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const percentColor = percentage >= 70 ? 'success' : percentage >= 40 ? 'warning' : 'error';
    
    const conceptName = roundType === 'diagnostic' 
        ? record.chapter?.name 
        : record.concept?.name;
    
    return (
        <Box sx={{ 
            bgcolor: 'background.paper', 
            borderRadius: 1.5, 
            px: 2, 
            py: 1.5,
            border: '1px solid',
            borderColor: 'divider',
        }}>
            <Stack 
                direction="row" 
                alignItems="center" 
                justifyContent="space-between"
                flexWrap="wrap"
                gap={1}
            >
                <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
                    {conceptName && (
                        <Typography variant="subtitle1" fontWeight={600}>{conceptName}</Typography>
                    )}
                    
                    {(roundType === 'revision' || roundType === 'test') && (
                        <Chip label={`#${record.round_number}`} size="small" variant="outlined" />
                    )}
                    
                    <RelativeDateField 
                        source={record.completed_timestamp ? 'completed_timestamp' : 'started_timestamp'} 
                        color="text.secondary"
                    />
                </Stack>
                
                <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
                    {(roundType === 'diagnostic' || roundType === 'test') && (
                        <>
                            <Chip 
                                label={`${correctCount}/${totalQuestions}`}
                                size="small"
                                color={percentColor}
                                variant="filled"
                                title={`${correctCount} of ${totalQuestions} correct`}
                            />
                            {roundType === 'test' && (
                                <Chip 
                                    label={`${record.marks_obtained_number ?? 0}/${record.total_marks_number ?? 0}`}
                                    size="small"
                                    variant="outlined"
                                    title={`${record.marks_obtained_number ?? 0} of ${record.total_marks_number ?? 0} marks`}
                                />
                            )}
                        </>
                    )}
                    
                    {roundType === 'test' && record.comfort_score && (
                        <ComfortLevelWithTrend 
                            previousSource="previous_comfort_score" 
                            currentSource="comfort_score" 
                        />
                    )}
                    
                    <Chip 
                        label={formatTime(record[totalTimeField])}
                        size="small"
                        variant="outlined"
                        icon={<TimerOutlinedIcon sx={{ fontSize: 16 }} />}
                    />
                </Stack>
            </Stack>
        </Box>
    );
};

type QuestionWithDetails = QuestionData & { 
    difficulty: Difficulty;
};

export type RoundReviewContentProps = {
    roundType: RoundType;
};

export const RoundReviewContent: React.FC<RoundReviewContentProps> = ({ roundType }) => {
    const record = useRecordContext();
    const dataProvider = useDataProvider();
    const { permissions } = usePermissions();
    const isStudent = permissions === 'student';
    
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
    const [initialAnswers, setInitialAnswers] = useState<Record<string, AnswerResult>>({});
    const [initialTiming, setInitialTiming] = useState<Record<string, number>>({});
    const [questionCorrectness, setQuestionCorrectness] = useState<Record<string, boolean>>({});
    const [correctCount, setCorrectCount] = useState(0);

    const config = ROUND_CONFIG[roundType];

    useEffect(() => {
        if (!record?.id) return;

        const fetchDetails = async () => {
            setLoading(true);
            try {
                const { data: details } = await dataProvider.getList(config.detailResource, {
                    pagination: { page: 1, perPage: 1000 },
                    sort: { field: 'id', order: 'ASC' },
                    filter: { [config.masterIdField]: record.id },
                    meta: { prefetch: ['questions'] },
                });

                const questionsArr: QuestionWithDetails[] = [];
                const answers: Record<string, AnswerResult> = {};
                const timing: Record<string, number> = {};
                const correctness: Record<string, boolean> = {};
                let correct = 0;

                for (const detail of details) {
                    const question = detail.question;
                    if (!question) continue;

                    questionsArr.push({
                        ...question,
                        difficulty: question.difficulty || 'Medium',
                    });

                    if (config.answerField && detail[config.answerField]) {
                        answers[question.id] = {
                            selectedOption: detail[config.answerField],
                            marksObtained: config.marksField ? detail[config.marksField] ?? 0 : 0,
                        };
                    }

                    if (config.timeField && detail[config.timeField] !== undefined) {
                        timing[question.id] = detail[config.timeField];
                    }

                    if (config.correctnessField && detail[config.correctnessField] !== undefined) {
                        correctness[question.id] = Boolean(detail[config.correctnessField]);
                        if (detail[config.correctnessField]) correct++;
                    }
                }

                setQuestions(questionsArr);
                setInitialAnswers(answers);
                setInitialTiming(timing);
                setQuestionCorrectness(correctness);
                setCorrectCount(correct);
            } catch (error) {
                console.error('Error fetching round details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [record?.id, dataProvider, config]);

    if (!record) return null;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (questions.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No questions found for this round.</Typography>
            </Box>
        );
    }

    const title = roundType === 'diagnostic'
        ? `Diagnostic Test - ${record.chapter?.name || 'Review'}`
        : roundType === 'revision'
        ? `Revision - ${record.concept?.name || 'Review'}`
        : `Test Round - ${record.concept?.name || 'Review'}`;

    return (
        <Box sx={{ maxWidth: '56rem', mx: 'auto', px: 2, py: 1 }}>
            <SummaryBar
                roundType={roundType}
                record={record}
                totalQuestions={questions.length}
                correctCount={correctCount}
                isStudent={isStudent}
            />
            
            <QuestionRound
                key={`${record.id}-${questions.length}`}
                questions={questions}
                title={title}
                allowHint
                allowSolution={config.allowSolution}
                showCorrectAnswer={config.showCorrectAnswer}
                initialAnswers={config.showUserAnswers ? initialAnswers : undefined}
                initialTiming={initialTiming}
                questionCorrectness={config.showUserAnswers ? questionCorrectness : undefined}
                userName={!isStudent ? (record.user?.name || record.user?.email) : undefined}
            />
        </Box>
    );
};
