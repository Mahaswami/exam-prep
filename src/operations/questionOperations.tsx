import { validateQuestionTags, downloadCsv, type ValidatorProgress } from '../services/questionTagValidator';
import type { BatchOperation, BatchOperationResult, BatchOperationProgress } from '../components/BatchOperationsDialog';
import { Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, Alert, Typography } from '@mui/material';

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

// Export all question operations
export const questionOperations: BatchOperation[] = [
    validateTagsOperation,
    // Future operations can be added here:
    // bulkUpdateTypeOperation,
    // exportSelectedOperation,
    // regenerateContentOperation,
];
