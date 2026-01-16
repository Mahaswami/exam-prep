import { AnalyticsDashboard, WidgetConfig, getLocalStorage } from '@mahaswami/swan-frontend';
import { useEffect, useState } from 'react';
import { useDataProvider, useGetList } from 'react-admin';
import { Box, Typography, Paper, Autocomplete, TextField } from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';

const STUDENT_WIDGETS: WidgetConfig[] = [
    // Row 1: Key metrics (4 KPIs)
    {
        id: 'concepts-mastered',
        type: 'kpi',
        title: 'Mastered',
        layout: { columnSpan: 3 },
        measures: [{ field: 'id', aggregation: 'count' }],
        filters: { comfort_level: 'very_good' }
    },
    {
        id: 'concepts-good',
        type: 'kpi',
        title: 'Good',
        layout: { columnSpan: 3 },
        measures: [{ field: 'id', aggregation: 'count' }],
        filters: { comfort_level: 'good' }
    },
    {
        id: 'concepts-needs-work',
        type: 'kpi',
        title: 'Needs Work',
        layout: { columnSpan: 3 },
        measures: [{ field: 'id', aggregation: 'count' }],
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

export const StudentDashboard = () => {
    const role = getLocalStorage('role');
    const isStudent = role === 'student';
    const dataProvider = useDataProvider();
    
    const [computedWidgets, setComputedWidgets] = useState<WidgetConfig[]>(STUDENT_WIDGETS);
    const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined);
    
    // Admin needs explicit filter; students are auto-filtered by DataProvider wrapper
    const effectiveUserId = isStudent ? undefined : selectedStudentId;

    useEffect(() => {
        const computeMasteryData = async () => {
            try {
                // Students: DataProvider auto-filters by user_id
                // Admins: need explicit filter when student selected
                const filter = effectiveUserId ? { user_id: effectiveUserId } : {};
                
                const [scoresRes, conceptsRes, chaptersRes] = await Promise.all([
                    dataProvider.getList('concept_scores', {
                        pagination: { page: 1, perPage: 1000 },
                        sort: { field: 'id', order: 'ASC' },
                        filter
                    }),
                    dataProvider.getList('concepts', {
                        pagination: { page: 1, perPage: 1000 },
                        sort: { field: 'id', order: 'ASC' },
                        filter: {}
                    }),
                    dataProvider.getList('chapters', {
                        pagination: { page: 1, perPage: 1000 },
                        sort: { field: 'id', order: 'ASC' },
                        filter: {}
                    })
                ]);
                
                const data = scoresRes.data;
                const concepts = conceptsRes.data;
                const chapters = chaptersRes.data;
                
                // Build lookup maps
                const conceptToChapter = new Map(concepts.map((c: any) => [c.id, c.chapter_id]));
                const chapterNames = new Map(chapters.map((c: any) => [c.id, c.name]));
                
                const total = data.length;
                const mastered = data.filter((d: any) => d.comfort_level === 'very_good').length;
                const masteryRate = total > 0 ? mastered / total : 0;
                
                // Count improved: current level > initial level
                const levelOrder = { 'needs_improvement': 0, 'good': 1, 'very_good': 2 };
                const improved = data.filter((d: any) => {
                    if (!d.initial_comfort_level) return false;
                    return (levelOrder[d.comfort_level as keyof typeof levelOrder] || 0) > 
                           (levelOrder[d.initial_comfort_level as keyof typeof levelOrder] || 0);
                }).length;

                // Compute progress by chapter
                const chapterStats = new Map<number, { total: number; mastered: number }>();
                data.forEach((d: any) => {
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

                const updatedWidgets = STUDENT_WIDGETS.map(widget => {
                    if (widget.id === 'mastery-gauge') {
                        return { ...widget, mockData: [{ value: masteryRate }] };
                    }
                    if (widget.id === 'concepts-improved') {
                        return { ...widget, mockData: [{ value: improved }] };
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
    }, [dataProvider, effectiveUserId]);

    const availableFilters = isStudent 
        ? [{ field: 'comfort_level', label: 'Comfort Level' }]
        : [{ field: 'comfort_level', label: 'Comfort Level' }];
    
    // Fetch users for admin student picker
    const { data: users = [] } = useGetList('users', {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'first_name', order: 'ASC' },
        filter: { role: 'student' }
    }, { enabled: !isStudent });

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
                </Box>
            )}
            <AnalyticsDashboard
                // @ts-ignore - types.d.ts is outdated, actual component supports these props
                title={isStudent ? "My Progress" : "Student Progress"}
                dataset="concept_scores"
                enablePeriodSelector={false}
                enableComparison={false}
                enableGlobalFilters={true}
                availableFilters={availableFilters}
                widgets={displayWidgets}
            />
        </Box>
    );
};
