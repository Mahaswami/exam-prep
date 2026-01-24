export type ContentBlock = {
    type: "text" | "svg" | "html";
    content?: string;
    data?: string;
    id?: string;
};

export type Difficulty = "Easy" | "Medium" | "Hard";

export const difficultyOrder: Record<Difficulty, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
};

export const sortByDifficulty = <T extends { difficulty: Difficulty }>(questions: T[]): T[] =>
    [...questions].sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);

export const getEligibleMarks = (type: string, marksNumber?: number): number => {
    if (marksNumber) return marksNumber;
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

export type AnswerResult = {
    selectedOption?: string;
    marksObtained: number;
    marksTotal?: number;
};

export type BaseQuestion = {
    id: string;
    type: string;
    difficulty: Difficulty;
    question_stream: string;
    options: string | null;
    correct_option: string;
};

export type FullQuestion = BaseQuestion & {
    hint: string;
    answer_stream: string;
    final_answer: string;
};

export type DiagnosticQuestion = BaseQuestion & {
    type?: string;
    concept_id: string;
};

export type QuestionData = {
    id: string;
    concept_id?: string;
    type: string;
    difficulty?: Difficulty;
    question_stream?: string | ContentBlock[];
    question_html?: string;
    options?: string | Record<string, string> | null;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    correct_option?: string;
    correct_answer?: string;
    hint?: string;
    hint_html?: string;
    answer_stream?: string | ContentBlock[];
    solution_html?: string;
    final_answer?: string;
    marks_number?: number;
};

export type QuestionDisplayMode = "view" | "interactive" | "review";

export type QuestionDisplayProps = {
    question: QuestionData;
    mode?: QuestionDisplayMode;
    
    selectedAnswer?: string | null;
    marksObtained?: number | null;
    onAnswer?: (result: AnswerResult) => void;
    
    showSolution?: boolean;
    showHint?: boolean;
    showCorrectAnswer?: boolean;
    
    allowHint?: boolean;
    allowSolution?: boolean;
    
    showDifficulty?: boolean;
    compact?: boolean;
    
    timeTaken?: number;
    isCorrect?: boolean | null;
    isPartial?: boolean | null;
};

export type QuestionRoundTiming = {
    startedAt: string;
    completedAt: string;
    totalSeconds: number;
    perQuestion: Record<string, number>;
};

export type QuestionRoundResult = {
    answers: Record<string, AnswerResult>;
    timing: QuestionRoundTiming;
};

export type QuestionRoundProps<T extends QuestionData & { difficulty: Difficulty } = QuestionData & { difficulty: Difficulty }> = {
    questions: T[];
    title: string;
    onComplete?: (result: QuestionRoundResult) => void;
    allowAnswer?: boolean;
    allowHint?: boolean;
    allowSolution?: boolean;
    showCorrectAnswer?: boolean;
    initialAnswers?: Record<string, AnswerResult>;
    initialTiming?: Record<string, number>;
    questionCorrectness?: Record<string, boolean>;
    questionPartialness?: Record<string, boolean>;
    userName?: string;
    addConceptName?: boolean;
    submitLabel?: string;
    submitLoadingLabel?: string
};
