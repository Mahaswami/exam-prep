import { AssignmentTurnedIn, Category } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
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
    recordRep
} from '@mahaswami/swan-frontend';
import { UsersReferenceField, UsersReferenceInput } from './users';
import { ConceptsReferenceField, ConceptsReferenceInput } from './concepts';
import { QuestionsReferenceField, QuestionsReferenceInput } from './questions';

export const RESOURCE = "concept_revision_rounds"
export const DETAIL_RESOURCES = ["revision_round_questions"]
export const ICON = AssignmentTurnedIn
export const DETAIL_ICONS = [Category]
export const PREFETCH: string[] = ["users", "concepts"]
export const DETAIL_PREFETCH = [[RESOURCE, "questions"]]

export const ConceptRevisionRoundsReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const ConceptRevisionRoundsReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const RevisionRoundQuestionsReferenceField = createReferenceField(DETAIL_RESOURCES[0], DETAIL_PREFETCH[0]);
export const RevisionRoundQuestionsReferenceInput = createReferenceInput(DETAIL_RESOURCES[0], DETAIL_PREFETCH[0]);
export const statusChoices = [{ id: 'in_progress', name: 'In Progress' }, { id: 'completed', name: 'Completed' }, { id: 'abandoned', name: 'Abandoned' }];

const filters = [
    <ReferenceLiveFilter source="user_id" reference="users" label="User" />,
    <ReferenceLiveFilter source="concept_id" reference="concepts" label="Concept" />,
    <NumberLiveFilter source="round_number" label="Round" />,
    <DateLiveFilter source="started_timestamp" label="Started Timestamp" />,
    <DateLiveFilter source="completed_timestamp" label="Completed Timestamp" />,
    <ChoicesLiveFilter source="status" label="Status" choiceLabels={statusChoices} />
]

export const ConceptRevisionRoundsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(RESOURCE)}>
                <DataTable.Col source="user_id" field={UsersReferenceField}/>
                <DataTable.Col source="concept_id" field={ConceptsReferenceField}/>
                <DataTable.Col source="round_number" field={NumberField}/>
                <DataTable.Col source="started_timestamp" field={(props: any) => <DateField {...props} showTime />}/>
                <DataTable.Col source="completed_timestamp" field={(props: any) => <DateField {...props} showTime />}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const ConceptRevisionRoundsCardGrid = (props: ListProps) => {
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
        <RevisionRoundQuestionsList resource={DETAIL_RESOURCES[0]}/>
    </TabbedDetailLayout> 
)

const ConceptRevisionRoundForm = (props: Omit<SimpleFormProps, "children">) => {
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
            </Box>
            <DetailResources/>
        </SimpleForm>
    );
};

const ConceptRevisionRoundCreate = (props: CreateProps) => {
    return (
        <Create {...createDefaults(props)}>
            <ConceptRevisionRoundForm />
        </Create>
    );
};

const ConceptRevisionRoundEdit = (props: EditProps) => {
    return (
        <Edit {...editDefaults(props)}>
            <ConceptRevisionRoundForm/>
        </Edit>
    );
};

const ConceptRevisionRoundShow = (props: ShowProps) => {
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
            </SimpleShowLayout>
            <DetailResources/>
        </Show>
    );
};

const detail0Filters = [
    <ReferenceLiveFilter source="question_id" reference="questions" label="Question" />,
    <DateLiveFilter source="viewed_timestamp" label="Viewed Timestamp" />
]

const RevisionRoundQuestionForm = (props: any) => {
    return (
        <SimpleForm {...formDefaults(props)}>
            <QuestionsReferenceInput source="question_id">
                <AutocompleteInput validate={required()} />
            </QuestionsReferenceInput>
            <DateTimeInput source="viewed_timestamp" />
        </SimpleForm>
    )
}

export const RevisionRoundQuestionsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(props)}>
                <DataTable.Col source="question_id" field={QuestionsReferenceField}/>
                <DataTable.Col source="viewed_timestamp" field={(props: any) => <DateField {...props} showTime />}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const RevisionRoundQuestionsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<QuestionsReferenceField source="question_id" variant='h6' />}>
                <DateField source="viewed_timestamp" showTime />
            </CardGrid>
        </List>
    )
}

const RevisionRoundQuestionCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <RevisionRoundQuestionForm />
        </Create>
    )
}

const RevisionRoundQuestionEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <RevisionRoundQuestionForm />
        </Edit>
    )
}

const RevisionRoundQuestionShow = (props: any) => {
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout>
                <QuestionsReferenceField source="question_id" />
                <DateField source="viewed_timestamp" showTime />
            </SimpleShowLayout>
        </Show>
    )
}

export const ConceptRevisionRoundsResource = (
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
            status: { type: 'choice', ui: 'select', required: true, choices: statusChoices }
        }}
        filters={filters}
        list={<ConceptRevisionRoundsList/>}
        create={<ConceptRevisionRoundCreate/>}
        edit={<ConceptRevisionRoundEdit/>}
        show={<ConceptRevisionRoundShow/>}
        hasDialog
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)

export const RevisionRoundQuestionsResource = (
    <Resource
        name={DETAIL_RESOURCES[0]}
        icon={DETAIL_ICONS[0]}
        prefetch={DETAIL_PREFETCH[0]}
        recordRepresentation={(record: any) => `${recordRep(RESOURCE, record.concept_revision_round)} ${recordRep('questions', record.question)}`}
        fieldSchema={{
            question_id: { required: true, resource: 'questions' },
            viewed_timestamp: {}
        }}
        filters={detail0Filters}
        list={<RevisionRoundQuestionsList/>}
        create={<RevisionRoundQuestionCreate/>}
        edit={<RevisionRoundQuestionEdit/>}
        show={<RevisionRoundQuestionShow/>}
        hasDialog
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)

export const ConceptRevisionRoundsMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Concept Revision Rounds" leftIcon={<ICON />} />
);

export const RevisionRoundQuestionsMenu = () => (
    <Menu.Item to={`/${DETAIL_RESOURCES[0]}`} primaryText="Revision Round Questions" leftIcon={<Category />} />
);
