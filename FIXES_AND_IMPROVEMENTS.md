# Navidrome Frontend Issues & Improvements Guide

## Overview
This document outlines all the React/JavaScript issues found in your Navidrome frontend and provides step-by-step solutions for each problem.

---

## 🚨 Critical Issues (Fix Immediately)

### 1. React forwardRef Error in ShareButton

**Issue:** Function components cannot be given refs without forwardRef()
**Location:** `ui/src/common/ShareButton.jsx`
**Error:** 
```
Function components cannot be given refs. Attempts to access this ref will fail. 
Did you mean to use React.forwardRef()?
```

**Solution:**
The ShareButton component is using a ref but the react-admin `Button` component expects a ref. You need to use `forwardRef`:

```jsx
// File: ui/src/common/ShareButton.jsx
import React, { useState, useCallback, useRef, forwardRef } from 'react'

// Change this:
const ShareButton = ({
  record,
  entityType = 'album',
  // ... other props
}) => {
  // ... existing code
  
  return (
    <>
      <Button
        ref={buttonRef}  // This is causing the error
        onClick={handleButtonClick}
        disabled={isDisabled}
        label={finalLabel}
        {...buttonProps}
      >
        {icon}
      </Button>
      {/* ... rest of component */}
    </>
  )
}

// To this:
const ShareButton = forwardRef(({
  record,
  entityType = 'album',
  // ... other props
}, ref) => {
  // ... existing code (keep buttonRef for internal use)
  
  return (
    <>
      <Button
        ref={ref || buttonRef}  // Use external ref or internal ref
        onClick={handleButtonClick}
        disabled={isDisabled}
        label={finalLabel}
        {...buttonProps}
      >
        {icon}
      </Button>
      {/* ... rest of component */}
    </>
  )
})

ShareButton.displayName = 'ShareButton'
export default ShareButton
```

---

### 2. Material-UI Collapse Deprecation Warning

**Issue:** `collapsedHeight` prop is deprecated
**Location:** `ui/src/album/AlbumDetails.jsx`
**Error:** 
```
The prop `collapsedHeight` of `ForwardRef(Collapse2)` is deprecated. 
Use `collapsedSize` instead
```

**Solution:**
Replace all instances of `collapsedHeight` with `collapsedSize`:

```jsx
// File: ui/src/album/AlbumDetails.jsx

// Line ~370 - Change this:
<Collapse
  collapsedHeight={'2.75em'}  // ❌ Deprecated
  in={expanded}
  timeout={'auto'}
  className={classes.notes}
>

// To this:
<Collapse
  collapsedSize={'2.75em'}  // ✅ Correct
  in={expanded}
  timeout={'auto'}
  className={classes.notes}
>

// Line ~390 - Change this:
<Collapse collapsedHeight={'1.5em'} in={expanded} timeout={'auto'}>

// To this:
<Collapse collapsedSize={'1.5em'} in={expanded} timeout={'auto'}>
```

---

### 3. Invalid DOM Prop Warning

**Issue:** `currentUser` prop being passed to DOM element
**Location:** Various components
**Error:**
```
React does not recognize the `currentUser` prop on a DOM element.
Remove it from the DOM element.
```

**Solution:**
Find components that spread props containing `currentUser` and destructure it out:

```jsx
// Example fix pattern:
const SomeComponent = ({ currentUser, ...domProps }) => {
  // Use currentUser in logic, but don't spread it to DOM
  return (
    <div {...domProps}>  {/* currentUser won't be passed to DOM */}
      {currentUser && <SomeContent />}
    </div>
  )
}
```

**Files to check:**
- `ui/src/album/AlbumActions.jsx`
- `ui/src/album/AlbumSongs.jsx` 
- `ui/src/layout/AppBar.jsx`

---

### 4. Memory Leak & Infinite Errors in Music Player ✅ FIXED

**Issue:** State updates on unmounted components + infinite TypeError from undefined playerState.current
**Location:** `ui/src/audioplayer/Player.jsx` 
**Error:**
```
Can't perform a React state update on an unmounted component. 
Uncaught TypeError: Cannot read properties of undefined (reading 'uuid')
```

