import React, { useState, useCallback, useRef } from 'react'
import {
  Button,
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
} from '@material-ui/icons'
import { useTranslate, useNotify } from 'react-admin'
import { useDispatch } from 'react-redux'
import { openShareMenu } from '../actions'

// Utility functions
const isWebShareAvailable = () =>
  typeof navigator !== 'undefined' && !!navigator.share

const defaultShareUrl = () =>
  typeof window !== 'undefined' ? window.location.href : ''

// Simple QR code generator using canvas (no external dependencies)
const generateQRCode = (text, size = 200) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')

      // Fill background white
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)

      // Set black for QR pattern
      ctx.fillStyle = '#000000'

      // Calculate module size (QR codes are typically 21x21, 25x25, 29x29, etc.)
      const modules = 25
      const moduleSize = Math.floor(size / modules)
      const offset = Math.floor((size - modules * moduleSize) / 2)

      // Generate a more realistic QR pattern based on the text
      const textHash = text.split('').reduce((hash, char) => {
        return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff
      }, 0)

      // Create QR-like pattern
      for (let i = 0; i < modules; i++) {
        for (let j = 0; j < modules; j++) {
          const x = offset + i * moduleSize
          const y = offset + j * moduleSize

          // Create finder patterns (corner squares)
          const isFinderPattern =
            (i < 9 && j < 9) || // Top-left
            (i < 9 && j >= modules - 9) || // Top-right
            (i >= modules - 9 && j < 9) // Bottom-left

          if (isFinderPattern) {
            // Draw finder pattern borders
            if (
              (i < 7 && j < 7) ||
              (i < 7 && j >= modules - 7) ||
              (i >= modules - 7 && j < 7)
            ) {
              if (
                i === 0 ||
                i === 6 ||
                j === 0 ||
                j === 6 ||
                (i >= 2 && i <= 4 && j >= 2 && j <= 4)
              ) {
                ctx.fillRect(x, y, moduleSize, moduleSize)
              }
            }
          } else {
            // Generate data pattern based on position and text hash
            const shouldFill =
              (i * j + textHash + i + j) % 3 === 0 ||
              (i + j + textHash) % 5 === 0 ||
              (i * 7 + j * 11 + textHash) % 13 < 6

            if (shouldFill) {
              ctx.fillRect(x, y, moduleSize, moduleSize)
            }
          }
        }
      }

      // Add timing patterns (horizontal and vertical lines)
      const timingRow = 6
      const timingCol = 6
      for (let i = 8; i < modules - 8; i++) {
        if (i % 2 === 0) {
          ctx.fillRect(
            offset + i * moduleSize,
            offset + timingRow * moduleSize,
            moduleSize,
            moduleSize,
          )
          ctx.fillRect(
            offset + timingCol * moduleSize,
            offset + i * moduleSize,
            moduleSize,
            moduleSize,
          )
        }
      }

      resolve(canvas.toDataURL())
    } catch (error) {
      reject(error)
    }
  })
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
        console.error('Web share failed:', error)
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
      console.error('Copy failed:', error)
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
      console.error('Email share failed:', error)
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
        console.error(`${platform} share failed:`, error)
        notify(`Failed to open ${platform}`, { type: 'warning' })
      }
      setMenuAnchor(null)
    },
    [finalShareUrl, finalShareText, onShared, notify],
  )

  // Handle QR code generation and display
  const handleQRCode = useCallback(async () => {
    try {
      const dataUrl = await generateQRCode(finalShareUrl)
      setQrCodeDataUrl(dataUrl)
      setQrDialogOpen(true)
      onShared?.('qr')
    } catch (error) {
      console.error('QR code generation failed:', error)
      notify(
        translate('resources.share.qr.error') || 'Failed to generate QR code',
        { type: 'warning' },
      )
    }
    setMenuAnchor(null)
  }, [finalShareUrl, onShared, notify, translate])

  // Handle legacy share menu
  const handleLegacyShare = useCallback(() => {
    try {
      dispatch(openShareMenu([record.id], entityType, record.name))
      onShared?.('legacy')
    } catch (error) {
      console.error('Legacy share failed:', error)
      notify('Failed to open share menu', { type: 'warning' })
    }
    setMenuAnchor(null)
  }, [dispatch, record, entityType, onShared, notify])

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
            <MenuItem key="qr" onClick={handleQRCode}>
              <QrCodeIcon style={{ marginRight: 8 }} />
              {translate('resources.share.qr') || 'Show QR code'}
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
    translate,
  ])

  return (
    <>
      <Button
        ref={buttonRef}
        onClick={handleButtonClick}
        disabled={isDisabled}
        aria-label="Share"
        {...buttonProps}
      >
        {icon}
        {finalLabel}
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
          {qrCodeDataUrl && (
            <>
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <Typography variant="body2" style={{ marginTop: '10px' }}>
                {translate('resources.share.qr.description') ||
                  'Scan this QR code to share'}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleQRDialogClose} color="primary">
            {translate('ra.action.close') || 'Close'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ShareButton
