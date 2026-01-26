import { useState, useEffect, useRef } from 'react';
import { useDataProvider, useNotify, useRefresh, useRecordContext } from 'react-admin';
import { openDialog, closeDialog } from '@mahaswami/swan-frontend';
import {
    Box, Button, Typography, Alert, CircularProgress,
    Divider, Chip, IconButton, Tooltip, Paper,
    FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
    Accordion, AccordionSummary, AccordionDetails,
    Autocomplete, TextField
} from '@mui/material';
import {
    Compare as CompareIcon,
    Refresh as RefreshIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    ContentCopy as CopyIcon,
    AutoFixHigh as GenerateIcon,
    History as HistoryIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { QuestionDisplay } from './QuestionDisplay';
import {
    generateSimilar,
    convertToMCQ,
    buildQuestionInput,
    verifyGeneration,
    saveGeneratedQuestion,
    type QuestionInput,
    type GenerationResult,
    type Operation,
    type VerificationResult,
    type Difficulty
} from '../services/QuestionAIService';

const serializeStream = (stream: any): string => {
    if (Array.isArray(stream)) return JSON.stringify(stream);
    if (typeof stream === 'string') return stream;
    return JSON.stringify(stream);
};

interface DerivationChanges {
    type_change?: { from: string; to: string };
    difficulty_change?: { from: string; to: string };
    concept_change?: { from: number; to: number };
    generation_notes?: string;
    verification?: VerificationResult;
}

interface GenerateModeProps {
    mode: 'generate';
    questionRecord: any;
    operation: Operation;
    targetDifficulty?: Difficulty;
    targetConceptId?: number;
    onSaved?: () => void;
}

interface ViewModeProps {
    mode: 'view';
    derivedQuestionId: number;
}

type QuestionComparisonDialogProps = GenerateModeProps | ViewModeProps;

const VerificationBadge = ({ verification, isVerifying }: { verification?: GenerationResult['verification']; isVerifying?: boolean }) => {
    if (isVerifying) {
        return (
            <Chip
                icon={<CircularProgress size={14} />}
                label="Verifying..."
                color="default"
                size="small"
            />
        );
    }
    
    if (!verification) return null;

    const { passes, confidence, checks } = verification;
    const failedChecks = Object.entries(checks)
        .filter(([_, v]) => !v)
        .map(([k]) => k.replace(/_/g, ' '));

    return (
        <Tooltip title={
            !passes && failedChecks.length > 0 
                ? `Failed: ${failedChecks.join(', ')}` 
                : verification.issues?.length > 0 
                    ? verification.issues.join('; ') 
                    : ''
        }>
            <Chip
                icon={passes ? <CheckIcon /> : <CloseIcon />}
                label={passes ? `Verified ${Math.round(confidence * 100)}%` : 'Failed'}
                color={passes ? 'success' : 'error'}
                size="small"
            />
        </Tooltip>
    );
};

const QuestionPanel = ({ 
    title, 
    question, 
    isGenerated = false,
    verification,
    isVerifying = false
}: { 
    title: string; 
    question: any;
    isGenerated?: boolean;
    verification?: GenerationResult['verification'];
    isVerifying?: boolean;
}) => {
    return (
        <Paper 
            elevation={isGenerated ? 3 : 1} 
            sx={{ 
                p: 2, 
                height: '100%',
                border: isGenerated ? '2px solid' : '1px solid',
                borderColor: isGenerated ? 'primary.main' : 'divider'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                    {title}
                    {isGenerated && (
                        <Chip label="Generated" size="small" color="primary" sx={{ ml: 1 }} />
                    )}
                </Typography>
                {isGenerated && (isVerifying || verification) && (
                    <VerificationBadge verification={verification} isVerifying={isVerifying} />
                )}
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            <QuestionDisplay
                question={question}
                mode="view"
                showSolution
                showHint
                showCorrectAnswer
                compact
            />
            
            {question.generation_notes && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="caption">
                        <strong>Changes:</strong> {question.generation_notes}
                    </Typography>
                </Alert>
            )}
        </Paper>
    );
};

const QuestionComparisonDialogContent = ({ 
    questionRecord, 
    operation,
    targetDifficulty,
    targetConceptId,
    onSaved 
}: GenerateModeProps) => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const refresh = useRefresh();
    
    const [phase, setPhase] = useState<'loading' | 'generating' | 'preview' | 'saving' | 'error'>('loading');
    const [originalInput, setOriginalInput] = useState<QuestionInput | null>(null);
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [verification, setVerification] = useState<VerificationResult | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasStarted = useRef(false);

    const operationLabel = operation === 'generate-similar' ? 'Generate Similar' : 'Convert to MCQ';

    useEffect(() => {
        if (hasStarted.current) return;
        hasStarted.current = true;
        loadAndGenerate();
    }, []);

    const loadAndGenerate = async () => {
        try {
            setPhase('loading');
            setError(null);
            setVerification(null);
            setIsVerifying(false);
            
            // Build full question input with context
            const input = await buildQuestionInput(dataProvider, questionRecord);
            setOriginalInput(input);
            
            setPhase('generating');
            
            // Execute operation WITHOUT verification (we'll do it async)
            const opResult = operation === 'generate-similar'
                ? await generateSimilar(input, { verify: false, targetDifficulty })
                : await convertToMCQ(input, { verify: false });
            
            setResult(opResult);
            
            if (opResult.success && opResult.generated) {
                // Show preview immediately
                setPhase('preview');
                
                // Start async verification
                setIsVerifying(true);
                verifyGeneration(input, opResult.generated, operation, targetDifficulty)
                    .then((verificationResult) => {
                        setVerification(verificationResult);
                        setIsVerifying(false);
                    })
                    .catch((e) => {
                        console.error('[QuestionComparisonDialog] Verification error:', e);
                        setIsVerifying(false);
                    });
            } else {
                setError(opResult.error || 'Generation failed');
                setPhase('error');
            }
        } catch (e: any) {
            setError(e.message || 'Unknown error');
            setPhase('error');
        }
    };

    const handleRetry = () => {
        loadAndGenerate();
    };

    const handleSave = async () => {
        if (!result?.generated || !originalInput) return;
        
        try {
            setPhase('saving');
            
            await saveGeneratedQuestion(dataProvider, questionRecord, result.generated, {
                operation,
                targetConceptId,
                verification: verification || undefined
            });
            
            notify('Question saved successfully!', { type: 'success' });
            refresh();
            closeDialog();
            onSaved?.();
        } catch (e: any) {
            notify(`Save failed: ${e.message}`, { type: 'error' });
            setPhase('preview');
        }
    };

    const handleCopyToClipboard = () => {
        if (!result?.generated) return;
        navigator.clipboard.writeText(JSON.stringify(result.generated, null, 2));
        notify('Copied to clipboard', { type: 'info' });
    };

    const generatedDisplayQuestion = result?.generated ? {
        id: 0,
        type: result.generated.type,
        difficulty: result.generated.difficulty,
        question_stream: serializeStream(result.generated.question_stream),
        answer_stream: serializeStream(result.generated.answer_stream),
        options: result.generated.options,
        correct_option: result.generated.correct_option,
        final_answer: result.generated.final_answer,
        hint: result.generated.hint,
        generation_notes: result.generated.generation_notes
    } : null;

    return (
        <Box sx={{ p: 2, minWidth: '80vw', maxWidth: '95vw' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    <CompareIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {operationLabel} - Question #{questionRecord.id}
                </Typography>
                <Box>
                    {phase === 'preview' && (
                        <>
                            <Tooltip title="Copy Generated JSON">
                                <IconButton onClick={handleCopyToClipboard} size="small">
                                    <CopyIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Regenerate">
                                <IconButton onClick={handleRetry} size="small">
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {/* Loading/Generating State */}
            {(phase === 'loading' || phase === 'generating') && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    <CircularProgress size={48} />
                    <Typography sx={{ mt: 2 }}>
                        {phase === 'loading' ? 'Loading question context...' : 'Generating new question...'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        This may take 10-30 seconds
                    </Typography>
                </Box>
            )}
            
            {/* Error State */}
            {phase === 'error' && (
                <Box sx={{ py: 2 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button onClick={handleRetry} variant="contained" startIcon={<RefreshIcon />}>
                            Retry
                        </Button>
                        <Button onClick={() => closeDialog()}>
                            Cancel
                        </Button>
                    </Box>
                </Box>
            )}
            
            {/* Preview State - Side by Side */}
            {phase === 'preview' && generatedDisplayQuestion && (
                <>
                    <Box 
                        sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: 2,
                            maxHeight: '60vh',
                            overflow: 'auto'
                        }}
                    >
                        <QuestionPanel 
                            title="Original Question" 
                            question={questionRecord}
                        />
                        <QuestionPanel 
                            title="Generated Question" 
                            question={generatedDisplayQuestion}
                            isGenerated
                            verification={verification}
                            isVerifying={isVerifying}
                        />
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button 
                            onClick={handleRetry} 
                            startIcon={<RefreshIcon />}
                        >
                            Regenerate
                        </Button>
                        <Button onClick={() => closeDialog()}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            variant="contained" 
                            color="primary"
                            startIcon={<CheckIcon />}
                            disabled={isVerifying || (verification && !verification.passes)}
                        >
                            {isVerifying ? 'Verifying...' : 'Save as New Question'}
                        </Button>
                    </Box>
                    
                    {verification && !verification.passes && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Verification failed: {verification.issues?.join(', ') || 'Unknown issues'}. 
                            Review the issues above or regenerate.
                        </Alert>
                    )}
                </>
            )}
            
            {/* Saving State */}
            {phase === 'saving' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    <CircularProgress size={48} />
                    <Typography sx={{ mt: 2 }}>Saving question...</Typography>
                </Box>
            )}
        </Box>
    );
};

const ViewModeContent = ({ derivedQuestionId }: { derivedQuestionId: number }) => {
    const dataProvider = useDataProvider();
    const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
    const [sourceQuestion, setSourceQuestion] = useState<any>(null);
    const [derivedQuestion, setDerivedQuestion] = useState<any>(null);
    const [derivation, setDerivation] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDerivation();
    }, [derivedQuestionId]);

    const loadDerivation = async () => {
        try {
            setPhase('loading');
            
            const { data: derivations } = await dataProvider.getList('question_derivations', {
                filter: { derived_question_id: derivedQuestionId },
                pagination: { page: 1, perPage: 1 },
                sort: { field: 'id', order: 'DESC' }
            });
            
            if (!derivations || derivations.length === 0) {
                setError('No derivation record found');
                setPhase('error');
                return;
            }
            
            const derivationRecord = derivations[0];
            setDerivation(derivationRecord);
            
            const [sourceRes, derivedRes] = await Promise.all([
                dataProvider.getOne('questions', { id: derivationRecord.source_question_id }),
                dataProvider.getOne('questions', { id: derivedQuestionId })
            ]);
            
            setSourceQuestion(sourceRes.data);
            setDerivedQuestion(derivedRes.data);
            setPhase('ready');
        } catch (e: any) {
            setError(e.message || 'Failed to load derivation');
            setPhase('error');
        }
    };

    const parsedChanges: DerivationChanges | null = derivation?.changes 
        ? (typeof derivation.changes === 'string' ? JSON.parse(derivation.changes) : derivation.changes)
        : null;

    return (
        <Box sx={{ p: 2, minWidth: '80vw', maxWidth: '95vw' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Derivation History
                </Typography>
                {derivation && (
                    <Chip 
                        label={derivation.operation} 
                        color="primary" 
                        size="small" 
                    />
                )}
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {phase === 'loading' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    <CircularProgress size={48} />
                    <Typography sx={{ mt: 2 }}>Loading derivation...</Typography>
                </Box>
            )}
            
            {phase === 'error' && (
                <Alert severity="error">{error}</Alert>
            )}
            
            {phase === 'ready' && sourceQuestion && derivedQuestion && (
                <>
                    {parsedChanges && (
                        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {parsedChanges.type_change && (
                                <Chip 
                                    size="small" 
                                    label={`Type: ${parsedChanges.type_change.from} → ${parsedChanges.type_change.to}`} 
                                    color="info"
                                />
                            )}
                            {parsedChanges.difficulty_change && (
                                <Chip 
                                    size="small" 
                                    label={`Difficulty: ${parsedChanges.difficulty_change.from} → ${parsedChanges.difficulty_change.to}`} 
                                    color="warning"
                                />
                            )}
                            {parsedChanges.concept_change && (
                                <Chip 
                                    size="small" 
                                    label={`Concept: #${parsedChanges.concept_change.from} → #${parsedChanges.concept_change.to}`} 
                                    color="secondary"
                                />
                            )}
                            {parsedChanges.verification && (
                                <VerificationBadge verification={parsedChanges.verification} />
                            )}
                        </Box>
                    )}
                    
                    {parsedChanges?.generation_notes && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="caption">
                                <strong>Generation Notes:</strong> {parsedChanges.generation_notes}
                            </Typography>
                        </Alert>
                    )}
                    
                    <Box 
                        sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: 2,
                            maxHeight: '60vh',
                            overflow: 'auto'
                        }}
                    >
                        <QuestionPanel 
                            title={`Source Question #${sourceQuestion.id}`}
                            question={sourceQuestion}
                        />
                        <QuestionPanel 
                            title={`Derived Question #${derivedQuestion.id}`}
                            question={derivedQuestion}
                            isGenerated
                        />
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={() => closeDialog()}>
                            Close
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
};

interface GenerationOptions {
    operation: Operation;
    targetDifficulty?: Difficulty;
    targetConceptId?: number;
}

interface OptionsStepProps {
    questionRecord: any;
    concepts: any[];
    onGenerate: (options: GenerationOptions) => void;
    onCancel: () => void;
}

const OptionsStepContent = ({ questionRecord, concepts, onGenerate, onCancel }: OptionsStepProps) => {
    const [operation, setOperation] = useState<Operation>('generate-similar');
    const [difficultyChoice, setDifficultyChoice] = useState<'same' | Difficulty>('same');
    const [selectedConcept, setSelectedConcept] = useState<any>(null);
    
    const sourceDifficulty = questionRecord.difficulty as Difficulty;
    const isMCQ = questionRecord.type === 'MCQ';
    
    const handleGenerate = () => {
        onGenerate({
            operation,
            targetDifficulty: difficultyChoice === 'same' ? undefined : difficultyChoice,
            targetConceptId: selectedConcept?.id
        });
    };
    
    return (
        <Box sx={{ p: 2, minWidth: 400 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Generate Variant from Q#{questionRecord.id}
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
                <FormLabel component="legend">Operation</FormLabel>
                <RadioGroup
                    value={operation}
                    onChange={(e) => setOperation(e.target.value as Operation)}
                >
                    <FormControlLabel 
                        value="generate-similar" 
                        control={<Radio />} 
                        label="Similar (numeric clone)" 
                    />
                    <FormControlLabel 
                        value="convert-to-mcq" 
                        control={<Radio />} 
                        label="Convert to MCQ"
                        disabled={isMCQ}
                    />
                </RadioGroup>
            </FormControl>
            
            <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
                <FormLabel component="legend">Target Difficulty</FormLabel>
                <RadioGroup
                    value={difficultyChoice}
                    onChange={(e) => setDifficultyChoice(e.target.value as 'same' | Difficulty)}
                    row
                >
                    <FormControlLabel 
                        value="same" 
                        control={<Radio size="small" />} 
                        label={`Same (${sourceDifficulty})`} 
                    />
                    <FormControlLabel 
                        value="Easy" 
                        control={<Radio size="small" />} 
                        label="Easy"
                        disabled={sourceDifficulty === 'Easy'}
                    />
                    <FormControlLabel 
                        value="Medium" 
                        control={<Radio size="small" />} 
                        label="Medium"
                        disabled={sourceDifficulty === 'Medium'}
                    />
                    <FormControlLabel 
                        value="Hard" 
                        control={<Radio size="small" />} 
                        label="Hard"
                        disabled={sourceDifficulty === 'Hard'}
                    />
                </RadioGroup>
            </FormControl>
            
            <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2" color="text.secondary">
                        Advanced Options
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Autocomplete
                        options={concepts}
                        getOptionLabel={(option) => `#${option.id}: ${option.name}`}
                        value={selectedConcept}
                        onChange={(_, newValue) => setSelectedConcept(newValue)}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label="Target Concept (cross-concept generation)" 
                                placeholder="Same as source"
                                size="small"
                            />
                        )}
                        size="small"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Leave empty to keep the same concept as the source question.
                    </Typography>
                </AccordionDetails>
            </Accordion>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onCancel}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleGenerate}
                    startIcon={<GenerateIcon />}
                >
                    Generate
                </Button>
            </Box>
        </Box>
    );
};

