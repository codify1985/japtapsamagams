import { createTheme } from '@material-ui/core/styles'
import createPlayerStylesheet from './japtapHighContrastTheme.css.js'

// Japtap Apple - Enhanced Apple-inspired theme based on Japtap Midnight
const PRIMARY_MAIN = '#0A84FF'
const SURFACE_BASE = 'rgba(16, 23, 42, 0.85)'
const SURFACE_GRADIENT =
  'linear-gradient(150deg, rgba(44, 62, 104, 0.3) 0%, rgba(16, 23, 42, 0.85) 48%, rgba(6, 12, 26, 0.96) 100%)'
const SURFACE_BORDER = 'rgba(116, 142, 198, 0.22)'
const SURFACE_SHADOW = '0 26px 50px rgba(2, 6, 20, 0.46)'
const LIST_ROW_GRADIENT =
  'linear-gradient(145deg, rgba(34, 48, 78, 0.35) 0%, rgba(14, 22, 40, 0.82) 50%, rgba(6, 12, 26, 0.94) 100%)'
const LIST_ROW_GRADIENT_HOVER =
  'linear-gradient(145deg, rgba(52, 74, 116, 0.45) 0%, rgba(18, 28, 48, 0.9) 52%, rgba(8, 14, 30, 0.98) 100%)'

