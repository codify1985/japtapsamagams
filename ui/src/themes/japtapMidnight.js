import { createTheme } from '@material-ui/core/styles'

// Cupertino Midnight - Apple Music inspired dark theme
const japtapMidnight = createTheme({
  themeName: 'Japtap Midnight',
  palette: {
    mode: 'dark',
    primary: {
      main:  '#0A84FF', //'#50c8ff',//
      light: '#5AA9FF', 
      dark: '#0062D6',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0A84FF', // #0A84FF',
      light: '#5AA9FF', 
      dark: '#0062D6',
      contrastText: '#FFFFFF',
    //   main: '#BF5AF2',
    //   light: '#D47FFF',
    //   dark: '#9C3DCF',
    //   contrastText: '#FFFFFF',
    },
    // primary: {
    //   main: '#62ec83',
    //   light: '#1db954',
    //   dark: '#008827',
    //   contrastText: '#FFFFFF',
    // },
    // secondary: {
    //   main: '#62ec83',
    //   light: '#1db954',
    //   dark: '#008827',
    //   contrastText: '#FFFFFF',  
    // },
    secondary2: {
      main: '#FF9F0A',
      light: '#FFB347',
      dark: '#CC7A00',
      contrastText: '#FFFFFF',
    },
    // primary: {
    //     main: '#50c8ff', // #0A84FF',
    //     light: '#5AA9FF',
    //     dark: '#0062D6',
    //     contrastText: '#FFFFFF',
    // },
    background: {
      default: '#0B1020',
      paper: 'rgba(20, 25, 45, 0.75)',
    },
    surface: {
      main: 'rgba(20, 25, 45, 0.9)',
    },
    text: {
      primary: '#E6EAF2',
      secondary: '#A8B1C4',
      disabled: '#6B7280',
    },
    divider: 'rgba(230, 234, 242, 0.08)',
    success: {
      main: '#30D158',
      light: '#5FE57A',
      dark: '#00A83B',
    },
    warning: {
      main: '#FFD60A',
      light: '#FFED4E',
      dark: '#CC9400',
    },
    error: {
      main: '#FF453A',
      light: '#FF6961',
      dark: '#D70015',
    },
    type: 'dark',
  },
  
  shape: {
    borderRadius: 12,
  },
  
  typography: {
    fontFamily: [
      'SF Pro Text',
      'SF Pro Display', 
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: 'SF Pro Display, Inter, system-ui, sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'SF Pro Display, Inter, system-ui, sans-serif',
      fontWeight: 600,
    },
    h3: {
      fontFamily: 'SF Pro Display, Inter, system-ui, sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: 'SF Pro Display, Inter, system-ui, sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: 'SF Pro Display, Inter, system-ui, sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: 'SF Pro Display, Inter, system-ui, sans-serif',
      fontWeight: 600,
    },
    body1: {
      fontFamily: 'SF Pro Text, Inter, system-ui, sans-serif',
    },
    body2: {
      fontFamily: 'SF Pro Text, Inter, system-ui, sans-serif',
    },
  },
  
  spacing: (factor) => `${0.5 * factor}rem`,
  
  shadows: [
    'none',
    '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
    '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10)',
    '0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05)',
    '0 20px 40px rgba(0, 0, 0, 0.2)',
    ...Array(19).fill('0 20px 40px rgba(0, 0, 0, 0.2)'), // Fill remaining shadow levels
  ],

  overrides: {
    // Global backdrop filter support with fallback
    MuiPaper: {
      root: {
        color: '#E6EAF2',
        backgroundColor: 'rgba(20, 25, 45, 0.75)',
        backdropFilter: 'blur(12px)',
        // Fallback for browsers without backdrop filter support
        '@supports not (backdrop-filter: blur(12px))': {
          backgroundColor: 'rgba(20, 25, 45, 0.95)',
        },
        border: '1px solid rgba(230, 234, 242, 0.06)',
      },
    },

    // App Bar / Header
    MuiAppBar: {
      root: {
        backgroundColor: '#0B1020 !important',
        color: '#0A84FF !important',
        backdropFilter: 'blur(20px)',
        borderBottom: '0px',
        // borderBottom: '1px solid rgba(230, 234, 242, 0.08)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
        '@supports not (backdrop-filter: blur(20px))': {
          backgroundColor: '#0B1020 !important',
        },
      },
      colorPrimary: {
        backgroundColor: '#0B1020 !important',
      },
      colorDefault: {
        backgroundColor: '#0B1020 !important',
      },
    },

    // Toolbar (inside AppBar)
    MuiToolbar: {
      root: {
        backgroundColor: '#0B1020 !important',
      },
    },

    // Drawer / Sidebar
    MuiDrawer: {
      paper: {
        backgroundColor: 'rgba(15, 20, 35, 0.8)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(230, 234, 242, 0.08)',
        '@supports not (backdrop-filter: blur(16px))': {
          backgroundColor: 'rgba(15, 20, 35, 0.95)',
        },
        // Style for sidebar icons
        '& .MuiListItemIcon-root': {
          color: '#0A84FF',
        },
        '& .MuiSvgIcon-root': {
          color: '#0A84FF',
        },
      },
    },

    // Buttons
    MuiButton: {
      root: {
        borderRadius: 12,
        textTransform: 'none',
        fontWeight: 500,
        padding: '8px 16px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
        '&:hover': {
          transform: 'scale(1.02)',
          '@media (prefers-reduced-motion: reduce)': {
            transform: 'none',
          },
        },
        '&:focus-visible': {
          outline: '2px solid #0A84FF',
          outlineOffset: '2px',
        },
      },
      contained: {
        backgroundColor: '#0A84FF',
        color: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(10, 132, 255, 0.3)',
        '&:hover': {
          backgroundColor: '#0062D6',
          boxShadow: '0 4px 12px rgba(10, 132, 255, 0.4)',
        },
      },
      outlined: {
        borderColor: 'rgba(230, 234, 242, 0.2)',
        color: '#E6EAF2',
        '&:hover': {
          borderColor: '#0A84FF',
          backgroundColor: 'rgba(10, 132, 255, 0.1)',
        },
      },
      text: {
        color: '#A8B1C4',
        '&:hover': {
          backgroundColor: 'rgba(230, 234, 242, 0.05)',
        },
      },
      textPrimary: {
        color: '#0A84FF',
        '&:hover': {
          backgroundColor: 'rgba(10, 132, 255, 0.1)',
        },
      },
      textSecondary: {
        color: '#A8B1C4',
        '&:hover': {
          backgroundColor: 'rgba(168, 177, 196, 0.1)',
        },
      },
    },

    // Icon Buttons
    MuiIconButton: {
      root: {
        borderRadius: 10,
        padding: 8,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: 'rgba(230, 234, 242, 0.08)',
          transform: 'scale(1.05)',
          '@media (prefers-reduced-motion: reduce)': {
            transform: 'none',
          },
        },
        '&:focus-visible': {
          outline: '2px solid #0A84FF',
          outlineOffset: '2px',
        },
      },
    },

    // List items in sidebar
    MuiListItem: {
      root: {
        '&.Mui-selected': {
          backgroundColor: 'rgba(10, 132, 255, 0.15)',
          '& .MuiListItemIcon-root': {
            color: '#0A84FF',
          },
          '& .MuiListItemText-primary': {
            color: '#0A84FF',
          },
        },
        '&:hover': {
          backgroundColor: 'rgba(10, 132, 255, 0.08)',
        },
      },
    },

    // List item icons
    MuiListItemIcon: {
      root: {
        color: '#0A84FF',
        minWidth: '40px',
      },
    },

    // Text Fields
    MuiTextField: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 12,
          backgroundColor: 'rgba(230, 234, 242, 0.03)',
          '& fieldset': {
            borderColor: 'rgba(230, 234, 242, 0.15)',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(230, 234, 242, 0.3)',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#0A84FF',
            borderWidth: '2px',
          },
        },
        '& .MuiInputBase-input': {
          color: '#E6EAF2',
        },
        '& .MuiInputLabel-outlined': {
          color: '#A8B1C4',
          '&.Mui-focused': {
            color: '#0A84FF',
          },
        },
      },
    },

    // Select components
    MuiSelect: {
      outlined: {
        backgroundColor: 'rgba(230, 234, 242, 0.03)',
        borderRadius: 12,
      },
    },

    // Menu / Dropdowns
    MuiMenu: {
      paper: {
        backgroundColor: 'rgba(20, 25, 45, 0.9)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(230, 234, 242, 0.08)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        '@supports not (backdrop-filter: blur(16px))': {
          backgroundColor: 'rgba(20, 25, 45, 0.98)',
        },
      },
    },

    MuiMenuItem: {
      root: {
        color: '#E6EAF2',
        borderRadius: 8,
        margin: '2px 8px',
        padding: '8px 12px',
        '&:hover': {
          backgroundColor: 'rgba(10, 132, 255, 0.1)',
        },
        '&.Mui-selected': {
          backgroundColor: 'rgba(10, 132, 255, 0.15)',
          '&:hover': {
            backgroundColor: 'rgba(10, 132, 255, 0.2)',
          },
        },
      },
    },

    // Chips
    MuiChip: {
      root: {
        borderRadius: 12,
        backgroundColor: 'rgba(230, 234, 242, 0.1)',
        color: '#E6EAF2',
        border: '1px solid rgba(230, 234, 242, 0.15)',
      },
      clickable: {
        '&:hover': {
          backgroundColor: 'rgba(10, 132, 255, 0.15)',
        },
      },
    },

    // Tooltips
    MuiTooltip: {
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: '#FFFFFF',
        borderRadius: 8,
        fontSize: '0.75rem',
        padding: '8px 12px',
        backdropFilter: 'blur(8px)',
      },
    },

    // Dialogs
    MuiDialog: {
      paper: {
        backgroundColor: 'rgba(20, 25, 45, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(230, 234, 242, 0.08)',
        '@supports not (backdrop-filter: blur(20px))': {
          backgroundColor: 'rgba(20, 25, 45, 0.98)',
        },
      },
    },

    MuiDialogTitle: {
      root: {
        color: '#E6EAF2',
        fontWeight: 600,
      },
    },

    MuiDialogContent: {
      root: {
        color: '#A8B1C4',
      },
    },

    // Cards
    MuiCard: {
      root: {
        backgroundColor: 'rgba(20, 25, 45, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(230, 234, 242, 0.06)',
        '@supports not (backdrop-filter: blur(12px))': {
          backgroundColor: 'rgba(20, 25, 45, 0.9)',
        },
      },
    },

    // Tabs
    MuiTabs: {
      root: {
        borderBottom: '1px solid rgba(230, 234, 242, 0.08)',
      },
      indicator: {
        backgroundColor: '#0A84FF',
        height: 3,
        borderRadius: '3px 3px 0 0',
      },
    },

    MuiTab: {
      root: {
        textTransform: 'none',
        fontWeight: 500,
        color: '#A8B1C4',
        '&.Mui-selected': {
          color: '#0A84FF',
        },
        '&:hover': {
          color: '#E6EAF2',
        },
      },
    },

    // Tables / DataGrid
    MuiTableHead: {
      root: {
        backgroundColor: 'rgba(11, 16, 32, 0.8)',
        '& .MuiTableCell-head': {
          color: '#E6EAF2',
          fontWeight: 600,
          fontSize: '0.875rem',
          borderBottom: '1px solid rgba(230, 234, 242, 0.08)',
        },
      },
    },

    MuiTableBody: {
      root: {
        '& .MuiTableRow-root': {
          '&:hover': {
            backgroundColor: 'rgba(10, 132, 255, 0.05)',
          },
          '&:nth-of-type(even)': {
            backgroundColor: 'rgba(230, 234, 242, 0.02)',
          },
        },
      },
    },

    MuiTableCell: {
      root: {
        color: '#E6EAF2',
        borderBottom: '1px solid rgba(230, 234, 242, 0.05)',
        padding: '12px 16px',
      },
      head: {
        color: '#E6EAF2',
        fontWeight: 600,
        backgroundColor: 'rgba(11, 16, 32, 0.8)',
        borderBottom: '1px solid rgba(230, 234, 242, 0.08)',
      },
    },

    // Form components
    MuiFormGroup: {
      root: {
        color: '#E6EAF2',
      },
    },

    MuiFormLabel: {
      root: {
        color: '#A8B1C4',
        '&.Mui-focused': {
          color: '#0A84FF',
        },
      },
    },

    MuiFormHelperText: {
      root: {
        color: '#A8B1C4',
        '&.Mui-error': {
          color: '#FF453A',
        },
      },
    },

    // Switches
    MuiSwitch: {
      root: {
        '& .MuiSwitch-switchBase': {
          '&.Mui-checked': {
            color: '#30D158',
            '& + .MuiSwitch-track': {
              backgroundColor: '#30D158',
              opacity: 1,
            },
          },
        },
        '& .MuiSwitch-track': {
          backgroundColor: 'rgba(168, 177, 196, 0.3)',
        },
      },
    },

    // Sliders
    MuiSlider: {
      root: {
        color: '#0A84FF',
      },
      thumb: {
        backgroundColor: '#0A84FF',
        boxShadow: '0 2px 6px rgba(10, 132, 255, 0.3)',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(10, 132, 255, 0.4)',
        },
      },
      track: {
        backgroundColor: '#0A84FF',
      },
      rail: {
        backgroundColor: 'rgba(168, 177, 196, 0.3)',
      },
    },

    // Pagination
    MuiPagination: {
      root: {
        '& .MuiPaginationItem-root': {
          color: '#A8B1C4',
          borderRadius: 8,
          '&:hover': {
            backgroundColor: 'rgba(10, 132, 255, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: '#0A84FF',
            color: '#FFFFFF',
          },
        },
      },
    },

    // Scrollbars (Webkit)
    MuiCssBaseline: {
      '@global': {
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(168, 177, 196, 0.3)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'rgba(168, 177, 196, 0.5)',
          },
        },
        '*::-webkit-scrollbar-corner': {
          backgroundColor: 'transparent',
        },
      },
    },

    // Snackbars / Notifications
    MuiSnackbarContent: {
      root: {
        backgroundColor: 'rgba(20, 25, 45, 0.95)',
        color: '#E6EAF2',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        border: '1px solid rgba(230, 234, 242, 0.08)',
      },
    },

    // Custom Navidrome components
    NDLogin: {
      systemNameLink: {
        color: '#0A84FF',
      },
      icon: {},
      welcome: {
        color: '#E6EAF2',
      },
      card: {
        minWidth: 300,
        backgroundColor: 'rgba(20, 25, 45, 0.9)',
        backdropFilter: 'blur(16px)',
        '@supports not (backdrop-filter: blur(16px))': {
          backgroundColor: 'rgba(20, 25, 45, 0.98)',
        },
      },
      avatar: {},
      button: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      },
    },

    NDMobileArtistDetails: {
      bgContainer: {
        background: 'linear-gradient(to bottom, rgba(11, 16, 32, 0.8), rgba(20, 25, 45, 0.9))',
        backdropFilter: 'blur(8px)',
      },
    },
  },

  player: {
    theme: 'dark',
    // Custom stylesheet would be defined here if needed
  },
})

export default japtapMidnight