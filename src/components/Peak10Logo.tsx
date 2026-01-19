import { Box } from '@mui/material';

interface Peak10LogoProps {
    variant?: 'light' | 'dark';
    size?: 'small' | 'medium' | 'large';
}

const sizeMap = {
    small: { width: 180, height: 40 },
    medium: { width: 280, height: 60 },
    large: { width: 360, height: 80 },
};

export const Peak10Logo = ({ variant = 'light', size = 'medium' }: Peak10LogoProps) => {
    const { width, height } = sizeMap[size];
    const lineColor = variant === 'dark' ? '#FFFFFF' : '#2E3A59';
    const textColor = variant === 'dark' ? '#FFFFFF' : '#2E3A59';
    const greenColor = '#34A853';
    
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <svg width={width} height={height} viewBox="0 0 360 80" xmlns="http://www.w3.org/2000/svg">
                <path 
                    d="M20,60 L50,60 L80,20 L110,60 L130,60" 
                    fill="none" 
                    stroke={lineColor} 
                    strokeWidth="6" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                />
                <circle cx="80" cy="20" r="6" fill={greenColor} />
                <text 
                    x="150" 
                    y="58" 
                    fontFamily="'Montserrat', sans-serif" 
                    fontWeight="800" 
                    fontSize="48" 
                    fill={textColor} 
                    letterSpacing="-1"
                >
                    PEAK
                </text>
                <text 
                    x="290" 
                    y="58" 
                    fontFamily="'Montserrat', sans-serif" 
                    fontWeight="800" 
                    fontSize="48" 
                    fill={greenColor}
                >
                    10
                </text>
            </svg>
        </Box>
    );
};

export const Peak10Icon = ({ size = 48 }: { size?: number }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="120" rx="28" fill="#2E3A59"/>
            <path 
                d="M25,80 L45,80 L60,40 L75,80 L95,80" 
                fill="none" 
                stroke="#FFFFFF" 
                strokeWidth="7" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
            <circle cx="60" cy="40" r="5" fill="#34A853" />
            <text 
                x="60" 
                y="28" 
                fontFamily="'Montserrat', sans-serif" 
                fontWeight="700" 
                fontSize="16" 
                fill="#34A853" 
                textAnchor="middle" 
                letterSpacing="1"
            >
                10
            </text>
        </svg>
    );
};

export default Peak10Logo;
