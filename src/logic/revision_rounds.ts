import { RESOURCE, DETAIL_RESOURCES } from "../views/revision_rounds"
import { remoteLog } from "@mahaswami/swan-frontend";

const createActivityAfterRevisionRoundCreate = async (result: any, dataProvider: any) => {
    try {
        const revisionRound = result?.data;
        let payload = {
            activity_type: 'revision_round',
            user_id: revisionRound?.user_id,
            concept_id: Number(revisionRound?.concept_id),
            activity_timestamp: new Date().toISOString(),
        }
        await dataProvider.create('activities', { data: payload });
    } catch (Error) {
        console.log("Error in createActivityAfterRevisionRoundCreate: ", Error);
        remoteLog("Error in createActivityAfterRevisionRoundCreate: ", Error)
    }
    return result;
};

export const RevisionRoundsLogic: any = {
    resource: RESOURCE,
    afterCreate: [createActivityAfterRevisionRoundCreate],
    afterDelete: [],
    afterDeleteMany: [],
    afterGetList: [(params: any) => {
        console.log('RevisionRoundsLogic: Sample: afterGetList hook executed');
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

export const RevisionRoundDetailsLogic: any = {
    resource: DETAIL_RESOURCES[0],
    afterCreate: [],
    afterDelete: [],
    afterDeleteMany: [],
    afterGetList: [(params: any) => {
        console.log('RevisionRoundDetailsLogic: Sample: afterGetList hook executed');
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