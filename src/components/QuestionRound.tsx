import * as React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import {
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    Stack,
    Divider,
    CircularProgress,
} from "@mui/material";
import {
    QuestionDisplay,
    sortByDifficulty,
    getEligibleMarks,
    type QuestionData,
    type AnswerResult,
    type QuestionRoundProps,
    type QuestionRoundResult,
    type Difficulty,
} from "./QuestionDisplay";

type QuestionWithDifficulty = QuestionData & { difficulty: Difficulty };

export const QuestionRound = <T extends QuestionWithDifficulty>({
    questions,
    title,
    onComplete,
    allowAnswer = false,
    allowHint = false,
    allowSolution = false,
    showCorrectAnswer = false,
}: QuestionRoundProps<T>): React.ReactElement => {
    const sortedQuestions = useMemo(() => sortByDifficulty(questions as QuestionWithDifficulty[]) as T[], [questions]);

    const [index, setIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answersMap, setAnswersMap] = useState<Record<string, AnswerResult>>({});
    const [timeMap, setTimeMap] = useState<Record<string, number>>({});

    const startedAtRef = useRef<string>(new Date().toISOString());
    const questionStartRef = useRef<number>(Date.now());

    const question = sortedQuestions[index];
    const isLastQuestion = index === sortedQuestions.length - 1;

    useEffect(() => {
        questionStartRef.current = Date.now();
    }, [index]);

    const saveCurrentQuestionTime = () => {
        const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000);
        setTimeMap(prev => ({
            ...prev,
            [question.id]: (prev[question.id] ?? 0) + elapsed,
        }));
    };

    const handleNext = () => {
        saveCurrentQuestionTime();
        setIndex(i => i + 1);
    };

    const handleBack = () => {
        saveCurrentQuestionTime();
        setIndex(i => i - 1);
    };

    const handleSubmit = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        saveCurrentQuestionTime();

        const completedAt = new Date().toISOString();
        const startTime = new Date(startedAtRef.current).getTime();
        const endTime = new Date(completedAt).getTime();

        const result: QuestionRoundResult = {
            answers: answersMap,
            timing: {
                startedAt: startedAtRef.current,
                completedAt,
                totalSeconds: Math.floor((endTime - startTime) / 1000),
                perQuestion: { ...timeMap },
            },
        };

        onComplete(result);
    };

    const handleAnswer = (result: AnswerResult) => {
        setAnswersMap(prev => ({
            ...prev,
            [question.id]: {
                selectedOption: result.selectedOption ?? prev[question.id]?.selectedOption,
                marksObtained: result.marksObtained,
            },
        }));
    };

    const canProceed = () => {
        if (!allowAnswer) return true;
        const entry = answersMap[question.id];
        if (!entry) return false;
        if (question.type === 'MCQ') return Boolean(entry.selectedOption);
        const eligible = getEligibleMarks(question.type, question.marks_number);
        return entry.marksObtained >= 0 && entry.marksObtained <= eligible;
    };

    const mode = allowAnswer ? "interactive" : "review";

    return (
        <Box sx={{ maxWidth: "52rem", mx: "auto", py: 2 }}>
            <Stack spacing={1.5}>
                <Typography variant="h6" align="center" fontWeight={600}>
                    {title}
                </Typography>

                <Card elevation={1} sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.5 }}>
                        <Stack spacing={1}>
                            <Stack direction="row" justifyContent="flex-end">
                                <Typography variant="caption">
                                    {index + 1} / {sortedQuestions.length}
                                </Typography>
                            </Stack>

                            <Divider />

                            <QuestionDisplay
                                question={question}
                                mode={mode}
                                showDifficulty={false}
                                allowHint={allowHint}
                                allowSolution={allowSolution}
                                showCorrectAnswer={showCorrectAnswer}
                                selectedAnswer={answersMap[question.id]?.selectedOption}
                                marksObtained={answersMap[question.id]?.marksObtained}
                                onAnswer={allowAnswer ? handleAnswer : undefined}
                            />
                        </Stack>
                    </CardContent>
                </Card>

                <Stack direction="row" justifyContent="space-between">
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={index === 0}
                        onClick={handleBack}
                    >
                        Back
                    </Button>

                    {isLastQuestion ? (
                        <Button
                            size="small"
                            variant="contained"
                            color="success"
                            disabled={!canProceed() || isSubmitting}
                            onClick={handleSubmit}
                            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    ) : (
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={!canProceed()}
                            onClick={handleNext}
                        >
                            Next
                        </Button>
                    )}
                </Stack>

                {allowAnswer && !canProceed() && (
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        align="center"
                    >
                        Please answer the question to continue
                    </Typography>
                )}
            </Stack>
        </Box>
    );
};
