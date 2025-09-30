import { makeStyles } from '@material-ui/core/styles'
import config from '../config'

const useLoginStyles = makeStyles(
  (theme) => ({
    main: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: `url(${config.loginBackgroundURL})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    card: {
      minWidth: 300,
      marginTop: '6em',
      overflow: 'visible',
    },
    avatar: {
      margin: '1em',
      display: 'flex',
      justifyContent: 'center',
      marginTop: '-3em',
    },
    icon: {
      backgroundColor: 'transparent',
      width: '6.3em',
      height: '6.3em',
    },
    systemName: {
      marginTop: '1em',
      display: 'flex',
      justifyContent: 'center',
      color: '#3f51b5',
    },
    welcome: {
      marginTop: '1em',
      padding: '0 1em 1em 1em',
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      color: '#3f51b5',
    },
    form: {
      padding: '0 1em 1em 1em',
    },
    input: {
      marginTop: '1em',
    },
    actions: {
      padding: '0 1em 1em 1em',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
    },
    button: {},
    systemNameLink: {
      textDecoration: 'none',
    },
    message: {
      marginTop: '1em',
      padding: '0 1em 1em 1em',
      textAlign: 'center',
      wordBreak: 'break-word',
      fontSize: '0.875em',
    },
    guestActions: {
      display: 'flex',
      alignItems: 'stretch',
      gap: theme.spacing(2),
      padding: '0 1em 1.5em 1em',
      [theme.breakpoints.down('xs')]: {
        flexDirection: 'column',
        paddingBottom: theme.spacing(2.5),
      },
    },
    guestActionButton: {
      flex: 1,
      fontWeight: 600,
      textTransform: 'none',
      // borderRadius: theme.shape.borderRadius * 2,
      padding: theme.spacing(1.25, 2.5),
      transition: theme.transitions.create(
        ['background-color', 'box-shadow', 'color'],
        { duration: theme.transitions.duration.shortest },
      ),
      [theme.breakpoints.down('xs')]: {
        width: '100%',
      },
      '&:focus-visible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 2,
      },
    },
    guestOutlinedButton: {
      borderWidth: 2,
      borderColor: theme.palette.primary.main,
      color: theme.palette.primary.main,
      '&:hover': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.getContrastText(theme.palette.primary.main),
        boxShadow: 'none',
      },
      '&:focus-visible': {
        boxShadow: `0 0 0 2px ${theme.palette.primary.main}33`,
      },
    },
    guestContainedButton: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.getContrastText(theme.palette.primary.main),
      boxShadow: 'none',
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        boxShadow: 'none',
      },
      '&:focus-visible': {
        boxShadow: `0 0 0 2px ${theme.palette.primary.main}55`,
      },
    },
    textButton: {
      textTransform: 'none',
      fontWeight: 600,
    },
  }),
  { name: 'NDLogin' },
)

export default useLoginStyles
