import LightTheme from './light'
import DarkTheme from './dark'
import ExtraDarkTheme from './extradark'
// import GreenTheme from './green'
import SpotifyTheme from './spotify'
// import LigeraTheme from './ligera'
// import MonokaiTheme from './monokai'
// import ElectricPurpleTheme from './electricPurple'
import NordTheme from './nord'
import GruvboxDarkTheme from './gruvboxDark'
import CatppuccinMacchiatoTheme from './catppuccinMacchiato'
import NuclearTheme from './nuclear'
import JaptapMidnightTheme from './japtapMidnight'
import JaptapAppleTheme from './japtapApple'
import appleLiquidGlassTheme from './appleLiquidGlassTheme'
import japtapHighContrast from './japtapHighContrast'
import japtapLight from './japtapLight'

// To add a new theme, create a new file in this directory, define the theme
// using createTheme(), and then import it here and add it to the export below.
// Please keep the themes in alphabetic order, except for the classic Light and
// Dark themes which should remain at the top of the list.

// Each theme should also have a corresponding CSS-in-JS file to style the
// audio player. The naming convention is <themeName>Theme.css.js. The theme
// file should import the CSS-in-JS file and pass it to the `overrides` field
// of the theme object, as shown below.

// Example from japtapAppleTheme.js:

export default {
  // Classic default themes
  japtapLight,
  japtapHighContrast,
  NordTheme,
  LightTheme,
  DarkTheme,
  SpotifyTheme,
  // JaptapAppleTheme,
  // New themes should be added here, in alphabetic order
  CatppuccinMacchiatoTheme,
  ExtraDarkTheme,
  GruvboxDarkTheme,
  NuclearTheme,

  JaptapMidnightTheme,
  // appleLiquidGlassTheme,
  // ElectricPurpleTheme,
  // GreenTheme,
  //LigeraTheme,
  // MonokaiTheme,
}
