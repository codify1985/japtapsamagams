import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Divider, makeStyles } from '@material-ui/core'
import clsx from 'clsx'
import { useTranslate, MenuItemLink, getResources } from 'react-admin'
import ViewListIcon from '@material-ui/icons/ViewList'
import AlbumIcon from '@material-ui/icons/Album'
import MusicNoteIcon from '@material-ui/icons/MusicNote'
import HomeIcon from '@material-ui/icons/Home'
import SubMenu from './SubMenu'
import { humanize, pluralize } from 'inflection'
import albumLists from '../album/albumLists'
import PlaylistsSubMenu from './PlaylistsSubMenu'
import LibrarySelector from '../common/LibrarySelector'
import config from '../config'

// Added new Default Library Song Lists here
const songLists = {
  all: {
    params: 'sort=random&order=ASC&page=1&perPage=36&filter={}',
  },
  recentKirtan: {
    params: 'sort=createdAt&order=DESC&page=1&perPage=36&filter={}',
  },
  starred: {
    params:
      'displayedFilters={"starred":true}&filter={"starred":true}&order=ASC&page=1&perPage=15&sort=title',
  },
  simran: {
    params:
      'displayedFilters={}&filter={"title":"simran"}&order=ASC&page=1&perPage=15&sort=random',
  },
}

// Hide specific root-level resources from the song list
const HIDE_ROOT_RESOURCES = new Set(['song', 'share'])

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    paddingBottom: (props) => (props.addPadding ? '80px' : '20px'),
  },
  open: {
    width: 240,
  },
  closed: {
    width: 55,
  },
  active: {
    color: theme.palette.text.primary,
    fontWeight: 'bold',
  },
}))

const translatedResourceName = (resource, translate) =>
  translate(`resources.${resource.name}.name`, {
    smart_count: 2,
    _:
      resource.options && resource.options.label
        ? translate(resource.options.label, {
            smart_count: 2,
            _: resource.options.label,
          })
        : humanize(pluralize(resource.name)),
  })

const Menu = ({ dense = false }) => {
  const open = useSelector((state) => state.admin.ui.sidebarOpen)
  const translate = useTranslate()
  const queue = useSelector((state) => state.player?.queue)
  const classes = useStyles({ addPadding: queue.length > 0 })
  const resources = useSelector(getResources)

  // TODO State is not persisted in mobile when you close the sidebar menu. Move to redux?
  const [state, setState] = useState({
    menuAlbumList: true,
    menuPlaylists: true,
    menuSongList: true, // NEW
    menuSharedPlaylists: true,
  })

  const handleToggle = (menu) => {
    setState((state) => ({ ...state, [menu]: !state[menu] }))
  }

  const renderResourceMenuItemLink = (resource) => (
    <MenuItemLink
      key={resource.name}
      to={`/${resource.name}`}
      activeClassName={classes.active}
      primaryText={translatedResourceName(resource, translate)}
      leftIcon={resource.icon || <ViewListIcon />}
      sidebarIsOpen={open}
      dense={dense}
    />
  )

  const renderAlbumMenuItemLink = (type, al) => {
    const resource = resources.find((r) => r.name === 'album')
    if (!resource) {
      return null
    }
    const albumListAddress = type === 'search' ? `/song/search?${albumLists[type]?.params}` : `/album/${type}`

    const name = translate(`resources.album.lists.${type || 'default'}`, {
      _: translatedResourceName(resource, translate),
    })

    return (
      <MenuItemLink
        key={albumListAddress}
        to={albumListAddress}
        activeClassName={classes.active}
        primaryText={name}
        leftIcon={al.icon || <ViewListIcon />}
        sidebarIsOpen={open}
        dense={dense}
        exact
      />
    )
  }

  // Helper to render a song list item
  const defaultSongParams =
    'displayedFilters={}&filter={}&order=ASC&page=1&perPage=36&sort=title'

  const renderSongMenuItemLink = (type) => {
    const resource = resources.find((r) => r.name === 'song')
    if (!resource) return null

    // Use the params from songLists (starred, simran, etc.)
    const params = songLists[type]?.params || defaultSongParams
    const to = `/song/${type}?${params}` // <-- append params directly

    const name = translate(`resources.song.lists.${type}`, {
      _: translatedResourceName(resource, translate),
    })

    return (
      <MenuItemLink
        key={to}
        to={to}
        activeClassName={classes.active}
        primaryText={name}
        leftIcon={resource?.icon || <MusicNoteIcon />}
        sidebarIsOpen={open}
        dense={dense}
        exact
      />
    )
  }

  const subItems = (subMenu) => (resource) =>
    resource.hasList && resource.options && resource.options.subMenu === subMenu

  return (
    <div
      className={clsx(classes.root, {
        [classes.open]: open,
        [classes.closed]: !open,
      })}
    >
      {open && <LibrarySelector />}
      <SubMenu
        handleToggle={() => handleToggle('menuAlbumList')}
        isOpen={state.menuAlbumList}
        sidebarIsOpen={open}
        name="menu.albumList"
        icon={<AlbumIcon />}
        dense={dense}
      >
        {Object.keys(albumLists).map((type) =>
          renderAlbumMenuItemLink(type, albumLists[type]),
        )}
      </SubMenu>
      <SubMenu
        handleToggle={() => handleToggle('menuSongList')}
        isOpen={state.menuSongList}
        sidebarIsOpen={open}
        name="menu.songList"
        icon={<AlbumIcon />}
        dense={dense}
      >
        {Object.keys(songLists).map((type) => renderSongMenuItemLink(type))}
      </SubMenu>
      {/* {resources.filter(subItems(undefined)).map(renderResourceMenuItemLink)} */}
      {/* Generic root resources, excluding song and share */}
      {resources
        .filter(subItems(undefined))
        .filter((r) => !HIDE_ROOT_RESOURCES.has(r.name))
        .map(renderResourceMenuItemLink)}
      {config.devSidebarPlaylists && open ? (
        <>
          <Divider />
          <PlaylistsSubMenu
            state={state}
            setState={setState}
            sidebarIsOpen={open}
            dense={dense}
          />
        </>
      ) : (
        resources.filter(subItems('playlist')).map(renderResourceMenuItemLink)
      )}
    </div>
  )
}

export default Menu
