import { Typography, Paper, Box } from '@mui/material';
import { PublicLayout } from '../components/PublicLayout';

export const PrivacyPolicy = () => {
    return (
        <PublicLayout>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>Privacy Policy</Typography>
                <Typography variant="caption" color="text.secondary" gutterBottom component="div">
                    Last updated: January 2026
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>What we collect</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>Parent email address (for account access and payment receipts)</li>
                    <li>Student nickname (a fun alias - not their real name)</li>
                    <li>Learning activity data (test scores, practice progress)</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Child Safety - What we explicitly DON'T collect</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>Real name of the student</li>
                    <li>Age, date of birth, or school information</li>
                    <li>Photos, location, or any personally identifiable information about the minor</li>
                    <li>Contact information of the student</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>How we use it</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>To provide the exam preparation service</li>
                    <li>To track your child's learning progress</li>
                    <li>To send account-related communications to parents</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Data Retention</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>Learning activity data is retained only until 30 days after the 2026 exam season ends</li>
                    <li>After this period, all activity data is permanently deleted</li>
                    <li>Parent email may be retained for future service communications unless you request deletion</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>What we don't do</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>We don't sell or share your data with third parties</li>
                    <li>We don't show advertisements</li>
                    <li>We don't contact students directly</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Payment</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>Payments are processed securely by Razorpay</li>
                    <li>We don't store credit card or bank details</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Contact</Typography>
                <Typography variant="body1" color="text.secondary">
                    For any privacy concerns or data deletion requests: <a href="mailto:support@peak10.in">support@peak10.in</a>
                </Typography>

            </Paper>
        </PublicLayout>
    );
};

export default PrivacyPolicy;
