import { Article, Category, Refresh } from '@mui/icons-material';
import { Box, CardContent, CardHeader, Button as MuiButton } from '@mui/material';
import * as React from 'react';
import {
    Create,
    CreateProps,
    DataTable,
    Edit,
    EditProps,
    List,
    Menu,
    Show,
    ShowProps,
    SimpleForm,
    SimpleFormProps,
    SimpleShowLayout,
    TextField,
    TextInput,
    type ListProps, DateField, DateInput, DateTimeInput, NumberField, NumberInput, SelectField, SelectInput, AutocompleteInput, required, BooleanField, BooleanInput, usePermissions, useRecordContext, useDataProvider, useNotify, useRefresh,
    TopToolbar,
    CreateButton
} from "react-admin";
import {
    createDefaults,
    editDefaults,
    formDefaults,
    listDefaults,
    showDefaults,
    tableDefaults,
    Resource,
    RowActions,
    TabbedDetailLayout,
    CardGrid,
    ReferenceLiveFilter,
    DateLiveFilter,
    ChoicesLiveFilter,
    NumberLiveFilter,
    BooleanLiveFilter,
    TextLiveFilter,
    createReferenceField,
    createReferenceInput,
    recordRep,
    RelativeDateField,
    openDialog
} from '@mahaswami/swan-frontend';
import { UsersReferenceField, UsersReferenceInput } from './users';
import { ChaptersReferenceField, ChaptersReferenceInput } from './chapters';
import { QuestionsReferenceField, QuestionsReferenceInput } from './questions';
import { calculateConceptScores } from '../logic/score_helper';
import { TestPreparationDialog } from '../analytics/StudentDashboard';
import { QuestionDisplay } from '../components/QuestionDisplay';

export const RESOURCE = "diagnostic_tests"
export const DETAIL_RESOURCES = ["diagnostic_test_details"]
export const ICON = Article
export const DETAIL_ICONS = [Category]
export const PREFETCH: string[] = ["users", "chapters"]
export const DETAIL_PREFETCH = [[RESOURCE, "questions"]]

export const DiagnosticTestsReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const DiagnosticTestsReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const DiagnosticTestDetailsReferenceField = createReferenceField(DETAIL_RESOURCES[0], DETAIL_PREFETCH[0]);
export const DiagnosticTestDetailsReferenceInput = createReferenceInput(DETAIL_RESOURCES[0], DETAIL_PREFETCH[0]);
export const statusChoices = [{ id: 'in_progress', name: 'In Progress' }, { id: 'completed', name: 'Completed' }, { id: 'abandoned', name: 'Abandoned' }];

const isStudent = (permissions: any) => permissions === 'student';

