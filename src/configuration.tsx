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

export const wrapCustomDataProvider = (queryClient: any, dataProvider: any) => {
    return dataProvider;
}

import polyglotI18nProvider from 'ra-i18n-polyglot';
import englishMessages from './i18n/en';
import frenchMessages from './i18n/fr';

const messages = {
    fr: frenchMessages,
    en: englishMessages,
} as any;

export const customizeI18nProvider = () => {
    const supportedLanguagesList = [
            { locale: 'en', name: 'English', key: 'en' },
            { locale: 'fr', name: 'Français', key: 'fr' },
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