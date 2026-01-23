import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { Box, Chip } from '@mui/material';
import { useRecordContext } from 'react-admin';

export const LEVEL_ORDER = { 'needs_improvement': 0, 'good': 1, 'very_good': 2 } as const;
export const LEVEL_COLORS = {
    'needs_improvement': { bg: '#ffebee', color: '#c62828' },
    'good': { bg: '#fff8e1', color: '#f57c00' },
    'very_good': { bg: '#e8f5e9', color: '#2e7d32' }
} as const;
export const LEVEL_LABELS = { 'needs_improvement': 'Needs Work', 'good': 'Good', 'very_good': 'Very Good' } as const;

export const ComfortLevelChip = ({ value }: { value: string }) => {
    const colors = LEVEL_COLORS[value as keyof typeof LEVEL_COLORS] || { bg: '#f5f5f5', color: '#757575' };
    const label = LEVEL_LABELS[value as keyof typeof LEVEL_LABELS] || value;
    return (
        <Chip 
            label={label} 
            size="small" 
            sx={{ bgcolor: colors.bg, color: colors.color, fontWeight: 500 }} 
        />
    );
};

export const ComfortLevelField = ({ source }: { source: string }) => {
    const record = useRecordContext();
    if (!record?.[source]) return null;
    return <ComfortLevelChip value={record[source]} />;
};

export const ComfortLevelWithTrend = ({ 
    previousSource, 
    currentSource 
}: { 
    previousSource: string; 
    currentSource: string; 
}) => {
    const record = useRecordContext();
    if (!record?.[currentSource]) return null;
    
    const previous = LEVEL_ORDER[record[previousSource] as keyof typeof LEVEL_ORDER] ?? -1;
    const current = LEVEL_ORDER[record[currentSource] as keyof typeof LEVEL_ORDER] ?? -1;
    
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ComfortLevelChip value={record[currentSource]} />
            {previous >= 0 && current > previous && (
                <TrendingUp sx={{ fontSize: 18, color: '#2e7d32' }} />
            )}
            {previous >= 0 && current < previous && (
                <TrendingDown sx={{ fontSize: 18, color: '#c62828' }} />
            )}
        </Box>
    );
};
