import { swanAPI } from '@mahaswami/swan-frontend';
import { autoFixGeneratedLatex } from '../utils/latexUtils';

const GEMINI_MODEL = 'gemini-3-flash-preview';

export type QuestionType = 'MCQ' | 'VSA' | 'SA' | 'Case-Based' | 'LA';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Operation = 'generate-similar' | 'convert-to-mcq';

export interface QuestionContext {
    subject_name: string;
    chapter_name: string;
    concept_name: string;
}

export interface QuestionInput {
    id: number;
    concept_id: number;
    type: QuestionType;
    difficulty: Difficulty;
    question_stream: string;
    answer_stream: string;
    options?: string;
    correct_option?: string;
    final_answer?: string;
    hint?: string;
    context: QuestionContext;
}

export interface ContentBlock {
    type: 'text' | 'svg' | 'html';
    content?: string;
    data?: string;
    id?: string;
    alt?: string;
}

export interface GeneratedQuestion {
    question_stream: ContentBlock[] | string;
    answer_stream: ContentBlock[] | string;
    options?: { A: string; B: string; C: string; D: string };
    correct_option?: string;
    final_answer: string;
    hint: string;
    difficulty: Difficulty;
    type: QuestionType;
    generation_notes: string;
}

export interface VerificationResult {
    passes: boolean;
    confidence: number;
    issues: string[];
    checks: {
        intent_preserved: boolean;
        difficulty_matched: boolean;
        structurally_valid: boolean;
        mathematically_correct: boolean;
        answer_consistent: boolean;
        latex_wellformed: boolean;
    };
}

export interface GenerationResult {
    success: boolean;
    original_id: number;
    generated?: GeneratedQuestion;
    verification?: VerificationResult;
    error?: string;
}

// ============ Bulk Generation Plan Types ============

export interface GenerationTask {
    sourceQuestionId: number;
    operation: Operation;
    targetType?: QuestionType;
    targetDifficulty?: Difficulty;
    targetConceptId?: number;
}

export interface PlanTarget {
    conceptId: number;
    type: 'MCQ' | 'non-MCQ';
    difficulty: Difficulty;
    targetCount: number;
}

export interface ConceptCount {
    conceptId: number;
    conceptName: string;
    chapterId: number;
    chapterName: string;
    mcq: { Easy: number; Medium: number; Hard: number };
    nonMcq: { Easy: number; Medium: number; Hard: number };
}

export interface GenerationPlan {
    name: string;
    tasks: GenerationTask[];
    targets: PlanTarget[];
}

export interface TaskResult {
    task: GenerationTask;
    success: boolean;
    savedQuestionId?: number;
    error?: string;
    verificationIssues?: string[];
}

export interface PlanExecutionResult {
    plan: GenerationPlan;
    taskResults: TaskResult[];
    successCount: number;
    failureCount: number;
    startTime: Date;
    endTime: Date;
}

export interface TargetVerification {
    target: PlanTarget;
    beforeCount: number;
    afterCount: number;
    achieved: boolean;
    gap: number;
}

function hasSvgContent(text: string): boolean {
    return /<svg/i.test(text || '');
}

function hasLatexContent(text: string): boolean {
    return /\$[^$]+\$|\$\$[^$]+\$\$/.test(text || '');
}

function analyzeContent(question: QuestionInput): { hasSvg: boolean; hasLatex: boolean; svgCount: number } {
    const allText = `${question.question_stream || ''} ${question.answer_stream || ''}`;
    const svgMatches = allText.match(/<svg[^>]*>[\s\S]*?<\/svg>/gi) || [];
    return {
        hasSvg: hasSvgContent(allText),
        hasLatex: hasLatexContent(allText),
        svgCount: svgMatches.length
    };
}

const SHARED_FORMATTING_RULES = `
MATHEMATICAL FORMATTING RULES:
- Use LaTeX for ALL mathematical expressions - never leave them as plain text
- Inline math: $x$, $y = mx + c$, $\\frac{a}{b}$
- Block math (centered, separate line): $$Area = l \\times b$$
- IMPORTANT: Each $$...$$ block MUST be on its own line with \\n before and after
- Double-escape backslashes in JSON: \\\\frac, \\\\sum, \\\\bar, \\\\sqrt, \\\\times, \\\\div, \\\\pm

CORRECT EXAMPLES:
- Inline fraction: $\\frac{a}{b}$
- Block equation: ...some text\\n$$\\frac{a + b}{c} = d$$\\nmore text...
- Multiple block equations:
  Text before\\n$$equation1$$\\n$$equation2$$\\nText after
- Sum: $\\sum f_i = 36 + k$
- Mean: $\\bar{x} = 55$
- Square root: $\\sqrt{b^2 - 4ac}$

COMMON ERRORS TO AVOID:
- WRONG: \frac{a}{b} (bare command, no $ wrapper)
- WRONG: $50}{20}$ (orphaned braces from broken \frac)
- WRONG: \\\frac{a}{b} (triple backslash)
- WRONG: text $$eq1$$ $$eq2$$ text (block math not on own line)
- WRONG: Sum of frequencies: \sum f_i (no $ delimiters)

SVG HANDLING RULES:
- Preserve existing SVG diagrams unless numerical values need modification
- For numeric cloning: modify only numerical labels in SVG, keep geometry intact
- Use single quotes for SVG attributes: <svg width='300' height='300'>
- In SVG <text> tags, use plain text (no $LaTeX$)
- Angle arcs: use <path d='M [x1] [y1] A [r] [r] 0 0 0 [x2] [y2]' />

OUTPUT RULES:
- Respond ONLY with valid JSON
- No conversational text before or after JSON
- Use \\n for newlines in JSON string values
- Verify all LaTeX is properly wrapped in $ or $$ before outputting
`;

