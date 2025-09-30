import React, { useState, useCallback, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Field, Form } from 'react-final-form'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CircularProgress from '@material-ui/core/CircularProgress'
import Link from '@material-ui/core/Link'
import TextField from '@material-ui/core/TextField'
import { ThemeProvider } from '@material-ui/core/styles'
import {
  createMuiTheme,
  useLogin,
  useNotify,
  useRefresh,
  useSetLocale,
  useTranslate,
  useVersion,
} from 'react-admin'
import Logo from '../icons/android-icon-192x192.png'

import Notification from './Notification'
import FormUserSignUp from './FormUserSignUp'
import useCurrentTheme from '../themes/useCurrentTheme'
import config from '../config'
import { clearQueue } from '../actions'
import { retrieveTranslation } from '../i18n'
import { INSIGHTS_DOC_URL } from '../consts.js'
import useLoginStyles from './useLoginStyles'

const renderInput = ({
  meta: { touched, error } = {},
  input: { ...inputProps },
  ...props
}) => (
  <TextField
    error={!!(touched && error)}
    helperText={touched && error}
    {...inputProps}
    {...props}
    fullWidth
  />
)

const FormLogin = ({
  loading,
  handleSubmit,
  validate,
  onContinueAsGuest,
  onOpenSignup,
  showGuestActions,
  showSelfSignup,
}) => {
  const translate = useTranslate()
  const classes = useLoginStyles()

  return (
    <Form
      onSubmit={handleSubmit}
      validate={validate}
      render={({ handleSubmit }) => (
        <form onSubmit={handleSubmit} noValidate>
          <div className={classes.main}>
            <Card className={classes.card}>
              <div className={classes.avatar}>
                <img src={Logo} className={classes.icon} alt={'logo'} />
              </div>
              <div className={classes.systemName}>
                <a
                  href="https://www.japtapsamagams.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.systemNameLink}
                >
                  Jap Tap Samagams
                </a>
              </div>
              {config.welcomeMessage && (
                <div
                  className={classes.welcome}
                  dangerouslySetInnerHTML={{ __html: config.welcomeMessage }}
                />
              )}
              <div className={classes.form}>
                <div className={classes.input}>
                  <Field
                    autoFocus
                    name="username"
                    component={renderInput}
                    label={translate('ra.auth.username')}
                    disabled={loading}
                    spellCheck={false}
                  />
                </div>
                <div className={classes.input}>
                  <Field
                    name="password"
                    component={renderInput}
                    label={translate('ra.auth.password')}
                    type="password"
                    disabled={loading}
                  />
                </div>
              </div>
              <CardActions className={classes.actions}>
                <Button
                  variant="contained"
                  type="submit"
                  color="primary"
                  disabled={loading}
                  className={classes.button}
                  fullWidth
                >
                  {loading && <CircularProgress size={25} thickness={2} />}
                  {translate('ra.auth.sign_in')}
                </Button>
              </CardActions>
              {showGuestActions && (
                <div className={classes.guestActions}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={onContinueAsGuest}
                    disabled={loading}
                    className={`${classes.guestActionButton} ${classes.guestOutlinedButton}`}
                    disableElevation
                  >
                    {translate('ra.auth.continue_as_guest')}
                  </Button>
                  {showSelfSignup && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={onOpenSignup}
                      disabled={loading}
                      className={`${classes.guestActionButton} ${classes.guestContainedButton}`}
                      disableElevation
                    >
                      {translate('ra.auth.user_signup')}
                    </Button>
                  )}
                </div>
              )}
            </Card>
            <Notification />
          </div>
        </form>
      )}
    />
  )
}