const GenerateVariantDialogContent = ({ questionRecord, onSaved }: { questionRecord: any; onSaved?: () => void }) => {
    const dataProvider = useDataProvider();
    const [phase, setPhase] = useState<'options' | 'generating'>('options');
    const [concepts, setConcepts] = useState<any[]>([]);
    const [generationOptions, setGenerationOptions] = useState<GenerationOptions | null>(null);
    
    useEffect(() => {
        dataProvider.getList('concepts', {
            pagination: { page: 1, perPage: 500 },
            sort: { field: 'id', order: 'ASC' },
            filter: {}
        }).then(({ data }) => setConcepts(data));
    }, []);
    
    const handleGenerate = (options: GenerationOptions) => {
        setGenerationOptions(options);
        setPhase('generating');
    };
    
    if (phase === 'options') {
        return (
            <OptionsStepContent
                questionRecord={questionRecord}
                concepts={concepts}
                onGenerate={handleGenerate}
                onCancel={() => closeDialog()}
            />
        );
    }
    
    return (
        <QuestionComparisonDialogContent
            mode="generate"
            questionRecord={questionRecord}
            operation={generationOptions!.operation}
            targetDifficulty={generationOptions!.targetDifficulty}
            targetConceptId={generationOptions!.targetConceptId}
            onSaved={onSaved}
        />
    );
};

