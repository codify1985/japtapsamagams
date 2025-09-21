import React from 'react'
import PropTypes from 'prop-types'
import { Tooltip } from '@material-ui/core'

import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import {
  Button,
  useDataProvider,
  useListContext,
  useNotify,
  useTranslate,
} from 'react-admin'
import { useDispatch } from 'react-redux'
import { playTracks } from '../actions'

const fetchAllPaged = async (dataProvider, resource, sort, filter) => {
  const perPage = 500
  let page = 1
  let all = []
  let hasMore = true
  // get first page to know total
  // loop while there is more data
  // stop if backend doesn't return total (fallback to length)
  // keep order as returned by backend (no shuffle)
  while (hasMore) {
    const { data, total } = await dataProvider.getList(resource, {
      pagination: { page, perPage },
      sort,
      filter,
    })
    if (!data || data.length === 0) break
    all = all.concat(data)
    hasMore =
      typeof total === 'number' ? all.length < total : data.length === perPage
    page += 1
  }
  return all
}

const PlayAllButton = ({ resource = 'song', filters = {}, className }) => {
  const dp = useDataProvider()
  const notify = useNotify()
  const translate = useTranslate()
  const dispatch = useDispatch()
  const listCtx = useListContext()

  // react-admin v3/v4 naming differs; support both
  const currentSort = listCtx?.currentSort ||
    listCtx?.sort || {
      field: 'title',
      order: 'ASC',
    }

  const [loading, setLoading] = React.useState(false)

  const handleOnClick = async () => {
    try {
      setLoading(true)
      const tracks = await fetchAllPaged(
        dp,
        resource,
        currentSort,
        filters || {},
      )
      if (!tracks.length) {
        notify('No items to play', { type: 'info' })
        return
      }
      // play in the received (sorted) order
      dispatch(playTracks(tracks))
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('PlayAllButton error', e)
      notify('Error while loading tracks', { type: 'warning' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tooltip title={translate('Play all')}>
      {/* <span>
        <Button
          onClick={handleClick}
          startIcon={<PlayArrowIcon />}
          className={className}
          disabled={loading}
          size="small"
        >
          {translate('Play all')}
        </Button>
      </span> */}
      <Button onClick={handleOnClick} label={translate('Play all')}>
        <PlayArrowIcon />
      </Button>
    </Tooltip>
  )
}

PlayAllButton.propTypes = {
  filters: PropTypes.object,
}

// PlayAllButton.propTypes = {
//   resource: PropTypes.string,
//   filters: PropTypes.object,
//   className: PropTypes.string,
// }

export default PlayAllButton
