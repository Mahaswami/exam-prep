import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    AppBar,
    Box,
    Button,
    Checkbox,
    Container,
    FormControlLabel,
    Paper,
    Stack,
    TextField,
    Toolbar,
    Typography,
    Alert,
    Divider,
    CircularProgress,
} from '@mui/material';
import { setLocalStorage } from '@mahaswami/swan-frontend';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Peak10Logo } from '../components/Peak10Logo';

const getEnvSettings = () => {
    const appConfig = (window as any).appConfigOptions;
    const env = (window as any).app_env || 'dev';
    const envSettings = appConfig?.environments?.[env] || appConfig?.environments?.dev;
    return {
        engine: envSettings?.default || 'gsheet',
        db: envSettings?.[envSettings?.default] || envSettings?.gsheet,
        env,
        serviceUrl: envSettings?.service_url,
    };
};

const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ color: 'primary.main', mt: 0.5 }}>{icon}</Box>
        <Box>
            <Typography variant="subtitle1" fontWeight="bold">{title}</Typography>
            <Typography variant="body2" color="text.secondary">{description}</Typography>
        </Box>
    </Box>
);

export const SignupPage = () => {
    const [parentEmail, setParentEmail] = useState('');
    const [studentNickname, setStudentNickname] = useState('');
    const [consentChecked, setConsentChecked] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Post-payment state
    const [paymentComplete, setPaymentComplete] = useState(false);
    const [paymentId, setPaymentId] = useState<number | null>(null);
    const [razorpayOrderId, setRazorpayOrderId] = useState('');
    const [razorpayPaymentId, setRazorpayPaymentId] = useState('');
    const [razorpaySignature, setRazorpaySignature] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [creatingAccount, setCreatingAccount] = useState(false);

    const isFormValid = parentEmail && consentChecked;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const isPasswordValid = password.length >= 8 && hasLetters && hasNumbers && password === confirmPassword;

    const handlePayment = async () => {
        if (!isFormValid) {
            setError('Please fill in required fields and provide consent');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const { engine, db, env, serviceUrl } = getEnvSettings();
            
            // Call backend to create pending signup and get Razorpay order
            const initResponse = await fetch(`${serviceUrl}/api/exam-prep/signup/init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: parentEmail,
                    student_nickname: studentNickname || 'Student',
                    engine,
                    db,
                    env,
                }),
            });

            const initData = await initResponse.json();
            
            if (!initResponse.ok) {
                setError(initData.error || 'Failed to initialize payment');
                setLoading(false);
                return;
            }

            // Store for later
            setPaymentId(initData.payment_id);
            setRazorpayOrderId(initData.order_id);

            // Load Razorpay script if not already loaded
            if (!(window as any).Razorpay) {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.async = true;
                document.body.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }

            const options = {
                key: initData.key_id,
                amount: initData.amount,
                currency: initData.currency,
                name: 'Exam Prep',
                description: '2026 Exam Season Access',
                order_id: initData.order_id,
                handler: async (response: any) => {
                    // Payment successful - show password form
                    setRazorpayPaymentId(response.razorpay_payment_id);
                    setRazorpaySignature(response.razorpay_signature);
                    setPaymentComplete(true);
                    setLoading(false);
                },
                prefill: {
                    email: parentEmail,
                },
                theme: {
                    color: '#1976d2',
                },
                config: {
                    display: {
                        blocks: {
                            upi: {
                                name: "Pay using UPI",
                                instruments: [{ method: "upi" }]
                            }
                        },
                        sequence: ["block.upi"],
                        preferences: { show_default_blocks: false }
                    }
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', (response: any) => {
                setError('Payment failed. Please try again.');
                console.error('Payment failed:', response.error);
                setLoading(false);
            });
            rzp.open();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            setLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        if (!isPasswordValid) {
            setError('Password must be at least 8 characters and match confirmation');
            return;
        }
        
        setError('');
        setCreatingAccount(true);

        try {
            const { engine, db, env, serviceUrl } = getEnvSettings();
            
            const response = await fetch(`${serviceUrl}/api/exam-prep/signup/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_id: paymentId,
                    razorpay_order_id: razorpayOrderId,
                    razorpay_payment_id: razorpayPaymentId,
                    razorpay_signature: razorpaySignature,
                    password,
                    engine,
                    db,
                    env,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.error || 'Failed to create account');
                setCreatingAccount(false);
                return;
            }

            // Store user object (checkAuth validates this) and auth data
            const userToPersist = {
                id: data.user.id,
                email: data.user.email,
                role: data.user.role,
                first_name: data.user.first_name,
                fullName: data.user.first_name,
                tenant: data.user.tenant,
            };
            setLocalStorage('user', userToPersist);
            setLocalStorage('user_email', data.user.email);
            setLocalStorage('role', data.user.role);
            setLocalStorage('tenant_id', data.user.tenant.id);
            setLocalStorage('tenant_name', data.user.tenant.name);
            setLocalStorage('auth_token', data.auth_token);
            
            // Reload to trigger authenticated state
            window.location.href = '/';
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            setCreatingAccount(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F4F7F6', fontFamily: "'Montserrat', sans-serif" }}>
            {/* Header */}
            <AppBar position="static" elevation={0} sx={{ bgcolor: '#2E3A59' }}>
                <Toolbar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Peak10Logo variant="dark" size="small" />
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

            <Box sx={{ py: 3 }}>
            <Container maxWidth="lg">
                {/* Hero Section */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Peak10Logo size="large" />
                    <Typography variant="h4" fontWeight="800" gutterBottom sx={{ mt: 2, color: '#2E3A59' }}>
                        Reach Your Peak Performance
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                        A smart revision tool for CBSE Class 10 Math & English. 
                        Practice at your pace, track your progress, and build confidence.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                    {/* Features */}
                    <Paper sx={{ flex: 1, p: 4 }}>
                        <Typography variant="h5" fontWeight="700" gutterBottom sx={{ color: '#2E3A59' }}>
                            How It Works
                        </Typography>
                        <Stack spacing={3} sx={{ mt: 3 }}>
                            <FeatureItem
                                icon={<AssessmentIcon fontSize="large" />}
                                title="Chapter-wise Diagnostics"
                                description="Assess where you stand in Math & English with targeted chapter tests"
                            />
                            <FeatureItem
                                icon={<TrackChangesIcon fontSize="large" />}
                                title="Know Your Comfort Level"
                                description="We identify concept-level strengths and areas needing focus"
                            />
                            <FeatureItem
                                icon={<MenuBookIcon fontSize="large" />}
                                title="Practice with Solutions"
                                description="Unlimited practice questions with step-by-step explanations to learn from"
                            />
                            <FeatureItem
                                icon={<CheckCircleIcon fontSize="large" />}
                                title="Test & Improve"
                                description="Take concept tests anytime, update your comfort level after each test"
                            />
                            <FeatureItem
                                icon={<TrendingUpIcon fontSize="large" />}
                                title="Track Progress"
                                description="Visual dashboard showing your child's learning journey and growth"
                            />
                        </Stack>
                    </Paper>

                    {/* Signup Form */}
                    <Paper sx={{ flex: 1, p: 4 }}>
                        {!paymentComplete ? (
                            <>
                                <Typography variant="h5" fontWeight="700" gutterBottom sx={{ color: '#2E3A59' }}>
                                    Get Started Today
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Parents: Sign up your child for focused exam preparation
                                </Typography>

                                <Stack spacing={3}>
                                    <TextField
                                        label="Parent's Email"
                                        type="email"
                                        value={parentEmail}
                                        onChange={(e) => setParentEmail(e.target.value)}
                                        required
                                        fullWidth
                                        helperText="Used for account access and payment receipts"
                                    />

                                    <TextField
                                        label="Student Nickname"
                                        value={studentNickname}
                                        onChange={(e) => setStudentNickname(e.target.value)}
                                        fullWidth
                                        placeholder="e.g., StarLearner, MathWiz"
                                        helperText="A fun name for your child's profile (real name not required)"
                                    />

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={consentChecked}
                                                onChange={(e) => setConsentChecked(e.target.checked)}
                                            />
                                        }
                                        label={
                                            <Typography variant="body2">
                                                I am the parent/guardian and consent to my child using this app
                                            </Typography>
                                        }
                                    />

                                    {error && <Alert severity="error">{error}</Alert>}

                                    <Divider />

                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" fontWeight="bold" sx={{ color: '#34A853' }}>
                                            ₹499
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Full 2026 exam season access
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            (Main + Improvement exams)
                                        </Typography>
                                    </Box>

                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handlePayment}
                                        disabled={!isFormValid || loading}
                                        fullWidth
                                        sx={{ 
                                            py: 1.5, 
                                            bgcolor: '#34A853', 
                                            '&:hover': { bgcolor: '#2d9249' }
                                        }}
                                    >
                                        {loading ? 'Processing...' : 'Pay & Start Learning'}
                                    </Button>

                                    <Typography variant="body2" textAlign="center" color="text.secondary">
                                        Already have an account?{' '}
                                        <Link to="/login" style={{ color: 'inherit', fontWeight: 'bold' }}>Login</Link>
                                    </Typography>
                                </Stack>
                            </>
                        ) : (
                            <>
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        Payment Successful!
                                    </Typography>
                                    <Typography variant="body2">
                                        One last step - create your password to access your account.
                                    </Typography>
                                </Alert>

                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    Create Your Password
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Account: {parentEmail}
                                </Typography>

                                <Stack spacing={3}>
                                    <TextField
                                        label="Password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        fullWidth
                                        helperText={
                                            password.length === 0 
                                                ? 'At least 8 characters with letters and numbers' 
                                                : `${password.length >= 8 ? '✓' : '✗'} 8+ chars | ${hasLetters ? '✓' : '✗'} letters | ${hasNumbers ? '✓' : '✗'} numbers`
                                        }
                                        error={password.length > 0 && (!hasLetters || !hasNumbers || password.length < 8)}
                                    />

                                    <TextField
                                        label="Confirm Password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        fullWidth
                                        error={confirmPassword.length > 0 && password !== confirmPassword}
                                        helperText={confirmPassword.length > 0 && password !== confirmPassword ? 'Passwords do not match' : ''}
                                    />

                                    {error && <Alert severity="error">{error}</Alert>}

                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handleCreateAccount}
                                        disabled={!isPasswordValid || creatingAccount}
                                        fullWidth
                                        sx={{ 
                                            py: 1.5, 
                                            bgcolor: '#34A853', 
                                            '&:hover': { bgcolor: '#2d9249' }
                                        }}
                                    >
                                        {creatingAccount ? (
                                            <>
                                                <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                                                Creating Account...
                                            </>
                                        ) : (
                                            'Create Account & Start Learning'
                                        )}
                                    </Button>
                                </Stack>
                            </>
                        )}
                    </Paper>
                </Box>

                {/* Disclaimer */}
                <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="text.secondary" component="div">
                        <strong>DISCLAIMER:</strong> This app is a privately owned educational product and is 
                        NOT affiliated, associated, authorized, endorsed by, or in any way officially connected 
                        with the Central Board of Secondary Education (CBSE), NCERT, or any government agency. 
                        All past year question papers and syllabus information provided in this app are for 
                        reference and educational purposes only. Official CBSE site: {' '}
                        <a href="https://cbse.gov.in" target="_blank" rel="noopener noreferrer">cbse.gov.in</a>
                    </Typography>
                </Paper>
            </Container>
            </Box>
        </Box>
    );
};

export default SignupPage;