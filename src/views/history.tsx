import { History, ImportContacts } from '@mui/icons-material';
import { Avatar, Box, Typography } from '@mui/material';
import {
    DataTable,
    FieldProps,
    List, Menu,
    RecordRepresentation,
    ReferenceField,
    ReferenceFieldClasses,
    SelectField,
    ShowBase,
    TextField,
    useRecordContext,
    useResourceDefinitions,
    WithRecord,
    type ListProps
} from "react-admin";
import { Link } from 'react-router-dom';
import ReferenceIcon from '@mui/icons-material/FileCopy';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import React, { useCallback, useMemo } from 'react';
import { DateLiveFilter, ReferenceLiveFilter, 
    Resource, showDefaults, tableDefaults, RelativeDateField, humanize,
    TextLiveFilter, isEnhancedSecurityModuleActive, listDefaults, 
    ChoicesLiveFilter, HistoryRepresentationViewer, HistoryLogType
 } from '@mahaswami/swan-frontend';

export const RESOURCE = "history"
export const ICON = History
export const typeChoices = [{ id: 'Create', name: 'Create' }, { id: 'Update', name: 'Update' }, { id: 'View', name: 'View' }, { id: 'Delete', name: 'Delete' }, { id: 'List', name: 'List' }];

const filters = [
    <TextLiveFilter source="search" placeholder="Search" show />,
    <DateLiveFilter source="timestamp" label="Timestamp" show />,
    <ResourceFilter source="name_of_resource" label="Resource" show icon={<ReferenceIcon />} />,
    <ChoicesLiveFilter source="type" label="Activity" choiceLabels={typeChoices} show />,
    <ReferenceLiveFilter source="user_id" reference="users" show label="User" optionText={UserOptionText} />,
    <LocationFilter source="location" label="Location" show />
]

export const HistoryList = (props: ListProps) => {
    return (
        <List 
            {...listDefaults(props)} 
            sort={{ field: 'timestamp', order: 'DESC' }} 
            sx={{ "& .sidebar-filter": { mt: "0.85rem"}}}
        >
            <DataTable {...tableDefaults(RESOURCE)}>
                <DataTable.Col source='timestamp' field={RelativeDateField}/>
                <DataTable.Col 
                    source="representation_name" 
                    label="Link" 
                    field={(props: any) => (
                        <RepresentationField 
                            {...props} 
                            link={(record) => {
                                if (record.type === "List") {
                                    return `/${record.name_of_resource}`
                                }
                                return `/${record.name_of_resource}/${record.id_of_resource}/show`
                            }}
                        />
                    )}
                />
                <DataTable.Col source="type" label="Activity" field={(props: any) => <SelectField {...props} choices={typeChoices} />}/>
                <DataTable.Col source="user_id" field={(props: any) =>
                    <ReferenceField {...props} reference="users" link={false}
                        render={({ referenceRecord }) => UserOptionText(referenceRecord)} />}
                />
                {isEnhancedSecurityModuleActive() && (
                    <>
                        <DataTable.Col source="location" label="Location" />
                        <DataTable.Col source="ip_address" label="Ip Address" />
                    </>
                )}
            </DataTable>
        </List>
    )
}

const HistoryShow = (props: any) => {
    return (
        <ShowBase {...showDefaults(props)}>
            <Box sx={{ 
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "absolute",
                top: "1rem",
                left: "50%",
                transform: "translate(-50%)"
            }}>
                <WithRecord render={(record) => <HistoryShowTitle record={record} />}/>
            </Box>
            <HistoryRepresentationViewer enablePrevNextButtons/>
        </ShowBase>
    )
}

export const HistoryResource =  (
    <Resource
        name={RESOURCE}
        icon={ICON}
        list={<HistoryList />}
        show={<HistoryShow title={<></>}/>}
        hasHistory={false}
        fieldSchema={{
            name_of_resource: { type: 'string' },
            id_of_resource: { type: 'string' },
            user_id: { resource: 'users' },
            type: { type: 'choice', choices: typeChoices },
            data: { type: 'json' },
            previous_data: { type: 'json' },
            timestamp: { type: 'datetime' },
            location: { type: 'string' },
            ip_address: { type: 'string' },
        }}
        filters={filters}
        filtersPlacement='left'
        hasDialog
        // {{SWAN:RESOURCE_OPTIONS}}        
    />
)
export const HistoryMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="History" leftIcon={<ICON />} />
)

