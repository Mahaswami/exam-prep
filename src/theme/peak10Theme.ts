import { createTheme, ThemeOptions } from '@mui/material/styles';

// Brand colors
const colors = {
    navy: '#2E3A59',
    navyLight: '#596586',
    navyDark: '#1A2133',
    green: '#34A853',
    greenHover: '#2d9249',
    greenDark: '#206830',
    lightBg: '#F4F7F6',
    textSecondary: '#64748B',
};

// Shared component overrides (mode-agnostic)
const sharedComponents: ThemeOptions['components'] = {
    MuiAutocomplete: {
        defaultProps: {
            fullWidth: true,
        },
    },
    MuiLink: {
        styleOverrides: {
            root: {
                textDecoration: 'none',
                '&:hover': {
                    textDecoration: 'underline',
                },
            },
        },
    },
    MuiBackdrop: {
        styleOverrides: {
            root: {
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(2px)',
                '&.MuiBackdrop-invisible': {
                    backgroundColor: 'transparent',
                    backdropFilter: 'blur(2px)',
                },
            },
        },
    },
    MuiButton: {
        styleOverrides: {
            root: {
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': {
                    boxShadow: 'none',
                },
            },
            contained: {
                backgroundColor: colors.green,
                color: '#fff',
                '&:hover': {
                    backgroundColor: colors.greenHover,
                },
                '&.Mui-disabled': {
                    backgroundColor: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.26)',
                },
            },
            containedPrimary: {
                backgroundColor: colors.green,
                '&:hover': {
                    backgroundColor: colors.greenHover,
                },
            },
            outlined: {
                '&.Mui-disabled': {
                    borderColor: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.26)',
                },
            },
            text: {
                '&.Mui-disabled': {
                    color: 'rgba(0, 0, 0, 0.26)',
                },
            },
        },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: 16,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
        },
    },
    MuiTextField: {
        defaultProps: {
            variant: 'outlined',
            fullWidth: true,
            size: 'small',
        },
    },
    MuiFormControl: {
        defaultProps: {
            margin: 'dense',
            fullWidth: true,
            size: 'small',
        },
    },
    MuiTableRow: {
        styleOverrides: {
            root: {
                '&:last-child td': { border: 0 },
            },
        },
    },
    MuiTableCell: {
        styleOverrides: {
            root: {
                padding: '1rem',
                '&.MuiTableCell-sizeSmall': {
                    padding: '0.75rem',
                },
                '&.MuiTableCell-paddingNone': {
                    padding: '0.25rem',
                },
            },
        },
    },
    RaSimpleFormIterator: {
        defaultProps: {
            fullWidth: true,
        },
    },
    RaTranslatableInputs: {
        defaultProps: {
            fullWidth: true,
        },
    },
    RaBulkActionsToolbar: {
        styleOverrides: {
            toolbar: {
                zIndex: 10,
            },
        },
    },
};

// Typography (shared)
const typography: ThemeOptions['typography'] = {
    fontFamily: "'Montserrat', sans-serif",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
};

// Light theme
const lightPalette: ThemeOptions['palette'] = {
    mode: 'light',
    primary: { main: colors.navy, light: colors.navyLight, dark: colors.navyDark },
    secondary: { main: colors.green, dark: colors.greenDark },
    background: { default: colors.lightBg, paper: '#FFFFFF' },
    text: { primary: colors.navy, secondary: colors.textSecondary },
};

