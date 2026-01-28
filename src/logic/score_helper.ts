type Difficulty = "Easy" | "Medium" | "Hard";

type TestResult = {
    conceptId: string;
    difficulty: "Easy" | "Medium" | "Hard";
    is_correct?: boolean | string;
    eligible_marks?: number;
    marks_obtained?: number;
}
const WEIGHT: Record<Difficulty, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
};

const getScore = (pct: number) =>
    pct >= 75 ? "very_good" : pct >= 50 ? "good" : "needs_improvement";

export const calculateConceptScores = (
    responses: TestResult[]
) => {
    const grouped: Record<
        string,
        { total: number; weightedCorrect: number }
    > = {};

    for (const r of responses) {
        const weight = WEIGHT[r.difficulty];

        if (!grouped[r.conceptId]) {
            grouped[r.conceptId] = {
                total: 0,
                weightedCorrect: 0,
            };
        }

        grouped[r.conceptId].total += weight;
        // CASE 1: Test rounds (marks-based, preferred)
        if (
            typeof r.eligible_marks === 'number' &&
            typeof r.marks_obtained === 'number' &&
            r.eligible_marks > 0
        ) {
            const ratio = r.marks_obtained / r.eligible_marks;

            grouped[r.conceptId].weightedCorrect += ratio * weight;
        }

        // CASE 2: Diagnostic rounds (boolean correctness)
        else if (r.is_correct !== undefined && r.is_correct !== null) {
            const correct = r.is_correct === true || r.is_correct === 'TRUE' || r.is_correct === 'true';
            grouped[r.conceptId].weightedCorrect += correct ? weight : 0;
        }
    }

    return Object.entries(grouped).map(([conceptId, data]) => {
        const percentage = Math.round(
            (data.weightedCorrect / data.total) * 100
        );

        return {
            conceptId: Number(conceptId),
            score: getScore(percentage),
        };
    });
};
