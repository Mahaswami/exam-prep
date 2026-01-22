import * as React from "react";
import {useParams} from "react-router-dom";
import {useEffect} from "react";
import {getLocalStorage} from "@mahaswami/swan-frontend";
import {DiagnosticTestRound} from "./DiagnosticTestRound.tsx";
import {calculateConceptScores} from "../logic/score_helper.ts";
import { Loading, useNotify, useRedirect } from "react-admin";

type DiagosticTestDetail = {
    diagnostic_test_id: string;
    questionId: string;
    conceptId: string;
    difficulty: "Easy" | "Medium" | "Hard";
    selected_answer: string;
    is_correct: boolean;
    time_taken: number;
}
type DiagnosticTestResult = {
    diagnosticTestResults : DiagosticTestDetail[]
}
export const DiagnosticTestPage: React.FC = () => {
    const { chapterId,diagnosticTestId } = useParams();
    const [questions, setQuestions] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [chapterName, setChapterName] = React.useState<string>('');
    const notify = useNotify();
    const redirect=useRedirect();
    useEffect(() => {
        const fetchDiagnosticTestQuestions = async () => {
            try {
                console.log("Fetching diagnostic test for chapterId: ", chapterId);

                //Fetch diagnostic test questions based on chapterId
                const dataProvider = window.swanAppFunctions.dataProvider;
                const {data: chapter} = await dataProvider.getOne('chapters', {id: chapterId});
                setChapterName(chapter.name);
                const {data: diagnosticTestQuestions} = await dataProvider.getList('chapter_diagnostic_questions', {
                    filter: {chapter_id: chapterId}
                })
                const {data: questions} = await dataProvider.getList('questions', {
                    filter: {id_eq_any: diagnosticTestQuestions.map((dq: any) => dq.question_id)}
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
    }, [chapterId]);

    const onCompleteDiagnosticTest = async (diagnosticTestResult:DiagnosticTestResult) => {
        console.log("Diagnostic Test Completed: ", diagnosticTestResult);
        const dataProvider = window.swanAppFunctions.dataProvider;
        const diagnosticTestDetails = diagnosticTestResult.diagnosticTestResults;
        const {data: master} = await dataProvider.create('diagnostic_tests',{ data:{
            user_id: JSON.parse(getLocalStorage('user') || '{}').id,
            chapter_id: chapterId,
            completed_timestamp: new Date().toISOString(),
            status:'completed',
            total_questions_number: diagnosticTestDetails.length,
            correct_answers_number: diagnosticTestDetails.filter(d=>d.is_correct).length
        }});
        for(const detail of diagnosticTestDetails){
            await dataProvider.create('diagnostic_test_details',{data:{
                diagnostic_test_id: master.id,
                question_id: detail.questionId,
                selected_answer: detail.selected_answer,
                is_correct: detail.is_correct,
                time_taken_seconds_number: detail.time_taken,
            }});
        }

        console.log("Diagnostic Test Results saved successfully.");
        //Update Concept Mastery based on diagnostic test results
        const testResults = diagnosticTestDetails.map(
            (detail) => ({
                conceptId: detail.conceptId,
                difficulty: detail.difficulty,
                is_correct: detail.is_correct
            })
        )
        const conceptScores =  calculateConceptScores(testResults)
        const user = JSON.parse(getLocalStorage('user') || '{}');

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
        <div>
            <DiagnosticTestRound questions={questions} chapterName={chapterName}
            onComplete={onCompleteDiagnosticTest}/>
        </div>
    );
}