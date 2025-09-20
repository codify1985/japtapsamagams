import { useAlbumsPerPage } from './useAlbumsPerPage'
import config from '../config.js'
// TODO: Fix this to handle both record and ID cases properly
// We need artist name to filter songs by artist, but if only ID is passed, we can't get the name
// So either we need to fetch the artist name from the store/API based on ID, or we need to change the caller to always pass full record
// For now, we'll just log a warning if only ID is passed and return a fallback URL
export const useGetHandleArtistClick = (width) => {
  const [perPage] = useAlbumsPerPage(width)
  return (recordOrId) => {
    // Handle both record object and ID-only cases
    let artistName

    if (typeof recordOrId === 'object' && recordOrId.name) {
      // Full record object
      artistName = recordOrId.name
    } else if (typeof recordOrId === 'string') {
      // Only ID passed - we need to handle this case differently
      // console.warn(
      //   'Only ID passed to artist click handler, cannot filter by name',
      // )
      // You might want to navigate to artist show page in this case
      // or fetch the artist name from the store/API
      return `/artist/${recordOrId}/show` // Simple fallback to artist show page
    } else {
      // console.error('Invalid record/ID passed to artist click handler')
      return
    }

    // Navigate to songs filtered by artist instead of artist show page
    // console.log('Record in useGetHandleArtistClick: ', recordOrId)
    // Navigate to songs filtered by artist instead of artist show page
    // const artistName = record?.name || ''
    const encodedFilter = encodeURIComponent(
      JSON.stringify({ title: artistName }),
    )
    const encodedDisplayedFilters = encodeURIComponent(JSON.stringify({}))
    return `/song?displayedFilters=${encodedDisplayedFilters}&filter=${encodedFilter}&order=ASC&page=1&perPage=15&sort=title`
  }
}
