import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import Avatar from '@material-ui/core/Avatar'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemText from '@material-ui/core/ListItemText'
import Card from '@material-ui/core/Card'
import CardMedia from '@material-ui/core/CardMedia'
import { makeStyles } from '@material-ui/core/styles'
import { Link } from 'react-router-dom'
import { linkToRecord, sanitizeListRestProps } from 'react-admin'
import subsonic from '../subsonic'

const useStyles = makeStyles(
  (theme) => ({
    link: {
      textDecoration: 'none',
      color: 'inherit',
    },
    tertiary: { 
      float: 'right', 
      opacity: 0.541176 
    },
    list: {
      padding: 0,
    },
    card: {
      margin: theme.spacing(0.5),
      borderRadius: '22px',
      border: `1px solid ${theme.palette.divider}20`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)',
      transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.08)',
      },
    },
    listItem: {
      borderRadius: '22px',
      padding: theme.spacing(1, 2),
    },
    coverParent: {
      height: '48px',
      width: '48px',
      minWidth: '48px',
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing(2),
      borderRadius: '12px',
      overflow: 'hidden',
    },
    cover: {
      objectFit: 'cover',
      display: 'block',
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
      transition: 'opacity 0.3s ease-in-out',
    },
    coverLoading: {
      opacity: 0.5,
    },
    avatarFallback: {
      backgroundColor: theme.palette.grey[300],
      color: theme.palette.text.secondary,
      fontSize: '0.9rem',
      fontWeight: 500,
    },
  }),
  { name: 'RaSimpleList' },
)

const CoverMedia = ({ record, coverSrc, classes }) => {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = useCallback(() => {
    setImageLoading(false)
    setImageError(false)
  }, [])

  const handleImageError = useCallback(() => {
    setImageLoading(false)
    setImageError(true)
  }, [])

  const imageUrl = coverSrc ? coverSrc(record) : subsonic.getCoverArtUrl(record, 48)

  // Generate initials for fallback
  const getInitials = (record) => {
    const name = record.name || record.title || ''
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  if (!imageUrl || imageError) {
    return (
      <div className={classes.coverParent}>
        <Avatar className={classes.avatarFallback}>
          {getInitials(record)}
        </Avatar>
      </div>
    )
  }

  return (
    <div className={classes.coverParent}>
      <CardMedia
        component="img"
        src={imageUrl}
        className={`${classes.cover} ${imageLoading ? classes.coverLoading : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
        alt={record.name || record.title || 'Cover'}
      />
    </div>
  )
}

const LinkOrNot = ({
  classes: classesOverride,
  linkType,
  basePath,
  id,
  record,
  children,
}) => {
  const classes = useStyles({ classes: classesOverride })
  return linkType === 'edit' || linkType === true ? (
    <Link to={linkToRecord(basePath, id)} className={classes.link}>
      {children}
    </Link>
  ) : linkType === 'show' ? (
    <Link to={`${linkToRecord(basePath, id)}/show`} className={classes.link}>
      {children}
    </Link>
  ) : typeof linkType === 'function' ? (
    <span onClick={() => linkType(id, basePath, record)}>{children}</span>
  ) : (
    <span>{children}</span>
  )
}

export const SimpleList = ({
  basePath,
  className,
  classes: classesOverride,
  data,
  hasBulkActions,
  ids,
  loading,
  leftAvatar,
  leftIcon,
  linkType,
  onToggleItem,
  primaryText,
  rightAvatar,
  rightIcon,
  secondaryText,
  selectedIds,
  tertiaryText,
  total,
  showCover = false,
  coverSrc,
  ...rest
}) => {
  const classes = useStyles({ classes: classesOverride })
  
  return (
    (loading || total > 0) && (
      <List className={`${classes.list} ${className}`} {...sanitizeListRestProps(rest)}>
        {ids.map((id) => {
          const record = data[id]
          return (
            <Card key={id} className={classes.card}>
              <LinkOrNot
                linkType={linkType}
                basePath={basePath}
                id={id}
                record={record}
              >
                <ListItem button={!!linkType} className={classes.listItem}>
                  {showCover ? (
                    <CoverMedia record={record} coverSrc={coverSrc} classes={classes} />
                  ) : (
                    <>
                      {leftIcon && (
                        <ListItemIcon>{leftIcon(record, id)}</ListItemIcon>
                      )}
                      {leftAvatar && (
                        <ListItemAvatar>
                          <Avatar>{leftAvatar(record, id)}</Avatar>
                        </ListItemAvatar>
                      )}
                    </>
                  )}
                  <ListItemText
                    primary={
                      <div>
                        {primaryText(record, id)}
                        {tertiaryText && (
                          <span className={classes.tertiary}>
                            {tertiaryText(record, id)}
                          </span>
                        )}
                      </div>
                    }
                    secondary={secondaryText && secondaryText(record, id)}
                  />
                  {(rightAvatar || rightIcon) && (
                    <ListItemSecondaryAction>
                      {rightAvatar && <Avatar>{rightAvatar(record, id)}</Avatar>}
                      {rightIcon && (
                        <ListItemIcon>{rightIcon(record, id)}</ListItemIcon>
                      )}
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              </LinkOrNot>
            </Card>
          )
        })}
      </List>
    )
  )
}

SimpleList.propTypes = {
  basePath: PropTypes.string,
  className: PropTypes.string,
  classes: PropTypes.object,
  data: PropTypes.object,
  hasBulkActions: PropTypes.bool.isRequired,
  ids: PropTypes.array,
  leftAvatar: PropTypes.func,
  leftIcon: PropTypes.func,
  linkType: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
    PropTypes.func,
  ]).isRequired,
  onToggleItem: PropTypes.func,
  primaryText: PropTypes.func,
  rightAvatar: PropTypes.func,
  rightIcon: PropTypes.func,
  secondaryText: PropTypes.func,
  selectedIds: PropTypes.arrayOf(PropTypes.any).isRequired,
  tertiaryText: PropTypes.func,
  showCover: PropTypes.bool,
  coverSrc: PropTypes.func,
}

SimpleList.defaultProps = {
  linkType: 'edit',
  hasBulkActions: false,
  selectedIds: [],
  showCover: false,
}
