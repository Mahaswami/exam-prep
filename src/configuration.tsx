import { getLocalStorage, OmniSearchBox, remoteLog, removeLocalStorage, setLocalStorage } from "@mahaswami/swan-frontend";
import { Peak10Logo } from "./components/Peak10Logo";
import { peak10Themes } from './theme/peak10Theme';
import { createStudentLoginActivity } from "./logic/activities";
import appConfigOptions from '../app_config.json';
export const appTitlePrefix = () => {
    const appTitle = appConfigOptions.title;
    return appTitle;
};

export const canAccess = async (params: any) => {
    //undefined means no override and default behavior based on app_permissions.json configuration
    return undefined;           
}

const checkIsStudentHasDiagnosticTest = async (dataProvider: any, user: any) => {
    try {
        let hasDiagnosticTest = false;
        const { data: diagnosticTests } = await dataProvider.getList('diagnostic_tests', {
            filter: {
                user_id: user.id,
                status: 'completed'
            }
        });
        if (diagnosticTests.length > 0) {
            hasDiagnosticTest = true;
        }
        setLocalStorage("has_diagnostic_test", hasDiagnosticTest);
    } catch (error) {
        console.log("Error checking if student has diagnostic test: ", error);
        remoteLog("Error checking if student has diagnostic test: ", error);
    }
}

export const hasDiagnosticTests = () => {
    return getLocalStorage("has_diagnostic_test") === true;
}

export const postLogin = async (dataProvider: any, user: any) => {
    if (user.role === 'student') {
        // Create student login activity.
        await createStudentLoginActivity(dataProvider, user);
        // Check if student has diagnostic test to hide menus (Revision, Test, Concept scores)
        await checkIsStudentHasDiagnosticTest(dataProvider, user);
    }
}    

export const postLogout = () => {
    if (getLocalStorage('role') === 'student') {
        removeLocalStorage("has_diagnostic_test");
    }
}    

export const customLogoBox = (_permissions: any, _isHorizontalLayout: boolean) => {
    return <Peak10Logo variant="dark" size="small" />;
}

export const customAppTitle = (permissions: any, isHorizontalLayout: boolean) => {
    return <></>;
}
/*
export const customHistoryLogger = async (resource: any, params : any, type: string) => {
    //do custom history logging here
}

export const customLogoBox = (permissions: any, isHorizontalLayout: boolean) => {
    return <span>Your Logo</span>;
}

export const customAppTitle = (permissions: any, isHorizontalLayout: boolean) => {
    return <span>Your Title</span>;
}
   
import { Layout} from "ra-ui-materialui";

//NOTE: Returning Layout only for demo. Our framework layout is more advanced. 
export const customLayout = (permissions: any) => {
    console.log("customLayout called "+  permissions);
    return Layout;
}
    
*/

export const queryClientConfig = (config: any) => {
    config = {
        defaultOptions: {
            queries: {
                staleTime: 0,                 
            },
        },
    };
    return config;
}

export const configureUserMenus = (permissions: any) => {
    return []
}

export const configureToolbarActions = (permissions: any) => {
    return [
        <OmniSearchBox key="omni-search-box"/>,
        <AskSupport/>
    ];
}

export const themes = (defaultThemes: any) => {
    return [...defaultThemes, peak10Themes];
}

const STUDENT_SCOPED_RESOURCES = [
    'concept_scores',
    'diagnostic_tests',
    'revision_rounds',
    'test_rounds',
    'activities',
];

const getStudentFilter = (): { user_id: string } | null => {
    const role = getLocalStorage('role');
    if (role !== 'student') return null;
    try {
        const user = JSON.parse(getLocalStorage('user') || '{}');
        return user.id ? { user_id: user.id } : null;
    } catch {
        return null;
    }
};

export const wrapCustomDataProvider = (queryClient: any, dataProvider: any) => {
    return {
        ...dataProvider,

        getList: (resource: string, params: any) => {
            const studentFilter = getStudentFilter();
            if (studentFilter && STUDENT_SCOPED_RESOURCES.includes(resource)) {
                params = { ...params, filter: { ...params.filter, ...studentFilter } };
            }
            return dataProvider.getList(resource, params);
        },

        getOne: async (resource: string, params: any) => {
            const result = await dataProvider.getOne(resource, params);
            const studentFilter = getStudentFilter();
            if (studentFilter && STUDENT_SCOPED_RESOURCES.includes(resource)) {
                if (String(result.data?.user_id) !== String(studentFilter.user_id)) {
                    throw new Error('Access denied');
                }
            }
            return result;
        },

        getMany: async (resource: string, params: any) => {
            const result = await dataProvider.getMany(resource, params);
            const studentFilter = getStudentFilter();
            if (studentFilter && STUDENT_SCOPED_RESOURCES.includes(resource)) {
                const validData = result.data.filter((record: any) => String(record.user_id) === String(studentFilter.user_id));
                if (validData.length !== result.data.length) {
                    throw new Error('Access denied');
                }
                return { ...result, data: validData };
            }
            return result;
        },

        getManyReference: (resource: string, params: any) => {
            const studentFilter = getStudentFilter();
            if (studentFilter && STUDENT_SCOPED_RESOURCES.includes(resource)) {
                params = { ...params, filter: { ...params.filter, ...studentFilter } };
            }
            return dataProvider.getManyReference(resource, params);
        },
    };
}

import polyglotI18nProvider from 'ra-i18n-polyglot';
import englishMessages from './i18n/en';
import frenchMessages from './i18n/fr';
import { AskSupport } from "./components/SupportMenuItem";

const messages = {
    // fr: frenchMessages,
    en: englishMessages,
} as any;

export const customizeI18nProvider = () => {
    const supportedLanguagesList = [
            { locale: 'en', name: 'English', key: 'en' },
            // { locale: 'fr', name: 'Français', key: 'fr' },
        ]
    if (navigator.language.startsWith('en-') || navigator.language === 'en' ) {
        supportedLanguagesList[0].locale = navigator.language;
    } 
    return polyglotI18nProvider(
        (locale: string) => {
            let localVariation = locale
            if (navigator.language.startsWith('en-') ) {
                localVariation = 'en';
            } 
            return messages[localVariation]
        },
        navigator.language,
        supportedLanguagesList
    );  
}