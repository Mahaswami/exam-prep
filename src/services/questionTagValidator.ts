import { swanAPI } from '@mahaswami/swan-frontend';
import { getEligibleMarks } from '../components/QuestionDisplay';

const GEMINI_MODEL = 'gemini-3-flash-preview';
const CONCURRENCY_LIMIT = 5;
const BATCH_SIZE = 10;

type Question = {
    id: number;
    type: string;
    options: string;
    question_stream: string;
    concept_id: number;
};

type ValidationResult = {
    id: number;
    concept_id: number;
    current_type: string;
    suggested_type: string;
    marks: number;
    has_options: boolean;
    reasoning: string;
};

type AIResponse = {
    response: string;
};

function hasValidOptions(options: any): boolean {
    if (!options) return false;
    if (typeof options !== 'string') return false;
    const trimmed = options.trim().toLowerCase();
    if (!trimmed || trimmed === 'null' || trimmed === '[]' || trimmed === '{}' || trimmed === 'none') return false;
    // Check if it's a valid JSON array with actual content
    try {
        const parsed = JSON.parse(options);
        if (Array.isArray(parsed) && parsed.length >= 2) {
            // Has at least 2 options with content
            const validOpts = parsed.filter(opt => opt && String(opt).trim().length > 0);
            return validOpts.length >= 2;
        }
        if (typeof parsed === 'object' && parsed !== null) {
            // Could be {A: "...", B: "...", C: "...", D: "..."}
            const keys = Object.keys(parsed);
            return keys.length >= 2;
        }
        return false;
    } catch {
        // Not JSON, check if it contains option markers or substantial content
        if (/\b[A-D]\s*[).:]/i.test(options)) return true;
        if (/option\s*[1-4A-D]/i.test(options)) return true;
        // Has substantial content that could be options
        return options.length > 20;
    }
}

const SYSTEM_PROMPT = `You are an expert question type classifier for an Indian board exam preparation system.

QUESTION TYPES:
- "MCQ": Multiple Choice Question with options (A, B, C, D). 1 mark.
- "VSA": Very Short Answer - NO options, 2 marks.
- "SA": Short Answer - NO options, 3 marks.
- "Case-Based": Case-Based question - NO options, 4 marks.
- "LA": Long Answer - NO options, 5 marks.

CRITICAL RULES (follow strictly):
1. If has_valid_options = TRUE → ALWAYS classify as "MCQ"
2. If has_valid_options = FALSE → classify based on current_type (validate it's not MCQ)
3. NEVER classify a question with valid options as anything other than "MCQ"
4. NEVER classify a question without valid options as "MCQ"

CRITICAL CLASSIFICATION RULES:
1. MCQ is ONLY when has_valid_options=true AND options_content contains 4 distinct choices
2. If has_valid_options=false, it CANNOT be MCQ regardless of other factors
3. For non-MCQ questions, keep current type unless it's MCQ without options

IMPORTANT: The "options_content" field shows the actual options data. If it shows "null", empty, or no valid A/B/C/D choices, treat has_valid_options as FALSE.

Respond ONLY with valid JSON:
{
  "results": [
    {
      "id": <question_id>,
      "suggested_type": "MCQ" | "2 Marks" | "3 Marks" | "4 Marks" | "5 Marks",
      "reasoning": "<brief explanation citing marks and options status>"
    }
  ]
}`;

function buildPrompt(questions: Question[]): string {
    const qList = questions.map(q => {
        const hasOptions = hasValidOptions(q.options);
        if (q.type === 'MCQ' && !hasOptions) {
            console.warn(`[Validator] Q${q.id} is MCQ but hasValidOptions=false. options:`, q.options);
        }
        return {
            id: q.id,
            current_type: q.type,
            has_valid_options: hasOptions,
            options_content: q.options ? String(q.options).substring(0, 500) : 'null',
            question_text: (q.question_stream || '').substring(0, 400)
        };
    });
    
    return `Analyze and classify each question based on options:\n\n${JSON.stringify(qList, null, 2)}`;
}

async function callAI(prompt: string): Promise<AIResponse> {
    const response = await swanAPI('generic_ai', {
        systemPrompt: SYSTEM_PROMPT,
        prompt,
        model: GEMINI_MODEL,
        responseFormat: 'json'
    });
    
    return { response: response.response };
}

async function pLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];
    
    for (const task of tasks) {
        const p = Promise.resolve().then(async () => {
            results.push(await task());
        });
        executing.push(p);
        
        if (executing.length >= limit) {
            await Promise.race(executing);
            executing.splice(executing.findIndex(e => e === p), 1);
        }
    }
    
    await Promise.all(executing);
    return results;
}

