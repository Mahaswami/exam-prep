
import StartIcon from '@mui/icons-material/Start';
import HandymanIcon from '@mui/icons-material/Handyman';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { Box, Typography } from '@mui/material';
import { Menu } from "react-admin";
import { CustomRoutes, Title} from "react-admin";
import { Route } from "react-router-dom";
import { HistoryMenu, HistoryResource } from './views/history.tsx';
import { UsersMenu, UsersResource } from './views/users.tsx';
import { DocumentTemplatesMenu, DocumentTemplatesResource } from './views/document_templates.tsx';
import { DigitalSignaturesResource } from './views/digital_signatures.tsx';
import { isHistoryModuleActive, isDocumentGenerationModuleActive } from '@mahaswami/swan-frontend';
import { AutoLayoutMenu } from '@mahaswami/swan-frontend';
import { AdminDashboard, StudentDashboard } from './analytics';

import { SubjectsResource, SubjectsMenu } from './views/subjects.tsx';
import { ChaptersResource, ChaptersMenu } from './views/chapters.tsx';
import { ConceptsResource, ConceptsMenu } from './views/concepts.tsx';
import { QuestionsResource, QuestionsMenu } from './views/questions.tsx';
import { ChapterDiagnosticQuestionsResource, ChapterDiagnosticQuestionsMenu } from './views/chapter_diagnostic_questions.tsx';
import { PaymentsResource, PaymentsMenu } from './views/payments.tsx';
import { ConceptScoresResource, ConceptScoresMenu } from './views/concept_scores.tsx';
import { DiagnosticTestsResource, DiagnosticTestAnswersResource, DiagnosticTestsMenu } from './views/diagnostic_tests.tsx';
import { ConceptRevisionRoundsResource, RevisionRoundQuestionsResource, ConceptRevisionRoundsMenu } from './views/concept_revision_rounds.tsx';
import { ConceptTestRoundsResource, TestRoundQuestionsResource, ConceptTestRoundsMenu } from './views/concept_test_rounds.tsx';
import { ActivitiesResource, ActivitiesMenu } from './views/activities.tsx';
// {{SWAN:INSERT:RESOURCE_IMPORTS}}

const Welcome = () => {
    return (
        <>
            <Title title={'App Builder'} />
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '80vh',
                    gap: 2
                }}
            >
                <HandymanIcon sx={{ fontSize: '18rem', color: 'primary.main' }} />
                <Typography variant="h2" component="h1" fontWeight="bold" color="text.primary">
                    Welcome to the App Builder
                </Typography>
            </Box>
        </>
    )  
}

export const configureResources = (permissions: any) => {
    let result = [
        <CustomRoutes key={103}>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/analytics/admin" element={<AdminDashboard />} />
            <Route path="/analytics/student" element={<StudentDashboard />} />
        </CustomRoutes>,
        HistoryResource,
        UsersResource,    
        DocumentTemplatesResource,
        DigitalSignaturesResource,
        SubjectsResource,
    ChaptersResource,
    ConceptsResource,
    QuestionsResource,
    ChapterDiagnosticQuestionsResource,
    PaymentsResource,
    ConceptScoresResource,
    DiagnosticTestsResource,
    DiagnosticTestAnswersResource,
    ConceptRevisionRoundsResource,
    RevisionRoundQuestionsResource,
    ConceptTestRoundsResource,
    TestRoundQuestionsResource,
    ActivitiesResource,
    // SWAN:INSERT:RESOURCE_ENTRY
    ]

    return result;
}

export const configureMenus = (permissions: any) => {

    //TODO: This could be done in a less verbose way by having a hash and use React.createElement style

        const superAdminMenus = 
        <>
        </>        

        const adminMenusAll = 
        <>
            <AutoLayoutMenu>
                <Menu.Item to="/analytics/admin" primaryText="Dashboard" leftIcon={<DashboardIcon />} />
                <Menu.Item to="/analytics/student" primaryText="Student Progress" leftIcon={<AssessmentIcon />} />
                {isDocumentGenerationModuleActive() && <DocumentTemplatesMenu />}
                <SubjectsMenu />
            <ChaptersMenu />
            <ConceptsMenu />
            <QuestionsMenu />
            <ChapterDiagnosticQuestionsMenu />
            <PaymentsMenu />
            <ConceptScoresMenu />
            <DiagnosticTestsMenu />
            <ConceptRevisionRoundsMenu />
            <ConceptTestRoundsMenu />
            <ActivitiesMenu />
            {/* {{SWAN:INSERT:MENU_ENTRY}} */}
                {isHistoryModuleActive() && <HistoryMenu />}
                <UsersMenu />
            </AutoLayoutMenu>
        </>   
        
        const studentMenus = 
        <>
            <AutoLayoutMenu maxCount={6}>
            <Menu.Item to="/analytics/student" primaryText="My Progress" leftIcon={<AssessmentIcon />} />
            <ConceptScoresMenu />
            <DiagnosticTestsMenu />
            <ConceptRevisionRoundsMenu />
            <ConceptTestRoundsMenu />
            </AutoLayoutMenu>
        </>            
        
        if ('super_admin' === permissions) {
            return superAdminMenus;
        }
        if ('admin' === permissions) {
            return adminMenusAll;
        }      
        if ('student' === permissions) {
            return studentMenus;
        }  
        return null;

}

export const configureLandingPage = (permissions: any) => {
    let startPage = undefined 
    if ([ 'admin'].includes( permissions )) {
        startPage = "/analytics/admin"
    }
    if ([ 'student'].includes( permissions )) {
        startPage = "/analytics/student"
    }
    return {
        "super_admin": "/tenants",
        "admin": startPage,
        "student": startPage,
    }
}