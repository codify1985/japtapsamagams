import React, { cloneElement } from 'react'
import {
  sanitizeListRestProps,
  TopToolbar,
  useTranslate,
  useListContext,
  useDataProvider,
  useNotify,
} from 'react-admin'
import { useMediaQuery } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import CloudDownloadOutlinedIcon from '@material-ui/icons/CloudDownloadOutlined'
import { Button } from 'react-admin'
import { ShuffleAllButton, ToggleFieldsMenu, PlayAllButton } from '../common'
import { openDownloadMenu, DOWNLOAD_MENU_SONG } from '../actions'
import { formatBytes } from '../utils'
import config from '../config'
import subsonic from '../subsonic'

// Helper function to fetch all pages of results
const fetchAllPaged = async (
  dataProvider,
  resource,
  sort,
  filter,
  page = null,
  perPage = null,
) => {
  // If specific page and perPage are provided, fetch only that page
  if (page !== null && perPage !== null) {
    const { data } = await dataProvider.getList(resource, {
      pagination: { page, perPage },
      sort,
      filter,
    })
    return data || []
  }

  const defaultPerPage = 500
  let currentPage = 1
  let all = []
  // get first page to know total
  // loop while there is more data
  // stop if backend doesn't return total (fallback to length)
  // keep order as returned by backend (no shuffle)
  while (true) {
    const { data, total } = await dataProvider.getList(resource, {
      pagination: { page: currentPage, perPage: defaultPerPage },
      sort,
      filter,
    })
    if (!data || data.length === 0) break
    all = all.concat(data)
    const hasMore =
      typeof total === 'number' ? all.length < total : data.length === perPage
    if (!hasMore) break
    page += 1
  }
  return all
}

export const SongListActions = (props) => {
  const {
    className,
    resource = 'song',
    filters,
    displayedFilters,
    filterValues = {},
    showFilter,
    ...rest
  } = props

  const isNotSmall = useMediaQuery((theme) => theme.breakpoints.up('sm'))
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'))
  const dispatch = useDispatch()
  const translate = useTranslate()
  const dataProvider = useDataProvider()
  const notify = useNotify()

  // Get list context to access current list state
  const listContext = useListContext()
  const currentSort = listContext?.currentSort ||
    listContext?.sort || {
      field: 'title',
      order: 'ASC',
    }

  // Get the complete filter state from list context
  const currentFilter = listContext?.filterValues || filterValues || {}

  const [loading, setLoading] = React.useState(false)
  const [songs, setSongs] = React.useState([])

  // Fetch current songs when filters or sort change
  React.useEffect(() => {
    const fetchSongs = async (page, perPage) => {
      try {
        setLoading(true)
        // Use the same fetching pattern as PlayAllButton to get all filtered results
        const allSongs = await fetchAllPaged(
          dataProvider,
          resource,
          currentSort,
          currentFilter,
          page,
          perPage,
        )
        setSongs(allSongs)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch songs:', error)
        setSongs([])
      } finally {
        setLoading(false)
      }
    }
    // Only fetch if there is a filter on title (i.e. artist selected)

    //find out why fetchSongs is being called twice on initial load
    if (currentFilter.title || currentFilter.starred) {
      fetchSongs()
    } else {
      fetchSongs(listContext.page, listContext.perPage)
      //setSongs([])
    }
  }, [dataProvider, resource, currentFilter, currentSort])

  // Calculate total size of all songs for download
  const totalSize = React.useMemo(() => {
    return songs.reduce((acc, song) => acc + (song?.size || 0), 0)
  }, [songs])

  const handleDownloadAll = React.useCallback(() => {
    if (!songs || songs.length === 0) {
      notify('No songs available for download', { type: 'warning' })
      return
    }

    if (songs.length === 1) {
      // Single song - use the existing download dialog
      const song = songs[0]
      dispatch(openDownloadMenu(song, DOWNLOAD_MENU_SONG))
    } else {
      // Multiple songs - use the new batch download endpoint
      const songIds = songs.map((song) => song.id)
      notify(`Downloading ${songs.length} songs...`, { type: 'info' })

      // Use the new downloadSongs function which calls the backend ZIP endpoint
      subsonic.downloadSongs(songIds, 'raw', '0')
    }
  }, [dispatch, songs, notify])

  // TODO: why this is rendering multiple times? find out
  // console.debug('[SongListActions] songs count:', songs.length, { songs })
  // console.debug('[SongListActions] totalSize:', totalSize)
  // console.debug('[SongListActions] filterValues:', filterValues)
  // console.debug('[SongListActions] currentFilter:', currentFilter)
  // console.debug('[SongListActions] listContext:', listContext)

  const songDispLabel = currentFilter.title === 'simran' ? 'Simrans' : 'Kirtans'
  return (
    <TopToolbar className={className} {...sanitizeListRestProps(rest)}>
      <PlayAllButton filters={filterValues} />
      <ShuffleAllButton filters={filterValues} />
      {config.enableDownloads && !loading && songs && songs.length > 0 && (
        <Button
          onClick={handleDownloadAll}
          label={
            songs.length === 1
              ? translate('ra.action.download') +
                (isDesktop ? ` (${formatBytes(totalSize)})` : '')
              : translate('ra.action.download') +
                (isDesktop
                  ? ` (${songs.length} ${songDispLabel}, ${formatBytes(totalSize)})`
                  : ` (${songs.length})`)
          }
        >
          <CloudDownloadOutlinedIcon />
        </Button>
      )}
      {filters &&
        cloneElement(filters, {
          resource,
          showFilter,
          displayedFilters,
          filterValues,
          context: 'button',
        })}
      {isNotSmall && <ToggleFieldsMenu resource="song" />}
    </TopToolbar>
  )
}

SongListActions.defaultProps = {
  filterValues: {},
}
