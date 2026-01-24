import * as React from "react";
import {useParams} from "react-router-dom";
import {useEffect} from "react";
import {QuestionRound} from "../components/QuestionRound";
import {getEligibleMarks, type QuestionRoundResult} from "../components/QuestionDisplay";
import { Loading, useNotify, useRedirect } from "react-admin";
import {calculateConceptScores} from "../logic/score_helper.ts";
import {getLocalStorage} from "@mahaswami/swan-frontend";
import { getExistingTestRounds } from "../logic/tests.ts";

const MAX_TEST_QUESTIONS = 8;
const MIN_TEST_QUESTIONS = 6;
export const TestRoundPage: React.FC = () => {
    const { chapterId,conceptId } = useParams();
    const [questions, setQuestions] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [chapterName, setChapterName] = React.useState<string>('');
    const [conceptName, setConceptName] = React.useState<string>('');
    const [isInvalidTestRound, setIsInvalidTestRound] = React.useState(false);
    const notify = useNotify();
    const redirect=useRedirect();
    useEffect(() => {
        const fetchTestRoundQuestions = async () => {
            try {
                console.log("Fetching tests for chapterId: ", chapterId,conceptId);
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
                    filter: {
                        concept_id:conceptId,
                        status: "active"
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
    }, [chapterId,conceptId]);

    const onCompleteTestRound = async ({ answers, timing }: QuestionRoundResult) => {
        const dataProvider = window.swanAppFunctions.dataProvider;
        const dbTransactionId = await dataProvider.beginTransaction();

        const userId = JSON.parse(getLocalStorage('user') || '{}').id
        let roundNumber = 1;
        const existingRounds = await getExistingTestRounds(Number(conceptId));
        if (existingRounds.length > 0) {
            roundNumber = existingRounds.length + 1;
        }
        const testRoundDetails = questions.map(q => ({
            question_id: q.id,
            eligible_marks: getEligibleMarks(q.type),
            selected_answer: answers[q.id]?.selectedOption ?? null,
            is_correct: answers[q.id]?.selectedOption === q.correct_option,
            marks_obtained: answers[q.id]?.marksObtained ?? 0,
            difficulty: q.difficulty,
            time_taken: timing.perQuestion[q.id] ?? 0,
        }));

        const totalMarks = testRoundDetails.reduce((sum, d) => sum + d.eligible_marks, 0);
        const marksObtained = testRoundDetails.reduce((sum, d) => sum + d.marks_obtained, 0);

        // Calculate score before master create to include comfort_score
        const testResults = testRoundDetails.map((detail) => ({
            questionId: detail.question_id,
            conceptId: conceptId!,
            difficulty: detail.difficulty,
            eligible_marks: detail.eligible_marks,
            marks_obtained: detail.marks_obtained,
        }));
        const scores = calculateConceptScores(testResults);
        const comfortScore = scores[0]?.score ?? 'needs_improvement';

        // Fetch previous comfort score from concept_scores
        const {data: conceptScoreRecords} = await dataProvider.getList('concept_scores',{
            filter: {user_id: userId, concept_id: conceptId}
        });
        const previousComfortScore = conceptScoreRecords[0]?.comfort_level 
                                   ?? conceptScoreRecords[0]?.initial_comfort_level 
                                   ?? null;

        const {data: master} = await dataProvider.create('test_rounds', {
            data: {
                user_id: userId,
                concept_id: conceptId,
                round_number: roundNumber,
                started_timestamp: timing.startedAt,
                completed_timestamp: timing.completedAt,
                total_time_seconds_number: timing.totalSeconds,
                total_marks_number: totalMarks,
                marks_obtained_number: marksObtained,
                status:'completed',
                previous_comfort_score: previousComfortScore,
                comfort_score: comfortScore,
            }
        });
        const bulkCreateRequests = [];
        for (const detail of testRoundDetails) {
            bulkCreateRequests.push(
                {
                    type: 'create',
                    resource: 'test_round_details',
                    params: {
                        data: {
                            test_round_id: master.id,
                            question_id: detail.question_id,
                            selected_answer: detail.selected_answer,
                            is_correct: detail.is_correct,
                            marks: detail.eligible_marks,
                            marks_obtained: detail.marks_obtained,
                            time_taken_seconds_number: detail.time_taken,
                        }
                    }
                }
            )
        }
        await dataProvider.executeBatch(bulkCreateRequests, dbTransactionId);
        await dataProvider.commitTransaction(dbTransactionId);
        // Update concept_scores
        console.log('Calculated Concept Scores: ', scores);
        const latestConceptScore = conceptScoreRecords[0];
        console.log('Latest Concept Score to be updated: ', latestConceptScore);
        await dataProvider.update('concept_scores',{id:latestConceptScore.id,data:{
            comfort_level: scores[0].score,
            updated_timestamp: new Date().toISOString()
        }});
        notify('Test Completed Successfully')
        redirect('/concept_scores');
    }


    if (isLoading) {
        return <Loading />;
    }
    if (!questions.length) {
        return <div>No questions found.</div>;
    }
    if(isInvalidTestRound){
        return <div>Not enough new questions available for test round. Please try again later or contact support.</div>;
    }
    return (
        <QuestionRound
            questions={questions}
            title={`Test Round - ${chapterName} - ${conceptName}`}
            allowAnswer
            allowHint
            allowSolution
            onComplete={onCompleteTestRound}
        />
    );
}
