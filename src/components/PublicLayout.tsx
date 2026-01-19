import { ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { Peak10Logo } from './Peak10Logo';

interface PublicLayoutProps {
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg';
    denseToolbar?: boolean;
    contentPadding?: { xs: number; md: number };
}

export const PublicLayout = ({ 
    children, 
    maxWidth = 'md',
    denseToolbar = false,
    contentPadding = { xs: 2, md: 3 }
}: PublicLayoutProps) => {
    const { pathname } = useLocation();
    
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F4F7F6', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="static" elevation={0}>
                <Toolbar variant={denseToolbar ? 'dense' : 'regular'}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Link to="/signup" style={{ textDecoration: 'none' }}>
                            <Peak10Logo variant="dark" size="small" />
                        </Link>
                    </Box>
                    <Button 
                        component={Link} 
                        to="/login" 
                        variant="outlined" 
                        sx={{ 
                            color: 'white', 
                            borderColor: 'rgba(255,255,255,0.5)',
                            '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        Login
                    </Button>
                </Toolbar>
            </AppBar>

            <Box sx={{ flex: 1, pt: contentPadding, pb: { xs: 1, md: 1.5 } }}>
                <Container maxWidth={maxWidth}>
                    {children}
                </Container>
            </Box>

            <Box sx={{ py: 0.25, textAlign: 'center', bgcolor: '#F4F7F6' }}>
                <Container>
                    <Typography variant="caption" color="text.secondary">
                        © 2026{' '}
                        <a href="https://mahaswami.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                            Mahaswami Software Private Limited
                        </a>
                        {' | '}
                        <Link to="/privacy-policy" style={{ color: 'inherit' }}>
                            Privacy Policy
                        </Link>
                        {' | '}
                        <Link to="/terms" style={{ color: 'inherit' }}>
                            Terms & Conditions
                        </Link>
                        {' | '}
                        <Link to="/cancellation-refund" style={{ color: 'inherit' }}>
                            Cancellation & Refund
                        </Link>
                        {' | '}
                        <Link to="/contact" style={{ color: 'inherit' }}>
                            Contact Us
                        </Link>
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};
