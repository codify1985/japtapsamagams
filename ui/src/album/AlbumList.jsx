import { useSelector } from 'react-redux'
import React, { useMemo } from 'react'
import { Redirect, useLocation } from 'react-router-dom'
import {
  AutocompleteArrayInput,
  AutocompleteInput,
  Filter,
  NullableBooleanInput,
  Pagination,
  ReferenceArrayInput,
  ReferenceInput,
  SearchInput,
  SelectInput,
  usePermissions,
  useRefresh,
  useTranslate,
  useVersion,
  useListContext,
  useGetIdentity,
} from 'react-admin'
import FavoriteIcon from '@material-ui/icons/Favorite'
import { withWidth } from '@material-ui/core'
import {
  List,
  QuickFilter,
  Title,
  useAlbumsPerPage,
  useResourceRefresh,
  useSetToggleableFields,
} from '../common'
import AlbumListActions from './AlbumListActions'
import AlbumTableView from './AlbumTableView'
import AlbumGridView from './AlbumGridView'
import useAlbumLists, { defaultAlbumList } from './albumLists'
import config from '../config'
import AlbumInfo from './AlbumInfo'
import ExpandInfoDialog from '../dialogs/ExpandInfoDialog'
import { humanize } from 'inflection'
import { makeStyles, useTheme } from '@material-ui/core/styles'
import { useMediaQuery } from '@material-ui/core'

const useChipStyles = makeStyles({
  chip: {
    margin: 0,
    height: '24px',
  },
})

const useFilterStyles = makeStyles((theme) => ({
  form: {
    // desktop layout
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    // normalize default control margins
    '& .MuiFormControl-root': { margin: 0 },
    '& .MuiFormControl-marginDense': { margin: 0 },
    '& .MuiInputBase-root': { margin: 0 },

    [theme.breakpoints.down('sm')]: {
      // stack and add padding so the first row clears the sticky toolbar
      paddingTop: theme.spacing(1.5),
      marginLeft: 0, // Remove left margin to align with content
      paddingLeft: 0, // Remove left padding to align with content
      paddingRight: 0, // Remove right padding for consistency
      // kill any residual margins that cause left misalignment
      '& .MuiFormControl-root, & .ra-input': {
        width: '100%',
        margin: 0,
      },
    },
  },
}))

const useAlbumListStyles = makeStyles((theme) => ({
  albumListContainer: {
    '& [class*="RaListToolbar-toolbar"]': {
      // paddingLeft: '0 !important',
      paddingRight: '0 !important',
      alignItems: 'flex-end !important',
      //marginBottom: '0.75rem',
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
      marginBottom: '3.5rem', // to avoid double margin with bottom pagination
    },
  },
}))

// Reusable YearDropdown that works with react-admin Filter/FilterButton
const YearDropdown = ({
  source = 'year',
  alwaysOn = true,
  fullWidth,
  ...rest
}) => {
  const location = useLocation()
  const isHomePage = location.pathname.includes('recentlyAdded')
  const currentYear = new Date().getFullYear()

  const yearChoices = React.useMemo(() => {
    const choices = []
    const maxYears = 2009 // from 2009 to current year
    for (let y = currentYear; y >= maxYears; y--) {
      choices.push({ id: y, name: String(y) })
    }
    return choices
  }, [currentYear, isHomePage])

  return (
    <SelectInput
      source={source}
      alwaysOn={alwaysOn}
      choices={yearChoices}
      label="Year"
      emptyText="All" // single empty option labeled "All"
      emptyValue="all" // value for empty option
      margin="dense"
      fullWidth={fullWidth}
      initialValue={currentYear} // Add this line
      style={fullWidth ? { marginTop: 10 } : { minWidth: 220 }} // Increased width to match search box
      // undefined/null in form -> show empty option ("All")
      format={(v) => (v == null ? 'all' : v)}
      // Modified parse function: when 'all' is selected, return undefined to remove filter
      parse={(v) => (v === 'all' || v === '' ? undefined : Number(v))}
      {...rest}
    />
  )
}

