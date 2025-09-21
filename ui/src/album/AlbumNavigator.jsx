import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { useMediaQuery, MenuItem, TextField } from '@material-ui/core'
import { useDataProvider, useRedirect, useTranslate } from 'react-admin'
import { useLibraryFilter } from '../common/useLibrarySelection'

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  select: {
    minWidth: 140,
  },
}))

// Build choices for years: current year down to 2009
const buildYearChoices = () => {
  const current = new Date().getFullYear()
  const out = []
  for (let y = current; y >= 2009; y--) out.push({ id: y, name: String(y) })
  return out
}

// Given a list of albums, shape as choices
const toAlbumChoices = (albums) =>
  (Array.isArray(albums) ? albums : []).map((a) => ({ id: a.id, name: a.name }))

const AlbumNavigator = ({ currentAlbum }) => {
  const classes = useStyles()
  const translate = useTranslate()
  const redirect = useRedirect()
  const isSmall = useMediaQuery((t) => t.breakpoints.down('sm'))

  const currentYear = React.useMemo(() => {
    // Prefer the album year if present, else current year
    return currentAlbum?.date || new Date().getFullYear()
  }, [currentAlbum])

  const [year, setYear] = React.useState(currentYear)

  // Fetch albums for the selected year using dataProvider directly
  const dataProvider = useDataProvider()
  const libraryFilter = useLibraryFilter()
  const [yearAlbums, setYearAlbums] = React.useState([])
  const [loaded, setLoaded] = React.useState(false)

  // Stabilize libraryFilter to prevent infinite loops
  const stableLibraryFilter = React.useMemo(
    () => libraryFilter,
    [JSON.stringify(libraryFilter)],
  )

  React.useEffect(() => {
    setLoaded(false)
    const serverFilter = { ...stableLibraryFilter, year: Number(year) }

    // eslint-disable-next-line no-console
    console.debug('[AlbumNavigator] About to fetch with filter:', serverFilter)

    dataProvider
      .getList('album', {
        pagination: { page: 1, perPage: 500 },
        sort: { field: 'name', order: 'ASC' },
        filter: serverFilter,
      })
      .then((result) => {
        // eslint-disable-next-line no-console
        console.debug('[AlbumNavigator] Raw dataProvider result:', result)
        setYearAlbums(result.data || [])
        // console.debug(
        //   '[AlbumNavigator] Processed yearAlbums:',
        //   result.data || [],
        // )

        const id =
          result.data && result.data.length > 0 ? result.data[0].id : ''
        if (id) {
          setAlbumId(id)
          redirect(`/album/${id}/show`)
        }

        setLoaded(true)
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('[AlbumNavigator] Error fetching albums:', error)
        setYearAlbums([])
        setLoaded(true)
      })
  }, [dataProvider, stableLibraryFilter, year])

  const albumChoices = React.useMemo(
    () => toAlbumChoices(yearAlbums),
    [yearAlbums],
  )

  // Debug logs
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('[AlbumNavigator]', {
      selectedYear: year,
      loaded,
      fetchedCount: yearAlbums.length,
      libraryFilter: stableLibraryFilter,
      sample: yearAlbums[0] && {
        id: yearAlbums[0].id,
        name: yearAlbums[0].name,
        year: yearAlbums[0].year,
        min_year: yearAlbums[0].min_year,
        max_year: yearAlbums[0].max_year,
      },
    })
  }, [year, loaded, yearAlbums, stableLibraryFilter])

  // Pick current album id if it exists in the list; otherwise first in list
  const initialAlbumId = React.useMemo(() => {
    if (!loaded || !albumChoices?.length) return ''
    const found = albumChoices.find((a) => a.id === currentAlbum?.id)
    return found ? found.id : albumChoices[0].id
  }, [loaded, albumChoices, currentAlbum])

  const [albumId, setAlbumId] = React.useState(initialAlbumId)

  // Keep albumId in sync when yearAlbums changes
  React.useEffect(() => {
    setAlbumId(initialAlbumId)
  }, [initialAlbumId])

  const handleYearChange = (event) => {
    const y = Number(event.target.value)
    setYear(y)
  }

  const handleAlbumChange = (event) => {
    const id = event.target.value
    setAlbumId(id)
    if (id) redirect(`/album/${id}/show`)
  }

  return (
    <div className={classes.container}>
      <TextField
        select
        label={translate('resources.album.fields.year') || 'Year'}
        value={year}
        onChange={handleYearChange}
        className={classes.select}
        margin="dense"
        fullWidth={isSmall}
        variant="outlined"
      >
        {buildYearChoices().map((opt) => (
          <MenuItem key={opt.id} value={opt.id}>
            {opt.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={
          translate('resources.album.name', { smart_count: 2 }) || 'Samagams'
        }
        value={albumId}
        onChange={handleAlbumChange}
        className={classes.select}
        margin="dense"
        fullWidth={isSmall}
        variant="outlined"
      >
        {albumChoices.length === 0 ? (
          <MenuItem value="" disabled>
            {translate('resources.album.navigator.no_albums', {
              _: 'No Samagams',
            })}
          </MenuItem>
        ) : (
          albumChoices.map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>
              {opt.name}
            </MenuItem>
          ))
        )}
      </TextField>
    </div>
  )
}

AlbumNavigator.propTypes = {
  currentAlbum: PropTypes.object,
}

export default AlbumNavigator
