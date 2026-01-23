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
    ReferenceField,
    Show,
    ShowProps,
    SimpleForm,
    SimpleFormProps,
    SimpleShowLayout,
    TextField,
    TextInput,
    type ListProps, DateField, DateInput, DateTimeInput, NumberField, NumberInput, SelectField, SelectInput, AutocompleteInput, required, usePermissions, useRecordContext,
    CreateButton,
    TopToolbar
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
    RelativeDateField,
} from '@mahaswami/swan-frontend';
import { UsersReferenceField, UsersReferenceInput } from './users';
import { ConceptsReferenceField, ConceptsReferenceInput } from './concepts';
import { QuestionsReferenceField, QuestionsReferenceInput } from './questions';
import { ChaptersReferenceField } from './chapters';
import { TestPreparationButton } from '../analytics/StudentDashboard';
import { RoundEmpty } from '../components/RoundEmpty';
import { QuestionDisplay } from '../components/QuestionDisplay';

export const RESOURCE = "revision_rounds"
export const DETAIL_RESOURCES = ["revision_round_details"]
export const ICON = AssignmentTurnedIn
export const DETAIL_ICONS = [Category]
export const PREFETCH: string[] = ["users", "concepts", "chapters"]
export const DETAIL_PREFETCH = [[RESOURCE, "questions"]]

export const RevisionRoundsReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const RevisionRoundsReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const RevisionRoundDetailsReferenceField = createReferenceField(DETAIL_RESOURCES[0], DETAIL_PREFETCH[0]);
export const RevisionRoundDetailsReferenceInput = createReferenceInput(DETAIL_RESOURCES[0], DETAIL_PREFETCH[0]);
export const statusChoices = [{ id: 'in_progress', name: 'In Progress' }, { id: 'completed', name: 'Completed' }, { id: 'abandoned', name: 'Abandoned' }];

const isStudent = (permissions: any) => permissions === 'student';

const filters = (permissions: any) => [
    !isStudent(permissions) && <ReferenceLiveFilter source="user_id" show reference="users" label="User" />,
    <ReferenceLiveFilter show source="concept_id" through="chapter_id.subject_id" label="Subject" />,
    <ReferenceLiveFilter show source="concept_id" through="chapter_id" label="Chapter" sx={{ minWidth: 350 }} />,
    <ReferenceLiveFilter source="concept_id" show reference="concepts" label="Concept" />,
    <NumberLiveFilter source="round_number" label="Round" />,
    <DateLiveFilter source="started_timestamp" label="Started Timestamp" />,
    <DateLiveFilter source="completed_timestamp" label="Completed Timestamp" />,
    <ChoicesLiveFilter source="status" label="Status" choiceLabels={statusChoices} />
].filter(Boolean) as React.ReactElement[];

const ChapterViaConceptField = (props: any) => (    
    <ReferenceField source="concept_id" reference="concepts" link={false} {...props}>
        <ChaptersReferenceField source="chapter_id" />
    </ReferenceField>
);

