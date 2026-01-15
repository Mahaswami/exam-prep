import { Resource, createDefaults, tableDefaults, 
	editDefaults, formDefaults, listDefaults, 
	showDefaults, RowActions, CardGrid,
	createReferenceField,
	createReferenceInput, TextLiveFilter  } from '@mahaswami/swan-frontend';
import { Verified } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
import { Create, DataTable, Edit, List, Menu, Show, SimpleForm, SimpleShowLayout, 
    TextField, TextInput, type ListProps, FileField, FileInput } from "react-admin";


export const RESOURCE = "digital_signatures"
export const ICON = Verified
export const PREFETCH: string[] = []

export const DigitalSignaturesReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const DigitalSignaturesReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
const filters = [
    <TextLiveFilter source="search" fields={["status", "name_of_resource", "id_of_resource"]} />
]

export const DigitalSignaturesList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(RESOURCE)}>
                <DataTable.Col source="status" />
                <DataTable.Col source="name_of_resource" />
                <DataTable.Col source="id_of_resource" />
                <DataTable.Col source="signer_user_ids" />
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const DigitalSignaturesCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<TextField source="status" variant='h6' />}>
                <TextField source="name_of_resource" />
                <TextField source="id_of_resource" />
            </CardGrid>
        </List>
    )
}

const DigitalSignatureForm = (props: any) => {
    return (
        <SimpleForm {...formDefaults(props)}>
            <FileInput source="document_attachments" multiple>
                <FileField source="src" title="title" />
            </FileInput>
            <TextInput source="status" />
            <TextInput source="name_of_resource" />
            <TextInput source="id_of_resource" />
            <TextInput source="signer_user_ids" />
        </SimpleForm>
    )
}

const DigitalSignatureEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <DigitalSignatureForm />
        </Edit>
    )
}

const DigitalSignatureCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <DigitalSignatureForm />
        </Create>
    )
}

const DigitalSignatureShow = (props: any) => {
    
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout>
                <FileField source="document_attachments" src="src" title="title" />
                <TextField source="status" />
                <TextField source="name_of_resource" />
                <TextField source="id_of_resource" />
                <TextField source="signer_user_ids" />
            </SimpleShowLayout>
        </Show>
    )
}


export const DigitalSignaturesResource =  (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        recordRepresentation={(record: any) => record.status}
        fieldSchema={{
            document_attachments: {},
            status: {},
            name_of_resource: {},
            id_of_resource: {},
            signer_user_ids: {}
        }}
        filters={filters}
        list={<DigitalSignaturesList/>}
        create={<DigitalSignatureCreate/>}
        edit={<DigitalSignatureEdit/>}
        show={<DigitalSignatureShow/>}
        hasDialog
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const DigitalSignaturesMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Digital Signatures" leftIcon={<ICON />} />
)