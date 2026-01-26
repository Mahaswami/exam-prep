// Question selection parameters - tune based on educational feedback
// Separated from structural config for easier adjustment

export interface DifficultyQuotas {
    Hard: number;
    Medium: number;
    Easy: number;
}

export interface TypeQuotas {
    mcq: number;
    nonMcq: number;
}

export interface RoundSelectionConfig {
    quotas: DifficultyQuotas;
    minSize: number;
    maxSize: number;
    typeQuotas: TypeQuotas;
}

export interface DiagnosticSelectionConfig {
    minSize: number;
    maxSize: number;
    perConceptMinHard: number;
    poolFilter: { type: string; status: string };
}

export const SELECTION_CONFIGS = {
    revision: {
        quotas: { Hard: 1, Medium: 2, Easy: 2 },
        minSize: 6,
        maxSize: 8,
        typeQuotas: { mcq: 2, nonMcq: 3 },  // Favor written answers during learning
    } satisfies RoundSelectionConfig,

    test: {
        quotas: { Hard: 2, Medium: 2, Easy: 2 },
        minSize: 6,
        maxSize: 8,
        typeQuotas: { mcq: 3, nonMcq: 2 },  // Balanced: recognition + recall
    } satisfies RoundSelectionConfig,

    diagnostic: {
        minSize: 8,
        maxSize: 10,
        perConceptMinHard: 1,
        poolFilter: { type: 'MCQ', status: 'active' },
    } satisfies DiagnosticSelectionConfig,
} as const;

export type SelectionConfigType = keyof typeof SELECTION_CONFIGS;
