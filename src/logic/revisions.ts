import {getLocalStorage} from "@mahaswami/swan-frontend";

export const getExistingRevisionRounds = async (conceptId) => {

    console.log("Creating revision round instance for student for chapterId: ", conceptId);
    const dataProvider = window.swanAppFunctions.dataProvider;
    const user = JSON.parse(getLocalStorage('user') || '{}');
    const userId = user.id;
    //Check if diagnostic test already exists for student and chapter
    const {data: existingRounds} = await dataProvider.getList('revision_rounds', {
        filter: {user_id: userId, concept_id: conceptId}
    });
    if (existingRounds.length > 0) {
        return existingRounds;
    }

    return [];
}