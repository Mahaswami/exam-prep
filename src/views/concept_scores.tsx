import { Resource, createDefaults, tableDefaults, 
	editDefaults, formDefaults, listDefaults, 
	showDefaults, RowActions, CardGrid,
	createReferenceField,
	createReferenceInput, ReferenceLiveFilter, ChoicesLiveFilter, DateLiveFilter, recordRep, RelativeDateField  } from '@mahaswami/swan-frontend';
import { Assessment, TrendingUp, TrendingDown, Refresh, Timer } from '@mui/icons-material';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';
import {
    Create,
    DataTable,
    Edit,
    List,
    Menu,
    Show,
    SimpleForm,
    SimpleShowLayout,
    type ListProps,
    DateField,
    DateTimeInput,
    SelectField,
    SelectInput,
    AutocompleteInput,
    required,
    useRecordContext,
    ReferenceField,
    usePermissions,
    useRedirect
} from "react-admin";
import {redirect, useNavigate} from 'react-router-dom';
import { UsersReferenceField, UsersReferenceInput } from './users';
import { ConceptsReferenceField, ConceptsReferenceInput } from './concepts';
import { ChaptersReferenceField } from './chapters';
import {createRevisionRoundForStudent} from "../logic/revisions.ts";
import {createTestRoundForStudent} from "../logic/tests.ts";

const LEVEL_ORDER = { 'needs_improvement': 0, 'good': 1, 'very_good': 2 } as const;
const LEVEL_COLORS = {
    'needs_improvement': { bg: '#ffebee', color: '#c62828' },
    'good': { bg: '#fff8e1', color: '#f57c00' },
    'very_good': { bg: '#e8f5e9', color: '#2e7d32' }
} as const;
const LEVEL_LABELS = { 'needs_improvement': 'Needs Work', 'good': 'Good', 'very_good': 'Very Good' } as const;

const ComfortLevelChip = ({ value }: { value: string }) => {
    const colors = LEVEL_COLORS[value as keyof typeof LEVEL_COLORS] || { bg: '#f5f5f5', color: '#757575' };
    const label = LEVEL_LABELS[value as keyof typeof LEVEL_LABELS] || value;
    return (
        <Chip 
            label={label} 
            size="small" 
            sx={{ bgcolor: colors.bg, color: colors.color, fontWeight: 500 }} 
        />
    );
};

const ComfortLevelField = ({ source }: { source: string }) => {
    const record = useRecordContext();
    if (!record?.[source]) return null;
    return <ComfortLevelChip value={record[source]} />;
};

const ComfortLevelWithTrend = () => {
    const record = useRecordContext();
    if (!record?.comfort_level) return null;
    
    const initial = LEVEL_ORDER[record.initial_comfort_level as keyof typeof LEVEL_ORDER] ?? -1;
    const current = LEVEL_ORDER[record.comfort_level as keyof typeof LEVEL_ORDER] ?? -1;
    
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ComfortLevelChip value={record.comfort_level} />
            {initial >= 0 && current > initial && (
                <TrendingUp sx={{ fontSize: 18, color: '#2e7d32' }} />
            )}
            {initial >= 0 && current < initial && (
                <TrendingDown sx={{ fontSize: 18, color: '#c62828' }} />
            )}
        </Box>
    );
};

// Custom field to show chapter name via concept relationship
const ChapterViaConceptField = () => {
    const record = useRecordContext();
    if (!record?.concept_id) return null;
    return (
        <ReferenceField source="concept_id" reference="concepts" link={false}>
            <ChaptersReferenceField source="chapter_id" />
        </ReferenceField>
    );
};

const ConceptScoreRowActions = () => {
    const record = useRecordContext();
    const navigate = useNavigate();
    if (!record?.concept_id) return null;

    return (
        <>
            <Tooltip title="Practice">
                <IconButton 
                    size="small"
                    onClick={async(e) => {
                        e.stopPropagation();
                        const revisionRound = await createRevisionRoundForStudent(record.concept?.chapter_id, record.concept_id);
                        navigate(`/revision/start/${record.concept?.chapter_id}/${record.concept_id}/${revisionRound?.id}`);
                    }}
                >
                    <Refresh fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Test">
                <IconButton 
                    size="small"
                    onClick={async(e) => {
                        e.stopPropagation();
                        const testRound = await createTestRoundForStudent(record.concept?.chapter_id, record.concept_id);
                        navigate(`/testrounds/start/${record.concept?.chapter_id}/${record.concept_id}/${testRound?.id}`);
                    }}
                >
                    <Timer fontSize="small" />
                </IconButton>
            </Tooltip>
        </>
    );
};

export const RESOURCE = "concept_scores"
export const ICON = Assessment
export const PREFETCH: string[] = ["users", "concepts"]

export const ConceptScoresReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const ConceptScoresReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const comfortLevelChoices = [{ id: 'needs_improvement', name: 'Needs Improvement' }, { id: 'good', name: 'Good' }, { id: 'very_good', name: 'Very Good' }];

const isStudent = (permissions: any) => permissions === 'student';

const filters = (permissions: any) => [
    !isStudent(permissions) && <ReferenceLiveFilter show source="user_id" reference="users" label="User" />,
    <ReferenceLiveFilter show source="concept_id" through="chapter_id.subject_id" label="Subject" />,
    <ReferenceLiveFilter show source="concept_id" through="chapter_id" label="Chapter" sx={{ minWidth: 350 }} />,
    <ReferenceLiveFilter show source="concept_id" reference="concepts" label="Concept" />,
    <ChoicesLiveFilter source="initial_comfort_level" label="Initial Level" choiceLabels={comfortLevelChoices} />,
    <ChoicesLiveFilter source="comfort_level" label="Current Level" choiceLabels={comfortLevelChoices} />,
    <DateLiveFilter source="updated_timestamp" label="Updated Timestamp" />
].filter(Boolean) as React.ReactElement[];
export const ConceptScoresList = (props: ListProps) => {
    const { permissions } = usePermissions();
    
    return (
        <List {...listDefaults({ ...props })}>
            <DataTable {...tableDefaults(RESOURCE)}>
                {!isStudent(permissions) && <DataTable.Col source="user_id" field={UsersReferenceField}/>}
                <DataTable.Col source="chapter" label="Chapter" field={ChapterViaConceptField}/>
                <DataTable.Col source="concept_id" field={ConceptsReferenceField}/>
                <DataTable.Col source="initial_comfort_level" label="Initial" field={() => <ComfortLevelField source="initial_comfort_level" />}/>
                <DataTable.Col source="comfort_level" label="Current" field={ComfortLevelWithTrend}/>
                <DataTable.Col source="updated_timestamp" label="Updated" field={RelativeDateField}/>
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
        listRowActions={<ConceptScoreRowActions />}
        hasDialog
        hasLiveUpdate
        hasImport
        filtersPlacement='top'
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const ConceptScoresMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Concept Scores" leftIcon={<ICON />} />
)