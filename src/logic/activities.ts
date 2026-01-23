import { RESOURCE } from "../views/activities"
import { remoteLog } from "@mahaswami/swan-frontend";

export const ActivitiesLogic: any = {
    resource: RESOURCE,
    afterCreate: [],
    afterDelete: [],
    afterDeleteMany: [],
    afterGetList: [(params: any) => {
        console.log('ActivitiesLogic: Sample: afterGetList hook executed');
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
    beforeGetList: [],
    beforeGetMany: [],
    beforeGetManyReference: [],
    beforeGetOne: [],
    beforeUpdate: [],
    beforeUpdateMany: [],
    beforeSave: [],
    afterRead: [],
    afterSave: [],
}

export const createStudentLoginActivity = async (dataProvider: any, user: any) => {
    try {
          let payload = {
            user_id: user.id,
            activity_type: 'student_login',
            activity_timestamp: new Date().toISOString()
        }
        await dataProvider.create('activities', { data: payload });
    } catch (error) {
        console.log("Error in createStudentLoginActivity: ", error);
        remoteLog("Error in createStudentLoginActivity: ", error)
    }
}

export const updateActivity = async (activityId: number, updatedData: any) => {
    try {
        const dataProvider = (window as any).swanAppFunctions.dataProvider;
        await dataProvider.update('activities', { id: activityId, data: updatedData });
    } catch (error) {
        console.log("Error in updateActivity: ", error);
        remoteLog("Error in updateActivity: ", error)
    }
}

