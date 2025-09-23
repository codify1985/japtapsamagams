import React, { useState, useCallback, useRef } from 'react'
import {
  Button as MuiButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
} from '@material-ui/core'
import {
  Share as ShareIcon,
  FileCopy as CopyIcon,
  Email as EmailIcon,
  Launch as LaunchIcon,
  CropFree as QrCodeIcon,
  MoreHoriz as MoreIcon,
  GetApp as DownloadIcon,
} from '@material-ui/icons'
import { useTranslate, useNotify, Button } from 'react-admin'
import { useDispatch } from 'react-redux'
import { openShareMenu } from '../actions'
import { generateQRCodeLocal, downloadQRCode } from './qr'

// Utility functions
const isWebShareAvailable = () =>
  typeof navigator !== 'undefined' && !!navigator.share

const defaultShareUrl = () =>
  typeof window !== 'undefined' ? window.location.href : ''

// Local-first QR code generator with remote fallback
const generateQRCode = async (text, options = {}) => {
  const {
    width = 200,
    allowExternalFallback = false,
    externalTimeoutMs = 4000,
    ...qrOptions
  } = options

  try {
    // Try local generation first
    const result = await generateQRCodeLocal(text, {
      width,
      ...qrOptions
    })
    return result.dataUrl
  } catch (localError) {
    // console.warn('Local QR generation failed:', localError)
    
    // Only try external fallback if explicitly allowed
    if (!allowExternalFallback) {
      // Show fallback placeholder
      return createQRFallbackPlaceholder(text, width)
    }
    
    // Try external API as last resort
    try {
      return await generateQRCodeExternal(text, width, externalTimeoutMs)
    } catch (externalError) {
      // console.error('External QR generation also failed:', externalError)
      // Final fallback to placeholder
      return createQRFallbackPlaceholder(text, width)
    }
  }
}

