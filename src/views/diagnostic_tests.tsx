import { Article, Category } from '@mui/icons-material';
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
    type ListProps, DateField, DateInput, DateTimeInput, NumberField, NumberInput, SelectField, SelectInput, AutocompleteInput, required, BooleanField, BooleanInput
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
    getLocalStorage
} from '@mahaswami/swan-frontend';
import { UsersReferenceField, UsersReferenceInput } from './users';
import { ChaptersReferenceField, ChaptersReferenceInput } from './chapters';
import { QuestionsReferenceField, QuestionsReferenceInput } from './questions';

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

const filters = [
    <ReferenceLiveFilter source="user_id" show reference="users" label="User" />,
    <ReferenceLiveFilter source="chapter_id" reference="chapters" label="Chapter" />,
    <DateLiveFilter source="started_timestamp" label="Started Timestamp" />,
    <DateLiveFilter source="completed_timestamp" label="Completed Timestamp" />,
    <ChoicesLiveFilter source="status" label="Status" choiceLabels={statusChoices} />,
    <NumberLiveFilter source="total_questions_number" label="Total Questions" />,
    <NumberLiveFilter source="correct_answers_number" label="Correct Answers" />
]

const studentFilters = [
    <ReferenceLiveFilter source="chapter_id" reference="chapters" label="Chapter" />,
    <DateLiveFilter source="started_timestamp" label="Started Timestamp" />,
    <DateLiveFilter source="completed_timestamp" label="Completed Timestamp" />,
    <ChoicesLiveFilter source="status" label="Status" choiceLabels={statusChoices} />,
    <NumberLiveFilter source="total_questions_number" label="Total Questions" />,
    <NumberLiveFilter source="correct_answers_number" label="Correct Answers" />
]

export const DiagnosticTestsList = (props: ListProps) => {
    const isStudent = getLocalStorage('role') === 'student';
    return (
        <List {...listDefaults({ ...props, filters: isStudent ? studentFilters : filters })}>
            <DataTable {...tableDefaults(RESOURCE)}>
                {!isStudent && <DataTable.Col source="user_id" field={UsersReferenceField}/>}
                <DataTable.Col source="chapter_id" field={ChaptersReferenceField}/>
                <DataTable.Col source="started_timestamp" field={(props: any) => <DateField {...props} showTime />}/>
                <DataTable.Col source="completed_timestamp" field={(props: any) => <DateField {...props} showTime />}/>
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
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout
                display="grid"
                gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
                gap="1rem">
                <UsersReferenceField source="user_id" />
                <ChaptersReferenceField source="chapter_id" />
                <DateField source="started_timestamp" showTime />
                <DateField source="completed_timestamp" showTime />
                <SelectField source="status" choices={statusChoices} />
                <NumberField source="total_questions_number" />
                <NumberField source="correct_answers_number" />
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
                <DataTable.Col source="is_correct" field={BooleanField}/>
                <DataTable.Col source="time_taken_seconds_number" field={NumberField}/>
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

const DiagnosticTestDetailShow = (props: any) => {
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout>
                <QuestionsReferenceField source="question_id" />
                <TextField source="selected_answer" />
                <BooleanField source="is_correct" />
                <NumberField source="time_taken_seconds_number" />
            </SimpleShowLayout>
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
            status: { type: 'choice', ui: 'select', required: true, choices: statusChoices },
            total_questions_number: {},
            correct_answers_number: {}
        }}
        filters={filters}
        list={<DiagnosticTestsList/>}
        create={<DiagnosticTestCreate/>}
        edit={<DiagnosticTestEdit/>}
        show={<DiagnosticTestShow/>}
                hasDialog
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
