import { AnalyticsDashboard, WidgetConfig, getLocalStorage } from '@mahaswami/swan-frontend';
import { useEffect, useMemo, useState } from 'react';
import {useDataProvider, useGetIdentity, useGetList, useNotify, useRedirect } from 'react-admin';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, Paper, Autocomplete, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';
import TimerIcon from '@mui/icons-material/Timer';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SearchIcon from '@mui/icons-material/Search';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Peak10Logo } from '../components/Peak10Logo';
import {createRevisionRoundForStudent} from "../logic/revisions.ts"
import {createTestRoundForStudent} from "../logic/tests.ts";
import { checkIfDiagnosticsExist } from '../logic/diagnostics.ts';


const STUDENT_WIDGETS: WidgetConfig[] = [
    // Row 1: Key metrics (4 KPIs)
    {
        id: 'concepts-mastered',
        type: 'kpi',
        title: 'Mastered',
        layout: { columnSpan: 3 },
        measures: [{ field: 'value', aggregation: 'sum' }],
        filters: { comfort_level: 'very_good' }
    },
    {
        id: 'concepts-good',
        type: 'kpi',
        title: 'Good',
        layout: { columnSpan: 3 },
        measures: [{ field: 'value', aggregation: 'sum' }],
        filters: { comfort_level: 'good' }
    },
    {
        id: 'concepts-needs-work',
        type: 'kpi',
        title: 'Needs Work',
        layout: { columnSpan: 3 },
        measures: [{ field: 'value', aggregation: 'sum' }],
        filters: { comfort_level: 'needs_improvement' }
    },
    {
        id: 'concepts-improved',
        type: 'kpi',
        title: 'Improved',
        layout: { columnSpan: 3 },
        measures: [{ field: 'value', aggregation: 'sum' }]
    },
    // Row 2: Gauge + Pie + Trend (4+4+4)
    {
        id: 'mastery-gauge',
        type: 'gauge',
        title: 'Mastery Rate',
        layout: { columnSpan: 4 },
        measures: [{ field: 'value', aggregation: 'avg' }],
        chartOptions: {
            target: 0.8,
            min: 0,
            max: 1,
            valueFormatter: (v: number) => `${(v * 100).toFixed(0)}%`
        }
    },
    {
        id: 'comfort-level-pie',
        type: 'pie',
        title: 'Comfort Level',
        layout: { columnSpan: 4 },
        dimensions: [{ field: 'comfort_level' }],
        measures: [{ field: 'id', aggregation: 'count' }],
        showPercentage: true
    },
    {
        id: 'progress-trend',
        type: 'area',
        title: 'Activity Over Time',
        layout: { columnSpan: 4 },
        dimensions: [{ field: 'updated_timestamp', bucket: 'day' }],
        measures: [{ field: 'id', aggregation: 'count', label: 'Updates' }],
        sort: { field: 'updated_timestamp', order: 'ASC' }
    },
    // Row 3: Chapter progress (full width)
    {
        id: 'progress-by-chapter',
        type: 'bar',
        title: 'Progress by Chapter',
        layout: { columnSpan: 12, height: 300 },
        dimensions: [{ field: 'chapter', label: 'Chapter' }],
        measures: [{ field: 'mastery', aggregation: 'avg', label: 'Mastery %', valueFormatter: (v: number) => `${(v * 100).toFixed(0)}%` }],
        chartOptions: { layout: 'horizontal' }
    }
];

type ActionType = 'diagnostic' | 'practice' | 'test' | null;