// External QR generation (fallback only)
const generateQRCodeExternal = (text, size = 200, timeoutMs = 4000) => {
  return new Promise((resolve, reject) => {
    // SSR guard
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('External QR generation not available in server environment'))
      return
    }

    try {
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png&margin=10`
      
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        img.src = '' // Cancel load
        reject(new Error('External QR API timeout'))
      }, timeoutMs)
      
      img.onload = () => {
        clearTimeout(timeoutId)
        try {
          const canvas = document.createElement('canvas')
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')
          
          // Fill white background
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, size, size)
          
          // Draw the QR code image
          ctx.drawImage(img, 0, 0, size, size)
          
          resolve(canvas.toDataURL())
        } catch (error) {
          reject(new Error('Canvas rendering failed'))
        }
      }
      
      img.onerror = () => {
        clearTimeout(timeoutId)
        reject(new Error('External QR API failed to load'))
      }
      
      // Start loading
      img.src = qrApiUrl
      
    } catch (error) {
      reject(error)
    }
  })
}

// Fallback placeholder when QR generation fails
const createQRFallbackPlaceholder = (text, size = 200) => {
  // SSR guard
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' // 1x1 transparent pixel
  }
  
  try {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    
    // Fill background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    
    // Add border
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, size - 2, size - 2)
    
    // Add text
    ctx.fillStyle = '#000000'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('QR Code not available', size / 2, size / 2 - 10)
    ctx.fillText('Visit:', size / 2, size / 2 + 10)
    
    // Truncate URL if too long
    const displayUrl = text.length > 30 ? text.substring(0, 27) + '...' : text
    ctx.font = '10px Arial'
    ctx.fillText(displayUrl, size / 2, size / 2 + 30)
    
    return canvas.toDataURL()
  } catch (error) {
    // console.error('Failed to create QR placeholder:', error)
    // Return a minimal base64 image
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  }
}

// Fallback copy function for older browsers
const fallbackCopyToClipboard = (text) => {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    document.body.removeChild(textArea)
    return false
  }
}

const ShareButton = ({
  record,
  entityType = 'album',
  label,
  icon = <ShareIcon />,
  shareUrl,
  shareText,
  desktopOptions = ['copy', 'email', 'webshare', 'socials', 'qr', 'legacy'],
  qrOptions = {},
  allowExternalQrFallback = false,
  externalQrTimeoutMs = 4000,
  onShared,
  menuPlacement = 'bottom-start',
  ...buttonProps
}) => {
  const theme = useTheme()
  const translate = useTranslate()
  const notify = useNotify()
  const dispatch = useDispatch()

  const isMobile = !useMediaQuery(theme.breakpoints.up('md'))
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [qrGenerating, setQrGenerating] = useState(false)
  const [qrError, setQrError] = useState(null)
  const buttonRef = useRef(null)

  // Compute derived values
  const finalShareUrl = shareUrl || defaultShareUrl()
  const finalShareText =
    shareText || `Check out this ${entityType}: ${record?.name}`
  const finalLabel = label || translate('ra.action.share', { smart_count: 1 })

  // Check if button should be disabled
  const isDisabled = record?.missing || buttonProps.disabled

  // Handle native web share (mobile or when available)
  const handleWebShare = useCallback(async () => {
    if (!isWebShareAvailable()) {
      notify('Web share not available', { type: 'warning' })
      return
    }

    try {
      await navigator.share({
        title: record?.name || 'Share',
        text: finalShareText,
        url: finalShareUrl,
      })
      onShared?.('webshare')
      notify(
        translate('resources.share.shared', { smart_count: 1 }) ||
          'Shared successfully',
        { type: 'info' },
      )
    } catch (error) {
      // AbortError means user cancelled, don't show error
      if (error.name !== 'AbortError') {
        // console.error('Web share failed:', error)
        // Fall back to desktop menu on error
        setMenuAnchor(buttonRef.current)
      }
    }
  }, [record, finalShareText, finalShareUrl, onShared, notify, translate])

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(finalShareUrl)
      } else {
        const success = fallbackCopyToClipboard(finalShareUrl)
        if (!success) {
          throw new Error('Fallback copy failed')
        }
      }
      notify(
        translate('resources.share.copyLink.success') ||
          'Link copied to clipboard',
        { type: 'info' },
      )
      onShared?.('copy')
    } catch (error) {
      // console.error('Copy failed:', error)
      notify(
        translate('resources.share.copyLink.error') || 'Failed to copy link',
        { type: 'warning' },
      )
    }
    setMenuAnchor(null)
  }, [finalShareUrl, notify, translate, onShared])

  // Handle email share
  const handleEmail = useCallback(() => {
    const subject = encodeURIComponent(record?.name || 'Shared from Navidrome')
    const body = encodeURIComponent(`${finalShareText}\n\n${finalShareUrl}`)
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`

    try {
      window.location.href = mailtoUrl
      onShared?.('email')
    } catch (error) {
      // console.error('Email share failed:', error)
      notify(
        translate('resources.share.email.error') ||
          'Failed to open email client',
        { type: 'warning' },
      )
    }
    setMenuAnchor(null)
  }, [record, finalShareText, finalShareUrl, onShared, notify, translate])

  // Handle social media shares
  const handleSocialShare = useCallback(
    (platform) => {
      let url = ''
      const encodedUrl = encodeURIComponent(finalShareUrl)
      const encodedText = encodeURIComponent(finalShareText)

      switch (platform) {
        case 'twitter':
          url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
          break
        case 'facebook':
          url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
          break
        case 'linkedin':
          url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
          break
        default:
          return
      }

      try {
        window.open(url, '_blank', 'noopener,noreferrer')
        onShared?.(platform)
      } catch (error) {
        // console.error(`${platform} share failed:`, error)
        notify(`Failed to open ${platform}`, { type: 'warning' })
      }
      setMenuAnchor(null)
    },
    [finalShareUrl, finalShareText, onShared, notify],
  )

  // Handle QR code generation and display
  const handleQRCode = useCallback(async () => {
    setQrGenerating(true)
    setQrError(null)
    
    try {
      const dataUrl = await generateQRCode(finalShareUrl, {
        width: qrOptions.width || 200,
        allowExternalFallback: allowExternalQrFallback,
        externalTimeoutMs: externalQrTimeoutMs,
        ...qrOptions
      })
      
      setQrCodeDataUrl(dataUrl)
      setQrDialogOpen(true)
      onShared?.('qr')
      
      // Show notification based on generation method
      if (!allowExternalQrFallback) {
        notify(
          translate('resources.share.qr.localSuccess') || 'QR code generated locally',
          { type: 'info' },
        )
      }
      
    } catch (error) {
      // console.error('QR code generation failed:', error)
      setQrError(error.message)
      
      // Still open dialog to show error state
      setQrDialogOpen(true)
      
      const errorMessage = allowExternalQrFallback
        ? translate('resources.share.qr.error') || 'Failed to generate QR code'
        : translate('resources.share.qr.localError') || 'Local QR generation failed. Enable external fallback for backup.'
        
      notify(errorMessage, { type: 'warning' })
    } finally {
      setQrGenerating(false)
    }
    
    setMenuAnchor(null)
  }, [finalShareUrl, qrOptions, allowExternalQrFallback, externalQrTimeoutMs, onShared, notify, translate])

  // Handle legacy share menu
  const handleLegacyShare = useCallback(() => {
    try {
      dispatch(openShareMenu([record.id], entityType, record.name))
      onShared?.('legacy')
    } catch (error) {
      // console.error('Legacy share failed:', error)
      notify('Failed to open share menu', { type: 'warning' })
    }
    setMenuAnchor(null)
  }, [dispatch, record, entityType, onShared, notify])

  // Handle QR code download
  const handleQRDownload = useCallback(() => {
    if (!qrCodeDataUrl) return
    
    try {
      const filename = `qr-${record?.name || 'navidrome'}.png`
      downloadQRCode(qrCodeDataUrl, filename)
      notify(
        translate('resources.share.qr.downloadSuccess') || 'QR code downloaded',
        { type: 'info' }
      )
    } catch (error) {
      // console.error('QR download failed:', error)
      notify(
        translate('resources.share.qr.downloadError') || 'Failed to download QR code',
        { type: 'warning' }
      )
    }
  }, [qrCodeDataUrl, record, notify, translate])

  // Main button click handler
  const handleButtonClick = useCallback(
    (event) => {
      if (isDisabled) return

      // On mobile with web share support, use native sharing
      if (isMobile && isWebShareAvailable()) {
        handleWebShare()
      } else {
        // Otherwise, open desktop menu
        setMenuAnchor(event.currentTarget)
      }
    },
    [isDisabled, isMobile, handleWebShare],
  )

  // Close menu
  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null)
  }, [])

  // Close QR dialog
  const handleQRDialogClose = useCallback(() => {
    setQrDialogOpen(false)
    setQrCodeDataUrl('')
    setQrError(null)
    setQrGenerating(false)
  }, [])

  // Filter and create menu items based on available options
  const createMenuItems = useCallback(() => {
    const items = []

    desktopOptions.forEach((option, index) => {
      switch (option) {
        case 'copy':
          items.push(
            <MenuItem key="copy" onClick={handleCopy}>
              <CopyIcon style={{ marginRight: 8 }} />
              {translate('resources.share.copyLink') || 'Copy link'}
            </MenuItem>,
          )
          break

        case 'email':
          items.push(
            <MenuItem key="email" onClick={handleEmail}>
              <EmailIcon style={{ marginRight: 8 }} />
              {translate('resources.share.email') || 'Share via email'}
            </MenuItem>,
          )
          break

        case 'webshare':
          if (isWebShareAvailable()) {
            items.push(
              <MenuItem key="webshare" onClick={handleWebShare}>
                <ShareIcon style={{ marginRight: 8 }} />
                {translate('resources.share.webShare') || 'System share'}
              </MenuItem>,
            )
          }
          break

        case 'socials':
          items.push(
            <MenuItem
              key="twitter"
              onClick={() => handleSocialShare('twitter')}
            >
              <LaunchIcon style={{ marginRight: 8 }} />
              Share on X/Twitter
            </MenuItem>,
            <MenuItem
              key="facebook"
              onClick={() => handleSocialShare('facebook')}
            >
              <LaunchIcon style={{ marginRight: 8 }} />
              Share on Facebook
            </MenuItem>,
            <MenuItem
              key="linkedin"
              onClick={() => handleSocialShare('linkedin')}
            >
              <LaunchIcon style={{ marginRight: 8 }} />
              Share on LinkedIn
            </MenuItem>,
          )
          break

        case 'qr':
          items.push(
            <MenuItem key="qr" onClick={handleQRCode} disabled={qrGenerating}>
              <QrCodeIcon style={{ marginRight: 8 }} />
              {qrGenerating 
                ? (translate('resources.share.qr.generating') || 'Generating QR...')
                : (translate('resources.share.qr') || 'Show QR code')
              }
            </MenuItem>,
          )
          break

        case 'legacy':
          items.push(
            <MenuItem key="legacy" onClick={handleLegacyShare}>
              <MoreIcon style={{ marginRight: 8 }} />
              {translate('resources.share.more') || 'More options'}
            </MenuItem>,
          )
          break

        default:
          break
      }

      // Add divider after socials group
      if (option === 'socials' && index < desktopOptions.length - 1) {
        items.push(<Divider key={`divider-${index}`} />)
      }
    })

    return items
  }, [
    desktopOptions,
    handleCopy,
    handleEmail,
    handleWebShare,
    handleSocialShare,
    handleQRCode,
    handleLegacyShare,
    qrGenerating,
    translate,
  ])

  return (
    <>
      <Button
        ref={buttonRef}
        onClick={handleButtonClick}
        disabled={isDisabled}
        label={finalLabel}
        {...buttonProps}
      >
        {icon}
      </Button>

      {/* Desktop menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {createMenuItems()}
      </Menu>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={handleQRDialogClose} maxWidth="sm">
        <DialogTitle>
          {translate('resources.share.qr.title') || 'QR Code'}
        </DialogTitle>
        <DialogContent style={{ textAlign: 'center', padding: '20px' }}>
          {qrGenerating ? (
            <div style={{ padding: '40px' }}>
              <Typography variant="body2">
                {translate('resources.share.qr.generating') || 'Generating QR code...'}
              </Typography>
            </div>
          ) : qrError ? (
            <div style={{ padding: '20px' }}>
              <Typography variant="body2" color="error" style={{ marginBottom: '10px' }}>
                {translate('resources.share.qr.failed') || 'QR code generation failed'}
              </Typography>
              <Typography variant="caption" style={{ color: 'grey' }}>
                {qrError}
              </Typography>
              {!allowExternalQrFallback && (
                <Typography variant="caption" style={{ 
                  display: 'block', 
                  marginTop: '10px',
                  color: 'grey'
                }}>
                  {translate('resources.share.qr.fallbackHint') || 
                   'Tip: Enable external fallback for backup QR generation'}
                </Typography>
              )}
            </div>
          ) : qrCodeDataUrl ? (
            <>
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px' }}
              />
              <Typography variant="body2" style={{ marginTop: '15px', marginBottom: '10px' }}>
                {translate('resources.share.qr.description') ||
                  'Scan this QR code to share'}
              </Typography>
              <Typography 
                variant="caption" 
                style={{ 
                  color: 'grey', 
                  wordBreak: 'break-all',
                  fontSize: '12px',
                  backgroundColor: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                  display: 'block',
                  marginTop: '10px'
                }}
              >
                {finalShareUrl}
              </Typography>
            </>
          ) : null}
        </DialogContent>
        <DialogActions style={{ justifyContent: 'space-between', padding: '16px' }}>
          <div>
            <MuiButton onClick={handleCopy} color="primary" variant="outlined">
              <CopyIcon style={{ marginRight: 4 }} />
              Copy Link
            </MuiButton>
            {qrCodeDataUrl && !qrError && (
              <MuiButton 
                onClick={handleQRDownload} 
                color="primary" 
                variant="outlined"
                style={{ marginLeft: '8px' }}
              >
                <DownloadIcon style={{ marginRight: 4 }} />
                Download PNG
              </MuiButton>
            )}
          </div>
          <MuiButton onClick={handleQRDialogClose} color="primary">
            {translate('ra.action.close') || 'Close'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ShareButton
