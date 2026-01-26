import { getLocalStorage, remoteLog, swanAPI } from "@mahaswami/swan-frontend";

export const getSupportEmail = () => {
    const environments = (window as any).appConfigOptions.environments;
    const appEnv = (window as any).app_env;
    return environments[appEnv].email.support_email || 'support@peak10.in';
}

export const sendQuestionExhaustedEmail = async (testName:string, chapter: string, concept?: string) => {
    try {
        const appName = (window as any).app_title
        const env = (window as any).app_env
        const user = JSON.parse(getLocalStorage('user') || '{}');
        const subject = `(${env}) All Questions Exhausted - ${chapter} - ${concept}`
        const message = `
            <p>Hello,</p>
            <p>All questions have been exhausted for the following:</p>
            <ul>
                <li><strong>Test:</strong> ${testName}</li>
                <li><strong>Chapter:</strong> ${chapter}</li>
                ${concept ? `<li><strong>Concept:</strong> ${concept}</li>` : ''}
            </ul>
            <p><strong>For User:</strong> ${user.fullName}</p>

            <p>Regards,<br/>${appName} Team</p>
        `
        await swanAPI("send_email", {
            to: getSupportEmail(),
            subject, 
            message
        })
    } catch (error) {
        remoteLog("Error in sendQuestionExhaustedEmail: ", error)
        console.log("Error in sendQuestionExhaustedEmail: ", error)
    }
}

export const sendAskSupportEmail = async (values:{ message: string, attachments: any }) => {
    try {
        const appName = (window as any).app_title
        const user = JSON.parse(getLocalStorage('user') || '{}');
        
        const subject = `${appName} - Ask Support`
        const messageBody = `
            <p>Hello,</p>
            <p>A user "${user.fullName}" has asked support for the following:</p>
            <p>${values.message}</p>
            
            <p>Regards,<br/>${appName} Team</p>
        `;
        await swanAPI("send_email", {
            to: getSupportEmail(),
            subject, 
            message: messageBody,
            attachments: values.attachments
        })
    } catch (error) {
        remoteLog("Error in sendAskSupportEmail: ", error)
        console.log("Error in sendAskSupportEmail: ", error)
    }
}