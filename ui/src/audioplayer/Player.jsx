/*
 * CHANGES MADE TO UNIFY MOBILE/DESKTOP PLAYER:
 *
 * 1. Mobile/Desktop Switch Locations Removed:
 *    - toggleMode: !isDesktop (line 111) - forced desktop player on all viewports
 *    - isMobilePlayer volume logic (lines 145, 290-293) - removed mobile-specific volume handling
 *    - useMediaQuery('(min-width:810px)') detection - kept for CSS but removed from toggleMode
 *
 * 2. What was changed:
 *    - Always use desktop player component (toggleMode: false)
 *    - Unified volume handling across all devices
 *    - CSS Grid layout implemented for responsive design instead of component switching
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMediaQuery } from '@material-ui/core'
import { ThemeProvider } from '@material-ui/core/styles'
import {
  createMuiTheme,
  useAuthState,
  useDataProvider,
  useTranslate,
} from 'react-admin'
import ReactGA from 'react-ga'
import { GlobalHotKeys } from 'react-hotkeys'
import ReactJkMusicPlayer from 'navidrome-music-player'
import 'navidrome-music-player/assets/index.css'
import './mobile-progress-override.css' // Critical override for mobile progress bar visibility
import useCurrentTheme from '../themes/useCurrentTheme'
import config from '../config'
import useStyle from './styles'
import AudioTitle from './AudioTitle'
import {
  clearQueue,
  currentPlaying,
  setPlayMode,
  setVolume,
  syncQueue,
} from '../actions'
import PlayerToolbar from './PlayerToolbar'
import { sendNotification } from '../utils'
import subsonic from '../subsonic'
import locale from './locale'
import { keyMap } from '../hotkeys'
import keyHandlers from './keyHandlers'
import { calculateGain } from '../utils/calculateReplayGain'

const Player = () => {
  const theme = useCurrentTheme()
  const translate = useTranslate()
  const playerTheme = theme.player?.theme || 'dark'
  const dataProvider = useDataProvider()
  const playerState = useSelector((state) => state.player)
  const dispatch = useDispatch()
  const [startTime, setStartTime] = useState(null)
  const [scrobbled, setScrobbled] = useState(false)
  const [preloaded, setPreload] = useState(false)
  const [audioInstance, setAudioInstance] = useState(null)
  const isDesktop = useMediaQuery('(min-width:768px)') // Changed to 768px for consistency with requirements
  const gainInfo = useSelector((state) => state.replayGain)
  const { authenticated } = useAuthState()
  const showNotifications = useSelector(
    (state) => state.settings.notifications || false,
  )
  const [context, setContext] = useState(null)
  const [gainNode, setGainNode] = useState(null)

  // Safety guards - prevent rendering if state is not properly initialized
  if (!playerState || !playerState.queue || !Array.isArray(playerState.queue)) {
    return null
  }

  const visible = authenticated && playerState.queue.length > 0
  const isRadio = playerState.current?.isRadio || false
  const classes = useStyle({
    isRadio,
    visible,
    enableCoverAnimation: config.enableCoverAnimation,
  })

  useEffect(() => {
    if (
      context === null &&
      audioInstance &&
      config.enableReplayGain &&
      'AudioContext' in window &&
      (gainInfo.gainMode === 'album' || gainInfo.gainMode === 'track')
    ) {
      const ctx = new AudioContext()
      // we need this to support radios in firefox
      audioInstance.crossOrigin = 'anonymous'
      const source = ctx.createMediaElementSource(audioInstance)
      const gain = ctx.createGain()

      source.connect(gain)
      gain.connect(ctx.destination)

      setContext(ctx)
      setGainNode(gain)
    }
  }, [audioInstance, context, gainInfo.gainMode])

  useEffect(() => {
    if (gainNode) {
      const current = playerState.current || {}
      const song = current.song || {}

      const numericGain = calculateGain(gainInfo, song)
      gainNode.gain.setValueAtTime(numericGain, context.currentTime)
    }
  }, [audioInstance, context, gainNode, playerState, gainInfo])

  const defaultOptions = useMemo(
    () => ({
      theme: playerTheme,
      bounds: 'body',
      playMode: playerState.mode,
      mode: 'full', // Force full desktop mode
      loadAudioErrorPlayNext: false,
      autoPlayInitLoadPlayList: true,
      clearPriorAudioLists: false,
      showDestroy: true,
      showDownload: false,
      showLyric: false,
      showReload: false,
      toggleMode: false, // Always use desktop player component - never allow mobile toggle
      responsive: false, // Disable responsive behavior that switches to mobile
      glassBg: false,
      showThemeSwitch: false,
      showMediaSession: true,
      restartCurrentOnPrev: true,
      quietUpdate: true,
      defaultPosition: {
        top: 300,
        left: 120,
      },
      volumeFade: { fadeIn: 200, fadeOut: 200 },
      renderAudioTitle: (audioInfo, isMobile) => (
        <AudioTitle
          audioInfo={audioInfo}
          gainInfo={gainInfo}
          isMobile={isMobile}
        />
      ),
      locale: locale(translate),
    }),
    [gainInfo, playerTheme, translate, playerState.mode], // Removed isDesktop dependency
  )

  const options = useMemo(() => {
    const current = playerState.current || {}
    return {
      ...defaultOptions,
      audioLists: playerState.queue.map((item) => item),
      playIndex: playerState.playIndex,
      autoPlay: playerState.clear || playerState.playIndex === 0,
      clearPriorAudioLists: playerState.clear,
      extendsContent: (
        <PlayerToolbar id={current.trackId} isRadio={current.isRadio} />
      ),
      defaultVolume: playerState.volume, // Unified volume handling across all devices
      showMediaSession: !current.isRadio,
    }
  }, [playerState, defaultOptions]) // Removed isMobilePlayer dependency

  const onAudioListsChange = useCallback(
    (_, audioLists, audioInfo) => dispatch(syncQueue(audioInfo, audioLists)),
    [dispatch],
  )

  const nextSong = useCallback(() => {
    // Guard against undefined current state
    if (!playerState.current || !playerState.current.uuid) {
      return null
    }

    const idx = playerState.queue.findIndex(
      (item) => item.uuid === playerState.current.uuid,
    )
    return idx !== -1 && idx < playerState.queue.length - 1
      ? playerState.queue[idx + 1]
      : null
  }, [playerState])

  const onAudioProgress = useCallback(
    (info) => {
      // Early safety checks
      if (!info || typeof info !== 'object') {
        return
      }

      if (info.ended) {
        document.title = 'Jap Tap Samagams'
      }

      const progress = (info.currentTime / info.duration) * 100
      if (
        isNaN(info.duration) ||
        isNaN(info.currentTime) ||
        (progress < 50 && info.currentTime < 240)
      ) {
        return
      }

      if (info.isRadio) {
        return
      }

      if (!preloaded) {
        const next = nextSong()
        if (next != null) {
          try {
            const audio = new Audio()
            audio.src = next.musicSrc
          } catch (error) {
            console.warn('Failed to preload next song:', error)
          }
        }
        setPreload(true)
        return
      }

      if (!scrobbled && info.trackId && startTime) {
        try {
          subsonic.scrobble(info.trackId, startTime)
          setScrobbled(true)
        } catch (error) {
          console.warn('Failed to scrobble:', error)
        }
      }
    },
    [startTime, scrobbled, nextSong, preloaded],
  )

  const onAudioVolumeChange = useCallback(
    // sqrt to compensate for the logarithmic volume
    (volume) => dispatch(setVolume(Math.sqrt(volume))),
    [dispatch],
  )

  const onAudioPlay = useCallback(
    (info) => {
      // Safety check
      if (!info || typeof info !== 'object') {
        return
      }

      // Do this to start the context; on chrome-based browsers, the context
      // will start paused since it is created prior to user interaction
      if (context && context.state !== 'running') {
        try {
          context.resume()
        } catch (error) {
          console.warn('Failed to resume audio context:', error)
        }
      }

      dispatch(currentPlaying(info))
      if (startTime === null) {
        setStartTime(Date.now())
      }

      if (info.duration && info.song) {
        const song = info.song
        document.title = `${song.title || 'Unknown'} - ${song.artist || 'Unknown'} - Jap Tap Samagams`

        if (!info.isRadio && info.trackId) {
          try {
            const pos =
              startTime === null ? null : Math.floor(info.currentTime || 0)
            subsonic.nowPlaying(info.trackId, pos)
          } catch (error) {
            console.warn('Failed to update now playing:', error)
          }
        }

        setPreload(false)

        if (config.gaTrackingId) {
          try {
            ReactGA.event({
              category: 'Player',
              action: 'Play song',
              label: `${song.title || 'Unknown'} - ${song.artist || 'Unknown'}`,
            })
          } catch (error) {
            console.warn('Failed to track GA event:', error)
          }
        }

        if (showNotifications) {
          try {
            sendNotification(
              song.title || 'Unknown Track',
              `${song.artist || 'Unknown Artist'} - ${song.album || 'Unknown Album'}`,
              info.cover,
            )
          } catch (error) {
            console.warn('Failed to send notification:', error)
          }
        }
      }
    },
    [context, dispatch, showNotifications, startTime],
  )

  const onAudioPlayTrackChange = useCallback(() => {
    if (scrobbled) {
      setScrobbled(false)
    }
    if (startTime !== null) {
      setStartTime(null)
    }
  }, [scrobbled, startTime])

  const onAudioPause = useCallback(
    (info) => {
      if (info && typeof info === 'object') {
        dispatch(currentPlaying(info))
      }
    },
    [dispatch],
  )

  const onAudioEnded = useCallback(
    (currentPlayId, audioLists, info) => {
      setScrobbled(false)
      setStartTime(null)

      if (info && typeof info === 'object') {
        dispatch(currentPlaying(info))
      }

      if (info && info.trackId) {
        dataProvider
          .getOne('keepalive', { id: info.trackId })
          .catch((e) => console.log('Keepalive error:', e))
      }
    },
    [dispatch, dataProvider],
  )

  const onCoverClick = useCallback((mode, audioLists, audioInfo) => {
    if (mode === 'full' && audioInfo?.song?.albumId) {
      window.location.href = `#/album/${audioInfo.song.albumId}/show`
    }
  }, [])

  const onBeforeDestroy = useCallback(() => {
    return new Promise((resolve, reject) => {
      dispatch(clearQueue())
      reject()
    })
  }, [dispatch])

  if (!visible) {
    document.title = 'Jap Tap Samagams'
  }

  const handlers = useMemo(
    () => keyHandlers(audioInstance, playerState),
    [audioInstance, playerState],
  )

  // Removed mobile-specific volume forcing logic

  // Force show progress bar AND controls on mobile using DOM manipulation as backup
  useEffect(() => {
    const forcePlayerElementsVisible = () => {
      // Force progress bar visible
      const progressBars = document.querySelectorAll('.progress-bar-content')
      progressBars.forEach((bar) => {
        if (bar) {
          bar.style.setProperty('display', 'flex', 'important')
          bar.style.setProperty('visibility', 'visible', 'important')
          bar.style.setProperty('opacity', '1', 'important')
          bar.style.setProperty('order', '-1', 'important')
        }
      })

      // Force player controls visible
      const playerContents = document.querySelectorAll('.player-content')
      playerContents.forEach((content) => {
        if (content) {
          content.style.setProperty('display', 'flex', 'important')
          content.style.setProperty('visibility', 'visible', 'important')
          content.style.setProperty('opacity', '1', 'important')
          content.style.setProperty('order', '1', 'important')
          content.style.setProperty('justify-content', 'center', 'important')
          content.style.setProperty('align-items', 'center', 'important')
        }
      })

      // Force individual control buttons visible
      const controlButtons = document.querySelectorAll(
        '.play-btn, .prev-audio, .next-audio, .player-content .group',
      )
      controlButtons.forEach((button) => {
        if (button) {
          button.style.setProperty('display', 'inline-flex', 'important')
          button.style.setProperty('visibility', 'visible', 'important')
          button.style.setProperty('opacity', '1', 'important')
        }
      })

      // Force panel content to be column layout on mobile
      if (window.innerWidth <= 767) {
        const panelContents = document.querySelectorAll(
          '.music-player-panel .panel-content',
        )
        panelContents.forEach((panel) => {
          if (panel) {
            panel.style.setProperty('flex-direction', 'column', 'important')
            panel.style.setProperty('align-items', 'stretch', 'important')
            panel.style.setProperty('gap', '8px', 'important')
            panel.style.setProperty('height', 'auto', 'important')
          }
        })
      }
    }

    // Run immediately
    forcePlayerElementsVisible()

    // Also run when DOM changes (in case library modifies it)
    const observer = new MutationObserver(forcePlayerElementsVisible)
    observer.observe(document.body, { childList: true, subtree: true })

    // Run on window resize to handle orientation changes
    const handleResize = () => forcePlayerElementsVisible()
    window.addEventListener('resize', handleResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <ThemeProvider theme={createMuiTheme(theme)}>
      <ReactJkMusicPlayer
        {...options}
        className={classes.player}
        onAudioListsChange={onAudioListsChange}
        onAudioVolumeChange={onAudioVolumeChange}
        onAudioProgress={onAudioProgress}
        onAudioPlay={onAudioPlay}
        onAudioPlayTrackChange={onAudioPlayTrackChange}
        onAudioPause={onAudioPause}
        onPlayModeChange={(mode) => dispatch(setPlayMode(mode))}
        onAudioEnded={onAudioEnded}
        onCoverClick={onCoverClick}
        onBeforeDestroy={onBeforeDestroy}
        getAudioInstance={setAudioInstance}
      />
      <GlobalHotKeys handlers={handlers} keyMap={keyMap} allowChanges />
    </ThemeProvider>
  )
}

export { Player }
