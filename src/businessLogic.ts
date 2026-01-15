import { SubjectsLogic } from './logic/subjects.ts';
import { ChaptersLogic } from './logic/chapters.ts';
import { ConceptsLogic } from './logic/concepts.ts';
import { QuestionsLogic } from './logic/questions.ts';
import { ChapterDiagnosticQuestionsLogic } from './logic/chapter_diagnostic_questions.ts';
import { PaymentsLogic } from './logic/payments.ts';
import { ConceptScoresLogic } from './logic/concept_scores.ts';
import { ChapterDiagnosticTestsLogic, DiagnosticTestAnswersLogic } from './logic/chapter_diagnostic_tests.ts';
import { ConceptRevisionRoundsLogic, RevisionRoundQuestionsLogic } from './logic/concept_revision_rounds.ts';
import { ConceptTestRoundsLogic, TestRoundQuestionsLogic } from './logic/concept_test_rounds.ts';
import { ActivitiesLogic } from './logic/activities.ts';
// {{SWAN:INSERT:LOGIC_IMPORTS}}

export const businessLogic = () => {
    console.log('businessLogic: initialised');
    return [
        SubjectsLogic,
    ChaptersLogic,
    ConceptsLogic,
    QuestionsLogic,
    ChapterDiagnosticQuestionsLogic,
    PaymentsLogic,
    ConceptScoresLogic,
    ChapterDiagnosticTestsLogic,
    DiagnosticTestAnswersLogic,
    ConceptRevisionRoundsLogic,
    RevisionRoundQuestionsLogic,
    ConceptTestRoundsLogic,
    TestRoundQuestionsLogic,
    ActivitiesLogic,
    // {{SWAN:INSERT:LOGIC}}
    ]; 
}    