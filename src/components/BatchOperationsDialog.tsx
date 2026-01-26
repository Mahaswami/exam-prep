import { useState, useEffect } from 'react';
import { useDataProvider } from 'react-admin';
import { openDialog, closeDialog } from '@mahaswami/swan-frontend';
import { BugReport } from '@mui/icons-material';
import {
    Box, Button, LinearProgress, Typography, Alert,
    MenuItem as MuiMenuItem, ListItemIcon, ListItemText,
    FormControl, InputLabel, Select,
    Table, TableHead, TableBody, TableRow, TableCell,
    Checkbox, TableContainer, Paper
} from '@mui/material';

export type BatchOperationResult = {
    id: number;
    status: 'success' | 'warning' | 'error';
    message: string;
    details?: Record<string, any>;
};

export type BatchOperationProgress = {
    current: number;
    total: number;
    phase: string;
};

export type BatchOperation = {
    id: string;
    name: string;
    description?: string;
    execute: (
        questionIds: number[],
        dataProvider: any,
        onProgress?: (progress: BatchOperationProgress) => void
    ) => Promise<BatchOperationResult[]>;
    renderResults?: (results: BatchOperationResult[]) => React.ReactNode;
    downloadResults?: (results: BatchOperationResult[]) => void;
};

type Question = {
    id: number;
    type: string;
    concept_id: number;
};

type Chapter = { id: number; name: string };
type Concept = { id: number; name: string; chapter_id: number };

interface BatchOperationsDialogContentProps {
    operations: BatchOperation[];
    typeChoices: Array<{ id: string; name: string }>;
    minWidth?: number;
}

