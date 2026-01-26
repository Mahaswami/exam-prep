import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { QuestionRound } from "../components/QuestionRound";
import { getEligibleMarks, type QuestionRoundResult } from "../components/QuestionDisplay";
import { Loading, useNotify, useRedirect } from "react-admin";
import { getLocalStorage, remoteLog } from "@mahaswami/swan-frontend";
import { updateActivity } from "../logic/activities";
import { sendQuestionExhaustedEmail } from "../logic/email_helper";
import { calculateConceptScores } from "../logic/score_helper";
import { 
    type RoundType, 
    ROUND_CONFIGS, 
    selectQuestions 
} from "../logic/roundConfigs";

interface PracticeRoundPageProps {
    roundType: RoundType;
}

export const PracticeRoundPage: React.FC<PracticeRoundPageProps> = ({ roundType }) => {
    const config = ROUND_CONFIGS[roundType];
    
    const { chapterId, conceptId } = useParams();
    const parsedChapterId = Number(chapterId);
    const parsedConceptId = Number(conceptId);
    
    const [questions, setQuestions] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [chapterName, setChapterName] = React.useState<string>('');
    const [conceptName, setConceptName] = React.useState<string>('');
    const [isInvalidRound, setIsInvalidRound] = React.useState(false);
    
    const notify = useNotify();
    const redirect = useRedirect();
    const navigate = useNavigate();
    const user = JSON.parse(getLocalStorage('user') || '{}');
    
    const pendingActivityRef = React.useRef<{ status: string; pendingActivity: any }>({ 
        status: 'idle', 
        pendingActivity: null 
    });

    // Create pending activity on mount
    useEffect(() => {
        if (!parsedChapterId || !parsedConceptId || pendingActivityRef.current.status !== 'idle') return;
        pendingActivityRef.current.status = 'creating';
        
        const createPendingActivity = async () => {
            try {
                const dataProvider = (window as any).swanAppFunctions.dataProvider;
                const payload = {
                    activity_type: config.activityTypeInProgress,
                    user_id: user.id,
                    chapter_id: parsedChapterId,
                    concept_id: parsedConceptId,
                    activity_timestamp: new Date().toISOString(),
                };
                const { data: pendingActivity } = await dataProvider.create('activities', { data: payload });
                pendingActivityRef.current = { status: 'created', pendingActivity };
            } catch (error) {
                console.log("Error creating pending activity: ", error);
                remoteLog("Error creating pending activity: ", error);
            }
        };
        createPendingActivity();
    }, [parsedChapterId, parsedConceptId, config.activityTypeInProgress, user.id]);

    // Fetch questions
    useEffect(() => {
        let isMounted = true;

        const fetchQuestions = async () => {
            try {
                console.log(`Fetching ${config.displayName} questions for:`, parsedChapterId, parsedConceptId);
                const user_id = user.id;
                const dataProvider = (window as any).swanAppFunctions.dataProvider;

                // Fetch chapter and concept names
                const { data: chapter } = await dataProvider.getOne('chapters', { id: parsedChapterId });
                setChapterName(chapter.name);

                const { data: concept } = await dataProvider.getOne('concepts', { id: parsedConceptId });
                setConceptName(concept.name);

                // Build exclusion set based on config
                const attemptedQuestionIds = new Set<number>();

                // Exclude diagnostic questions if configured
                if (config.excludeDiagnostic) {
                    const { data: diagnosticQuestions } = await dataProvider.getList('chapter_diagnostic_questions', {
                        filter: { chapter_id: parsedChapterId }
                    });
                    diagnosticQuestions.forEach((dq: any) => attemptedQuestionIds.add(dq.question_id));
                }

                // Exclude revision questions if configured
                if (config.excludeRevisions) {
                    const { data: revisionRounds } = await dataProvider.getList('revision_rounds', {
                        filter: { concept_id: parsedConceptId, status: 'completed', user_id }
                    });
                    if (revisionRounds.length > 0) {
                        const { data: revisionDetails } = await dataProvider.getList('revision_round_details', {
                            filter: { revision_round_id: revisionRounds.map((rr: any) => rr.id) }
                        });
                        revisionDetails.forEach((rq: any) => attemptedQuestionIds.add(rq.question_id));
                    }
                }

                // Exclude test questions if configured
                if (config.excludeTests) {
                    const { data: testRounds } = await dataProvider.getList('test_rounds', {
                        filter: { concept_id: parsedConceptId, status: 'completed', user_id }
                    });
                    if (testRounds.length > 0) {
                        const { data: testDetails } = await dataProvider.getList('test_round_details', {
                            filter: { test_round_id: testRounds.map((tr: any) => tr.id) }
                        });
                        testDetails.forEach((tq: any) => attemptedQuestionIds.add(tq.question_id));
                    }
                }

                // Fetch available questions
                const { data: availableQuestions } = await dataProvider.getList('questions', {
                    filter: {
                        concept_id: parsedConceptId,
                        status: 'active',
                        id_neq_any: Array.from(attemptedQuestionIds),
                    },
                });

                // Select questions using unified selection logic
                const selectedQuestions = selectQuestions(
                    availableQuestions,
                    config.selection.quotas,
                    config.selection.maxSize,
                    config.selection.typeQuotas
                );

                // Check minimum requirement
                if (selectedQuestions.length < config.selection.minSize) {
                    setIsInvalidRound(true);
                    if (isMounted) {
                        notify("ra.notification.no_questions", {
                            multiLine: true,
                            messageArgs: {
                                chapterName: chapter.name,
                                conceptName: concept.name,
                                testName: config.displayName,
                            },
                        });
                        sendQuestionExhaustedEmail(config.displayName, chapter.name, concept.name);
                        navigate(-1);
                    }
                    return;
                }

                console.log(`Selected ${config.displayName} questions:`, selectedQuestions);
                setQuestions(selectedQuestions);
            } catch (error) {
                console.error(`Error fetching ${config.displayName} questions:`, error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuestions();
        return () => { isMounted = false; };
    }, [parsedChapterId, parsedConceptId, config, user.id, notify, navigate]);

    // Complete round handler
    const onCompleteRound = async ({ answers, timing }: QuestionRoundResult) => {
        const dataProvider = (window as any).swanAppFunctions.dataProvider;
        const dbTransactionId = await dataProvider.beginTransaction();

        try {
            // Get existing round count for round number
            const { data: existingRounds } = await dataProvider.getList(config.masterResource, {
                filter: { concept_id: parsedConceptId, status: 'completed', user_id: user.id }
            });
            const roundNumber = existingRounds.length + 1;

            // Build master record data
            const masterData: Record<string, any> = {
                user_id: user.id,
                concept_id: parsedConceptId,
                round_number: roundNumber,
                started_timestamp: timing.startedAt,
                completed_timestamp: timing.completedAt,
                total_time_seconds_number: timing.totalSeconds,
                status: 'completed',
            };

            // Add scoring fields for test rounds
            let testRoundDetails: any[] = [];
            if (config.hasScoring && answers) {
                testRoundDetails = questions.map(q => ({
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

                // Calculate comfort score
                const testResults = testRoundDetails.map((detail) => ({
                    questionId: detail.question_id,
                    conceptId: String(parsedConceptId),
                    difficulty: detail.difficulty,
                    eligible_marks: detail.eligible_marks,
                    marks_obtained: detail.marks_obtained,
                }));
                const scores = calculateConceptScores(testResults);
                const comfortScore = scores[0]?.score ?? 'needs_improvement';

                // Get previous comfort score
                const { data: conceptScoreRecords } = await dataProvider.getList('concept_scores', {
                    filter: { user_id: user.id, concept_id: parsedConceptId }
                });
                const previousComfortScore = conceptScoreRecords[0]?.comfort_level
                    ?? conceptScoreRecords[0]?.initial_comfort_level
                    ?? null;

                masterData.total_marks_number = totalMarks;
                masterData.marks_obtained_number = marksObtained;
                masterData.previous_comfort_score = previousComfortScore;
                masterData.comfort_score = comfortScore;
            }

            // Create master record
            const { data: master } = await dataProvider.create(config.masterResource, { data: masterData });

            // Build detail records
            const bulkCreateRequests = [];
            
            if (config.hasScoring) {
                // Test round details with scoring
                for (const detail of testRoundDetails) {
                    bulkCreateRequests.push({
                        type: 'create',
                        resource: config.detailResource,
                        params: {
                            data: {
                                [config.detailForeignKey]: master.id,
                                question_id: detail.question_id,
                                selected_answer: detail.selected_answer,
                                is_correct: detail.is_correct,
                                marks: detail.eligible_marks,
                                marks_obtained: detail.marks_obtained,
                                time_taken_seconds_number: detail.time_taken,
                            },
                        },
                    });
                }
            } else {
                // Revision round details (no scoring)
                for (const question of questions) {
                    bulkCreateRequests.push({
                        type: 'create',
                        resource: config.detailResource,
                        params: {
                            data: {
                                [config.detailForeignKey]: master.id,
                                question_id: question.id,
                                time_viewed_seconds_number: timing.perQuestion[question.id] ?? 0,
                            },
                        },
                    });
                }
            }

            // Update pending activity
            if (pendingActivityRef.current.pendingActivity) {
                await updateActivity(pendingActivityRef.current.pendingActivity.id, {
                    activity_type: config.activityTypeComplete,
                    activity_timestamp: new Date().toISOString(),
                });
            }

            await dataProvider.executeBatch(bulkCreateRequests, dbTransactionId);
            await dataProvider.commitTransaction(dbTransactionId);

            // Update concept scores for test rounds
            if (config.hasScoring) {
                const { data: conceptScoreRecords } = await dataProvider.getList('concept_scores', {
                    filter: { user_id: user.id, concept_id: parsedConceptId }
                });
                if (conceptScoreRecords.length > 0) {
                    const testResults = testRoundDetails.map((detail) => ({
                        questionId: detail.question_id,
                        conceptId: String(parsedConceptId),
                        difficulty: detail.difficulty,
                        eligible_marks: detail.eligible_marks,
                        marks_obtained: detail.marks_obtained,
                    }));
                    const scores = calculateConceptScores(testResults);
                    await dataProvider.update('concept_scores', {
                        id: conceptScoreRecords[0].id,
                        data: {
                            comfort_level: scores[0]?.score,
                            updated_timestamp: new Date().toISOString(),
                        },
                    });
                }
            }

            notify(config.successMessage);
            redirect(config.redirectPath(master.id));
        } catch (error) {
            console.error(`Error completing ${config.displayName}:`, error);
            await dataProvider.rollbackTransaction(dbTransactionId);
            notify(`Failed to complete ${config.displayName}`, { type: 'error' });
        }
    };

    if (isLoading || !questions.length) {
        return <Loading />;
    }

    if (isInvalidRound) {
        return (
            <div>
                Not enough new questions available for {config.displayName.toLowerCase()}. 
                Please try again later or contact support.
            </div>
        );
    }

    return (
        <QuestionRound
            questions={questions}
            title={`${config.titlePrefix} - ${chapterName} - ${conceptName}`}
            allowAnswer={config.allowAnswer}
            allowHint={config.allowHint}
            allowSolution={config.allowSolution}
            showCorrectAnswer={config.showCorrectAnswer}
            onComplete={onCompleteRound}
            submitLabel={config.submitLabel}
            submitLoadingLabel={config.submitLoadingLabel}
        />
    );
};

// Convenience exports for routing
export const RevisionRoundPage: React.FC = () => <PracticeRoundPage roundType="revision" />;
export const TestRoundPage: React.FC = () => <PracticeRoundPage roundType="test" />;
