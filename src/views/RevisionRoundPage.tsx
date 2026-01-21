import * as React from "react";
import {useParams} from "react-router-dom";
import {useEffect} from "react";
import {RevisionRound} from "./RevisionRound.tsx";
import { Loading, useNotify, useRedirect } from "react-admin";

type RevisionRoundDetail = {
    viewed_timestamp: string;
    questionId: string;
}

type RevisionRoundResult = {
    revision_round_id: string;
    revision_round_details: RevisionRoundDetail[];
}
const MAX_REVISION_QUESTIONS = 8;
const MIN_REVISION_QUESTIONS = 6;
export const RevisionRoundPage: React.FC = () => {
    const { chapterId,conceptId,revisionRoundId } = useParams();
    const [questions, setQuestions] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [chapterName, setChapterName] = React.useState<string>('');
    const [conceptName, setConceptName] = React.useState<string>('');
    const [isInvalidRevisionRound, setIsInvalidRevisionRound] = React.useState(false);
    const notify = useNotify();
    const redirect=useRedirect();
    useEffect(() => {
        const fetchRevisionRoundQuestions = async () => {
            try {
                console.log("Fetching revisions for chapterId: ", chapterId,conceptId,revisionRoundId);
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const user_id = user.id;

                //Fetch diagnostic test questions based on chapterId
                const dataProvider = window.swanAppFunctions.dataProvider;
                const {data: chapter} = await dataProvider.getOne('chapters', {id: chapterId});
                setChapterName(chapter.name);

                const {data: concept} = await dataProvider.getOne('concepts', {id: conceptId});
                setConceptName(concept.name);

                const {data: diagnosticTestQuestions} = await dataProvider.getList('chapter_diagnostic_questions', {
                    filter: {chapter_id: chapterId}
                })

                const {data: previousRevisionRounds} = await dataProvider.getList('revision_rounds',{
                    filter: {concept_id:conceptId, status:'completed',user_id:user_id}});

                const {data: previousRevisionQuestions} = await dataProvider.getList('revision_round_details',{
                    filter: {revision_round_id: previousRevisionRounds.map((rr:any) => rr.id)}
                });

                //Join diagnosticTestQuestions and previousRevisionQuestions to get all questions already attempted
                const attemptedQuestionIds = new Set([
                   // ...diagnosticTestQuestions.map((dq: any) => dq.question_id),
                    ...previousRevisionQuestions.map((rq: any) => rq.question_id)
                ]);

                const {data: questions} = await dataProvider.getList('questions', {
                    filter: {concept_id:conceptId,
                        id_neq_any: Array.from(attemptedQuestionIds)
                        },
                })

                //Select questions based on difficulty levels. Atleast 1 Hard, 2 Medium, 2 Easy. If not enough questions in a category, fill from other categories.
                const easyQuestions = questions.filter((q: { difficulty: string; }) => q.difficulty === 'Easy');
                const mediumQuestions = questions.filter((q: { difficulty: string; }) => q.difficulty === 'Medium');
                const hardQuestions = questions.filter((q: { difficulty: string; }) => q.difficulty === 'Hard');
                let selectedQuestions: any[] = [];
                selectedQuestions.push(...hardQuestions.slice(0,1));
                selectedQuestions.push(...mediumQuestions.slice(0,2));
                selectedQuestions.push(...easyQuestions.slice(0,2));
                const remainingSlots = MAX_REVISION_QUESTIONS - selectedQuestions.length;
                if(remainingSlots > 0){
                    const remainingQuestions = questions.filter(q => !selectedQuestions.includes(q));
                    selectedQuestions.push(...remainingQuestions.slice(0,remainingSlots));
                }
                if(selectedQuestions.length < MIN_REVISION_QUESTIONS){
                    setIsInvalidRevisionRound(true);
                    notify('Not enough new questions available for test round. Please try again later or contact support.');
                    return;
                }
                console.log("Fetched Revision questions: ", selectedQuestions);
                setQuestions(selectedQuestions);
            } catch (error) {
                console.error("Error fetching revision round questions: ", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchRevisionRoundQuestions();
    }, [chapterId,conceptId,revisionRoundId]);

    const onCompleteRevisionRound = async (revisionRoundResult:RevisionRoundResult) => {
        const dataProvider = window.swanAppFunctions.dataProvider;
        const revisionRoundDetails = revisionRoundResult.revision_round_details;
        for(const detail of revisionRoundDetails){
            await dataProvider.create('revision_round_details',{data:{
                revision_round_id: revisionRoundResult.revision_round_id,
                question_id: detail.questionId,
                viewed_timestamp: detail.viewed_timestamp,
            }});
        }
        //Update revision round status to completed
        await dataProvider.update('revision_rounds',{id:revisionRoundResult.revision_round_id,data:{status:'completed',completed_timestamp:new Date().toISOString()}});
        notify('Revision Completed Successfully')
        redirect('/concept_scores');
    }


    if (isLoading) {
        return <Loading />;
    }
    if (!questions.length) {
        return <div>No questions found.</div>;
    }
    if(isInvalidRevisionRound){
        return <div>Not enough new questions available for revision round. Please try again later or contact support.</div>;
    }
    return (
        <div>
            <RevisionRound questions={questions}
                           id={revisionRoundId}
                           chapterName={chapterName} conceptName={conceptName}
            onComplete={onCompleteRevisionRound}/>
        </div>
    );
}