import { useState, useEffect } from 'react';
import { useDataProvider } from 'react-admin';
import { openDialog, closeDialog } from '@mahaswami/swan-frontend';
import { AutoFixHigh as GenerateIcon } from '@mui/icons-material';
import {
    Box, Button, LinearProgress, Typography, Alert,
    MenuItem as MuiMenuItem, ListItemIcon, ListItemText,
    TextField,
    Table, TableHead, TableBody, TableRow, TableCell,
    Chip, Paper, Accordion, AccordionSummary, AccordionDetails,
    Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    Check as CheckIcon,
    Close as CloseIcon,
    ExpandMore as ExpandMoreIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import {
    executePlan,
    getQuestionCounts,
    verifyPlanOutcome,
    type GenerationPlan,
    type GenerationTask,
    type PlanTarget,
    type ConceptCount,
    type TaskResult,
    type PlanExecutionResult,
    type TargetVerification,
    type Operation,
    type Difficulty,
    type QuestionType
} from '../services/QuestionAIService';

type Phase = 'input' | 'preview' | 'running' | 'results';

interface BulkGeneratorDialogContentProps {
    minWidth?: number;
}

const SAMPLE_PLAN: GenerationPlan = {
    name: "Phase 2: Diagnostic MCQ Gaps",
    tasks: [
        { sourceQuestionId: 1, operation: 'convert-to-mcq', targetDifficulty: 'Medium' }
    ],
    targets: [
        { conceptId: 1, type: 'MCQ', difficulty: 'Medium', targetCount: 3 }
    ]
};

const BulkGeneratorDialogContent = ({ minWidth = 700 }: BulkGeneratorDialogContentProps) => {
    const dataProvider = useDataProvider();
    const [phase, setPhase] = useState<Phase>('input');
    const [inputTabIndex, setInputTabIndex] = useState(0);
    const [previewTabIndex, setPreviewTabIndex] = useState(0);
    
    // Plan input
    const [planJson, setPlanJson] = useState(JSON.stringify(SAMPLE_PLAN, null, 2));
    const [markdownTable, setMarkdownTable] = useState('');
    const [planName, setPlanName] = useState('Generated Plan');
    const [parseError, setParseError] = useState<string | null>(null);
    const [plan, setPlan] = useState<GenerationPlan | null>(null);
    const [isBuilding, setIsBuilding] = useState(false);
    
    // Execution state
    const [beforeCounts, setBeforeCounts] = useState<ConceptCount[]>([]);
    const [progress, setProgress] = useState({ completed: 0, total: 0 });
    const [stats, setStats] = useState({ success: 0, failed: 0 });
    const [taskResults, setTaskResults] = useState<TaskResult[]>([]);
    const [executionResult, setExecutionResult] = useState<PlanExecutionResult | null>(null);
    const [verification, setVerification] = useState<TargetVerification[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // First batch confirmation
    const [firstBatchConfirm, setFirstBatchConfirm] = useState<{
        show: boolean;
        successCount: number;
        failureCount: number;
        remaining: number;
        resolve?: (shouldContinue: boolean) => void;
    } | null>(null);
    
    // Data for preview and building
    const [conceptMap, setConceptMap] = useState<Map<number, string>>(new Map());
    const [concepts, setConcepts] = useState<any[]>([]);
    const [questionMap, setQuestionMap] = useState<Map<number, any>>(new Map());
    const [questions, setQuestions] = useState<any[]>([]);
    
    useEffect(() => {
        (async () => {
            try {
                const [conceptsRes, questionsRes] = await Promise.all([
                    dataProvider.getList('concepts', { 
                        pagination: { page: 1, perPage: 1000 }, 
                        sort: { field: 'name', order: 'ASC' }, 
                        filter: {} 
                    }),
                    dataProvider.getList('questions', { 
                        pagination: { page: 1, perPage: 10000 }, 
                        sort: { field: 'id', order: 'ASC' }, 
                        filter: { status: 'active' } 
                    })
                ]);
                setConceptMap(new Map(conceptsRes.data.map((c: any) => [c.id, c.name])));
                setConcepts(conceptsRes.data);
                setQuestionMap(new Map(questionsRes.data.map((q: any) => [q.id, q])));
                setQuestions(questionsRes.data);
                
                // Comprehensive question bank summary
                const chapters = await dataProvider.getList('chapters', { pagination: false });
                const chapterMap = new Map(chapters.data.map((c: any) => [c.id, c.name]));
                const conceptToChapter = new Map(conceptsRes.data.map((c: any) => [c.id, c.chapter_id]));
                
                console.log('=== QUESTION BANK SUMMARY ===\n');
                
                // Chapter-level
                console.log('--- BY CHAPTER ---');
                const chapterStats: any = {};
                questionsRes.data.forEach((q: any) => {
                    const chId = conceptToChapter.get(q.concept_id);
                    if (!chapterStats[chId]) chapterStats[chId] = { total: 0, mcq: 0, nonMcq: 0 };
                    chapterStats[chId].total++;
                    if (q.type === 'MCQ') chapterStats[chId].mcq++; else chapterStats[chId].nonMcq++;
                });
                Object.entries(chapterStats).forEach(([chId, s]: any) => {
                    console.log(`${chapterMap.get(Number(chId)) || `Ch${chId}`}: ${s.total} (${s.mcq} MCQ, ${s.nonMcq} Non-MCQ)`);
                });
                
                // Type breakdown
                console.log('\n--- BY TYPE ---');
                const typeStats: any = {};
                questionsRes.data.forEach((q: any) => {
                    if (!typeStats[q.type]) typeStats[q.type] = { E: 0, M: 0, H: 0, total: 0 };
                    typeStats[q.type].total++;
                    if (q.difficulty === 'Easy') typeStats[q.type].E++;
                    else if (q.difficulty === 'Medium') typeStats[q.type].M++;
                    else if (q.difficulty === 'Hard') typeStats[q.type].H++;
                });
                Object.entries(typeStats).forEach(([type, s]: any) => {
                    console.log(`${type}: ${s.total} (${s.E}E • ${s.M}M • ${s.H}H)`);
                });
                
                // Difficulty breakdown
                console.log('\n--- BY DIFFICULTY ---');
                const diffStats = { Easy: 0, Medium: 0, Hard: 0 };
                questionsRes.data.forEach((q: any) => { if (diffStats[q.difficulty as keyof typeof diffStats] !== undefined) diffStats[q.difficulty as keyof typeof diffStats]++; });
                console.log(`Easy: ${diffStats.Easy}, Medium: ${diffStats.Medium}, Hard: ${diffStats.Hard}`);
                
                // Original vs Derived (assume id <= 200 are original seeds)
                console.log('\n--- ORIGINAL vs DERIVED ---');
                const original = questionsRes.data.filter((q: any) => q.id <= 200).length;
                const derived = questionsRes.data.length - original;
                console.log(`Original (seed): ~${original}`);
                console.log(`AI-derived: ~${derived}`);
                console.log(`Total: ${questionsRes.data.length}`);
            } catch (e: any) {
                setError(e.message || 'Failed to load data');
            }
        })();
    }, [dataProvider]);
    
    // Parse markdown table and build plan
    const parseMarkdownTable = async () => {
        setIsBuilding(true);
        setParseError(null);
        
        try {
            const tasks: GenerationTask[] = [];
            const targets: PlanTarget[] = [];
            const skipped: string[] = [];
            
            const lines = markdownTable.trim().split('\n');
            const dataLines = lines.filter(line => 
                line.startsWith('|') && 
                !line.includes('---') && 
                !line.toLowerCase().startsWith('| concept') // skip header row only
            );
            
            for (const line of dataLines) {
                const cells = line.split('|').map(c => c.trim()).filter(Boolean);
                if (cells.length < 5) continue;
                
                // Parse: | Concept | Chapter | Current | Generate MCQ | Generate Non-MCQ | Source Strategy |
                const conceptMatch = cells[0].match(/(\d+)/);
                if (!conceptMatch) continue;
                const conceptId = parseInt(conceptMatch[1]);
                
                const mcqMatch = cells[3].match(/(\d+)\s*\(([^)]+)\)/);
                const nonMcqMatch = cells[4].match(/(\d+)\s*\(([^)]+)\)/);
                const sourceStrategy = cells[5].toLowerCase();
                
                // Determine source concept(s) and whether to allow MCQ sources
                let sourceConceptIds: number[] = [conceptId];
                let isCrossConceptGeneration = false;
                // Match MCQ->expand with various arrow styles (→, ->, ➔, etc.)
                let allowMcqSources = /mcq\s*[-→➔>]+\s*expand/i.test(sourceStrategy);
                console.log(`Concept ${conceptId}: sourceStrategy="${sourceStrategy}", allowMcqSources=${allowMcqSources}`);
                
                const fromConceptMatch = sourceStrategy.match(/from concept (\d+)/i);
                if (fromConceptMatch) {
                    sourceConceptIds = [parseInt(fromConceptMatch[1])];
                    isCrossConceptGeneration = true;
                } else if (sourceStrategy.includes('scratch')) {
                    // "From scratch" = use sibling concepts from same chapter
                    const chapterIdMatch = cells[1].match(/(\d+)/);
                    if (chapterIdMatch) {
                        const chapterId = parseInt(chapterIdMatch[1]);
                        const siblingConcepts = concepts
                            .filter(c => c.chapter_id === chapterId && c.id !== conceptId)
                            .map(c => c.id);
                        if (siblingConcepts.length > 0) {
                            sourceConceptIds = siblingConcepts;
                            isCrossConceptGeneration = true;
                        } else {
                            skipped.push(`Concept ${conceptId}: No sibling concepts in chapter ${chapterId}`);
                            continue;
                        }
                    }
                }
                
                // Get source questions from the source concept(s)
                // First try non-MCQ sources (preferred for better distractor generation)
                console.log(`Concept ${conceptId}: Looking in ${sourceConceptIds.join(',')}. Total questions loaded: ${questions.length}. Questions for concept 6:`, questions.filter(q => Number(q.concept_id) === 6));
                let sourceQuestions = questions.filter(q => 
                    sourceConceptIds.includes(Number(q.concept_id)) && 
                    q.type !== 'MCQ'
                );
                console.log(`Concept ${conceptId}: Non-MCQ sources found: ${sourceQuestions.length}`);
                
                // If no non-MCQ sources and strategy allows MCQ sources, include MCQs
                if (sourceQuestions.length === 0 && (allowMcqSources || sourceConceptIds.some(id => id !== conceptId))) {
                    sourceQuestions = questions.filter(q => 
                        sourceConceptIds.includes(Number(q.concept_id))
                    );
                    console.log(`Concept ${conceptId}: After MCQ fallback: ${sourceQuestions.length}`);
                }
                
                if (sourceQuestions.length === 0) {
                    skipped.push(`Concept ${conceptId}: No source questions found in concept(s) ${sourceConceptIds.join(', ')}`);
                    continue;
                }
                
                // Parse difficulty distribution like "2E/2M/2H"
                const parseDifficultyDist = (str: string): { Easy: number; Medium: number; Hard: number } => {
                    const result = { Easy: 0, Medium: 0, Hard: 0 };
                    const easyMatch = str.match(/(\d+)E/i);
                    const medMatch = str.match(/(\d+)M/i);
                    const hardMatch = str.match(/(\d+)H/i);
                    if (easyMatch) result.Easy = parseInt(easyMatch[1]);
                    if (medMatch) result.Medium = parseInt(medMatch[1]);
                    if (hardMatch) result.Hard = parseInt(hardMatch[1]);
                    return result;
                };
                
                // Generate MCQ tasks
                if (mcqMatch) {
                    const dist = parseDifficultyDist(mcqMatch[2]);
                    let qIndex = 0;
                    
                    for (const [difficulty, count] of Object.entries(dist)) {
                        for (let i = 0; i < count; i++) {
                            const sourceQ = sourceQuestions[qIndex % sourceQuestions.length];
                            // Use generate-similar for MCQ sources, convert-to-mcq for non-MCQ
                            const operation = sourceQ.type === 'MCQ' ? 'generate-similar' : 'convert-to-mcq';
                            tasks.push({
                                sourceQuestionId: sourceQ.id,
                                operation,
                                targetDifficulty: difficulty as Difficulty,
                                targetConceptId: isCrossConceptGeneration ? conceptId : undefined
                            });
                            targets.push({
                                conceptId,
                                type: 'MCQ',
                                difficulty: difficulty as Difficulty,
                                targetCount: 1
                            });
                            qIndex++;
                        }
                    }
                }
                
                // Generate Non-MCQ tasks (SA/VSA based on difficulty)
                if (nonMcqMatch) {
                    const dist = parseDifficultyDist(nonMcqMatch[2]);
                    let qIndex = 0;
                    
                    for (const [difficulty, count] of Object.entries(dist)) {
                        for (let i = 0; i < count; i++) {
                            const sourceQ = sourceQuestions[qIndex % sourceQuestions.length];
                            // For Non-MCQ: Easy->VSA, Medium/Hard->SA
                            const targetType = difficulty === 'Easy' ? 'VSA' : 'SA';
                            tasks.push({
                                sourceQuestionId: sourceQ.id,
                                operation: 'generate-similar',
                                targetDifficulty: difficulty as Difficulty,
                                targetType,
                                targetConceptId: isCrossConceptGeneration ? conceptId : undefined
                            });
                            targets.push({
                                conceptId,
                                type: 'non-MCQ',
                                difficulty: difficulty as Difficulty,
                                targetCount: 1
                            });
                            qIndex++;
                        }
                    }
                }
            }
            
            if (tasks.length === 0) {
                throw new Error('No tasks generated. Check table format or source availability.\n' + skipped.join('\n'));
            }
            
            const generatedPlan: GenerationPlan = {
                name: planName,
                tasks,
                targets
            };
            
            const warningMsg = skipped.length > 0 ? `\n\n/* Skipped:\n${skipped.join('\n')}\n*/` : '';
            setPlanJson(JSON.stringify(generatedPlan, null, 2) + warningMsg);
            setInputTabIndex(0); // Switch to JSON tab
            
        } catch (e: any) {
            setParseError(e.message);
        } finally {
            setIsBuilding(false);
        }
    };
    
    const validatePlanJson = () => {
        try {
            const parsed = JSON.parse(planJson) as GenerationPlan;
            if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
                console.error('❌ Invalid plan: no tasks array');
                return;
            }
            
            console.log('=== PLAN VALIDATION ===');
            console.log(`Total tasks: ${parsed.tasks.length}`);
            console.log(`Total targets: ${parsed.targets?.length ?? 0}`);
            
            const issues: string[] = [];
            const conceptStats: Record<number, { mcq: number; nonMcq: number }> = {};
            
            parsed.tasks.forEach((task, idx) => {
                const sourceQ = questionMap.get(task.sourceQuestionId);
                const target = parsed.targets?.[idx];
                const targetConceptId = target?.conceptId;
                
                if (!sourceQ) {
                    issues.push(`Task ${idx}: Source ID ${task.sourceQuestionId} NOT FOUND`);
                    return;
                }
                
                // Check if source is MCQ when operation is convert-to-mcq
                if (task.operation === 'convert-to-mcq' && sourceQ.type === 'MCQ') {
                    issues.push(`Task ${idx}: Source ${task.sourceQuestionId} is MCQ, cannot convert-to-mcq`);
                }
                
                // Check if source concept matches target concept
                if (targetConceptId && sourceQ.concept_id !== targetConceptId) {
                    issues.push(`Task ${idx}: Source ${task.sourceQuestionId} concept=${sourceQ.concept_id}, target concept=${targetConceptId} MISMATCH`);
                }
                
                // Collect stats per concept
                const cid = targetConceptId || sourceQ.concept_id;
                if (!conceptStats[cid]) conceptStats[cid] = { mcq: 0, nonMcq: 0 };
                if (target?.type === 'MCQ' || task.operation === 'convert-to-mcq' || task.operation === 'generate-similar') {
                    conceptStats[cid].mcq++;
                } else {
                    conceptStats[cid].nonMcq++;
                }
                
                console.log(`Task ${idx}: src=${task.sourceQuestionId} type=${sourceQ.type} concept=${sourceQ.concept_id} → ${task.operation} ${task.targetDifficulty || ''} target_concept=${targetConceptId || 'same'}`);
            });
            
            console.log('\n=== CONCEPT SUMMARY ===');
            Object.entries(conceptStats).sort((a, b) => Number(a[0]) - Number(b[0])).forEach(([cid, stats]) => {
                console.log(`Concept ${cid}: ${stats.mcq} MCQ, ${stats.nonMcq} Non-MCQ`);
            });
            
            if (issues.length > 0) {
                console.log('\n=== ❌ ISSUES ===');
                issues.forEach(i => console.error(i));
            } else {
                console.log('\n✅ All tasks valid');
            }
        } catch (e: any) {
            console.error('Parse error:', e.message);
        }
    };
    
    const parsePlan = () => {
        try {
            const parsed = JSON.parse(planJson) as GenerationPlan;
            if (!parsed.name || !parsed.tasks || !Array.isArray(parsed.tasks)) {
                throw new Error('Invalid plan: must have name and tasks array');
            }
            setPlan(parsed);
            setParseError(null);
            setPhase('preview');
        } catch (e: any) {
            setParseError(e.message);
        }
    };
    
    const startExecution = async () => {
        if (!plan) return;
        
        setPhase('running');
        setTaskResults([]);
        setError(null);
        setProgress({ completed: 0, total: plan.tasks.length });
        setStats({ success: 0, failed: 0 });
        
        try {
            const counts = await getQuestionCounts(dataProvider);
            setBeforeCounts(counts);
            
            const allResults: TaskResult[] = [];
            let lastBatchUpdate = 0;
            
            const result = await executePlan(dataProvider, plan, {
                concurrency: 12,
                onTaskStart: () => {},
                onProgress: (completed, total, task, taskResult) => {
                    allResults.push(taskResult);
                    const successCount = allResults.filter(r => r.success).length;
                    const failedCount = allResults.filter(r => !r.success).length;
                    // Only update every batch (4 tasks) to minimize re-renders
                    if (completed % 4 === 0 || completed === total) {
                        setProgress({ completed, total });
                        setStats({ success: successCount, failed: failedCount });
                        setTaskResults(allResults.slice(-5));
                    }
                },
                onFirstBatchComplete: (successCount, failureCount, remaining) => {
                    return new Promise<boolean>((resolve) => {
                        setFirstBatchConfirm({
                            show: true,
                            successCount,
                            failureCount,
                            remaining,
                            resolve
                        });
                    });
                },
                onComplete: (res) => {
                    setExecutionResult(res);
                    setTaskResults(allResults);
                }
            });
            
            if (plan.targets.length > 0) {
                const ver = await verifyPlanOutcome(dataProvider, plan, counts);
                setVerification(ver);
            }
            
            setPhase('results');
        } catch (e: any) {
            setError(e.message || 'Execution failed');
            setPhase('results');
        }
    };
    
    const renderInputPhase = () => (
        <Box sx={{ minWidth }}>
            <Typography variant="h6" gutterBottom>Bulk Question Generator</Typography>
            
            <Tabs value={inputTabIndex} onChange={(_, v) => setInputTabIndex(v)} sx={{ mb: 2 }}>
                <Tab label="JSON" />
                <Tab label="Markdown Table" />
            </Tabs>
            
            {inputTabIndex === 0 && (
                <>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Paste a generation plan JSON to execute bulk question generation with verification.
                    </Typography>
                    
                    <TextField
                        multiline
                        fullWidth
                        rows={20}
                        value={planJson}
                        onChange={(e) => setPlanJson(e.target.value)}
                        error={!!parseError}
                        helperText={parseError}
                        sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.85rem' } }}
                    />
                    
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button onClick={() => closeDialog()}>Cancel</Button>
                        <Button onClick={validatePlanJson}>Validate (Console)</Button>
                        <Button variant="contained" onClick={parsePlan}>Parse & Preview</Button>
                    </Box>
                </>
            )}
            
            {inputTabIndex === 1 && (
                <>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Paste a markdown table from the generation plan. Format:<br/>
                        <code>| Concept | Chapter | Generate MCQ | Generate Non-MCQ | Source Strategy |</code>
                    </Typography>
                    
                    <TextField
                        label="Plan Name"
                        fullWidth
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    
                    <TextField
                        multiline
                        fullWidth
                        rows={15}
                        placeholder={`| Concept | Chapter | Generate MCQ | Generate Non-MCQ | Source Strategy |
|---------|---------|--------------|------------------|-----------------|
| 24 (Advanced Trig) | 9 | 3 (1E/1M/1H) | 8 (2E/4M/2H) | From concept 22 |`}
                        value={markdownTable}
                        onChange={(e) => setMarkdownTable(e.target.value)}
                        error={!!parseError}
                        helperText={parseError}
                        sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.85rem' } }}
                    />
                    
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <strong>Source strategies:</strong><br/>
                        • "From concept X" → Uses questions from concept X as seeds<br/>
                        • "SA→MCQ" or similar → Uses same concept's questions<br/>
                        • "From scratch" → Uses sibling concepts from same chapter as seeds
                    </Alert>
                    
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button onClick={() => closeDialog()}>Cancel</Button>
                        <Button 
                            variant="contained" 
                            onClick={parseMarkdownTable}
                            disabled={isBuilding || !markdownTable.trim()}
                        >
                            {isBuilding ? 'Building...' : 'Build Plan'}
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
    
    const renderTasksTable = () => (
        <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell>Source ID</TableCell>
                        <TableCell>Current Type</TableCell>
                        <TableCell>Operation</TableCell>
                        <TableCell>Target Difficulty</TableCell>
                        <TableCell>Target Concept</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {plan!.tasks.map((task, i) => {
                        const q = questionMap.get(task.sourceQuestionId);
                        return (
                            <TableRow key={i} sx={{ opacity: q ? 1 : 0.5 }}>
                                <TableCell>{task.sourceQuestionId}</TableCell>
                                <TableCell>{q?.type || '?'}</TableCell>
                                <TableCell>
                                    <Chip 
                                        size="small" 
                                        label={task.operation === 'convert-to-mcq' ? 'To MCQ' : 'Similar'}
                                        color={task.operation === 'convert-to-mcq' ? 'secondary' : 'primary'}
                                    />
                                </TableCell>
                                <TableCell>{task.targetDifficulty || 'Same'}</TableCell>
                                <TableCell>
                                    {task.targetConceptId 
                                        ? conceptMap.get(task.targetConceptId) || task.targetConceptId 
                                        : 'Same'}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Paper>
    );
    
    const renderPreviewPhase = () => {
        if (!plan) return null;
        
        const invalidTasks = plan.tasks.filter(t => !questionMap.has(t.sourceQuestionId));
        
        return (
            <Box sx={{ minWidth }}>
                <Typography variant="h6" gutterBottom>{plan.name}</Typography>
                
                {invalidTasks.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {invalidTasks.length} task(s) reference non-existent questions: {invalidTasks.map(t => t.sourceQuestionId).join(', ')}
                    </Alert>
                )}
                
                <Tabs value={previewTabIndex} onChange={(_, v) => setPreviewTabIndex(v)} sx={{ mb: 2 }}>
                    <Tab label={`Tasks (${plan.tasks.length})`} />
                    <Tab label={`Targets (${plan.targets?.length || 0})`} />
                </Tabs>
                
                {previewTabIndex === 0 && renderTasksTable()}
                
                {previewTabIndex === 1 && (
                    <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Concept</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Difficulty</TableCell>
                                    <TableCell>Target Count</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(plan.targets || []).map((target, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{conceptMap.get(target.conceptId) || target.conceptId}</TableCell>
                                        <TableCell>{target.type}</TableCell>
                                        <TableCell>{target.difficulty}</TableCell>
                                        <TableCell>{target.targetCount}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                )}
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button onClick={() => setPhase('input')}>Back</Button>
                    <Button 
                        variant="contained" 
                        onClick={startExecution}
                        disabled={plan.tasks.length === 0}
                    >
                        Execute {plan.tasks.length} Tasks
                    </Button>
                </Box>
            </Box>
        );
    };
    
    const renderRunningPhase = () => {
        if (!plan) return null;
        
        return (
            <Box sx={{ minWidth }}>
                <Typography variant="h6" gutterBottom>
                    {plan.name} — Executing...
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                    <LinearProgress 
                        variant="determinate" 
                        value={progress.total > 0 ? (progress.completed / progress.total) * 100 : 0} 
                    />
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Typography variant="body2">
                            {progress.completed} / {progress.total} completed
                        </Typography>
                        {stats.success > 0 && (
                            <Typography variant="body2" color="success.main">
                                ✓ {stats.success} success
                            </Typography>
                        )}
                        {stats.failed > 0 && (
                            <Typography variant="body2" color="error">
                                ✗ {stats.failed} failed
                            </Typography>
                        )}
                    </Box>
                </Box>
                
                <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                    <Typography variant="subtitle2" gutterBottom>Recent:</Typography>
                    {taskResults.map((result, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                            {result.success 
                                ? <CheckIcon fontSize="small" color="success" />
                                : <CloseIcon fontSize="small" color="error" />
                            }
                            <Typography variant="body2">
                                Q#{result.task.sourceQuestionId}: {result.success ? `→ #${result.savedQuestionId}` : result.error}
                            </Typography>
                        </Box>
                    ))}
                </Paper>
                
                {/* First batch confirmation dialog */}
                <Dialog open={!!firstBatchConfirm?.show} maxWidth="sm" fullWidth>
                    <DialogTitle>First Batch Complete</DialogTitle>
                    <DialogContent>
                        <Typography sx={{ mb: 2 }}>
                            First batch has been processed. Please verify the created records before continuing.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Chip 
                                icon={<CheckIcon />} 
                                label={`${firstBatchConfirm?.successCount || 0} Success`} 
                                color="success" 
                            />
                            <Chip 
                                icon={<CloseIcon />} 
                                label={`${firstBatchConfirm?.failureCount || 0} Failed`} 
                                color={firstBatchConfirm?.failureCount ? "error" : "default"} 
                            />
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                            Remaining tasks: {firstBatchConfirm?.remaining || 0}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button 
                            onClick={() => {
                                firstBatchConfirm?.resolve?.(false);
                                setFirstBatchConfirm(null);
                            }}
                            color="inherit"
                        >
                            Stop Here
                        </Button>
                        <Button 
                            onClick={() => {
                                firstBatchConfirm?.resolve?.(true);
                                setFirstBatchConfirm(null);
                            }}
                            variant="contained"
                            color="primary"
                        >
                            Continue
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    };
    
    const renderResultsPhase = () => {
        const successTasks = taskResults.filter(r => r.success);
        const failedTasks = taskResults.filter(r => !r.success);
        
        return (
            <Box sx={{ minWidth }}>
                <Typography variant="h6" gutterBottom>Execution Complete</Typography>
                
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Chip 
                        icon={<CheckIcon />} 
                        label={`${successTasks.length} succeeded`} 
                        color="success" 
                    />
                    <Chip 
                        icon={<CloseIcon />} 
                        label={`${failedTasks.length} failed`} 
                        color={failedTasks.length > 0 ? 'error' : 'default'} 
                    />
                </Box>
                
                {verification && verification.length > 0 && (
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Target Verification</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Concept</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Difficulty</TableCell>
                                        <TableCell>Before</TableCell>
                                        <TableCell>After</TableCell>
                                        <TableCell>Target</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {verification.map((v, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{conceptMap.get(v.target.conceptId) || v.target.conceptId}</TableCell>
                                            <TableCell>{v.target.type}</TableCell>
                                            <TableCell>{v.target.difficulty}</TableCell>
                                            <TableCell>{v.beforeCount}</TableCell>
                                            <TableCell>{v.afterCount}</TableCell>
                                            <TableCell>{v.target.targetCount}</TableCell>
                                            <TableCell>
                                                {v.achieved 
                                                    ? <Chip size="small" icon={<CheckIcon />} label="Achieved" color="success" />
                                                    : <Chip size="small" icon={<WarningIcon />} label={`Gap: ${v.gap}`} color="warning" />
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </AccordionDetails>
                    </Accordion>
                )}
                
                {failedTasks.length > 0 && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Failed Tasks ({failedTasks.length})</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Source ID</TableCell>
                                        <TableCell>Source Type</TableCell>
                                        <TableCell>Operation</TableCell>
                                        <TableCell>Target Diff</TableCell>
                                        <TableCell>Target Concept</TableCell>
                                        <TableCell>Error</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {failedTasks.map((result, i) => {
                                        const sourceQ = questionMap.get(result.task.sourceQuestionId);
                                        return (
                                            <TableRow key={i}>
                                                <TableCell>{result.task.sourceQuestionId}</TableCell>
                                                <TableCell>{sourceQ?.type || '-'}</TableCell>
                                                <TableCell>{result.task.operation}</TableCell>
                                                <TableCell>{result.task.targetDifficulty || '-'}</TableCell>
                                                <TableCell>
                                                    {result.task.targetConceptId 
                                                        ? `${result.task.targetConceptId} (${conceptMap.get(result.task.targetConceptId) || '?'})`
                                                        : '-'
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {result.error}
                                                    {result.verificationIssues && (
                                                        <Box sx={{ mt: 0.5 }}>
                                                            {result.verificationIssues.map((issue, j) => (
                                                                <Typography key={j} variant="caption" display="block" color="error">
                                                                    • {issue}
                                                                </Typography>
                                                            ))}
                                                        </Box>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </AccordionDetails>
                    </Accordion>
                )}
                
                {successTasks.length > 0 && (
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Successful Tasks ({successTasks.length})</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2" color="textSecondary">
                                Created question IDs: {successTasks.map(r => r.savedQuestionId).join(', ')}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                )}
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button onClick={() => closeDialog()}>Close</Button>
                    {failedTasks.length > 0 && (
                        <Button 
                            variant="outlined" 
                            onClick={() => {
                                const retryPlan: GenerationPlan = {
                                    name: `${plan?.name} (Retry)`,
                                    tasks: failedTasks.map(r => r.task),
                                    targets: failedTasks.map(r => {
                                        const sourceQ = questionMap.get(r.task.sourceQuestionId);
                                        return {
                                            conceptId: sourceQ?.concept_id || 0,
                                            type: r.task.operation === 'convert-to-mcq' ? 'MCQ' : (sourceQ?.type || 'SA'),
                                            difficulty: r.task.targetDifficulty || 'Medium',
                                            targetCount: 1
                                        };
                                    })
                                };
                                setPlanJson(JSON.stringify(retryPlan, null, 2));
                                setPhase('input');
                                setTaskResults([]);
                                setVerification(null);
                            }}
                        >
                            Retry Failed ({failedTasks.length})
                        </Button>
                    )}
                </Box>
            </Box>
        );
    };
    
    return (
        <Box sx={{ p: 2 }}>
            {phase === 'input' && renderInputPhase()}
            {phase === 'preview' && renderPreviewPhase()}
            {phase === 'running' && renderRunningPhase()}
            {phase === 'results' && renderResultsPhase()}
        </Box>
    );
};

export function openBulkGeneratorDialog() {
    openDialog(
        <BulkGeneratorDialogContent />,
        { Title: 'Bulk Question Generator' }
    );
}

export const BulkGeneratorMenuItem = () => (
    <MuiMenuItem onClick={() => openBulkGeneratorDialog()}>
        <ListItemIcon><GenerateIcon /></ListItemIcon>
        <ListItemText primary="Bulk Generator" />
    </MuiMenuItem>
);
