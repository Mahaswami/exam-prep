import { People, ViewList } from '@mui/icons-material';
import { Box, Avatar as MuiAvatar } from '@mui/material';
import {
    Create,
    CreateProps,
    DataTable,
    Edit,
    EditProps,
    List,
    Menu,
    Show,
    ShowProps,
    SimpleForm,
    SimpleFormProps,
    SimpleShowLayout,
    TextField,
    TextInput,
    type ListProps,
    DateField,
    DateInput,
    BooleanField,
    BooleanInput,
    NumberField,
    SelectField,
    SelectInput,
    required,
    useUnique,
    AutocompleteInput,
    ReferenceInput, ReferenceField,
    useRecordContext
} from "react-admin";
import {
    createDefaults,
    editDefaults,
    formDefaults,
    listDefaults,
    showDefaults,
    tableDefaults,
    Resource,
    RowActions,
    TabbedDetailLayout,
    CardGrid,
    DateLiveFilter,
    TextLiveFilter,
    ReferenceLiveFilter,
    createReferenceField,
    createReferenceInput,
    recordRep, getLocalStorage,
    ChoicesLiveFilter,
    BooleanLiveFilter,
    eventBus,
} from '@mahaswami/swan-frontend';

export const RESOURCE = "users"
export const DETAIL_RESOURCES = ["session_records"]
export const ICON = People
export const DETAIL_ICONS = [ViewList]
export const PREFETCH: string[] = []
export const DETAIL_PREFETCH = [[RESOURCE]]

export const UsersReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const UsersReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const SessionRecordsReferenceField = createReferenceField(DETAIL_RESOURCES[0], DETAIL_PREFETCH[0]);
export const SessionRecordsReferenceInput = createReferenceInput(DETAIL_RESOURCES[0], DETAIL_PREFETCH[0]);
let roleChoices = [] as any
eventBus.on("app_loaded", () => {
    roleChoices = getRoleChoices();
});
export const getRoleChoices = () => {
    if (!window.appPermissions) {
        return [];
    }
    const choices = [] as any[];
    const keys = Object.keys(window.appPermissions.roles);
    keys.sort();

    keys.forEach(role => {
        const value = window.appPermissions.roles[role];
        if (getLocalStorage('role')  === 'super_admin') {
            choices.push({ id: role, name: value.name });
        } else {
            if ( role != 'super_admin' ) {
                choices.push({ id: role, name: value.name });
            }
        }
    })
    return choices;
};
const filters = [
    <TextLiveFilter source="search" fields={["first_name", "last_name", "email"]} show/>,
    <ChoicesLiveFilter source="role" label="Role" />,
    <BooleanLiveFilter source="is_active" label="Active" />,
    <DateLiveFilter source="creation_date" label="Creation" />,
    <DateLiveFilter source="last_login_date" label="Last Login" />
]

export const UsersList = (props: ListProps) => {
    const isSuperAdmin = getLocalStorage('role') === 'super_admin';
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(props)}>
                <DataTable.Col source='image_file_id' label="Profile" field={ProfileField} />
                <DataTable.Col source="email" />
                <DataTable.Col source="is_active" field={BooleanField}/>
                <DataTable.Col source="last_login_date" field={DateField}/>
                {isSuperAdmin && (
                    <DataTable.Col source="tenant.name" />
                )}
                <DataTable.Col source="role" field={(props: any) => <SelectField {...props} choices={roleChoices} />}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}

export const ProfileField = (props: {
    source: string;
    record?: any;
    width?: number;
    height?: number;
    title?: string;
}) => {
    const record = useRecordContext<any>({ record: props.record });
    let sourceURL = record?.[props.source]?.[0]?.src;

    if (!record) {
        return null;
    }

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <MuiAvatar
                src={sourceURL ?? undefined}
                sx={{
                    width: props.width,
                    height: props.height,
                    fontSize: props.height ? '0.6rem' : undefined,
                }}
                title={props.title}
            >
                {record.first_name?.charAt(0).toUpperCase()}
                {record.last_name?.charAt(0).toUpperCase()}
            </MuiAvatar>
            {record.first_name} {record.last_name}
        </Box>
    );
};



export const UsersCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<TextField source="first_name" variant='h6' />}>
                <TextField source="last_name" />
                <TextField source="email" />
            </CardGrid>
        </List>
    )
}

const DetailResources = (props: any) => (
    <TabbedDetailLayout {...props}>
        <SessionRecordsList resource={DETAIL_RESOURCES[0]}/>
    </TabbedDetailLayout> 
)

