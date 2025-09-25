// These defaults are only used in development mode. When bundled in the app,
// the __APP_CONFIG__ object is dynamically filled by the ServeIndex function,
// in the /server/app/serve_index.go
const defaultConfig = {
  version: 'dev',
  firstTime: false,
  baseURL: '',
  variousArtistsId: '63sqASlAfjbGMuLP4JhnZU', // See consts.VariousArtistsID in consts.go
  // Login backgrounds from https://unsplash.com/collections/1065384/music-wallpapers
  loginBackgroundURL: 'https://source.unsplash.com/collection/1065384/1600x900',
  maxSidebarPlaylists: 100,
  enableTranscodingConfig: true,
  enableDownloads: true,
  enableFavourites: true,
  losslessFormats: 'FLAC,WAV,ALAC,DSF',
  welcomeMessage: '',
  gaTrackingId: '',
  devActivityPanel: true,
  enableStarRating: false,
  defaultTheme: 'Japtap Apple',
  defaultLanguage: '',
  defaultUIVolume: 100,
  enableUserEditing: true,
  enableSharing: true,
  shareURL: '',
  defaultDownloadableShare: true,
  devSidebarPlaylists: true,
  lastFMEnabled: true,
  listenBrainzEnabled: true,
  enableExternalServices: true,
  enableCoverAnimation: true,
  enableNowPlaying: true,
  devShowArtistPage: true,
  devUIShowConfig: true,
  devNewEventStream: false,
  enableReplayGain: true,
  defaultDownsamplingFormat: 'opus',
  publicBaseUrl: '/share',
  separator: '/',
  enableInspect: true,
  defaultPerPage: 25,
  defaultUser: 'japtaptest',
}

let config

try {
  const appConfig = JSON.parse(window.__APP_CONFIG__)
  config = {
    ...defaultConfig,
    ...appConfig,
  }
} catch (e) {
  config = defaultConfig
}

// Helper function that can handle multiple user sources
export const isFavouritesEnabledForCurrentUser = (currentUser = null) => {
  // Allow passing currentUser as parameter, or get from localStorage
  const user = currentUser || localStorage.getItem('username')
  return config.enableFavourites && user && user !== config.defaultUser
}

export let shareInfo

try {
  shareInfo = JSON.parse(window.__SHARE_INFO__)
} catch (e) {
  shareInfo = null
}

export default config
