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

  // TODO: Stabilize libraryFilter to prevent infinite loops
  const stableLibraryFilter = React.useMemo(
    () => libraryFilter,
    [JSON.stringify(libraryFilter)],
  )

  React.useEffect(() => {
    setLoaded(false)
    const serverFilter = { ...stableLibraryFilter, year: Number(year) }

    dataProvider
      .getList('album', {
        pagination: { page: 1, perPage: 500 },
        sort: { field: 'name', order: 'ASC' },
        filter: serverFilter,
      })
      .then((result) => {
        // eslint-disable-next-line no-console
        console.debug('[AlbumNavigator] Fetching Albums:', result)
        setYearAlbums(result.data || [])
        setLoaded(true)
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('[AlbumNavigator] Error fetching albums:', error)
        setYearAlbums([])
        setLoaded(true)
      })
  }, [dataProvider, stableLibraryFilter, year, redirect])

  const albumChoices = React.useMemo(
    () => toAlbumChoices(yearAlbums),
    [yearAlbums],
  )

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

  React.useEffect(() => {
    // If current album is not in the new list, redirect to first album of the list
    const found = yearAlbums.find((a) => a.id === currentAlbum?.id)
    if (found && albumId !== found.id) {
      setAlbumId(found.id)
    } else {
      const id = yearAlbums.length > 0 ? yearAlbums[0].id : ''
      setAlbumId(id)
      if (id) redirect(`/album/${id}/show`)
    }
  }, [albumChoices, yearAlbums, redirect])

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
          translate('resources.album.name', { smart_count: 2 }) || 'Samagam'
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
