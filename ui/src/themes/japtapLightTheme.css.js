const expandHex = (hex) => {
  const value = hex.replace('#', '')
  if (value.length === 3) {
    return value
      .split('')
      .map((char) => char + char)
      .join('')
  }
  return value
}

const withAlpha = (hex, alpha) => {
  const expanded = expandHex(hex)
  const int = parseInt(expanded, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const createPlayerStylesheet = (primaryColor) => {
  const focusRing = withAlpha(primaryColor, 0.25)
  const iconHover = withAlpha(primaryColor, 0.85)

  return `
/* ===== JapTap Light: Player-only light theme pass ===== */

/* Bottom controller (mini player) */
.react-jinke-music-player .music-player-controller {
  border-radius: 24px !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98),
    rgba(245, 245, 247, 0.96)
  ) !important;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.12),
    0 6px 20px rgba(0, 0, 0, 0.08) !important;
  backdrop-filter: blur(6px) saturate(110%);
  overflow: hidden;
  /* keep controls clear of device home indicators (mobile Safari) */
  padding-bottom: max(0px, env(safe-area-inset-bottom));
}

/* Seekbar accents (controller) */
.react-jinke-music-player .music-player-controller .rc-slider-track,
.react-jinke-music-player .music-player-controller .rc-slider-handle {
  background-color: ${primaryColor};
}
.react-jinke-music-player .music-player-controller .rc-slider-handle {
  border: none;
  box-shadow: 0 0 0 4px ${focusRing};
}
.react-jinke-music-player .music-player-controller .rc-slider-rail {
  background: rgba(0, 0, 0, 0.12);
}

/* Icon coloring (controller) */
.react-jinke-music-player .music-player-controller .group button,
.react-jinke-music-player .music-player-controller .group svg,
.react-jinke-music-player .music-player-controller .player-icons button,
.react-jinke-music-player .music-player-controller .player-icons svg {
  color: ${primaryColor} !important;
  fill: currentColor;
}
.react-jinke-music-player .music-player-controller .group button:hover,
.react-jinke-music-player .music-player-controller .player-icons button:hover,
.react-jinke-music-player .music-player-controller .group button:focus-visible,
.react-jinke-music-player .music-player-controller .player-icons button:focus-visible {
  color: ${iconHover} !important;
}
.react-jinke-music-player .music-player-controller .player-icons button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px ${focusRing};
  border-radius: 12px;
}

/* Expanded panel (full player) */
.react-jinke-music-player-main .music-player-panel {
  border-radius: 26px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: linear-gradient(
    180deg,
    rgba(10, 132, 255, 0.95) 0%,      /* Primary accent blue at the top */
    rgba(255, 255, 255, 0.98) 60%,    /* White for body */
    rgba(245, 245, 247, 1) 100%       /* Light gray at the bottom */
  );
  box-shadow: 0 8px 32px rgba(10, 132, 255, 0.18), 0 2px 8px rgba(0,0,0,0.12);
 
  backdrop-filter: blur(6px) saturate(110%);
  overflow: hidden;
}

.react-jinke-music-player-main
  .music-player-panel
  .panel-content
  .progress-bar-content
  .songTitle,
.react-jinke-music-player-main
  .music-player-panel
  .panel-content
  .progress-bar-content
  .songAlbum,
  .react-jinke-music-player-main
  .music-player-panel
  .panel-content
  .progress-bar-content
  .songArtist {
  color: #1D1D1F !important;
}

/* Seekbar accents (panel) */
.react-jinke-music-player-main .panel-content .rc-slider-track,
.react-jinke-music-player-main .panel-content .rc-slider-handle {
  background-color: ${primaryColor};
}
.react-jinke-music-player-main .panel-content .rc-slider-handle {
  border: none;
  box-shadow: 0 0 0 5px ${focusRing};
}
.react-jinke-music-player-main .panel-content .rc-slider-rail {
  background: rgba(0, 0, 0, 0.12);
}

/* Icon coloring (panel) */
.react-jinke-music-player-main .panel-content .player-icons button,
.react-jinke-music-player-main .panel-content .player-icons svg,
.react-jinke-music-player-main .panel-content .audio-item .group svg {
  color: ${primaryColor} !important;
  fill: currentColor;
}
.react-jinke-music-player-main .panel-content .player-icons button:hover,
.react-jinke-music-player-main .panel-content .player-icons button:focus-visible {
  color: ${iconHover} !important;
}
`
}

export default createPlayerStylesheet
