import {getLocalStorage} from "@mahaswami/swan-frontend";

export const createDiagnosticTestForStudent = async (chapterId,notify) => {

        console.log("Creating diagnostic test instance for student for chapterId: ", chapterId);
        const dataProvider = window.swanAppFunctions.dataProvider;
        const user = JSON.parse(getLocalStorage('user') || '{}');
        const userId = user.id;
        //Check if diagnostic test already exists for student and chapter
        const {data: existingTests} = await dataProvider.getList('diagnostic_tests', {
            filter: {user_id: userId, chapter_id: chapterId}
        });
        if (existingTests.length > 0) {
            console.log("Diagnostic test already exists for student: ", existingTests[0]);
            //throw error
            notify("You have already taken Diagnostic Test for this chapter.","info");
            throw new Error("Diagnostic test already exists for student");
        }
        const {data: studentDiagnosticTest} = await dataProvider.create('diagnostic_tests', {
            data: {
                user_id: userId,
                chapter_id: chapterId,
                started_timestamp: new Date().toISOString(),
                status: 'in_progress'
            }
        });
        console.log("Created student diagnostic test: ", studentDiagnosticTest);
        return studentDiagnosticTest;
}