import { Typography, Paper, Box } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { PublicLayout } from '../components/PublicLayout';

export const ContactUs = () => {
    return (
        <PublicLayout>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>Contact Us</Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4, mb: 3 }}>
                    <EmailIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="h6">Email Support</Typography>
                        <Typography variant="body1">
                            <a href="mailto:support@peak10.in">support@peak10.in</a>
                        </Typography>
                    </Box>
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    We typically respond within 24 hours on business days.
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>What we can help with</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>Account access issues</li>
                    <li>Payment and refund queries</li>
                    <li>Technical problems with the platform</li>
                    <li>Content or question feedback</li>
                    <li>Data deletion requests</li>
                    <li>General inquiries</li>
                </Typography>

                <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" gutterBottom>Company Details</Typography>
                    <Typography variant="body1" color="text.secondary">
                        Mahaswami Software Private Limited<br />
                        Chennai, Tamil Nadu, India
                    </Typography>
                </Box>
            </Paper>
        </PublicLayout>
    );
};

export default ContactUs;