const AlbumFilter = (props) => {
  const chipClasses = useChipStyles()
  const filterClasses = useFilterStyles()
  const theme = useTheme()
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  const translate = useTranslate()
  const { permissions } = usePermissions()
  const isAdmin = permissions === 'admin'

  return (
    <Filter
      {...props}
      variant="outlined"
      classes={{ form: filterClasses.form }}
    >
      <YearDropdown
        key="year"
        source="year"
        alwaysOn
        fullWidth={isSmall}
        margin="dense"
        pathname={location.pathname}
      />
      {/* <SearchInput
        id="search"
        source="name"
        alwaysOn
        fullWidth={isSmall}
        margin="dense"
      /> */}
      <ReferenceInput
        label={translate('resources.album.fields.artist')}
        source="artist_id"
        reference="artist"
        sort={{ field: 'name', order: 'ASC' }}
        filterToQuery={(searchText) => ({ name: [searchText] })}
      >
        <AutocompleteInput emptyText="-- None --" />
      </ReferenceInput>
      {/* <ReferenceArrayInput
        label={translate('resources.album.fields.genre')}
        source="genre_id"
        reference="genre"
        perPage={0}
        sort={{ field: 'name', order: 'ASC' }}
        filterToQuery={(searchText) => ({ name: [searchText] })}
      >
        <AutocompleteArrayInput emptyText="-- None --" classes={chipClasses} />
      </ReferenceArrayInput>
      <ReferenceInput
        label={translate('resources.album.fields.recordLabel')}
        source="recordlabel"
        reference="tag"
        perPage={0}
        sort={{ field: 'tagValue', order: 'ASC' }}
        filter={{ tag_name: 'recordlabel' }}
        filterToQuery={(searchText) => ({
          tag_value: [searchText],
        })}
      >
        <AutocompleteInput emptyText="-- None --" optionText="tagValue" />
      </ReferenceInput> */}
      {/* <ReferenceArrayInput
        label={translate('resources.album.fields.grouping')}
        source="grouping"
        reference="tag"
        perPage={0}
        sort={{ field: 'tagValue', order: 'ASC' }}
        filter={{ tag_name: 'grouping' }}
        filterToQuery={(searchText) => ({
          tag_value: [searchText],
        })}
      >
        <AutocompleteArrayInput
          emptyText="-- None --"
          classes={chipClasses}
          optionText="tagValue"
        />
      </ReferenceArrayInput> */}
      {/* <ReferenceArrayInput
        label={translate('resources.album.fields.mood')}
        source="mood"
        reference="tag"
        perPage={0}
        sort={{ field: 'tagValue', order: 'ASC' }}
        filter={{ tag_name: 'mood' }}
        filterToQuery={(searchText) => ({
          tag_value: [searchText],
        })}
      >
        <AutocompleteArrayInput
          emptyText="-- None --"
          classes={chipClasses}
          optionText="tagValue"
        />
      </ReferenceArrayInput> */}
      {/* <ReferenceInput
        label={translate('resources.album.fields.media')}
        source="media"
        reference="tag"
        perPage={0}
        sort={{ field: 'tagValue', order: 'ASC' }}
        filter={{ tag_name: 'media' }}
        filterToQuery={(searchText) => ({
          tag_value: [searchText],
        })}
      >
        <AutocompleteInput emptyText="-- None --" optionText="tagValue" />
      </ReferenceInput> */}
      {/* <ReferenceInput
        label={translate('resources.album.fields.releaseType')}
        source="releasetype"
        reference="tag"
        perPage={0}
        sort={{ field: 'tagValue', order: 'ASC' }}
        filter={{ tag_name: 'releasetype' }}
        filterToQuery={(searchText) => ({
          tag_value: [searchText],
        })}
      >
        <AutocompleteInput
          emptyText="-- None --"
          optionText={(record) =>
            record?.tagValue ? humanize(record?.tagValue) : '-- None --'
          }
        />
      </ReferenceInput>
      <NullableBooleanInput source="compilation" /> */}
      {/* // <NumberInput source="year" /> */}
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

const AlbumListTitle = ({ albumListType }) => {
  const translate = useTranslate()
  let title = translate('resources.album.name', { smart_count: 2 })
  if (albumListType) {
    let listTitle = translate(`resources.album.lists.${albumListType}`, {
      smart_count: 2,
    })
    title = `${title} - ${listTitle}`
  }
  return <Title subTitle={title} args={{ smart_count: 2 }} />
}

const randomStartingSeed = Math.random().toString()

const AlbumList = (props) => {
  const { width } = props
  const albumView = useSelector((state) => state.albumView)
  const [perPage, perPageOptions] = useAlbumsPerPage(width)
  const location = useLocation()
  const version = useVersion()
  const refresh = useRefresh()
  const classes = useAlbumListStyles()
  const albumLists = useAlbumLists()
  useResourceRefresh('album')
  const { identity } = useGetIdentity()
  const currentUser = identity?.id

  // just for debugging TODO: remove
  // const listContext = useListContext();
  // const { setSort } = listContext || {};
  // const listContextSort = listContext?.sort || {};
  // console.log('AlbumList listContext sort=', listContextSort);
  // console.log('AlbumList props=', props);

  const seed = `${randomStartingSeed}-${version}`

  const albumListType = location.pathname
    .replace(/^\/album/, '')
    .replace(/^\//, '')

  // // Transform yearFilter to year for backend
  const transformFilters = (filters) => {
    const { yearFilter, ...otherFilters } = filters

    if (yearFilter && yearFilter !== '') {
      return { ...otherFilters, year: yearFilter }
    }

    return otherFilters
  }

  // Workaround to force album columns to appear the first time.
  // See https://github.com/navidrome/navidrome/pull/923#issuecomment-833004842
  // TODO: Find a better solution
  useSetToggleableFields(
    'album',
    [
      'artist',
      'songCount',
      // 'playCount',
      'year',
      // 'mood',
      'duration',
      // 'rating',
      'size',
      'createdAt',
    ],
    ['createdAt', 'size'],
  )

  // If it does not have filter/sort params (usually coming from Menu),
  // reload with correct filter/sort params
  if (!location.search) {
    // TODO: SET THE DEAFULT LIST TO GRID FOR DESKTOP AND TABLE FOR MOBILE
    // const isXSmall = useMediaQuery((theme) => theme.breakpoints.down('xs'))
    // const defaultAlbumList = isXSmall ? 'list' : 'grid'
    const type =
      albumListType || localStorage.getItem('defaultView') || defaultAlbumList
    const listParams = albumLists[type]
    if (type === 'random') {
      refresh()
    }
    if (listParams) {
      return <Redirect to={`/album/${type}?${listParams.params}`} />
    }
  }

  return (
    <div className={classes.albumListContainer}>
      <List
        {...props}
        exporter={false}
        bulkActionButtons={false}
        filter={{ seed }}
        actions={<AlbumListActions />}
        filters={<AlbumFilter />}
        perPage={perPage}
        pagination={<Pagination rowsPerPageOptions={perPageOptions} />}
        title={<AlbumListTitle albumListType={albumListType} />}
      >
        {albumView.grid ? (
          <AlbumGridView
            albumListType={albumListType}
            currentUser={currentUser}
            {...props}
          />
        ) : (
          <AlbumTableView currentUser={currentUser} {...props} />
        )}
      </List>
      <ExpandInfoDialog content={<AlbumInfo />} />
    </div>
  )
}

const AlbumListWithWidth = withWidth()(AlbumList)

export default AlbumListWithWidth