const InsightsNotice = ({ url }) => {
  const translate = useTranslate()
  const classes = useLoginStyles()

  const anchorRegex = /\[(.+?)]/g
  const originalMsg = translate('ra.auth.insightsCollectionNote')

  // Split the entire message on newlines
  const lines = originalMsg.split('\n')

  const renderedLines = lines.map((line, lineIndex) => {
    const segments = []
    let lastIndex = 0
    let match

    // Find bracketed text in each line
    while ((match = anchorRegex.exec(line)) !== null) {
      // match.index is where "[something]" starts
      // match[1] is the text inside the brackets
      const bracketText = match[1]

      // Push the text before the bracket
      segments.push(line.slice(lastIndex, match.index))

      // Push the <Link> component
      segments.push(
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          key={`${lineIndex}-${match.index}`}
          style={{ cursor: 'pointer' }}
        >
          {bracketText}
        </Link>,
      )

      // Update lastIndex to the character right after the bracketed text
      lastIndex = match.index + match[0].length
    }

    // Push the remaining text after the last bracket
    segments.push(line.slice(lastIndex))

    // Return this line’s parts, plus a <br/> if not the last line
    return (
      <React.Fragment key={lineIndex}>
        {segments}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    )
  })

  return <div className={classes.message}>{renderedLines}</div>
}

const FormSignUp = ({ loading, handleSubmit, validate }) => {
  const translate = useTranslate()
  const classes = useLoginStyles()

  return (
    <Form
      onSubmit={handleSubmit}
      validate={validate}
      render={({ handleSubmit }) => (
        <form onSubmit={handleSubmit} noValidate>
          <div className={classes.main}>
            <Card className={classes.card}>
              <div className={classes.avatar}>
                <img src={Logo} className={classes.icon} alt={'logo'} />
              </div>
              <div className={classes.welcome}>
                {translate('ra.auth.welcome1')}
              </div>
              <div className={classes.welcome}>
                {translate('ra.auth.welcome2')}
              </div>
              <div className={classes.form}>
                <div className={classes.input}>
                  <Field
                    autoFocus
                    name="username"
                    component={renderInput}
                    label={translate('ra.auth.username')}
                    disabled={loading}
                    spellCheck={false}
                  />
                </div>
                <div className={classes.input}>
                  <Field
                    name="password"
                    component={renderInput}
                    label={translate('ra.auth.password')}
                    type="password"
                    disabled={loading}
                  />
                </div>
                <div className={classes.input}>
                  <Field
                    name="confirmPassword"
                    component={renderInput}
                    label={translate('ra.auth.confirmPassword')}
                    type="password"
                    disabled={loading}
                  />
                </div>
              </div>
              <CardActions className={classes.actions}>
                <Button
                  variant="contained"
                  type="submit"
                  color="primary"
                  disabled={loading}
                  className={classes.button}
                  fullWidth
                >
                  {loading && <CircularProgress size={25} thickness={2} />}
                  {translate('ra.auth.buttonCreateAdmin')}
                </Button>
              </CardActions>
              <InsightsNotice url={INSIGHTS_DOC_URL} />
            </Card>
            <Notification />
          </div>
        </form>
      )}
    />
  )
}

