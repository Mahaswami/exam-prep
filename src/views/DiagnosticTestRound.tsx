import * as React from "react";
import { useState, useMemo, useEffect, useRef } from "react";
import {
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    Stack,
    Divider,
    Grid,
    CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

/* ---------- Types ---------- */

type ContentBlock = {
    type: "text" | "svg";
    content?: string;
    data?: string;
    id?: string;
};

type Question = {
    id: string;
    concept_id: string;
    difficulty: "Easy" | "Medium" | "Hard";
    question_stream: ContentBlock[];
    options: Record<string, string> | null;
    correct_option: string;
};

type Props = {
    questions: Question[];
    chapterName: string;
    onComplete: (result: any) => void;
};

/* ---------- Helpers ---------- */

const difficultyOrder: Record<string, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
};

export const RenderStream: React.FC<{ stream: ContentBlock[] }> = ({ stream }) => (
    <Stack spacing={0.75}>
        {stream.map((block, idx) => {
            if (block.type === "svg" && block.data) {
                return (
                    <Box
                        key={block.id || idx}
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            p: 0.5,
                            borderRadius: 1,
                        }}
                        dangerouslySetInnerHTML={{ __html: block.data }}
                    />
                );
            }

            return (
                <ReactMarkdown
                    key={idx}
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                >
                    {block.content || ""}
                </ReactMarkdown>
            );
        })}
    </Stack>
);

/* ---------- Main Component ---------- */

export const DiagnosticTestRound: React.FC<Props> = ({
                                                     questions,
                                                     chapterName, onComplete
                                                 }) => {
    const theme = useTheme();

    const sortedQuestions = useMemo(
        () =>
            [...questions].sort(
                (a, b) =>
                    difficultyOrder[a.difficulty] -
                    difficultyOrder[b.difficulty]
            ),
        [questions]
    );

    const [index, setIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* ---------- State ---------- */

    const [answers, setAnswers] = useState<
        Record<
            string,
            {
                selected_answer: string | null;
                time_taken: number;
            }
        >
    >({});

    const question = sortedQuestions[index];

    /* ---------- Time Tracking ---------- */

    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        startTimeRef.current = Date.now();
    }, [index]);

    const saveTimeForCurrentQuestion = () => {
        const elapsed =
            Math.floor((Date.now() - startTimeRef.current) / 1000) || 0;

        setAnswers(prev => ({
            ...prev,
            [question.id]: {
                selected_answer:
                    prev[question.id]?.selected_answer ?? null,
                time_taken:
                    (prev[question.id]?.time_taken ?? 0) + elapsed,
            },
        }));
    };

    /* ---------- Option Select ---------- */

    const handleSelectOption = (optionKey: string) => {
        setAnswers(prev => ({
            ...prev,
            [question.id]: {
                selected_answer: optionKey,
                time_taken: prev[question.id]?.time_taken ?? 0,
            },
        }));
    };

    /* ---------- Navigation ---------- */

    const goNext = () => {
        saveTimeForCurrentQuestion();
        setIndex(i => i + 1);
    };

    const goBack = () => {
        saveTimeForCurrentQuestion();
        setIndex(i => i - 1);
    };

    /* ---------- Submit ---------- */

    const handleSubmit = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        saveTimeForCurrentQuestion();

        const payload = sortedQuestions.map(q => {
            const answer = answers[q.id];

            return {
                questionId: q.id,
                conceptId: q.concept_id,
                difficulty: q.difficulty,
                selected_answer: answer?.selected_answer ?? null,
                is_correct:
                    answer?.selected_answer === q.correct_option,
                time_taken: answer?.time_taken ?? 0,
            };
        });

        console.log("SUBMIT PAYLOAD", payload);
        onComplete({diagnosticTestResults:payload});

    };

    const selectedAnswer = answers[question.id]?.selected_answer;
    const isAnswered = Boolean(selectedAnswer);
    return (
        <Box sx={{ maxWidth: "52rem", mx: "auto", py: 2 }}>
            <Stack spacing={1.5}>
                <Typography variant="h6" align="center" fontWeight={600}>
                    Diagnostic Test – {chapterName}
                </Typography>

                <Card elevation={1} sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.5 }}>
                        <Stack spacing={1}>
                            <Stack direction="row" justifyContent="flex-end">
                                <Typography variant="Body2" fontWeight={600}>
                                    {index + 1}/{sortedQuestions.length}
                                </Typography>
                            </Stack>

                            <Divider />

                            {/* Question */}
                            <RenderStream
                                stream={JSON.parse(question.question_stream)}
                            />

                            {/* Options */}
                            {question.options && (
                                <Grid container spacing={1}>
                                    {Object.entries(
                                        JSON.parse(question.options)
                                    ).map(([key, value]) => {
                                        const isSelected =
                                            selectedAnswer === key;

                                        return (
                                            <Grid
                                                item
                                                xs={12}
                                                sm={6}
                                                key={key}
                                            >
                                                <Box
                                                    onClick={() =>
                                                        handleSelectOption(
                                                            key
                                                        )
                                                    }
                                                    sx={{
                                                        cursor: "pointer",
                                                        borderRadius: 1,
                                                        p: 0.75,
                                                        border: `2px solid ${
                                                            isSelected
                                                                ? theme
                                                                    .palette
                                                                    .primary
                                                                    .main
                                                                : theme
                                                                    .palette
                                                                    .divider
                                                        }`,
                                                        backgroundColor:
                                                            isSelected
                                                                ? theme
                                                                    .palette
                                                                    .primary
                                                                    .light
                                                                : "transparent",
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            gap: 0.75,
                                                            alignItems:
                                                                "baseline",
                                                        }}
                                                    >
                                                        <Typography
                                                            fontWeight={600}
                                                        >
                                                            {key}.
                                                        </Typography>
                                                        <ReactMarkdown
                                                            remarkPlugins={[
                                                                remarkMath,
                                                            ]}
                                                            rehypePlugins={[
                                                                rehypeKatex,
                                                            ]}
                                                        >
                                                            {"$$" + value + "$$"}
                                                        </ReactMarkdown>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                {/* Navigation */}
                <Stack direction="row" justifyContent="space-between">
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={index === 0}
                        onClick={goBack}
                    >
                        Back
                    </Button>

                    {index === sortedQuestions.length - 1 ? (
                        <Button
                            size="small"
                            variant="contained"
                            disabled={!isAnswered || isSubmitting}
                            onClick={handleSubmit}
                            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    ) : (
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={!isAnswered}
                            onClick={goNext}
                        >
                            Next
                        </Button>
                    )}
                </Stack>
            </Stack>
        </Box>
    );
};
