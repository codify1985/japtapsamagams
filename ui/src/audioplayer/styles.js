/*
 * MOBILE/DESKTOP PLAYER UNIFICATION CHANGES:
 *
 * 1. Removed separate mobile player component switching
 * 2. Added CSS Grid layout for responsive mobile design
 * 3. Progress bar and content arranged in 2 rows on mobile (<768px)
 * 4. Single row layout maintained on desktop (≥768px)
 * 5. Player pinned to bottom with proper z-index and safe area handling
 */

import { makeStyles } from '@material-ui/core/styles'

const useStyle = makeStyles(
  (theme) => ({
    audioTitle: {
      textDecoration: 'none',
      color: theme.palette.primary.dark,
    },
    songTitle: {
      fontWeight: 'bold',
      '&:hover + $qualityInfo': {
        opacity: 1,
      },
    },
    songInfo: {
      display: 'block',
      marginTop: '2px',
    },
    songAlbum: {
      fontStyle: 'italic',
      fontSize: 'smaller',
    },
    qualityInfo: {
      marginTop: '-4px',
      opacity: 0,
      transition: 'all 500ms ease-out',
    },
    player: {
      display: (props) => (props.visible ? 'block' : 'none'),

      // Force desktop player mode always - override all mobile styles
      '& .react-jinke-music-player-main': {
        // Ensure main container is fixed at bottom
        position: 'fixed !important',
        bottom: '0 !important',
        left: '0 !important',
        right: '0 !important',
        width: '100% !important',
        height: 'auto !important',
        zIndex: '999 !important',

        // Hide any mobile overlay completely
        '& .react-jinke-music-player-mobile': {
          display: 'none !important',
          visibility: 'hidden !important',
          opacity: '0 !important',
          pointerEvents: 'none !important',
        },

        // Force desktop panel to be visible and positioned correctly
        '& .music-player-panel': {
          position: 'relative !important',
          bottom: 'auto !important',
          left: 'auto !important',
          right: 'auto !important',
          top: 'auto !important',
          width: '100% !important',
          height: 'auto !important',
          minHeight: '80px !important',
          backgroundColor: theme.palette.background.default + ' !important',
          color: theme.palette.text.primary + ' !important',
          borderTop: `1px solid ${theme.palette.divider}`,

          // Mobile adjustments for 2-row layout
          '@media (max-width: 767px)': {
            minHeight: '120px !important',
            paddingBottom: 'calc(8px + env(safe-area-inset-bottom)) !important',
          },

          '& .panel-content': {
            display: 'flex !important',
            alignItems: 'center !important',
            justifyContent: 'space-between !important',
            height: '100% !important',
            width: '100% !important',
            padding: '8px 12px !important',
            gap: '12px !important',

            // Mobile: stack progress bar above controls
            '@media (max-width: 767px)': {
              flexDirection: 'column !important',
              alignItems: 'stretch !important',
              gap: '8px !important',
              height: 'auto !important',

              // Progress bar moves to top and MUST be visible
              '& .progress-bar-content': {
                order: -1,
                padding: '0 !important',
                width: '100% !important',
                display: 'flex !important',
                flexDirection: 'column !important',

                // Ensure the progress bar itself is visible
                '& .audio-main': {
                  display: 'flex !important',
                  justifyContent: 'center !important',
                  width: '100% !important',
                },

                // Make sure the actual progress bar elements are visible
                '& .progress-bar': {
                  display: 'block !important',
                  width: '100% !important',
                },

                // Show time indicators
                '& .current-time, & .duration': {
                  display: 'block !important',
                },
              },

              // Controls row below progress
              '& .player-content': {
                order: 1,
                flexBasis: 'auto !important',
                paddingLeft: '0 !important',
                width: '100% !important',
                justifyContent: 'center !important',
              },

              // Hide cover image on mobile to save space
              '& .img-content': {
                display: 'none !important',
              },
            },
          },
        },
      },

      // CRITICAL: Override library CSS that hides progress bar on mobile
      // Library CSS: @media screen and (max-width:767px){.react-jinke-music-player-main .music-player-panel .panel-content .progress-bar-content{display:none!important}}
      '& .react-jinke-music-player-main .music-player-panel .panel-content .progress-bar-content':
        {
          display: 'flex !important',
          flexDirection: 'column !important',

          // Force visible on all screen sizes, especially mobile
          '@media screen and (max-width:767px)': {
            display: 'flex !important', // Override the library's display:none!important
          },

          '@media (max-width: 767px)': {
            display: 'flex !important', // Double override to be sure
            order: -1,
            padding: '0 !important',
            width: '100% !important',

            '& .audio-main': {
              display: 'flex !important',
              justifyContent: 'center !important',
              width: '100% !important',
            },

            '& .progress-bar': {
              display: 'block !important',
              width: '100% !important',
            },

            '& .current-time, & .duration': {
              display: 'block !important',
            },
          },
        },

      '@media screen and (max-width:768px)': {
        '& .sound-operation': {
          display: 'none', // Hide volume controls on mobile as per original logic
        },

        // Override library hiding of progress bar with maximum specificity
        '&.react-jinke-music-player-main .music-player-panel .panel-content .progress-bar-content':
          {
            display: 'flex !important',
          },
      },
      '@media (prefers-reduced-motion)': {
        '& .music-player-panel .panel-content div.img-rotate': {
          animation: 'none',
        },
      },

      '& .play-mode-title': {
        'pointer-events': 'none',
      },
      '& .music-player-panel .panel-content div.img-rotate': {
        // Customize desktop player when cover animation is disabled
        animationDuration: (props) => !props.enableCoverAnimation && '0s',
        borderRadius: (props) => !props.enableCoverAnimation && '0',
        // Fix cover display when image is not square
        backgroundSize: 'contain',
        backgroundPosition: 'center',
      },

      // Removed mobile-specific .react-jinke-music-player-mobile styles since we're using unified desktop player

      // Force progress bar to be visible on mobile (override original hiding logic)
      '& .music-player-panel .panel-content .progress-bar-content': {
        display: 'flex !important',
        flexDirection: 'column !important',

        '@media (max-width: 767px)': {
          display: 'flex !important', // Override any hiding on mobile
        },
      },

      '& .music-player-panel .panel-content .progress-bar-content section.audio-main':
        {
          display: (props) =>
            props.isRadio ? 'none !important' : 'flex !important',

          // Force visible on mobile even for non-radio content
          '@media (max-width: 767px)': {
            display: (props) =>
              props.isRadio ? 'none !important' : 'flex !important',
          },
        },
      // Removed .react-jinke-music-player-mobile-progress since we're not using mobile mode
    },

    // MAXIMUM SPECIFICITY OVERRIDE: Combat library's !important rule hiding progress bar on mobile
    // This targets the exact selector the library uses with even higher specificity
    '@media screen and (max-width:767px)': {
      '&&& .react-jinke-music-player-main .music-player-panel .panel-content .progress-bar-content':
        {
          display: 'flex !important',
          visibility: 'visible !important',
          opacity: '1 !important',
          height: 'auto !important',
          overflow: 'visible !important',
        },
    },
  }),
  { name: 'NDAudioPlayer' },
)

export default useStyle
