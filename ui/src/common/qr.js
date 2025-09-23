// Local QR code generation utility with caching
// Uses the 'qrcode' library for local-first QR generation

// In-memory cache for generated QR codes
const qrCache = new Map()

// Maximum cache size to prevent memory leaks
const MAX_CACHE_SIZE = 100

// Default QR options
const DEFAULT_QR_OPTIONS = {
  width: 200,
  margin: 2,
  errorCorrectionLevel: 'M', // L, M, Q, H
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
  type: 'image/png', // 'image/png' or 'image/svg+xml'
}

/**
 * Validates and clamps QR options
 * @param {Object} options - QR generation options
 * @returns {Object} Validated options
 */
const validateQROptions = (options = {}) => {
  const validated = { ...DEFAULT_QR_OPTIONS, ...options }

  // Clamp width between 64 and 1024
  validated.width = Math.max(
    64,
    Math.min(1024, validated.width || DEFAULT_QR_OPTIONS.width),
  )

  // Ensure valid error correction level
  const validECLevels = ['L', 'M', 'Q', 'H']
  if (!validECLevels.includes(validated.errorCorrectionLevel)) {
    validated.errorCorrectionLevel = DEFAULT_QR_OPTIONS.errorCorrectionLevel
  }

  // Ensure valid type
  const validTypes = ['image/png', 'image/svg+xml']
  if (!validTypes.includes(validated.type)) {
    validated.type = DEFAULT_QR_OPTIONS.type
  }

  // Ensure color object structure
  if (!validated.color || typeof validated.color !== 'object') {
    validated.color = DEFAULT_QR_OPTIONS.color
  }

  return validated
}

/**
 * Creates a cache key from text and options
 * @param {string} text - Text to encode
 * @param {Object} options - QR options
 * @returns {string} Cache key
 */
const createCacheKey = (text, options) => {
  return JSON.stringify({ text, options })
}

/**
 * Manages cache size and cleanup
 */
const manageCache = () => {
  if (qrCache.size > MAX_CACHE_SIZE) {
    // Remove oldest entries (first in)
    const keysToRemove = Array.from(qrCache.keys()).slice(
      0,
      qrCache.size - MAX_CACHE_SIZE,
    )
    keysToRemove.forEach((key) => qrCache.delete(key))
  }
}

/**
 * Validates text input for QR generation
 * @param {string} text - Text to validate
 * @throws {Error} If text is invalid
 */
const validateText = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string')
  }

  // Warn about very long text that might not scan well
  if (text.length > 2000) {
    // console.warn('QR: Text is very long and may result in a complex QR code that is difficult to scan')
  }

  // Hard limit to prevent excessive processing
  if (text.length > 8000) {
    throw new Error(
      'Text is too long for QR code generation (max 8000 characters)',
    )
  }
}

/**
 * Generates QR code locally using the qrcode library
 * @param {string} text - Text to encode in QR code
 * @param {Object} options - QR generation options
 * @returns {Promise<{dataUrl: string, type: string}>} Generated QR code data
 */
export const generateQRCodeLocal = async (text, options = {}) => {
  // Validate inputs
  validateText(text)
  const validOptions = validateQROptions(options)

  // Check cache first
  const cacheKey = createCacheKey(text, validOptions)
  if (qrCache.has(cacheKey)) {
    return qrCache.get(cacheKey)
  }

  try {
    // Dynamic import to lazy-load the QR library
    // Wrap in a try-catch to prevent any import issues from breaking the app
    let QRCode
    try {
      QRCode = await import('qrcode')
    } catch (importError) {
      throw new Error(`Failed to load QR code library: ${importError.message}`)
    }

    let result

    if (validOptions.type === 'image/svg+xml') {
      // Generate SVG
      const svgString = await QRCode.toString(text, {
        type: 'svg',
        width: validOptions.width,
        margin: validOptions.margin,
        errorCorrectionLevel: validOptions.errorCorrectionLevel,
        color: validOptions.color,
      })

      // Convert SVG to data URL
      const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`

      result = {
        dataUrl,
        type: 'image/svg+xml',
        svgString, // Include raw SVG for direct rendering if needed
      }
    } else {
      // Generate PNG (default)
      const dataUrl = await QRCode.toDataURL(text, {
        width: validOptions.width,
        margin: validOptions.margin,
        errorCorrectionLevel: validOptions.errorCorrectionLevel,
        color: validOptions.color,
      })

      result = {
        dataUrl,
        type: 'image/png',
      }
    }

    // Cache the result
    qrCache.set(cacheKey, result)
    manageCache()

    return result
  } catch (error) {
    // console.error('Local QR generation failed:', error)
    throw new Error(`Failed to generate QR code locally: ${error.message}`)
  }
}

/**
 * Clears the QR code cache
 */
export const clearQRCache = () => {
  qrCache.clear()
}

/**
 * Gets current cache size (for debugging)
 * @returns {number} Current cache size
 */
export const getQRCacheSize = () => qrCache.size

/**
 * Creates a download blob from QR data URL
 * @param {string} dataUrl - QR code data URL
 * @param {string} filename - Desired filename
 * @returns {void}
 */
export const downloadQRCode = (dataUrl, filename = 'qrcode.png') => {
  // SSR guard
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // console.warn('Download not available in server environment')
    return
  }

  try {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    // console.error('Failed to download QR code:', error)
    throw new Error('Download failed')
  }
}

export default {
  generateQRCodeLocal,
  clearQRCache,
  getQRCacheSize,
  downloadQRCode,
  DEFAULT_QR_OPTIONS,
}