export type ValidatorProgress = {
    current: number;
    total: number;
    phase: 'fetching' | 'validating' | 'complete';
    questionCount?: number;
};

const TEST_LIMIT = 0; // Set to 100 for testing, 0 to validate all questions

export type ValidatorOptions = {
    questionIds?: number[];
};

export async function validateQuestionTags(
    dataProvider: any,
    onProgress?: (progress: ValidatorProgress) => void,
    options: ValidatorOptions = {}
): Promise<ValidationResult[]> {
    const { questionIds } = options;
    onProgress?.({ current: 0, total: 0, phase: 'fetching' });
    
    let allQuestions: Question[];
    
    if (questionIds && questionIds.length > 0) {
        const { data } = await dataProvider.getMany('questions', { ids: questionIds });
        allQuestions = data;
    } else {
        const { data } = await dataProvider.getList('questions', {
            pagination: { page: 1, perPage: TEST_LIMIT || 10000 },
            sort: { field: 'id', order: 'ASC' },
            filter: {}
        });
        allQuestions = data;
    }
    
    const mismatches: ValidationResult[] = [];
    
    // Pre-check: MCQs without valid options (no AI needed)
    const questionsForAI: Question[] = [];
    for (const q of allQuestions) {
        const hasOptions = hasValidOptions(q.options);
        if (q.type === 'MCQ' && !hasOptions) {
            mismatches.push({
                id: q.id,
                concept_id: q.concept_id,
                current_type: q.type,
                suggested_type: 'VSA',
                marks: getEligibleMarks(q.type),
                has_options: false,
                reasoning: 'MCQ tagged but no valid options found'
            });
        } else {
            questionsForAI.push(q);
        }
    }
    
    // Batch the remaining questions for AI validation
    const batches: Question[][] = [];
    for (let i = 0; i < questionsForAI.length; i += BATCH_SIZE) {
        batches.push(questionsForAI.slice(i, i + BATCH_SIZE));
    }
    
    const totalBatches = batches.length;
    let completedBatches = 0;
    
    onProgress?.({ current: 0, total: totalBatches, phase: 'validating', questionCount: allQuestions.length });
    
    const tasks = batches.map((batch, idx) => async () => {
        const prompt = buildPrompt(batch);
        const response = await callAI(prompt);
        
        completedBatches++;
        onProgress?.({ 
            current: completedBatches, 
            total: totalBatches, 
            phase: 'validating',
            questionCount: allQuestions.length
        });
        
        try {
            const parsed = JSON.parse(response.response);
            return { batch, aiResults: parsed.results || [] };
        } catch {
            console.error(`Failed to parse AI response for batch ${idx}`);
            return { batch, aiResults: [] };
        }
    });
    
    const batchResults = await pLimit(tasks, CONCURRENCY_LIMIT);
    
    // Map display names back to IDs for comparison
    const typeNameToId: Record<string, string> = {
        'MCQ': 'MCQ',
        '2 Marks': 'VSA',
        '3 Marks': 'SA',
        '4 Marks': 'Case-Based',
        '5 Marks': 'LA',
        'VSA': 'VSA',
        'SA': 'SA',
        'Case-Based': 'Case-Based',
        'LA': 'LA'
    };
    
    for (const { batch, aiResults } of batchResults) {
        for (const q of batch) {
            const aiResult = aiResults.find((r: any) => r.id === q.id);
            if (!aiResult) continue;
            
            const suggestedId = typeNameToId[aiResult.suggested_type] || aiResult.suggested_type;
            if (suggestedId !== q.type) {
                mismatches.push({
                    id: q.id,
                    concept_id: q.concept_id,
                    current_type: q.type,
                    suggested_type: suggestedId,
                    marks: getEligibleMarks(q.type),
                    has_options: hasOptions,
                    reasoning: aiResult.reasoning || ''
                });
            }
        }
    }
    
    onProgress?.({ current: totalBatches, total: totalBatches, phase: 'complete' });
    
    return mismatches;
}

export function downloadCsv(results: ValidationResult[]): void {
    const headers = ['id', 'concept_id', 'current_type', 'suggested_type', 'marks', 'has_options', 'reasoning'];
    const rows = results.map(r => [
        r.id,
        r.concept_id,
        r.current_type,
        r.suggested_type,
        r.marks,
        r.has_options,
        `"${r.reasoning.replace(/"/g, '""')}"`
    ].join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `question_tag_mismatches_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
}
