import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useGetIdentity, useTranslate } from 'react-admin'
import { MenuItem, ListItemIcon, useMediaQuery } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import LockOpenIcon from '@material-ui/icons/LockOpen'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
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
  const { className } = props
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

  // Guest → Login: clear the existing japtaptest JWT first, then redirect.
  // Navidrome checks JWT before Remote-User header — if old token stays in localStorage
  // Navidrome will use it and ignore the Google user from Vouch.
  const handleLoginClick = useCallback(() => {
    handleClearQueue()
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('avatar')
    localStorage.removeItem('subsonic-salt')
    localStorage.removeItem('subsonic-token')
    localStorage.removeItem('is-authenticated')
    localStorage.removeItem('username')
    localStorage.removeItem('name')
    window.location.assign('/login')
  }, [handleClearQueue])

  // Authenticated → Logout: clear Navidrome's JWT then redirect to Nginx /logout
  // which tells Vouch to clear the OAuth cookie, then sends user back to / as guest
  const handleLogoutClick = useCallback(() => {
    handleClearQueue()
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('avatar')
    localStorage.removeItem('subsonic-salt')
    localStorage.removeItem('subsonic-token')
    localStorage.removeItem('is-authenticated')
    localStorage.removeItem('username')
    localStorage.removeItem('name')
    window.location.assign('/logout')
  }, [handleClearQueue])

  if (isDefaultUser) {
    return (
      <MenuItem
        className={clsx('login', classes.menuItem, className)}
        component={isXSmall ? 'span' : 'li'}
        onClick={handleLoginClick}
      >
        <ListItemIcon className={classes.icon}>
          <LockOpenIcon />
        </ListItemIcon>
        {translate('ra.auth.sign_in')}
      </MenuItem>
    )
  }

  return (
    <MenuItem
      className={clsx('logout', classes.menuItem, className)}
      component={isXSmall ? 'span' : 'li'}
      onClick={handleLogoutClick}
    >
      <ListItemIcon className={classes.icon}>
        <ExitToAppIcon />
      </ListItemIcon>
      {translate('ra.auth.logout')}
    </MenuItem>
  )
}

export default Logout
