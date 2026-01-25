import React, { useCallback } from 'react'
import {
  MenuItemLink,
  useDataProvider,
  useNotify,
  useQueryWithStore,
  useGetIdentity,
} from 'react-admin'
import { useHistory } from 'react-router-dom'
import QueueMusicIcon from '@material-ui/icons/QueueMusic'
import { Typography } from '@material-ui/core'
import { useTheme } from '@material-ui/core/styles'
import QueueMusicOutlinedIcon from '@material-ui/icons/QueueMusicOutlined'
import { BiDotsVerticalRounded, BiMenu, BiListUl, BiSolidPlusCircle, BiCog } from 'react-icons/bi'
import { useDrop } from 'react-dnd'
import SubMenu from './SubMenu'
import { canChangeTracks } from '../common'
import { DraggableTypes } from '../consts'
import config from '../config'

const PlaylistMenuItemLink = ({ pls, sidebarIsOpen }) => {
  const dataProvider = useDataProvider()
  const notify = useNotify()

  const [, dropRef] = useDrop(() => ({
    accept: canChangeTracks(pls) ? DraggableTypes.ALL : [],
    drop: (item) =>
      dataProvider
        .addToPlaylist(pls.id, item)
        .then((res) => {
          notify('message.songsAddedToPlaylist', 'info', {
            smart_count: res.data?.added,
          })
        })
        .catch(() => {
          notify('ra.page.error', 'warning')
        }),
  }))

  return (
    <MenuItemLink
      to={`/playlist/${pls.id}/show`}
      primaryText={
        <Typography variant="inherit" noWrap ref={dropRef}>
          {pls.name}
        </Typography>
      }
      sidebarIsOpen={sidebarIsOpen}
      dense={false}
      style={{ marginLeft: '2rem' }}
    />
  )
}

const PlaylistsSubMenu = ({ state, setState, sidebarIsOpen, dense }) => {
  const history = useHistory()
  const theme = useTheme()
  const { data, loaded } = useQueryWithStore({
    type: 'getList',
    resource: 'playlist',
    payload: {
      pagination: {
        page: 0,
        perPage: config.maxSidebarPlaylists,
      },
      sort: { field: 'name' },
    },
  })

  const { identity } = useGetIdentity()
  const currentUser = identity?.id

  const handleToggle = (menu) => {
    setState((state) => ({ ...state, [menu]: !state[menu] }))
  }

  const renderPlaylistMenuItemLink = (pls) => (
    <PlaylistMenuItemLink
      pls={pls}
      sidebarIsOpen={sidebarIsOpen}
      key={pls.id}
    />
  )

  const userId = localStorage.getItem('userId')
  const myPlaylists = []
  const sharedPlaylists = []

  if (loaded && data) {
    const allPlaylists = Object.keys(data).map((id) => data[id])

    allPlaylists.forEach((pls) => {
      if (userId === pls.ownerId) {
        myPlaylists.push(pls)
      } else {
        sharedPlaylists.push(pls)
      }
    })
  }

  const onPlaylistConfig = useCallback(
    () => history.push('/playlist'),
    [history],
  )

  const onPlaylistAdd = useCallback(
    () => history.push('/playlist/create'),
    [history],
  )

  return (
    <>
      {currentUser !== config.defaultUser && (
        <SubMenu
          handleToggle={() => handleToggle('menuPlaylists')}
          isOpen={state.menuPlaylists}
          sidebarIsOpen={sidebarIsOpen}
          name={'menu.playlists'}
          icon={<QueueMusicIcon />}
          dense={dense}
          actionIcon2={
            <BiMenu
              style={{
                color: theme.palette.primary.main,
                fontSize: '1.5rem',
                fontWeight: 'bold',
              }}
            />
          }
          onAction2={onPlaylistConfig}
          actionIcon={
            <BiSolidPlusCircle
              style={{
                color: theme.palette.primary.main,
                fontSize: '1.5rem',
              }}
            />
          }
          onAction={onPlaylistAdd}
        >
           {/* <MenuItemLink
              to={`/playlist/create`}
              primaryText={
                <Typography variant="inherit" noWrap>
                  {'Add Playlist'}
                </Typography>
              }
              sidebarIsOpen={sidebarIsOpen}
              dense={false}
              style={{ marginLeft: '2rem' }}
            /> */}
          {myPlaylists.map(renderPlaylistMenuItemLink)}
        </SubMenu>
      )}
      {sharedPlaylists?.length > 0 && (
        <SubMenu
          handleToggle={() => handleToggle('menuSharedPlaylists')}
          isOpen={state.menuSharedPlaylists}
          sidebarIsOpen={sidebarIsOpen}
          name={'menu.sharedPlaylists'}
          icon={<QueueMusicOutlinedIcon />}
          dense={dense}
        >
          {sharedPlaylists.map(renderPlaylistMenuItemLink)}
        </SubMenu>
      )}
    </>
  )
}

export default PlaylistsSubMenu
