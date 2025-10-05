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
  defaultTheme: 'High Contrast',
  defaultLanguage: '',
  defaultUIVolume: 100,
  enableUserEditing: true,
  enableUserSelfSignup: true,
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
  maxYears: 2022,
  defaultAlbumView: 'grid',
  // Authentication info that may be set by the server
  auth: {
    id: 'MVMrmivcaedABWnQdF6pnT',
    isAdmin: false,
    name: 'Japtap Test User',
    subsonicSalt: '804b5e',
    subsonicToken: '0e52e4ad34f0be4765c24d93128be2dc',
    username: 'japtaptest',
  },
  // auth: true
}

// '{"auth":{"id":"MVMrmivcaedABWnQdF6pnT","isAdmin":false,"name":"Japtap Test User","subsonicSalt":"804b5e","subsonicToken":"0e52e4ad34f0be4765c24d93128be2dc","username":"japtaptest"},
// "baseURL":"","defaultDownloadableShare":false,"defaultDownsamplingFormat":"opus","defaultLanguage":"","defaultTheme":"Japtap Apple","defaultUIVolume":100,"devActivityPanel":true,"devNewEventStream":false,
// "devShowArtistPage":true,"devSidebarPlaylists":true,"devUIShowConfig":true,"enableCoverAnimation":true,"enableDownloads":true,"enableExternalServices":false,"enableFavourites":true,"enableInspect":true,"enableNowPlaying":true,
// // "enableReplayGain":true,"enableSharing":true,"enableStarRating":true,"enableTranscodingConfig":false,"enableUserEditing":true,"firstTime":false,"gaTrackingId":"",
// // "lastFMEnabled":false,"listenBrainzEnabled":false,
// // "loginBackgroundURL":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAAABGdBTUEAALGPC/xhBQAAAiJJREFUeF7t0IEAAAAAw6D5Ux/khVBhwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDDwMDDVlwABBWcSrQAAAABJRU5ErkJggg==","losslessFormats":"FLAC,ALAC,APE,SHN,DSF,WV,WVP,TAK,WAV","maxSidebarPlaylists":100,"separator":"/","shareURL":"http://localhost:4633","variousArtistsId":"63sqASlAfjbGMuLP4JhnZU","version":"dev","welcomeMessage":""}'

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
