import {getLocalStorage} from "@mahaswami/swan-frontend";

export const createRevisionRoundForStudent = async (chapterId,conceptId) => {

    console.log("Creating revision round instance for student for chapterId: ", chapterId,conceptId);
    const dataProvider = window.swanAppFunctions.dataProvider;
    const user = JSON.parse(getLocalStorage('user') || '{}');
    const userId = user.id;
    //Check if diagnostic test already exists for student and chapter
    const {data: existingRounds} = await dataProvider.getList('revision_rounds', {
        filter: {user_id: userId, concept_id: conceptId}
    });
    let roundNumber = 1;
    if (existingRounds.length > 0) {
        roundNumber = existingRounds.length + 1;
    }

    const {data: studentRevisionRound} = await dataProvider.create('revision_rounds', {
        data: {
            user_id: userId,
            concept_id: conceptId,
            round_number: roundNumber,
            started_timestamp: new Date().toISOString(),
            status:'in_progress'
        }
    });
    console.log("Created student revision round: ", studentRevisionRound);
    return studentRevisionRound;
}