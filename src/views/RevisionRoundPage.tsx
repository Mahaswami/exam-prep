import * as React from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useEffect} from "react";
import {QuestionRound} from "../components/QuestionRound";
import {type QuestionRoundResult} from "../components/QuestionDisplay";
import { Loading, useNotify, useRedirect } from "react-admin";
import { getExistingRevisionRounds } from "../logic/revisions.ts";
import { getLocalStorage, remoteLog } from "@mahaswami/swan-frontend";
import { updateActivity } from "../logic/activities.ts";
import { sendQuestionExcusedEmail } from "../logic/email_helper.ts";

const MAX_REVISION_QUESTIONS = 8;
const MIN_REVISION_QUESTIONS = 6;
export const RevisionRoundPage: React.FC = () => {
    const { chapterId, conceptId } = useParams();
    const parsedChapterId = Number(chapterId);
    const parsedConceptId = Number(conceptId);
    const [questions, setQuestions] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [chapterName, setChapterName] = React.useState<string>('');
    const [conceptName, setConceptName] = React.useState<string>('');
    const [isInvalidRevisionRound, setIsInvalidRevisionRound] = React.useState(false);
    const notify = useNotify();
    const redirect=useRedirect();
    const navigate = useNavigate();
    const user = JSON.parse(getLocalStorage('user') || '{}');
    // Status is used to avoid duplicate create calls in dev StrictMode
    const pendingActivityRef = React.useRef({ status: 'idle', pendingActivity: null });

    useEffect(() => {
        if (!parsedChapterId || !parsedConceptId || pendingActivityRef.current.status !== 'idle') return;
        pendingActivityRef.current.status = 'creating';
        const createPendingActivity = async () => {
            try {
                const dataProvider = (window as any).swanAppFunctions.dataProvider;
                const payload = {
                    activity_type: 'revision_round_in_progress',
                    user_id: user.id,
                    chapter_id: parsedChapterId,
                    concept_id: parsedConceptId,
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

    useEffect(() => {
        let isMounted = true

        const fetchRevisionRoundQuestions = async () => {
            try {
                console.log("Fetching revisions for chapterId: ", parsedChapterId, parsedConceptId);
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const user_id = user.id;

                //Fetch diagnostic test questions based on chapterId
                const dataProvider = window.swanAppFunctions.dataProvider;
                const {data: chapter} = await dataProvider.getOne('chapters', {id: parsedChapterId});
                setChapterName(chapter.name);

                const {data: concept} = await dataProvider.getOne('concepts', {id: parsedConceptId});
                setConceptName(concept.name);

                const {data: diagnosticTestQuestions} = await dataProvider.getList('chapter_diagnostic_questions', {
                    filter: {chapter_id: parsedChapterId}
                })

                const {data: previousRevisionRounds} = await dataProvider.getList('revision_rounds',{
                    filter: {concept_id: parsedConceptId, status:'completed', user_id: user_id}});

                const {data: previousRevisionQuestions} = await dataProvider.getList('revision_round_details',{
                    filter: {revision_round_id: previousRevisionRounds.map((rr:any) => rr.id)}
                });

                //Join diagnosticTestQuestions and previousRevisionQuestions to get all questions already attempted
                const attemptedQuestionIds = new Set([
                   // ...diagnosticTestQuestions.map((dq: any) => dq.question_id),
                    ...previousRevisionQuestions.map((rq: any) => rq.question_id)
                ]);

                const {data: questions} = await dataProvider.getList('questions', {
                    filter: {concept_id: parsedConceptId,
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
                    if (isMounted) {
                        notify("ra.notification.no_questions", { 
                            multiLine: true,
                            messageArgs: {
                                chapterName: chapter.name,
                                conceptName: concept.name,
                                testName: "Test Round"
                            }
                        })
                        sendQuestionExcusedEmail("Revision Round", chapter.name, concept.name);
                        navigate(-1);
                    }
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
        return () => { isMounted = false }
    }, [parsedChapterId, parsedConceptId]);

    const onCompleteRevisionRound = async ({ timing }: QuestionRoundResult) => {
        const dataProvider = window.swanAppFunctions.dataProvider;
        let roundNumber = 1;
        const existingRounds = await getExistingRevisionRounds(parsedConceptId);
        if (existingRounds.length > 0) {
            roundNumber = existingRounds.length + 1;
        }
        const { data: master } = await dataProvider.create('revision_rounds', {
            data: {
                user_id: user.id,
                concept_id: parsedConceptId,
                round_number: roundNumber,
                started_timestamp: timing.startedAt,
                completed_timestamp: timing.completedAt,
                total_time_seconds_number: timing.totalSeconds,
                status:'completed',
            }
        });
        // Updating the pending activity
        if (pendingActivityRef.current.pendingActivity) {
            await updateActivity(pendingActivityRef.current.pendingActivity.id, {
                activity_type: "revision_round",
                activity_timestamp: new Date().toISOString(),
            });
        }
        for(const q of questions){
            await dataProvider.create('revision_round_details',{data:{
                revision_round_id: master.id,
                question_id: q.id,
                time_viewed_seconds_number: timing.perQuestion[q.id] ?? 0,
            }});
        }
        
        notify('Revision Completed Successfully')
        redirect(`/revision_rounds/${master.id}/show`);
    }


    if (isLoading || !questions.length) {
        return <Loading />;
    }
    if(isInvalidRevisionRound){
        return <div>Not enough new questions available for revision round. Please try again later or contact support.</div>;
    }
    return (
        <QuestionRound
            questions={questions}
            title={`Revision - ${chapterName} - ${conceptName}`}
            allowSolution
            showCorrectAnswer
            onComplete={onCompleteRevisionRound}
            submitLabel="Finish"
            submitLoadingLabel="Finishing..."
        />
    );
}