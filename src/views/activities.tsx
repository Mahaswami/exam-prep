import { Resource, createDefaults, tableDefaults, 
	editDefaults, formDefaults, listDefaults, 
	showDefaults, RowActions, CardGrid,
	createReferenceField,
	createReferenceInput, ReferenceLiveFilter, DateLiveFilter, ChoicesLiveFilter, recordRep  } from '@mahaswami/swan-frontend';
import { LocalActivity } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
import { Create, DataTable, Edit, List, Menu, Show, SimpleForm, SimpleShowLayout, 
    TextField, TextInput, type ListProps, DateField, DateInput, DateTimeInput, SelectField, SelectInput, AutocompleteInput, required } from "react-admin";
import { UsersReferenceField, UsersReferenceInput } from './users';
import { ChaptersReferenceField, ChaptersReferenceInput } from './chapters';
import { ConceptsReferenceField, ConceptsReferenceInput } from './concepts';

export const RESOURCE = "activities"
export const ICON = LocalActivity
export const PREFETCH: string[] = ["users", "chapters", "concepts"]

export const ActivitiesReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const ActivitiesReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const activityTypeChoices = [{ id: 'diagnostic_test', name: 'Diagnostic Test' }, { id: 'revision_round', name: 'Revision Round' }, { id: 'test_round', name: 'Test Round' }];

const filters = [
    <ReferenceLiveFilter source="user_id" reference="users" label="User" />,
    <DateLiveFilter source="activity_timestamp" label="Activity Timestamp" />,
    <ChoicesLiveFilter source="activity_type" label="Activity Type" choiceLabels={activityTypeChoices} />,
    <ReferenceLiveFilter source="chapter_id" reference="chapters" label="Chapter" />,
    <ReferenceLiveFilter source="concept_id" reference="concepts" label="Concept" />
]

export const ActivitiesList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(RESOURCE)}>
                <DataTable.Col source="user_id" field={UsersReferenceField}/>
                <DataTable.Col source="activity_timestamp" field={(props: any) => <DateField {...props} showTime />}/>
                <DataTable.Col source="activity_type" field={(props: any) => <SelectField {...props} choices={activityTypeChoices} />}/>
                <DataTable.Col source="chapter_id" field={ChaptersReferenceField}/>
                <DataTable.Col source="concept_id" field={ConceptsReferenceField}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const ActivitiesCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<UsersReferenceField source="user_id" variant='h6' />}>
                <DateField source="activity_timestamp" showTime />
                <SelectField source="activity_type" choices={activityTypeChoices} />
            </CardGrid>
        </List>
    )
}

const ActivityForm = (props: any) => {
    return (
        <SimpleForm {...formDefaults(props)}>
            <UsersReferenceInput source="user_id">
                <AutocompleteInput validate={required()} />
            </UsersReferenceInput>
            <DateTimeInput source="activity_timestamp" validate={required()} />
            <SelectInput source="activity_type" choices={activityTypeChoices} validate={required()} />
            <ChaptersReferenceInput source="chapter_id" />
            <ConceptsReferenceInput source="concept_id" />
        </SimpleForm>
    )
}

const ActivityEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <ActivityForm />
        </Edit>
    )
}

const ActivityCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <ActivityForm />
        </Create>
    )
}

const ActivityShow = (props: any) => {
    
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout>
                <UsersReferenceField source="user_id" />
                <DateField source="activity_timestamp" showTime />
                <SelectField source="activity_type" choices={activityTypeChoices} />
                <ChaptersReferenceField source="chapter_id" />
                <ConceptsReferenceField source="concept_id" />
            </SimpleShowLayout>
        </Show>
    )
}


export const ActivitiesResource =  (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        recordRepresentation={(record: any) => recordRep('users', record.user)}
        fieldSchema={{
            user_id: { required: true, resource: 'users' },
            activity_timestamp: { required: true },
            activity_type: { type: 'choice', ui: 'select', required: true, choices: activityTypeChoices },
            chapter_id: { resource: 'chapters' },
            concept_id: { resource: 'concepts' }
        }}
        filters={filters}
        list={<ActivitiesList/>}
        // create={<ActivityCreate/>}
        // edit={<ActivityEdit/>}
        show={<ActivityShow/>}
        hasDialog
        hasLiveUpdate
        hasImport
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const ActivitiesMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Activities" leftIcon={<ICON />} />
)