const UserForm = (props: Omit<SimpleFormProps, "children">) => {
    const isSuperAdmin = getLocalStorage('role') === 'super_admin';
    const unique = useUnique();
    return (
        <SimpleForm {...formDefaults(props)}>
            <Box width="100%" display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap="1rem">
                <TextInput source="first_name" validate={required()} />
                <TextInput source="last_name" validate={required()} />
                <TextInput source="email" autoComplete="off"  validate={[required(), unique()]} />
                <TextInput source="mobile_number" />
                <BooleanInput source="is_active" />
                {isSuperAdmin && (
                    <ReferenceInput perPage={1000}  sort={{ field: 'name', order: 'ASC' }} label="Tenant" source="tenant_id" reference="tenants">
                        <AutocompleteInput optionText="name" validate={[required()]}/>
                    </ReferenceInput>
                )}
                <SelectInput source="role" choices={getRoleChoices()} validate={[required()]} />
            </Box>
        </SimpleForm>
    );
};

const UserCreate = (props: CreateProps) => {
    return (
        <Create {...createDefaults(props)}>
            <UserForm />
        </Create>
    );
};

const UserEdit = (props: EditProps) => {
    return (
        <Edit {...editDefaults(props)}>
            <UserForm/>
        </Edit>
    );
};

const UserShow = (props: ShowProps) => {
    const isSuperAdmin = getLocalStorage('role')  === 'super_admin';
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout
                display="grid"
                gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
                gap="1rem">
                <TextField source="first_name" />
                <TextField source="last_name" />
                <TextField source="email" />
                <TextField source="mobile_number" />
                <DateField source="last_login_date" />
                <BooleanField source="is_active" />
                <DateField source="creation_date" />
                <TextField source="creation_location" />
                <NumberField source="failed_login_attempts" />
                {isSuperAdmin && (
                    <ReferenceField label="Tenant" source="tenant_id" reference="tenants" />
                )}
                <SelectField source="role" choices={roleChoices} />
            </SimpleShowLayout>
            <DetailResources/>
        </Show>
    );
};

const detail0Filters = [
    <TextLiveFilter source="search" fields={["ip_address", "location"]} />,
    <ReferenceLiveFilter source="user_id" reference="users" label="User" />,
    <DateLiveFilter source="sign_in_date" label="Sign In" />
]

const SessionRecordForm = (props: any) => {
    return (
        <SimpleForm {...formDefaults(props)}>
            <DateInput source="sign_in_date" />
            <TextInput source="ip_address" />
            <TextInput source="location" />
        </SimpleForm>
    )
}

export const SessionRecordsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(props)}>
                <DataTable.Col source="sign_in_date" field={DateField}/>
                <DataTable.Col source="ip_address" />
                <DataTable.Col source="location" />
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const SessionRecordsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<UsersReferenceField source="user_id" variant='h6' />}>
                <DateField source="sign_in_date" />
                <TextField source="ip_address" />
            </CardGrid>
        </List>
    )
}

const SessionRecordCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <SessionRecordForm />
        </Create>
    )
}

const SessionRecordEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <SessionRecordForm />
        </Edit>
    )
}

const SessionRecordShow = (props: any) => {
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout>
                <DateField source="sign_in_date" />
                <TextField source="ip_address" />
                <TextField source="location" />
            </SimpleShowLayout>
        </Show>
    )
}

export const UsersResource = (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        recordRepresentation={(record: any) => record.first_name}
        fieldSchema={{
            first_name: { required: true },
            last_name: { required: true },
            email: { required: true, unique: true },
            mobile_number: {},
            role: { type: 'choice', ui: 'select', choices: roleChoices },
            is_active: {},
            creation_date: {},
            last_login_date: {},
            failed_login_attempts: {},
            creation_ip_address: {},
            creation_location: {},
            image_file_id: {}
        }}
        filters={filters}
        list={<UsersList/>}
        create={<UserCreate/>}
        edit={<UserEdit/>}
        show={<UserShow/>}
        filtersPlacement="top"
        hasDialog
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)

export const SessionRecordsResource = (
    <Resource
        name={DETAIL_RESOURCES[0]}
        icon={DETAIL_ICONS[0]}
        prefetch={DETAIL_PREFETCH[0]}
        recordRepresentation={(record: any) => `${recordRep(RESOURCE, record.user)} ${recordRep('users', record.user)}`}
        fieldSchema={{
            user_id: { resource: 'users' },
            sign_in_date: {},
            ip_address: {},
            location: {}
        }}
        filters={detail0Filters}
        list={<SessionRecordsList/>}
        create={<SessionRecordCreate/>}
        edit={<SessionRecordEdit/>}
        show={<SessionRecordShow/>}
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)

export const UsersMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Users" leftIcon={<ICON />} />
);

export const SessionRecordsMenu = () => (
    <Menu.Item to={`/${DETAIL_RESOURCES[0]}`} primaryText="Session Records" leftIcon={<ViewList />} />
);