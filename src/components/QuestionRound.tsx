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

const NavigationDots = ({ 
    questions, 
    currentIndex, 
    correctness,
    partialness,
    onNavigate 
}: { 
    questions: QuestionWithDifficulty[];
    currentIndex: number;
    correctness?: Record<string, boolean>;
    partialness?: Record<string, boolean>;
    onNavigate: (index: number) => void;
}) => (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" justifyContent="center" sx={{ py: 0.5 }}>
        {questions.map((q, i) => {
            const isCorrect = correctness?.[q.id];
            const isPartial = !isCorrect && partialness?.[q.id];
            const isCurrent = i === currentIndex;
            
            return (
                <Box
                    key={q.id}
                    onClick={() => onNavigate(i)}
                    sx={(theme) => {
                        let bgColor = theme.palette.grey[300];
                        if (isCorrect === true) bgColor = theme.palette.success.main;
                        else if (isPartial === true) bgColor = theme.palette.warning.main;
                        else if (isCorrect === false) bgColor = theme.palette.error.main;
                        
                        return {
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transform: isCurrent ? 'scale(1.15)' : 'scale(1)',
                            boxShadow: isCurrent ? `0 0 0 3px ${theme.palette.primary.main}` : 'none',
                            fontSize: 13,
                            fontWeight: 600,
                            color: isCorrect !== undefined ? 'white' : theme.palette.text.primary,
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            '&:hover': { opacity: 0.85 },
                        };
                    }}
                >
                    {i + 1}
                </Box>
            );
        })}
    </Stack>
);

export const QuestionRound = <T extends QuestionWithDifficulty>({
    questions,
    title,
    onComplete,
    allowAnswer = false,
    allowHint = false,
    allowSolution = false,
    showCorrectAnswer = false,
    initialAnswers,
    initialTiming,
    questionCorrectness,
    questionPartialness,
    userName,
    addConceptName = false,
    submitLabel = "Submit",
    submitLoadingLabel = "Submitting...",
}: QuestionRoundProps<T>): React.ReactElement => {
    const sortedQuestions = useMemo(() => sortByDifficulty(questions as QuestionWithDifficulty[]) as T[], [questions]);
    const isReviewMode = !onComplete;

    const [index, setIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answersMap, setAnswersMap] = useState<Record<string, AnswerResult>>(initialAnswers ?? {});
    const [timeMap, setTimeMap] = useState<Record<string, number>>(initialTiming ?? {});

    const startedAtRef = useRef<string>(new Date().toISOString());
    const questionStartRef = useRef<number>(Date.now());

    const question = sortedQuestions[index];
    const isLastQuestion = index === sortedQuestions.length - 1;

    useEffect(() => {
        questionStartRef.current = Date.now();
    }, [index]);

    const saveCurrentQuestionTime = (): Record<string, number> => {
        if (isReviewMode) return timeMap;
        const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000);
        const updated = {
            ...timeMap,
            [question.id]: (timeMap[question.id] ?? 0) + elapsed,
        };
        setTimeMap(updated);
        return updated;
    };

    const handleNavigate = (newIndex: number) => {
        if (!isReviewMode) saveCurrentQuestionTime();
        setIndex(newIndex);
    };

    const handleNext = () => {
        saveCurrentQuestionTime();
        setIndex(i => i + 1);
    };

    const handleBack = () => {
        saveCurrentQuestionTime();
        setIndex(i => i - 1);
    };

    const handleSubmit = async () => {
        if (isSubmitting || !onComplete) return;
        setIsSubmitting(true);
        const finalTimeMap = saveCurrentQuestionTime();

        const completedAt = new Date().toISOString();
        const startTime = new Date(startedAtRef.current).getTime();
        const endTime = new Date(completedAt).getTime();

        const result: QuestionRoundResult = {
            answers: answersMap,
            timing: {
                startedAt: startedAtRef.current,
                completedAt,
                totalSeconds: Math.floor((endTime - startTime) / 1000),
                perQuestion: finalTimeMap,
            },
        };

        await onComplete(result);
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
    const currentCorrectness = questionCorrectness?.[question.id];
    const currentTimeTaken = timeMap[question.id] ?? initialTiming?.[question.id];

    return (
        <Box sx={{ width: '100%', maxWidth: '56rem', mx: 'auto', py: 1 }}>
            <Card elevation={1} sx={{ borderRadius: 2 }}>
                {/* Header with navigation dots */}
                <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                    {isReviewMode && questionCorrectness ? (
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            {userName && (
                                <Typography variant="body2" fontWeight={500} color="text.secondary">
                                    {userName}
                                </Typography>
                            )}
                            <Box sx={{ flex: 1, display: 'flex', justifyContent: userName ? 'flex-end' : 'center' }}>
                                <NavigationDots
                                    questions={sortedQuestions}
                                    partialness={questionPartialness}
                                    currentIndex={index}
                                    correctness={questionCorrectness}
                                    onNavigate={handleNavigate}
                                />
                            </Box>
                        </Stack>
                    ) : (
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                                {title} {addConceptName && ` - ${question?.concept?.name}`}
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="text.secondary">
                                {index + 1} / {sortedQuestions.length}
                            </Typography>
                        </Stack>
                    )}
                </Box>
                
                <Divider />
                
                {/* Question content */}
                <CardContent sx={{ px: 2, py: 1.5 }}>
                    <QuestionDisplay
                        question={question}
                        key={question.id}
                        mode={mode}
                        allowHint={allowHint}
                        allowSolution={allowSolution}
                        showCorrectAnswer={showCorrectAnswer}
                        selectedAnswer={answersMap[question.id]?.selectedOption}
                        marksObtained={answersMap[question.id]?.marksObtained}
                        onAnswer={allowAnswer ? handleAnswer : undefined}
                        timeTaken={currentTimeTaken}
                        isCorrect={currentCorrectness}
                        isPartial={questionPartialness?.[question.id]}
                    />
                    
                </CardContent>
                
                {/* Footer with navigation */}
                <Divider />
                <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
                    <Stack direction="row" justifyContent="space-between">
                        <Button
                            size="small"
                            variant="text"
                            disabled={index === 0}
                            onClick={handleBack}
                        >
                            ← Back
                        </Button>
                        {allowAnswer && !canProceed() && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                align="center"
                                sx={{ mt: 1 }}
                            >
                                Please answer the question to continue
                            </Typography>
                        )}
                        {isReviewMode ? (
                            <Button
                                size="small"
                                variant="text"
                                disabled={isLastQuestion}
                                onClick={handleNext}
                            >
                                Next →
                            </Button>
                        ) : isLastQuestion ? (
                            <Button
                                size="small"
                                variant="contained"
                                color="success"
                                disabled={!canProceed() || isSubmitting}
                                onClick={handleSubmit}
                                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                            >
                                {isSubmitting ? submitLoadingLabel : submitLabel}
                            </Button>
                        ) : (
                            <Button
                                size="small"
                                variant="text"
                                disabled={!canProceed()}
                                onClick={handleNext}
                            >
                                Next →
                            </Button>
                        )}
                    </Stack>
                </Box>
            </Card>
        </Box>
    );
};