**Solution Applied:**
```jsx
// Added safety guards to prevent crashes:
const nextSong = useCallback(() => {
  // Guard against undefined current state
  if (!playerState.current || !playerState.current.uuid) {
    return null
  }
  
  const idx = playerState.queue.findIndex(
    (item) => item.uuid === playerState.current.uuid,
  )
  return idx !== -1 && idx < playerState.queue.length - 1 
    ? playerState.queue[idx + 1] 
    : null
}, [playerState])

// Added component-level safety check:
if (!playerState || !playerState.queue || !Array.isArray(playerState.queue)) {
  return null
}

// Added safety checks to all callbacks:
const onAudioProgress = useCallback((info) => {
  if (!info || typeof info !== 'object') {
    return
  }
  // ... rest of logic with try-catch blocks
}, [dependencies])
```

---

## 🎯 Performance Optimizations

### 5. Prevent Redundant Album Info API Calls

**Issue:** Album info is fetched every time even when cached
**Location:** `ui/src/album/AlbumDetails.jsx`
**Log Evidence:** 
```
AlbumInfo not cached. Retrieving it now
Found expired cached AlbumInfo, refreshing in the background
```

**Solution:**
Add intelligent caching logic:

```jsx
// File: ui/src/album/AlbumDetails.jsx
useEffect(() => {
  // ✅ Enhanced caching logic
  if (albumInfo) {
    // Check if we have recent enough data
    const updatedAt = record.updatedAt ? new Date(record.updatedAt) : null
    const now = new Date()
    const cacheAgeMs = updatedAt ? now - updatedAt : Infinity
    const maxCacheAgeMs = 5 * 60 * 1000 // 5 minutes
    
    if (cacheAgeMs < maxCacheAgeMs) {
      return // Use cached data if it's fresh enough
    }
  }

  let isMounted = true

  subsonic
    .getAlbumInfo(record.id)
    .then((resp) => resp.json['subsonic-response'])
    .then((data) => {
      if (isMounted && data.status === 'ok') {
        setAlbumInfo(data.albumInfo)
      }
    })
    .catch((e) => {
      if (isMounted) {
        console.error('error on album page', e)
      }
    })

  return () => {
    isMounted = false
  }
}, [record.id, record.updatedAt]) // Remove albumInfo from deps to prevent loops
```

**Alternative Solution - Global Caching:**
Create a context or Redux store for album info caching:

```jsx
// File: ui/src/contexts/AlbumInfoContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react'

const AlbumInfoContext = createContext()

export const AlbumInfoProvider = ({ children }) => {
  const [albumInfoCache, setAlbumInfoCache] = useState({})

  const getCachedAlbumInfo = useCallback((albumId, updatedAt) => {
    const cached = albumInfoCache[albumId]
    if (!cached) return null

    // Check if cache is still valid (5 minutes)
    const cacheAge = Date.now() - cached.timestamp
    if (cacheAge > 5 * 60 * 1000) return null

    return cached.data
  }, [albumInfoCache])

  const setCachedAlbumInfo = useCallback((albumId, data) => {
    setAlbumInfoCache(prev => ({
      ...prev,
      [albumId]: {
        data,
        timestamp: Date.now()
      }
    }))
  }, [])

  return (
    <AlbumInfoContext.Provider value={{ getCachedAlbumInfo, setCachedAlbumInfo }}>
      {children}
    </AlbumInfoContext.Provider>
  )
}

export const useAlbumInfoCache = () => useContext(AlbumInfoContext)
```

---

## 🔧 Backend Analysis - EventStream "Removed Client" Messages

### 6. EventStream Client Disconnections (NOT an Issue)

**Question:** "Why do I see 'Removed client from EventStream broker'?"
**Location:** Backend logs
**Log Evidence:**
```
DEBU[10875] Removed client from EventStream broker client="UaCU..." numActiveClients=2
```

**Analysis:**
These messages are **NORMAL BEHAVIOR** and **NOT** causing audio playback issues. Here's why:

**What EventStream is used for:**
- Server-sent events (SSE) for real-time updates
- Scan progress notifications
- "Now playing" status updates
- Library change notifications

**What causes client removal:**
- User closes browser tab
- Network connection interruption  
- Browser goes to sleep/background mode
- Page navigation
- Mobile browser memory management

**Why it's NOT related to audio stopping:**
- Audio streaming uses separate HTTP requests (`/rest/stream`)
- EventStream disconnection doesn't affect ongoing audio streams
- The music player maintains its own connection to the audio endpoint