const CONTENT_BLOCK_SCHEMA = `
CONTENT BLOCK FORMAT:
question_stream and answer_stream are JSON arrays of ContentBlock objects:

ContentBlock types:
1. Text block: {"type":"text","content":"Your text with $inline$ and \\n$$block$$\\n math"}
2. SVG block: {"type":"svg","id":"unique_id","data":"<svg...>...</svg>","alt":"Description"}

RULES:
- Preserve the array structure exactly
- For text blocks: modify content, keep type
- For SVG blocks: only modify numeric values in <text> tags, keep all geometry
- Each $$...$$ must have \\n before and after within the content string
`;

const FEW_SHOT_EXAMPLE_SIMPLE = `
EXAMPLE 1 - Simple MCQ (text only):

INPUT:
{
  "question_stream": [{"type":"text","content":"Calculate the ratio of the HCF to the LCM of the least composite number and the least prime number."}],
  "answer_stream": [{"type":"text","content":"The least composite number is 4 and the least prime number is 2.\\nHCF of 4 and 2 = 2.\\nLCM of 4 and 2 = 4.\\nTherefore, the ratio is:\\n$$Ratio = 2 : 4 = 1 : 2$$"}],
  "options": {"A":"1:2","B":"2:1","C":"1:1","D":"1:3"},
  "correct_option": "A",
  "final_answer": "1:2",
  "hint": "Identify the least composite number (4) and least prime number (2) first."
}

OUTPUT (numeric clone):
{
  "question_stream": [{"type":"text","content":"Calculate the ratio of the HCF to the LCM of the numbers 6 and 9."}],
  "answer_stream": [{"type":"text","content":"The numbers are 6 and 9.\\nHCF of 6 and 9 = 3.\\nLCM of 6 and 9 = 18.\\nTherefore, the ratio is:\\n$$Ratio = 3 : 18 = 1 : 6$$"}],
  "options": {"A":"1:3","B":"1:6","C":"3:1","D":"6:1"},
  "correct_option": "B",
  "final_answer": "1:6",
  "hint": "Find HCF and LCM of 6 and 9 first.",
  "difficulty": "Easy",
  "type": "MCQ",
  "generation_notes": "Changed from least composite/prime (4,2) to explicit numbers (6,9). New HCF=3, LCM=18, ratio=1:6"
}
`;

const FEW_SHOT_EXAMPLE_WITH_SVG = `
EXAMPLE 2 - MCQ with SVG diagram:

INPUT:
{
  "question_stream": [
    {"type":"text","content":"In the given figure, $\\\\Delta ABC \\\\sim \\\\Delta QPR$. If $AC = 6$ cm, $BC = 5$ cm, $QR = 3$ cm and $PR = x$; then the value of $x$ is:"},
    {"type":"svg","id":"svg_q1","data":"<svg width='500' height='250'><g><text x='110' y='40'>6 cm</text><text x='182' y='145'>5 cm</text><text x='325' y='155'>3 cm</text><text x='435' y='135'>x</text></g></svg>","alt":"Two similar triangles"}
  ],
  "answer_stream": [{"type":"text","content":"Given: $\\\\Delta ABC \\\\sim \\\\Delta QPR$.\\nTherefore:\\n$$\\\\frac{AC}{QR} = \\\\frac{BC}{PR}$$\\n$$\\\\frac{6}{3} = \\\\frac{5}{x}$$\\n$$x = \\\\frac{5}{2} = 2.5$$"}],
  "options": {"A":"3.6 cm","B":"2.5 cm","C":"10 cm","D":"3.2 cm"},
  "correct_option": "B",
  "final_answer": "2.5 cm"
}

OUTPUT (numeric clone):
{
  "question_stream": [
    {"type":"text","content":"In the given figure, $\\\\Delta ABC \\\\sim \\\\Delta QPR$. If $AC = 8$ cm, $BC = 6$ cm, $QR = 4$ cm and $PR = x$; then the value of $x$ is:"},
    {"type":"svg","id":"svg_q1","data":"<svg width='500' height='250'><g><text x='110' y='40'>8 cm</text><text x='182' y='145'>6 cm</text><text x='325' y='155'>4 cm</text><text x='435' y='135'>x</text></g></svg>","alt":"Two similar triangles"}
  ],
  "answer_stream": [{"type":"text","content":"Given: $\\\\Delta ABC \\\\sim \\\\Delta QPR$.\\nTherefore:\\n$$\\\\frac{AC}{QR} = \\\\frac{BC}{PR}$$\\n$$\\\\frac{8}{4} = \\\\frac{6}{x}$$\\n$$x = \\\\frac{6}{2} = 3$$"}],
  "options": {"A":"4 cm","B":"3 cm","C":"12 cm","D":"2 cm"},
  "correct_option": "B",
  "final_answer": "3 cm",
  "hint": "Use the property of corresponding sides in similar triangles.",
  "difficulty": "Easy",
  "type": "MCQ",
  "generation_notes": "Changed AC=6->8, BC=5->6, QR=3->4. Ratio preserved (2:1), new x=3 cm"
}
`;

