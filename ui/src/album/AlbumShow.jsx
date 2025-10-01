import React from 'react'
import {
  ReferenceManyField,
  ShowContextProvider,
  useShowContext,
  useShowController,
  Title as RaTitle,
  useGetIdentity,
} from 'react-admin'
import { makeStyles } from '@material-ui/core/styles'
import AlbumSongs from './AlbumSongs'
import AlbumDetails from './AlbumDetails'
import AlbumActions from './AlbumActions'
import { useResourceRefresh, Title } from '../common'
import AlbumNavigator from './AlbumNavigator'

const useStyles = makeStyles(
  (theme) => ({
    albumActions: {
      width: '100%',
    },
    albumShowContainer: {
      margin: '0.75rem',
      [theme.breakpoints.down('sm')]: {
        marginBottom: '3rem', // to avoid double margin with bottom pagination
      },
    },
  }),
  {
    name: 'NDAlbumShow',
  },
)

const AlbumShowLayout = (props) => {
  const { loading, ...context } = useShowContext(props)
  const { record } = context
  const classes = useStyles()
  useResourceRefresh('album', 'song')
  const currentUser = useGetIdentity()?.identity?.id

  return (
    <>
      {record && <AlbumNavigator currentAlbum={record} />}
      {record && <RaTitle title={<Title subTitle={record.name} />} />}
      {record && <AlbumDetails {...context} currentUser={currentUser} />}
      {record && (
        <ReferenceManyField
          {...context}
          addLabel={false}
          reference="song"
          target="album_id"
          sort={{ field: 'album', order: 'ASC' }}
          perPage={0}
          pagination={null}
        >
          <AlbumSongs
            resource={'song'}
            exporter={false}
            album={record}
            currentUser={currentUser}
            actions={
              <AlbumActions className={classes.albumActions} record={record} />
            }
          />
        </ReferenceManyField>
      )}
    </>
  )
}

const AlbumShow = (props) => {
  const controllerProps = useShowController(props)
  const classes = useStyles()
  return (
    <ShowContextProvider value={controllerProps}>
      <div className={classes.albumShowContainer}>
        <AlbumShowLayout {...props} {...controllerProps} />
      </div>
    </ShowContextProvider>
  )
}

export default AlbumShow
