import { Alert } from 'react-native'

// Event bus / listener for global custom alert modal
let alertSubscriber = null
let alertQueue = []

export const registerAlertSubscriber = (fn) => {
  alertSubscriber = fn
  // If there's any pending alert in queue, show the latest one
  if (alertQueue.length > 0 && typeof fn === 'function') {
    const nextAlert = alertQueue.shift()
    fn(nextAlert)
  }
  return () => {
    alertSubscriber = null
  }
}

export const showCustomAlert = ({
  title = '',
  message = '',
  type = 'info', // 'success' | 'danger' | 'warning' | 'info' | 'confirm'
  buttons = [{ text: 'OK', style: 'default' }],
  cancelable = true,
  onDismiss = null
}) => {
  const alertPayload = {
    visible: true,
    title,
    message,
    type,
    buttons,
    cancelable,
    onDismiss
  }

  if (alertSubscriber) {
    alertSubscriber(alertPayload)
  } else {
    alertQueue.push(alertPayload)
  }
}

export const closeCustomAlert = () => {
  if (alertSubscriber) {
    alertSubscriber({ visible: false })
  }
}

// Global monkey-patch for React Native's Alert.alert
const originalNativeAlert = Alert.alert

export function initializeCustomAlertOverride() {
  Alert.alert = (title = '', message = '', buttons, options) => {
    const titleLower = String(title || '').toLowerCase()
    const msgLower = String(message || '').toLowerCase()

    const hasDestructive = Array.isArray(buttons) && buttons.some((b) => b?.style === 'destructive')
    const hasCancel = Array.isArray(buttons) && buttons.some((b) => b?.style === 'cancel')

    let detectedType = 'info'
    if (
      titleLower.includes('sukses') ||
      titleLower.includes('berhasil') ||
      titleLower.includes('tersalin') ||
      titleLower.includes('disetujui') ||
      titleLower.includes('lunas') ||
      titleLower.includes('acc')
    ) {
      detectedType = 'success'
    } else if (
      hasDestructive ||
      titleLower.includes('hapus') ||
      titleLower.includes('batal') ||
      titleLower.includes('tolak') ||
      titleLower.includes('gagal') ||
      titleLower.includes('error') ||
      msgLower.includes('tidak dapat dibatalkan')
    ) {
      detectedType = hasDestructive || titleLower.includes('hapus') ? 'danger' : 'error'
    } else if (
      titleLower.includes('perhatian') ||
      titleLower.includes('peringatan') ||
      titleLower.includes('penting') ||
      titleLower.includes('validasi') ||
      titleLower.includes('warning') ||
      titleLower.includes('tidak ada') ||
      titleLower.includes('pilih') ||
      titleLower.includes('⚠️')
    ) {
      detectedType = 'warning'
    } else if (Array.isArray(buttons) && buttons.length > 1) {
      detectedType = 'confirm'
    }

    const finalButtons = Array.isArray(buttons) && buttons.length > 0
      ? buttons
      : [{ text: 'OK', style: 'default' }]

    showCustomAlert({
      title: String(title || ''),
      message: String(message || ''),
      type: detectedType,
      buttons: finalButtons,
      cancelable: options?.cancelable ?? true,
      onDismiss: options?.onDismiss
    })
  }
}

// Auto-run override when module is imported
initializeCustomAlertOverride()

// Global browser window.alert override so no native browser dialog ever appears
if (typeof window !== 'undefined') {
  try {
    window.alert = (msg) => {
      Alert.alert('Pemberitahuan', String(msg || ''))
    }
  } catch (e) {
    // Ignore if window.alert is read-only
  }
}