const Login = ({ location }) => {
  const [loading, setLoading] = useState(false)
  const translate = useTranslate()
  const notify = useNotify()
  const login = useLogin()
  const dispatch = useDispatch()
  const history = useHistory()

  const searchParams = useMemo(
    () => new URLSearchParams(location?.search || ''),
    [location?.search],
  )
  const requestedPath = location?.state?.nextPathname
  const hashIncludesSignup =
    typeof window !== 'undefined' && window.location.hash.includes('/signup')
  const wantsSignup =
    searchParams.get('signup') === '1' ||
    requestedPath === '/signup' ||
    location?.pathname === '/signup' ||
    hashIncludesSignup
  const needsAdmin = Boolean(config.firstTime)
  const allowSelfSignup = Boolean(config.enableUserSelfSignup)

  const handleSubmit = useCallback(
    (auth) => {
      setLoading(true)
      dispatch(clearQueue())
      login(auth, location.state ? location.state.nextPathname : '/').catch(
        (error) => {
          setLoading(false)
          notify(
            typeof error === 'string'
              ? error
              : typeof error === 'undefined' || !error.message
                ? 'ra.auth.sign_in_error'
                : error.message,
            'warning',
          )
        },
      )
    },
    [dispatch, login, notify, setLoading, location],
  )

  const validateLogin = useCallback(
    (values) => {
      const errors = {}
      if (!values.username) {
        errors.username = translate('ra.validation.required')
      }
      if (!values.password) {
        errors.password = translate('ra.validation.required')
      }
      return errors
    },
    [translate],
  )

  const validateSignup = useCallback(
    (values) => {
      const errors = validateLogin(values)
      const regex = /^\w+$/g
      if (values.username && !values.username.match(regex)) {
        errors.username = translate('ra.validation.invalidChars')
      }
      if (!values.confirmPassword) {
        errors.confirmPassword = translate('ra.validation.required')
      }
      if (values.confirmPassword !== values.password) {
        errors.confirmPassword = translate('ra.validation.passwordDoesNotMatch')
      }
      return errors
    },
    [translate, validateLogin],
  )

  const updateHashSilently = useCallback((hash) => {
    if (typeof window === 'undefined') {
      return
    }
    const base = `${window.location.origin}${window.location.pathname}`
    window.history.replaceState({}, '', `${base}${hash}`)
  }, [])

  const handleContinueAsGuest = useCallback(() => {
    localStorage.setItem('ND_GUEST', 'true')
    localStorage.setItem('is-authenticated', 'guest')
    localStorage.setItem('role', 'guest')
    localStorage.setItem('username', 'guest')
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('avatar')
    localStorage.removeItem('subsonic-salt')
    localStorage.removeItem('subsonic-token')
    localStorage.setItem('name', 'Guest')
    dispatch(clearQueue())
    const target = `${window.location.origin}${window.location.pathname}`
    window.location.assign(target)
  }, [dispatch])

  const handleOpenSignup = useCallback(() => {
    if (!allowSelfSignup) {
      return
    }
    history.push('/login?signup=1')
    updateHashSilently('#/signup')
  }, [allowSelfSignup, history, updateHashSilently])

  const handleBackToLogin = useCallback(() => {
    history.push('/login')
    updateHashSilently('#/login')
  }, [history, updateHashSilently])

  const showUserSignup = allowSelfSignup && !needsAdmin && wantsSignup

  if (needsAdmin) {
    return (
      <FormSignUp
        handleSubmit={handleSubmit}
        validate={validateSignup}
        loading={loading}
      />
    )
  }
  if (showUserSignup) {
    return <FormUserSignUp onBackToLogin={handleBackToLogin} />
  }
  return (
    <FormLogin
      handleSubmit={handleSubmit}
      validate={validateLogin}
      loading={loading}
      onContinueAsGuest={handleContinueAsGuest}
      onOpenSignup={handleOpenSignup}
      showGuestActions={!needsAdmin}
      showSelfSignup={allowSelfSignup && !needsAdmin}
    />
  )
}

Login.propTypes = {
  authProvider: PropTypes.func,
  previousRoute: PropTypes.string,
}

// We need to put the ThemeProvider decoration in another component
// Because otherwise the useLoginStyles() hook used in Login won't get
// the right theme
const LoginWithTheme = (props) => {
  const theme = useCurrentTheme()
  const setLocale = useSetLocale()
  const refresh = useRefresh()
  const version = useVersion()

  useEffect(() => {
    if (config.defaultLanguage !== '' && !localStorage.getItem('locale')) {
      retrieveTranslation(config.defaultLanguage)
        .then(() => {
          setLocale(config.defaultLanguage).then(() => {
            localStorage.setItem('locale', config.defaultLanguage)
          })
          refresh(true)
        })
        .catch((e) => {
          throw new Error(
            'Cannot load language "' + config.defaultLanguage + '": ' + e,
          )
        })
    }
  }, [refresh, setLocale])

  return (
    <ThemeProvider theme={createMuiTheme(theme)}>
      <Login key={version} {...props} />
    </ThemeProvider>
  )
}

export default LoginWithTheme