const lightComponents: ThemeOptions['components'] = {
    ...sharedComponents,
    RaDataTable: {
        styleOverrides: {
            root: {
                '& .RaDataTable-headerCell': {
                    color: colors.navy,
                    fontWeight: 600,
                },
            },
        },
    },
    MuiAppBar: {
        styleOverrides: {
            root: {
                backgroundColor: colors.navy,
                color: '#fff',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                // Override React Admin gradient
                '& .RaAppBar-toolbar': {
                    background: colors.navy,
                    backgroundImage: 'none',
                },
            },
        },
    },
    MuiDrawer: {
        styleOverrides: {
            paper: {
                backgroundColor: colors.lightBg,
                color: colors.navy,
                borderRight: '1px solid #e0e0e0',
            },
        },
    },
    MuiCssBaseline: {
        styleOverrides: {
            body: {
                fontFamily: "'Montserrat', sans-serif",
            },
            '.RaLayout-content': {
                background: colors.lightBg,
            },
            // DataTable styling
            '.RaDataTable-row:nth-of-type(odd)': {
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
            },
            '.RaDataTable-row:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04) !important',
            },
            // Sidebar menu items
            '.RaMenuItemLink': {
                color: colors.navy,
                borderRadius: '0 0.5rem 0.5rem 0',
                margin: '0.125rem 0.5rem 0.125rem 0',
                paddingLeft: '1rem',
            },
            '.RaMenuItemLink:hover': {
                background: 'rgba(46, 58, 89, 0.08)',
            },
            // Selected menu item
            '.RaMenuItemLink-active, a.RaMenuItemLink-active': {
                background: '#fff !important',
                color: `${colors.navy} !important`,
                borderLeft: `4px solid ${colors.green} !important`,
                paddingLeft: '0.75rem !important',
                fontWeight: 600,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            },
            '.RaMenuItemLink-active .RaMenuItemLink-icon': {
                color: `${colors.green} !important`,
            },
            // Sidebar icons
            '.RaMenuItemLink .RaMenuItemLink-icon': {
                color: colors.textSecondary,
                minWidth: '2.5rem',
            },
            // Outlined buttons in AppBar
            '.MuiAppBar-root .MuiButton-outlined': {
                color: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '.MuiAppBar-root .MuiButton-outlined:hover': {
                borderColor: '#fff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            // Outlined buttons in content area
            '.RaLayout-content .MuiButton-outlined, .MuiPaper-root .MuiButton-outlined': {
                borderColor: colors.navy,
                color: colors.navy,
            },
            '.RaLayout-content .MuiButton-outlined:hover, .MuiPaper-root .MuiButton-outlined:hover': {
                backgroundColor: 'rgba(46, 58, 89, 0.08)',
            },
        },
    },
};

// Dark theme
const darkPalette: ThemeOptions['palette'] = {
    mode: 'dark',
    primary: { main: '#7B9FE0', light: colors.green },
    secondary: { main: colors.green, dark: colors.greenDark },
    background: { default: '#1A2133', paper: colors.navy },
    text: { primary: '#FFFFFF', secondary: '#B0B0B0' },
};

const darkComponents: ThemeOptions['components'] = {
    ...sharedComponents,
    RaDataTable: {
        styleOverrides: {
            root: {
                '& .RaDataTable-headerCell': {
                    color: '#7B9FE0',
                    fontWeight: 600,
                },
            },
        },
    },
    MuiAppBar: {
        styleOverrides: {
            root: {
                backgroundColor: colors.navy,
                color: '#fff',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                '& .RaAppBar-toolbar': {
                    background: colors.navy,
                    backgroundImage: 'none',
                },
            },
        },
    },
    MuiDrawer: {
        styleOverrides: {
            paper: {
                backgroundColor: colors.navyDark,
                color: '#fff',
                borderRight: `1px solid ${colors.navy}`,
            },
        },
    },
    MuiCssBaseline: {
        styleOverrides: {
            body: {
                fontFamily: "'Montserrat', sans-serif",
            },
            '.RaLayout-content': {
                background: '#1A2133',
            },
            '.RaMenuItemLink': {
                color: '#fff',
                borderRadius: '0 0.5rem 0.5rem 0',
                margin: '0.125rem 0.5rem 0.125rem 0',
                paddingLeft: '1rem',
            },
            '.RaMenuItemLink:hover': {
                background: 'rgba(255, 255, 255, 0.08)',
            },
            '.RaMenuItemLink-active, a.RaMenuItemLink-active': {
                background: `${colors.navy} !important`,
                color: '#fff !important',
                borderLeft: `4px solid ${colors.green} !important`,
                paddingLeft: '0.75rem !important',
                fontWeight: 600,
            },
            '.RaMenuItemLink-active .RaMenuItemLink-icon': {
                color: `${colors.green} !important`,
            },
            '.RaMenuItemLink .RaMenuItemLink-icon': {
                color: '#B0B0B0',
                minWidth: '2.5rem',
            },
            // DataTable styling
            '.RaDataTable-row:nth-of-type(odd)': {
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
            },
            '.RaDataTable-row:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05) !important',
            },
            '.MuiAppBar-root .MuiButton-outlined': {
                color: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '.MuiAppBar-root .MuiButton-outlined:hover': {
                borderColor: '#fff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            '.RaLayout-content .MuiButton-outlined, .MuiPaper-root .MuiButton-outlined': {
                borderColor: '#fff',
                color: '#fff',
            },
        },
    },
};

// Create themes
export const peak10Light = createTheme({
    palette: lightPalette,
    typography,
    shape: { borderRadius: 16 },
    sidebar: { width: 250 },
    spacing: 8,
    components: lightComponents,
});

export const peak10Dark = createTheme({
    palette: darkPalette,
    typography,
    shape: { borderRadius: 16 },
    sidebar: { width: 250 },
    spacing: 8,
    components: darkComponents,
});

// For React Admin theme structure
export const peak10Themes = {
    name: 'peak10',
    light: peak10Light,
    dark: peak10Dark,
};
