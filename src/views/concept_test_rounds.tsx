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
    type ListProps, DateField, DateInput, DateTimeInput, NumberField, NumberInput, SelectField, SelectInput, AutocompleteInput, required
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
    getLocalStorage
} from '@mahaswami/swan-frontend';
import { UsersReferenceField, UsersReferenceInput } from './users';
import { ConceptsReferenceField, ConceptsReferenceInput } from './concepts';
import { QuestionsReferenceField, QuestionsReferenceInput } from './questions';
import { ChaptersReferenceField } from './chapters';

export const RESOURCE = "concept_test_rounds"
export const DETAIL_RESOURCES = ["test_round_questions"]
export const ICON = Quiz
export const DETAIL_ICONS = [Category]
export const PREFETCH: string[] = ["users", "concepts", "chapters"]
export const DETAIL_PREFETCH = [[RESOURCE, "questions"]]

export const ConceptTestRoundsReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const ConceptTestRoundsReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const TestRoundQuestionsReferenceField = createReferenceField(DETAIL_RESOURCES[0], DETAIL_PREFETCH[0]);
export const TestRoundQuestionsReferenceInput = createReferenceInput(DETAIL_RESOURCES[0], DETAIL_PREFETCH[0]);
export const statusChoices = [{ id: 'in_progress', name: 'In Progress' }, { id: 'completed', name: 'Completed' }, { id: 'abandoned', name: 'Abandoned' }];
export const comfortScoreChoices = [{ id: 'needs_improvement', name: 'Needs Improvement' }, { id: 'good', name: 'Good' }, { id: 'very_good', name: 'Very Good' }];

const filters = [
    <ReferenceLiveFilter source="user_id" reference="users" label="User" />,
    <ReferenceLiveFilter source="concept_id" reference="concepts" label="Concept" />,
    <NumberLiveFilter source="round_number" label="Round" />,
    <DateLiveFilter source="started_timestamp" label="Started Timestamp" />,
    <DateLiveFilter source="completed_timestamp" label="Completed Timestamp" />,
    <ChoicesLiveFilter source="status" label="Status" choiceLabels={statusChoices} />,
    <ChoicesLiveFilter source="comfort_score" label="Comfort Score" choiceLabels={comfortScoreChoices} />
]

const studentFilters = [
    <ReferenceLiveFilter source="concept_id" reference="concepts" label="Concept" />,
    <NumberLiveFilter source="round_number" label="Round" />,
    <DateLiveFilter source="started_timestamp" label="Started Timestamp" />,
    <DateLiveFilter source="completed_timestamp" label="Completed Timestamp" />,
    <ChoicesLiveFilter source="status" label="Status" choiceLabels={statusChoices} />,
    <ChoicesLiveFilter source="comfort_score" label="Comfort Score" choiceLabels={comfortScoreChoices} />
]

const ChapterViaConceptField = (props: any) => (
    <ReferenceField source="concept_id" reference="concepts" link={false} {...props}>
        <ChaptersReferenceField source="chapter_id" />
    </ReferenceField>
);

export const ConceptTestRoundsList = (props: ListProps) => {
    const isStudent = getLocalStorage('role') === 'student';
    return (
        <List {...listDefaults({ ...props, filters: isStudent ? studentFilters : filters })}>
            <DataTable {...tableDefaults(RESOURCE)}>
                {!isStudent && <DataTable.Col source="user_id" field={UsersReferenceField}/>}
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


export const ConceptTestRoundsCardGrid = (props: ListProps) => {
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
        <TestRoundQuestionsList resource={DETAIL_RESOURCES[0]}/>
    </TabbedDetailLayout> 
)

const ConceptTestRoundForm = (props: Omit<SimpleFormProps, "children">) => {
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

const ConceptTestRoundCreate = (props: CreateProps) => {
    return (
        <Create {...createDefaults(props)}>
            <ConceptTestRoundForm />
        </Create>
    );
};

const ConceptTestRoundEdit = (props: EditProps) => {
    return (
        <Edit {...editDefaults(props)}>
            <ConceptTestRoundForm/>
        </Edit>
    );
};

const ConceptTestRoundShow = (props: ShowProps) => {
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

const TestRoundQuestionForm = (props: any) => {
    return (
        <SimpleForm {...formDefaults(props)}>
            <QuestionsReferenceInput source="question_id">
                <AutocompleteInput validate={required()} />
            </QuestionsReferenceInput>
        </SimpleForm>
    )
}

export const TestRoundQuestionsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(props)}>
                <DataTable.Col source="question_id" field={QuestionsReferenceField}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const TestRoundQuestionsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<QuestionsReferenceField source="question_id" variant='h6' />}>
            </CardGrid>
        </List>
    )
}

const TestRoundQuestionCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <TestRoundQuestionForm />
        </Create>
    )
}

const TestRoundQuestionEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <TestRoundQuestionForm />
        </Edit>
    )
}

const TestRoundQuestionShow = (props: any) => {
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout>
                <QuestionsReferenceField source="question_id" />
            </SimpleShowLayout>
        </Show>
    )
}

export const ConceptTestRoundsResource = (
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
        list={<ConceptTestRoundsList/>}
        create={<ConceptTestRoundCreate/>}
        edit={<ConceptTestRoundEdit/>}
        show={<ConceptTestRoundShow/>}
        hasDialog
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)

export const TestRoundQuestionsResource = (
    <Resource
        name={DETAIL_RESOURCES[0]}
        icon={DETAIL_ICONS[0]}
        prefetch={DETAIL_PREFETCH[0]}
        recordRepresentation={(record: any) => `${recordRep(RESOURCE, record.concept_test_round)} ${recordRep('questions', record.question)}`}
        fieldSchema={{
            question_id: { required: true, resource: 'questions' }
        }}
        filters={detail0Filters}
        list={<TestRoundQuestionsList/>}
        create={<TestRoundQuestionCreate/>}
        edit={<TestRoundQuestionEdit/>}
        show={<TestRoundQuestionShow/>}
        hasDialog
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)

export const ConceptTestRoundsMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Test Rounds" leftIcon={<ICON />} />
);

export const TestRoundQuestionsMenu = () => (
    <Menu.Item to={`/${DETAIL_RESOURCES[0]}`} primaryText="Test Round Questions" leftIcon={<Category />} />
);