export const StudentDashboard = () => {
    const role = getLocalStorage('role');
    const isStudent = role === 'student';
    const { identity } = useGetIdentity();
    const dataProvider = useDataProvider();
    const navigate = useNavigate();
    const redirect = useRedirect();
    const notify = useNotify()
    const [searchParams] = useSearchParams();
    
    const [computedWidgets, setComputedWidgets] = useState<WidgetConfig[]>(STUDENT_WIDGETS);
    const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined);
    const [actionDialog, setActionDialog] = useState<ActionType>(null);
    const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
    const [selectedConceptId, setSelectedConceptId] = useState<number | null>(null);
    const [onboardingSubjectId, setOnboardingSubjectId] = useState<number | null>(null);
    const [onboardingChapterId, setOnboardingChapterId] = useState<number | null>(null);
    const [filterSubjectId, setFilterSubjectId] = useState<number | null>(null);
    
    const effectiveUserId = isStudent ? identity?.id : selectedStudentId;

    // Shared reference data - fetch once with hooks
    const { data: chapters = [], isLoading: chaptersLoading } = useGetList('chapters', {
        pagination: { page: 1, perPage: 1000 },
        meta: { prefetch: ['subjects'] },
        sort: { field: 'sequence_number', order: 'ASC' },
        filter: {}
    });

    const { data: concepts = [], isLoading: conceptsLoading } = useGetList('concepts', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'id', order: 'ASC' },
        filter: {}
    });

    const { data: subjects = [] } = useGetList('subjects', {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'name', order: 'ASC' },
        filter: {}
    });

    useEffect(() => {
        const computeMasteryData = async () => {
            if (chaptersLoading || conceptsLoading || !effectiveUserId) return;
            
            try {
                const scoresRes = await dataProvider.getList('concept_scores', {
                    pagination: { page: 1, perPage: 1000 },
                    sort: { field: 'id', order: 'ASC' },
                    filter: { user_id: effectiveUserId }
                });
                
                const data = scoresRes.data;
                
                // Filter by subject if selected
                const filteredChapters = filterSubjectId 
                    ? chapters.filter((c: any) => c.subject_id === filterSubjectId)
                    : chapters;
                const filteredChapterIds = new Set(filteredChapters.map((c: any) => c.id));
                const filteredConcepts = concepts.filter((c: any) => filteredChapterIds.has(c.chapter_id));
                const filteredConceptIds = new Set(filteredConcepts.map((c: any) => c.id));
                const filteredData = filterSubjectId 
                    ? data.filter((d: any) => filteredConceptIds.has(d.concept_id))
                    : data;
                
                // Build lookup maps
                const conceptToChapter = new Map(filteredConcepts.map((c: any) => [c.id, c.chapter_id]));
                const chapterNames = new Map(filteredChapters.map((c: any) => [c.id, c.name]));
                
                const total = filteredData.length;
                const mastered = filteredData.filter((d: any) => d.comfort_level === 'very_good').length;
                const masteryRate = total > 0 ? mastered / total : 0;
                
                // Count improved: current level > initial level
                const levelOrder = { 'needs_improvement': 0, 'good': 1, 'very_good': 2 };
                const improved = filteredData.filter((d: any) => {
                    if (!d.initial_comfort_level) return false;
                    return (levelOrder[d.comfort_level as keyof typeof levelOrder] || 0) > 
                           (levelOrder[d.initial_comfort_level as keyof typeof levelOrder] || 0);
                }).length;

                // Compute progress by chapter
                const chapterStats = new Map<number, { total: number; mastered: number }>();
                filteredData.forEach((d: any) => {
                    const chapterId = conceptToChapter.get(d.concept_id);
                    if (!chapterId) return;
                    const stats = chapterStats.get(chapterId) || { total: 0, mastered: 0 };
                    stats.total++;
                    if (d.comfort_level === 'very_good') stats.mastered++;
                    chapterStats.set(chapterId, stats);
                });
                
                const chapterProgressData = Array.from(chapterStats.entries()).map(([chapterId, stats]) => {
                    const name = chapterNames.get(chapterId) || `Chapter ${chapterId}`;
                    const truncated = name.length > 25 ? name.slice(0, 24) + '…' : name;
                    return {
                        id: chapterId,
                        chapter: truncated,
                        mastery: stats.total > 0 ? stats.mastered / stats.total : 0,
                        total: stats.total,
                        mastered: stats.mastered
                    };
                });

                // Count by comfort level for KPI widgets
                const masteredCount = filteredData.filter((d: any) => d.comfort_level === 'very_good').length;
                const goodCount = filteredData.filter((d: any) => d.comfort_level === 'good').length;
                const needsWorkCount = filteredData.filter((d: any) => d.comfort_level === 'needs_improvement').length;

                // Pie chart data for comfort level distribution
                const comfortLevelData = [
                    { comfort_level: 'very_good', id: masteredCount },
                    { comfort_level: 'good', id: goodCount },
                    { comfort_level: 'needs_improvement', id: needsWorkCount }
                ].filter(d => d.id > 0);

                // Trend data: group by day
                const trendByDay = new Map<string, number>();
                filteredData.forEach((d: any) => {
                    if (!d.updated_timestamp) return;
                    const day = d.updated_timestamp.split('T')[0];
                    trendByDay.set(day, (trendByDay.get(day) || 0) + 1);
                });
                const trendData = Array.from(trendByDay.entries())
                    .map(([day, count]) => ({ updated_timestamp: day, id: count }))
                    .sort((a, b) => a.updated_timestamp.localeCompare(b.updated_timestamp));

                const updatedWidgets = STUDENT_WIDGETS.map(widget => {
                    if (widget.id === 'concepts-mastered') {
                        return { ...widget, mockData: [{ value: masteredCount }] };
                    }
                    if (widget.id === 'concepts-good') {
                        return { ...widget, mockData: [{ value: goodCount }] };
                    }
                    if (widget.id === 'concepts-needs-work') {
                        return { ...widget, mockData: [{ value: needsWorkCount }] };
                    }
                    if (widget.id === 'concepts-improved') {
                        return { ...widget, mockData: [{ value: improved }] };
                    }
                    if (widget.id === 'mastery-gauge') {
                        return { ...widget, mockData: [{ value: masteryRate }] };
                    }
                    if (widget.id === 'comfort-level-pie') {
                        return { ...widget, mockData: comfortLevelData };
                    }
                    if (widget.id === 'progress-trend') {
                        return { ...widget, mockData: trendData };
                    }
                    if (widget.id === 'progress-by-chapter') {
                        return { ...widget, mockData: chapterProgressData };
                    }
                    return widget;
                });
                
                setComputedWidgets(updatedWidgets);
            } catch (error) {
                console.error('Error computing mastery data:', error);
            }
        };
        
        computeMasteryData();
    }, [dataProvider, effectiveUserId, filterSubjectId, chapters, concepts, chaptersLoading, conceptsLoading]);

    
    // Fetch users for admin student picker
    const { data: users = [] } = useGetList('users', {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'first_name', order: 'ASC' },
        filter: { role: 'student' }
    }, { enabled: !isStudent });

    const { data: diagnosticTests = [], isLoading: loadingDiagnostics } = useGetList('diagnostic_tests', {
        pagination: { page: 1, perPage: 1 },
        sort: { field: 'id', order: 'DESC' },
        filter: effectiveUserId ? { user_id: effectiveUserId } : {}
    }, { enabled: !!effectiveUserId });

    const chaptersForSubject = chapters.filter((c: any) => c.subject_id === onboardingSubjectId);

    const { data: conceptsForChapter = [] } = useGetList('concepts', {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'name', order: 'ASC' },
        filter: selectedChapterId ? { chapter_id: selectedChapterId } : {}
    }, { enabled: !!selectedChapterId && actionDialog !== 'diagnostic' });

    // For admin without selected student, show message in computed widgets
    const displayWidgets = (!isStudent && !selectedStudentId) 
        ? computedWidgets.map(w => {
            if (['mastery-gauge', 'concepts-improved', 'progress-by-chapter'].includes(w.id)) {
                return { ...w, mockData: [] }; // Empty data shows "No data"
            }
            return w;
        })
        : computedWidgets;

    // For admin without selected student, show prompt
    if (!isStudent && !selectedStudentId) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>Student Progress</Typography>
                <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 500, mx: 'auto', mt: 4 }}>
                    <PersonSearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>Select a Student</Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Choose a student to view their progress dashboard
                    </Typography>
                    <Autocomplete
                        options={users}
                        getOptionLabel={(option: any) => option.name || `${option.first_name || ''} ${option.last_name || ''}`.trim() || `User ${option.id}`}
                        onChange={(_, value) => value && setSelectedStudentId(value.id)}
                        renderInput={(params) => <TextField {...params} label="Select Student" />}
                        sx={{ minWidth: 300 }}
                    />
                </Paper>
            </Box>
        );
    }

    const selectedUser = users.find((u: any) => u.id === selectedStudentId);

    const forceOnboarding = searchParams.get('onboarding') === 'true';
    const hasNoDiagnostics = isStudent && (forceOnboarding || (!loadingDiagnostics && diagnosticTests.length === 0));

    if (hasNoDiagnostics) {
        return (
            <Box sx={{ 
                position: 'fixed', 
                inset: 0, 
                mt: "3em",
                zIndex: 1300, 
                bgcolor: (theme) => theme.palette.background.default,
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center',
                overflowY: 'auto',
            }}>
                <Paper sx={{ px: 5, py:2, textAlign: 'center', maxWidth: 500 }}>
                    <RocketLaunchIcon sx={{ fontSize: 64, color: '#34A853'}} />
                    <Typography variant="h4" fontWeight="700" gutterBottom >
                        Let's Get Started!
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Take a diagnostic test to assess your current knowledge and personalize your learning path.
                    </Typography>
                    <Stack spacing={1.5} sx={{ mb: 2, textAlign: 'left' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <SearchIcon sx={{ color: '#34A853' }} />
                            <Box>
                                <Typography variant="subtitle2" fontWeight="600">Identify Gaps</Typography>
                                <Typography variant="caption" color="text.secondary">Find what needs attention</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <TrackChangesIcon sx={{ color: '#34A853' }} />
                            <Box>
                                <Typography variant="subtitle2" fontWeight="600">Personalized Path</Typography>
                                <Typography variant="caption" color="text.secondary">Study what matters most</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <TrendingUpIcon sx={{ color: '#34A853' }} />
                            <Box>
                                <Typography variant="subtitle2" fontWeight="600">Track Growth</Typography>
                                <Typography variant="caption" color="text.secondary">See your improvement over time</Typography>
                            </Box>
                        </Box>
                    </Stack>
                    <Autocomplete
                        options={subjects}
                        getOptionLabel={(option: any) => option.name || `Subject ${option.id}`}
                        onChange={(_, value) => {
                            setOnboardingSubjectId(value?.id || null);
                            setOnboardingChapterId(null);
                        }}
                        renderInput={(params) => <TextField {...params} label="Select Subject" />}
                        fullWidth
                        sx={{ mb: 1 }}
                    />
                    {onboardingSubjectId && (
                        <Autocomplete
                            options={chaptersForSubject}
                            getOptionLabel={(option: any) => option.name || `Chapter ${option.id}`}
                            onChange={(_, value) => setOnboardingChapterId(value?.id || null)}
                            renderInput={(params) => <TextField {...params} label="Select Chapter" />}
                            fullWidth
                            sx={{ mb: 2 }}
                        />
                    )}
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<AssignmentIcon />}
                        disabled={!onboardingChapterId}
                        onClick={async () => {
                            const exists = await checkIfDiagnosticsExist(onboardingSubjectId)
                            if (!exists) {
                                redirect(`/diagnostic/start/${onboardingChapterId}/`)
                            } else {
                                console.log("Diagnostic test already exists for student: ");
                                notify("You have already taken Diagnostic Test for this chapter.","info");
                            }
                        }}
                        fullWidth
                        sx={{
                            bgcolor: '#34A853',
                            '&:hover': { bgcolor: '#2d9249' },
                            '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
                        }}
                    >
                        Start Diagnostic Test
                    </Button>
                </Paper>
            </Box>
        );
    }

    const handleActionClick = (type: ActionType) => {
        setActionDialog(type);
        setSelectedChapterId(null);
        setSelectedConceptId(null);
    };

    const handleDialogConfirm = async () => {
        let revisionRound = null;
        let testRound = null;
        if (!selectedChapterId) return;
        const needsConcept = actionDialog === 'practice' || actionDialog === 'test';
        if (needsConcept && !selectedConceptId) return;

        try{
            if (actionDialog === 'diagnostic' && isStudent) {
                const existingTests = await checkIfDiagnosticsExist(selectedChapterId)
                if (existingTests) {
                    console.log("Diagnostic test already exists for student: ");
                    notify("You have already taken Diagnostic Test for this chapter.","info");
                    return
                }    
            }
            if (actionDialog === 'practice' && isStudent){
                revisionRound = await createRevisionRoundForStudent(selectedChapterId,selectedConceptId);
                console.log("Created revision round: ", revisionRound.id);
            }
            if (actionDialog === 'test' && isStudent) {
                testRound = await createTestRoundForStudent(selectedChapterId, selectedConceptId);
                console.log("Created test round: ", testRound.id);
            }

        }
        catch(error){
            //notify(error instanceof Error ? error.message : "Error starting diagnostic test", { type: "error" });
            console.log("Error starting action: ", error);
            return;
        }
        const routes: Record<string, string> = {
            diagnostic: `/diagnostic/start/${selectedChapterId}/`,
            practice: `/revision/start/${selectedChapterId}/${selectedConceptId}/${revisionRound?.id}`,
            test: `/testrounds/start/${selectedChapterId}/${selectedConceptId}/${testRound?.id}`
        };
        
        if (actionDialog && routes[actionDialog]) {
            redirect(routes[actionDialog]);
        }
        setActionDialog(null);
    };

    const needsConceptSelection = actionDialog === 'practice' || actionDialog === 'test';
    const canConfirm = actionDialog === 'diagnostic' 
        ? !!selectedChapterId 
        : !!selectedChapterId && !!selectedConceptId;

    const dialogTitles: Record<string, string> = {
        diagnostic: 'Start Diagnostic Test',
        practice: 'Start Practice Round',
        test: 'Start Test Round'
    };

    return (
        <Box>
            {!isStudent && (
                <Box sx={{ px: 3, pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Viewing:</Typography>
                    <Autocomplete
                        size="small"
                        options={users}
                        value={selectedUser || null}
                        getOptionLabel={(option: any) => option.name || `${option.first_name || ''} ${option.last_name || ''}`.trim() || `User ${option.id}`}
                        onChange={(_, value) => setSelectedStudentId(value?.id)}
                        renderInput={(params) => <TextField {...params} placeholder="Select Student" />}
                        sx={{ minWidth: 250 }}
                    />
                    <Autocomplete
                        size="small"
                        options={[{ id: null, name: 'All Subjects' }, ...subjects]}
                        value={subjects.find((s: any) => s.id === filterSubjectId) || { id: null, name: 'All Subjects' }}
                        getOptionLabel={(option: any) => option.name || 'All Subjects'}
                        onChange={(_, value) => setFilterSubjectId(value?.id || null)}
                        renderInput={(params) => <TextField {...params} label="Subject" />}
                        sx={{ minWidth: 180 }}
                        disableClearable
                    />
                </Box>
            )}
            {isStudent && (
                <Box sx={{ px: 3, pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" sx={{ whiteSpace: 'nowrap' }}>👋 Welcome Back!</Typography>
                    <Autocomplete
                        size="small"
                        options={[{ id: null, name: 'All Subjects' }, ...subjects]}
                        value={subjects.find((s: any) => s.id === filterSubjectId) || { id: null, name: 'All Subjects' }}
                        getOptionLabel={(option: any) => option.name || 'All Subjects'}
                        onChange={(_, value) => setFilterSubjectId(value?.id || null)}
                        renderInput={(params) => <TextField {...params} label="Subject" />}
                        sx={{ width: 180 }}
                        disableClearable
                    />
                    <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<AssignmentIcon />}
                            onClick={() => handleActionClick('diagnostic')}
                        >
                            Diagnostic Test
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => handleActionClick('practice')}
                        >
                            Practice Round
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            color="warning"
                            startIcon={<TimerIcon />}
                            onClick={() => handleActionClick('test')}
                        >
                            Test Round
                        </Button>
                    </Stack>
                </Box>
            )}

            <Dialog open={!!actionDialog} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth>
                <DialogTitle>{actionDialog && dialogTitles[actionDialog]}</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        {needsConceptSelection ? 'Select a chapter and concept to begin' : 'Select a chapter to begin'}
                    </Typography>
                    <Autocomplete
                        options={chapters}
                        getOptionLabel={(option: any) => option.subject.code + ' : ' + option.name || `Chapter ${option.id}`}
                        onChange={(_, value) => {
                            setSelectedChapterId(value?.id || null);
                            setSelectedConceptId(null);
                        }}
                        renderInput={(params) => <TextField {...params} label="Select Chapter" />}
                        fullWidth
                        sx={{ mb: 2 }}
                    />
                    {needsConceptSelection && selectedChapterId && (
                        <Autocomplete
                            options={conceptsForChapter}
                            getOptionLabel={(option: any) => option.name || `Concept ${option.id}`}
                            onChange={(_, value) => setSelectedConceptId(value?.id || null)}
                            renderInput={(params) => <TextField {...params} label="Select Concept" />}
                            fullWidth
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialog(null)}>Cancel</Button>
                    <Button onClick={handleDialogConfirm} variant="contained" disabled={!canConfirm}>
                        Start
                    </Button>
                </DialogActions>
            </Dialog>

            <AnalyticsDashboard
                // @ts-ignore - types.d.ts is outdated, actual component supports these props
                title={isStudent ? false : "Student Progress"}
                dataset="concept_scores"
                enablePeriodSelector={false}
                enableComparison={false}
                enableGlobalFilters={false}
                widgets={displayWidgets}
            />
        </Box>
    );
};
