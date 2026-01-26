// Structural configuration for Revision and Test rounds
// Selection parameters are in selectionConfigs.ts

import { SELECTION_CONFIGS, type DifficultyQuotas, type RoundSelectionConfig } from './selectionConfigs';

export type RoundType = 'revision' | 'test';

export interface RoundConfig {
    // Display
    displayName: string;
    titlePrefix: string;
    
    // Activity tracking
    activityTypeInProgress: string;
    activityTypeComplete: string;
    
    // Resources
    masterResource: string;
    detailResource: string;
    detailForeignKey: string;
    
    // Exclusion rules
    excludeDiagnostic: boolean;
    excludeRevisions: boolean;
    excludeTests: boolean;
    
    // QuestionRound component props
    allowAnswer: boolean;
    allowHint: boolean;
    allowSolution: boolean;
    showCorrectAnswer: boolean;
    submitLabel: string;
    submitLoadingLabel: string;
    
    // Completion behavior
    hasScoring: boolean;
    successMessage: string;
    redirectPath: (masterId: number) => string;
    
    // Link to selection config
    selection: RoundSelectionConfig;
}

export const ROUND_CONFIGS: Record<RoundType, RoundConfig> = {
    revision: {
        displayName: 'Revision Round',
        titlePrefix: 'Revision',
        
        activityTypeInProgress: 'revision_round_in_progress',
        activityTypeComplete: 'revision_round',
        
        masterResource: 'revision_rounds',
        detailResource: 'revision_round_details',
        detailForeignKey: 'revision_round_id',
        
        excludeDiagnostic: false,
        excludeRevisions: true,
        excludeTests: false,
        
        allowAnswer: false,
        allowHint: false,
        allowSolution: true,
        showCorrectAnswer: true,
        submitLabel: 'Finish',
        submitLoadingLabel: 'Finishing...',
        
        hasScoring: false,
        successMessage: 'Revision Completed Successfully',
        redirectPath: (id) => `/revision_rounds/${id}/show`,
        
        selection: SELECTION_CONFIGS.revision,
    },
    test: {
        displayName: 'Test Round',
        titlePrefix: 'Test Round',
        
        activityTypeInProgress: 'test_round_in_progress',
        activityTypeComplete: 'test_round',
        
        masterResource: 'test_rounds',
        detailResource: 'test_round_details',
        detailForeignKey: 'test_round_id',
        
        excludeDiagnostic: true,
        excludeRevisions: true,
        excludeTests: true,
        
        allowAnswer: true,
        allowHint: true,
        allowSolution: true,
        showCorrectAnswer: false,
        submitLabel: 'Submit',
        submitLoadingLabel: 'Submitting...',
        
        hasScoring: true,
        successMessage: 'Test Completed Successfully',
        redirectPath: (id) => `/test_rounds/${id}/show`,
        
        selection: SELECTION_CONFIGS.test,
    },
};

// Fisher-Yates shuffle (unbiased)
export function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export interface Question {
    id: number;
    difficulty: string;
    type?: string;
    [key: string]: any;
}

export function selectQuestions<T extends Question>(
    pool: T[],
    quotas: DifficultyQuotas,
    maxSize: number,
    typeQuotas?: { mcq: number; nonMcq: number }
): T[] {
    let workingPool = pool;
    
    // Type stratification: ensure mix of MCQ and non-MCQ if configured
    if (typeQuotas) {
        const mcqs = shuffle(pool.filter(q => q.type === 'MCQ'));
        const nonMcqs = shuffle(pool.filter(q => q.type !== 'MCQ'));
        
        const selectedMcqs = mcqs.slice(0, typeQuotas.mcq);
        const selectedNonMcqs = nonMcqs.slice(0, typeQuotas.nonMcq);
        const selectedTypeIds = new Set([...selectedMcqs, ...selectedNonMcqs].map(q => q.id));
        
        // Remaining pool for difficulty-based selection
        const remaining = pool.filter(q => !selectedTypeIds.has(q.id));
        workingPool = [...selectedMcqs, ...selectedNonMcqs, ...remaining];
    }

    const byDifficulty: Record<string, T[]> = {
        Easy: shuffle(workingPool.filter(q => q.difficulty === 'Easy')),
        Medium: shuffle(workingPool.filter(q => q.difficulty === 'Medium')),
        Hard: shuffle(workingPool.filter(q => q.difficulty === 'Hard')),
    };

    const selected: T[] = [];
    const selectedIds = new Set<number>();

    // Fill quotas in priority order: Hard → Medium → Easy
    for (const diff of ['Hard', 'Medium', 'Easy'] as const) {
        const quota = quotas[diff];
        for (const q of byDifficulty[diff].slice(0, quota)) {
            selected.push(q);
            selectedIds.add(q.id);
        }
    }

    // Backfill if under maxSize (priority: Hard → Medium → Easy)
    if (selected.length < maxSize) {
        for (const diff of ['Hard', 'Medium', 'Easy']) {
            for (const q of byDifficulty[diff]) {
                if (selected.length >= maxSize) break;
                if (!selectedIds.has(q.id)) {
                    selected.push(q);
                    selectedIds.add(q.id);
                }
            }
            if (selected.length >= maxSize) break;
        }
    }

    return shuffle(selected).slice(0, maxSize);
}
