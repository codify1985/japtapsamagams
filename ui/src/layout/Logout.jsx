import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Logout as RALogout, useGetIdentity, useTranslate } from 'react-admin'
import { MenuItem, ListItemIcon, useMediaQuery } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import LockOpenIcon from '@material-ui/icons/LockOpen'
import clsx from 'clsx'
import { clearQueue } from '../actions'
import config from '../config'

const useMenuItemStyles = makeStyles(
  (theme) => ({
    menuItem: {
      color: theme.palette.text.secondary,
    },
    icon: { minWidth: theme.spacing(5) },
  }),
  { name: 'NDLoginMenuItem' },
)

const Logout = (props) => {
  const { className, icon, ...rest } = props
  const dispatch = useDispatch()
  const { identity } = useGetIdentity()
  const translate = useTranslate()
  const classes = useMenuItemStyles()
  const isXSmall = useMediaQuery((theme) => theme?.breakpoints.down('xs'))
  const currentUser =
    (typeof window !== 'undefined' && localStorage.getItem('username')) ||
    identity?.id
  const isDefaultUser = currentUser === config.defaultUser

  const handleClearQueue = useCallback(() => dispatch(clearQueue()), [dispatch])

  const handleLoginClick = useCallback(() => {
    handleClearQueue()
    // Redirect to the Navidrome login page, which shows the hybrid
    // username/password + Google sign-in form.
    // 'callbackUrl' is passed through so the Google button can return
    // the user to the page they were on after OAuth completes.
    window.location.href =
      '/app/#/login?callbackUrl=' + encodeURIComponent(window.location.href)
  }, [handleClearQueue])

  if (isDefaultUser) {
    return (
      <MenuItem
        className={clsx('login', classes.menuItem, className)}
        component={isXSmall ? 'span' : 'li'}
        onClick={handleLoginClick}
      >
        <ListItemIcon className={classes.icon}>
          {icon || <LockOpenIcon />}
        </ListItemIcon>
        {translate('ra.auth.sign_in')}
      </MenuItem>
    )
  }

  return (
    <span onClick={handleClearQueue}>
      <RALogout className={className} icon={icon} {...rest} />
    </span>
  )
}

export default Logout
