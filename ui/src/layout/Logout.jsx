import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  Logout as RALogout,
  useGetIdentity,
  useTranslate,
} from 'react-admin'
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
    // Hard redirect to Authentik outpost start URL.
    // 'rd' tells Authentik where to return the user after OAuth success.
    window.location.href =
      '/outpost.goauthentik.io/start?rd=' + encodeURIComponent(window.location.href)
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