**Evidence from your logs:**
```
9:25:15 PM GO.1 | INFO[11124] Streaming file artist="Harjas Singh" 
# This shows audio streaming is working independently
```

**Recommendation:** 
Ignore these messages. They're debug-level logs showing normal client lifecycle management.

---

## 🐛 Additional Issues to Address

### 7. Artist Info Caching

**Issue:** Similar to album info, artist info may be fetched redundantly
**Location:** `ui/src/artist/ArtistShow.jsx`

**Solution:**
Apply similar caching logic:

```jsx
// File: ui/src/artist/ArtistShow.jsx
useEffect(() => {
  if (artistInfo && record.updatedAt) {
    const updatedAt = new Date(record.updatedAt)
    const cacheAge = Date.now() - updatedAt.getTime()
    if (cacheAge < 5 * 60 * 1000) { // 5 minutes
      return
    }
  }

  let isMounted = true

  subsonic
    .getArtistInfo(record.id)
    .then((resp) => resp.json['subsonic-response'])
    .then((data) => {
      if (isMounted && data.status === 'ok') {
        setArtistInfo(data.artistInfo)
      }
    })
    .catch((e) => {
      if (isMounted) {
        console.error('error on artist page', e)
      }
    })

  return () => {
    isMounted = false
  }
}, [record.id, record.updatedAt])
```

### 8. Audio Player Context Management

**Issue:** Mobile browsers aggressively suspend audio contexts
**Location:** `ui/src/audioplayer/Player.jsx`

**Current Code Analysis:**
Your current code handles this correctly:
```jsx
if (context && context.state !== 'running') {
  context.resume()
}
```

**Additional Improvements:**
```jsx
// Add more robust context management
const handleVisibilityChange = useCallback(() => {
  if (document.visibilityState === 'visible' && context) {
    if (context.state === 'suspended') {
      context.resume().catch(console.warn)
    }
  }
}, [context])

useEffect(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [handleVisibilityChange])
```

---

## 📋 Implementation Checklist

### High Priority (Fix First)
- [ ] Fix ShareButton forwardRef issue
- [ ] Replace collapsedHeight with collapsedSize in AlbumDetails
- [ ] Add cleanup to async operations (memory leak fix)
- [ ] Remove currentUser from DOM props

### Medium Priority (Performance)
- [ ] Implement album info caching
- [ ] Implement artist info caching  
- [ ] Add global cache context (optional)

### Low Priority (Enhancements)
- [ ] Improve audio context management for mobile
- [ ] Add more robust error handling
- [ ] Add loading states for better UX

---

## 🧪 Testing Instructions

### After Fixing ShareButton:
1. Open any album page
2. Click the share button
3. Verify no console errors about refs
4. Test share functionality works

### After Fixing Collapse:
1. Open any album page with notes/comments
2. Expand/collapse content
3. Verify no deprecation warnings in console

### After Adding Caching:
1. Navigate between albums
2. Check network tab - should see fewer `getAlbumInfo` requests
3. Check console logs - should see fewer "AlbumInfo not cached" messages

### Testing Audio Issues:
1. Play a track on mobile
2. Switch to background/foreground
3. Verify audio continues playing
4. Check for memory leak warnings in console

---

## 📚 Additional Resources

- [React forwardRef Documentation](https://react.dev/reference/react/forwardRef)
- [Material-UI Collapse API](https://mui.com/material-ui/api/collapse/)
- [React Cleanup Patterns](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)
- [Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

---

## 🔍 Root Cause Analysis: Audio Stopping

Based on your logs and code analysis, the most likely causes of audio stopping are:

1. **Mobile Browser Power Management**: Mobile browsers pause audio when apps go to background
2. **Network Issues**: Mobile connections can be unstable, causing stream interruptions
3. **Memory Management**: Mobile browsers aggressively free up resources

**NOT caused by:** EventStream client disconnections (these are unrelated to audio streaming)

**Solutions:**
- Implement better error recovery in audio player
- Add network reconnection logic
- Improve mobile-specific audio context handling
- Add audio buffering strategies

---

*Last Updated: September 23, 2025*
*Generated for: japtapsamagams/navidrome dev-gs/phase-1-changes branch*