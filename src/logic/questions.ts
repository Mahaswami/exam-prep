import { getLocalStorage, swanAPI } from "@mahaswami/swan-frontend";
import { RESOURCE } from "../views/questions"

export const QuestionsLogic: any = {
    resource: RESOURCE,
    afterCreate: [],
    afterDelete: [],
    afterDeleteMany: [],
    afterGetList: [(params: any) => {
        console.log('QuestionsLogic: Sample: afterGetList hook executed');
        return params;
    }],
    afterGetMany: [],
    afterGetManyReference: [],
    afterGetOne: [],
    afterUpdate: [],
    afterUpdateMany: [],
    beforeCreate: [],
    beforeDelete: [],
    beforeDeleteMany: [],
    beforeGetList: [(params: any) => {
        if (params.filter?.status == undefined) {
            params.filter = {
                ...params.filter,
                status: "Active"
            }
        }
        return params;
    }],
    beforeGetMany: [],
    beforeGetManyReference: [],
    beforeGetOne: [],
    beforeUpdate: [],
    beforeUpdateMany: [],
    beforeSave: [removeCommentAndSendNotification],
    afterRead: [],
    afterSave: [],
}

async function removeCommentAndSendNotification(data: any) {
    if (data.status && data.status == "Active") {
        data.comment = "";
        data.comment_attachments = null;
    } else if (data.status && data.status == "Need-Review") {
        const appConfigOptions = window.appConfigOptions
        let supportEmail = appConfigOptions?.environments[window.app_env].email.support_email;
        if (!supportEmail) {
            supportEmail = "support@peak10.in";
        }
        const username = JSON.parse(getLocalStorage("user")).fullName;
        const subject = `Peak10: Question #${data.id} changed to ${data.status}`;
        const message = `
            Question #${data.id} changed to ${data.status} by ${username}.
            Comment: ${data.comment}
        `
        const composedEmail = {
            to: "lokeshwaran@mahaswami.com",
            subject: subject,
            message: message,
        }
        await swanAPI("send_email", composedEmail);
    }
    return data;
}