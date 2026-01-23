import { TranslationMessages } from 'react-admin';
import {englishMessages} from '@mahaswami/swan-frontend'

const customEnglishMessages: TranslationMessages = {
    ...englishMessages,
    resources: {
        activities: {
            name: 'Activities',
        },
        test_round_details: {
            name: 'Test Round Details',
        },
        test_rounds: {
            name: 'Test Rounds',
            action: {
                create: 'Test Round',
            }
        },
        revision_round_details: {
            name: 'Revision Round Details',
        },
        revision_rounds: {
            name: 'Revision Rounds',
              action: {
                create: 'Revision Round',
            }
        },
        diagnostic_test_details: {
            name: 'Diagnostic Test Details',
        },
        diagnostic_tests: {
            name: 'Diagnostic Tests',
            action: {
                create: 'Take New Diagnostic Test',
            }
        },
        concept_scores: {
            name: 'Concept Scores',
        },
        payments: {
            name: 'Payments',
        },
        chapter_diagnostic_questions: {
            name: 'Chapter Diagnostic Questions',
        },
        questions: {
            name: 'Questions',
        },
        concepts: {
            name: 'Concepts',
        },
        chapters: {
            name: 'Chapters',
        },
        subjects: {
            name: 'Subjects',
        },
        session_records: {
            name: 'Session Records',
        },
        users: {
            name: 'Users',
        },
        settings: {
            name: 'Settings',
        },            
        // customers: {
        //     name: 'Customer |||| Customers',
        //     fields: {
        //         orders: 'Orders',
        //         first_seen: 'First seen',
        //         full_name: 'Name',
        //         groups: 'Segments',
        //         last_seen: 'Last seen',
        //         last_seen_gte: 'Visited Since',
        //         name: 'Name',
        //         total_spent: 'Total spent',
        //         password: 'Password',
        //         confirm_password: 'Confirm password',
        //         stateAbbr: 'State',
        //     },
        //     filters: {
        //         last_visited: 'Last visited',
        //         today: 'Today',
        //         this_week: 'This week',
        //         last_week: 'Last week',
        //         this_month: 'This month',
        //         last_month: 'Last month',
        //         earlier: 'Earlier',
        //         has_ordered: 'Has ordered',
        //         has_newsletter: 'Has newsletter',
        //         group: 'Segment',
        //     },
        //     fieldGroups: {
        //         identity: 'Identity',
        //         address: 'Address',
        //         stats: 'Stats',
        //         history: 'History',
        //         password: 'Password',
        //         change_password: 'Change Password',
        //     },
        //     page: {
        //         delete: 'Delete Customer',
        //     },
        //     errors: {
        //         password_mismatch:
        //             'The password confirmation is not the same as the password.',
        //     },
        //     notifications: {
        //         created:
        //             'Customer created |||| %{smart_count} customers created',
        //         updated:
        //             'Customer updated |||| %{smart_count} customers updated',
        //         deleted:
        //             'Customer deleted |||| %{smart_count} customers deleted',
        //     },
        // },
    },
};

export default customEnglishMessages;