const BatchOperationsDialogContent = ({ operations, typeChoices }: BatchOperationsDialogContentProps) => {
    const dataProvider = useDataProvider();
    const [phase, setPhase] = useState<'select' | 'running' | 'results'>('select');
    const [progress, setProgress] = useState<BatchOperationProgress | null>(null);
    const [results, setResults] = useState<BatchOperationResult[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Operation state
    const [selectedOperation, setSelectedOperation] = useState<string>(operations[0]?.id || '');

    // Filter state
    const [chapterId, setChapterId] = useState<number | ''>('');
    const [conceptId, setConceptId] = useState<number | ''>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    
    // Data for dropdowns
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);

    const filteredConcepts = chapterId ? concepts.filter(c => c.chapter_id === chapterId) : concepts;
    const chapterConceptIds = chapterId ? new Set(filteredConcepts.map(c => c.id)) : null;
    const filteredQuestions = questions.filter(q => {
        if (chapterConceptIds && !chapterConceptIds.has(q.concept_id)) return false;
        if (conceptId && q.concept_id !== conceptId) return false;
        if (typeFilter && q.type !== typeFilter) return false;
        return true;
    });

    const currentOperation = operations.find(op => op.id === selectedOperation);

    useEffect(() => {
        (async () => {
            try {
                const [chaptersRes, conceptsRes, questionsRes] = await Promise.all([
                    dataProvider.getList('chapters', { pagination: { page: 1, perPage: 1000 }, sort: { field: 'name', order: 'ASC' }, filter: {} }),
                    dataProvider.getList('concepts', { pagination: { page: 1, perPage: 5000 }, sort: { field: 'name', order: 'ASC' }, filter: {} }),
                    dataProvider.getList('questions', { pagination: { page: 1, perPage: 10000 }, sort: { field: 'id', order: 'ASC' }, filter: {} })
                ]);
                setChapters(chaptersRes.data);
                setConcepts(conceptsRes.data);
                setQuestions(questionsRes.data);
            } catch (e: any) {
                setError(e.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        })();
    }, [dataProvider]);

    const handleSelectAll = () => {
        if (selectedIds.size === filteredQuestions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
        }
    };

    const handleToggle = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleRun = async () => {
        if (selectedIds.size === 0 || !currentOperation) return;
        setPhase('running');
        setProgress({ current: 0, total: 0, phase: 'Starting...' });
        
        try {
            const opResults = await currentOperation.execute(
                Array.from(selectedIds),
                dataProvider,
                setProgress
            );
            setResults(opResults);
            setPhase('results');
        } catch (e: any) {
            setError(e.message || 'Operation failed');
            setPhase('results');
        }
    };

    const handleDownload = () => {
        if (results && currentOperation?.downloadResults) {
            currentOperation.downloadResults(results);
        }
    };

    const handleBack = () => {
        setPhase('select');
        setResults(null);
        setError(null);
    };

    const isRunning = phase === 'running';
    const progressPercent = progress?.total ? (progress.current / progress.total) * 100 : 0;

    const renderDefaultResults = (results: BatchOperationResult[]) => {
        const warnings = results.filter(r => r.status === 'warning');
        const errors = results.filter(r => r.status === 'error');
        const successes = results.filter(r => r.status === 'success');

        return (
            <>
                {errors.length > 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.length} error(s) occurred.
                    </Alert>
                )}
                {warnings.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {warnings.length} warning(s) found.
                    </Alert>
                )}
                {successes.length > 0 && errors.length === 0 && warnings.length === 0 && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        All {successes.length} items processed successfully.
                    </Alert>
                )}
                {(warnings.length > 0 || errors.length > 0) && (
                    <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Message</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[...errors, ...warnings].slice(0, 50).map(r => (
                                    <TableRow key={r.id}>
                                        <TableCell>{r.id}</TableCell>
                                        <TableCell>{r.status}</TableCell>
                                        <TableCell>{r.message}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </>
        );
    };

    return (
        <Box sx={{ p: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {phase === 'select' && (
                <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Operation</InputLabel>
                            <Select
                                value={selectedOperation}
                                label="Operation"
                                onChange={(e) => setSelectedOperation(e.target.value)}
                            >
                                {operations.map(op => (
                                    <MuiMenuItem key={op.id} value={op.id}>{op.name}</MuiMenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Chapter</InputLabel>
                            <Select
                                value={chapterId}
                                label="Chapter"
                                onChange={(e) => { setChapterId(e.target.value as number | ''); setConceptId(''); }}
                            >
                                <MuiMenuItem value=""><em>All</em></MuiMenuItem>
                                {chapters.map(ch => <MuiMenuItem key={ch.id} value={ch.id}>{ch.name}</MuiMenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Concept</InputLabel>
                            <Select
                                value={conceptId}
                                label="Concept"
                                onChange={(e) => setConceptId(e.target.value as number | '')}
                            >
                                <MuiMenuItem value=""><em>All</em></MuiMenuItem>
                                {filteredConcepts.map(c => <MuiMenuItem key={c.id} value={c.id}>{c.name}</MuiMenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={typeFilter}
                                label="Type"
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <MuiMenuItem value=""><em>All</em></MuiMenuItem>
                                {typeChoices.map(t => <MuiMenuItem key={t.id} value={t.id}>{t.name}</MuiMenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>

                    {currentOperation?.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {currentOperation.description}
                        </Typography>
                    )}
                    
                    {loading ? (
                        <LinearProgress />
                    ) : (
                        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0}
                                                indeterminate={selectedIds.size > 0 && selectedIds.size < filteredQuestions.length}
                                                onChange={handleSelectAll}
                                            />
                                        </TableCell>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Marks</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredQuestions.slice(0, 200).map(q => (
                                        <TableRow key={q.id} hover onClick={() => handleToggle(q.id)} sx={{ cursor: 'pointer' }}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedIds.has(q.id)}
                                                    onChange={() => handleToggle(q.id)}
                                                />
                                            </TableCell>
                                            <TableCell>{q.id}</TableCell>
                                            <TableCell>{typeChoices.find(c => c.id === q.type)?.name || q.type}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                    {filteredQuestions.length > 200 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Showing 200 of {filteredQuestions.length} questions. Use filters to narrow down.
                        </Typography>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Typography variant="body2">
                            {selectedIds.size} question(s) selected
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                                onClick={handleRun} 
                                variant="contained" 
                                disabled={selectedIds.size === 0 || !currentOperation}
                            >
                                Run {currentOperation?.name} ({selectedIds.size})
                            </Button>
                            <Button onClick={() => closeDialog()}>Close</Button>
                        </Box>
                    </Box>
                </>
            )}
            
            {phase === 'running' && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                        {progress?.phase || 'Processing...'}
                        {progress?.total ? ` (${progress.current} of ${progress.total})` : ''}
                    </Typography>
                    <LinearProgress 
                        variant={progress?.total ? 'determinate' : 'indeterminate'} 
                        value={progressPercent} 
                    />
                </Box>
            )}
            
            {phase === 'results' && results && (
                <Box sx={{ mt: 2 }}>
                    {currentOperation?.renderResults 
                        ? currentOperation.renderResults(results)
                        : renderDefaultResults(results)
                    }
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                        {currentOperation?.downloadResults && results.length > 0 && (
                            <Button onClick={handleDownload} color="primary">Download Results</Button>
                        )}
                        <Button onClick={handleBack}>Back</Button>
                        <Button onClick={() => closeDialog()}>Close</Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

interface BatchOperationsMenuItemProps {
    operations: BatchOperation[];
    typeChoices: Array<{ id: string; name: string }>;
    menuLabel?: string;
    dialogTitle?: string;
}

export const BatchOperationsMenuItem = ({ 
    operations, 
    typeChoices,
    menuLabel = 'Batch Operations',
    dialogTitle = 'Batch Operations'
}: BatchOperationsMenuItemProps) => {
    const handleOpen = () => {
        openDialog(
            <BatchOperationsDialogContent operations={operations} typeChoices={typeChoices} width={"70vw"} />,
            { Title: dialogTitle }
        );
    };

    return (
        <MuiMenuItem onClick={handleOpen}>
            <ListItemIcon><BugReport fontSize="small" /></ListItemIcon>
            <ListItemText>{menuLabel}</ListItemText>
        </MuiMenuItem>
    );
};
