import { validateQuestionTags, downloadCsv, type ValidatorProgress } from '../services/questionTagValidator';
import { 
    generateSimilarBatch, 
    convertToMCQBatch, 
    buildQuestionInput,
    type GeneratedQuestion,
    type VerificationResult
} from '../services/QuestionAIService';
import type { BatchOperation, BatchOperationResult } from '../components/BatchOperationsDialog';
import { Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, Alert, Typography, Chip } from '@mui/material';

function buildQuestionRecord(
    generated: GeneratedQuestion,
    conceptId: number | undefined,
    verification?: VerificationResult
) {
    return {
        concept_id: conceptId,
        type: generated.type,
        difficulty: generated.difficulty,
        question_stream: generated.question_stream,
        answer_stream: generated.answer_stream,
        options: generated.options ? JSON.stringify(generated.options) : null,
        correct_option: generated.correct_option || null,
        final_answer: generated.final_answer,
        hint: generated.hint,
        is_derived: true,
        status: verification?.passes ? 'active' : 'need_verification'
    };
}

export const validateTagsOperation: BatchOperation = {
    id: 'validate-tags',
    name: 'Validate Tags',
    description: 'Use AI to check if questions are tagged with the correct question type based on their content.',
    
    execute: async (questionIds, dataProvider, onProgress) => {
        const progressAdapter = (p: ValidatorProgress) => {
            onProgress?.({
                current: p.current,
                total: p.total,
                phase: p.phase === 'fetching' 
                    ? 'Fetching questions...' 
                    : `Validating (batch ${p.current} of ${p.total})...`
            });
        };

        const mismatches = await validateQuestionTags(dataProvider, progressAdapter, { questionIds });
        
        // Convert to BatchOperationResult format
        return mismatches.map(m => ({
            id: m.id,
            status: 'warning' as const,
            message: `Current: ${m.current_type}, Suggested: ${m.suggested_type}`,
            details: {
                concept_id: m.concept_id,
                current_type: m.current_type,
                suggested_type: m.suggested_type,
                marks: m.marks,
                has_options: m.has_options,
                reasoning: m.reasoning
            }
        }));
    },

    renderResults: (results) => {
        if (results.length === 0) {
            return <Alert severity="success">All selected questions are correctly tagged!</Alert>;
        }

        return (
            <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Found {results.length} question(s) with potential tag mismatches.
                </Alert>
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Current</TableCell>
                                <TableCell>Suggested</TableCell>
                                <TableCell>Marks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {results.slice(0, 50).map(r => (
                                <TableRow key={r.id}>
                                    <TableCell>{r.id}</TableCell>
                                    <TableCell>{r.details?.current_type}</TableCell>
                                    <TableCell>{r.details?.suggested_type}</TableCell>
                                    <TableCell>{r.details?.marks}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {results.length > 50 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Showing first 50 of {results.length} mismatches. Download for full list.
                    </Typography>
                )}
            </>
        );
    },

    downloadResults: (results) => {
        // Convert back to ValidationResult format for download
        const validationResults = results.map(r => ({
            id: r.id,
            concept_id: r.details?.concept_id || 0,
            current_type: r.details?.current_type || '',
            suggested_type: r.details?.suggested_type || '',
            marks: r.details?.marks || 0,
            has_options: r.details?.has_options || false,
            reasoning: r.details?.reasoning || ''
        }));
        downloadCsv(validationResults);
    }
};

// Note: questionOperations array is exported at the end of the file after all operations are defined

export const generateSimilarOperation: BatchOperation = {
    id: 'generate-similar',
    name: 'Generate Similar',
    description: 'Create new questions by numeric cloning - changes numerical values while preserving structure. Generated questions are marked as "derived" and need verification.',

    execute: async (questionIds, dataProvider, onProgress) => {
        onProgress?.({ current: 0, total: questionIds.length, phase: 'Building question inputs...' });

        // Build inputs for all questions
        const inputs = await Promise.all(
            questionIds.map(async (id) => {
                const { data: record } = await dataProvider.getOne('questions', { id });
                return buildQuestionInput(dataProvider, record);
            })
        );

        onProgress?.({ current: 0, total: inputs.length, phase: 'Generating similar questions...' });

        const results = await generateSimilarBatch(inputs, {
            verify: true,
            concurrency: 4,
            onProgress: (completed, total) => {
                onProgress?.({ 
                    current: completed, 
                    total, 
                    phase: `Generated ${completed} of ${total}...` 
                });
            }
        });

        // Save successful generations
        const batchResults: BatchOperationResult[] = [];
        
        for (const result of results) {
            if (result.success && result.generated) {
                try {
                    const { data: originalRecord } = await dataProvider.getOne('questions', { id: result.original_id });
                    await dataProvider.create('questions', {
                        data: buildQuestionRecord(result.generated, originalRecord.concept_id, result.verification)
                    });
                    
                    batchResults.push({
                        id: result.original_id,
                        status: 'success',
                        message: 'Generated and saved',
                        details: {
                            verified: result.verification?.passes,
                            confidence: result.verification?.confidence,
                            notes: result.generated.generation_notes
                        }
                    });
                } catch (e: any) {
                    batchResults.push({
                        id: result.original_id,
                        status: 'error',
                        message: `Save failed: ${e.message}`
                    });
                }
            } else {
                batchResults.push({
                    id: result.original_id,
                    status: 'error',
                    message: result.error || 'Generation failed',
                    details: {
                        verification: result.verification
                    }
                });
            }
        }

        return batchResults;
    },

    renderResults: (results) => {
        const successes = results.filter(r => r.status === 'success');
        const errors = results.filter(r => r.status === 'error');

        return (
            <>
                {successes.length > 0 && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Successfully generated {successes.length} new question(s).
                    </Alert>
                )}
                {errors.length > 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.length} generation(s) failed.
                    </Alert>
                )}
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Original ID</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Verified</TableCell>
                                <TableCell>Notes</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {results.slice(0, 50).map(r => (
                                <TableRow key={r.id}>
                                    <TableCell>{r.id}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={r.status} 
                                            size="small" 
                                            color={r.status === 'success' ? 'success' : 'error'} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {r.details?.verified !== undefined && (
                                            <Chip 
                                                label={r.details.verified ? 'Yes' : 'No'} 
                                                size="small"
                                                color={r.details.verified ? 'success' : 'warning'}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                                            {r.details?.notes || r.message}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </>
        );
    }
};

export const convertToMCQOperation: BatchOperation = {
    id: 'convert-to-mcq',
    name: 'Convert to MCQ',
    description: 'Convert non-MCQ questions (VSA, SA, LA) to MCQ format. Creates new MCQ questions with 4 options based on the original answer.',

    execute: async (questionIds, dataProvider, onProgress) => {
        onProgress?.({ current: 0, total: questionIds.length, phase: 'Building question inputs...' });

        // Build inputs, filter out existing MCQs
        const allRecords = await Promise.all(
            questionIds.map(async (id) => {
                const { data: record } = await dataProvider.getOne('questions', { id });
                return record;
            })
        );
        
        const nonMcqRecords = allRecords.filter(r => r.type !== 'MCQ');
        const skippedMcqs = allRecords.filter(r => r.type === 'MCQ');

        if (nonMcqRecords.length === 0) {
            return skippedMcqs.map(r => ({
                id: r.id,
                status: 'warning' as const,
                message: 'Already MCQ - skipped'
            }));
        }

        const inputs = await Promise.all(
            nonMcqRecords.map(record => buildQuestionInput(dataProvider, record))
        );

        onProgress?.({ current: 0, total: inputs.length, phase: 'Converting to MCQ...' });

        const results = await convertToMCQBatch(inputs, {
            verify: true,
            concurrency: 4,
            onProgress: (completed, total) => {
                onProgress?.({ 
                    current: completed, 
                    total, 
                    phase: `Converted ${completed} of ${total}...` 
                });
            }
        });

        // Save successful conversions
        const batchResults: BatchOperationResult[] = skippedMcqs.map(r => ({
            id: r.id,
            status: 'warning' as const,
            message: 'Already MCQ - skipped'
        }));
        
        for (const result of results) {
            if (result.success && result.generated) {
                try {
                    const originalRecord = nonMcqRecords.find(r => r.id === result.original_id);
                    await dataProvider.create('questions', {
                        data: buildQuestionRecord(result.generated, originalRecord?.concept_id, result.verification)
                    });
                    
                    batchResults.push({
                        id: result.original_id,
                        status: 'success',
                        message: `Converted from ${originalRecord?.type} to MCQ`,
                        details: {
                            original_type: originalRecord?.type,
                            verified: result.verification?.passes,
                            confidence: result.verification?.confidence
                        }
                    });
                } catch (e: any) {
                    batchResults.push({
                        id: result.original_id,
                        status: 'error',
                        message: `Save failed: ${e.message}`
                    });
                }
            } else {
                batchResults.push({
                    id: result.original_id,
                    status: 'error',
                    message: result.error || 'Conversion failed',
                    details: {
                        verification: result.verification
                    }
                });
            }
        }

        return batchResults;
    },

    renderResults: (results) => {
        const successes = results.filter(r => r.status === 'success');
        const warnings = results.filter(r => r.status === 'warning');
        const errors = results.filter(r => r.status === 'error');

        return (
            <>
                {successes.length > 0 && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Successfully converted {successes.length} question(s) to MCQ.
                    </Alert>
                )}
                {warnings.length > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {warnings.length} question(s) were already MCQ and skipped.
                    </Alert>
                )}
                {errors.length > 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.length} conversion(s) failed.
                    </Alert>
                )}
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Original ID</TableCell>
                                <TableCell>Original Type</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Message</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {results.slice(0, 50).map(r => (
                                <TableRow key={r.id}>
                                    <TableCell>{r.id}</TableCell>
                                    <TableCell>{r.details?.original_type || '-'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={r.status} 
                                            size="small" 
                                            color={
                                                r.status === 'success' ? 'success' : 
                                                r.status === 'warning' ? 'warning' : 'error'
                                            } 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">
                                            {r.message}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </>
        );
    }
};

// Export all question operations
export const questionOperations: BatchOperation[] = [
    validateTagsOperation,
    generateSimilarOperation,
    convertToMCQOperation,
];