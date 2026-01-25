import { useState, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, CircularProgress, Typography, Alert, Paper,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { swanAPI } from '@mahaswami/swan-frontend';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

interface ReplaceSvgDialogProps {
    fieldName: string;
    buttonLabel?: string;
    context?: 'question' | 'answer';
}

const GEMINI_MODELS = [
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Best Quality)' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Fast)' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (Fastest)' },
];

const cleanSvgOutput = (text: string): string => {
    return text
        .replace(/```svg\n?/g, '')
        .replace(/```xml\n?/g, '')
        .replace(/```html\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
};

export const ReplaceSvgDialog = ({ fieldName, buttonLabel = 'Replace SVG', context }: ReplaceSvgDialogProps) => {
    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState('Convert this image to clean SVG markup. Return only the SVG code, no explanation.');
    const [model, setModel] = useState('gemini-3-pro-preview');
    const [file, setFile] = useState<File | null>(null);
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const form = useFormContext();
    
    const cleanedSvg = useMemo(() => cleanSvgOutput(output), [output]);
    const hasSvg = cleanedSvg.includes('<svg');
    
    const handleOpen = () => {
        setOpen(true);
        setOutput('');
        setError('');
    };
    
    const handleClose = () => {
        setOpen(false);
        setPrompt('Convert this image to clean SVG markup. Return only the SVG code, no explanation.');
        setFile(null);
        setOutput('');
        setError('');
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };
    
    const handleRunPrompt = async () => {
        setLoading(true);
        setError('');
        setOutput('');
        
        try {
            const response = await swanAPI('generic_ai', {
                prompt,
                model,
            }, file ? { files: [file] } : undefined);
            
            setOutput(response.response || '');
        } catch (err: any) {
            setError(err.message || 'Failed to process');
        } finally {
            setLoading(false);
        }
    };
    
    const handleReplace = () => {
        if (!output) return;
        
        const currentValue = form.getValues(fieldName) || '';
        const svgContent = cleanedSvg;
        
        if (!svgContent.includes('<svg')) {
            setError('AI response does not contain SVG markup');
            return;
        }
        
        let newValue: string;
        if (currentValue.includes('<svg')) {
            newValue = currentValue.replace(/<svg[\s\S]*?<\/svg>/gi, svgContent);
        } else {
            newValue = currentValue + '\n' + svgContent;
        }
        
        form.setValue(fieldName, newValue, { shouldDirty: true });
        handleClose();
    };
    
    return (
        <>
            <Button
                variant="outlined"
                size="small"
                startIcon={<AutoFixHighIcon />}
                onClick={handleOpen}
            >
                {buttonLabel}
            </Button>
            
            <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
                <DialogTitle>Replace SVG with AI{context && ` (${context.charAt(0).toUpperCase() + context.slice(1)})`}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Prompt"
                            multiline
                            rows={2}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            fullWidth
                        />
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <FormControl sx={{ minWidth: 220 }}>
                                <InputLabel>Model</InputLabel>
                                <Select
                                    value={model}
                                    label="Model"
                                    onChange={(e) => setModel(e.target.value)}
                                >
                                    {GEMINI_MODELS.map(m => (
                                        <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Box>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>Attachment:</Typography>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                {file && (
                                    <Typography variant="caption" sx={{ ml: 1 }}>
                                        {file.name}
                                    </Typography>
                                )}
                            </Box>
                            <Button
                                variant="contained"
                                onClick={handleRunPrompt}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={16} /> : null}
                            >
                                {loading ? 'Processing...' : 'Run Prompt'}
                            </Button>
                        </Box>
                        
                        {error && <Alert severity="error">{error}</Alert>}
                        
                        {output && (
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, minHeight: 400 }}>
                                <Box>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Output (editable):</Typography>
                                    <TextField
                                        multiline
                                        rows={16}
                                        value={output}
                                        onChange={(e) => setOutput(e.target.value)}
                                        fullWidth
                                        InputProps={{
                                            sx: { fontFamily: 'monospace', fontSize: '0.85rem' }
                                        }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Preview:</Typography>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            minHeight: 380,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: '#f5f5f5',
                                            overflow: 'auto',
                                            '& > div': {
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            },
                                            '& svg': {
                                                width: '100%',
                                                height: 'auto',
                                                minWidth: 200,
                                                minHeight: 200,
                                                maxWidth: '100%',
                                                maxHeight: 360,
                                            }
                                        }}
                                    >
                                        {hasSvg ? (
                                            <div dangerouslySetInnerHTML={{ __html: cleanedSvg }} />
                                        ) : (
                                            <Typography color="text.secondary">
                                                No valid SVG in output
                                            </Typography>
                                        )}
                                    </Paper>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleReplace}
                        disabled={!hasSvg}
                    >
                        Replace
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
