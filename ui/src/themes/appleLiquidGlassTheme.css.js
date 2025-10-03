const stylesheet = `
.react-jinke-music-player-main svg:active,
.react-jinke-music-player-main svg:hover {
  color: #0077ee;
}

.react-jinke-music-player-main .music-player-panel .panel-content .rc-slider-handle,
.react-jinke-music-player-main .music-player-panel .panel-content .rc-slider-track {
  background-color: #0077ee;
}

.react-jinke-music-player-main ::-webkit-scrollbar-thumb {
  background-color: rgba(0, 119, 238, 0.65);
}

.react-jinke-music-player-main .music-player-panel .panel-content .rc-slider-handle:active {
  box-shadow: 0 0 0 4px rgba(0, 119, 238, 0.25);
}

.react-jinke-music-player-main .audio-item.playing svg {
  color: #0077ee;
}

.react-jinke-music-player-main .audio-item.playing .player-singer {
  color: #0077ee !important;
}

.react-jinke-music-player-main .loading svg {
  color: #0077ee !important;
}

.react-jinke-music-player-main .music-player-panel {
  background: linear-gradient(160deg, rgba(24, 32, 46, 0.92), rgba(8, 14, 20, 0.88));
  backdrop-filter: blur(22px) saturate(180%);
  color: #f5f7fa;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.55);
}

.audio-lists-panel {
  background: linear-gradient(180deg, rgba(22, 30, 44, 0.94), rgba(10, 16, 26, 0.92));
  backdrop-filter: blur(22px) saturate(180%);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.55);
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.audio-lists-panel-content .audio-item.playing,
.audio-lists-panel-content .audio-item.playing svg {
  color: #0077ee;
}

.audio-lists-panel-content .audio-item:hover {
  background: rgba(77, 163, 255, 0.16);
}

.react-jinke-music-player-main .music-player-panel .panel-content .img-content {
  border-radius: 18px;
  box-shadow: 0 18px 44px rgba(11, 12, 15, 0.12);
}

.react-jinke-music-player-main .music-player-panel .panel-content .player-content .audio-lists-btn {
  background-color: rgba(77, 163, 255, 0.16);
  color: #5cb6ff;
  border-radius: 16px;
}

.react-jinke-music-player-main .music-player-lyric {
  color: rgba(245, 247, 250, 0.85);
  font-weight: 600;
}

.react-jinke-music-player-mobile-cover {
  border-radius: 26px;
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.55);
}

.react-jinke-music-player .music-player-controller {
  border-radius: 20px;
  background: linear-gradient(160deg, rgba(22, 30, 44, 0.94), rgba(10, 16, 26, 0.9));
  color: #5cb6ff;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}

.react-jinke-music-player-mobile-progress .rc-slider-handle,
.react-jinke-music-player-mobile-progress .rc-slider-track {
  background-color: #0077ee;
}

.react-jinke-music-player-mobile-progress .rc-slider-handle {
  border: none;
}
`

export default stylesheet
