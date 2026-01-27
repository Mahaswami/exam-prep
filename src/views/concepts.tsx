import { Resource, createDefaults, tableDefaults, 
	editDefaults, formDefaults, listDefaults, 
	showDefaults, RowActions, CardGrid,
	createReferenceField,
	createReferenceInput, ReferenceLiveFilter, NumberLiveFilter, BooleanLiveFilter, TextLiveFilter  } from '@mahaswami/swan-frontend';
import { Class } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
import { Create, DataTable, Edit, List, Menu, Show, SimpleForm, SimpleShowLayout, 
    TextField, TextInput, type ListProps, BooleanField, BooleanInput, NumberField, NumberInput, AutocompleteInput, required } from "react-admin";
import { ChaptersReferenceField, ChaptersReferenceInput } from './chapters';
import { getConceptQuestionCounts, QuestionCounts, ShowQuestionDetails, type QuestionCountsType } from '../components/QuestionCounts';
import { useEffect, useState } from 'react';

export const RESOURCE = "concepts"
export const ICON = Class
export const PREFETCH: string[] = ["chapters"]

export const ConceptsReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const ConceptsReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
const filters = [
    <TextLiveFilter source="search" fields={["name"]} />,
    <ReferenceLiveFilter source="chapter_id" reference="chapters" label="Chapter" show sx={{ minWidth: 350 }}/>,
    <NumberLiveFilter source="concept_order_number" label="Concept Order" />,
    <BooleanLiveFilter source="is_active" label="Active" />
]

export const ConceptsList = (props: ListProps) => {
    const [questionDetails, setQuestionDetails] = useState<Record<number, QuestionCountsType>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const questionCounts = await getConceptQuestionCounts();
                setQuestionDetails(questionCounts);
            } catch (error) {
                console.error("Error:  Question counts data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(RESOURCE)} isLoading={loading} expand={<QuestionCounts questionCounts={questionDetails} />}>
                <DataTable.Col source="chapter_id" field={ChaptersReferenceField}/>
                <DataTable.Col source="concept_order_number" label="Concept order" field={NumberField}/>
                <DataTable.Col source="name" />
                <DataTable.Col source="is_active" label="Active?" field={BooleanField}/>
                <DataTable.Col label="Active Q" render={(record: any) => questionDetails[record.id]?.activeQuestions}/>
                <DataTable.Col label="Diagnostic Q" render={(record: any) => questionDetails[record.id]?.diagnosticQuestions}/>
                <DataTable.Col label="Non-Diagnostic Q" render={(record: any) => questionDetails[record.id]?.nonDiagnosticQuestions}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const ConceptsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<ChaptersReferenceField source="chapter_id" variant='h6' />}>
                <NumberField source="concept_order_number" />
                <TextField source="name" />
            </CardGrid>
        </List>
    )
}

const ConceptForm = (props: any) => {
    return (
        <SimpleForm {...formDefaults(props)}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, columnGap: '1rem', width: '100%' }}>
                <ChaptersReferenceInput source="chapter_id">
                    <AutocompleteInput validate={required()} />
                </ChaptersReferenceInput>
                <TextInput source="name" validate={required()} />
                <NumberInput source="concept_order_number" />
                <BooleanInput source="is_active" />
                <ShowQuestionDetails />
            </Box>
        </SimpleForm>
    )
}

const ConceptEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <ConceptForm />
        </Edit>
    )
}

const ConceptCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <ConceptForm />
        </Create>
    )
}

const ConceptShow = (props: any) => {
    
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout display={'grid'} gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}>
                <ChaptersReferenceField source="chapter_id" />
                <TextField source="name" />
                <NumberField source="concept_order_number" />
                <BooleanField source="is_active" />
                <ShowQuestionDetails />
            </SimpleShowLayout>
        </Show>
    )
}


export const ConceptsResource =  (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        fieldSchema={{
            chapter_id: { required: true, resource: 'chapters' },
            concept_order_number: {},
            name: { required: true },
            is_active: {}
        }}
        filters={filters}
        list={<ConceptsList/>}
        create={<ConceptCreate/>}
        edit={<ConceptEdit/>}
        show={<ConceptShow/>}
        filtersPlacement="top"
        hasDialog
        hasLiveUpdate
        hasImport
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const ConceptsMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Concepts" leftIcon={<ICON />} />
)