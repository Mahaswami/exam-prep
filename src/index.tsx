import './peak10-global.css';
import React from "react";
import ReactDOM from "react-dom/client";

// service callbacks start
import { appTitlePrefix } from "./configuration";
import { postLogout, postLogin, canAccess } from './configuration';
import { configureResources, configureMenus, configureLandingPage } from './resources';
import { businessLogic } from "./businessLogic";
import { queryClientConfig } from "./configuration";
import { configureUserMenus } from "./configuration";
import { configureToolbarActions } from "./configuration";
import { themes } from "./configuration";
import { wrapCustomDataProvider } from "./configuration";
import { customizeI18nProvider } from "./configuration";
//import {customHistoryLogger} from "./configuration";
import { customLogoBox } from "./configuration";
import { customAppTitle } from "./configuration";
//import { customLayout } from "./configuration";

const appFunctions = {
    appTitlePrefix,
    postLogout,
    postLogin,
    canAccess,
    configureResources, 
    configureMenus,
    configureLandingPage,
    businessLogic,
    queryClientConfig,
    configureUserMenus,
    configureToolbarActions,
    themes,
    wrapCustomDataProvider,
    customizeI18nProvider,
    //customHistoryLogger,
    customLogoBox,
    customAppTitle,
    //customLayout
}

window.swanAppFunctions = appFunctions;
// service callbacks end

import { initService, remoteLog } from "@mahaswami/swan-frontend";
import appConfigOptions from '../app_config.json';
import appPermissions from '../app_permissions.json';

const devEnv = import.meta.env.VITE_APP_ENV;
const devDataServiceProvider = import.meta.env.VITE_DATA_SERVICE_PROVIDER;
const devDataServiceSpreadsheetId = import.meta.env.VITE_DATA_SERVICE_SPREADSHEET;

initService(import.meta.env,  devDataServiceProvider, devDataServiceSpreadsheetId, appConfigOptions, appPermissions);

import { App } from "@mahaswami/swan-frontend";

import {ReactFromModule} from "@mahaswami/swan-frontend";
console.log("DEBUG: React same?")
console.log(React === ReactFromModule) //false

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