export const openGenerateVariantDialog = (questionRecord: any, onSaved?: () => void) => {
    openDialog(
        <GenerateVariantDialogContent questionRecord={questionRecord} onSaved={onSaved} />,
        { Title: 'Generate Variant' }
    );
};

export const openGenerateSimilarDialog = (questionRecord: any, onSaved?: () => void) => {
    openDialog(
        <QuestionComparisonDialogContent 
            mode="generate"
            questionRecord={questionRecord} 
            operation="generate-similar"
            onSaved={onSaved}
        />,
        { Title: 'Generate Similar Question' }
    );
};

export const openConvertToMCQDialog = (questionRecord: any, onSaved?: () => void) => {
    openDialog(
        <QuestionComparisonDialogContent 
            mode="generate"
            questionRecord={questionRecord} 
            operation="convert-to-mcq"
            onSaved={onSaved}
        />,
        { Title: 'Convert to MCQ' }
    );
};

export const openViewDerivationDialog = (derivedQuestionId: number) => {
    openDialog(
        <ViewModeContent derivedQuestionId={derivedQuestionId} />,
        { Title: 'View Derivation' }
    );
};

export const GenerateVariantButton = ({ label }: { label?: string }) => {
    const record = useRecordContext();
    const refresh = useRefresh();
    
    if (!record) return null;
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        openGenerateVariantDialog(record, refresh);
    };
    
    if (label) {
        return (
            <Button
                startIcon={<GenerateIcon />}
                onClick={handleClick}
                color="primary"
                size="small"
            >
                {label}
            </Button>
        );
    }
    
    return (
        <Tooltip title="Generate Variant">
            <IconButton size="small" onClick={handleClick} color="primary">
                <GenerateIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    );
};

