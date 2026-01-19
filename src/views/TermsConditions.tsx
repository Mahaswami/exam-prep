import { Typography, Paper, Box } from '@mui/material';
import { PublicLayout } from '../components/PublicLayout';

export const TermsConditions = () => {
    return (
        <PublicLayout>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>Terms & Conditions</Typography>
                <Typography variant="caption" color="text.secondary" gutterBottom component="div">
                    Last updated: January 2026
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Service</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>Peak 10 Exam Prep provides practice questions and learning tools for CBSE Class 10 exam preparation</li>
                    <li>Access is valid for the 2026 exam season (including improvement exams)</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Payment</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>One-time payment of ₹499 for full access</li>
                    <li>Payment is processed securely via Razorpay</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>User Conduct</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>Account is for personal use by the registered student only</li>
                    <li>Sharing login credentials is not permitted</li>
                    <li>Content may not be copied, distributed, or commercially used</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Parental Consent</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>By signing up, you confirm you are the parent/guardian</li>
                    <li>You consent to your child using this educational service</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Limitation of Liability</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>We provide learning support, not guaranteed exam results</li>
                    <li>Content is for practice purposes and supplements official curriculum</li>
                    <li>We are not affiliated with CBSE or any government body</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Changes</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>We may update these terms with notice via email</li>
                    <li>Continued use after changes constitutes acceptance</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Contact</Typography>
                <Typography variant="body1" color="text.secondary">
                    Questions about these terms: <a href="mailto:support@peak10.in">support@peak10.in</a>
                </Typography>

                <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">
                        Mahaswami Software Private Limited<br />
                        Chennai, India
                    </Typography>
                </Box>
            </Paper>
        </PublicLayout>
    );
};

export default TermsConditions;
