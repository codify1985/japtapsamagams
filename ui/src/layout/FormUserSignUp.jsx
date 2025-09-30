import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { Field, Form } from 'react-final-form'
import { useDispatch } from 'react-redux'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CircularProgress from '@material-ui/core/CircularProgress'
import TextField from '@material-ui/core/TextField'
import { useTranslate, useNotify, useLogin } from 'react-admin'

import Logo from '../icons/android-icon-192x192.png'
import Notification from './Notification'
import useLoginStyles from './useLoginStyles'
import { REST_URL } from '../consts'
import { baseUrl } from '../utils'
import { clearQueue } from '../actions'

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

const FormUserSignUp = ({ onBackToLogin }) => {
  const classes = useLoginStyles()
  const translate = useTranslate()
  const notify = useNotify()
  const login = useLogin()
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  const validate = useCallback(
    (values) => {
      const errors = {}
      const usernameRegex = /^\w+$/
      if (!values.username) {
        errors.username = translate('ra.validation.required')
      } else if (!usernameRegex.test(values.username)) {
        errors.username = translate('ra.validation.invalidChars')
      }
      if (!values.name) {
        errors.name = translate('ra.validation.required')
      }
      if (values.email) {
        // Basic email validation to catch obvious typos
        const emailRegex = /.+@.+\..+/
        if (!emailRegex.test(values.email)) {
          errors.email = translate('ra.validation.email')
        }
      }
      if (!values.password) {
        errors.password = translate('ra.validation.required')
      }
      if (!values.confirmPassword) {
        errors.confirmPassword = translate('ra.validation.required')
      } else if (values.confirmPassword !== values.password) {
        errors.confirmPassword = translate('ra.validation.passwordDoesNotMatch')
      }
      return errors
    },
    [translate],
  )

  const handleSubmit = useCallback(
    async (values) => {
      setLoading(true)
      try {
        //self-signup
        const response = await fetch(baseUrl(`${REST_URL}/user`), {
          method: 'POST',
          body: JSON.stringify({
            username: values.username,
            name: values.name,
            email: values.email || '',
            password: values.password,
            confirmPassword: values.confirmPassword,
            isAdmin: false,
          }),
          headers: new Headers({ 'Content-Type': 'application/json' }),
        })

        if (!response.ok) {
          let message = 'ra.auth.sign_in_error'
          try {
            const body = await response.json()
            if (body?.errors) {
              const firstError = Object.values(body.errors)[0]
              if (typeof firstError === 'string') {
                message = firstError
              }
            } else if (body?.message) {
              message = body.message
            } else if (body?.error) {
              message = body.error
            }
          } catch (e) {
            // Ignore JSON parse errors and use default message
          }
          throw new Error(message)
        }

        localStorage.removeItem('ND_GUEST')
        await login(
          { username: values.username, password: values.password },
          '/',
        )
        dispatch(clearQueue())
        const target = `${window.location.origin}${window.location.pathname}`
        window.location.assign(target)
      } catch (error) {
        setLoading(false)
        notify(error.message || 'ra.auth.sign_in_error', 'warning')
      }
    },
    [dispatch, login, notify],
  )

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
              <div className={classes.welcome}>
                {translate('ra.auth.create_account')}
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
                    name="name"
                    component={renderInput}
                    label={translate('resources.user.fields.name')}
                    disabled={loading}
                  />
                </div>
                <div className={classes.input}>
                  <Field
                    name="email"
                    component={renderInput}
                    label={translate('resources.user.fields.email', {
                      _: 'Email',
                    })}
                    disabled={loading}
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
                  {translate('ra.auth.create_account')}
                </Button>
                <Button
                  type="button"
                  color="primary"
                  onClick={onBackToLogin}
                  disabled={loading}
                  className={classes.textButton}
                >
                  {translate('ra.auth.sign_in')}
                </Button>
              </CardActions>
            </Card>
            <Notification />
          </div>
        </form>
      )}
    />
  )
}

FormUserSignUp.propTypes = {
  onBackToLogin: PropTypes.func.isRequired,
}

export default FormUserSignUp
