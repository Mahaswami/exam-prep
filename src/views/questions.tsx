import { Resource, createDefaults, tableDefaults, 
	editDefaults, formDefaults, listDefaults, 
	showDefaults, RowActions, CardGrid,
	createReferenceField,
	createReferenceInput, RichTextField, RichTextInput, ReferenceLiveFilter, ChoicesLiveFilter, NumberLiveFilter, BooleanLiveFilter, TextLiveFilter, recordRep  } from '@mahaswami/swan-frontend';
import { Quiz } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
import { Create, DataTable, Edit, List, Menu, Show, SimpleForm, SimpleShowLayout, 
    TextField, TextInput, type ListProps, BooleanField, BooleanInput, NumberField, NumberInput, SelectField, SelectInput, AutocompleteInput, required } from "react-admin";
import { ConceptsReferenceField, ConceptsReferenceInput } from './concepts';

export const RESOURCE = "questions"
export const ICON = Quiz
export const PREFETCH: string[] = ["concepts"]

export const QuestionsReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const QuestionsReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const questionTypeChoices = [{ id: 'mcq', name: 'MCQ' }, { id: '2_marks', name: '2 Marks' }, { id: '4_marks', name: '4 Marks' }, { id: '5_marks', name: '5 Marks' }];
export const difficultyLevelChoices = [{ id: 'easy', name: 'Easy' }, { id: 'medium', name: 'Medium' }, { id: 'hard', name: 'Hard' }];

const filters = [
    <TextLiveFilter source="search" fields={["option_a", "option_b", "option_c"]} />,
    <ReferenceLiveFilter source="concept_id" reference="concepts" label="Concept" />,
    <ChoicesLiveFilter source="question_type" label="Question Type" choiceLabels={questionTypeChoices} />,
    <ChoicesLiveFilter source="difficulty_level" label="Difficulty Level" choiceLabels={difficultyLevelChoices} />,
    <NumberLiveFilter source="marks_number" label="Marks" />,
    <BooleanLiveFilter source="is_active" label="Active" />
]

export const QuestionsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(RESOURCE)}>
                <DataTable.Col source="concept_id" field={ConceptsReferenceField}/>
                <DataTable.Col source="question_type" field={(props: any) => <SelectField {...props} choices={questionTypeChoices} />}/>
                <DataTable.Col source="difficulty_level" field={(props: any) => <SelectField {...props} choices={difficultyLevelChoices} />}/>
                <DataTable.Col source="option_a" />
                <DataTable.Col source="option_b" />
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const QuestionsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<ConceptsReferenceField source="concept_id" variant='h6' />}>
                <SelectField source="question_type" choices={questionTypeChoices} />
                <SelectField source="difficulty_level" choices={difficultyLevelChoices} />
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
            <SelectInput source="question_type" choices={questionTypeChoices} validate={required()} />
            <SelectInput source="difficulty_level" choices={difficultyLevelChoices} />
            <RichTextInput source="question_html" validate={required()} />
            <TextInput source="option_a" />
            <TextInput source="option_b" />
            <TextInput source="option_c" />
            <TextInput source="option_d" />
            <TextInput source="correct_answer" />
            <RichTextInput source="hint_html" />
            <RichTextInput source="solution_html" />
            <NumberInput source="marks_number" validate={required()} />
            <BooleanInput source="is_active" />
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
            <SimpleShowLayout
                display="grid"
                gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
                gap="1rem">
                <ConceptsReferenceField source="concept_id" />
                <SelectField source="question_type" choices={questionTypeChoices} />
                <SelectField source="difficulty_level" choices={difficultyLevelChoices} />
                <RichTextField source="question_html" />
                <TextField source="option_a" />
                <TextField source="option_b" />
                <TextField source="option_c" />
                <TextField source="option_d" />
                <TextField source="correct_answer" />
                <RichTextField source="hint_html" />
                <RichTextField source="solution_html" />
                <NumberField source="marks_number" />
                <BooleanField source="is_active" />
            </SimpleShowLayout>
        </Show>
    )
}


export const QuestionsResource =  (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        recordRepresentation={(record: any) => recordRep('concepts', record.concept)}
        fieldSchema={{
            concept_id: { required: true, resource: 'concepts' },
            question_type: { type: 'choice', ui: 'select', required: true, choices: questionTypeChoices },
            difficulty_level: { type: 'choice', ui: 'select', choices: difficultyLevelChoices },
            question_html: { ui: 'rich', required: true },
            option_a: {},
            option_b: {},
            option_c: {},
            option_d: {},
            correct_answer: {},
            hint_html: { ui: 'rich' },
            solution_html: { ui: 'rich' },
            marks_number: { required: true },
            is_active: {}
        }}
        filters={filters}
        list={<QuestionsList/>}
        create={<QuestionCreate/>}
        edit={<QuestionEdit/>}
        show={<QuestionShow/>}
        hasDialog
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const QuestionsMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Questions" leftIcon={<ICON />} />
)