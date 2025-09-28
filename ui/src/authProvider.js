import { jwtDecode } from 'jwt-decode'
import { baseUrl } from './utils'
import config from './config'
import { removeHomeCache } from './utils/removeHomeCache'

// Check if there is a valid session for a different user
// to avoid overwriting the current session
// when the config.auth is set from the server
const hasValidSessionForDifferentUser = (authInfo) => {
  const existingToken = localStorage.getItem('token')
  if (!existingToken) return false

  try {
    const decoded = jwtDecode(existingToken)
    const expired = decoded?.exp && decoded.exp * 1000 < Date.now()
    if (expired) return false

    const tokenUser = decoded?.sub
    const storedUser = localStorage.getItem('username')
    const sessionUser = (tokenUser || storedUser || '').toLowerCase()
    const authUser = (authInfo?.username || '').toLowerCase()

    console.log('Session user:', sessionUser, ' Auth user:', authUser)
    return sessionUser && authUser && sessionUser !== authUser
  } catch {
    return false
  }
}

// config sent from server may contain authentication info, for example when the user is authenticated
// by a reverse proxy request header
console.log('Config: SERVER', config)
if (config.auth && !hasValidSessionForDifferentUser(config.auth)) {
  try {
    storeAuthenticationInfo(config.auth)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e)
  }
}

function storeAuthenticationInfo(authInfo) {
  authInfo.token && localStorage.setItem('token', authInfo.token)
  localStorage.setItem('userId', authInfo.id)
  localStorage.setItem('name', authInfo.name)
  localStorage.setItem('username', authInfo.username)
  authInfo.avatar && localStorage.setItem('avatar', authInfo.avatar)
  localStorage.setItem('role', authInfo.isAdmin ? 'admin' : 'regular')
  localStorage.setItem('subsonic-salt', authInfo.subsonicSalt)
  localStorage.setItem('subsonic-token', authInfo.subsonicToken)
  localStorage.setItem('is-authenticated', 'true')
}

const authProvider = {
  login: ({ username, password }) => {
    let url = baseUrl('/auth/login')
    if (config.firstTime) {
      url = baseUrl('/auth/createAdmin')
    }
    const request = new Request(url, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    return fetch(request)
      .then((response) => {
        if (response.status < 200 || response.status >= 300) {
          throw new Error(response.statusText)
        }
        return response.json()
      })
      .then((response) => {
        jwtDecode(response.token) // Validate token
        storeAuthenticationInfo(response)
        // Avoid "going to create admin" dialog after logout/login without a refresh
        config.firstTime = false
        removeHomeCache()
        return response
      })
      .catch((error) => {
        if (
          error.message === 'Failed to fetch' ||
          error.stack === 'TypeError: Failed to fetch'
        ) {
          throw new Error('errors.network_error')
        }

        throw new Error(error)
      })
  },

  logout: () => {
    removeItems()
    return Promise.resolve()
  },

  checkAuth: () =>
    localStorage.getItem('is-authenticated')
      ? Promise.resolve()
      : Promise.reject(),

  checkError: ({ status }) => {
    if (status === 401) {
      removeItems()
      return Promise.reject()
    }
    return Promise.resolve()
  },

  getPermissions: () => {
    const role = localStorage.getItem('role')
    return role ? Promise.resolve(role) : Promise.reject()
  },

  getIdentity: () => {
    return Promise.resolve({
      id: localStorage.getItem('username'),
      fullName: localStorage.getItem('name'),
      avatar: localStorage.getItem('avatar'),
    })
  },
}

const removeItems = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userId')
  localStorage.removeItem('name')
  localStorage.removeItem('username')
  localStorage.removeItem('avatar')
  localStorage.removeItem('role')
  localStorage.removeItem('subsonic-salt')
  localStorage.removeItem('subsonic-token')
  localStorage.removeItem('is-authenticated')
}

export default authProvider
