import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import {
  Datagrid,
  DatagridBody,
  DatagridRow,
  Filter,
  FunctionField,
  NumberField,
  SearchInput,
  SelectInput,
  TextField,
  useTranslate,
  NullableBooleanInput,
  usePermissions,
  useListContext,
} from 'react-admin'
import { useMediaQuery, withWidth } from '@material-ui/core'
import FavoriteIcon from '@material-ui/icons/Favorite'
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder'
import { makeStyles } from '@material-ui/core/styles'
import { useDrag } from 'react-dnd'
import clsx from 'clsx'
import {
  ArtistContextMenu,
  List,
  QuickFilter,
  useGetHandleArtistClick,
  RatingField,
  useSelectedFields,
  useResourceRefresh,
} from '../common'
import config from '../config'
import ArtistListActions from './ArtistListActions'
import ArtistSimpleList from './ArtistSimpleList'
import { DraggableTypes } from '../consts'
import en from '../i18n/en.json'
import { formatBytes } from '../utils/index.js'

const useStyles = makeStyles((theme) => ({
  contextHeader: {
    marginLeft: '3px',
    marginTop: '-2px',
    verticalAlign: 'text-top',
  },
  row: {
    '&:hover': {
      '& $contextMenu': {
        visibility: 'visible',
      },
      '& $ratingField': {
        visibility: 'visible',
      },
    },
  },
  missingRow: {
    opacity: 0.3,
  },
  contextMenu: {
    visibility: 'hidden',
  },
  ratingField: {
    visibility: 'hidden',
  },
  numericCell: {
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  artistListContainer: {
    '& [class*="RaListToolbar-toolbar"]': {
      paddingLeft: '0 !important',
      paddingRight: '0 !important',
    },
    '& .RaFilter-form': {
      margin: 0,
      padding: '0rem',
      [theme.breakpoints.down('sm')]: {
        padding: '0.25rem',
      },
    },
    // margin: '1rem',
    [theme.breakpoints.down('sm')]: {
      margin: '0.75rem',
    },
  },
}))

const ArtistFilter = (props) => {
  const translate = useTranslate()
  const { permissions } = usePermissions()
  const isAdmin = permissions === 'admin'
  const rolesObj = en?.resources?.artist?.roles
  const roles = Object.keys(rolesObj).reduce((acc, role) => {
    acc.push({
      id: role,
      name: translate(`resources.artist.roles.${role}`, {
        smart_count: 2,
      }),
    })
    return acc
  }, [])
  // roles?.sort((a, b) => a.name.localeCompare(b.name))
  return (
    <Filter {...props} variant={'outlined'}>
      <SearchInput id="search" source="name" alwaysOn />
      <SelectInput source="role" choices={roles} alwaysOn disabled hidden />
      {config.enableFavourites && (
        <QuickFilter
          source="starred"
          label={<FavoriteIcon fontSize={'small'} />}
          defaultValue={true}
        />
      )}
      {isAdmin && <NullableBooleanInput source="missing" />}
    </Filter>
  )
}

const ArtistDatagridRow = (props) => {
  const { record } = props
  const [, dragArtistRef] = useDrag(
    () => ({
      type: DraggableTypes.ARTIST,
      item: { artistIds: [record?.id] },
      options: { dropEffect: 'copy' },
    }),
    [record],
  )
  const classes = useStyles()
  const computedClasses = clsx(
    props.className,
    classes.row,
    record?.missing && classes.missingRow,
  )
  return (
    <DatagridRow ref={dragArtistRef} {...props} className={computedClasses} />
  )
}

const ArtistDatagridBody = (props) => (
  <DatagridBody {...props} row={<ArtistDatagridRow />} />
)

const ArtistDatagrid = (props) => (
  <Datagrid {...props} body={<ArtistDatagridBody />} />
)

const ArtistListView = ({ hasShow, hasEdit, hasList, width, ...rest }) => {
  const { filterValues } = rest
  const { data } = useListContext() // Get data from list context
  const classes = useStyles()
  const handleArtistLink = useGetHandleArtistClick(width)
  const history = useHistory()
  const isXsmall = useMediaQuery((theme) => theme.breakpoints.down('xs'))
  useResourceRefresh('artist')
  const { permissions } = usePermissions()
  const isAdmin = permissions === 'admin'

  // Create a handler that can find the record by ID
  const handleArtistLinkWithRecord = (id) => {
    // data is an object keyed by ID, not an array
    const record = data?.[id]
    if (record) {
      return handleArtistLink(record)

      //   const url = handleArtistLink(record)
      // history.push(url)
    } else {
      // Fallback to artist show page if record not found
      history.push(`/artist/${id}/show`)
    }
  }

  // For mobile - return URL instead of calling history.push
  const getMobileArtistLink = (id) => {
    const record = data?.[id]
    if (record) {
      return handleArtistLink(record)
    } else {
      return `/artist/${id}/show`
    }
  }

  const role = filterValues?.role
  const getCounter = (record, counter) => {
    if (!record) return undefined
    return role ? record?.stats?.[role]?.[counter] : record?.[counter]
  }
  const getAlbumCount = (record) => getCounter(record, 'albumCount')
  const getSongCount = (record) => getCounter(record, 'songCount')
  const getSize = (record) => {
    const size = getCounter(record, 'size')
    return size ? formatBytes(size) : '0 MB'
  }

  const toggleableFields = useMemo(
    () => ({
      playCount: <NumberField source="playCount" sortByOrder={'DESC'} />,
      rating: config.enableStarRating && (
        <RatingField
          source="rating"
          sortByOrder={'DESC'}
          resource={'artist'}
          className={classes.ratingField}
        />
      ),
    }),
    [classes.ratingField],
  )

  const columns = useSelectedFields({
    resource: 'artist',
    columns: toggleableFields,
  })

  console.log('Rendering ArtistListView, isAdmin:', isAdmin)
  return isXsmall ? (
    <ArtistSimpleList
      linkType={(id) => history.push(getMobileArtistLink(id))}
      // linkType={(id) => {
      //   console.log('link handleArtistLinkWithRecord', handleArtistLinkWithRecord);
      //   history.push(handleArtistLinkWithRecord)}}
      //   //linkType={(id) => history.push(handleArtistLink(id))}

      {...rest}
    />
  ) : (
    <ArtistDatagrid
      rowClick={handleArtistLinkWithRecord}
      classes={{ row: classes.row }}
    >
      <TextField source="name" />
      {isAdmin && (
        <FunctionField
          source="albumCount"
          sortByOrder={'DESC'}
          render={getAlbumCount}
          className={classes.numericCell}
          aria-label="Samagams (count)"
        />
      )}
      {isAdmin && (
        <FunctionField
          source="songCount"
          sortByOrder={'DESC'}
          render={getSongCount}
          className={classes.numericCell}
          aria-label="Kirtans (count)"
        />
      )}
      <FunctionField
        source="size"
        sortByOrder={'DESC'}
        render={getSize}
        className={classes.numericCell}
      />
      {columns}
      <ArtistContextMenu
        source={'starred_at'}
        sortByOrder={'DESC'}
        sortable={config.enableFavourites}
        className={classes.contextMenu}
        label={
          config.enableFavourites && (
            <FavoriteBorderIcon
              fontSize={'small'}
              className={classes.contextHeader}
            />
          )
        }
      />
    </ArtistDatagrid>
  )
}

const ArtistList = (props) => {
  const classes = useStyles()
  return (
    <div className={classes.artistListContainer}>
      <List
        {...props}
        sort={{ field: 'name', order: 'ASC' }}
        exporter={false}
        bulkActionButtons={false}
        filters={<ArtistFilter />}
        filterDefaultValues={{ role: 'artist' }}
        // default selected value to artist
        actions={<ArtistListActions />}
        perPage={25}
      >
        <ArtistListView {...props} />
      </List>
    </div>
  )
}

const ArtistListWithWidth = withWidth()(ArtistList)

export default ArtistListWithWidth
