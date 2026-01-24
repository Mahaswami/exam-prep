import { getLocalStorage, remoteLog, swanAPI } from "@mahaswami/swan-frontend";

export const getSupportEmail = () => {
    const environments = (window as any).appConfigOptions.environments;
    const appEnv = (window as any).app_env;
    return environments[appEnv].email.support_email || 'support@peak10.in';
}

export const sendQuestionExcusedEmail = async (testName:string, chapter: string, concept?: string) => {
    try {
        const appName = (window as any).app_title
        const user = JSON.parse(getLocalStorage('user') || '{}');
        const subject = `${appName} - Question Excused`
        const message = `
            <p>Hello,</p>
            <p>A question has been excused for the following:</p>
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
        remoteLog("Error in sendQuestionExcusedEmail: ", error)
        console.log("Error in sendQuestionExcusedEmail: ", error)
    }
}