const GENERATE_SIMILAR_PROMPT = `Role: You are an expert CBSE Class 10 question generator.

TASK: Generate a similar question by numeric cloning using ContentBlock format.

${CONTENT_BLOCK_SCHEMA}

NUMERIC CLONING RULES:
1. Retain the EXACT sentence structure and grammatical flow
2. Change numerical values to different but mathematically sound values
3. Ensure new values are realistic for Class 10 context
4. Recalculate the solution with new values - show ALL steps
5. For MCQ: regenerate options with recalculated correct answer
6. Preserve difficulty level
7. For SVG blocks: only modify numbers in <text> tags, preserve all paths/geometry

DISTRACTOR GENERATION (for MCQ):
- Option A-D must include exactly ONE correct answer
- Distractors should be plausible errors (calculation mistakes, conceptual errors)
- Correct answer MUST be derived from the solution

${SHARED_FORMATTING_RULES}

${FEW_SHOT_EXAMPLE_SIMPLE}

${FEW_SHOT_EXAMPLE_WITH_SVG}

OUTPUT SCHEMA:
{
  "question_stream": [ContentBlock array],
  "answer_stream": [ContentBlock array],
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correct_option": "A/B/C/D",
  "final_answer": "The final computed answer",
  "hint": "Approach hint for student",
  "difficulty": "Easy/Medium/Hard",
  "type": "MCQ/VSA/SA/LA/Case-Based",
  "generation_notes": "Plain text summary of changes (NO LaTeX)"
}

ERROR HANDLING:
If you cannot generate a valid similar question, respond with:
{
  "error": "Reason why generation failed",
  "original_id": <question_id>
}`;

const CONVERT_TO_MCQ_PROMPT = `Role: You are an expert CBSE Class 10 MCQ creator.

TASK: Convert a non-MCQ question (VSA/SA/LA) into MCQ format using ContentBlock format.

${CONTENT_BLOCK_SCHEMA}

CONVERSION RULES:
1. The question text should be adapted for MCQ format if needed
2. The CORRECT ANSWER from the original must become one of the options
3. Generate exactly 4 options (A, B, C, D)
4. Preserve any SVG blocks unchanged

DISTRACTOR GENERATION:
- Create 3 plausible wrong options based on common misconceptions
- Distractors should NOT be obviously wrong
- All options should be similar in length and format

${SHARED_FORMATTING_RULES}

OUTPUT SCHEMA:
{
  "question_stream": [ContentBlock array],
  "answer_stream": [ContentBlock array],
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correct_option": "A/B/C/D",
  "final_answer": "Same as original or simplified",
  "hint": "Approach hint",
  "difficulty": "Easy/Medium/Hard",
  "type": "MCQ",
  "generation_notes": "Plain text summary (NO LaTeX)"
}

ERROR HANDLING:
If the question cannot be meaningfully converted to MCQ, respond with:
{
  "error": "Reason (e.g., 'Case-Based with multiple parts cannot be single MCQ')",
  "original_id": <question_id>
}`;

const VERIFICATION_PROMPT = `Role: You are a quality assurance expert for exam questions.

TASK: Verify that a generated question meets quality standards.

IMPORTANT CONTEXT:
- The generated content shown below is SERIALIZED TEXT for verification purposes
- The actual storage format uses ContentBlock[] arrays with proper JSON escaping
- SVG diagrams appear as [SVG: description] placeholders - this is expected
- Focus on CONTENT QUALITY, not formatting/serialization details

VERIFICATION CRITERIA:

1. INTENT_PRESERVED
   - Tests the same mathematical concept/skill as original
   - Requires similar problem-solving approach
   - Appropriate for the stated concept

2. DIFFICULTY_MATCHED
   - Similar cognitive load as original
   - Number complexity is comparable
   - Solution steps are similar in count

3. STRUCTURALLY_VALID
   - If MCQ: exactly 4 options (A, B, C, D), one marked correct
   - Solution is complete with all steps shown
   - Question text is clear and complete

4. MATHEMATICALLY_CORRECT
   - All calculations in solution are accurate
   - Final answer matches the solution steps
   - For MCQ: correct_option matches the computed answer
   - Formulas are correctly applied

5. ANSWER_CONSISTENT
   - The correct_option/final_answer is actually correct
   - For MCQ: the correct answer IS one of the options
   - Solution leads to the stated answer

6. LATEX_WELLFORMED
   - Math expressions use $ (inline) or $$ (block) delimiters
   - No bare LaTeX commands like \\frac outside delimiters
   - Expressions are complete (no orphaned braces)

RESPOND WITH JSON:
{
  "passes": true/false,
  "confidence": 0.0-1.0,
  "issues": ["issue1", "issue2"],
  "checks": {
    "intent_preserved": true/false,
    "difficulty_matched": true/false,
    "structurally_valid": true/false,
    "mathematically_correct": true/false,
    "answer_consistent": true/false,
    "latex_wellformed": true/false
  }
}

NOTE: Do NOT flag issues about JSON escaping, [SVG: ...] placeholders, or ContentBlock structure - these are serialization artifacts, not actual problems.

Be strict on MATHEMATICAL CORRECTNESS and ANSWER CONSISTENCY.`;

function buildGenerationPrompt(question: QuestionInput, _operation: Operation): string {
    const contentInfo = analyzeContent(question);
    
    // Parse question_stream and answer_stream as JSON if possible
    const parseAsContentBlocks = (str: string): any => {
        try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) return parsed;
        } catch { }
        return str;
    };
    
    const questionBlocks = parseAsContentBlocks(question.question_stream);
    const answerBlocks = parseAsContentBlocks(question.answer_stream);
    let optionsParsed = question.options;
    try {
        if (typeof question.options === 'string') {
            optionsParsed = JSON.parse(question.options);
        }
    } catch { }
    
    const inputJson = {
        question_stream: questionBlocks,
        answer_stream: answerBlocks,
        options: optionsParsed || undefined,
        correct_option: question.correct_option || undefined,
        final_answer: question.final_answer || undefined,
        hint: question.hint || undefined,
        type: question.type,
        difficulty: question.difficulty
    };
    
    const contextBlock = `
CONTEXT:
- Subject: ${question.context.subject_name}
- Chapter: ${question.context.chapter_name}
- Concept: ${question.context.concept_name}
- Original Type: ${question.type}
- Difficulty: ${question.difficulty}
- Contains SVG: ${contentInfo.hasSvg} (${contentInfo.svgCount} diagrams)
- Contains LaTeX: ${contentInfo.hasLatex}
`;

    return `${contextBlock}\n\nINPUT (ContentBlock format):\n${JSON.stringify(inputJson, null, 2)}\n\nGenerate the new question in the same ContentBlock format:`;
}

