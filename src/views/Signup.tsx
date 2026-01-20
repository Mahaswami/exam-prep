import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    Paper,
    Stack,
    TextField,
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
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { PublicLayout } from '../components/PublicLayout';

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
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Box sx={{ color: 'primary.main', mt: 0.25 }}>{icon}</Box>
        <Box>
            <Typography variant="subtitle2" fontWeight="bold">{title}</Typography>
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

    // Simple email check: something@something.something (permissive to avoid blocking valid emails)
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail);
    const isFormValid = isEmailValid && consentChecked;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const isPasswordValid = password.length >= 8 && hasLetters && hasNumbers && password === confirmPassword;

    const handlePayment = async () => {
        if (!isFormValid) {
            setError(parentEmail && !isEmailValid ? 'Please enter a valid email address' : 'Please fill in required fields and provide consent');
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
                name: 'Peak 10 Exam Prep',
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
        <PublicLayout denseToolbar contentPadding={{ xs: 1.25, md: 1.75 }}>
                {/* Hero Section */}
                <Box sx={{ textAlign: 'center', mb: { xs: 1.25, md: 1.75 } }}>
                    <Typography variant="h5" fontWeight="800" gutterBottom color="primary">
                        Reach Your Peak Performance
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
                        A smart revision tool for CBSE Class 10 Math & English. 
                        Practice at your pace, track your progress, and build confidence.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
                    {/* Features */}
                    <Paper sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
                        <Typography variant="h6" fontWeight="700" gutterBottom color="primary">
                            How It Works
                        </Typography>
                        <Box sx={{ 
                            mt: 2,
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 2
                        }}>
                            <FeatureItem
                                icon={<AssessmentIcon />}
                                title="Chapter-wise Diagnostics"
                                description="Assess where you stand in Math & English with targeted chapter tests"
                            />
                            <FeatureItem
                                icon={<TrackChangesIcon />}
                                title="Know Your Comfort Level"
                                description="We identify concept-level strengths and areas needing focus"
                            />
                            <FeatureItem
                                icon={<MenuBookIcon />}
                                title="Practice with Solutions"
                                description="Unlimited practice questions with step-by-step explanations to learn from"
                            />
                            <FeatureItem
                                icon={<CheckCircleIcon />}
                                title="Test & Improve"
                                description="Take concept tests anytime, update your comfort level after each test"
                            />
                            <FeatureItem
                                icon={<TrendingUpIcon />}
                                title="Track Progress"
                                description="Visual dashboard showing your child's learning journey and growth"
                            />
                            <FeatureItem
                                icon={<DeleteSweepIcon />}
                                title="Privacy First"
                                description="Activity data auto-deleted 30 days post-exams to protect your child's privacy"
                            />
                        </Box>
                    </Paper>

                    {/* Signup Form */}
                    <Paper sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
                        {!paymentComplete ? (
                            <>
                                <Typography variant="h6" fontWeight="700" gutterBottom color="primary">
                                    Get Started Today
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Parents: Sign up your child for focused exam preparation
                                </Typography>

                                <Stack spacing={2}>
                                    <TextField
                                        label="Parent's Email"
                                        type="email"
                                        value={parentEmail}
                                        onChange={(e) => setParentEmail(e.target.value)}
                                        required
                                        fullWidth
                                        error={parentEmail.length > 0 && !isEmailValid}
                                        helperText={parentEmail.length > 0 && !isEmailValid ? 'Please enter a valid email address' : 'Used for account access and payment receipts'}
                                    />

                                    <TextField
                                        label="Student Nickname"
                                        value={studentNickname}
                                        onChange={(e) => setStudentNickname(e.target.value)}
                                        fullWidth
                                        placeholder="e.g., StarLearner, MathWiz"
                                        helperText="A fun name for your child's profile (real name not required)"
                                        inputProps={{ maxLength: 25 }}
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

                                    <Box sx={{ 
                                        textAlign: 'center',
                                        bgcolor: 'rgba(52, 168, 83, 0.08)',
                                        borderRadius: 2,
                                        py: 1.5,
                                        px: 2
                                    }}>
                                        <Typography variant="h4" fontWeight="bold" color="secondary">
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
                                        color="secondary"
                                        size="large"
                                        onClick={handlePayment}
                                        disabled={!isFormValid || loading}
                                        fullWidth
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
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Account: {parentEmail}
                                </Typography>

                                <Stack spacing={2}>
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
                                        color="secondary"
                                        size="large"
                                        onClick={handleCreateAccount}
                                        disabled={!isPasswordValid || creatingAccount}
                                        fullWidth
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
                <Paper sx={{ mt: 1.5, p: 1.5, py: 0.35, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="text.secondary" component="div">
                        <strong>DISCLAIMER:</strong> This app is a privately owned educational product and is 
                        NOT affiliated, associated, authorized, endorsed by, or in any way officially connected 
                        with the Central Board of Secondary Education (CBSE), NCERT, or any government agency. 
                        All content is for educational and practice purposes only. Official CBSE site: {' '}
                        <a href="https://cbse.gov.in" target="_blank" rel="noopener noreferrer">cbse.gov.in</a>
                    </Typography>
                </Paper>
        </PublicLayout>
    );
};

export default SignupPage;