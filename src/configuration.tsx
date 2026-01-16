import { getLocalStorage, setLocalStorage, removeLocalStorage, OmniSearchBox } from "@mahaswami/swan-frontend";

import appConfigOptions from '../app_config.json';
export const appTitlePrefix = () => {
    const appTitle = appConfigOptions.title;
    return appTitle;
};

export const canAccess = async (params: any) => {
    //undefined means no override and default behavior based on app_permissions.json configuration
    return undefined;           
}

export const postLogin = async (dataProvider: any, user: any) => {

}    

export const postLogout = () => {
    
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
    return [<OmniSearchBox key="omni-search-box"/>];
}

export const themes = (defaultThemes: any) => {
    return defaultThemes;
}

const STUDENT_SCOPED_RESOURCES = [
    'concept_scores',
    'chapter_diagnostic_tests',
    'concept_revision_rounds',
    'concept_test_rounds',
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
                if (result.data?.user_id !== studentFilter.user_id) {
                    throw new Error('Access denied');
                }
            }
            return result;
        },

        getMany: async (resource: string, params: any) => {
            const result = await dataProvider.getMany(resource, params);
            const studentFilter = getStudentFilter();
            if (studentFilter && STUDENT_SCOPED_RESOURCES.includes(resource)) {
                const validData = result.data.filter((record: any) => record.user_id === studentFilter.user_id);
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
            console.log("DEBUG: locale = " , locale, localVariation);
            return messages[localVariation]
        },
        navigator.language,
        supportedLanguagesList
    );  
}