function serializeStreamForPrompt(stream: ContentBlock[] | string | undefined): string {
    if (!stream) return '';
    if (typeof stream === 'string') return stream;
    if (Array.isArray(stream)) {
        return stream.map(block => {
            if (block.type === 'text') return block.content || '';
            if (block.type === 'svg') return `[SVG: ${block.alt || block.id || 'diagram'}]`;
            if (block.type === 'html') return `[HTML content]`;
            return '';
        }).join('\n');
    }
    return String(stream);
}

function buildVerificationPrompt(
    original: QuestionInput, 
    generated: GeneratedQuestion, 
    operation: Operation,
    targetDifficulty?: Difficulty
): string {
    const genQuestion = serializeStreamForPrompt(generated.question_stream);
    const genAnswer = serializeStreamForPrompt(generated.answer_stream);
    const expectedDifficulty = targetDifficulty || original.difficulty;
    const difficultyNote = targetDifficulty && targetDifficulty !== original.difficulty
        ? `\n- NOTE: Difficulty was intentionally changed from ${original.difficulty} to ${targetDifficulty}. Verify against TARGET difficulty.`
        : '';
    
    return `
OPERATION PERFORMED: ${operation}

ORIGINAL QUESTION (ID: ${original.id}):
- Type: ${original.type}
- Difficulty: ${original.difficulty}
- Concept: ${original.context.concept_name}
- Question: ${original.question_stream}
- Answer: ${original.answer_stream}
- Final Answer: ${original.final_answer || 'N/A'}

GENERATED QUESTION:
- Type: ${generated.type}
- Difficulty: ${generated.difficulty}
- Expected Difficulty: ${expectedDifficulty}${difficultyNote}
- Question: ${genQuestion}
- Answer: ${genAnswer}
- Options: ${generated.options ? JSON.stringify(generated.options) : 'N/A'}
- Correct Option: ${generated.correct_option || 'N/A'}
- Final Answer: ${generated.final_answer}

Verify the generated question:`;
}

async function callAI(systemPrompt: string, prompt: string): Promise<string> {
    const response = await swanAPI('generic_ai', {
        systemPrompt,
        prompt,
        model: GEMINI_MODEL,
        responseFormat: 'json'
    });
    return response.response;
}

function parseAIResponse<T>(response: string, fallback: T): T {
    try {
        return JSON.parse(response) as T;
    } catch {
        console.error('[QuestionAIService] Failed to parse AI response:', response.substring(0, 200));
        return fallback;
    }
}

const hasContent = (stream: ContentBlock[] | string | undefined): boolean => {
    if (!stream) return false;
    if (Array.isArray(stream)) {
        return stream.length > 0 && stream.some(b => 
            (b.type === 'text' && b.content?.trim()) || 
            (b.type === 'svg' && b.data)
        );
    }
    return typeof stream === 'string' && stream.trim().length > 0;
};

function validateStructure(generated: GeneratedQuestion, operation: Operation): string[] {
    const issues: string[] = [];

    if (!hasContent(generated.question_stream)) {
        issues.push('Missing question_stream');
    }
    if (!hasContent(generated.answer_stream)) {
        issues.push('Missing answer_stream');
    }

    if (generated.type === 'MCQ' || operation === 'convert-to-mcq') {
        if (!generated.options) {
            issues.push('MCQ missing options');
        } else {
            const opts = generated.options;
            if (!opts.A || !opts.B || !opts.C || !opts.D) {
                issues.push('MCQ must have exactly 4 options (A, B, C, D)');
            }
        }
        if (!generated.correct_option || !['A', 'B', 'C', 'D'].includes(generated.correct_option)) {
            issues.push('MCQ must have valid correct_option (A/B/C/D)');
        }
        if (generated.options && generated.correct_option) {
            const correctAnswer = generated.options[generated.correct_option as keyof typeof generated.options];
            if (!correctAnswer?.trim()) {
                issues.push('correct_option does not correspond to a valid option');
            }
        }
    }

    return issues;
}

function extractTextContent(input: ContentBlock[] | string | undefined): string {
    if (!input) return '';
    if (typeof input === 'string') return input;
    if (Array.isArray(input)) {
        return input
            .filter(b => b.type === 'text' && b.content)
            .map(b => b.content)
            .join('\n');
    }
    return '';
}

