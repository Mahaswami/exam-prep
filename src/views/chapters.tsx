import { Resource, createDefaults, tableDefaults, 
	editDefaults, formDefaults, listDefaults, 
	showDefaults, RowActions, CardGrid,
	createReferenceField,
	createReferenceInput, ReferenceLiveFilter, NumberLiveFilter, BooleanLiveFilter, TextLiveFilter  } from '@mahaswami/swan-frontend';
import { Book } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
import { Create, DataTable, Edit, List, Menu, Show, SimpleForm, SimpleShowLayout, 
    TextField, TextInput, type ListProps, BooleanField, BooleanInput, NumberField, NumberInput, AutocompleteInput, required, useUnique } from "react-admin";
import { SubjectsReferenceField, SubjectsReferenceInput } from './subjects';

export const RESOURCE = "chapters"
export const ICON = Book
export const PREFETCH: string[] = ["subjects"]

export const ChaptersReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const ChaptersReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
const filters = [
    <TextLiveFilter source="search" fields={["name"]} />,
    <ReferenceLiveFilter source="subject_id" reference="subjects" label="Subject" />,
    <NumberLiveFilter source="chapter_number" label="Chapter" />,
    <BooleanLiveFilter source="is_active" label="Active" />
]

export const ChaptersList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(RESOURCE)}>
                <DataTable.Col source="subject_id" field={SubjectsReferenceField}/>
                <DataTable.Col source="chapter_number" field={NumberField}/>
                <DataTable.Col source="name" />
                <DataTable.Col source="is_active" field={BooleanField}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const ChaptersCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<SubjectsReferenceField source="subject_id" variant='h6' />}>
                <NumberField source="chapter_number" />
                <TextField source="name" />
            </CardGrid>
        </List>
    )
}

const ChapterForm = (props: any) => {
    const unique = useUnique();
    return (
        <SimpleForm {...formDefaults(props)}>
            <SubjectsReferenceInput source="subject_id">
                <AutocompleteInput validate={required()} />
            </SubjectsReferenceInput>
            <NumberInput source="chapter_number" validate={required()} />
            <TextInput source="name" validate={[required(), unique()]} />
            <BooleanInput source="is_active" />
        </SimpleForm>
    )
}

const ChapterEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <ChapterForm />
        </Edit>
    )
}

const ChapterCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <ChapterForm />
        </Create>
    )
}

const ChapterShow = (props: any) => {
    
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout>
                <SubjectsReferenceField source="subject_id" />
                <NumberField source="chapter_number" />
                <TextField source="name" />
                <BooleanField source="is_active" />
            </SimpleShowLayout>
        </Show>
    )
}


export const ChaptersResource =  (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        fieldSchema={{
            subject_id: { required: true, resource: 'subjects' },
            chapter_number: { required: true },
            name: { required: true, unique: true },
            is_active: {}
        }}
        filters={filters}
        list={<ChaptersList/>}
        create={<ChapterCreate/>}
        edit={<ChapterEdit/>}
        show={<ChapterShow/>}
        hasDialog
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const ChaptersMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Chapters" leftIcon={<ICON />} />
)