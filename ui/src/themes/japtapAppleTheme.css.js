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
.react-jinke-music-player .music-player-controller {
  border-radius: 24px !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  background: linear-gradient(180deg, rgba(18, 26, 42, 0.96), rgba(10, 16, 27, 0.92)) !important;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

.react-jinke-music-player .music-player-controller .rc-slider-track,
.react-jinke-music-player .music-player-controller .rc-slider-handle {
  background-color: ${primaryColor};
}

.react-jinke-music-player .music-player-controller .rc-slider-handle {
  border: none;
  box-shadow: 0 0 0 4px ${focusRing};
}

.react-jinke-music-player .music-player-controller .rc-slider-rail {
  background: rgba(255, 255, 255, 0.12);
}

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

.react-jinke-music-player-main .music-player-panel {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(18, 26, 42, 0.96), rgba(10, 16, 27, 0.92));
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.react-jinke-music-player-main .panel-content .rc-slider-track,
.react-jinke-music-player-main .panel-content .rc-slider-handle {
  background-color: ${primaryColor};
}

.react-jinke-music-player-main .panel-content .rc-slider-handle {
  border: none;
  box-shadow: 0 0 0 5px ${focusRing};
}

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