function validateLatexFormatting(input: ContentBlock[] | string | undefined): string[] {
    const text = extractTextContent(input);
    if (!text) return [];
    const issues: string[] = [];
    
    // Remove content inside $ delimiters to check what's outside
    const outsideMath = text
        .replace(/\$\$[^$]+\$\$/g, ' ')
        .replace(/\$[^$]+\$/g, ' ');
    
    // Check for orphaned braces (indicates broken \frac)
    if (/\}\s*\{/.test(outsideMath)) {
        issues.push('Orphaned braces }{ found outside LaTeX - likely broken \\frac');
    }
    
    // Check for bare LaTeX commands without $ wrapper
    if (/(?<!\$)\\(frac|sum|bar|sqrt|times|div|pm|left|right|text|implies|therefore)\{/.test(outsideMath)) {
        issues.push('Bare LaTeX command found without $ delimiters');
    }
    
    // Check for unbalanced $ signs
    const dollarMatches = text.match(/(?<!\\)\$/g) || [];
    if (dollarMatches.length % 2 !== 0) {
        issues.push('Unbalanced $ delimiters');
    }
    
    // Check for common malformed patterns
    if (/\$\d+\}\{\d+\$/.test(text)) {
        issues.push('Malformed fraction pattern detected (e.g., $50}{20}$)');
    }
    
    return issues;
}

function validateGeneratedLatex(generated: GeneratedQuestion): string[] {
    const allIssues: string[] = [];
    
    const qIssues = validateLatexFormatting(generated.question_stream);
    if (qIssues.length > 0) {
        allIssues.push(...qIssues.map(i => `question_stream: ${i}`));
    }
    
    const aIssues = validateLatexFormatting(generated.answer_stream);
    if (aIssues.length > 0) {
        allIssues.push(...aIssues.map(i => `answer_stream: ${i}`));
    }
    
    if (generated.options) {
        for (const [key, val] of Object.entries(generated.options)) {
            const optIssues = validateLatexFormatting(val);
            if (optIssues.length > 0) {
                allIssues.push(...optIssues.map(i => `option ${key}: ${i}`));
            }
        }
    }
    
    return allIssues;
}

async function generateSimilarAttempt(
    question: QuestionInput,
    verify: boolean,
    targetDifficulty?: Difficulty,
    targetType?: string
): Promise<GenerationResult> {
    let prompt = buildGenerationPrompt(question, 'generate-similar');
    if (targetDifficulty && targetDifficulty !== question.difficulty) {
        prompt += `\n\nIMPORTANT: Generate the new question at ${targetDifficulty} difficulty (original is ${question.difficulty}). Adjust complexity accordingly.`;
    }
    if (targetType && targetType !== question.type) {
        prompt += `\n\nIMPORTANT: Generate the new question as ${targetType} type (original is ${question.type}). ${targetType === 'MCQ' ? 'Include options A-D with correct_option.' : 'Do NOT include options or correct_option fields.'}`;
    }
    const response = await callAI(GENERATE_SIMILAR_PROMPT, prompt);
    const parsed = parseAIResponse<GeneratedQuestion & { error?: string }>(response, { error: 'Parse failed' } as any);

    if (parsed.error) {
        return { success: false, original_id: question.id, error: parsed.error };
    }

    // Auto-fix bare LaTeX commands before validation
    const generated = autoFixGeneratedLatex(parsed as GeneratedQuestion);

    // Structural validation
    const structuralIssues = validateStructure(generated, 'generate-similar');
    if (structuralIssues.length > 0) {
        return {
            success: false,
            original_id: question.id,
            generated,
            error: `Structural issues: ${structuralIssues.join(', ')}`
        };
    }

    // Programmatic LaTeX validation
    const latexIssues = validateGeneratedLatex(generated);
    if (latexIssues.length > 0) {
        return {
            success: false,
            original_id: question.id,
            generated,
            error: `LaTeX formatting issues: ${latexIssues.join(', ')}`
        };
    }

    // LLM verification
    let verification: VerificationResult | undefined;
    if (verify) {
        verification = await verifyGeneration(question, generated, 'generate-similar', targetDifficulty);
        if (!verification.passes) {
            return {
                success: false,
                original_id: question.id,
                generated,
                verification,
                error: `Verification failed: ${verification.issues.join(', ')}`
            };
        }
    }

    return {
        success: true,
        original_id: question.id,
        generated,
        verification
    };
}

export async function generateSimilar(
    question: QuestionInput,
    options: { verify?: boolean; maxRetries?: number; targetDifficulty?: Difficulty; targetType?: string } = {}
): Promise<GenerationResult> {
    const { verify = true, maxRetries = 1, targetDifficulty, targetType } = options;

    try {
        let lastResult = await generateSimilarAttempt(question, verify, targetDifficulty, targetType);
        
        // Auto-retry on LaTeX formatting issues
        let retries = 0;
        while (!lastResult.success && 
               lastResult.error?.includes('LaTeX formatting') && 
               retries < maxRetries) {
            console.log(`[QuestionAIService] LaTeX issue detected, auto-retrying (${retries + 1}/${maxRetries})`);
            retries++;
            lastResult = await generateSimilarAttempt(question, verify, targetDifficulty, targetType);
        }
        
        // Override difficulty and type in result if targets were specified
        if (lastResult.success && lastResult.generated) {
            if (targetDifficulty) lastResult.generated.difficulty = targetDifficulty;
            if (targetType) lastResult.generated.type = targetType;
        }
        
        return lastResult;
    } catch (error) {
        return {
            success: false,
            original_id: question.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

async function convertToMCQAttempt(
    question: QuestionInput,
    verify: boolean
): Promise<GenerationResult> {
    const prompt = buildGenerationPrompt(question, 'convert-to-mcq');
    const response = await callAI(CONVERT_TO_MCQ_PROMPT, prompt);
    const parsed = parseAIResponse<GeneratedQuestion & { error?: string }>(response, { error: 'Parse failed' } as any);

    if (parsed.error) {
        return { success: false, original_id: question.id, error: parsed.error };
    }

    // Auto-fix bare LaTeX commands before validation
    const generated = autoFixGeneratedLatex(parsed as GeneratedQuestion);
    generated.type = 'MCQ'; // Force type

    // Structural validation
    const structuralIssues = validateStructure(generated, 'convert-to-mcq');
    if (structuralIssues.length > 0) {
        return {
            success: false,
            original_id: question.id,
            generated,
            error: `Structural issues: ${structuralIssues.join(', ')}`
        };
    }

    // Programmatic LaTeX validation
    const latexIssues = validateGeneratedLatex(generated);
    if (latexIssues.length > 0) {
        return {
            success: false,
            original_id: question.id,
            generated,
            error: `LaTeX formatting issues: ${latexIssues.join(', ')}`
        };
    }

    // LLM verification
    let verification: VerificationResult | undefined;
    if (verify) {
        verification = await verifyGeneration(question, generated, 'convert-to-mcq');
        if (!verification.passes) {
            return {
                success: false,
                original_id: question.id,
                generated,
                verification,
                error: `Verification failed: ${verification.issues.join(', ')}`
            };
        }
    }

    return {
        success: true,
        original_id: question.id,
        generated,
        verification
    };
}

export async function convertToMCQ(
    question: QuestionInput,
    options: { verify?: boolean; maxRetries?: number; targetDifficulty?: Difficulty } = {}
): Promise<GenerationResult> {
    const { verify = true, maxRetries = 1, targetDifficulty } = options;

    // Pre-check: already MCQ
    if (question.type === 'MCQ') {
        return {
            success: false,
            original_id: question.id,
            error: 'Question is already an MCQ'
        };
    }

    // Pre-check: Case-Based may not convert well
    if (question.type === 'Case-Based') {
        console.warn(`[QuestionAIService] Converting Case-Based Q${question.id} to MCQ - may lose multi-part structure`);
    }

    try {
        let lastResult = await convertToMCQAttempt(question, verify);
        
        // Auto-retry on LaTeX formatting issues
        let retries = 0;
        while (!lastResult.success && 
               lastResult.error?.includes('LaTeX formatting') && 
               retries < maxRetries) {
            console.log(`[QuestionAIService] LaTeX issue detected, auto-retrying (${retries + 1}/${maxRetries})`);
            retries++;
            lastResult = await convertToMCQAttempt(question, verify);
        }
        
        // Override difficulty in result if targetDifficulty was specified
        if (lastResult.success && lastResult.generated && targetDifficulty) {
            lastResult.generated.difficulty = targetDifficulty;
        }
        
        return lastResult;
    } catch (error) {
        return {
            success: false,
            original_id: question.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function verifyGeneration(
    original: QuestionInput,
    generated: GeneratedQuestion,
    operation: Operation,
    targetDifficulty?: Difficulty
): Promise<VerificationResult> {
    const defaultFail: VerificationResult = {
        passes: false,
        confidence: 0,
        issues: ['Verification call failed'],
        checks: {
            intent_preserved: false,
            difficulty_matched: false,
            structurally_valid: false,
            mathematically_correct: false,
            answer_consistent: false,
            latex_wellformed: false
        }
    };

    try {
        const prompt = buildVerificationPrompt(original, generated, operation, targetDifficulty);
        const response = await callAI(VERIFICATION_PROMPT, prompt);
        return parseAIResponse<VerificationResult>(response, defaultFail);
    } catch (error) {
        console.error('[QuestionAIService] Verification failed:', error);
        return defaultFail;
    }
}

export async function generateSimilarBatch(
    questions: QuestionInput[],
    options: { 
        verify?: boolean; 
        concurrency?: number;
        targetDifficulty?: Difficulty;
        onProgress?: (completed: number, total: number) => void;
    } = {}
): Promise<GenerationResult[]> {
    const { verify = true, concurrency = 3, targetDifficulty, onProgress } = options;
    const results: GenerationResult[] = [];
    let completed = 0;

    const chunks: QuestionInput[][] = [];
    for (let i = 0; i < questions.length; i += concurrency) {
        chunks.push(questions.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
        const chunkResults = await Promise.all(
            chunk.map(q => generateSimilar(q, { verify, targetDifficulty }))
        );
        results.push(...chunkResults);
        completed += chunk.length;
        onProgress?.(completed, questions.length);
    }

    return results;
}

export async function convertToMCQBatch(
    questions: QuestionInput[],
    options: {
        verify?: boolean;
        concurrency?: number;
        onProgress?: (completed: number, total: number) => void;
    } = {}
): Promise<GenerationResult[]> {
    const { verify = true, concurrency = 3, onProgress } = options;
    const results: GenerationResult[] = [];
    let completed = 0;

    // Filter out already-MCQ questions
    const eligible = questions.filter(q => q.type !== 'MCQ');
    const skipped = questions.filter(q => q.type === 'MCQ').map(q => ({
        success: false,
        original_id: q.id,
        error: 'Already MCQ'
    }));

    const chunks: QuestionInput[][] = [];
    for (let i = 0; i < eligible.length; i += concurrency) {
        chunks.push(eligible.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
        const chunkResults = await Promise.all(
            chunk.map(q => convertToMCQ(q, { verify }))
        );
        results.push(...chunkResults);
        completed += chunk.length;
        onProgress?.(completed, eligible.length);
    }

    return [...results, ...skipped];
}

export interface SaveGeneratedQuestionOptions {
    targetConceptId?: number;
    operation: Operation;
    verification?: VerificationResult;
}

export interface SavedQuestionResult {
    questionId: number;
    derivationId: number;
}

const serializeStream = (stream: any): string => {
    if (Array.isArray(stream)) return JSON.stringify(stream);
    if (typeof stream === 'string') return stream;
    return JSON.stringify(stream);
};

export async function saveGeneratedQuestion(
    dataProvider: any,
    sourceRecord: any,
    generated: GeneratedQuestion,
    options: SaveGeneratedQuestionOptions
): Promise<SavedQuestionResult> {
    const { targetConceptId, operation, verification } = options;
    
    const newQuestionData = {
        concept_id: targetConceptId ?? sourceRecord.concept_id,
        type: generated.type,
        difficulty: generated.difficulty,
        question_stream: serializeStream(generated.question_stream),
        answer_stream: serializeStream(generated.answer_stream),
        options: generated.options ? JSON.stringify(generated.options) : null,
        correct_option: generated.correct_option || null,
        final_answer: generated.final_answer,
        hint: generated.hint,
        is_derived: true,
        status: 'need_verification',
    };
    
    const { data: newQuestion } = await dataProvider.create('questions', { data: newQuestionData });
    
    const changes: Record<string, any> = {
        generation_notes: generated.generation_notes,
    };
    
    if (sourceRecord.type !== generated.type) {
        changes.type_change = { from: sourceRecord.type, to: generated.type };
    }
    if (sourceRecord.difficulty !== generated.difficulty) {
        changes.difficulty_change = { from: sourceRecord.difficulty, to: generated.difficulty };
    }
    if (targetConceptId && targetConceptId !== sourceRecord.concept_id) {
        changes.concept_change = { from: sourceRecord.concept_id, to: targetConceptId };
    }
    if (verification) {
        changes.verification = verification;
    }
    
    const { data: derivation } = await dataProvider.create('question_derivations', {
        data: {
            source_question_id: sourceRecord.id,
            derived_question_id: newQuestion.id,
            operation,
            changes: JSON.stringify(changes)
        }
    });
    
    return {
        questionId: newQuestion.id,
        derivationId: derivation.id
    };
}

export async function buildQuestionInput(
    dataProvider: any,
    questionRecord: any
): Promise<QuestionInput> {
    // Fetch concept with chapter and subject
    const { data: concept } = await dataProvider.getOne('concepts', { 
        id: questionRecord.concept_id,
        meta: { prefetch: ['chapters'] }
    });
    
    let chapter = concept?.chapter;
    let subject = { name: 'Unknown', code: '' };
    
    if (chapter?.subject_id) {
        const { data: subjectData } = await dataProvider.getOne('subjects', { id: chapter.subject_id });
        subject = subjectData || subject;
    }

    return {
        id: questionRecord.id,
        concept_id: questionRecord.concept_id,
        type: questionRecord.type as QuestionType,
        difficulty: questionRecord.difficulty as Difficulty,
        question_stream: questionRecord.question_stream || '',
        answer_stream: questionRecord.answer_stream || '',
        options: questionRecord.options,
        correct_option: questionRecord.correct_option,
        final_answer: questionRecord.final_answer,
        hint: questionRecord.hint,
        context: {
            subject_name: subject.name || subject.code || 'Unknown',
            chapter_name: chapter?.name || 'Unknown',
            concept_name: concept?.name || 'Unknown'
        }
    };
}

export async function buildQuestionInputBatch(
    dataProvider: any,
    questionRecords: any[]
): Promise<QuestionInput[]> {
    if (questionRecords.length === 0) return [];
    
    const conceptIds = [...new Set(questionRecords.map(q => q.concept_id))];
    
    const { data: concepts } = await dataProvider.getMany('concepts', { ids: conceptIds });
    const conceptMap = new Map(concepts.map((c: any) => [c.id, c]));
    
    const chapterIds = [...new Set(concepts.map((c: any) => c.chapter_id).filter(Boolean))];
    const { data: chapters } = chapterIds.length > 0 
        ? await dataProvider.getMany('chapters', { ids: chapterIds })
        : { data: [] };
    const chapterMap = new Map(chapters.map((ch: any) => [ch.id, ch]));
    
    const subjectIds = [...new Set(chapters.map((ch: any) => ch.subject_id).filter(Boolean))];
    const { data: subjects } = subjectIds.length > 0
        ? await dataProvider.getMany('subjects', { ids: subjectIds })
        : { data: [] };
    const subjectMap = new Map(subjects.map((s: any) => [s.id, s]));
    
    return questionRecords.map(questionRecord => {
        const concept: any = conceptMap.get(questionRecord.concept_id) || { name: 'Unknown', chapter_id: null };
        const chapter: any = chapterMap.get(concept.chapter_id) || { name: 'Unknown', subject_id: null };
        const subject: any = subjectMap.get(chapter.subject_id) || { name: 'Unknown', code: '' };
        
        return {
            id: questionRecord.id,
            concept_id: questionRecord.concept_id,
            type: questionRecord.type as QuestionType,
            difficulty: questionRecord.difficulty as Difficulty,
            question_stream: questionRecord.question_stream || '',
            answer_stream: questionRecord.answer_stream || '',
            options: questionRecord.options,
            correct_option: questionRecord.correct_option,
            final_answer: questionRecord.final_answer,
            hint: questionRecord.hint,
            context: {
                subject_name: subject.name || subject.code || 'Unknown',
                chapter_name: chapter.name || 'Unknown',
                concept_name: concept.name || 'Unknown'
            }
        };
    });
}

// ============ Bulk Generation Functions ============

export async function getQuestionCounts(dataProvider: any): Promise<ConceptCount[]> {
    const { data: questions } = await dataProvider.getList('questions', {
        pagination: { page: 1, perPage: 10000 },
        sort: { field: 'id', order: 'ASC' },
        filter: { status: 'active' }
    });
    
    const { data: concepts } = await dataProvider.getList('concepts', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'id', order: 'ASC' },
        filter: {}
    });
    
    const { data: chapters } = await dataProvider.getList('chapters', {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'id', order: 'ASC' },
        filter: {}
    });
    
    const chapterMap = new Map(chapters.map((ch: any) => [ch.id, ch]));
    
    const countMap = new Map<number, ConceptCount>();
    
    for (const concept of concepts) {
        const chapter: any = chapterMap.get(concept.chapter_id);
        countMap.set(concept.id, {
            conceptId: concept.id,
            conceptName: concept.name,
            chapterId: concept.chapter_id,
            chapterName: chapter?.name || 'Unknown',
            mcq: { Easy: 0, Medium: 0, Hard: 0 },
            nonMcq: { Easy: 0, Medium: 0, Hard: 0 }
        });
    }
    
    for (const q of questions) {
        const counts = countMap.get(q.concept_id);
        if (!counts) continue;
        
        const difficulty = (q.difficulty || 'Medium') as Difficulty;
        if (q.type === 'MCQ') {
            counts.mcq[difficulty]++;
        } else {
            counts.nonMcq[difficulty]++;
        }
    }
    
    return Array.from(countMap.values());
}

export async function executePlan(
    dataProvider: any,
    plan: GenerationPlan,
    options: {
        concurrency?: number;
        onProgress?: (completed: number, total: number, currentTask: GenerationTask, result: TaskResult, taskIndex: number) => void;
        onTaskStart?: (taskIndex: number) => void;
        onStart?: () => void;
        onComplete?: (result: PlanExecutionResult) => void;
        onFirstBatchComplete?: (successCount: number, failureCount: number, remaining: number) => Promise<boolean>;
    } = {}
): Promise<PlanExecutionResult> {
    const { concurrency = 2, onProgress, onTaskStart, onStart, onComplete, onFirstBatchComplete } = options;
    const startTime = new Date();
    
    onStart?.();
    
    const questionIds = plan.tasks.map(t => t.sourceQuestionId);
    const { data: questionRecords } = await dataProvider.getMany('questions', { ids: questionIds });
    const questionInputs = await buildQuestionInputBatch(dataProvider, questionRecords);
    const inputMap = new Map(questionInputs.map(q => [q.id, q]));
    
    const taskResults: TaskResult[] = [];
    let completed = 0;
    
    const executeTask = async (task: GenerationTask): Promise<TaskResult> => {
        const questionInput = inputMap.get(task.sourceQuestionId);
        if (!questionInput) {
            return { task, success: false, error: 'Source question not found' };
        }
        
        try {
            let result: GenerationResult;
            
            if (task.operation === 'convert-to-mcq') {
                result = await convertToMCQ(questionInput, { targetDifficulty: task.targetDifficulty });
            } else {
                result = await generateSimilar(questionInput, { targetDifficulty: task.targetDifficulty, targetType: task.targetType });
            }
            
            if (!result.success || !result.generated) {
                return { 
                    task, 
                    success: false, 
                    error: result.error || 'Generation failed',
                    verificationIssues: result.verification?.issues 
                };
            }
            
            if (result.verification && !result.verification.passes) {
                return {
                    task,
                    success: false,
                    error: 'Verification failed',
                    verificationIssues: result.verification.issues
                };
            }
            
            const savedQuestion = await saveGeneratedQuestion(
                dataProvider,
                questionInput,
                result.generated,
                { targetConceptId: task.targetConceptId, operation: task.operation }
            );
            
            return { 
                task, 
                success: true, 
                savedQuestionId: savedQuestion.questionId 
            };
        } catch (error: any) {
            return { 
                task, 
                success: false, 
                error: error.message || 'Unknown error' 
            };
        }
    };
    
    // Process with simple batching
    let isFirstBatch = true;
    for (let i = 0; i < plan.tasks.length; i += concurrency) {
        const batch = plan.tasks.slice(i, i + concurrency).map((task, batchIdx) => ({
            task,
            index: i + batchIdx
        }));
        
        batch.forEach(({ index }) => onTaskStart?.(index));
        
        const batchResults = await Promise.all(
            batch.map(({ task, index }) => 
                executeTask(task).then(result => ({ result, index }))
            )
        );
        
        for (const { result, index } of batchResults) {
            taskResults.push(result);
            completed++;
            onProgress?.(completed, plan.tasks.length, batch[0].task, result, index);
        }
        
        // First batch confirmation
        if (isFirstBatch && onFirstBatchComplete) {
            isFirstBatch = false;
            const successCount = taskResults.filter(r => r.success).length;
            const failureCount = taskResults.filter(r => !r.success).length;
            const remaining = plan.tasks.length - completed;
            
            const shouldContinue = await onFirstBatchComplete(successCount, failureCount, remaining);
            if (!shouldContinue) {
                const endTime = new Date();
                const executionResult: PlanExecutionResult = {
                    plan,
                    taskResults,
                    successCount,
                    failureCount,
                    startTime,
                    endTime
                };
                onComplete?.(executionResult);
                return executionResult;
            }
        }
        
        // Yield to browser between batches
        await new Promise(r => setTimeout(r, 50));
    }
    
    const endTime = new Date();
    const executionResult: PlanExecutionResult = {
        plan,
        taskResults,
        successCount: taskResults.filter(r => r.success).length,
        failureCount: taskResults.filter(r => !r.success).length,
        startTime,
        endTime
    };
    
    onComplete?.(executionResult);
    return executionResult;
}

export async function verifyPlanOutcome(
    dataProvider: any,
    plan: GenerationPlan,
    beforeCounts: ConceptCount[]
): Promise<TargetVerification[]> {
    const afterCounts = await getQuestionCounts(dataProvider);
    
    const beforeMap = new Map(beforeCounts.map(c => [c.conceptId, c]));
    const afterMap = new Map(afterCounts.map(c => [c.conceptId, c]));
    
    return plan.targets.map(target => {
        const before = beforeMap.get(target.conceptId);
        const after = afterMap.get(target.conceptId);
        
        const getCount = (counts: ConceptCount | undefined) => {
            if (!counts) return 0;
            const bucket = target.type === 'MCQ' ? counts.mcq : counts.nonMcq;
            return bucket[target.difficulty];
        };
        
        const beforeCount = getCount(before);
        const afterCount = getCount(after);
        
        return {
            target,
            beforeCount,
            afterCount,
            achieved: afterCount >= target.targetCount,
            gap: Math.max(0, target.targetCount - afterCount)
        };
    });
}
