import { createTheme } from '@material-ui/core/styles'
import createPlayerStylesheet from './japtapLightTheme.css.js'

// JapTap Light - Light theme based on JapTap High Contrast
// Only colors changed, all layout/spacing/typography preserved
const PRIMARY_MAIN = '#0A84FF'
const SURFACE_BASE = 'rgba(255, 255, 255, 0.95)'
const SURFACE_GRADIENT =
  'linear-gradient(150deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 245, 247, 0.95) 48%, rgba(240, 240, 242, 0.98) 100%)'
const SURFACE_BORDER = 'rgba(0, 0, 0, 0.08)'
const SURFACE_SHADOW = '0 26px 50px rgba(0, 0, 0, 0.08)'
const LIST_ROW_GRADIENT =
  'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 252, 0.95) 50%, rgba(245, 245, 247, 0.98) 100%)'
const LIST_ROW_GRADIENT_HOVER =
  'linear-gradient(145deg, rgba(245, 248, 255, 0.98) 0%, rgba(240, 245, 255, 0.95) 52%, rgba(235, 240, 250, 0.98) 100%)'

const japtapLight = createTheme({
  themeName: 'JapTap Light',
  palette: {
    mode: 'light',
    primary: {
      main: PRIMARY_MAIN,
      light: '#5AA9FF',
      dark: '#0062D6',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: PRIMARY_MAIN,
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
      default: '#F5F5F7',
      paper: 'rgba(255, 255, 255, 0.95)',
    },
    surface: {
      main: 'rgba(255, 255, 255, 0.95)',
    },
    text: {
      primary: '#1D1D1F',
      secondary: '#6E6E73',
      disabled: '#AEAEB2',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    success: {
      main: '#30D158',
      light: '#5FE57A',
      dark: '#00A83B',
    },
    warning: {
      main: '#FF9F0A',
      light: '#FFB347',
      dark: '#CC7A00',
    },
    error: {
      main: '#FF3B30',
      light: '#FF6961',
      dark: '#D70015',
    },
    type: 'light',
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
    '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.08)',
    '0 3px 6px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
    '0 10px 20px rgba(0, 0, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.05)',
    '0 15px 25px rgba(0, 0, 0, 0.08), 0 5px 10px rgba(0, 0, 0, 0.03)',
    '0 20px 40px rgba(0, 0, 0, 0.1)',
    ...Array(19).fill('0 20px 40px rgba(0, 0, 0, 0.1)'), // Fill remaining shadow levels
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
        color: '#1D1D1F',
        backgroundColor: SURFACE_BASE,
        backgroundImage: SURFACE_GRADIENT,
        backdropFilter: 'blur(12px)',
        // Fallback for browsers without backdrop filter support
        '@supports not (backdrop-filter: blur(12px))': {
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backgroundImage:
            'linear-gradient(150deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 248, 250, 0.95) 55%, rgba(245, 245, 247, 0.98) 100%)',
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
        backgroundColor: '#FFFFFF !important',
        color: '#0A84FF !important',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        '@supports not (backdrop-filter: blur(20px))': {
          backgroundColor: '#FFFFFF !important',
        },
      },
      colorPrimary: {
        backgroundColor: '#FFFFFF !important',
      },
      colorDefault: {
        backgroundColor: '#FFFFFF !important',
      },
    },

    // Toolbar (inside AppBar)
    MuiToolbar: {
      root: {
        backgroundColor: '#FFFFFF !important',
      },
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
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        '@supports not (backdrop-filter: blur(16px))': {
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
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
        borderColor: 'rgba(0, 0, 0, 0.15)',
        color: '#1D1D1F',
        '&:hover': {
          borderColor: '#0A84FF',
          backgroundColor: 'rgba(10, 132, 255, 0.08)',
        },
      },
      text: {
        color: '#6E6E73',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      },
      textPrimary: {
        color: '#0A84FF',
        '&:hover': {
          backgroundColor: 'rgba(10, 132, 255, 0.08)',
        },
      },
      textSecondary: {
        color: '#6E6E73',
        '&:hover': {
          backgroundColor: 'rgba(110, 110, 115, 0.08)',
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
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
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
        boxShadow: '-1px 1px 6px 0px rgba(0, 0, 0, 0.15)',
        objectFit: 'cover',
      },
    },

    // List items in sidebar
    MuiListItem: {
      root: {
        '&.Mui-selected': {
          backgroundColor: 'rgba(10, 132, 255, 0.12)',
          '& .MuiListItemIcon-root': {
            color: '#0A84FF',
          },
          '& .MuiListItemText-primary': {
            color: '#0A84FF',
          },
        },
        '&:hover': {
          backgroundColor: 'rgba(10, 132, 255, 0.06)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backgroundImage: LIST_ROW_GRADIENT,
        border: `1px solid ${SURFACE_BORDER}`,
        borderRadius: 20,
        boxShadow: '0 22px 44px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(18px)',
        padding: '12px 18px',
        marginBottom: '3px',
        marginRight: '3px',
        transition:
          'transform 160ms ease, box-shadow 220ms ease, background 200ms ease',
        '@supports not (backdrop-filter: blur(18px))': {
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backgroundImage:
            'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 252, 0.96) 48%, rgba(245, 245, 247, 0.98) 100%)',
        },
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 28px 56px rgba(0, 0, 0, 0.1)',
          backgroundImage: LIST_ROW_GRADIENT_HOVER,
        },
      },
    },

    // Text Fields - enhanced with Apple-like rounded corners
    MuiTextField: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 16, // More Apple-like
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          '& fieldset': {
            borderColor: 'rgba(0, 0, 0, 0.12)',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(0, 0, 0, 0.2)',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#0A84FF',
            borderWidth: '2px',
          },
        },
        '& .MuiInputBase-input': {
          color: '#1D1D1F',
        },
        '& .MuiInputLabel-outlined': {
          color: '#6E6E73',
          '&.Mui-focused': {
            color: '#0A84FF',
          },
        },
      },
    },

    // Select components
    MuiSelect: {
      outlined: {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 16, // More Apple-like
      },
    },

    // Menu / Dropdowns - enhanced with Apple-like rounded corners
    MuiMenu: {
      paper: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
        borderRadius: 16, // More Apple-like
        '@supports not (backdrop-filter: blur(16px))': {
          backgroundColor: 'rgba(255, 255, 255, 0.99)',
        },
      },
    },

    MuiMenuItem: {
      root: {
        color: '#1D1D1F',
        borderRadius: 12, // Apple-like
        margin: '2px 8px',
        padding: '8px 12px',
        '&:hover': {
          backgroundColor: 'rgba(10, 132, 255, 0.08)',
        },
        '&.Mui-selected': {
          backgroundColor: 'rgba(10, 132, 255, 0.12)',
          '&:hover': {
            backgroundColor: 'rgba(10, 132, 255, 0.16)',
          },
        },
      },
    },

    // Chips - enhanced with Apple-like rounded corners
    MuiChip: {
      root: {
        borderRadius: 16, // More Apple-like
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
        color: '#1D1D1F',
        border: '1px solid rgba(0, 0, 0, 0.08)',
      },
      clickable: {
        '&:hover': {
          backgroundColor: 'rgba(10, 132, 255, 0.12)',
        },
      },
    },

    // Tooltips - enhanced with Apple-like rounded corners
    MuiTooltip: {
      tooltip: {
        backgroundColor: 'rgba(29, 29, 31, 0.95)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: 20, // More Apple-like
        '@supports not (backdrop-filter: blur(20px))': {
          backgroundColor: 'rgba(255, 255, 255, 0.99)',
        },
      },
    },

    MuiDialogTitle: {
      root: {
        color: '#1D1D1F',
        fontWeight: 600,
      },
    },

    MuiDialogContent: {
      root: {
        color: '#6E6E73',
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
        boxShadow: '0 32px 60px rgba(0, 0, 0, 0.08)',
        isolation: 'isolate',
        transition:
          'transform 180ms ease, box-shadow 220ms ease, background 220ms ease',
        '&:hover': {
          // transform: 'translateY(-3px)',
          boxShadow: '0 38px 70px rgba(0, 0, 0, 0.1)',
          backgroundImage:
            'linear-gradient(150deg, rgba(248, 250, 255, 0.98) 0%, rgba(245, 248, 255, 0.95) 48%, rgba(240, 245, 252, 0.98) 100%)',
        },
        '@supports not (backdrop-filter: blur(12px))': {
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backgroundImage:
            'linear-gradient(150deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 252, 0.96) 55%, rgba(245, 245, 247, 0.98) 100%)',
        },
      },
    },

    // Tabs
    MuiTabs: {
      root: {
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
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
        color: '#6E6E73',
        '&.Mui-selected': {
          color: '#0A84FF',
        },
        '&:hover': {
          color: '#1D1D1F',
        },
      },
    },

    // Tables / DataGrid
    MuiTableHead: {
      root: {
        backgroundColor: 'rgba(245, 245, 247, 0.95)',
        '& .MuiTableCell-head': {
          color: '#1D1D1F',
          fontWeight: 600,
          fontSize: '0.875rem',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },

    MuiTableBody: {
      root: {
        '& .MuiTableRow-root': {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backgroundImage: LIST_ROW_GRADIENT,
          transition: 'background 160ms ease, box-shadow 200ms ease',
          borderBottom: `1px solid ${SURFACE_BORDER}`,
          '&:nth-of-type(even)': {
            backgroundImage:
              'linear-gradient(145deg, rgba(250, 250, 252, 0.98) 0%, rgba(248, 248, 250, 0.95) 48%, rgba(245, 245, 247, 0.98) 100%)',
          },
          '&:hover, &.MuiTableRow-hover:hover': {
            backgroundImage: LIST_ROW_GRADIENT_HOVER,
            boxShadow: '0 18px 36px rgba(0, 0, 0, 0.06)',
          },
          '& td, & th': {
            borderBottom: `1px solid ${SURFACE_BORDER}`,
          },
        },
      },
    },

    MuiTableCell: {
      root: {
        color: '#1D1D1F',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        padding: '12px 16px',
      },
      head: {
        color: '#1D1D1F',
        fontWeight: 600,
        backgroundColor: 'rgba(245, 245, 247, 0.95)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
      },
    },

    // Form components
    MuiFormGroup: {
      root: {
        color: '#1D1D1F',
      },
    },

    MuiFormLabel: {
      root: {
        color: '#6E6E73',
        '&.Mui-focused': {
          color: '#0A84FF',
        },
      },
    },

    MuiFormHelperText: {
      root: {
        color: '#6E6E73',
        '&.Mui-error': {
          color: '#FF3B30',
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
          backgroundColor: 'rgba(110, 110, 115, 0.3)',
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
        backgroundColor: 'rgba(110, 110, 115, 0.3)',
      },
    },

    // Pagination
    MuiPagination: {
      root: {
        '& .MuiPaginationItem-root': {
          color: '#6E6E73',
          borderRadius: 12, // Apple-like
          '&:hover': {
            backgroundColor: 'rgba(10, 132, 255, 0.08)',
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
          backgroundColor: 'rgba(110, 110, 115, 0.3)',
          borderRadius: '6px', // More Apple-like
          '&:hover': {
            backgroundColor: 'rgba(110, 110, 115, 0.5)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        color: '#1D1D1F',
        backdropFilter: 'blur(12px)',
        borderRadius: 16, // More Apple-like
        border: '1px solid rgba(0, 0, 0, 0.08)',
      },
    },

    // Custom Navidrome components
    NDAlbumGridView: {
      albumContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        padding: '2px 2px 2px',
        backdropFilter: 'blur(18px)',
        isolation: 'isolate',
        '& img': {
          borderRadius: 26, // Match the container!
          boxShadow: '0 18px 40px rgba(0, 0, 0, 0.1)',
        },
      },
      link: {
        borderRadius: 26, // Match the container!
        overflow: 'hidden',
        boxShadow: '0 18px 36px rgba(0, 0, 0, 0.08)',
        transition: 'transform 160ms ease, box-shadow 220ms ease',
      },
      tileBar: {
        background:
          'linear-gradient(0deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 100%)',
        borderRadius: 26, // Match the container!
      },
      albumLink: {
        borderRadius: 26, // Match the container!
      },
      albumPlayButton: {
        color: 'white',
        padding: '0.35rem',
        boxShadow: '0 8px 8px rgb(0 0 0 / 15%)',
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
        color: '#1D1D1F',
      },
      card: {
        minWidth: 300,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(16px)',
        borderRadius: 20, // More Apple-like
        '@supports not (backdrop-filter: blur(16px))': {
          backgroundColor: 'rgba(255, 255, 255, 0.99)',
        },
      },
      avatar: {},
      button: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
    },

    NDMobileArtistDetails: {
      bgContainer: {
        background:
          'linear-gradient(to bottom, rgba(245, 245, 247, 0.95), rgba(255, 255, 255, 0.98))',
        backdropFilter: 'blur(8px)',
      },
    },
  },

  player: {
    theme: 'light',
    stylesheet: createPlayerStylesheet(PRIMARY_MAIN),
  },
})

export default japtapLight
