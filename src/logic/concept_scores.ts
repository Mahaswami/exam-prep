import { RESOURCE } from "../views/concept_scores"

export const ConceptScoresLogic: any = {
    resource: RESOURCE,
    afterCreate: [],
    afterDelete: [],
    afterDeleteMany: [],
    afterGetList: [(params: any) => {
        console.log('ConceptScoresLogic: Sample: afterGetList hook executed');
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