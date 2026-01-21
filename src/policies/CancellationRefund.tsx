import { Typography, Paper, Box } from '@mui/material';
import { PublicLayout } from '../components/PublicLayout';

export const CancellationRefund = () => {
    return (
        <PublicLayout>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>Cancellation & Refund Policy</Typography>
                <Typography variant="caption" color="text.secondary" gutterBottom component="div">
                    Last updated: January 2026
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Refund Eligibility</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>Full refund available within 7 days of purchase</li>
                    <li>Refund is applicable only if practice content has not been accessed</li>
                    <li>Once learning modules are accessed, the service is considered delivered</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>How to Request a Refund</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>Email us at <a href="mailto:support@peak10.in">support@peak10.in</a> with your registered email</li>
                    <li>Include "Refund Request" in the subject line</li>
                    <li>No questions asked - we process eligible refunds within 5-7 business days</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Refund Processing</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>Refunds are processed to the original payment method</li>
                    <li>Bank processing may take an additional 5-7 business days</li>
                    <li>You will receive email confirmation once the refund is initiated</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Cancellation</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>This is a one-time purchase, not a subscription - no recurring charges</li>
                    <li>Access automatically expires after the 2026 exam season</li>
                    <li>No cancellation needed as there are no future payments</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Exceptions</Typography>
                <Typography variant="body1" color="text.secondary" component="ul">
                    <li>Technical issues preventing access will be resolved or refunded regardless of timeline</li>
                    <li>Duplicate payments will be refunded in full</li>
                </Typography>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Contact</Typography>
                <Typography variant="body1" color="text.secondary">
                    For refund requests or questions: <a href="mailto:support@peak10.in">support@peak10.in</a>
                </Typography>

            </Paper>
        </PublicLayout>
    );
};

export default CancellationRefund;
