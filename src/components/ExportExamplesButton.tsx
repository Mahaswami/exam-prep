import { useDataProvider, useNotify } from 'react-admin';
import { Button, Tooltip } from '@mui/material';
import { Code as CodeIcon } from '@mui/icons-material';

interface ContentBlock {
    type: 'text' | 'svg' | 'html';
    content?: string;
    data?: string;
    id?: string;
}

const isContentBlockArray = (value: any): boolean => {
    if (typeof value !== 'string') return false;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) && parsed.length > 0 && parsed[0].type;
    } catch {
        return false;
    }
};

const hasSvgBlock = (value: string): boolean => {
    try {
        const parsed = JSON.parse(value) as ContentBlock[];
        return parsed.some(b => b.type === 'svg');
    } catch {
        return false;
    }
};

const prettyPrintContentBlocks = (value: string): string => {
    try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
    } catch {
        return value;
    }
};

export const ExportExamplesButton = () => {
    const dataProvider = useDataProvider();
    const notify = useNotify();

    const handleExport = async () => {
        try {
            notify('Fetching questions for examples...', { type: 'info' });

            // Fetch questions with their concept info
            const { data: questions } = await dataProvider.getList('questions', {
                pagination: { page: 1, perPage: 200 },
                sort: { field: 'id', order: 'ASC' },
                filter: { status: 'active' }
            });

            // Fetch concepts to get chapter info
            const conceptIds = [...new Set(questions.map((q: any) => q.concept_id))];
            const { data: concepts } = await dataProvider.getMany('concepts', { ids: conceptIds });
            const conceptMap = new Map(concepts.map((c: any) => [c.id, c]));

            // Fetch chapters
            const chapterIds = [...new Set(concepts.map((c: any) => c.chapter_id))];
            const { data: chapters } = await dataProvider.getMany('chapters', { ids: chapterIds });
            const chapterMap = new Map(chapters.map((ch: any) => [ch.id, ch]));

            // Enrich questions with context
            const enrichedQuestions = questions.map((q: any) => {
                const concept = conceptMap.get(q.concept_id);
                const chapter = concept ? chapterMap.get(concept.chapter_id) : null;
                return {
                    ...q,
                    _concept_name: concept?.name || 'Unknown',
                    _chapter_name: chapter?.name || 'Unknown',
                    _has_content_blocks: isContentBlockArray(q.question_stream),
                    _has_svg: isContentBlockArray(q.question_stream) && hasSvgBlock(q.question_stream)
                };
            });

            // Filter for ContentBlock format only
            const contentBlockQuestions = enrichedQuestions.filter((q: any) => q._has_content_blocks);

            // Find examples by category
            const findExample = (filter: (q: any) => boolean, label: string) => {
                const found = contentBlockQuestions.find(filter);
                if (found) {
                    console.log(`\n${'='.repeat(60)}`);
                    console.log(`=== ${label} ===`);
                    console.log(`=== Question #${found.id} | ${found._chapter_name} > ${found._concept_name} | ${found.type} | ${found.difficulty} ===`);
                    console.log(`${'='.repeat(60)}\n`);
                    
                    console.log('--- FULL RECORD ---');
                    console.log(JSON.stringify(found, null, 2));
                    
                    console.log('\n--- QUESTION_STREAM (parsed) ---');
                    console.log(prettyPrintContentBlocks(found.question_stream));
                    
                    console.log('\n--- ANSWER_STREAM (parsed) ---');
                    console.log(prettyPrintContentBlocks(found.answer_stream));
                    
                    if (found.options) {
                        console.log('\n--- OPTIONS ---');
                        console.log(found.options);
                    }
                    
                    return found;
                } else {
                    console.log(`\n⚠️ No example found for: ${label}`);
                    return null;
                }
            };

            console.clear();
            console.log('🔍 EXPORT EXAMPLES FOR PROMPT ENGINEERING');
            console.log(`Total questions: ${questions.length}`);
            console.log(`With ContentBlock format: ${contentBlockQuestions.length}`);
            console.log(`With SVG diagrams: ${contentBlockQuestions.filter((q: any) => q._has_svg).length}`);

            // 1. Statistics example (mean, median, mode, HCF, LCM)
            findExample(
                (q: any) => q._chapter_name?.toLowerCase().includes('real numbers') || 
                           q._concept_name?.toLowerCase().includes('hcf') ||
                           q._concept_name?.toLowerCase().includes('lcm'),
                'REAL NUMBERS (HCF/LCM) - Example 1'
            );

            // 2. Statistics with table/data
            findExample(
                (q: any) => q._chapter_name?.toLowerCase().includes('statistic') ||
                           q._concept_name?.toLowerCase().includes('mean') ||
                           q._concept_name?.toLowerCase().includes('median'),
                'STATISTICS (Mean/Median) - Example 2'
            );

            // 3. Trigonometry with SVG
            findExample(
                (q: any) => (q._chapter_name?.toLowerCase().includes('trigonometr') ||
                            q._concept_name?.toLowerCase().includes('height') ||
                            q._concept_name?.toLowerCase().includes('angle')) &&
                           q._has_svg,
                'TRIGONOMETRY with SVG - Example 3'
            );

            // 4. Any question with SVG (fallback)
            findExample(
                (q: any) => q._has_svg,
                'ANY with SVG - Example 4 (fallback)'
            );

            // 5. MCQ example
            findExample(
                (q: any) => q.type === 'MCQ' && q.options,
                'MCQ - Example 5'
            );

            console.log('\n' + '='.repeat(60));
            console.log('✅ Export complete. Copy examples above for prompt engineering.');
            console.log('='.repeat(60));

            notify('Examples exported to console (F12)', { type: 'success' });

        } catch (error: any) {
            console.error('Export failed:', error);
            notify(`Export failed: ${error.message}`, { type: 'error' });
        }
    };

    // Only show in development
    if (import.meta.env.PROD) return null;

    return (
        <Tooltip title="Export question examples for prompt engineering (dev only)">
            <Button
                onClick={handleExport}
                startIcon={<CodeIcon />}
                size="small"
                sx={{ ml: 1 }}
            >
                Export Examples
            </Button>
        </Tooltip>
    );
};
