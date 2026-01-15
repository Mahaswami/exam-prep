import { Resource, createDefaults, tableDefaults, 
	editDefaults, formDefaults, listDefaults, 
	showDefaults, RowActions, CardGrid,
	createReferenceField,
	createReferenceInput, MoneyField, MoneyInput, ReferenceLiveFilter, MoneyLiveFilter, ChoicesLiveFilter, DateLiveFilter, recordRep  } from '@mahaswami/swan-frontend';
import { Payment } from '@mui/icons-material';
import { Box, CardContent, CardHeader } from '@mui/material';
import { Create, DataTable, Edit, List, Menu, Show, SimpleForm, SimpleShowLayout, 
    TextField, TextInput, type ListProps, DateField, DateInput, DateTimeInput, SelectField, SelectInput, AutocompleteInput, required } from "react-admin";
import { UsersReferenceField, UsersReferenceInput } from './users';

export const RESOURCE = "payments"
export const ICON = Payment
export const PREFETCH: string[] = ["users"]

export const PaymentsReferenceField = createReferenceField(RESOURCE, PREFETCH);
export const PaymentsReferenceInput = createReferenceInput(RESOURCE, PREFETCH);
export const paymentStatusChoices = [{ id: 'pending', name: 'Pending' }, { id: 'completed', name: 'Completed' }, { id: 'failed', name: 'Failed' }, { id: 'refunded', name: 'Refunded' }];

const filters = [
    <ReferenceLiveFilter source="user_id" reference="users" label="User" />,
    <MoneyLiveFilter source="payment_amount" label="Payment" currency="INR" />,
    <ChoicesLiveFilter source="payment_status" label="Payment Status" choiceLabels={paymentStatusChoices} />,
    <DateLiveFilter source="payment_timestamp" label="Payment Timestamp" />
]

export const PaymentsList = (props: ListProps) => {
    return (
        <List {...listDefaults(props)}>
            <DataTable {...tableDefaults(RESOURCE)}>
                <DataTable.Col source="user_id" field={UsersReferenceField}/>
                <DataTable.Col source="razorpay_payment_no" />
                <DataTable.Col source="razorpay_order_no" />
                <DataTable.Col source="payment_amount" field={(props: any) => <MoneyField {...props} currency="INR" />}/>
                <DataTable.Col source="payment_status" field={(props: any) => <SelectField {...props} choices={paymentStatusChoices} />}/>
                <RowActions/>
            </DataTable>
        </List>
    )
}


export const PaymentsCardGrid = (props: ListProps) => {
    return (
        <List {...listDefaults(props)} component={'div'}>
            <CardGrid title={<UsersReferenceField source="user_id" variant='h6' />}>
                <DataTable.Col source="razorpay_payment_no" />
                <DataTable.Col source="razorpay_order_no" />
            </CardGrid>
        </List>
    )
}

const PaymentForm = (props: any) => {
    return (
        <SimpleForm {...formDefaults(props)}
            display="grid"
            gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
            gap="1rem">
            <UsersReferenceInput source="user_id">
                <AutocompleteInput validate={required()} />
            </UsersReferenceInput>
            <TextInput source="razorpay_payment_no" />
            <TextInput source="razorpay_order_no" />
            <MoneyInput source="payment_amount" currency="INR" validate={required()} />
            <SelectInput source="payment_status" choices={paymentStatusChoices} validate={required()} />
            <DateTimeInput source="payment_timestamp" />
        </SimpleForm>
    )
}

const PaymentEdit = (props: any) => {
    return (
        <Edit {...editDefaults(props)}>
            <PaymentForm />
        </Edit>
    )
}

const PaymentCreate = (props: any) => {
    return (
    	<Create {...createDefaults(props)}>
            <PaymentForm />
        </Create>
    )
}

const PaymentShow = (props: any) => {
    
    return (
        <Show {...showDefaults(props)}>
            <SimpleShowLayout
                display="grid"
                gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
                gap="1rem">
                <UsersReferenceField source="user_id" />
                <DataTable.Col source="razorpay_payment_no" />
                <DataTable.Col source="razorpay_order_no" />
                <MoneyField source="payment_amount" currency="INR" />
                <SelectField source="payment_status" choices={paymentStatusChoices} />
                <DateField source="payment_timestamp" showTime />
            </SimpleShowLayout>
        </Show>
    )
}


export const PaymentsResource =  (
    <Resource
        name={RESOURCE}
        icon={ICON}
        prefetch={PREFETCH}
        recordRepresentation={(record: any) => recordRep('users', record.user)}
        fieldSchema={{
            user_id: { required: true, resource: 'users' },
            razorpay_payment_no: {  },
            razorpay_order_no: {  },
            payment_amount: { type: 'money', currency: 'USD', required: true },
            payment_status: { type: 'choice', ui: 'select', required: true, choices: paymentStatusChoices },
            payment_timestamp: {}
        }}
        filters={filters}
        list={<PaymentsList/>}
        // create={<PaymentCreate/>}
        // edit={<PaymentEdit/>}
        show={<PaymentShow/>}
        hasDialog
        hasLiveUpdate
        hasImport
        // {{SWAN:RESOURCE_OPTIONS}}
    />
)
export const PaymentsMenu = () => (
    <Menu.Item to={`/${RESOURCE}`} primaryText="Payments" leftIcon={<ICON />} />
)