const RegenConceptScoresButton = () => {
    const record = useRecordContext();
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const refresh = useRefresh();
    const [loading, setLoading] = React.useState(false);

    const handleRegen = async () => {
        if (!record) return;
        setLoading(true);
        try {
            const userId = record.user_id;
            const chapterId = record.chapter_id;
            
            // Get concepts for this chapter
            const { data: concepts } = await dataProvider.getList('concepts', {
                pagination: { page: 1, perPage: 1000 },
                sort: { field: 'id', order: 'ASC' },
                filter: { chapter_id: chapterId }
            });
            const conceptIds = concepts.map((c: any) => c.id);
            
            // Delete existing concept_scores for this user + chapter concepts
            const { data: existingScores } = await dataProvider.getList('concept_scores', {
                pagination: { page: 1, perPage: 1000 },
                sort: { field: 'id', order: 'ASC' },
                filter: { user_id: userId, concept_id_eq_any: conceptIds }
            });
            for (const score of existingScores) {
                await dataProvider.delete('concept_scores', { id: score.id });
            }
            
            // Get diagnostic test details with question data
            const { data: details } = await dataProvider.getList('diagnostic_test_details', {
                pagination: { page: 1, perPage: 1000 },
                sort: { field: 'id', order: 'ASC' },
                filter: { diagnostic_test_id: record.id },
                meta: { prefetch: ['questions'] }
            });
            
            // Build test results with concept and difficulty from question
            const testResults = details.map((d: any) => ({
                conceptId: String(d.question?.concept_id || d.question_id),
                difficulty: d.question?.difficulty || 'Medium',
                is_correct: d.is_correct
            }));
            
            // Calculate new scores
            const conceptScores = calculateConceptScores(testResults);
            
            // Create new concept_scores
            for (const score of conceptScores) {
                await dataProvider.create('concept_scores', {
                    data: {
                        user_id: userId,
                        concept_id: score.conceptId,
                        initial_comfort_level: score.score,
                        updated_timestamp: new Date().toISOString()
                    }
                });
            }
            
            notify(`Regenerated ${conceptScores.length} concept scores`, { type: 'success' });
            refresh();
        } catch (error) {
            console.error('Error regenerating concept scores:', error);
            notify('Error regenerating concept scores', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <MuiButton
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={handleRegen}
            disabled={loading}
        >
            {loading ? 'Regenerating...' : 'Regen Concept Scores'}
        </MuiButton>
    );
};

const filters = (permissions: any) => [
    !isStudent(permissions) && <ReferenceLiveFilter source="user_id" show reference="users" label="User" />,
    <ReferenceLiveFilter show source="chapter_id" through="subject_id" label="Subject" />,
    <ReferenceLiveFilter source="chapter_id" show reference="chapters" label="Chapter" />,
    <DateLiveFilter source="started_timestamp" label="Started Timestamp" />,
    <DateLiveFilter source="completed_timestamp" label="Completed Timestamp" />,
    <ChoicesLiveFilter source="status" label="Status" choiceLabels={statusChoices} />,
    <NumberLiveFilter source="total_questions_number" label="Total Questions" />,
    <NumberLiveFilter source="correct_answers_number" label="Correct Answers" />
].filter(Boolean) as React.ReactElement[];

export const DiagnosticTestsList = (props: ListProps) => {
    const { permissions } = usePermissions();
    const handleOnCreate = () => {
        openDialog( 
            <TestPreparationDialog actionType={"diagnostic"}/>,
            { Title: "Take New Diagnostic Test" }
        )
    }
    
    const RevisionRoundActions = (
        <TopToolbar>
            <CreateButton onClick={handleOnCreate} to={{ redirect: false }} variant='outlined'/>
        </TopToolbar>
    )
    return (
        <List {...listDefaults({ ...props })} actions={RevisionRoundActions}>
            <DataTable {...tableDefaults(RESOURCE)}>
                {!isStudent(permissions) && <DataTable.Col source="user_id" field={UsersReferenceField}/>}
                <DataTable.Col source="chapter_id" field={ChaptersReferenceField}/>
                {/* <DataTable.Col source="started_timestamp" field={(props: any) => <DateField {...props} showTime />}/> */}
                <DataTable.Col label="Completed" source="completed_timestamp" field={(props: any) => <RelativeDateField {...props}  />}/>
                <DataTable.Col source="status" field={(props: any) => <SelectField {...props} choices={statusChoices} />}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const DiagnosticTestsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<UsersReferenceField source="user_id" variant='h6' />}>
                <ChaptersReferenceField source="chapter_id" />
                <DateField source="started_timestamp" showTime />
            </CardGrid>
        </List>
    )
}

const DetailResources = (props: any) => (
    <TabbedDetailLayout {...props}>
        <DiagnosticTestDetailsList resource={DETAIL_RESOURCES[0]}/>
    </TabbedDetailLayout> 
)

const DiagnosticTestForm = (props: Omit<SimpleFormProps, "children">) => {
    return (
        <SimpleForm {...formDefaults(props)}>
            <Box width="100%" display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap="1rem">
                <UsersReferenceInput source="user_id">
                <AutocompleteInput validate={required()} />
            </UsersReferenceInput>
            <ChaptersReferenceInput source="chapter_id">
                <AutocompleteInput validate={required()} />
            </ChaptersReferenceInput>
            <DateTimeInput source="started_timestamp" validate={required()} />
            <DateTimeInput source="completed_timestamp" />
            <SelectInput source="status" choices={statusChoices} validate={required()} />
            <NumberInput source="total_questions_number" />
            <NumberInput source="correct_answers_number" />
            </Box>
            <DetailResources/>
        </SimpleForm>
    );
};

const DiagnosticTestCreate = (props: CreateProps) => {
    return (
        <Create {...createDefaults(props)}>
            <DiagnosticTestForm />
        </Create>
    );
};

const DiagnosticTestEdit = (props: EditProps) => {
    return (
        <Edit {...editDefaults(props)}>
            <DiagnosticTestForm/>
        </Edit>
    );
};

const DiagnosticTestShow = (props: ShowProps) => {
        const { permissions } = usePermissions();
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout
                display="grid"
                gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
                gap="1rem">
                {!isStudent(permissions) && <UsersReferenceField source="user_id" />}
                <ChaptersReferenceField source="chapter_id" />
                {/* <DateField source="started_timestamp" showTime /> */}
                <RelativeDateField label="Completed" source="completed_timestamp"  />
                {/* <SelectField source="status" choices={statusChoices} /> */}
                <NumberField source="total_questions_number" />
                <NumberField source="correct_answers_number" />
                <NumberField source="total_time_taken_seconds_number" label="Total Time (seconds)" />
                {!isStudent(permissions) && (
                    <Box sx={{ gridColumn: '1 / -1', mt: 2 }}>
                        <RegenConceptScoresButton />
                    </Box>
                )}
            </SimpleShowLayout>
            <DetailResources/>
        </Show>
    );
};

