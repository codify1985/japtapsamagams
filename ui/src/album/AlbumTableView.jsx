import React, { useMemo } from 'react'
import {
  Datagrid,
  DatagridBody,
  DatagridRow,
  DateField,
  NumberField,
  TextField,
  FunctionField,
  useGetIdentity,
} from 'react-admin'
import { useMediaQuery } from '@material-ui/core'
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder'
import { makeStyles } from '@material-ui/core/styles'
import { useDrag } from 'react-dnd'
import {
  ArtistLinkField,
  DurationField,
  RangeField,
  SimpleList,
  AlbumContextMenu,
  RatingField,
  useSelectedFields,
  SizeField,
} from '../common'
import config from '../config'
import { DraggableTypes } from '../consts'
import subsonic from '../subsonic'
import clsx from 'clsx'

const useStyles = makeStyles({
  columnIcon: {
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
  tableCell: {
    width: '17.5%',
  },
  contextMenu: {
    visibility: 'visible',
  },
  ratingField: {
    visibility: 'hidden',
  },
  rightIconWrapper: {
    // / marginLeft: '8px !important',
    // // fontSize: '1.5rem',
    // '& .MuiIconButton-root': {
    //   fontSize: '1.5rem',
    // },
    // '& .MuiIconButton-sizeSmall': {
    //   padding: '0px !important',
    // },
  },
})

const AlbumDatagridRow = (props) => {
  const { record, className } = props
  const classes = useStyles()
  const [, dragAlbumRef] = useDrag(
    () => ({
      type: DraggableTypes.ALBUM,
      item: { albumIds: [record?.id] },
      options: { dropEffect: 'copy' },
    }),
    [record],
  )
  const computedClasses = clsx(
    className,
    classes.row,
    record.missing && classes.missingRow,
  )
  return (
    <DatagridRow ref={dragAlbumRef} {...props} className={computedClasses} />
  )
}

const AlbumDatagridBody = (props) => (
  <DatagridBody {...props} row={<AlbumDatagridRow />} />
)

const AlbumDatagrid = (props) => (
  <Datagrid {...props} body={<AlbumDatagridBody />} />
)

const AlbumTableView = ({
  hasShow,
  hasEdit,
  hasList,
  syncWithLocation,
  currentUser,
  ...rest
}) => {
  const classes = useStyles()
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'))
  const isXsmall = useMediaQuery((theme) => theme.breakpoints.down('xs'))

  const toggleableFields = useMemo(() => {
    return {
      // artist: <ArtistLinkField source="albumArtist" />,
      songCount: isDesktop && (
        <NumberField source="songCount" sortByOrder={'DESC'} />
      ),
      // Show Play count only to admin users
      playCount: isDesktop && currentUser === 'admin' && (
        <NumberField source="playCount" sortByOrder={'DESC'} />
      ),
      year: (
        <RangeField source={'year'} sortBy={'max_year'} sortByOrder={'DESC'} />
      ),
      // mood: isDesktop && (
      //   <FunctionField
      //     source="mood"
      //     render={(r) => r.tags?.mood?.[0] || ''}
      //     sortable={false}
      //   />
      // ),
      duration: isDesktop && <DurationField source="duration" />,
      size: isDesktop && <SizeField source="size" />,
      rating: config.enableStarRating && (
        <RatingField
          source={'rating'}
          resource={'album'}
          sortByOrder={'DESC'}
          className={classes.ratingField}
        />
      ),
      createdAt: isDesktop && currentUser === 'admin' && (
        <DateField source="createdAt" showTime />
      ),
    }
  }, [classes.ratingField, isDesktop])

  const columns = useSelectedFields({
    resource: 'album',
    columns: toggleableFields,
    defaultOff: ['createdAt', 'size', 'mood'],
  })

  // const imageUrl = subsonic.getCoverArtUrl(record, 300);

  const shouldShowCover = (record) => {
    // Show covers for albums and playlists, but not for artists
    return record.albumArtist || record.sync !== undefined
  }

  return isXsmall ? (
    <SimpleList
      primaryText={(r) => r.name}
      secondaryText={(r) => (
        <>
          {r.albumArtist}
          {config.enableStarRating && (
            <>
              <br />
              <RatingField
                record={r}
                sortByOrder={'DESC'}
                source={'rating'}
                resource={'album'}
                size={'small'}
              />
            </>
          )}
        </>
      )}
      // tertiaryText={(r) => (
      //   <>
      //     <RangeField record={r} source={'year'} sortBy={'max_year'} />
      //     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      //   </>
      // )}
      linkType={'show'}
      rightIcon={(r) => (
        <div className={classes.rightIconWrapper}>
          <AlbumContextMenu
            record={r}
            showLove={currentUser !== config.defaultUser}
            currentUser={currentUser}
          />
        </div>
      )}
      showCover={true}
      coverSrc={(r) => {
        if (!shouldShowCover(r)) {
          return undefined // This will fallback to Avatar with initials
        }
        return subsonic.getCoverArtUrl(r, 48)
      }}
      {...rest}
    />
  ) : (
    <AlbumDatagrid rowClick={'show'} classes={{ row: classes.row }} {...rest}>
      <TextField source="name" />
      {columns}
      <AlbumContextMenu
        source={'starred_at'}
        sortByOrder={'DESC'}
        showLove={currentUser !== config.defaultUser}
        // showLove={false}
        sortable={config.enableFavourites && currentUser !== config.defaultUser}
        className={classes.contextMenu}
        label={
          config.enableFavourites &&
          currentUser !== config.defaultUser && (
            <FavoriteBorderIcon
              fontSize={'small'}
              className={classes.columnIcon}
            />
          )
        }
      />
    </AlbumDatagrid>
  )
}

export default AlbumTableView
