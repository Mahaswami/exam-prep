import {getLocalStorage} from "@mahaswami/swan-frontend";

export const checkIfDiagnosticsExist = async (chapterId) => {

        console.log("Creating diagnostic test instance for student for chapterId: ", chapterId);
        const dataProvider = window.swanAppFunctions.dataProvider;
        const user = JSON.parse(getLocalStorage('user') || '{}');
        const userId = user.id;
        //Check if diagnostic test already exists for student and chapter
        const {data: existingTests} = await dataProvider.getList('diagnostic_tests', {
            filter: {user_id: userId, chapter_id: chapterId}
        });
        if (existingTests.length > 0) {
            return true;
          
        }
        return false;
}