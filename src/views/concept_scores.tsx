import { Resource, createDefaults, tableDefaults, 
	editDefaults, formDefaults, listDefaults, 
	showDefaults, RowActions, CardGrid,
	createReferenceField,
	createReferenceInput, ReferenceLiveFilter, ChoicesLiveFilter, DateLiveFilter, recordRep, getLocalStorage  } from '@mahaswami/swan-frontend';
import { Assessment } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
import { Create, DataTable, Edit, List, Menu, Show, SimpleForm, SimpleShowLayout, 
    TextField, TextInput, type ListProps, DateField, DateInput, DateTimeInput, SelectField, SelectInput, AutocompleteInput, required, useRecordContext, ReferenceField } from "react-admin";
import { UsersReferenceField, UsersReferenceInput } from './users';
import { ConceptsReferenceField, ConceptsReferenceInput } from './concepts';
import { ChaptersReferenceField } from './chapters';

// Custom field to show chapter name via concept relationship
const ChapterViaConceptField = () => {
    const record = useRecordContext();
    if (!record?.concept_id) return null;
    return (
        <ReferenceField source="concept_id" reference="concepts" link={false}>
            <ReferenceField source="chapter_id" reference="chapters" link={false}>
                <TextField source="name" />
            </ReferenceField>
        </ReferenceField>
    );
};

export const RESOURCE = "concept_scores"
export const ICON = Assessment
export const PREFETCH: string[] = ["users", "concepts", "chapters"]

export const ConceptScoresReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const ConceptScoresReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const comfortLevelChoices = [{ id: 'needs_improvement', name: 'Needs Improvement' }, { id: 'good', name: 'Good' }, { id: 'very_good', name: 'Very Good' }];

const filters = [
    <ReferenceLiveFilter source="user_id" reference="users" label="User" />,
    <ReferenceLiveFilter source="concept_id" reference="concepts" label="Concept" />,
    <ChoicesLiveFilter source="initial_comfort_level" label="Initial Level" choiceLabels={comfortLevelChoices} />,
    <ChoicesLiveFilter source="comfort_level" label="Current Level" choiceLabels={comfortLevelChoices} />,
    <DateLiveFilter source="updated_timestamp" label="Updated Timestamp" />
]

const studentFilters = [
    <ReferenceLiveFilter source="concept_id" reference="concepts" label="Concept" />,
    <ChoicesLiveFilter source="initial_comfort_level" label="Initial Level" choiceLabels={comfortLevelChoices} />,
    <ChoicesLiveFilter source="comfort_level" label="Current Level" choiceLabels={comfortLevelChoices} />,
    <DateLiveFilter source="updated_timestamp" label="Updated Timestamp" />
]

export const ConceptScoresList = (props: ListProps) => {
    const isStudent = getLocalStorage('role') === 'student';
    return (
        <List {...listDefaults({ ...props, filters: isStudent ? studentFilters : filters })}>
            <DataTable {...tableDefaults(RESOURCE)}>
                {!isStudent && <DataTable.Col source="user_id" field={UsersReferenceField}/>}
                <DataTable.Col source="chapter" label="Chapter" field={ChapterViaConceptField}/>
                <DataTable.Col source="concept_id" field={ConceptsReferenceField}/>
                <DataTable.Col source="initial_comfort_level" label="Initial" field={(props: any) => <SelectField {...props} choices={comfortLevelChoices} />}/>
                <DataTable.Col source="comfort_level" label="Current" field={(props: any) => <SelectField {...props} choices={comfortLevelChoices} />}/>
                <DataTable.Col source="updated_timestamp" field={(props: any) => <DateField {...props} showTime />}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const ConceptScoresCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<UsersReferenceField source="user_id" variant='h6' />}>
                <ConceptsReferenceField source="concept_id" />
                <SelectField source="comfort_level" choices={comfortLevelChoices} />
            </CardGrid>
        </List>
    )
}

const ConceptScoreForm = (props: any) => {
    return (
        <SimpleForm {...formDefaults(props)}>
            <UsersReferenceInput source="user_id">
                <AutocompleteInput validate={required()} />
            </UsersReferenceInput>
            <ConceptsReferenceInput source="concept_id">
                <AutocompleteInput validate={required()} />
            </ConceptsReferenceInput>
            <SelectInput source="initial_comfort_level" label="Initial Level" choices={comfortLevelChoices} />
            <SelectInput source="comfort_level" label="Current Level" choices={comfortLevelChoices} validate={required()} />
            <DateTimeInput source="updated_timestamp" />
        </SimpleForm>
    )
}

const ConceptScoreEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <ConceptScoreForm />
        </Edit>
    )
}

const ConceptScoreCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <ConceptScoreForm />
        </Create>
    )
}

const ConceptScoreShow = (props: any) => {
    
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout>
                <UsersReferenceField source="user_id" />
                <ConceptsReferenceField source="concept_id" />
                <SelectField source="initial_comfort_level" label="Initial Level" choices={comfortLevelChoices} />
                <SelectField source="comfort_level" label="Current Level" choices={comfortLevelChoices} />
                <DateField source="updated_timestamp" showTime />
            </SimpleShowLayout>
        </Show>
    )
}


export const ConceptScoresResource =  (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        recordRepresentation={(record: any) => recordRep('users', record.user)}
        fieldSchema={{
            user_id: { required: true, resource: 'users' },
            concept_id: { required: true, resource: 'concepts' },
            initial_comfort_level: { type: 'choice', ui: 'select', choices: comfortLevelChoices },
            comfort_level: { type: 'choice', ui: 'select', required: true, choices: comfortLevelChoices },
            updated_timestamp: {}
        }}
        filters={filters}
        list={<ConceptScoresList/>}
        create={<ConceptScoreCreate/>}
        edit={<ConceptScoreEdit/>}
        show={<ConceptScoreShow/>}
        hasDialog
        hasLiveUpdate
        hasImport
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const ConceptScoresMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Concept Scores" leftIcon={<ICON />} />
)