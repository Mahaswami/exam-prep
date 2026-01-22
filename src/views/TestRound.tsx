import * as React from "react";
import { useState, useMemo } from "react";
import {
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
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
import IconButton from "@mui/material/IconButton";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {DateField} from "react-admin";


/* ---------- Types ---------- */

type ContentBlock = {
    type: "text" | "svg";
    content?: string;
    data?: string;
    id?: string;
};

type Question = {
    id: string;
    type: string;
    difficulty: "Easy" | "Medium" | "Hard";
    question_stream: ContentBlock[];
    options: Record<string, string> | null;
    correct_option: string;
    hint: string;
    answer_stream: ContentBlock[];
    final_answer: string;
};

type Props = {
    questions: Question[];
    id: string; // revision round id
    chapterName: string;
    onComplete: (result: any) => void;
};

/* ---------- Helpers ---------- */

const difficultyOrder: Record<string, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
};

const RenderStream: React.FC<{ stream: ContentBlock[] }> = ({ stream }) => (
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
                            backgroundColor: "background.paper",
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

export const TestRound: React.FC<Props> = ({ questions,
                                                   id: testRoundId,
                                                   chapterName, onComplete }) => {
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
    const [showHint, setShowHint] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [viewedMap, setViewedMap] = useState<
        Record<
            string,
            {
                eligible_marks: number;
                marks_obtained: number | null;
                selected_option?: string;
                difficulty: "Easy" | "Medium" | "Hard";
            }
        >
    >({});
    const question = sortedQuestions[index];

    const getEligibleMarks = (type: string) => {
        switch (type) {
            case 'MCQ': return 1;
            case '2M': return 2;
            case '3M': return 3;
            case '5M': return 5;
            case 'VSA': return 2;
            case 'SA': return 3;
            case 'Case-Based': return 4;     
            case 'LA': return 5;            
            default: return 0;
        }
    };
    React.useEffect(() => {
        if (!question) return;

        setViewedMap(prev => ({
            ...prev,
            [question.id]: prev[question.id] ?? {
                eligible_marks: getEligibleMarks(question.type),
                marks_obtained: null,
                difficulty: question.difficulty
            },
        }));
    }, [index, question]);

    const resetState = () => {
        setShowHint(false);
        setShowSolution(false);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const payload = {
            test_round_id: testRoundId,
            test_round_details: Object.entries(viewedMap).map(
                ([questionId, data]) => ({
                    question_id: questionId,
                    eligible_marks: data.eligible_marks,
                    marks_obtained: data.marks_obtained,
                    difficulty: data.difficulty,
                })
            ),
        };

        onComplete(payload);
    };

    const isAnswered = () => {
        const entry = viewedMap[question.id];

        if (!entry) return false;

        if (question.type === 'MCQ') {
            return Boolean(entry.selected_option);
        }

        return (
            entry.marks_obtained !== null &&
            entry.marks_obtained >= 0 &&
            entry.marks_obtained <= entry.eligible_marks
        );
    };
    return (
        <Box sx={{ maxWidth: "52rem", mx: "auto", py: 2 }}>
            <Stack spacing={1.5}>
                <Typography variant="h6" align="center" fontWeight={600}>
                    Test Round - {chapterName}
                </Typography>

                <Card elevation={1} sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.5 }}>
                        <Stack spacing={1}>
                            {/* Meta */}
                            <Stack
                                direction="row"
                                justifyContent="center"
                                alignItems="center"
                            >
                               {/* <Chip
                                    label={question.difficulty}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />*/}
                                <Typography variant="caption">
                                    {index + 1} / {sortedQuestions.length}
                                </Typography>
                            </Stack>

                            <Divider />

                            {/* Question */}
                            <Box>
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={600}
                                    gutterBottom
                                >
                                    {question.type} Question
                                </Typography>
                                <RenderStream
                                    stream={JSON.parse(question.question_stream)}
                                />
                            </Box>

                            {/* Options – Two Column */}
                            {question.type === 'MCQ' && question.options && (
                                <Grid container spacing={1}>
                                    {Object.entries(
                                        JSON.parse(question.options)
                                    ).map(([key, value]) => {
                                            const isSelected = viewedMap[question.id]?.selected_option === key;
                                            const isCorrect =
                                                isSelected && key === question.correct_option;
                                        return (
                                        <Grid item xs={12} sm={6} key={key}>
                                            <Box
                                                onClick={() => {
                                                    if (question.type !== 'MCQ') return;

                                                    const eligible = viewedMap[question.id]?.eligible_marks ?? 0;
                                                    const isCorrect = key === question.correct_option;

                                                    setViewedMap(prev => ({
                                                        ...prev,
                                                        [question.id]: {
                                                            ...prev[question.id],
                                                            selected_option: key,
                                                            marks_obtained: isCorrect ? eligible : 0,
                                                        },
                                                    }));
                                                }}
                                                sx={{
                                                    cursor: "pointer",
                                                    borderRadius: 1,
                                                    p: 0.75,
                                                    border: `1px solid ${
                                                        isCorrect
                                                            ? theme.palette.success.main
                                                            : isSelected
                                                                ? theme.palette.primary.main
                                                                : theme.palette.divider
                                                    }`,
                                                    backgroundColor: isCorrect
                                                        ? theme.palette.success.light
                                                        : isSelected
                                                            ? theme.palette.action.hover
                                                            : "transparent",
                                                    transition: "all 0.2s ease",
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        gap: 0.75,
                                                        alignItems: "baseline",
                                                    }}
                                                >
                                                    <Typography
                                                        variant="Body1"
                                                        fontWeight={600}
                                                        sx={{ lineHeight: 1.6, whiteSpace: "nowrap" }}
                                                    >
                                                       {key}.
                                                    </Typography>

                                                    <Box sx={{ flex: 1 }}>
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkMath]}
                                                            rehypePlugins={[rehypeKatex]}
                                                        >
                                                            {'$$' + value + '$$'}
                                                        </ReactMarkdown>
                                                    </Box>
                                                </Box>

                                            </Box>
                                        </Grid>)
                                    }
                                    )}
                                </Grid>
                            )}
                            {/* Marks */}
                            {question.type !== 'MCQ' && (<>
                            <Box
                                sx={{
                                    border: `1px dashed ${theme.palette.divider}`,
                                    borderRadius: 1,
                                    p: 1,
                                }}
                            >
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Typography variant="body2" fontWeight={600}>
                                        Maximum Marks:
                                    </Typography>

                                    <Typography variant="body2">
                                        {viewedMap[question.id]?.eligible_marks ?? getEligibleMarks(question.type)}
                                    </Typography>

                                    <Box sx={{ flexGrow: 1 }} />

                                    <Typography variant="body2" fontWeight={600}>
                                        Marks Obtained:
                                    </Typography>

                                    <input
                                        type="number"
                                        min={0}
                                        max={viewedMap[question.id]?.eligible_marks}
                                        value={viewedMap[question.id]?.marks_obtained ?? ""}
                                        onChange={(e) => {
                                            let value = Number(e.target.value);
                                            const max = viewedMap[question.id]?.eligible_marks ?? 0;

                                            // if (Number.isNaN(value)) value = 0;
                                            if (value < 0) value = 0;
                                            if (value > max) value = max;
                                            setViewedMap(prev => ({
                                                ...prev,
                                                [question.id]: {
                                                    ...prev[question.id],
                                                    marks_obtained: value,
                                                },
                                            }));
                                        }}
                                        style={{
                                            width: "4rem",
                                            padding: "4px",
                                            borderRadius: "4px",
                                            border: "1px solid #ccc",
                                        }}
                                    />
                                </Stack>
                            </Box>
                            </>)}

                            {/* Actions */}
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => setShowHint(v => !v)}
                                    sx={{
                                        border: `1px solid ${theme.palette.warning.main}`,
                                        borderRadius: 1,
                                    }}
                                >
                                    <LightbulbOutlinedIcon fontSize="small" />
                                    <Typography variant={"body2"} fontWeight={600}>Show Hint</Typography>
                                </IconButton>

                                <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => setShowSolution(v => !v)}
                                    sx={{
                                        border: `1px solid ${theme.palette.success.main}`,
                                        borderRadius: 1,
                                    }}
                                >
                                    <CheckCircleOutlineIcon fontSize="small" />
                                    <Typography variant={"body2"} fontWeight={600}>Show Solution</Typography>
                                </IconButton>
                            </Stack>


                            {/* Hint */}
                            {showHint && (
                                <Box
                                    sx={{
                                        backgroundColor:
                                        theme.palette.warning.light,
                                        borderRadius: 1,
                                        p: 0.75,
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        fontWeight={600}
                                    >
                                        Hint
                                    </Typography>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {"$$" + question.hint + "$$"}
                                    </ReactMarkdown>
                                </Box>
                            )}

                            {/* Solution */}
                            {showSolution && (
                                <Box
                                    sx={{
                                        backgroundColor:
                                        theme.palette.success.light,
                                        borderRadius: 1.5,
                                        p: 1,
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        fontWeight={600}
                                        gutterBottom
                                    >
                                        Solution
                                    </Typography>

                                    <RenderStream
                                        stream={JSON.parse(
                                            question.answer_stream
                                        )}
                                    />

                                    <Box
                                        sx={{
                                            mt: 1,
                                            p: 0.75,
                                            borderRadius: 1,
                                            backgroundColor:
                                            theme.palette.success.main,
                                            color:
                                            theme.palette.success
                                                .contrastText,
                                            textAlign: "center",
                                            fontSize: "0.875rem",
                                        }}
                                    >
                                        <strong>Answer:</strong>{" "}
                                        <ReactMarkdown
                                            remarkPlugins={[remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                        >
                                        {"$$"+question.final_answer+"$$"}
                                        </ReactMarkdown>
                                    </Box>
                                </Box>
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
                        onClick={() => {
                            setIndex(i => i - 1);
                            resetState();
                        }}
                    >
                        Back
                    </Button>

                    {index === sortedQuestions.length - 1 ? (
                        <Button
                            size="small"
                            variant="contained"
                            color="success"
                            disabled={!isAnswered() || isSubmitting}
                            onClick={handleSubmit}
                            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    ) : (
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={!isAnswered()}
                            onClick={() => {
                                setIndex(i => i + 1);
                                resetState();
                            }}
                        >
                            Next
                        </Button>
                    )}
                </Stack>
                {!isAnswered() && (
                    <Typography
                        variant="Body1"
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
