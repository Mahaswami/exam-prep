import { Resource, createDefaults, tableDefaults, 
	editDefaults, formDefaults, listDefaults, 
	showDefaults, RowActions, CardGrid,
	createReferenceField,
	createReferenceInput, ReferenceLiveFilter, NumberLiveFilter, recordRep  } from '@mahaswami/swan-frontend';
import { Assignment } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
import { Create, DataTable, Edit, List, Menu, Show, SimpleForm, SimpleShowLayout, 
    TextField, TextInput, type ListProps, NumberField, NumberInput, AutocompleteInput, required } from "react-admin";
import { ChaptersReferenceField, ChaptersReferenceInput } from './chapters';
import { QuestionsReferenceField, QuestionsReferenceInput } from './questions';

export const RESOURCE = "chapter_diagnostic_questions"
export const ICON = Assignment
export const PREFETCH: string[] = ["chapters", "questions"]

export const ChapterDiagnosticQuestionsReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const ChapterDiagnosticQuestionsReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
const filters = [
    <ReferenceLiveFilter source="chapter_id" reference="chapters" label="Chapter" />,
    <ReferenceLiveFilter source="question_id" reference="questions" label="Question" />,
    <NumberLiveFilter source="question_order_number" label="Question Order" />
]

export const ChapterDiagnosticQuestionsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(RESOURCE)}>
                <DataTable.Col source="chapter_id" field={ChaptersReferenceField}/>
                <DataTable.Col source="question_id" field={QuestionsReferenceField}/>
                <DataTable.Col source="question_order_number" field={NumberField}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const ChapterDiagnosticQuestionsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<ChaptersReferenceField source="chapter_id" variant='h6' />}>
                <QuestionsReferenceField source="question_id" />
                <NumberField source="question_order_number" />
            </CardGrid>
        </List>
    )
}

const ChapterDiagnosticQuestionForm = (props: any) => {
    return (
        <SimpleForm {...formDefaults(props)}>
            <ChaptersReferenceInput source="chapter_id">
                <AutocompleteInput validate={required()} />
            </ChaptersReferenceInput>
            <QuestionsReferenceInput source="question_id">
                <AutocompleteInput validate={required()} />
            </QuestionsReferenceInput>
            <NumberInput source="question_order_number" />
        </SimpleForm>
    )
}

const ChapterDiagnosticQuestionEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <ChapterDiagnosticQuestionForm />
        </Edit>
    )
}

const ChapterDiagnosticQuestionCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <ChapterDiagnosticQuestionForm />
        </Create>
    )
}

const ChapterDiagnosticQuestionShow = (props: any) => {
    
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout>
                <ChaptersReferenceField source="chapter_id" />
                <QuestionsReferenceField source="question_id" />
                <NumberField source="question_order_number" />
            </SimpleShowLayout>
        </Show>
    )
}


export const ChapterDiagnosticQuestionsResource =  (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        recordRepresentation={(record: any) => recordRep('chapters', record.chapter)}
        fieldSchema={{
            chapter_id: { required: true, resource: 'chapters' },
            question_id: { required: true, resource: 'questions' },
            question_order_number: {}
        }}
        filters={filters}
        list={<ChapterDiagnosticQuestionsList/>}
        create={<ChapterDiagnosticQuestionCreate/>}
        edit={<ChapterDiagnosticQuestionEdit/>}
        show={<ChapterDiagnosticQuestionShow/>}
        hasDialog
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const ChapterDiagnosticQuestionsMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Chapter Diagnostic Questions" leftIcon={<ICON />} />
)