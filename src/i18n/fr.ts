import { TranslationMessages } from 'react-admin';
import frenchMessages from 'ra-language-english'; // NOTE: just to show multilangual support works, replace with 'ra-language-french'

const customFrenchMessages: TranslationMessages = {
    ...frenchMessages,
    resources: {
        activities: {
            name: 'Activities',
        },
        test_round_details: {
            name: 'Test Round Details',
        },
        test_rounds: {
            name: 'Test Rounds',
        },
        revision_round_details: {
            name: 'Revision Round Details',
        },
        revision_rounds: {
            name: 'Revision Rounds',
        },
        diagnostic_test_details: {
            name: 'Diagnostic Test Details',
        },
        diagnostic_tests: {
            name: 'Diagnostic Tests',
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
        // customers: {
        //     name: 'Client |||| Clients',
        //     fields: {
        //         address: 'Rue',
        //         birthday: 'Anniversaire',
        //         city: 'Ville',
        //         stateAbbr: 'Etat',
        //         orders: 'Commandes',
        //         first_name: 'Prénom',
        //         first_seen: 'Première visite',
        //         full_name: 'Nom',
        //         groups: 'Segments',
        //         has_newsletter: 'Abonné à la newsletter',
        //         has_ordered: 'A commandé',
        //         last_name: 'Nom',
        //         last_seen: 'Vu le',
        //         last_seen_gte: 'Vu depuis',
        //         latest_purchase: 'Dernier achat',
        //         name: 'Nom',
        //         total_spent: 'Dépenses',
        //         zipcode: 'Code postal',
        //         password: 'Mot de passe',
        //         confirm_password: 'Confirmez le mot de passe',
        //     },
        //     filters: {
        //         last_visited: 'Dernière visite',
        //         today: "Aujourd'hui",
        //         this_week: 'Cette semaine',
        //         last_week: 'La semaine dernière',
        //         this_month: 'Ce mois-ci',
        //         last_month: 'Le mois dernier',
        //         earlier: 'Plus tôt',
        //         has_ordered: 'A déjà commandé',
        //         has_newsletter: 'Abonné newsletter',
        //         group: 'Segment',
        //     },
        //     fieldGroups: {
        //         identity: 'Identité',
        //         address: 'Adresse',
        //         stats: 'Statistiques',
        //         history: 'Historique',
        //         password: 'Mot de passe',
        //         change_password: 'Changer le mot de passe',
        //     },
        //     page: {
        //         delete: 'Supprimer le client',
        //     },
        //     errors: {
        //         password_mismatch:
        //             'La confirmation du mot de passe est différent du mot de passe.',
        //     },
        //     notifications: {
        //         created: 'Client créé |||| %{smart_count} clients créés',
        //         updated:
        //             'Client mis à jour |||| %{smart_count} clients mis à jour',
        //         deleted:
        //             'Client supprimé |||| %{smart_count} clients supprimés',
        //     },
        // },
    },
};

export default customFrenchMessages;
