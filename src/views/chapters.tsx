import {
    Resource,
    createDefaults,
    tableDefaults,
    editDefaults,
    formDefaults,
    listDefaults,
    showDefaults,
    RowActions,
    CardGrid,
    createReferenceField,
    createReferenceInput,
    ReferenceLiveFilter,
    NumberLiveFilter,
    BooleanLiveFilter,
    TextLiveFilter,
    SimpleFileInput,
    SimpleFileField,
    showLoading,
    hideLoading
} from '@mahaswami/swan-frontend';
import {Book, Refresh, Timer,} from '@mui/icons-material';
import { IconButton, Tooltip,CircularProgress, Button, Box} from '@mui/material';
import {
    Create,
    DataTable,
    Edit,
    List,
    Menu,
    Show,
    SimpleForm,
    SimpleShowLayout,
    TextField,
    TextInput,
    type ListProps,
    BooleanField,
    BooleanInput,
    NumberField,
    NumberInput,
    AutocompleteInput,
    required,
    useUnique,
    useRecordContext, useNotify, TopToolbar, CreateButton
} from "react-admin";
import { SubjectsReferenceField, SubjectsReferenceInput } from './subjects';
import {identifyConceptsForChapter, prepareQuestions} from "../logic/questionbank.ts";
import {
    generateChapterDiagnosticQuestions,
    uploadChapterDiagnosticQuestions
} from "../logic/chapter_diagnostic_questions.ts";
import {uploadChapterConcepts} from "../logic/questionbank.ts";
import {useEffect, useState} from "react";
import { getChaptersQuestionCounts, QuestionCountsType, QuestionCounts, ShowQuestionDetails } from '../components/QuestionCounts.tsx';

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

const ChapterRowActions = () => {
    const record = useRecordContext();
    const notify = useNotify();

    const [loadingConcepts, setLoadingConcepts] = useState(false);
    const [loadingPrepare, setLoadingPrepare] = useState(false);
    const [loadingAdd, setLoadingAdd] = useState(false);
    const [loadingConvert, setLoadingConvert] = useState(false);
    if (!record?.id) return null;

    return (
        <>
            <Tooltip title="Populate Concepts">
                <IconButton
                size="small"
                disabled={loadingConcepts}
                onClick={async(e) => {
                    e.stopPropagation();
                    setLoadingConcepts(true);
                    try{
                        const response = await identifyConceptsForChapter(record.questions_attachment_file_id);
                        if (response.conceptual_map && response.conceptual_map.length > 0) {
                            console.log("Uploading identified concepts to data provider...");
                            const conceptualMap = response.conceptual_map;
                            await uploadChapterConcepts(record.id,conceptualMap);
                        } else {
                            console.log("No concepts prepared from the question bank.");
                        }
                        notify("Populate concepts completed", { type: "info" });
                    }
                    catch(Error){
                        notify("Error populating concepts: " + Error, { type: "error" });
                    }
                    finally {
                        setLoadingConcepts(false);
                    }
                }}
            >
                    {loadingConcepts ? (
                        <CircularProgress size={18} />
                    ) : (
                        <Timer fontSize="small" />
                    )}
                </IconButton>
            </Tooltip>
            <Tooltip title="Prepare Questions">
                <IconButton
                    size="small"
                    disabled={loadingPrepare}
                    onClick={async (e) => {
                        e.stopPropagation();
                        setLoadingPrepare(true)
                        try {
                            if(!record.questions_attachment_file_id){
                                notify("No questions attachment file found", { type: "warning" });
                                return;
                            }
                            notify("Preparing questions...", { type: "info" });
                            await prepareQuestions(record.id, record.questions_attachment_file_id);
                            notify("Questions preparation completed", { type: "info" });
                        }
                        catch (Error) {
                            notify("Error preparing questions: " + Error, { type: "error" });
                        }
                        finally {
                            setLoadingPrepare(false);
                        }
                    }}
                >
                    {loadingPrepare ? (
                        <CircularProgress size={18} />
                    ) : (
                        <Refresh fontSize="small" />
                    )}
                </IconButton>
            </Tooltip>
            <Tooltip title="Add New Questions">
                <IconButton
                    size="small"
                    disabled={loadingAdd}
                    onClick={async (e) => {
                        e.stopPropagation();
                        setLoadingAdd(true)
                        try {
                            if(!record.questions_attachment_file_id){
                                notify("No questions attachment file found", { type: "warning" });
                                return;
                            }
                            notify("Preparing additional questions...", { type: "info" });
                            await prepareQuestions(record.id, record.questions_attachment_file_id,true);
                            notify("Additional questions preparation completed", { type: "info" });
                        }
                        catch (Error) {
                            notify("Error preparing questions: " + Error, { type: "error" });
                        }
                        finally {
                            setLoadingAdd(false)
                        }
                    }}
                >
                    {loadingAdd ? (
                        <CircularProgress size={18} />
                    ) : (
                        <Refresh fontSize="small" />
                    )}
                </IconButton>
            </Tooltip>
            <Tooltip title="Convert Short Questions to MCQ">
                <IconButton
                    size="small"
                    disabled={loadingConvert}
                    onClick={async (e) => {
                        e.stopPropagation();
                        setLoadingConvert(true)
                        try {
                            if(!record.questions_attachment_file_id){
                                notify("No questions attachment file found", { type: "warning" });
                                return;
                            }
                            notify("Preparing MCQs questions ...", { type: "info" });
                            await prepareQuestions(record.id, record.questions_attachment_file_id,false, true);
                            notify("MCQs questions preparation completed", { type: "info" });
                        }
                        catch (Error) {
                            notify("Error preparing questions: " + Error, { type: "error" });
                        }
                        finally {
                            setLoadingConvert(false)
                        }
                    }}
                >
                    {loadingConvert ? (
                        <CircularProgress size={18} />
                    ) : (
                        <Timer fontSize="small" />
                    )}
                </IconButton>
            </Tooltip>
            <GenerateDiagnosticButton chapterId={record?.id} />
        </>
    );
};