const detail0Filters = [
    <TextLiveFilter source="search" fields={["selected_answer"]} />,
    <ReferenceLiveFilter source="question_id" reference="questions" label="Question" />,
    <BooleanLiveFilter source="is_correct" label="Correct" />,
    <NumberLiveFilter source="time_taken_seconds_number" label="Time Taken Seconds" />
]

const DiagnosticTestDetailForm = (props: any) => {
    return (
        <SimpleForm {...formDefaults(props)}>
            <QuestionsReferenceInput source="question_id">
                <AutocompleteInput validate={required()} />
            </QuestionsReferenceInput>
            <TextInput source="selected_answer" />
            <BooleanInput source="is_correct" />
            <NumberInput source="time_taken_seconds_number" />
        </SimpleForm>
    )
}

export const DiagnosticTestDetailsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(props)}>
                <DataTable.Col source="question_id" field={QuestionsReferenceField}/>
                <DataTable.Col source="selected_answer" />
                <DataTable.Col label="Correct?"  source="is_correct" field={BooleanField}/>
                <DataTable.Col label="Time Taken Seconds" source="time_taken_seconds_number" field={NumberField}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const DiagnosticTestDetailsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<QuestionsReferenceField source="question_id" variant='h6' />}>
                <TextField source="selected_answer" />
                <BooleanField source="is_correct" />
            </CardGrid>
        </List>
    )
}

const DiagnosticTestDetailCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <DiagnosticTestDetailForm />
        </Create>
    )
}

const DiagnosticTestDetailEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <DiagnosticTestDetailForm />
        </Edit>
    )
}

const DiagnosticTestDetailShowContent = () => {
    const record = useRecordContext();
    if (!record) return null;
    
    const question = record.question;
    
    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <BooleanField source="is_correct" label="Correct?" />
                <NumberField source="time_taken_seconds_number" label="Time Taken (s)" />
                <TextField source="selected_answer" label="Selected" />
            </Box>
            {question && (
                <QuestionDisplay
                    question={{
                        id: question.id,
                        type: question.type,
                        difficulty: question.difficulty,
                        question_stream: question.question_stream,
                        options: question.options,
                        correct_option: question.correct_option,
                        hint: question.hint,
                        answer_stream: question.answer_stream,
                        final_answer: question.final_answer,
                    }}
                    mode="review"
                    selectedAnswer={record.selected_answer}
                    showCorrectAnswer
                    showSolution
                />
            )}
        </Box>
    );
};

const DiagnosticTestDetailShow = (props: any) => {
    return (
        <Show {...showDefaults(props)}>
            <DiagnosticTestDetailShowContent />
        </Show>
    )
}

export const DiagnosticTestsResource = (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        recordRepresentation={(record: any) => recordRep('users', record.user)}
        fieldSchema={{
            user_id: { required: true, resource: 'users' },
            chapter_id: { required: true, resource: 'chapters' },
            started_timestamp: { required: true },
            completed_timestamp: {},
            total_time_taken_seconds_number: {},
            status: { type: 'choice', ui: 'select', required: true, choices: statusChoices },
            total_questions_number: {},
            correct_answers_number: {}
        }}
        filters={filters}
        list={<DiagnosticTestsList/>}
        create={<DiagnosticTestCreate/>}
        edit={<DiagnosticTestEdit/>}
        show={<DiagnosticTestShow/>}
        // hasDialog
        hasLiveUpdate
        hasImport
        filtersPlacement='top'
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)

export const DiagnosticTestDetailsResource = (
    <Resource
        name={DETAIL_RESOURCES[0]}
        icon={DETAIL_ICONS[0]}
        prefetch={DETAIL_PREFETCH[0]}
        recordRepresentation={(record: any) => `${recordRep(RESOURCE, record.diagnostic_test)} ${recordRep('questions', record.question)}`}
        fieldSchema={{
            question_id: { required: true, resource: 'questions' },
            selected_answer: {},
            is_correct: {},
            time_taken_seconds_number: {}
        }}
        filters={detail0Filters}
        list={<DiagnosticTestDetailsList/>}
        create={<DiagnosticTestDetailCreate/>}
        edit={<DiagnosticTestDetailEdit/>}
        show={<DiagnosticTestDetailShow/>}
        hasDialog
        hasLiveUpdate        
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)

export const DiagnosticTestsMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Diagnostic Tests" leftIcon={<ICON />} />
);

export const DiagnosticTestDetailsMenu = () => (
    <Menu.Item to={`/${DETAIL_RESOURCES[0]}`} primaryText="Diagnostic Test Details" leftIcon={<Category />} />
);
