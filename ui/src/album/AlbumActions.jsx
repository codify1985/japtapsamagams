import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import {
  sanitizeListRestProps,
  TopToolbar,
  useRecordContext,
  useTranslate,
  useGetIdentity,
} from 'react-admin'
import {
  Button as MuiButton,
  useMediaQuery,
  makeStyles,
} from '@material-ui/core'
import clsx from 'clsx'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import ShuffleIcon from '@material-ui/icons/Shuffle'
import CloudDownloadOutlinedIcon from '@material-ui/icons/CloudDownloadOutlined'
import { RiPlayListAddFill, RiPlayList2Fill } from 'react-icons/ri'
import PlaylistAddIcon from '@material-ui/icons/PlaylistAdd'
import {
  playNext,
  addTracks,
  playTracks,
  shuffleTracks,
  openAddToPlaylist,
  openDownloadMenu,
  DOWNLOAD_MENU_ALBUM,
} from '../actions'
import { formatBytes } from '../utils'
import config, { isFavouritesEnabledForCurrentUser } from '../config'
import { ToggleFieldsMenu } from '../common'
import ShareButton from '../common/ShareButton'
import AlbumButton from './AlbumButton'

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

const AlbumActions = ({
  className,
  ids,
  data,
  record,
  permanentFilter,
  ...rest
}) => {
  const dispatch = useDispatch()
  const translate = useTranslate()
  const classes = useStyles()
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'))
  const isNotSmall = useMediaQuery((theme) => theme.breakpoints.up('sm'))
  const { identity } = useGetIdentity()

  const currentUser = localStorage.getItem('username') || identity?.id

  const handlePlay = React.useCallback(() => {
    dispatch(playTracks(data, ids))
  }, [dispatch, data, ids])

  const handlePlayNext = React.useCallback(() => {
    dispatch(playNext(data, ids))
  }, [dispatch, data, ids])

  const handlePlayLater = React.useCallback(() => {
    dispatch(addTracks(data, ids))
  }, [dispatch, data, ids])

  const handleShuffle = React.useCallback(() => {
    dispatch(shuffleTracks(data, ids))
  }, [dispatch, data, ids])

  const handleAddToPlaylist = React.useCallback(() => {
    const selectedIds = ids.filter((id) => !data[id].missing)
    dispatch(openAddToPlaylist({ selectedIds }))
  }, [dispatch, data, ids])

  const handleDownload = React.useCallback(() => {
    dispatch(openDownloadMenu(record, DOWNLOAD_MENU_ALBUM))
  }, [dispatch, record])

  const isFavouritesEnabled = isFavouritesEnabledForCurrentUser(currentUser)

  return (
    <TopToolbar className={className} {...sanitizeListRestProps(rest)}>
      <div className={classes.toolbar}>
        <div>
          <AlbumButton
            onClick={handlePlay}
            label={translate('resources.album.actions.playAll')}
          >
            <PlayArrowIcon />
          </AlbumButton>
          <AlbumButton
            onClick={handleShuffle}
            label={translate('resources.album.actions.shuffle')}
          >
            <ShuffleIcon />
          </AlbumButton>
          {isFavouritesEnabled && (
            <AlbumButton
              onClick={handlePlayNext}
              label={translate('resources.album.actions.playNext')}
            >
              <RiPlayList2Fill />
            </AlbumButton>
          )}
          <AlbumButton
            onClick={handlePlayLater}
            label={translate('resources.album.actions.addToQueue')}
          >
            <RiPlayListAddFill />
          </AlbumButton>
          {isFavouritesEnabled && (
            <AlbumButton
              onClick={handleAddToPlaylist}
              label={translate('resources.album.actions.addToPlaylist')}
            >
              <PlaylistAddIcon />
            </AlbumButton>
          )}
          {config.enableSharing && isFavouritesEnabled && (
            <ShareButton
              record={record}
              entityType="album"
              shareText={`🙏Dhan Guru Nanak🙏: ${record.name}`}
              desktopOptions={['webshare', 'copy', 'qr']}
              qrOptions={{
                width: 250,
                margin: 3,
                errorCorrectionLevel: 'M',
              }}
              allowExternalQrFallback={false}
              label={translate('ra.action.share')}
              alwaysShowLabel
            />
          )}
          {config.enableDownloads && (
            <AlbumButton
              onClick={handleDownload}
              label={
                translate('ra.action.download') +
                (isDesktop ? ` (${formatBytes(record.size)})` : '')
              }
            >
              <CloudDownloadOutlinedIcon />
            </AlbumButton>
          )}
        </div>
        <div>{isNotSmall && <ToggleFieldsMenu resource="albumSong" />}</div>
      </div>
    </TopToolbar>
  )
}

AlbumActions.propTypes = {
  record: PropTypes.object.isRequired,
  selectedIds: PropTypes.arrayOf(PropTypes.number),
}

AlbumActions.defaultProps = {
  record: {},
  selectedIds: [],
}

export default AlbumActions
