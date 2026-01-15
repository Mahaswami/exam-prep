import { Resource, createDefaults, tableDefaults, 
	editDefaults, formDefaults, listDefaults, 
	showDefaults, RowActions, CardGrid,
	createReferenceField,
	createReferenceInput, SimpleFileField, SimpleFileInput, ChoicesLiveFilter, TextLiveFilter  } from '@mahaswami/swan-frontend';
import { Description } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
import { Create, DataTable, Edit, List, Menu, Show, SimpleForm, SimpleShowLayout, 
    TextField, TextInput, type ListProps, SelectField, SelectInput, required, useUnique } from "react-admin";


export const RESOURCE = "document_templates"
export const ICON = Description
export const PREFETCH: string[] = []

export const DocumentTemplatesReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const DocumentTemplatesReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const documentTypeChoices = [{ id: 'rental_agreement', name: 'Rental Agreement' }, { id: 'lease_deed', name: 'Lease Deed' }, { id: 'noc', name: 'NOC' }, { id: 'termination_notice', name: 'Termination Notice' }, { id: 'rent_receipt', name: 'Rent Receipt' }];

const filters = [
    <TextLiveFilter source="search" fields={["name"]} />,
    <ChoicesLiveFilter source="document_type" label="Document Type" choiceLabels={documentTypeChoices} />
]

export const DocumentTemplatesList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(RESOURCE)}>
                <DataTable.Col source="name" />
                <DataTable.Col source="document_type" field={(props: any) => <SelectField {...props} choices={documentTypeChoices} />}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const DocumentTemplatesCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<TextField source="name" variant='h6' />}>
                <SelectField source="document_type" choices={documentTypeChoices} />
            </CardGrid>
        </List>
    )
}

const DocumentTemplateForm = (props: any) => {
    const unique = useUnique();
    return (
        <SimpleForm {...formDefaults(props)}>
            <TextInput source="name" validate={[required(), unique()]} />
            <SelectInput source="document_type" choices={documentTypeChoices} />
            <SimpleFileInput source="document_attachment_file_id" />
            <SimpleFileField source="document_attachment_file_id" title="document_attachment_file_name" />
        </SimpleForm>
    )
}

const DocumentTemplateEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <DocumentTemplateForm />
        </Edit>
    )
}

const DocumentTemplateCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <DocumentTemplateForm />
        </Create>
    )
}

const DocumentTemplateShow = (props: any) => {
    
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout>
                <TextField source="name" />
                <SelectField source="document_type" choices={documentTypeChoices} />
                <SimpleFileField source="document_attachment_file_id" title="document_attachment_file_name" />
            </SimpleShowLayout>
        </Show>
    )
}


export const DocumentTemplatesResource =  (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        fieldSchema={{
            name: { required: true, unique: true },
            document_type: { type: 'choice', ui: 'select', choices: documentTypeChoices },
            document_attachment_file_id: {}
        }}
        filters={filters}
        list={<DocumentTemplatesList/>}
        create={<DocumentTemplateCreate/>}
        edit={<DocumentTemplateEdit/>}
        show={<DocumentTemplateShow/>}
        hasDialog
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const DocumentTemplatesMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Document Templates" leftIcon={<ICON />} />
)