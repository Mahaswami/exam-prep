import * as React from "react";
import {useParams} from "react-router-dom";
import {useEffect} from "react";
import {getLocalStorage, remoteLog, setLocalStorage} from "@mahaswami/swan-frontend";
import {QuestionRound} from "../components/QuestionRound";
import {type QuestionRoundResult} from "../components/QuestionDisplay";
import {calculateConceptScores} from "../logic/score_helper.ts";
import { Loading, useNotify, useRedirect } from "react-admin";
import { updateActivity } from "../logic/activities.ts";

export const DiagnosticTestPage: React.FC = () => {
    const { chapterId } = useParams();
    const chapterIdNumber = Number(chapterId);
    const [questions, setQuestions] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [chapterName, setChapterName] = React.useState<string>('');
    const notify = useNotify();
    const redirect=useRedirect();
    const user = JSON.parse(getLocalStorage('user') || '{}');
    // Status is used to avoid duplicate create calls in dev StrictMode
    const pendingActivityRef = React.useRef({ status: 'idle', pendingActivity: null });

    useEffect(() => {
        const fetchDiagnosticTestQuestions = async () => {
            try {
                console.log("Fetching diagnostic test for chapterId: ", chapterIdNumber);

                //Fetch diagnostic test questions based on chapterId
                const dataProvider = window.swanAppFunctions.dataProvider;
                const {data: chapter} = await dataProvider.getOne('chapters', {id: chapterIdNumber});
                setChapterName(chapter.name);
                const {data: diagnosticTestQuestions} = await dataProvider.getList('chapter_diagnostic_questions', {
                    filter: {chapter_id: chapterIdNumber}
                })
                const {data: questions} = await dataProvider.getList('questions', {
                    filter: {id_eq_any: diagnosticTestQuestions.map((dq: any) => dq.question_id)},
                    meta: {prefetch: ['concepts']}
                })
                console.log("Fetched diagnostic test: ", diagnosticTestQuestions);
                setQuestions(questions);
            } catch (error) {
                console.error("Error fetching diagnostic test questions: ", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchDiagnosticTestQuestions();
    }, [chapterIdNumber]);

    useEffect(() => {
        if (!chapterIdNumber || pendingActivityRef.current.status !== 'idle') return;
        pendingActivityRef.current.status = 'creating';
        const createPendingActivity = async () => {
            try {
                const dataProvider = (window as any).swanAppFunctions.dataProvider;
                const payload = {
                    activity_type: 'diagnostic_test_in_progress',
                    user_id: user.id,
                    chapter_id: chapterIdNumber,
                    activity_timestamp: new Date().toISOString(),
                };
                const { data: pendingActivity } = await dataProvider.create('activities', { data: payload });
                pendingActivityRef.current = {
                    status: 'created',
                    pendingActivity,
                };
            } catch (error) {
                console.log("Error creating pending activity: ", error);
                remoteLog("Error creating pending activity: ", error);
            }
        }
        createPendingActivity();
    }, []);

    const onCompleteDiagnosticTest = async ({ answers, timing }: QuestionRoundResult) => {
        console.log("Diagnostic Test Completed: ", { answers, timing });
        const dataProvider = window.swanAppFunctions.dataProvider;
        
        const diagnosticDetails = questions.map(q => ({
            question_id: q.id,
            concept_id: q.concept_id,
            difficulty: q.difficulty,
            selected_answer: answers[q.id]?.selectedOption ?? null,
            is_correct: answers[q.id]?.selectedOption === q.correct_option,
            time_taken: timing.perQuestion[q.id] ?? 0,
        }));

        const {data: master} = await dataProvider.create('diagnostic_tests',{ data:{
            user_id: user.id,
            chapter_id: chapterIdNumber,
            started_timestamp: timing.startedAt,
            completed_timestamp: timing.completedAt,
            total_time_taken_seconds_number: timing.totalSeconds,
            status:'completed',
            total_questions_number: diagnosticDetails.length,
            correct_answers_number: diagnosticDetails.filter(d => d.is_correct).length
        }});
        for(const detail of diagnosticDetails){
            await dataProvider.create('diagnostic_test_details',{data:{
                diagnostic_test_id: master.id,
                question_id: detail.question_id,
                selected_answer: detail.selected_answer,
                is_correct: detail.is_correct,
                time_taken_seconds_number: detail.time_taken,
            }});
        }
        setLocalStorage('has_diagnostic_test', true);
        // Updating the pending activity
        if (pendingActivityRef.current.pendingActivity) {
            await updateActivity(pendingActivityRef.current.pendingActivity.id, {
                activity_type: "diagnostic_test",
                activity_timestamp: new Date().toISOString(),
            });
        }
        console.log("Diagnostic Test Results saved successfully.");
        const testResults = diagnosticDetails.map(
            (detail) => ({
                conceptId: detail.concept_id,
                difficulty: detail.difficulty,
                is_correct: detail.is_correct
            })
        )
        const conceptScores = calculateConceptScores(testResults)

        for(const conceptScore of conceptScores){
            await dataProvider.create('concept_scores',{data:{
                user_id: user.id,
                concept_id: conceptScore.conceptId,
                initial_comfort_level: conceptScore.score,
                updated_timestamp: new Date().toISOString()}});
        }
        console.log("Concept Scores updated successfully: ", conceptScores);
        notify('Diagnostic Test Completed Successfully')
        redirect('/concept_scores');
    }


    if (isLoading) {
        return <Loading />
    }
    if (!questions.length) {
        return <div>No questions found.</div>;
    }
    return (
        <QuestionRound
            questions={questions}
            title={`Diagnostic Test – ${chapterName}`}
            allowAnswer
            onComplete={onCompleteDiagnosticTest}
            addConceptName={true}
        />
    );
}