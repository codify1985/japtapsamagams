import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, beforeEach, vi } from 'vitest'
import { Provider } from 'react-redux'
import { createStore, combineReducers } from 'redux'
import { activityReducer } from '../reducers'
import AppBar from './AppBar'
import config from '../config'

let store

// Mock react-admin and other dependencies
vi.mock('react-admin', () => ({
  AppBar: ({ userMenu }) => <div data-testid="appbar">{userMenu}</div>,
  useTranslate: () => (x) => x,
  usePermissions: () => ({ permissions: 'admin' }),
  useGetIdentity: () => ({
    loaded: true,
    identity: { id: 'test-user', name: 'Test User' },
  }),
  useNotify: () => vi.fn(),
  getResources: () => [],
  MenuItemLink: ({ primaryText }) => (
    <div data-testid="menu-item-link">{primaryText}</div>
  ),
}))

vi.mock('@material-ui/core', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useMediaQuery: vi.fn(() => true),
    makeStyles: vi.fn(() => () => ({ root: '', active: '', icon: '' })),
    withWidth: vi.fn(() => (Component) => Component), // Add this line
  }
})

vi.mock('../common/ShareButton', () => ({
  default: () => <div data-testid="share-button" />,
}))

vi.mock('../dialogs/Dialogs', () => ({
  Dialogs: () => null,
}))

vi.mock('./useInitialScanStatus', () => ({
  useInitialScanStatus: () => {},
}))

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/songs' }),
}))

describe('<AppBar />', () => {
  beforeEach(() => {
    config.devActivityPanel = true
    config.enableNowPlaying = true
    config.enableSharing = true
    config.enableUserEditing = true
    store = createStore(combineReducers({ activity: activityReducer }))
    // Reset all mocks
    vi.clearAllMocks()
  })

  it('renders AppBar with user menu', () => {
    render(
      <Provider store={store}>
        <AppBar />
      </Provider>,
    )
    expect(screen.getByTestId('appbar')).toBeInTheDocument()
  })

  it('renders ShareButton when sharing is enabled', () => {
    config.enableSharing = true
    render(
      <Provider store={store}>
        <AppBar />
      </Provider>,
    )
    expect(screen.getByTestId('share-button')).toBeInTheDocument()
  })

  it('hides ShareButton when sharing is disabled', () => {
    config.enableSharing = false
    render(
      <Provider store={store}>
        <AppBar />
      </Provider>,
    )
    expect(screen.queryByTestId('share-button')).toBeNull()
  })

  it('renders ActivityPanel when devActivityPanel is enabled and user is admin', () => {
    config.devActivityPanel = true
    render(
      <Provider store={store}>
        <AppBar />
      </Provider>,
    )
    expect(screen.getByTestId('activity-panel')).toBeInTheDocument()
  })

  it('hides ActivityPanel when devActivityPanel is disabled', () => {
    config.devActivityPanel = false
    render(
      <Provider store={store}>
        <AppBar />
      </Provider>,
    )
    expect(screen.queryByTestId('activity-panel')).toBeNull()
  })

  it('renders NowPlayingPanel only when all conditions are met', () => {
    config.devActivityPanel = true
    config.enableNowPlaying = true
    render(
      <Provider store={store}>
        <AppBar />
      </Provider>,
    )
    expect(screen.getByTestId('now-playing-panel')).toBeInTheDocument()
  })

  it('hides NowPlayingPanel when devActivityPanel is false', () => {
    config.devActivityPanel = false
    config.enableNowPlaying = true
    render(
      <Provider store={store}>
        <AppBar />
      </Provider>,
    )
    expect(screen.queryByTestId('now-playing-panel')).toBeNull()
  })
})
