// Enhanced SimpleList Component - Usage Examples and Documentation
//
// The SimpleList component has been enhanced with Apple-style card design and optional cover image support.
// This maintains full backward compatibility while adding beautiful visual improvements.

import React from 'react'
import { SimpleList } from '../common/SimpleList'
import subsonic from '../subsonic'

// =====================================================
// BASIC USAGE - DEFAULT BEHAVIOR (NO VISUAL CHANGES)
// =====================================================

// Example 1: Basic SimpleList without cover images (default behavior)
// This looks like Apple-style cards but functions exactly as before
const BasicSimpleListExample = ({ data, ids, basePath }) => (
  <SimpleList
    data={data}
    ids={ids}
    basePath={basePath}
    primaryText={(record) => record.name}
    secondaryText={(record) => record.artist}
    tertiaryText={(record) => record.year}
    linkType="edit"
    // showCover={false} is the default - no need to specify
  />
)

// =====================================================
// ENHANCED USAGE - WITH COVER IMAGES
// =====================================================

// Example 2: SimpleList with cover images enabled
// Perfect for album lists, playlists, etc.
const AlbumListWithCovers = ({ data, ids, basePath }) => (
  <SimpleList
    data={data}
    ids={ids}
    basePath={basePath}
    primaryText={(record) => record.name}
    secondaryText={(record) => record.albumArtist}
    tertiaryText={(record) => record.year}
    linkType="edit"
    showCover={true}
    // Optional: custom cover source (defaults to subsonic.getCoverArtUrl(record, 48))
  />
)

// Example 3: Custom cover sizing and source
const HighQualityCoverList = ({ data, ids, basePath }) => (
  <SimpleList
    data={data}
    ids={ids}
    basePath={basePath}
    primaryText={(record) => record.name}
    secondaryText={(record) => record.artist}
    tertiaryText={(record) => record.year}
    linkType="show"
    showCover={true}
    // Custom cover source function with different sizing
    coverSrc={(record) => {
      if (record.customCoverUrl) {
        return record.customCoverUrl
      }
      // Use 64px instead of default 48px
      return subsonic.getCoverArtUrl(record, 64)
    }}
  />
)

// =====================================================
// MIXED USAGE EXAMPLES
// =====================================================

// Example 4: Fallback to icons when covers are disabled
const IconBasedList = ({ data, ids, basePath }) => (
  <SimpleList
    data={data}
    ids={ids}
    basePath={basePath}
    primaryText={(record) => record.name}
    secondaryText={(record) => record.description}
    linkType="edit"
    showCover={false} // Explicitly disabled
    leftIcon={(record) => <span>🎵</span>} // Custom icon
    rightIcon={(record) => <span>⭐</span>} // Rating or other info
  />
)

// Example 5: Conditional cover display based on record type
const SmartCoverList = ({ data, ids, basePath }) => {
  const shouldShowCover = (record) => {
    // Show covers for albums and playlists, but not for artists
    return record.albumArtist || record.sync !== undefined
  }

  return (
    <SimpleList
      data={data}
      ids={ids}
      basePath={basePath}
      primaryText={(record) => record.name}
      secondaryText={(record) => record.artist}
      tertiaryText={(record) => record.year}
      linkType="edit"
      showCover={true}
      coverSrc={(record) => {
        if (!shouldShowCover(record)) {
          return undefined // This will fallback to Avatar with initials
        }
        return subsonic.getCoverArtUrl(record, 48)
      }}
    />
  )
}

export {
  BasicSimpleListExample,
  AlbumListWithCovers,
  HighQualityCoverList,
  IconBasedList,
  SmartCoverList,
}

/*
=====================================================
COMPONENT FEATURES & SPECIFICATIONS
=====================================================

🎨 VISUAL DESIGN:
- Apple-style cards with 22px border radius
- Subtle shadows: 0 2px 8px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)
- Hover effects: Lift 2px with enhanced shadow
- Translucent 1px border using theme.palette.divider
- Smooth transitions with cubic-bezier easing

📸 COVER IMAGE SYSTEM:
- 48x48px cover images with 12px border radius
- Loading states with opacity animation (matches AlbumDetails)
- Error fallback to Avatar with initials (first letters of name)
- Lazy loading enabled for performance
- Same sizing patterns as AlbumDetails component

🔧 NEW PROPS:
- showCover?: boolean (default: false)
- coverSrc?: (record) => string | undefined (default: subsonic.getCoverArtUrl(record, 48))

🔄 BACKWARD COMPATIBILITY:
- All existing props work unchanged
- No breaking changes to existing implementations
- When showCover=false, leftIcon/leftAvatar work exactly as before
- Same component API and prop structure

⚡ PERFORMANCE:
- Lazy image loading
- Efficient re-renders with useCallback hooks
- Minimal state management per item
- Optimized CSS transitions

📱 RESPONSIVE:
- Works with existing theme breakpoints
- Proper spacing on all screen sizes
- Touch-friendly hover states

🎯 USE CASES:
- Album lists: Perfect with showCover=true
- Playlist views: Great for visual identification
- Artist lists: Can use initials fallback or custom icons
- Song lists: Works with existing SongSimpleList patterns
- Mixed content: Smart conditional cover display

⚠️ NOTES:
- Context menus inherit Material-UI positioning (no clipping issues)
- Images are cached by browser standard caching
- Fallback avatars use theme colors for consistency
- All text content remains fully accessible
*/
