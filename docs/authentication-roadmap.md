# Authentication Roadmap for Navidrome

## Part A: Hide Starred Menu for japtaptest User ✅ COMPLETED

**Objective**: Hide certain menu items (like starred albums) for the default `japtaptest` user.

**Implementation Completed**:
- Modified `albumLists.jsx` to use `useGetIdentity()` hook from react-admin
- Converted static `albumLists` object to `useAlbumLists()` hook
- Added conditional logic to hide starred menu when `currentUser === 'japtaptest'`
- Updated all components that use albumLists: Menu.jsx, AlbumList.jsx, SelectDefaultView.jsx

**Key Changes**:
```jsx
// Only show starred if user is not 'japtaptest' and favourites are enabled
...(config.enableFavourites && currentUser !== 'japtaptest' && {
  starred: {
    // ... starred menu configuration
  },
}),
```

## Part B: Future Authentication Changes

### Phase 1: Remove Login Requirement for Default Access

**Objective**: Allow users to access the application without mandatory login, automatically authenticating as `japtaptest`.

**Backend Changes Required**:
1. **Server Configuration**:
   - Add config option `allowAnonymousAccess` or `defaultUser`
   - Modify authentication middleware to auto-authenticate anonymous requests
   - Create a default user session for unauthenticated requests

2. **Authentication Provider Updates** (`/server/auth.go`):
   ```go
   // Add configuration
   type Config struct {
       AllowAnonymousAccess bool
       DefaultUsername      string
       // ... existing config
   }
   
   // Modify auth middleware
   func AuthMiddleware(next http.Handler) http.Handler {
       return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
           token := extractToken(r)
           if token == "" && config.AllowAnonymousAccess {
               // Auto-authenticate as default user
               token = createDefaultUserToken(config.DefaultUsername)
           }
           // ... rest of auth logic
       })
   }
   ```

3. **Database Setup**:
   - Ensure `japtaptest` user exists in database on startup
   - Set appropriate permissions for default user

**Frontend Changes Required**:
1. **Auth Provider Updates** (`/ui/src/authProvider.js`):
   ```js
   const authProvider = {
     checkAuth: () => {
       // Check if anonymous access is enabled
       if (config.allowAnonymousAccess) {
         // Auto-authenticate as japtaptest
         return Promise.resolve()
       }
       return localStorage.getItem('is-authenticated')
         ? Promise.resolve()
         : Promise.reject()
     },
     
     login: ({ username, password }) => {
       // Allow optional login for other users
       // ... existing login logic
     }
   }
   ```

2. **App Component Updates** (`/ui/src/App.jsx`):
   - Skip login page when anonymous access is enabled
   - Show optional "Login" button in header for advanced users

### Phase 2: Enable Google SSO

**Objective**: Allow users to optionally login using Google OAuth for personalized experience.

**Backend Changes Required**:
1. **OAuth Setup**:
   - Add Google OAuth client configuration
   - Install OAuth libraries (e.g., `golang.org/x/oauth2`)
   - Create OAuth endpoints (`/auth/google`, `/auth/google/callback`)

2. **User Management**:
   ```go
   // Add OAuth fields to user model
   type User struct {
       ID          string
       Username    string
       Email       string
       Name        string
       OAuthProvider string `json:"oauth_provider,omitempty"`
       OAuthID     string `json:"oauth_id,omitempty"`
       // ... existing fields
   }
   ```

3. **OAuth Endpoints**:
   ```go
   func GoogleLogin(w http.ResponseWriter, r *http.Request) {
       url := googleOAuthConfig.AuthCodeURL(state)
       http.Redirect(w, r, url, http.StatusTemporaryRedirect)
   }
   
   func GoogleCallback(w http.ResponseWriter, r *http.Request) {
       token, err := googleOAuthConfig.Exchange(ctx, r.FormValue("code"))
       // Get user info from Google
       // Create or update user in database
       // Generate JWT token
   }
   ```

**Frontend Changes Required**:
1. **Login Page Updates** (`/ui/src/layout/Login.jsx`):
   ```jsx
   const GoogleSignInButton = () => (
     <Button
       variant="outlined"
       fullWidth
       onClick={() => window.location.href = '/api/auth/google'}
       startIcon={<GoogleIcon />}
     >
       Sign in with Google
     </Button>
   )
   ```

2. **User Menu Updates**:
   - Show user avatar from Google profile
   - Display sign-out option for OAuth users
   - Allow switching between anonymous and authenticated modes

### Phase 3: Hybrid Authentication System

**Features**:
1. **Three Access Modes**:
   - Anonymous (auto japtaptest)
   - Username/Password login
   - Google OAuth login

2. **User Experience**:
   - Default: Anonymous access with limited features
   - Optional: Login for personalized playlists, preferences
   - Seamless: Switch between modes without losing playback state

3. **Configuration Options**:
   ```toml
   # navidrome.toml
   [auth]
   AllowAnonymousAccess = true
   DefaultUsername = "japtaptest"
   
   [oauth.google]
   ClientID = "your-google-client-id"
   ClientSecret = "your-google-client-secret"
   RedirectURL = "http://localhost:4533/auth/google/callback"
   ```

## Implementation Timeline

### Immediate (Phase 1 - No Login Required)
1. Add backend config for anonymous access
2. Modify auth middleware for default user
3. Update frontend auth provider
4. Test with japtaptest default user

### Short Term (Phase 2 - Google SSO)
1. Setup Google OAuth credentials
2. Implement OAuth endpoints
3. Create OAuth user flow
4. Add Google sign-in button

### Long Term (Phase 3 - Hybrid System)
1. Refine user experience
2. Add user preference sync
3. Implement session management
4. Add admin controls for auth methods

## Security Considerations

1. **Anonymous Access**:
   - Limit permissions for default user
   - No admin access for anonymous users
   - Optional rate limiting

2. **OAuth Security**:
   - Validate OAuth tokens
   - Secure callback URLs
   - Handle OAuth errors gracefully

3. **Session Management**:
   - Secure JWT tokens
   - Proper token expiration
   - CSRF protection for OAuth flows

## Testing Strategy

1. **Unit Tests**:
   - Auth middleware tests
   - OAuth flow tests
   - Frontend auth provider tests

2. **Integration Tests**:
   - End-to-end login flows
   - Permission checksLAYER
   - User switching scenarios

3. **Manual Testing**:
   - Different browser scenarios
   - Mobile device testing
   - OAuth provider edge cases