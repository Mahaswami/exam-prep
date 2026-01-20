import * as React from "react";
import {useParams} from "react-router-dom";
import {useEffect} from "react";
import {TestRound} from "./TestRound.tsx";
import { useNotify, useRedirect } from "react-admin";
import {calculateConceptScores} from "../logic/score_helper.ts";
import {getLocalStorage} from "@mahaswami/swan-frontend";

type TestRoundDetail = {
    eligible_marks: number;
    marks_obtained: number;
    question_id: string;
    concept_id?: string;
    difficulty?: "Easy" | "Medium" | "Hard";
}

type TestRoundResult = {
    test_round_id: string;
    test_round_details: TestRoundDetail[];
}
const MAX_TEST_QUESTIONS = 8;
const MIN_TEST_QUESTIONS = 6;
export const TestRoundPage: React.FC = () => {
    const { chapterId,conceptId,testRoundId } = useParams();
    const [questions, setQuestions] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [chapterName, setChapterName] = React.useState<string>('');
    const [isInvalidTestRound, setIsInvalidTestRound] = React.useState(false);
    const notify = useNotify();
    const redirect=useRedirect();
    useEffect(() => {
        const fetchTestRoundQuestions = async () => {
            try {
                console.log("Fetching tests for chapterId: ", chapterId,conceptId,testRoundId);
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const user_id = user.id;

                //Fetch diagnostic test questions based on chapterId
                const dataProvider = window.swanAppFunctions.dataProvider;
                const {data: chapter} = await dataProvider.getOne('chapters', {id: chapterId});
                setChapterName(chapter.name);

                const {data: diagnosticTestQuestions} = await dataProvider.getList('chapter_diagnostic_questions', {
                    filter: {chapter_id: chapterId}
                })

                const {data: previousRevisionRounds} = await dataProvider.getList('revision_rounds',{
                    filter: {concept_id:conceptId, status:'completed',user_id:user_id}});

                const {data: previousRevisionQuestions} = await dataProvider.getList('revision_round_details',{
                    filter: {revision_round_id: previousRevisionRounds.map((rr:any) => rr.id)}
                });

                const {data: previousTestRounds} = await dataProvider.getList('test_rounds',{
                    filter: {concept_id:conceptId, status:'completed',user_id:user_id}});
                const {data: previousTestQuestions} = await dataProvider.getList('test_round_details',{
                    filter: {test_round_id: previousTestRounds.map((tr:any) => tr.id)}
                });

                //Join diagnosticTestQuestions and previousRevisionQuestions to get all questions already attempted
                const attemptedQuestionIds = new Set([
                    ...diagnosticTestQuestions.map((dq: any) => dq.question_id),
                    ...previousRevisionQuestions.map((rq: any) => rq.question_id),
                    ...previousTestQuestions.map((tq: any) => tq.question_id)
                ]);

                const {data: questions} = await dataProvider.getList('questions', {
                    filter: {concept_id:conceptId
                       // id_neq_any: Array.from(attemptedQuestionIds)
                    },
                })

                //Select questions based on difficulty levels. Atleast 2 Hard, 2 Medium, 2 Easy. If not enough questions in a category, fill from other categories.
                const easyQuestions = questions.filter((q: { difficulty: string; }) => q.difficulty === 'Easy');
                const mediumQuestions = questions.filter((q: { difficulty: string; }) => q.difficulty === 'Medium');
                const hardQuestions = questions.filter((q: { difficulty: string; }) => q.difficulty === 'Hard');
                let selectedQuestions: any[] = [];
                selectedQuestions.push(...hardQuestions.slice(0,2));
                selectedQuestions.push(...mediumQuestions.slice(0,2));
                selectedQuestions.push(...easyQuestions.slice(0,2));
                const remainingSlots = MAX_TEST_QUESTIONS - selectedQuestions.length;
                if(remainingSlots > 0){
                    const remainingQuestions = questions.filter(q => !selectedQuestions.includes(q));
                    selectedQuestions.push(...remainingQuestions.slice(0,remainingSlots));
                }
                if(selectedQuestions.length < MIN_TEST_QUESTIONS){
                    setIsInvalidTestRound(true);
                    notify('Not enough new questions available for test round. Please try again later or contact support.');
                    return;
                }
                console.log("Fetched Test questions: ", selectedQuestions);
                setQuestions(selectedQuestions);
            } catch (error) {
                console.error("Error fetching test round questions: ", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchTestRoundQuestions();
    }, [chapterId,conceptId,testRoundId]);

    const onCompleteTestRound = async (testRoundResult:TestRoundResult) => {
        const dataProvider = window.swanAppFunctions.dataProvider;
        const testRoundDetails = testRoundResult.test_round_details;
        for(const detail of testRoundDetails){
            await dataProvider.create('test_round_details',{data:{
                test_round_id: testRoundResult.test_round_id,
                question_id: detail.question_id,
                marks: detail.eligible_marks,
                marks_obtained:  detail.marks_obtained,
            }});
        }
        //Update revision round status to completed
        await dataProvider.update('test_rounds',{id:testRoundResult.test_round_id,data:{status:'completed',completed_timestamp:new Date().toISOString()}});
        const testResults = testRoundDetails.map(
            (detail) => ({
                questionId: detail.question_id,
                conceptId: conceptId,
                difficulty: detail.difficulty,
                eligible_marks: detail.eligible_marks,
                marks_obtained: detail.marks_obtained,
            })
        );
        console.log('Test Results for Score Calculation: ', testResults);
        const scores =  calculateConceptScores(testResults)
        console.log('Calculated Concept Scores: ', scores);
        const user = JSON.parse(getLocalStorage('user') || '{}');
       const {data: conceptScores} = await dataProvider.getList('concept_scores',{
            filter: {user_id: user.id, concept_id: scores[0].conceptId}
        });
       const latestConceptScore = conceptScores[0];
       console.log('Latest Concept Score to be updated: ', latestConceptScore);
       await dataProvider.update('concept_scores',{id:latestConceptScore.id,data:{
           comfort_level: scores[0].score,
           updated_timestamp: new Date().toISOString()
       }});
        notify('Test Completed Successfully')
        redirect('/concept_scores');
    }


    if (isLoading) {
        return <div>Loading Diagnostic Test...</div>;}
    if (!questions.length) {
        return <div>No questions found.</div>;
    }
    if(isInvalidTestRound){
        return <div>Not enough new questions available for test round. Please try again later or contact support.</div>;
    }
    return (
        <div>
            <TestRound questions={questions} id={testRoundId} chapterName={chapterName}
            onComplete={onCompleteTestRound}/>
        </div>
    );
}