import React from 'react'
import { useDispatch } from 'react-redux'
import {
  sanitizeListRestProps,
  TopToolbar,
  useTranslate,
  useDataProvider,
  useNotify,
  usePermissions,
} from 'react-admin'
import {
  Button as MuiButton,
  useMediaQuery,
  makeStyles,
} from '@material-ui/core'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import ShuffleIcon from '@material-ui/icons/Shuffle'
import CloudDownloadOutlinedIcon from '@material-ui/icons/CloudDownloadOutlined'
import { RiPlayListAddFill, RiPlayList2Fill } from 'react-icons/ri'
import QueueMusicIcon from '@material-ui/icons/QueueMusic'
import ShareIcon from '@material-ui/icons/Share'
import { httpClient } from '../dataProvider'
import {
  playNext,
  addTracks,
  playTracks,
  shuffleTracks,
  openDownloadMenu,
  DOWNLOAD_MENU_PLAY,
  openShareMenu,
} from '../actions'
import { M3U_MIME_TYPE, REST_URL } from '../consts'
import PropTypes from 'prop-types'
import { formatBytes } from '../utils'
import config from '../config'
import { ToggleFieldsMenu } from '../common'

const useStyles = makeStyles({
  toolbar: { display: 'flex', justifyContent: 'space-between', width: '100%' },
})

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

const baseButtonSx = {
  borderRadius: 1.5,
  px: 1.5,
  gap: 1,
  minHeight: 44,
  textTransform: 'none',
}

const PlaylistButton = ({
  children,
  label,
  disabled,
  className,
  style,
  sx,
  ...rest
}) => {
  const sanitizedProps = sanitizeButtonProps(rest)
  const { style: sanitizedStyle, ...buttonProps } = sanitizedProps
  return (
    <MuiButton
      {...buttonProps}
      className={className}
      startIcon={children}
      disabled={disabled}
      aria-label={typeof label === 'string' ? label : undefined}
      style={{ minWidth: 0, ...(sanitizedStyle || {}), ...(style || {}) }}
      color="primary"
      variant="text"
      sx={{ ...baseButtonSx, ...(sx || {}) }}
    >
      {label}
    </MuiButton>
  )
}

const PlaylistActions = ({ className, ids, data, record, ...rest }) => {
  const dispatch = useDispatch()
  const translate = useTranslate()
  const classes = useStyles()
  const dataProvider = useDataProvider()
  const notify = useNotify()
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'))
  const isNotSmall = useMediaQuery((theme) => theme.breakpoints.up('sm'))
  // const { identity } = useGetIdentity()
  // const currentUser = localStorage.getItem('username') || identity?.id
  const { permissions } = usePermissions()

  const getAllSongsAndDispatch = React.useCallback(
    (action) => {
      if (ids?.length === record.songCount) {
        return dispatch(action(data, ids))
      }

      dataProvider
        .getList('playlistTrack', {
          pagination: { page: 1, perPage: 0 },
          sort: { field: 'id', order: 'ASC' },
          filter: { playlist_id: record.id },
        })
        .then((res) => {
          const data = res.data.reduce(
            (acc, curr) => ({ ...acc, [curr.id]: curr }),
            {},
          )
          dispatch(action(data))
        })
        .catch(() => {
          notify('ra.page.error', 'warning')
        })
    },
    [dataProvider, dispatch, record, data, ids, notify],
  )

  const handlePlay = React.useCallback(() => {
    getAllSongsAndDispatch(playTracks)
  }, [getAllSongsAndDispatch])

  const handlePlayNext = React.useCallback(() => {
    getAllSongsAndDispatch(playNext)
  }, [getAllSongsAndDispatch])

  const handlePlayLater = React.useCallback(() => {
    getAllSongsAndDispatch(addTracks)
  }, [getAllSongsAndDispatch])

  const handleShuffle = React.useCallback(() => {
    getAllSongsAndDispatch(shuffleTracks)
  }, [getAllSongsAndDispatch])

  const handleShare = React.useCallback(() => {
    dispatch(openShareMenu([record.id], 'playlist', record.name))
  }, [dispatch, record])

  const handleDownload = React.useCallback(() => {
    dispatch(openDownloadMenu(record, DOWNLOAD_MENU_PLAY))
  }, [dispatch, record])

  const handleExport = React.useCallback(
    () =>
      httpClient(`${REST_URL}/playlist/${record.id}/tracks`, {
        headers: new Headers({ Accept: M3U_MIME_TYPE }),
      }).then((res) => {
        const blob = new Blob([res.body], { type: M3U_MIME_TYPE })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${record.name}.m3u`
        document.body.appendChild(link)
        link.click()
        link.parentNode.removeChild(link)
      }),
    [record],
  )

  return (
    <TopToolbar className={className} {...sanitizeListRestProps(rest)}>
      <div className={classes.toolbar}>
        <div>
          <PlaylistButton
            onClick={handlePlay}
            label={translate('resources.album.actions.playAll')}
          >
            <PlayArrowIcon />
          </PlaylistButton>
          <PlaylistButton
            onClick={handleShuffle}
            label={translate('resources.album.actions.shuffle')}
          >
            <ShuffleIcon />
          </PlaylistButton>
          <PlaylistButton
            onClick={handlePlayNext}
            label={translate('resources.album.actions.playNext')}
          >
            <RiPlayList2Fill />
          </PlaylistButton>
          <PlaylistButton
            onClick={handlePlayLater}
            label={translate('resources.album.actions.addToQueue')}
          >
            <RiPlayListAddFill />
          </PlaylistButton>
          {config.enableSharing && permissions === 'admin' && (
            <PlaylistButton
              onClick={handleShare}
              label={translate('ra.action.share')}
            >
              <ShareIcon />
            </PlaylistButton>
          )}
          {config.enableDownloads && (
            <PlaylistButton
              onClick={handleDownload}
              label={
                translate('ra.action.download') +
                (isDesktop ? ` (${formatBytes(record.size)})` : '')
              }
            >
              <CloudDownloadOutlinedIcon />
            </PlaylistButton>
          )}
          {config.enableSharing && permissions === 'admin' && (
            <PlaylistButton
              onClick={handleExport}
              label={translate('resources.playlist.actions.export')}
            >
              <QueueMusicIcon />
            </PlaylistButton>
          )}
        </div>
        <div>{isNotSmall && <ToggleFieldsMenu resource="playlistTrack" />}</div>
      </div>
    </TopToolbar>
  )
}

PlaylistActions.propTypes = {
  record: PropTypes.object.isRequired,
  selectedIds: PropTypes.arrayOf(PropTypes.number),
}

PlaylistActions.defaultProps = {
  record: {},
  selectedIds: [],
  onUnselectItems: () => null,
}

export default PlaylistActions
