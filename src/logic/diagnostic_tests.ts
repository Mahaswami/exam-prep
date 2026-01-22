import { RESOURCE, DETAIL_RESOURCES } from "../views/diagnostic_tests"
import { remoteLog } from "@mahaswami/swan-frontend";

const createActivityAfterTestCreate = async (result: any, dataProvider: any) => {
    try {
        const diagnosticTest = result?.data;
        let payload = {
            activity_type: 'diagnostic_test',
            user_id: diagnosticTest?.user_id,
            chapter_id: Number(diagnosticTest?.chapter_id),
            activity_timestamp: new Date().toISOString(),
        }
        await dataProvider.create('activities', { data: payload });
    } catch (Error) {
        console.log("Error in diagnosticTestAfterCreate: ", Error);
        remoteLog("Error in diagnosticTestAfterCreate: ", Error)
    }
    return result;
}

export const DiagnosticTestsLogic: any = {
    resource: RESOURCE,
    afterCreate: [createActivityAfterTestCreate],
    afterDelete: [],
    afterDeleteMany: [],
    afterGetList: [(params: any) => {
        console.log('DiagnosticTestsLogic: Sample: afterGetList hook executed');
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

export const DiagnosticTestDetailsLogic: any = {
    resource: DETAIL_RESOURCES[0],
    afterCreate: [],
    afterDelete: [],
    afterDeleteMany: [],
    afterGetList: [(params: any) => {
        console.log('DiagnosticTestDetailsLogic: Sample: afterGetList hook executed');
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