import {
    BooleanLiveFilter,
    CardGrid,
    ChoicesLiveFilter, NumberLiveFilter,
    ReferenceLiveFilter,
    Resource,
    RowActions,
    TextLiveFilter,
    createDefaults,
    createReferenceField,
    createReferenceInput,
    editDefaults, formDefaults, listDefaults,
    recordRep,
    showDefaults,
    tableDefaults
} from '@mahaswami/swan-frontend';
import { Quiz } from '@mui/icons-material';
import {
    AutocompleteInput,
    BooleanField, BooleanInput,
    Create, DataTable, Edit, FunctionField, List, Menu,
    NumberField, NumberInput, SelectField, SelectInput,
    Show, SimpleForm, SimpleShowLayout,
    TextField, TextInput,
    required,
    type ListProps
} from "react-admin";
import { ConceptsReferenceField, ConceptsReferenceInput } from './concepts';
import { RenderStream } from './DiagnosticTestRound';

export const RESOURCE = "questions"
export const ICON = Quiz
export const PREFETCH: string[] = ["concepts"]

export const QuestionsReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const QuestionsReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const difficultyChoices = [{ id: 'easy', name: 'Easy' }, { id: 'medium', name: 'Medium' }, { id: 'hard', name: 'Hard' }];

const filters = [
    <TextLiveFilter source="search" show fields={["type", "options", "correct_option"]} />,
    <ReferenceLiveFilter source="concept_id" show reference="concepts" label="Concept" />,
    <ChoicesLiveFilter source="difficulty" label="Difficulty" choiceLabels={difficultyChoices} />,
    <NumberLiveFilter source="marks_number" label="Marks" />,
    <BooleanLiveFilter source="is_active" show label="Active" />,
    <BooleanLiveFilter source="is_invented" label="Invented" />
]

export const QuestionsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(RESOURCE)}>
                <DataTable.Col source="concept_id" field={ConceptsReferenceField} />
                <DataTable.Col source="type" />
                <DataTable.Col source="difficulty" field={(props: any) => <SelectField {...props} choices={difficultyChoices} />} />
                <DataTable.Col source="options" />
                <DataTable.Col source="correct_option" />
                <RowActions />
            </DataTable>
        </List>
    )
}


export const QuestionsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<ConceptsReferenceField source="concept_id" variant='h6' />}>
                <TextField source="type" />
                <SelectField source="difficulty" choices={difficultyChoices} />
            </CardGrid>
        </List>
    )
}

const QuestionForm = (props: any) => {
    return (
        <SimpleForm {...formDefaults(props)}
            display="grid"
            gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
            gap="1rem">
            <ConceptsReferenceInput source="concept_id">
                <AutocompleteInput validate={required()} />
            </ConceptsReferenceInput>
            <TextInput source="type" validate={required()} />
            <SelectInput source="difficulty" choices={difficultyChoices} />
            <TextInput source="options" />
            <TextInput source="correct_option" />
            <TextInput source="question_stream" />
            <TextInput source="hint" />
            <TextInput source="answer_stream" />
            <TextInput source="final_answer" />
            <NumberInput source="marks_number" />
            <BooleanInput source="is_active" />
            <BooleanInput source="is_invented" />
        </SimpleForm>
    )
}

const QuestionEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <QuestionForm />
        </Edit>
    )
}

const QuestionCreate = (props: any) => {
    return (
        <Create {...createDefaults(props)}>
            <QuestionForm />
        </Create>
    )
}

const QuestionShow = (props: any) => {

    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout>
                <FunctionField source="question_stream"
                    render={record => <RenderStream
                        stream={JSON.parse(record.question_stream)}
                    />}
                />
                <FunctionField source="answer_stream"
                    render={record => <RenderStream
                        stream={JSON.parse(record.answer_stream)}
                    />}
                />
                <ConceptsReferenceField source="concept_id" />
                <TextField source="type" />
                <SelectField source="difficulty" choices={difficultyChoices} />
                <TextField source="options" />
                <TextField source="correct_option" />
                <TextField source="hint" />
                <TextField source="final_answer" />
                <NumberField source="marks_number" />
                <BooleanField source="is_active" />
                <BooleanField source="is_invented" />
            </SimpleShowLayout>
        </Show>
    )
}


export const QuestionsResource = (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        recordRepresentation={(record: any) => recordRep('concepts', record.concept)}
        fieldSchema={{
            concept_id: { required: true, resource: 'concepts' },
            type: { required: true },
            difficulty: { type: 'choice', ui: 'select', choices: difficultyChoices },
            options: {},
            correct_option: {},
            question_stream: {},
            hint: {},
            answer_stream: {},
            final_answer: {},
            marks_number: {},
            is_active: {},
            is_invented: {}
        }}
        filters={filters}
        hasColumnChooser
        list={<QuestionsList />}
        create={<QuestionCreate />}
        edit={<QuestionEdit />}
        show={<QuestionShow />}
        hasLiveUpdate
        hasDialog
        filtersPlacement='top'
    // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const QuestionsMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Questions" leftIcon={<ICON />} />
)