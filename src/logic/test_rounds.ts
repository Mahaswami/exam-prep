import { RESOURCE, DETAIL_RESOURCES } from "../views/test_rounds"
import { remoteLog } from "@mahaswami/swan-frontend";

const createActivityAfterTestRoundCreate = async (result: any, dataProvider: any) => {
    try {
        const testRound = result?.data;
        let payload = {
            activity_type: 'test_round',
            user_id: testRound?.user_id,
            concept_id: Number(testRound?.concept_id),
            activity_timestamp: new Date().toISOString(),
        }
        await dataProvider.create('activities', { data: payload });
    } catch (Error) {
        console.log("Error in createActivityAfterTestRoundCreate: ", Error);
        remoteLog("Error in createActivityAfterTestRoundCreate: ", Error)
    }
    return result;
}

export const TestRoundsLogic: any = {
    resource: RESOURCE,
    afterCreate: [createActivityAfterTestRoundCreate],
    afterDelete: [],
    afterDeleteMany: [],
    afterGetList: [(params: any) => {
        console.log('TestRoundsLogic: Sample: afterGetList hook executed');
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

export const TestRoundDetailsLogic: any = {
    resource: DETAIL_RESOURCES[0],
    afterCreate: [],
    afterDelete: [],
    afterDeleteMany: [],
    afterGetList: [(params: any) => {
        console.log('TestRoundDetailsLogic: Sample: afterGetList hook executed');
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