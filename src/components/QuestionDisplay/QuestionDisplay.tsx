import * as React from "react";
import { useState } from "react";
import {
    Box,
    Stack,
    Grid,
    Typography,
    Chip,
    Divider,
    IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { RenderStream, RenderMath, wrapMathFracWithDollar } from "./RenderStream";
import { QuestionDisplayProps, ContentBlock, getEligibleMarks } from "./types";

const parseOptions = (
    question: QuestionDisplayProps["question"]
): Record<string, string> | null => {
    if (question.options) {
        if (typeof question.options === "string") {
            try {
                return JSON.parse(question.options);
            } catch {
                return null;
            }
        }
        return question.options;
    }
    
    const opts: Record<string, string> = {};
    if (question.option_a) opts["A"] = question.option_a;
    if (question.option_b) opts["B"] = question.option_b;
    if (question.option_c) opts["C"] = question.option_c;
    if (question.option_d) opts["D"] = question.option_d;
    return Object.keys(opts).length > 0 ? opts : null;
};

const getQuestionContent = (
    question: QuestionDisplayProps["question"]
): ContentBlock[] | string => {
    if (question.question_stream) return question.question_stream;
    if (question.question_html) return question.question_html;
    return [];
};

const getSolutionContent = (
    question: QuestionDisplayProps["question"]
): ContentBlock[] | string | null => {
    if (question.answer_stream) return question.answer_stream;
    if (question.solution_html) return question.solution_html;
    return null;
};

const getHintContent = (
    question: QuestionDisplayProps["question"]
): string | null => {
    return question.hint || question.hint_html || null;
};

const getCorrectAnswer = (question: QuestionDisplayProps["question"]): string | null => {
    return question.correct_option || question.correct_answer || null;
};

const getFinalAnswer = (question: QuestionDisplayProps["question"]): string | null => {
    return question.final_answer || question.correct_answer || question.correct_option || null;
};

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
    question,
    mode = "view",
    selectedAnswer,
    marksObtained,
    onAnswer,
    showSolution: showSolutionProp = false,
    showHint: showHintProp = false,
    showCorrectAnswer = false,
    allowHint = false,
    allowSolution = false,
    showDifficulty = true,
    compact = false,
}) => {
    const theme = useTheme();
    const [hintVisible, setHintVisible] = useState(false);
    const [solutionVisible, setSolutionVisible] = useState(false);

    const showHint = allowHint ? hintVisible : showHintProp;
    const showSolution = allowSolution ? solutionVisible : showSolutionProp;

    const options = parseOptions(question);
    const correctAnswer = getCorrectAnswer(question);
    const isInteractive = mode === "interactive";
    const isReview = mode === "review";
    const shouldHighlightCorrect = isReview && showCorrectAnswer;
    const isMCQ = question.type === "MCQ";
    const eligibleMarks = getEligibleMarks(question.type, question.marks_number);
    const hasHint = Boolean(getHintContent(question));
    const hasSolution = Boolean(getSolutionContent(question));

    return (
        <Stack spacing={compact ? 0.75 : 1}>
            {/* Metadata row */}
            <Stack direction="row" spacing={1} alignItems="center">
                {showDifficulty && question.difficulty && (
                    <Chip
                        label={question.difficulty}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                )}
                {eligibleMarks > 0 && (
                    <Chip
                        label={`${eligibleMarks} Mark${eligibleMarks > 1 ? 's' : ''}`}
                        size="small"
                        variant="outlined"
                    />
                )}
                <Box sx={{ flex: 1 }} />
                {allowHint && hasHint && (
                    <IconButton
                        size="small"
                        color="warning"
                        onClick={() => setHintVisible(v => !v)}
                        sx={{ border: `1px solid ${theme.palette.warning.main}`, borderRadius: 1, px: 1 }}
                    >
                        <LightbulbOutlinedIcon fontSize="small" />
                        <Typography variant="body2" fontWeight={600} sx={{ ml: 0.5 }}>
                            {hintVisible ? "Hide Hint" : "Hint"}
                        </Typography>
                    </IconButton>
                )}
                {allowSolution && hasSolution && (
                    <IconButton
                        size="small"
                        color="success"
                        onClick={() => setSolutionVisible(v => !v)}
                        sx={{ border: `1px solid ${theme.palette.success.main}`, borderRadius: 1, px: 1 }}
                    >
                        <CheckCircleOutlineIcon fontSize="small" />
                        <Typography variant="body2" fontWeight={600} sx={{ ml: 0.5 }}>
                            {solutionVisible ? "Hide Solution" : "Solution"}
                        </Typography>
                    </IconButton>
                )}
            </Stack>

            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {question.type} Question
            </Typography>
            <Divider />

            <Box>
                <RenderStream stream={getQuestionContent(question)} />
            </Box>

            {options && (
                <Grid container spacing={1}>
                    {Object.entries(options).map(([key, value]) => {
                        const isSelected = selectedAnswer === key;
                        const isCorrect = key === correctAnswer;
                        const highlightCorrect = shouldHighlightCorrect && isCorrect;

                        let borderColor = theme.palette.divider;
                        let bgColor = "transparent";

                        if (isInteractive && isSelected) {
                            borderColor = theme.palette.primary.main;
                            bgColor = theme.palette.info.light;
                        } else if (highlightCorrect) {
                            borderColor = theme.palette.success.main;
                            bgColor = theme.palette.success.light;
                        }

                        return (
                            <Grid item xs={12} sm={6} key={key}>
                                <Box
                                    onClick={
                                        isInteractive && onAnswer
                                            ? () => {
                                                const isCorrect = key === correctAnswer;
                                                onAnswer({
                                                    selectedOption: key,
                                                    marksObtained: isCorrect ? eligibleMarks : 0,
                                                });
                                            }
                                            : undefined
                                    }
                                    sx={{
                                        cursor: isInteractive ? "pointer" : "default",
                                        borderRadius: 1,
                                        p: compact ? 0.5 : 0.75,
                                        border: `${isInteractive ? 2 : 1}px solid ${borderColor}`,
                                        backgroundColor: bgColor,
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
                                            fontWeight={600}
                                            sx={{ lineHeight: 1.6, whiteSpace: "nowrap" }}
                                        >
                                            {key}.
                                        </Typography>
                                        <Box sx={{ flex: 1 }}>
                                            <RenderMath content={value} />
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {!isMCQ && eligibleMarks > 0 && (marksObtained !== undefined || onAnswer) && (
                <Box
                    sx={{
                        border: `1px dashed ${theme.palette.divider}`,
                        borderRadius: 1,
                        p: 1,
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="body2" fontWeight={600}>
                            Marks Obtained:
                        </Typography>
                        {onAnswer ? (
                            <input
                                type="number"
                                min={0}
                                max={eligibleMarks}
                                value={marksObtained ?? ""}
                                onChange={(e) => {
                                    let value = Number(e.target.value);
                                    if (value < 0) value = 0;
                                    if (value > eligibleMarks) value = eligibleMarks;
                                    onAnswer({ marksObtained: value });
                                }}
                                style={{
                                    width: "4rem",
                                    padding: "4px",
                                    borderRadius: "4px",
                                    border: "1px solid #ccc",
                                }}
                            />
                        ) : (
                            <Typography variant="body2">
                                {marksObtained} / {eligibleMarks}
                            </Typography>
                        )}
                    </Stack>
                </Box>
            )}

            {showHint && getHintContent(question) && (
                <Box
                    sx={{
                        backgroundColor: theme.palette.warning.light,
                        borderRadius: 1,
                        p: 0.75,
                    }}
                >
                    <Typography variant="caption" fontWeight={600}>
                        Hint
                    </Typography>
                    <RenderMath content={wrapMathFracWithDollar(getHintContent(question))!} preventDollarWrap/>
                </Box>
            )}

            {showSolution && getSolutionContent(question) && (
                <Box
                    sx={{
                        backgroundColor: theme.palette.success.light,
                        borderRadius: 1.5,
                        p: 1,
                    }}
                >
                    <Typography variant="caption" fontWeight={600} gutterBottom>
                        Solution
                    </Typography>
                    <RenderStream stream={getSolutionContent(question)!} />

                    {getFinalAnswer(question) && (
                        <Box
                            sx={{
                                mt: 1,
                                p: 0.75,
                                borderRadius: 1,
                                backgroundColor: theme.palette.success.main,
                                color: theme.palette.success.contrastText,
                                textAlign: "center",
                                fontSize: "0.875rem",
                            }}
                        >
                            <strong>Answer:</strong>{" "}
                            <RenderMath content={wrapMathFracWithDollar(getFinalAnswer(question))!} preventDollarWrap/>
                        </Box>
                    )}
                </Box>
            )}
        </Stack>
    );
};
