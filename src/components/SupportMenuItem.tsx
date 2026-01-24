import { closeDialog, openDialog } from "@mahaswami/swan-frontend";
import { Help, Send } from "@mui/icons-material";
import {
    Box,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography
} from "@mui/material";
import React from "react";
import {
    Button,
    FileField,
    FileInput,
    Form,
    required,
    TextInput,
    useNotify,
    useTranslate,
} from "react-admin";
import { getSupportEmail, sendAskSupportEmail } from "../logic/email_helper";

export const AskSupport = () => {
    const translate = useTranslate();
    const toggleSupportTitle = translate('ra.action.ask_support');

    const handleOpenSupport = () => {
        openDialog(<AskSupportDialog />, {
            Title: (
                <Typography variant="h6">
                    {toggleSupportTitle}
                </Typography>
            ),
        });
    };

    return (
        <Tooltip title={toggleSupportTitle} enterDelay={300}>
            <IconButton
                onClick={handleOpenSupport}
                color="inherit"
            >
                <Help />
            </IconButton>
        </Tooltip>
    );
};

const AskSupportDialog = () => {
    const notify = useNotify();
    const translate = useTranslate();
    const [isSending, setIsSending] = React.useState(false);

    const handleSubmit = async (values: { message: string, attachments: any }) => {
        try {
            setIsSending(true)
            let attachments = values.attachments;
            if (attachments) {
                attachments = attachments.map(async (attachment: any) => {
                    let buffer = Buffer.from(await attachment.rawFile.arrayBuffer());
                    const emailAttachment = {
                        filename: attachment.title,
                        mimeType: attachment.rawFile.type,
                        content: buffer.toString('base64'),
                    };
                    return emailAttachment;
                });
                attachments = await Promise.all(attachments);
                values.attachments = attachments;
            }
            await sendAskSupportEmail(values);
            notify(translate("ra.notification.support_request_sent_success", {
                smart_count: 1,
                supportEmail: getSupportEmail(),
            }), {
                type: "success",
            });
            closeDialog();
        } catch (error) {
            notify("Failed to send support request", {
                type: "error",
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Form
            onSubmit={handleSubmit}
            toolbar={false}
        >
            <TextInput
                source="message"
                label="Your message"
                placeholder="Describe your issue or question"
                multiline
                minRows={3}
                fullWidth
                validate={[required()]}
                helperText={false}
            />
            <FileInput source="attachments" multiple>
                <FileField source="src" title="title"/>
            </FileInput>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                }}
            >
                <Button
                    type="submit"
                    size="medium"
                    variant="contained"
                    color="primary"
                    disabled={isSending}
                    startIcon={
                        isSending 
                            ? <CircularProgress size={16} color="inherit" /> 
                            : <Send />
                    }
                    label="Send"
                />
            </Box>
        </Form>
    );
};
