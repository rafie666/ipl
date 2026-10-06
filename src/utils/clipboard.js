import * as ExpoClipboard from 'expo-clipboard'

export async function copyToClipboard(text) {
  try {
    if (ExpoClipboard && typeof ExpoClipboard.setStringAsync === 'function') {
      await ExpoClipboard.setStringAsync(String(text || ''))
      return true
    }
  } catch (err) {
    console.warn('Clipboard error:', err)
  }
  return false
}
