import { Quiz, Category } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
import {
    Create,
    CreateProps,
    DataTable,
    Edit,
    EditProps,
    List,
    Menu,
    ReferenceField,
    Show,
    ShowProps,
    SimpleForm,
    SimpleFormProps,
    SimpleShowLayout,
    TextField,
    TextInput,
    type ListProps, DateField, DateInput, DateTimeInput, NumberField, NumberInput, SelectField, SelectInput, AutocompleteInput, required, usePermissions, useRecordContext,
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
    NumberLiveFilter,
    DateLiveFilter,
    ChoicesLiveFilter,
    createReferenceField,
    createReferenceInput,
    recordRep,
} from '@mahaswami/swan-frontend';
import { UsersReferenceField, UsersReferenceInput } from './users';
import { ConceptsReferenceField, ConceptsReferenceInput } from './concepts';
import { QuestionsReferenceField, QuestionsReferenceInput } from './questions';
import { ChaptersReferenceField } from './chapters';
import { QuestionDisplay } from '../components/QuestionDisplay';
import { TestPreparationButton } from '../analytics/StudentDashboard';
import { RoundEmpty } from '../components/RoundEmpty';

export const RESOURCE = "test_rounds"
export const DETAIL_RESOURCES = ["test_round_details"]
export const ICON = Quiz
export const DETAIL_ICONS = [Category]
export const PREFETCH: string[] = ["users", "concepts", "chapters"]
export const DETAIL_PREFETCH = [[RESOURCE, "questions"]]

export const TestRoundsReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const TestRoundsReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const TestRoundDetailsReferenceField = createReferenceField(DETAIL_RESOURCES[0], DETAIL_PREFETCH[0]);
export const TestRoundDetailsReferenceInput = createReferenceInput(DETAIL_RESOURCES[0], DETAIL_PREFETCH[0]);
export const statusChoices = [{ id: 'in_progress', name: 'In Progress' }, { id: 'completed', name: 'Completed' }, { id: 'abandoned', name: 'Abandoned' }];
export const comfortScoreChoices = [{ id: 'needs_improvement', name: 'Needs Improvement' }, { id: 'good', name: 'Good' }, { id: 'very_good', name: 'Very Good' }];

const isStudent = (permissions: any) => permissions === 'student';

const filters = (permissions: any) => [
    !isStudent(permissions) && <ReferenceLiveFilter source="user_id" show reference="users" label="User" />,
    <ReferenceLiveFilter show source="concept_id" through="chapter_id.subject_id" label="Subject" />,
    <ReferenceLiveFilter show source="concept_id" through="chapter_id" label="Chapter" sx={{ minWidth: 350 }} />,
    <ReferenceLiveFilter source="concept_id" show reference="concepts" label="Concept" />,
    <NumberLiveFilter source="round_number" label="Round" />,
    <DateLiveFilter source="started_timestamp" label="Started Timestamp" />,
    <DateLiveFilter source="completed_timestamp" label="Completed Timestamp" />,
    <ChoicesLiveFilter source="status" label="Status" choiceLabels={statusChoices} />,
    <ChoicesLiveFilter source="comfort_score" label="Comfort Score" choiceLabels={comfortScoreChoices} />
].filter(Boolean) as React.ReactElement[];

const ChapterViaConceptField = (props: any) => (
    <ReferenceField source="concept_id" reference="concepts" link={false} {...props}>
        <ChaptersReferenceField source="chapter_id" />
    </ReferenceField>
);

export const TestRoundsList = (props: ListProps) => {
    const { permissions } = usePermissions();
    
    
    const RevisionRoundActions = (
        <TopToolbar>
            <TestPreparationButton 
                actionType={"test"} 
                component={CreateButton} to={{ redirect: false }}
                title="Start New Test" 
            />
        </TopToolbar>
    )
    
    return (
        <List {...listDefaults({ ...props })} actions={RevisionRoundActions} empty={<RoundEmpty actionType={"test"}/>}>
            <DataTable {...tableDefaults(RESOURCE)}>
                {!isStudent(permissions) && <DataTable.Col source="user_id" field={UsersReferenceField}/>}
                <DataTable.Col source="concept_id" label="Chapter" field={ChapterViaConceptField}/>
                <DataTable.Col source="concept_id" field={ConceptsReferenceField}/>
                <DataTable.Col source="round_number" field={NumberField}/>
                <DataTable.Col source="started_timestamp" field={(props: any) => <DateField {...props} showTime />}/>
                <DataTable.Col source="completed_timestamp" field={(props: any) => <DateField {...props} showTime />}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const TestRoundsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<UsersReferenceField source="user_id" variant='h6' />}>
                <ConceptsReferenceField source="concept_id" />
                <NumberField source="round_number" />
            </CardGrid>
        </List>
    )
}

const DetailResources = (props: any) => (
    <TabbedDetailLayout {...props}>
        <TestRoundDetailsList resource={DETAIL_RESOURCES[0]}/>
    </TabbedDetailLayout> 
)

