import { Resource, createDefaults, tableDefaults, 
	editDefaults, formDefaults, listDefaults, 
	showDefaults, RowActions, CardGrid,
	createReferenceField,
	createReferenceInput, BooleanLiveFilter, TextLiveFilter  } from '@mahaswami/swan-frontend';
import { School } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
import { Create, DataTable, Edit, List, Menu, Show, SimpleForm, SimpleShowLayout, 
    TextField, TextInput, type ListProps, BooleanField, BooleanInput, required, useUnique } from "react-admin";


export const RESOURCE = "subjects"
export const ICON = School
export const PREFETCH: string[] = []

export const SubjectsReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const SubjectsReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
const filters = [
    <TextLiveFilter source="search" fields={["name", "code"]} />,
    <BooleanLiveFilter source="is_active" label="Active" />
]

export const SubjectsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(RESOURCE)}>
                <DataTable.Col source="name" />
                <DataTable.Col source="code" />
                <DataTable.Col source="is_active" field={BooleanField}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const SubjectsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<TextField source="name" variant='h6' />}>
                <TextField source="code" />
                <BooleanField source="is_active" />
            </CardGrid>
        </List>
    )
}

const SubjectForm = (props: any) => {
    const unique = useUnique();
    return (
        <SimpleForm {...formDefaults(props)}>
            <TextInput source="name" validate={[required(), unique()]} />
            <TextInput source="code" validate={unique()} />
            <BooleanInput source="is_active" />
        </SimpleForm>
    )
}

const SubjectEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <SubjectForm />
        </Edit>
    )
}

const SubjectCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <SubjectForm />
        </Create>
    )
}

const SubjectShow = (props: any) => {
    
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout>
                <TextField source="name" />
                <TextField source="code" />
                <BooleanField source="is_active" />
            </SimpleShowLayout>
        </Show>
    )
}


export const SubjectsResource =  (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        fieldSchema={{
            name: { required: true, unique: true },
            code: { unique: true },
            is_active: {}
        }}
        filters={filters}
        list={<SubjectsList/>}
        create={<SubjectCreate/>}
        edit={<SubjectEdit/>}
        show={<SubjectShow/>}
        hasDialog
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const SubjectsMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Subjects" leftIcon={<ICON />} />
)