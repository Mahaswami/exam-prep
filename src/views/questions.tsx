import { Resource, createDefaults, tableDefaults, 
	editDefaults, formDefaults, listDefaults, 
	showDefaults, RowActions, CardGrid,
	createReferenceField,
	createReferenceInput, RichTextField, RichTextInput, ReferenceLiveFilter, ChoicesLiveFilter, NumberLiveFilter, BooleanLiveFilter, TextLiveFilter, recordRep  } from '@mahaswami/swan-frontend';
import { Quiz } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
import { Create, DataTable, Edit, List, Menu, Show, SimpleForm, SimpleShowLayout, 
    TextField, TextInput, type ListProps, BooleanField, BooleanInput, NumberField, NumberInput, SelectField, SelectInput, AutocompleteInput, required, useRecordContext } from "react-admin";
import { ConceptsReferenceField, ConceptsReferenceInput } from './concepts';
import { QuestionDisplay } from '../components/QuestionDisplay';
import { ChaptersReferenceField } from './chapters';

export const RESOURCE = "questions"
export const ICON = Quiz
export const PREFETCH: string[] = ["concepts"]

export const QuestionsReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const QuestionsReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const questionTypeChoices = [{ id: 'mcq', name: 'MCQ' }, { id: '2_marks', name: '2 Marks' }, { id: '4_marks', name: '4 Marks' }, { id: '5_marks', name: '5 Marks' }];
export const difficultyLevelChoices = [{ id: 'easy', name: 'Easy' }, { id: 'medium', name: 'Medium' }, { id: 'hard', name: 'Hard' }];

const filters = [
    <ReferenceLiveFilter source="concept_id" reference="concepts" label="Chapter" through='concept.chapter_id' show/>,
    <ReferenceLiveFilter source="concept_id" reference="concepts" label="Concept" show />,
    <ChoicesLiveFilter source="difficulty" label="Difficulty" choiceLabels={difficultyLevelChoices} show />,
    <ChoicesLiveFilter source="type" label="Type" choiceLabels={questionTypeChoices} show />,
    <BooleanLiveFilter source="is_invented" label="Is derived" show/>,
]

export const QuestionsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(RESOURCE)}>
                <DataTable.Col source="id" />
                <DataTable.Col source="concept_id" field={ConceptsReferenceField}/>
                <DataTable.Col source="type" />
                <DataTable.Col source="difficulty" field={(props: any) => <SelectField {...props} choices={difficultyLevelChoices} />}/>
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

const QuestionShowContent = () => {
    const record = useRecordContext();
    if (!record) return null;
    
    return (
        <Box sx={{ p: 2 }}>
            <SimpleShowLayout display={'grid'} gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} columnGap="0.5rem">
                <ChaptersReferenceField label="Chapter" source="concept.chapter_id" />
                <ConceptsReferenceField source="concept_id" />
                <BooleanField label="Is derived" source="is_invented" />
                <BooleanField label="Is active" source="is_active" />
            </SimpleShowLayout>
            <QuestionDisplay
                question={{
                    id: record.id,
                    type: record.type,
                    difficulty: record.difficulty,
                    question_stream: record.question_stream,
                    options: record.options,
                    correct_option: record.correct_option,
                    hint: record.hint,
                    answer_stream: record.answer_stream,
                    final_answer: record.final_answer,
                }}
                mode="view"
                showSolution
                showHint
                showCorrectAnswer
            />
        </Box>
    );
};

const QuestionShow = (props: any) => {
    return (
        <Show {...showDefaults(props)}>
            <QuestionShowContent />
        </Show>
    )
}


export const QuestionsResource =  (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        recordRepresentation={(record: any) => record.type + " - " + recordRep('concepts', record.concept)}
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
        filtersPlacement='top'
        list={<QuestionsList/>}
        create={<QuestionCreate/>}
        edit={<QuestionEdit/>}
        show={<QuestionShow/>}
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const QuestionsMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Questions" leftIcon={<ICON />} />
)