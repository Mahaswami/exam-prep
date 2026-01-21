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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import IconButton from "@mui/material/IconButton";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";



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
    conceptName: string;
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

export const RevisionRound: React.FC<Props> = ({ questions,
                                                   id: revisionRoundId,
                                                   chapterName, conceptName, onComplete }) => {
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
    const [viewedMap, setViewedMap] = useState<Record<string, number>>({});
    const question = sortedQuestions[index];
    React.useEffect(() => {
        if (!question) return;

        setViewedMap(prev => ({
            ...prev,
            [question.id]: prev[question.id] ?? new Date().toISOString(),
        }));
    }, [index, question]);

    const resetState = () => {
        setShowHint(false);
        setShowSolution(false);
    };

    const handleFinish = () => {
        const payload = {
            revision_round_id: revisionRoundId,
            revision_round_details: Object.entries(viewedMap).map(
                ([questionId, viewed_timestamp]) => ({
                    questionId,
                    viewed_timestamp,
                })
            ),
        };

        onComplete(payload);
    };

    return (
        <Box sx={{ maxWidth: "52rem", mx: "auto", py: 2 }}>
            <Stack spacing={1.5}>
                <Typography variant="h6" align="center" fontWeight={600}>
                    Revision - {chapterName} - {conceptName}
                </Typography>

                <Card elevation={1} sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.5 }}>
                        <Stack spacing={1}>
                            {/* Meta */}
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Chip
                                    label={question.difficulty}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
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
                                    Question
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
                                        const isCorrect = showSolution && key === question.correct_option;
                                        return (
                                        <Grid item xs={12} sm={6} key={key}>
                                            <Box
                                                sx={{
                                                    borderRadius: 1,
                                                    p: 0.75,
                                                    border: `1px solid ${
                                                        isCorrect
                                                            ? theme.palette.success.main
                                                            : theme.palette.divider
                                                    }`,
                                                    backgroundColor: isCorrect
                                                        ? theme.palette.success.light
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
                                                            {"$$" + value + "$$"}
                                                        </ReactMarkdown>
                                                    </Box>
                                                </Box>

                                            </Box>
                                        </Grid>)
                                    }
                                    )}
                                </Grid>
                            )}

                            {/* Actions */}
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                {/* <IconButton
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
                                </IconButton> */}

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
                            {/* {showHint && (
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
                            )} */}

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
                                        >{question.final_answer}
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
                            onClick={handleFinish}
                        >
                            Finish Practice
                        </Button>
                    ) : (
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                                setIndex(i => i + 1);
                                resetState();
                            }}
                        >
                            Next
                        </Button>
                    )}
                </Stack>
            </Stack>
        </Box>
    );
};