export const HistoryShowTitle = ({ record }: { record: any }) => (
    <Box sx={{ display: "flex", gap: "0.5rem", alignItems: "center"}}>
        <Typography variant="h6">
            {humanize(getPastOfActivity(record?.type))}
        </Typography>
        <Typography variant='h6'>
            by
        </Typography>
        <ReferenceField
            record={record}
            source="user_id"
            reference="users"
            link={false}
        >
            <TextField source="fullName" variant='h6'/>
        </ReferenceField>
        
        <RelativeDateField
            record={record}
            source="timestamp"
            sx={{ mt: "0.1rem"}}
            showTooltip={false}
            color='inherit'
        />
    </Box>

)

function getPastOfActivity(type: string)     {
    switch (type) {
        case "Create":
            return "Created";
        case "Update":
            return "Updated";
        case "View":
            return "Viewed";
        case "Delete":
            return "Deleted";
        default:
            return type;
    }
}


const RepresentationField = (props: FieldProps & { 
    link: string | ((record: any) => string),
    label: string
}) => {
    const record = useRecordContext(props);
    if (!record) {
        return null;
    }

    const link = typeof props.link === 'function' ? props.link(record) : props.link;
    const resourceData = record.data && JSON.parse(record.data);

    if (!link || link.includes("null")) {
        return null;
    }

    return (
        <Link
            to={link}
            className={ReferenceFieldClasses.link}
            onClick={e => e.stopPropagation()}
            state={{ _scrollToTop: true }}
            {...props}
        >   
            {humanize(record.name_of_resource)}{' '}
            {resourceData && (
                <RecordRepresentation record={resourceData} resource={record.name_of_resource} />
            )}
        </Link>
    )
}

function ResourceFilter(props: any) {
    
    const isTopFilter = props.placement === 'top';
    const resourceDefinitions = useResourceDefinitions() as any;

    const getResourceIcon = useCallback(
        (resourceName: string): React.ReactNode => {
            const icon = resourceDefinitions[resourceName]?.icon;
            if (React.isValidElement(icon)) {
                return icon;
            }
            if (icon) {
                const IconComponent = icon;
                return <IconComponent fontSize="small"/>;
            }
            return <ImportContacts />;
        },
        [resourceDefinitions]
    );

    const resourceChoices = useMemo(() => 
        Object.keys(resourceDefinitions)
            .filter((resource) => resourceDefinitions[resource].hasHistory)
            .map((resource) => ({
                id: resource, 
                name: isTopFilter 
                    ? resource 
                    : ( 
                        <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {getResourceIcon(resource)}{humanize(resource)}
                        </Box>
                    )
            }))
        , 
        [resourceDefinitions]
    );

    return (
        <ChoicesLiveFilter 
            {...props} 
            choiceLabels={resourceChoices} 
            optionText={(choice: any) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {getResourceIcon(choice.name)}{humanize(choice.name)}
                </Box>
            )} 
        />
    )
}

function UserOptionText(record: any) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Avatar
                src={record?.image_file_id?.[0]?.src}
                sx={{ 
                    width: "1.3rem", 
                    height: "1.3rem", 
                    "& .avatar-initials": { fontSize: "0.8em" }
                }}
            >
                <span className="avatar-initials">{record?.fullName?.[0]?.toUpperCase()} </span>
            </Avatar>
            <Typography variant="body2" fontWeight={500}>
                {record?.fullName}
            </Typography>
        </Box>
    )
}

function LocationFilter(props: any) {
    const hasEnhancedSecurity = isEnhancedSecurityModuleActive();
    if (!hasEnhancedSecurity) {
        return null;
    }

    return (
        <ChoicesLiveFilter icon={<LocationOnIcon />} {...props} />
    )
}

