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

const PlayAllButton = ({ resource = 'song', filters = {}, className }) => {
  const dp = useDataProvider()
  const notify = useNotify()
  const translate = useTranslate()
  const dispatch = useDispatch()
  const listCtx = useListContext()

  const [loading, setLoading] = React.useState(false)

  const handleOnClick = async () => {
    try {
      setLoading(true)

      // Use only the songs from the current page
      const tracks = listCtx?.data ? Object.values(listCtx.data) : []

      if (!tracks.length) {
        notify('No items to play', { type: 'info' })
        return
      }

      dispatch(playTracks(tracks))
    } catch (e) {
      //eslint-disable-next-line no-console
      console.error('PlayAllButton error', e)
      notify('Error while loading tracks', { type: 'warning' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tooltip title={translate('Play All')}>
      <Button onClick={handleOnClick} label={translate('Play All')}>
        <PlayArrowIcon />
      </Button>
    </Tooltip>
  )
}

PlayAllButton.propTypes = {
  filters: PropTypes.object,
}

export default PlayAllButton
