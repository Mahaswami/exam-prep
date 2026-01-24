import {
    Resource, createDefaults, tableDefaults,
    editDefaults, formDefaults, listDefaults,
    showDefaults, RowActions, CardGrid,
    createReferenceField,
    createReferenceInput, RichTextField, RichTextInput, ReferenceLiveFilter, ChoicesLiveFilter, NumberLiveFilter, BooleanLiveFilter, TextLiveFilter, recordRep
} from '@mahaswami/swan-frontend';
import { Quiz } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
import {
    Create, DataTable, Edit, List, Menu, Show, SimpleForm, SimpleShowLayout,
    TextField, TextInput, type ListProps, BooleanField, BooleanInput, NumberField, NumberInput, SelectField, SelectInput, AutocompleteInput, required, useRecordContext,
    choices,
    FileInput,
    FileField,
    WithRecord,
    Labeled
} from "react-admin";
import { ConceptsReferenceField, ConceptsReferenceInput } from './concepts';
import { QuestionDisplay } from '../components/QuestionDisplay';
import { ChaptersReferenceField } from './chapters';
import { ReplaceSvgDialog } from '../components/ReplaceSvgDialog';

export const RESOURCE = "questions"
export const ICON = Quiz
export const PREFETCH: string[] = ["concepts"]

export const QuestionsReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const QuestionsReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const questionTypeChoices = [{ id: 'MCQ', name: 'MCQ' }, { id: 'VSA', name: '2 Marks' }, { id: 'SA', name: '3 Marks' },{ id: 'Case-Based', name: '4 Marks' }, { id: 'LA', name: '5 Marks' }];
export const difficultyChoices = [{ id: 'Easy', name: 'Easy' }, { id: 'Medium', name: 'Medium' }, { id: 'Hard', name: 'Hard' }];
export const questionStatusChoices = [{ id: 'active', name: 'Active' }, { id: 'need_correction', name: 'Need Correction' }, { id: 'need_verification', name: 'Need Verification' }, { id: 'in_active', name: 'In Active' }];

const filters = [
    <ReferenceLiveFilter source="concept_id" reference="concepts" label="Chapter" through='concept.chapter_id' show />,
    <ReferenceLiveFilter source="concept_id" reference="concepts" label="Concept" show />,
    <ChoicesLiveFilter source="difficulty" label="Difficulty" choiceLabels={difficultyChoices} show />,
    <ChoicesLiveFilter source="type" label="Type" choiceLabels={questionTypeChoices} show />,
    <BooleanLiveFilter source="is_invented" label="Is derived" show />,
    <ChoicesLiveFilter source="status" label="Status" choiceLabels={questionStatusChoices} />,
]

export const QuestionsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} filterDefaultValues={{ status: "active" }}>
            <DataTable {...tableDefaults(RESOURCE)}>
                <DataTable.Col source="id" />
                <DataTable.Col source='concept.chapter_id' field={ChaptersReferenceField} />
                <DataTable.Col source="concept_id" field={ConceptsReferenceField} />
                <DataTable.Col source="type" field={(props: any) => <SelectField {...props} choices={questionTypeChoices} />} />
                <DataTable.Col source="difficulty" field={(props: any) => <SelectField {...props} choices={difficultyChoices} />} />
                <DataTable.Col source="is_invented" label="Is derived" field={(props: any) => <BooleanField {...props} />} />
                <DataTable.Col source="status" field={(props: any) => <SelectField {...props} choices={questionStatusChoices} />} />
                <RowActions />
            </DataTable>
        </List>
    )
}


export const QuestionsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<ConceptsReferenceField source="concept_id" variant='h6' />}>
                <SelectField source="type" choices={questionTypeChoices} />
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
            <SelectInput source="type" validate={required()} choices={questionTypeChoices} />
            <SelectInput source="difficulty" choices={difficultyChoices} />
            <TextInput source="correct_option" />
            <Box sx={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <ReplaceSvgDialog fieldName="question_stream" buttonLabel="Replace Question SVG" />
                    <ReplaceSvgDialog fieldName="answer_stream" buttonLabel="Replace Answer SVG" />
                </Box>
                <TextInput source="question_stream" multiline rows={4} fullWidth />
            </Box>
            <TextInput sx={{ gridColumn: '1 / -1' }} source="answer_stream" multiline rows={4} />
            <TextInput source="hint" multiline rows={4}/>
            <TextInput source="options" multiline rows={4} />
            <TextInput source="final_answer" />
            <NumberInput source="marks_number" />
            <SelectInput label="Status" source="status" choices={questionStatusChoices} />
            <BooleanInput source="is_invented" label="Is derived" />
            <TextInput multiline source='comment' label={`Comment`} minRows={4} />
            <FileInput source='comment_attachments' label="Attachments" multiple>
                <FileField source="src" title="title" />
            </FileInput>
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
            <QuestionForm defaultValues={{ status: 'active' }}/>
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
                <SelectField label="Status" source="status" choices={questionStatusChoices} />
                <WithRecord render={(record: any) => record.status && record.status !== 'active' && (
                    <Labeled label="Comment">
                        <>
                            <TextField source='comment' label={`Comment (${record.status})`} />
                            <FileField source="comment_attachments" label="Attachments" src="src" title="title"/>
                        </>
                    </Labeled>
                )}/>
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


export const QuestionsResource = (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        recordRepresentation={(record: any) => recordRep('concepts', record.concept)}
        fieldSchema={{
            concept_id: { required: true, resource: 'concepts' },
            type: { type: 'choice', ui: 'select', required: true, choices: questionTypeChoices },
            difficulty: { type: 'choice', ui: 'select', choices: difficultyChoices },
            options: {},
            correct_option: {},
            hint: {},
            question_stream:{},
            answer_stream: {},
            final_answer: {},
            marks_number: {},
            status: { type: 'choice', ui: 'select', choices: questionStatusChoices },
            is_invented: {}
        }}
        filters={filters}
        filtersPlacement='top'
        list={<QuestionsList />}
        create={<QuestionCreate />}
        edit={<QuestionEdit />}
        show={<QuestionShow />}
        hasLiveUpdate
        hasHistory
    // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const QuestionsMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Questions" leftIcon={<ICON />} />
)