import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useRecordContext } from 'react-admin'
import { Button as MuiButton, makeStyles } from '@material-ui/core'
import clsx from 'clsx'
import { LineWeight } from '@material-ui/icons'

const sanitizeButtonProps = ({
  basePath,
  handleSubmit,
  handleSubmitWithRedirect,
  invalid,
  onSave,
  pristine,
  record,
  redirect,
  resource,
  saving,
  submitOnEnter,
  undoable,
  sx,
  ...rest
}) => rest

const useAlbumButtonStyles = makeStyles((theme) => ({
  root: {
    minWidth: 0,
    textTransform: 'none',
    color: theme.palette.primary?.main || theme.palette.text?.primary,
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    '& .MuiButton-startIcon': {
      marginRight: theme.spacing(0.5),
    },
    '& .MuiSvgIcon-root, & svg': {
      color: 'inherit',
      'line-height': 0,
    },
  },
}))

const AlbumButton = ({
  children,
  label,
  disabled,
  className,
  style,
  ...rest
}) => {
  const record = useRecordContext(rest) || {}
  const icon = React.Children.count(children)
    ? React.Children.toArray(children)[0]
    : undefined
  const sanitizedProps = sanitizeButtonProps(rest)
  const { style: sanitizedStyle, ...buttonProps } = sanitizedProps
  const classes = useAlbumButtonStyles()
  const combinedStyle = { ...(sanitizedStyle || {}), ...(style || {}) }

  return (
    <MuiButton
      {...buttonProps}
      className={clsx(classes.root, className)}
      startIcon={icon}
      color="primary"
      variant="text"
      disableElevation
      size="small"
      disabled={record.missing || disabled}
      aria-label={typeof label === 'string' ? label : undefined}
      style={combinedStyle}
    >
      {label}
    </MuiButton>
  )
}

export default AlbumButton
