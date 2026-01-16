import { AnalyticsDashboard, WidgetConfig } from '@mahaswami/swan-frontend';

const ADMIN_WIDGETS: WidgetConfig[] = [
    {
        id: 'total-students',
        type: 'kpi',
        title: 'Total Students',
        layout: { columnSpan: 3 },
        measures: [{ field: 'user_id', aggregation: 'countDistinct' }]
    },
    {
        id: 'active-this-week',
        type: 'kpi',
        title: 'Active This Week',
        layout: { columnSpan: 3 },
        measures: [{ field: 'user_id', aggregation: 'countDistinct' }],
        filters: { activity_timestamp: { $gte: 'now-7d' } }
    },
    {
        id: 'total-sessions',
        type: 'kpi',
        title: 'Total Sessions',
        layout: { columnSpan: 3 },
        measures: [{ field: 'id', aggregation: 'count' }]
    },
    {
        id: 'diagnostic-tests',
        type: 'kpi',
        title: 'Diagnostic Tests',
        layout: { columnSpan: 3 },
        measures: [{ field: 'id', aggregation: 'count' }],
        filters: { activity_type: 'diagnostic_test' }
    },
    {
        id: 'daily-activity-trend',
        type: 'line',
        title: 'Daily Activity Trend',
        layout: { columnSpan: 8 },
        dimensions: [{ field: 'activity_timestamp' }],
        measures: [
            { field: 'id', aggregation: 'count', label: 'Sessions' },
            { field: 'user_id', aggregation: 'countDistinct', label: 'Students' }
        ],
        sort: { field: 'activity_timestamp', order: 'ASC' }
    },
    {
        id: 'activity-type-pie',
        type: 'pie',
        title: 'Activity Type Distribution',
        layout: { columnSpan: 4 },
        dimensions: [{ field: 'activity_type' }],
        measures: [{ field: 'id', aggregation: 'count' }],
        showPercentage: true
    },
    {
        id: 'chapter-activity-bar',
        type: 'bar',
        title: 'Activity by Chapter',
        layout: { columnSpan: 6 },
        dimensions: [{ field: 'chapter_id' }],
        measures: [
            { field: 'id', aggregation: 'count', label: 'Sessions' },
            { field: 'user_id', aggregation: 'countDistinct', label: 'Students' }
        ],
        chartOptions: {
            margin: { top: 40, right: 60, bottom: 70, left: 70 }
        }
    },
    {
        id: 'activity-table',
        type: 'table',
        title: 'Activity Summary by Type',
        layout: { columnSpan: 6 },
        dimensions: [{ field: 'activity_type' }],
        measures: [
            { field: 'id', aggregation: 'count', label: 'Count' },
            { field: 'user_id', aggregation: 'countDistinct', label: 'Students' }
        ]
    }
];

export const AdminDashboard = () => {
    return (
        <AnalyticsDashboard
            // @ts-ignore - types.d.ts is outdated, actual component supports these props
            title="Admin Dashboard"
            dataset="activities"
            defaultPeriod="month"
            enablePeriodSelector={true}
            enableComparison={true}
            defaultComparison="previousPeriod"
            enableGlobalFilters={true}
            availableFilters={[
                { field: 'activity_type', label: 'Activity Type' },
                { field: 'chapter_id', label: 'Chapter' },
                { field: 'concept_id', label: 'Concept' }
            ]}
            widgets={ADMIN_WIDGETS}
            config={{
                dateField: 'activity_timestamp'
            }}            
        />
    );
};