export const ChaptersList = (props: ListProps) => {
    const [questionDetails, setQuestionDetails] = useState<Record<number, QuestionCountsType>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const questionCounts = await getChaptersQuestionCounts();
                setQuestionDetails(questionCounts);
            } catch (error) {
                console.error("Error:  Question counts data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const ChapterListAction = () => (
        <TopToolbar sx={{ display: 'flex', alignItems: 'center' }}>
            <GenerateDiagnosticButton />
            <CreateButton />
        </TopToolbar>
    )

    return (
        <List {...listDefaults(props)} actions={<ChapterListAction/>}>
            <DataTable {...tableDefaults(RESOURCE)} isLoading={loading} expand={<QuestionCounts questionCounts={questionDetails} />}>
                <DataTable.Col source="subject_id" field={SubjectsReferenceField}/>
                <DataTable.Col source="chapter_number" label="Chapter number" field={NumberField}/>
                <DataTable.Col source="name" />
                <DataTable.Col source="is_active" label="Active?" field={BooleanField} />
                <DataTable.Col label="Active Q" render={(record: any) => questionDetails[record.id]?.activeQuestions} />
                <DataTable.Col label="Diagnostic Q" render={(record: any) => questionDetails[record.id]?.diagnosticQuestions} />
                <DataTable.Col label="Non-Diagnostic Q" render={(record: any) => questionDetails[record.id]?.nonDiagnosticQuestions} />
                <RowActions />
            </DataTable>
        </List>
    );
};


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

const GenerateDiagnosticButton = ({ chapterId }) => {
    const notify = useNotify();
    const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);

    const handleGenerateDiagnosticTest = async (e) => {
        e.stopPropagation();
        setLoadingDiagnostic(true);
        if (!chapterId) showLoading();
        try {
            const dataProvider = (window as any).swanAppFunctions.dataProvider;
            const { data: chapters } = await dataProvider.getList('chapters', {
                filter: { id:  chapterId }
            });
            const bulkCreateRequests = [];
            for (const chapter of chapters) {
                const questionIds = await generateChapterDiagnosticQuestions(chapter.id);
                console.log('Generated Diagnostic Test Question IDs: ', questionIds);
                const chapterGenerateDiagnostics: any = await uploadChapterDiagnosticQuestions(chapter.id, questionIds);
                if (chapterGenerateDiagnostics)
                    bulkCreateRequests.push(...chapterGenerateDiagnostics);
            }
            if (bulkCreateRequests.length > 0) {
                const dbTransactionId = await dataProvider.beginTransaction();
                await dataProvider.executeBatch(bulkCreateRequests, dbTransactionId);
                await dataProvider.commitTransaction(dbTransactionId);
            }
            notify("Generate Diagnostic Test Questions completed", { type: "info" });
        } catch (Error) {
            notify("Error generating diagnostic test questions: " + Error, { type: "error" });
        } finally {
            setLoadingDiagnostic(false)
            hideLoading();
        }
    }

    const GenerateDiagnosticIcon = () => (
        <>
            { loadingDiagnostic ? <CircularProgress size={18} /> : <Timer fontSize="small" />}
        </>
    )

    return (
        <>{ chapterId ?
            <Tooltip title="Generate Diagnostic Test">
                <IconButton size="small" disabled={loadingDiagnostic} onClick={handleGenerateDiagnosticTest}>
                    <GenerateDiagnosticIcon />
                </IconButton>
            </Tooltip> :
            <Button size="small" disabled={loadingDiagnostic} onClick={handleGenerateDiagnosticTest}>
                <GenerateDiagnosticIcon />
                Generate Diagnostic Test
            </Button>
        }</>
    )
}

const ChapterForm = (props: any) => {
    const unique = useUnique();
    return (
        <SimpleForm {...formDefaults(props)}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, columnGap: '1rem', width: '100%' }}>
                <SubjectsReferenceInput source="subject_id">
                    <AutocompleteInput validate={required()} />
                </SubjectsReferenceInput>
                <NumberInput source="chapter_number" validate={required()} />
                <TextInput source="name" validate={[required(), unique()]} />
                <BooleanInput source="is_active" />
                <SimpleFileInput source="questions_attachment_file_id" />
                <SimpleFileField source="questions_attachment_file_id" title={"questions_attachment_file"} />
            </Box>
            <Box sx={{display: "grid", width: "50%", mt: "2rem"}}>
                <ShowQuestionDetails />
            </Box>
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
            <SimpleShowLayout display={'grid'} gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}>
                <SubjectsReferenceField source="subject_id" />
                <TextField source="name" />
                <NumberField source="chapter_number" />
                <BooleanField source="is_active" />
                <ShowQuestionDetails />
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
        recordRepresentation={(r) => r.subject.code + ' ' + r.name }
        filters={filters}
        list={<ChaptersList/>}
        create={<ChapterCreate/>}
        edit={<ChapterEdit/>}
        show={<ChapterShow/>}
        listRowActions={<ChapterRowActions />}
        hasDialog
        hasLiveUpdate
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const ChaptersMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Chapters" leftIcon={<ICON />} />
)