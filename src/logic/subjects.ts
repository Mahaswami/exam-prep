import { RESOURCE } from "../views/subjects"

export const SubjectsLogic: any = {
    resource: RESOURCE,
    afterCreate: [],
    afterDelete: [],
    afterDeleteMany: [],
    afterGetList: [(params: any) => {
        console.log('SubjectsLogic: Sample: afterGetList hook executed');
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