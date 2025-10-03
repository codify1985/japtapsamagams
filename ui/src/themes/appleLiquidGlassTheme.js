import { alpha } from '@material-ui/core/styles'
import stylesheet from './appleLiquidGlassTheme.css.js'

const ACCENT = '#4DA3FF'
const ACCENT_GLOW = '#5CB6FF'
const BASE_BG = '#05070A'
const SURFACE = 'rgba(18, 22, 29, 0.78)'
const SURFACE_ELEVATED = 'rgba(24, 29, 36, 0.82)'
const SURFACE_POPOVER = 'rgba(28, 34, 42, 0.88)'
const BORDER = 'rgba(255, 255, 255, 0.08)'
const SHADOW_MD = '0 24px 68px rgba(2, 8, 20, 0.55)'
const SHADOW_LG = '0 32px 88px rgba(3, 10, 24, 0.65)'

const text = {
  primary: '#F5F7FA',
  secondary: '#C6C8D1',
  disabled: 'rgba(198, 200, 209, 0.4)',
}

export default {
  themeName: 'Apple Liquid Glass',
  palette: {
    type: 'light',
    primary: {
      main: ACCENT,
      contrastText: '#091017',
    },
    secondary: {
      main: '#8E8E93',
      contrastText: text.primary,
    },
    background: {
      default: BASE_BG,
      paper: SURFACE,
    },
    text,
    divider: 'rgba(255, 255, 255, 0.12)',
    success: {
      main: '#34C759',
      contrastText: '#02100A',
    },
    warning: {
      main: '#F2C94C',
      contrastText: '#141000',
    },
    error: {
      main: '#FF453A',
      contrastText: '#1A0202',
    },
    info: {
      main: '#0EA5E9',
      contrastText: '#05111A',
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: [
      'SF Pro Text',
      'SF Pro Display',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    fontSize: 15,
    h1: { fontWeight: 600, letterSpacing: '-0.02em' },
    h2: { fontWeight: 600, letterSpacing: '-0.018em' },
    h3: { fontWeight: 600, letterSpacing: '-0.014em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '-0.01em',
    },
  },
  overrides: {
    MuiCssBaseline: {
      '@global': {
        body: {
          backgroundColor: BASE_BG,
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(77, 163, 255, 0.14), transparent 55%), radial-gradient(circle at 80% 10%, rgba(92, 182, 255, 0.12), transparent 45%), linear-gradient(180deg, rgba(5, 9, 16, 0.92), rgba(5, 8, 14, 0.94))',
          color: text.primary,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '*::selection': {
          background: alpha(ACCENT, 0.35),
        },
        '::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '::-webkit-scrollbar-thumb': {
          backgroundColor: alpha('#FFFFFF', 0.18),
          borderRadius: '999px',
        },
      },
    },
    MuiPaper: {
      root: {
        backgroundColor: SURFACE,
        backdropFilter: 'blur(18px) saturate(160%)',
        border: `1px solid ${BORDER}`,
        boxShadow: SHADOW_MD,
        borderRadius: 18,
        transition: 'box-shadow 200ms ease, transform 180ms ease',
        '&:hover': {
          boxShadow: SHADOW_LG,
          transform: 'translateY(-1px)',
        },
      },
      rounded: {
        borderRadius: 18,
      },
    },
    MuiCard: {
      root: {
        backgroundColor: SURFACE_ELEVATED,
        borderRadius: 20,
        border: `1px solid ${alpha('#FFFFFF', 0.08)}`,
        boxShadow: SHADOW_MD,
      },
    },
    MuiAppBar: {
      colorSecondary: {
        backgroundColor: 'rgba(12, 16, 24, 0.86)',
        backdropFilter: 'blur(16px) saturate(180%)',
        borderBottom: `1px solid ${BORDER}`,
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
        color: text.primary,
      },
    },
    MuiToolbar: {
      regular: {
        minHeight: 68,
        paddingLeft: 24,
        paddingRight: 24,
        '@media (max-width:600px)': {
          minHeight: 60,
          paddingLeft: 16,
          paddingRight: 16,
        },
      },
    },
    MuiButton: {
      root: {
        borderRadius: 16,
        padding: '10px 22px',
        letterSpacing: '-0.01em',
        transition:
          'transform 140ms ease, box-shadow 220ms ease, background-color 150ms ease',
        boxShadow: 'none',
        '&:hover': {
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        '&:focus-visible': {
          boxShadow: `0 0 0 3px ${alpha(ACCENT_GLOW, 0.45)}`,
          outline: 'none',
        },
      },
      containedPrimary: {
        backgroundImage:
          'linear-gradient(135deg, rgba(77, 163, 255, 0.95), rgba(21, 125, 234, 0.95))',
        color: '#02070D',
        boxShadow: '0 16px 40px rgba(20, 125, 234, 0.35)',
        '&:hover': {
          backgroundImage:
            'linear-gradient(135deg, rgba(92, 182, 255, 1), rgba(34, 140, 255, 0.98))',
          boxShadow: '0 20px 48px rgba(22, 124, 230, 0.5)',
        },
      },
      outlined: {
        borderColor: alpha(ACCENT, 0.45),
        color: ACCENT_GLOW,
        backgroundColor: 'rgba(77, 163, 255, 0.08)',
        '&:hover': {
          borderColor: ACCENT_GLOW,
          backgroundColor: 'rgba(77, 163, 255, 0.18)',
        },
      },
      text: {
        color: ACCENT_GLOW,
        padding: '10px 14px',
        '&:hover': {
          backgroundColor: 'rgba(77, 163, 255, 0.12)',
        },
      },
    },
    MuiIconButton: {
      root: {
        borderRadius: 16,
        padding: 10,
        color: text.secondary,
        transition: 'background-color 140ms ease, transform 140ms ease',
        '&:hover': {
          backgroundColor: 'rgba(77, 163, 255, 0.16)',
          color: ACCENT_GLOW,
        },
      },
    },
    MuiListItem: {
      root: {
        borderRadius: 18,
      },
    },
    MuiListItemButton: {
      root: {
        borderRadius: 18,
        paddingTop: 14,
        paddingBottom: 14,
        paddingLeft: 18,
        paddingRight: 18,
        transition: 'background-color 160ms ease',
        '&:hover': {
          backgroundColor: 'rgba(77, 163, 255, 0.15)',
        },
        '&.Mui-selected': {
          backgroundColor: 'rgba(77, 163, 255, 0.22)',
          color: text.primary,
        },
      },
    },
    MuiChip: {
      root: {
        borderRadius: 14,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(77, 163, 255, 0.18)',
        color: text.primary,
      },
    },
    MuiTabs: {
      indicator: {
        backgroundColor: ACCENT_GLOW,
        height: 3,
        borderRadius: 3,
      },
    },
    MuiTab: {
      root: {
        textTransform: 'none',
        minHeight: 48,
        borderRadius: 16,
        padding: '8px 16px',
        '&.Mui-selected': {
          color: ACCENT_GLOW,
        },
      },
    },
    MuiTextField: {
      root: {
        borderRadius: 16,
        backgroundColor: SURFACE_ELEVATED,
        '& .MuiOutlinedInput-root': {
          borderRadius: 16,
          '& fieldset': {
            borderColor: BORDER,
          },
          '&:hover fieldset': {
            borderColor: alpha(ACCENT, 0.6),
          },
          '&.Mui-focused fieldset': {
            borderColor: ACCENT,
            boxShadow: `0 0 0 3px ${alpha(ACCENT, 0.25)}`,
          },
          '& input': {
            padding: '12px 16px',
          },
        },
      },
    },
    MuiOutlinedInput: {
      input: {
        color: text.primary,
        '&::placeholder': {
          color: alpha(text.primary, 0.5),
          opacity: 1,
        },
      },
    },
    MuiMenu: {
      paper: {
        backgroundColor: SURFACE_POPOVER,
        borderRadius: 18,
        border: `1px solid ${BORDER}`,
        boxShadow: SHADOW_LG,
        backdropFilter: 'blur(18px) saturate(160%)',
      },
    },
    MuiPopover: {
      paper: {
        backgroundColor: SURFACE_POPOVER,
        borderRadius: 20,
        border: `1px solid ${BORDER}`,
        boxShadow: SHADOW_LG,
      },
    },
    MuiDialog: {
      paper: {
        backgroundColor: SURFACE_POPOVER,
        borderRadius: 26,
        border: `1px solid ${BORDER}`,
        boxShadow: SHADOW_LG,
        padding: '16px 24px',
      },
    },
    MuiTableContainer: {
      root: {
        backgroundColor: SURFACE_ELEVATED,
        borderRadius: 20,
        boxShadow: SHADOW_MD,
      },
    },
    MuiTableHead: {
      root: {
        backgroundColor: 'rgba(24, 32, 46, 0.9)',
        '& .MuiTableCell-head': {
          color: text.secondary,
          borderBottom: `1px solid ${alpha('#FFFFFF', 0.08)}`,
          letterSpacing: '0.08em',
        },
      },
    },
    MuiTableCell: {
      root: {
        borderBottom: `1px solid ${alpha('#FFFFFF', 0.05)}`,
        paddingTop: 14,
        paddingBottom: 14,
      },
      body: {
        color: text.secondary,
      },
    },
    MuiTableRow: {
      root: {
        '&:hover': {
          backgroundColor: 'rgba(77, 163, 255, 0.12)',
        },
      },
    },
    NDLogin: {
      card: {
        borderRadius: 28,
        background:
          'linear-gradient(160deg, rgba(24, 32, 45, 0.92), rgba(12, 18, 26, 0.88))',
        boxShadow: '0 32px 90px rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(24px)',
      },
      icon: {
        background: 'linear-gradient(135deg, #5CB6FF, #1F8BFF)',
        borderRadius: '20px',
      },
      button: {
        boxShadow: '0 20px 48px rgba(22, 124, 230, 0.45)',
      },
      systemNameLink: {
        color: ACCENT_GLOW,
      },
      welcome: {
        color: text.secondary,
      },
    },
    NDMobileArtistDetails: {
      header: {
        background:
          'linear-gradient(200deg, rgba(45, 92, 160, 0.85), rgba(14, 22, 34, 0.92))',
        backdropFilter: 'blur(18px)',
      },
      bgContainer: {
        background:
          'linear-gradient(220deg, rgba(18, 24, 34, 0.92), rgba(6, 10, 16, 0.92))',
      },
      actionRow: {
        gap: '12px',
      },
      title: {
        color: text.primary,
      },
      subtitle: {
        color: text.secondary,
      },
    },
    NDPlayerBar: {
      root: {
        background:
          'linear-gradient(160deg, rgba(24, 30, 40, 0.95), rgba(10, 14, 22, 0.94))',
        backdropFilter: 'blur(22px) saturate(180%)',
        borderTop: `1px solid ${BORDER}`,
        boxShadow: '0 -18px 48px rgba(0, 0, 0, 0.45)',
      },
    },
    NDQueue: {
      surface: {
        background:
          'linear-gradient(180deg, rgba(22, 28, 38, 0.92), rgba(12, 16, 24, 0.94))',
        backdropFilter: 'blur(20px)',
      },
    },
    NDNowPlayingSheet: {
      surface: {
        background:
          'linear-gradient(190deg, rgba(20, 28, 38, 0.96), rgba(8, 12, 20, 0.94))',
        borderRadius: '32px 32px 0 0',
        backdropFilter: 'blur(22px)',
      },
    },
  },
  player: {
    theme: 'light',
    stylesheet,
  },
}