export const RevisionRoundsList = (props: ListProps) => {
    const { permissions } = usePermissions();
    
    const RevisionRoundActions = (
        <TopToolbar>
            <TestPreparationButton 
                actionType={"revision"} 
                component={CreateButton} to={{ redirect: false }} 
            />
        </TopToolbar>
    )

    return (
        <List {...listDefaults({ ...props})} actions={RevisionRoundActions} empty={<RoundEmpty actionType={"revision"}/>}>
            <DataTable {...tableDefaults(RESOURCE)}>
                {!isStudent(permissions) && <DataTable.Col source="user_id" field={UsersReferenceField}/>}
                <DataTable.Col source="concept_id" label="Chapter" field={ChapterViaConceptField}/>
                <DataTable.Col source="concept_id" field={ConceptsReferenceField}/>
                <DataTable.Col source="round_number" field={NumberField}/>
                <DataTable.Col label="Completed" source="completed_timestamp" field={RelativeDateField}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const RevisionRoundsCardGrid = (props: ListProps) => {
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
        <RevisionRoundDetailsList resource={DETAIL_RESOURCES[0]}/>
    </TabbedDetailLayout> 
)

const RevisionRoundForm = (props: Omit<SimpleFormProps, "children">) => {
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

const RevisionRoundCreate = (props: CreateProps) => {
    return (
        <Create {...createDefaults(props)}>
            <RevisionRoundForm />
        </Create>
    );
};

const RevisionRoundEdit = (props: EditProps) => {
    return (
        <Edit {...editDefaults(props)}>
            <RevisionRoundForm/>
        </Edit>
    );
};

const RevisionRoundShow = (props: ShowProps) => {
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
                <NumberField source="total_time_seconds_number" label="Total Time (seconds)" />
                <SelectField source="status" choices={statusChoices} />
            </SimpleShowLayout>
            <DetailResources/>
        </Show>
    );
};

const detail0Filters = [
    <ReferenceLiveFilter source="question_id" reference="questions" label="Question" />,
    <NumberLiveFilter source="time_viewed_seconds_number" label="Time Viewed (seconds)" />
]

const RevisionRoundDetailForm = (props: any) => {
    return (
        <SimpleForm {...formDefaults(props)}>
            <QuestionsReferenceInput source="question_id">
                <AutocompleteInput validate={required()} />
            </QuestionsReferenceInput>
            <NumberInput source="time_viewed_seconds_number" />
        </SimpleForm>
    )
}

export const RevisionRoundDetailsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(props)}>
                <DataTable.Col source="question_id" field={QuestionsReferenceField}/>
                <DataTable.Col source="time_viewed_seconds_number" label="Time Viewed (s)" field={NumberField}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const RevisionRoundDetailsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<QuestionsReferenceField source="question_id" variant='h6' />}>
                <NumberField source="time_viewed_seconds_number" label="Time Viewed (s)" />
            </CardGrid>
        </List>
    )
}

const RevisionRoundDetailCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <RevisionRoundDetailForm />
        </Create>
    )
}

const RevisionRoundDetailEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <RevisionRoundDetailForm />
        </Edit>
    )
}

const RevisionRoundDetailShowContent = () => {
    const record = useRecordContext();
    if (!record) return null;
    
    const question = record.question;
    
    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <NumberField source="time_viewed_seconds_number" label="Time Viewed (s)" />
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
                    showCorrectAnswer
                    showSolution
                    showHint
                />
            )}
        </Box>
    );
};

const RevisionRoundDetailShow = (props: any) => {
    return (
        <Show {...showDefaults(props)}>
            <RevisionRoundDetailShowContent />
        </Show>
    )
}

export const RevisionRoundsResource = (
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
            total_time_seconds_number: {},
            status: { type: 'choice', ui: 'select', required: true, choices: statusChoices }
        }}
        filters={filters}
        list={<RevisionRoundsList/>}
        create={<RevisionRoundCreate/>}
        edit={<RevisionRoundEdit/>}
        show={<RevisionRoundShow/>}
        hasLiveUpdate
        filtersPlacement='top'
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)

export const RevisionRoundDetailsResource = (
    <Resource
        name={DETAIL_RESOURCES[0]}
        icon={DETAIL_ICONS[0]}
        prefetch={DETAIL_PREFETCH[0]}
        recordRepresentation={(record: any) => `${recordRep(RESOURCE, record.revision_round)} ${recordRep('questions', record.question)}`}
        fieldSchema={{
            question_id: { required: true, resource: 'questions' },
            time_viewed_seconds_number: {}
        }}
        filters={detail0Filters}
        list={<RevisionRoundDetailsList/>}
        create={<RevisionRoundDetailCreate/>}
        edit={<RevisionRoundDetailEdit/>}
        show={<RevisionRoundDetailShow/>}
        hasDialog
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)

export const RevisionRoundsMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Revision Rounds" leftIcon={<ICON />} />
);

export const RevisionRoundDetailsMenu = () => (
    <Menu.Item to={`/${DETAIL_RESOURCES[0]}`} primaryText="Revision Round Details" leftIcon={<Category />} />
);
