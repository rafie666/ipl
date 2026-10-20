import React, { useState, useEffect, useRef } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
  Dimensions
} from 'react-native'
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Trash2,
  HelpCircle,
  LogOut,
  X
} from 'lucide-react-native'
import { registerAlertSubscriber, closeCustomAlert } from '../utils/customAlert'
import { colors, radius, shadows, typography, spacing } from '../utils/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function CustomAlertModal() {
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
    cancelable: true,
    onDismiss: null
  })

  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const unsubscribe = registerAlertSubscriber((data) => {
      if (data && data.visible) {
        setAlertState({
          visible: true,
          title: data.title || '',
          message: data.message || '',
          type: data.type || 'info',
          buttons: Array.isArray(data.buttons) && data.buttons.length > 0
            ? data.buttons
            : [{ text: 'OK', style: 'default' }],
          cancelable: data.cancelable ?? true,
          onDismiss: data.onDismiss || null
        })

        // Entrance animation
        scaleAnim.setValue(0.9)
        opacityAnim.setValue(0)
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 7,
            tension: 65,
            useNativeDriver: true
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
          })
        ]).start()
      } else {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        }).start(() => {
          setAlertState((prev) => ({ ...prev, visible: false }))
        })
      }
    })

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [scaleAnim, opacityAnim])

  const handleClose = () => {
    if (!alertState.visible) return
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => {
      setAlertState((prev) => ({ ...prev, visible: false }))
      if (typeof alertState.onDismiss === 'function') {
        alertState.onDismiss()
      }
    })
  }

  const handleButtonPress = (btn) => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => {
      setAlertState((prev) => ({ ...prev, visible: false }))
      if (btn && typeof btn.onPress === 'function') {
        try {
          btn.onPress()
        } catch (e) {
          console.warn('Alert button onPress error:', e)
        }
      }
    })
  }

  if (!alertState.visible) return null

  // Determine icon & theme colors based on type / title
  const titleLower = alertState.title.toLowerCase()
  const msgLower = (alertState.message || '').toLowerCase()
  const hasDestructive = alertState.buttons.some((b) => b?.style === 'destructive')
  const isLogout =
    alertState.type === 'logout' ||
    titleLower.includes('keluar') ||
    titleLower.includes('logout') ||
    msgLower.includes('keluar dari akun') ||
    msgLower.includes('keluar dari sesi') ||
    alertState.buttons.some((b) => {
      const txt = (b?.text || '').toLowerCase()
      return (txt.includes('keluar') || txt.includes('logout')) && b?.style === 'destructive'
    })

  const isDelete =
    !isLogout &&
    (titleLower.includes('hapus') || msgLower.includes('hapus') || hasDestructive)
  const type = alertState.type

  let theme = {
    icon: <Info size={30} color={colors.info} strokeWidth={2.4} />,
    iconBg: '#EFF8FF',
    iconBorder: '#B2DDFF',
    primaryBtnBg: colors.primary,
    primaryBtnText: '#FFFFFF'
  }

  if (isLogout) {
    theme = {
      icon: <LogOut size={30} color={colors.danger} strokeWidth={2.4} />,
      iconBg: '#FEF2F2',
      iconBorder: '#FECACA',
      primaryBtnBg: colors.danger,
      primaryBtnText: '#FFFFFF'
    }
  } else if (type === 'success') {
    theme = {
      icon: <CheckCircle2 size={32} color={colors.success} strokeWidth={2.5} />,
      iconBg: '#ECFDF3',
      iconBorder: '#A6F4C5',
      primaryBtnBg: colors.success,
      primaryBtnText: '#FFFFFF'
    }
  } else if (type === 'danger' || type === 'error' || isDelete) {
    theme = {
      icon: isDelete ? (
        <Trash2 size={30} color={colors.danger} strokeWidth={2.4} />
      ) : (
        <AlertTriangle size={30} color={colors.danger} strokeWidth={2.4} />
      ),
      iconBg: '#FEF3F2',
      iconBorder: '#FECDCA',
      primaryBtnBg: colors.danger,
      primaryBtnText: '#FFFFFF'
    }
  } else if (type === 'warning') {
    theme = {
      icon: <AlertCircle size={32} color={colors.warning} strokeWidth={2.4} />,
      iconBg: '#FFFAEB',
      iconBorder: '#FEDF89',
      primaryBtnBg: colors.warning,
      primaryBtnText: '#FFFFFF'
    }
  } else if (type === 'confirm') {
    theme = {
      icon: <HelpCircle size={32} color="#2563EB" strokeWidth={2.4} />,
      iconBg: '#EFF6FF',
      iconBorder: '#BFDBFE',
      primaryBtnBg: colors.primary,
      primaryBtnText: '#FFFFFF'
    }
  }

  const buttons = alertState.buttons
  const isTwoButtons = buttons.length === 2

  return (
    <Modal
      transparent
      visible={alertState.visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        if (alertState.cancelable) handleClose()
      }}
    >
      <View style={styles.overlay}>
        {/* Backdrop touch */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            if (alertState.cancelable) handleClose()
          }}
        />

        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Top Badge Icon */}
          <View style={[styles.iconContainer, { backgroundColor: theme.iconBg, borderColor: theme.iconBorder }]}>
            {theme.icon}
          </View>

          {/* Title */}
          {alertState.title ? (
            <Text style={styles.title} numberOfLines={2}>
              {alertState.title}
            </Text>
          ) : null}

          {/* Message */}
          {alertState.message ? (
            <ScrollView
              style={styles.messageScroll}
              contentContainerStyle={styles.messageContainer}
              showsVerticalScrollIndicator={true}
              alwaysBounceVertical={false}
            >
              <Text style={styles.message}>{alertState.message}</Text>
            </ScrollView>
          ) : null}

          {/* Action Buttons */}
          <View style={[styles.buttonsWrapper, isTwoButtons && styles.buttonsRow]}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel'
              const isDestructive = btn.style === 'destructive'

              let btnBg = theme.primaryBtnBg
              let textColor = '#FFFFFF'
              let borderStyle = {}

              if (isCancel) {
                btnBg = '#F2F4F7'
                textColor = '#344054'
                borderStyle = { borderWidth: 1, borderColor: '#E4E7EC' }
              } else if (isDestructive) {
                btnBg = colors.danger
                textColor = '#FFFFFF'
              }

              return (
                <TouchableOpacity
                  key={`alert-btn-${index}`}
                  style={[
                    styles.button,
                    isTwoButtons && styles.buttonHalf,
                    { backgroundColor: btnBg },
                    borderStyle
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleButtonPress(btn)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: textColor },
                      isCancel && { fontWeight: '600' }
                    ]}
                    numberOfLines={1}
                  >
                    {btn.text || 'OK'}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    zIndex: 999999,
    elevation: 999999
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 40, 390),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)'
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101828',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
    paddingHorizontal: 6
  },
  messageScroll: {
    maxHeight: 180,
    width: '100%',
    marginBottom: 20
  },
  messageContainer: {
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475467',
    textAlign: 'center',
    letterSpacing: -0.1
  },
  buttonsWrapper: {
    width: '100%',
    gap: 10
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  buttonHalf: {
    flex: 1,
    width: undefined
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2
  }
})