const TestRoundForm = (props: Omit<SimpleFormProps, "children">) => {
    return (
        <SimpleForm {...formDefaults(props)}>
            <Box width="100%" display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap="1rem">
                <UsersReferenceInput source="user_id">
                <AutocompleteInput validate={required()} />
            </UsersReferenceInput>
            <ConceptsReferenceInput source="concept_id">
                <AutocompleteInput validate={required()} />
            </ConceptsReferenceInput>
            <NumberInput source="round_number" validate={required()} />
            <DateTimeInput source="started_timestamp" validate={required()} />
            <DateTimeInput source="completed_timestamp" />
            <SelectInput source="status" choices={statusChoices} validate={required()} />
            <SelectInput source="comfort_score" choices={comfortScoreChoices} />
            </Box>
            <DetailResources/>
        </SimpleForm>
    );
};

const TestRoundCreate = (props: CreateProps) => {
    return (
        <Create {...createDefaults(props)}>
            <TestRoundForm />
        </Create>
    );
};

const TestRoundEdit = (props: EditProps) => {
    return (
        <Edit {...editDefaults(props)}>
            <TestRoundForm/>
        </Edit>
    );
};

const TestRoundShow = (props: ShowProps) => {
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout
                display="grid"
                gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
                gap="1rem">
                <UsersReferenceField source="user_id" />
                <ConceptsReferenceField source="concept_id" />
                <NumberField source="round_number" />
                <DateField source="started_timestamp" showTime />
                <DateField source="completed_timestamp" showTime />
                <SelectField source="status" choices={statusChoices} />
                <SelectField source="comfort_score" choices={comfortScoreChoices} />
            </SimpleShowLayout>
            <DetailResources/>
        </Show>
    );
};

const detail0Filters = [
    <ReferenceLiveFilter source="question_id" reference="questions" label="Question" />
]

const TestRoundDetailForm = (props: any) => {
    return (
        <SimpleForm {...formDefaults(props)}>
            <QuestionsReferenceInput source="question_id">
                <AutocompleteInput validate={required()} />
            </QuestionsReferenceInput>
        </SimpleForm>
    )
}

export const TestRoundDetailsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(props)}>
                <DataTable.Col source="question_id" field={QuestionsReferenceField}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const TestRoundDetailsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<QuestionsReferenceField source="question_id" variant='h6' />}>
            </CardGrid>
        </List>
    )
}

const TestRoundDetailCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <TestRoundDetailForm />
        </Create>
    )
}

const TestRoundDetailEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <TestRoundDetailForm />
        </Edit>
    )
}

const TestRoundDetailShowContent = () => {
    const record = useRecordContext();
    if (!record) return null;
    
    const question = record.question;
    
    return (
        <Box sx={{ p: 2 }}>
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
                        marks_number: record.eligible_marks_number,
                    }}
                    mode="review"
                    showCorrectAnswer
                    showSolution
                    showHint
                    marksObtained={record.marks_obtained_number}
                />
            )}
        </Box>
    );
};

const TestRoundDetailShow = (props: any) => {
    return (
        <Show {...showDefaults(props)}>
            <TestRoundDetailShowContent />
        </Show>
    )
}

export const TestRoundsResource = (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        recordRepresentation={(record: any) => recordRep('users', record.user)}
        fieldSchema={{
            user_id: { required: true, resource: 'users' },
            concept_id: { required: true, resource: 'concepts' },
            round_number: { required: true },
            started_timestamp: { required: true },
            completed_timestamp: {},
            status: { type: 'choice', ui: 'select', required: true, choices: statusChoices },
            comfort_score: { type: 'choice', ui: 'select', choices: comfortScoreChoices }
        }}
        filters={filters}
        list={<TestRoundsList/>}
        create={<TestRoundCreate/>}
        edit={<TestRoundEdit/>}
        show={<TestRoundShow/>}
        hasLiveUpdate
        filtersPlacement='top'
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)

export const TestRoundDetailsResource = (
    <Resource
        name={DETAIL_RESOURCES[0]}
        icon={DETAIL_ICONS[0]}
        prefetch={DETAIL_PREFETCH[0]}
        recordRepresentation={(record: any) => `${recordRep(RESOURCE, record.test_round)} ${recordRep('questions', record.question)}`}
        fieldSchema={{
            question_id: { required: true, resource: 'questions' }
        }}
        filters={detail0Filters}
        list={<TestRoundDetailsList/>}
        create={<TestRoundDetailCreate/>}
        edit={<TestRoundDetailEdit/>}
        show={<TestRoundDetailShow/>}
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)

export const TestRoundsMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Test Rounds" leftIcon={<ICON />} />
);

export const TestRoundDetailsMenu = () => (
    <Menu.Item to={`/${DETAIL_RESOURCES[0]}`} primaryText="Test Round Details" leftIcon={<Category />} />
);