export const GenerateSimilarButton = () => {
    const record = useRecordContext();
    const refresh = useRefresh();
    
    if (!record) return null;
    
    return (
        <Tooltip title="Generate Similar Question">
            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    openGenerateSimilarDialog(record, refresh);
                }}
            >
                <GenerateIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    );
};

export const ConvertToMCQButton = () => {
    const record = useRecordContext();
    const refresh = useRefresh();
    
    if (!record || record.type === 'MCQ') return null;
    
    return (
        <Tooltip title="Convert to MCQ">
            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    openConvertToMCQDialog(record, refresh);
                }}
                color="secondary"
            >
                <CompareIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    );
};

export const ViewDerivationButton = () => {
    const record = useRecordContext();
    
    if (!record || !record.is_derived) return null;
    
    return (
        <Tooltip title="View Derivation History">
            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    openViewDerivationDialog(record.id);
                }}
                color="info"
            >
                <HistoryIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    );
};

export const DerivationStatus = () => {
    const record = useRecordContext();
    
    if (!record) return null;
    
    if (record.is_derived) {
        return (
            <Chip
                icon={<HistoryIcon />}
                label="Derived • View Source"
                color="info"
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    openViewDerivationDialog(record.id);
                }}
                clickable
            />
        );
    }
    
    return <Chip label="Original" size="small" variant="outlined" />;
};