const japtapHighContrast = createTheme({
  themeName: 'High Contrast',
  palette: {
    mode: 'dark',
    primary: {
      main: PRIMARY_MAIN, //'#50c8ff',//
      light: '#5AA9FF',
      dark: '#0062D6',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: PRIMARY_MAIN, // #0A84FF',
      light: '#5AA9FF',
      dark: '#0062D6',
      contrastText: '#FFFFFF',
    },
    secondary2: {
      main: '#FF9F0A',
      light: '#FFB347',
      dark: '#CC7A00',
      contrastText: '#FFFFFF',
    },
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

  // Enhanced Apple-like shape with more pronounced rounded corners
  shape: {
    borderRadius: 16,
  },

  // Apple's typography system
  typography: {
    fontFamily:
      '"SF Pro Text",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif',
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
    button: {
      fontFamily: 'SF Pro Text, Inter, system-ui, sans-serif',
      fontWeight: 500,
      textTransform: 'none',
    },
    caption: {
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

  // Apple-inspired z-index system
  zIndex: {
    appBar: 1100,
    modal: 1300,
    tooltip: 1500,
    drawer: 1200,
    mobileStepper: 1000,
    speedDial: 1050,
    snackbar: 1400,
  },

  overrides: {
    // Global backdrop filter support with fallback - enhanced with more Apple-like rounded corners
    MuiPaper: {
      root: {
        color: '#E6EAF2',
        backgroundColor: SURFACE_BASE,
        backgroundImage: SURFACE_GRADIENT,
        backdropFilter: 'blur(12px)',
        // Fallback for browsers without backdrop filter support
        '@supports not (backdrop-filter: blur(12px))': {
          backgroundColor: 'rgba(16, 23, 42, 0.93)',
          backgroundImage:
            'linear-gradient(150deg, rgba(34, 48, 78, 0.25) 0%, rgba(16, 23, 42, 0.9) 55%, rgba(6, 12, 26, 0.96) 100%)',
        },
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 16, // More Apple-like
        boxShadow: SURFACE_SHADOW,
        transition: 'background 180ms ease, box-shadow 220ms ease',
      },
      rounded: {
        borderRadius: 24, // Apple-inspired rounded papers
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
      // not needed now
      // gutters: {
      //   paddingLeft: '0 !important',
      //   paddingRight: '0 !important',
      //   alignItems: 'flex-end !important',
      //   marginBottom: '0.75rem',
      // },
    },

    // Remove outer border/background from list pages (album list, etc.)
    RaList: {
      root: {
        '& > .MuiCard-root, & > .MuiPaper-root': {
          border: 'none !important',
          boxShadow: 'none !important',
          background: 'transparent !important',
          backgroundImage: 'none !important',
        },
      },
      content: {
        backgroundColor: 'transparent !important',
        backgroundImage: 'none !important',
        border: 'none !important',
        boxShadow: 'none !important',
      },
      main: {
        '& > .MuiCard-root, & > .MuiPaper-root': {
          border: 'none !important',
          boxShadow: 'none !important',
          background: 'transparent !important',
          backgroundImage: 'none !important',
        },
      },
    },

    RaListToolbar: {
      toolbar: {
        paddingLeft: '0 !important',
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

    // Buttons - enhanced with Apple-like rounded corners
    MuiButton: {
      root: {
        borderRadius: 16, // More Apple-like
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
        borderRadius: 12, // Apple-like
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

    NDAlbumDetails: {
      cover: {
        borderRadius: '26px !important',
        boxShadow: '-1px 1px 6px 0px #00000057',
        objectFit: 'cover',
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
    MuiList: {
      padding: {
        paddingTop: 0,
        paddingBottom: 0,
      },
    },

    // List item icons
    MuiListItemIcon: {
      root: {
        color: '#0A84FF',
        minWidth: '40px',
      },
    },

    RaSongSimpleList: {
      MuiList: {
        padding: {
          paddingTop: 0,
          paddingBottom: 0,
        },
      },
      listItem: {
        backgroundColor: 'rgba(14, 22, 40, 0.86)',
        backgroundImage: LIST_ROW_GRADIENT,
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 20,
        boxShadow: '0 22px 44px rgba(2, 6, 20, 0.45)',
        backdropFilter: 'blur(18px)',
        padding: '12px 18px',
        marginBottom: '3px',
        // marginLeft: '3px',
        marginRight: '3px',
        transition:
          'transform 160ms ease, box-shadow 220ms ease, background 200ms ease',
        '@supports not (backdrop-filter: blur(18px))': {
          backgroundColor: 'rgba(16, 23, 42, 0.94)',
          backgroundImage:
            'linear-gradient(145deg, rgba(38, 56, 92, 0.36) 0%, rgba(16, 23, 42, 0.9) 48%, rgba(6, 12, 26, 0.96) 100%)',
        },
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 28px 56px rgba(2, 6, 20, 0.5)',
          backgroundImage: LIST_ROW_GRADIENT_HOVER,
        },
      },
    },

    // Text Fields - enhanced with Apple-like rounded corners
    MuiTextField: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 16, // More Apple-like
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
        borderRadius: 16, // More Apple-like
      },
    },

    // Menu / Dropdowns - enhanced with Apple-like rounded corners
    MuiMenu: {
      paper: {
        backgroundColor: 'rgba(20, 25, 45, 0.9)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(230, 234, 242, 0.08)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        borderRadius: 16, // More Apple-like
        '@supports not (backdrop-filter: blur(16px))': {
          backgroundColor: 'rgba(20, 25, 45, 0.98)',
        },
      },
    },

    MuiMenuItem: {
      root: {
        color: '#E6EAF2',
        borderRadius: 12, // Apple-like
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

    // Chips - enhanced with Apple-like rounded corners
    MuiChip: {
      root: {
        borderRadius: 16, // More Apple-like
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

    // Tooltips - enhanced with Apple-like rounded corners
    MuiTooltip: {
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: '#FFFFFF',
        borderRadius: 12, // More Apple-like
        fontSize: '0.75rem',
        padding: '8px 12px',
        backdropFilter: 'blur(8px)',
      },
    },

    // Dialogs - enhanced with Apple-like rounded corners
    MuiDialog: {
      paper: {
        backgroundColor: 'rgba(20, 25, 45, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(230, 234, 242, 0.08)',
        borderRadius: 20, // More Apple-like
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

    // Cards - enhanced with Apple-like rounded corners
    MuiCard: {
      root: {
        backgroundColor: SURFACE_BASE,
        backgroundImage: SURFACE_GRADIENT,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 20, // More Apple-like
        boxShadow: '0 32px 60px rgba(2, 6, 20, 0.5)',
        isolation: 'isolate',
        transition:
          'transform 180ms ease, box-shadow 220ms ease, background 220ms ease',
        '&:hover': {
          // transform: 'translateY(-3px)',
          boxShadow: '0 38px 70px rgba(2, 6, 20, 0.55)',
          backgroundImage:
            'linear-gradient(150deg, rgba(52, 74, 116, 0.38) 0%, rgba(16, 23, 42, 0.88) 48%, rgba(6, 12, 26, 0.98) 100%)',
        },
        '@supports not (backdrop-filter: blur(12px))': {
          backgroundColor: 'rgba(16, 23, 42, 0.93)',
          backgroundImage:
            'linear-gradient(150deg, rgba(34, 48, 78, 0.28) 0%, rgba(16, 23, 42, 0.9) 55%, rgba(6, 12, 26, 0.96) 100%)',
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
          backgroundColor: 'rgba(14, 22, 40, 0.82)',
          backgroundImage: LIST_ROW_GRADIENT,
          transition: 'background 160ms ease, box-shadow 200ms ease',
          borderBottom: `1px solid ${SURFACE_BORDER}`,
          '&:nth-of-type(even)': {
            backgroundImage:
              'linear-gradient(145deg, rgba(38, 56, 92, 0.4) 0%, rgba(16, 23, 42, 0.85) 48%, rgba(6, 12, 26, 0.96) 100%)',
          },
          '&:hover, &.MuiTableRow-hover:hover': {
            backgroundImage: LIST_ROW_GRADIENT_HOVER,
            boxShadow: '0 18px 36px rgba(2, 6, 20, 0.42)',
          },
          '& td, & th': {
            borderBottom: `1px solid ${SURFACE_BORDER}`,
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
          borderRadius: 12, // Apple-like
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
          borderRadius: '6px', // More Apple-like
          '&:hover': {
            backgroundColor: 'rgba(168, 177, 196, 0.5)',
          },
        },
        '*::-webkit-scrollbar-corner': {
          backgroundColor: 'transparent',
        },
      },
    },

    // Snackbars / Notifications - enhanced with Apple-like rounded corners
    MuiSnackbarContent: {
      root: {
        backgroundColor: 'rgba(20, 25, 45, 0.95)',
        color: '#E6EAF2',
        backdropFilter: 'blur(12px)',
        borderRadius: 16, // More Apple-like
        border: '1px solid rgba(230, 234, 242, 0.08)',
      },
    },

    // Custom Navidrome components
    NDAlbumGridView: {
      albumContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        padding: '2px 2px 2px',
        // minHeight: '100%',
        // borderRadius: 26,
        // backgroundColor: 'rgba(14, 22, 40, 0.88)',
        // backgroundImage: SURFACE_GRADIENT,
        // border: `1px solid ${SURFACE_BORDER}`,
        // boxShadow: '0 24px 52px rgba(2, 6, 20, 0.5)',
        backdropFilter: 'blur(18px)',
        isolation: 'isolate',
        // transition:
        //   'transform 180ms ease, box-shadow 240ms ease, background 220ms ease',
        // '&:hover': {
        //   transform: 'translateY(-4px)',
        //   boxShadow: '0 32px 68px rgba(2, 6, 20, 0.55)',
        //   // backgroundImage:
        //   //   'linear-gradient(150deg, rgba(56, 78, 124, 0.4) 0%, rgba(16, 23, 42, 0.88) 48%, rgba(6, 12, 26, 0.98) 100%)',
        // },
        // '@supports not (backdrop-filter: blur(18px))': {
        //   backgroundColor: 'rgba(16, 23, 42, 0.94)',
        //   backgroundImage:
        //     'linear-gradient(150deg, rgba(38, 56, 92, 0.38) 0%, rgba(16, 23, 42, 0.9) 48%, rgba(6, 12, 26, 0.96) 100%)',
        // },
        '& img': {
          borderRadius: 26, // Match the container!
          boxShadow: '0 18px 40px rgba(2, 6, 20, 0.45)',
        },
      },
      link: {
        borderRadius: 26, // Match the container!
        overflow: 'hidden',
        boxShadow: '0 18px 36px rgba(2, 6, 20, 0.4)',
        transition: 'transform 160ms ease, box-shadow 220ms ease',
        // '&:hover': {
        //   transform: 'translateY(-2px)',
        //   boxShadow: '0 24px 52px rgba(2, 6, 20, 0.48)',
        // },
      },
      tileBar: {
        background:
          'linear-gradient(0deg, rgba(5, 8, 16, 0.85) 0%, rgba(5, 8, 16, 0) 100%)',
        //borderRadius: '0 0 26px 26px', // Match parent for perfect rounding
        borderRadius: 26, // Match the container!
      },
      albumLink: {
        borderRadius: 26, // Match the container!
        // padding: '0 4px',
      },
      albumPlayButton: {
        color: 'white',
        padding: '0.35rem',
        boxShadow: '0 8px 8px rgb(0 0 0 / 30%)',
        transition: 'padding .3s ease',
        borderRadius: '50%',
        backgroundColor: '#0A84FF',
      },
    },
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
        borderRadius: 20, // More Apple-like
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
        background:
          'linear-gradient(to bottom, rgba(11, 16, 32, 0.8), rgba(20, 25, 45, 0.9))',
        backdropFilter: 'blur(8px)',
      },
    },
  },

  player: {
    theme: 'dark',
    stylesheet: createPlayerStylesheet(PRIMARY_MAIN),
  },
})

export default japtapHighContrast
