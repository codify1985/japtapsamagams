import React from 'react'
import PropTypes from 'prop-types'
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

      const tracks = listCtx?.data ? Object.values(listCtx.data) : []

      if (!tracks.length) {
        notify('message.noItemsToPlay', { type: 'info' })
        return
      }

      dispatch(playTracks(tracks))
    } catch (e) {
      //eslint-disable-next-line no-console
      console.error('PlayAllButton error', e)
      notify('message.playAllLoadError', { type: 'warning' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleOnClick} label="ra.action.play_all">
      <PlayArrowIcon />
    </Button>
  )
}

PlayAllButton.propTypes = {
  filters: PropTypes.object,
}

export default PlayAllButton
