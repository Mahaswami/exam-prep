import { RESOURCE } from "../views/chapter_diagnostic_questions"

export const ChapterDiagnosticQuestionsLogic: any = {
    resource: RESOURCE,
    afterCreate: [],
    afterDelete: [],
    afterDeleteMany: [],
    afterGetList: [(params: any) => {
        console.log('ChapterDiagnosticQuestionsLogic: Sample: afterGetList hook executed');
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