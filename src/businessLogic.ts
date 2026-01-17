import { SubjectsLogic } from './logic/subjects.ts';
import { ChaptersLogic } from './logic/chapters.ts';
import { ConceptsLogic } from './logic/concepts.ts';
import { QuestionsLogic } from './logic/questions.ts';
import { ChapterDiagnosticQuestionsLogic } from './logic/chapter_diagnostic_questions.ts';
import { PaymentsLogic } from './logic/payments.ts';
import { ConceptScoresLogic } from './logic/concept_scores.ts';
import { DiagnosticTestsLogic, DiagnosticTestDetailsLogic } from './logic/diagnostic_tests.ts';
import { RevisionRoundsLogic, RevisionRoundDetailsLogic } from './logic/revision_rounds.ts';
import { TestRoundsLogic, TestRoundDetailsLogic } from './logic/test_rounds.ts';
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
    DiagnosticTestsLogic,
    DiagnosticTestDetailsLogic,
    RevisionRoundsLogic,
    RevisionRoundDetailsLogic,
    TestRoundsLogic,
    TestRoundDetailsLogic,
    ActivitiesLogic,
    // {{SWAN:INSERT:LOGIC}}
    ]; 
}    