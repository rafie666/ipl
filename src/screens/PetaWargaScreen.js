import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native'
import {
  MapPin,
  Home,
  CheckCircle2,
  AlertCircle,
  Landmark,
  Navigation,
  Phone,
  Layers,
  Compass,
  ExternalLink,
  ChevronRight,
  Crosshair,
  Sparkles,
  Info,
  X,
  Map as MapIcon,
  Shield,
  RefreshCw,
  Search
} from 'lucide-react-native'
import * as Location from 'expo-location'
import { useApp } from '../context/AppContext'
import AppHeader from '../components/AppHeader'
import AppCard from '../components/AppCard'
import AppBadge from '../components/AppBadge'
import AppButton from '../components/AppButton'
import { colors, typography, spacing, radius, shadows } from '../utils/theme'

// Conditionally require react-native-webview for native platforms (Android & iOS)
let WebView = null
try {
  if (Platform.OS !== 'web') {
    WebView = require('react-native-webview').WebView
  }
} catch (err) {
  WebView = null
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function PetaWargaScreen({ navigation }) {
  const { warga, scopedWarga, tagihan, rts = [], isWarga, isAdminLoggedIn, currentWarga, currentUser, isAdmin, isBendahara } = useApp()
  const [activeTab, setActiveTab] = useState('maps') // 'maps' | 'denah' | 'posko' | 'list'
  const [selectedRt, setSelectedRt] = useState('Semua')
  const [selectedBlok, setSelectedBlok] = useState('Semua')

  // Maps states & refs
  const webViewRef = useRef(null)
  const iframeRef = useRef(null)
  const [userLocation, setUserLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationPermission, setLocationPermission] = useState(null)
  const [selectedMarker, setSelectedMarker] = useState(null)

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  // Default coordinate center (Perumahan Alam Tirta Lestari)
  const DEFAULT_REGION = {
    latitude: -6.59720,
    longitude: 106.76425,
    latitudeDelta: 0.0055,
    longitudeDelta: 0.0055
  }

  // Khusus role Admin dan Bendahara saja
  const isAllowedPeta = isAdmin || isBendahara
  if (!isAllowedPeta) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="Denah & Peta Warga"
          subtitle="Akses Terbatas"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedIconWrap}>
            <Shield size={38} color={colors.primary} />
          </View>
          <Text style={styles.restrictedTitle}>Akses Khusus Admin & Bendahara</Text>
          <Text style={styles.restrictedSubtitle}>
            Fitur denah, pemetaan visual GIS, dan status iuran warga hanya dapat diakses oleh Admin IT dan Bendahara Keuangan.
          </Text>
          <AppButton
            title="Kembali ke Beranda"
            variant="primary"
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    )
  }

  const wargaToDisplay = isAdmin ? warga : (scopedWarga || warga)

  const existingBloks = Array.from(
    new Set(wargaToDisplay.map((w) => (w.blok || '').toUpperCase()).filter(Boolean))
  ).sort()
  const bloks = ['Semua', ...existingBloks.map((b) => `Blok ${b}`)]

  // Filtered warga list
  const filteredWarga = wargaToDisplay.filter((w) => {
    const matchBlok =
      selectedBlok === 'Semua' ||
      (w.blok || '').toUpperCase() === selectedBlok.replace('Blok ', '').toUpperCase()
    const matchRt = selectedRt === 'Semua' || w.rt_id === selectedRt
    return matchBlok && matchRt
  })

  // Filtered RTs list
  const filteredRts = (rts || []).filter((r) => {
    if (selectedRt === 'Semua') return true
    return r.id === selectedRt
  })

  // Auto detect user location on mount
  useEffect(() => {
    getUserCurrentLocation()
  }, [])

  // Web message listener for iframe bridge
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMsg = (e) => handleWebViewMessage(e)
      window.addEventListener('message', handleWebMsg)
      return () => window.removeEventListener('message', handleWebMsg)
    }
  }, [])

  const handleWebViewMessage = (event) => {
    try {
      const raw = event?.nativeEvent?.data || event?.data
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (!data) return

      if (data.type === 'SELECT_MARKER') {
        setSelectedMarker(data.payload)
      } else if (data.type === 'DESELECT_MARKER') {
        setSelectedMarker(null)
      } else if (data.type === 'OPEN_MAPS') {
        openGoogleMaps(data.lat, data.lng, data.label)
      } else if (data.type === 'OPEN_WA') {
        openWhatsApp(data.phone)
      } else if (data.type === 'NAVIGATE_DETAIL' && data.payload) {
        navigation.navigate('DetailWarga', { warga: data.payload })
      }
    } catch (_) {}
  }

  const getUserCurrentLocation = async (shouldAnimate = false) => {
    setLocationLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setLocationPermission(status)
      if (status !== 'granted') {
        if (shouldAnimate) {
          Alert.alert('Izin Lokasi', 'Akses lokasi diperlukan untuk melihat posisi Anda pada peta lingkungan.')
        }
        setLocationLoading(false)
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      })

      if (location?.coords) {
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
        setUserLocation(coords)

        if (shouldAnimate) {
          focusToCoordinate(coords.latitude, coords.longitude)
        }
      }
    } catch (err) {
      console.warn('Location error:', err)
    } finally {
      setLocationLoading(false)
    }
  }

  const focusToCoordinate = (lat, lng, markerObj = null) => {
    if (markerObj) {
      setSelectedMarker(markerObj)
    }
    if (lat && lng) {
      const jsCode = `if (window.focusMarker) { window.focusMarker(${Number(lat)}, ${Number(lng)}); } true;`
      if (Platform.OS !== 'web' && webViewRef.current) {
        webViewRef.current.injectJavaScript(jsCode)
      } else if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ type: 'FOCUS', lat: Number(lat), lng: Number(lng) }),
          '*'
        )
      }
    }
  }

  const resetMapZoom = () => {
    setSelectedMarker(null)
    const jsCode = `if (window.resetMapView) { window.resetMapView(); } true;`
    if (Platform.OS !== 'web' && webViewRef.current) {
      webViewRef.current.injectJavaScript(jsCode)
    } else if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ type: 'RESET_VIEW' }),
        '*'
      )
    }
  }

  const openGoogleMaps = (lat, lng, label = 'Lokasi') => {
    const latitude = Number(lat) || -6.59715
    const longitude = Number(lng) || 106.76415
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url)
        } else {
          Alert.alert('Info', `Titik Koordinat: ${latitude}, ${longitude}`)
        }
      })
      .catch(() => {
        Alert.alert('Info', `Titik Koordinat: ${latitude}, ${longitude}`)
      })
  }

  const openWhatsApp = (phone) => {
    if (!phone) return
    const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '62')
    Linking.openURL(`https://wa.me/${cleanPhone}`)
  }

  const isWargaPaid = (item) => {
    const bill = tagihan.find(
      (t) =>
        (t.wargaId === item.id || (t.namaWarga && t.namaWarga === item.nama)) &&
        Number(t.bulan) === currentMonth &&
        Number(t.tahun) === currentYear
    )
    return bill?.status === 'Lunas'
  }

  // Generate Leaflet Interactive Map HTML for Mobile (WebView) & Web (iframe)
  const generateLeafletHtml = () => {
    const centerLat = DEFAULT_REGION.latitude
    const centerLng = DEFAULT_REGION.longitude

    const wargaMarkersData = filteredWarga.map((w) => {
      const isPaid = isWargaPaid(w)
      return {
        id: w.id,
        nama: w.nama,
        blok: w.blok,
        noRumah: w.noRumah,
        statusHuni: w.statusHuni || 'Tetap',
        jumlahJiwa: w.jumlahJiwa || 1,
        noHp: w.noHp || '',
        lat: Number(w.lat || -6.59715),
        lng: Number(w.lng || 106.76415),
        isPaid: isPaid
      }
    })

    const rtsMarkersData = filteredRts.map((r) => ({
      id: r.id,
      name: r.name,
      ketua: r.ketua || '',
      bendahara: r.bendahara || '',
      kontak: r.kontak || '',
      lokasi: r.lokasi || 'Posko Balai Warga & Pos Ronda',
      lat: Number(r.lat || -6.59715),
      lng: Number(r.lng || 106.76415)
    }))

    const userLocationJson = userLocation ? JSON.stringify(userLocation) : 'null'

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Peta Warga IPL</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-tap-highlight-color: transparent; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #f8fafc; }

    /* Custom Leaflet Zoom Controls */
    .leaflet-bar {
      border-radius: 12px !important;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12) !important;
      border: 1px solid rgba(226, 232, 240, 0.9) !important;
    }
    .leaflet-bar a {
      background-color: #ffffff !important;
      color: #0f172a !important;
      font-weight: 700 !important;
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
      border-bottom: 1px solid #f1f5f9 !important;
      transition: all 0.15s ease;
    }
    .leaflet-bar a:hover, .leaflet-bar a:active {
      background-color: #ecfdf5 !important;
      color: #059669 !important;
    }

    /* Popup Modern Neo-Banking */
    .leaflet-popup-content-wrapper {
      border-radius: 16px !important;
      box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1) !important;
      padding: 0 !important;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      background: #ffffff;
    }
    .leaflet-popup-content {
      margin: 12px 14px !important;
      line-height: 1.4 !important;
    }
    .leaflet-popup-tip {
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
    }
    .popup-card {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .popup-tag {
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #059669;
      text-transform: uppercase;
    }
    .popup-title {
      font-weight: 800;
      font-size: 14px;
      color: #0f172a;
    }
    .popup-sub {
      color: #64748b;
      font-size: 11px;
      margin: 2px 0 4px;
    }
    .popup-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 10px;
      width: fit-content;
      margin-bottom: 4px;
    }
    .badge-paid { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-unpaid { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .badge-posko { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .popup-actions {
      display: flex;
      gap: 6px;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #f1f5f9;
    }
    .popup-btn {
      flex: 1;
      text-align: center;
      padding: 7px 8px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 11px;
      text-decoration: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      border: none;
    }
    .btn-maps { background: #059669; color: #ffffff; }
    .btn-wa { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .btn-detail { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

    /* Custom Pins */
    .pin-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .pin-container:hover, .pin-container:active {
      transform: scale(1.15);
      z-index: 999 !important;
    }
    .pin-bubble {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 7px;
      border-radius: 9999px;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      box-shadow: 0 4px 10px rgba(0,0,0,0.22);
      border: 1.5px solid #ffffff;
      white-space: nowrap;
    }
    .pin-paid {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      box-shadow: 0 4px 12px rgba(5,150,105,0.45);
    }
    .pin-unpaid {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      box-shadow: 0 4px 12px rgba(217,119,6,0.45);
    }
    .pin-posko {
      background: linear-gradient(135deg, #064e3b 0%, #022c22 100%);
      box-shadow: 0 4px 14px rgba(6,78,59,0.5);
    }
    .pin-point {
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      margin-top: -1px;
    }
    .point-paid { border-top: 5px solid #047857; }
    .point-unpaid { border-top: 5px solid #d97706; }
    .point-posko { border-top: 5px solid #022c22; }

    /* GPS Live Pulse */
    .pin-user-wrap {
      position: relative;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pin-user-pulse {
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.35);
      animation: userPulse 2s infinite ease-out;
    }
    .pin-user-core {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #2563eb;
      border: 2.5px solid #ffffff;
      box-shadow: 0 2px 6px rgba(37,99,235,0.5);
    }
    @keyframes userPulse {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(1.6); opacity: 0; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function sendToApp(payload) {
      const msg = JSON.stringify(payload);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      } else if (window.parent && window.parent.postMessage) {
        window.parent.postMessage(msg, '*');
      }
    }

    const map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], 17);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Circle radius lingkungan
    L.circle([${centerLat}, ${centerLng}], {
      color: '#059669',
      fillColor: '#10b981',
      fillOpacity: 0.06,
      weight: 2,
      dashArray: '6, 6',
      radius: 280
    }).addTo(map);

    // User location marker
    let userMarker = null;
    function setUserLocationPin(lat, lng) {
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'custom-pin',
          html: '<div class="pin-user-wrap"><div class="pin-user-pulse"></div><div class="pin-user-core"></div></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
        userMarker.bindPopup('<div class="popup-title">📍 Lokasi Anda Saat Ini</div><div class="popup-sub">Posisi GPS Perangkat</div>');
      }
    }

    const initUserLoc = ${userLocationJson};
    if (initUserLoc && initUserLoc.latitude) {
      setUserLocationPin(initUserLoc.latitude, initUserLoc.longitude);
    }

    // Posko Balai RT Markers
    const rtsData = ${JSON.stringify(rtsMarkersData)};
    rtsData.forEach(rt => {
      const icon = L.divIcon({
        className: 'custom-pin',
        html: '<div class="pin-container"><div class="pin-bubble pin-posko">🏛️ ' + rt.name + '</div><div class="pin-point point-posko"></div></div>',
        iconSize: [84, 32],
        iconAnchor: [42, 32]
      });
      const popupHtml = '<div class="popup-card">' +
        '<div class="popup-tag">POSKO BALAI WARGA</div>' +
        '<div class="popup-title">🏛️ ' + rt.name + '</div>' +
        '<div class="popup-badge badge-posko">Posko Aktif RT</div>' +
        '<div class="popup-sub">' + rt.lokasi + '<br>Ketua: ' + (rt.ketua || '-') + '<br>Bendahara: ' + (rt.bendahara || '-') + '</div>' +
        '<div class="popup-actions">' +
          '<button class="popup-btn btn-maps" onclick="sendToApp({ type: \\'OPEN_MAPS\\', lat: ' + rt.lat + ', lng: ' + rt.lng + ', label: \\'Posko ' + rt.name.replace(/'/g, "") + '\\' })">🧭 Navigasi</button>' +
          (rt.kontak ? '<button class="popup-btn btn-wa" onclick="sendToApp({ type: \\'OPEN_WA\\', phone: \\'' + rt.kontak + '\\' })">💬 WA</button>' : '') +
        '</div></div>';
      
      const m = L.marker([rt.lat, rt.lng], { icon: icon }).addTo(map).bindPopup(popupHtml);
      m.on('click', () => {
        sendToApp({ type: 'SELECT_MARKER', payload: { ...rt, isPoskoMarker: true } });
      });
    });

    // Warga Markers
    const wargaData = ${JSON.stringify(wargaMarkersData)};
    wargaData.forEach(w => {
      const pinClass = w.isPaid ? 'pin-paid' : 'pin-unpaid';
      const pointClass = w.isPaid ? 'point-paid' : 'point-unpaid';
      const badgeClass = w.isPaid ? 'badge-paid' : 'badge-unpaid';
      const statusText = w.isPaid ? 'IPL LUNAS ✓' : 'BELUM BAYAR';
      const blokLabel = (w.blok || 'A') + '-' + (w.noRumah || '01');
      
      const icon = L.divIcon({
        className: 'custom-pin',
        html: '<div class="pin-container"><div class="pin-bubble ' + pinClass + '">🏠 ' + blokLabel + '</div><div class="pin-point ' + pointClass + '"></div></div>',
        iconSize: [74, 30],
        iconAnchor: [37, 30]
      });

      const popupHtml = '<div class="popup-card">' +
        '<div class="popup-tag">UNIT RUMAH WARGA</div>' +
        '<div class="popup-title">Blok ' + w.blok + '/' + w.noRumah + ' • ' + w.nama + '</div>' +
        '<div class="popup-badge ' + badgeClass + '">' + statusText + '</div>' +
        '<div class="popup-sub">Status: ' + w.statusHuni + ' • ' + w.jumlahJiwa + ' Jiwa</div>' +
        '<div class="popup-actions">' +
          '<button class="popup-btn btn-maps" onclick="sendToApp({ type: \\'OPEN_MAPS\\', lat: ' + w.lat + ', lng: ' + w.lng + ', label: \\'Rumah ' + w.nama.replace(/'/g, "") + '\\' })">🧭 Navigasi</button>' +
          (w.noHp ? '<button class="popup-btn btn-wa" onclick="sendToApp({ type: \\'OPEN_WA\\', phone: \\'' + w.noHp + '\\' })">💬 WA</button>' : '') +
          '<button class="popup-btn btn-detail" onclick="sendToApp({ type: \\'NAVIGATE_DETAIL\\', payload: ' + JSON.stringify(w).replace(/"/g, '&quot;') + ' })">Detail</button>' +
        '</div></div>';

      const m = L.marker([w.lat, w.lng], { icon: icon }).addTo(map).bindPopup(popupHtml);
      m.on('click', () => {
        sendToApp({ type: 'SELECT_MARKER', payload: { ...w, isWargaMarker: true } });
      });
    });

    map.on('click', () => {
      sendToApp({ type: 'DESELECT_MARKER' });
    });

    // Global bridge window methods
    window.focusMarker = function(lat, lng) {
      map.flyTo([lat, lng], 18, { animate: true, duration: 0.8 });
    };
    window.setUserLocation = function(lat, lng) {
      setUserLocationPin(lat, lng);
      map.flyTo([lat, lng], 18, { animate: true, duration: 0.8 });
    };
    window.resetMapView = function() {
      map.flyTo([${centerLat}, ${centerLng}], 17, { animate: true, duration: 0.8 });
    };

    // Web iframe postMessage listener
    window.addEventListener('message', function(event) {
      try {
        const d = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (d.type === 'FOCUS') window.focusMarker(d.lat, d.lng);
        if (d.type === 'SET_USER_LOC') window.setUserLocation(d.lat, d.lng);
        if (d.type === 'RESET_VIEW') window.resetMapView();
      } catch (_) {}
    });
  </script>
</body>
</html>`
  }

  const renderWargaItem = ({ item }) => {
    const isPaid = isWargaPaid(item)
    const targetRt = (rts || []).find((r) => r.id === item.rt_id)

    return (
      <AppCard
        style={styles.card}
        onPress={() => navigation.navigate('DetailWarga', { warga: item })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.blokBadge}>
            <Text style={styles.blokText}>
              Blok {item.blok || 'A'} No. {item.noRumah}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.rtTagBadge}>
              <Text style={styles.rtTagText}>{targetRt?.name || 'RT 01'}</Text>
            </View>
            <AppBadge status={isPaid ? 'Lunas' : 'Belum Bayar'} />
          </View>
        </View>

        <Text style={styles.wargaNama} numberOfLines={1}>
          {item.nama}
        </Text>
        <Text style={styles.wargaInfo} numberOfLines={1}>
          Status: {item.statusHuni || 'Tetap'} ({item.statusKepemilikan || 'Milik Sendiri'}) •{' '}
          {item.jumlahJiwa || 1} Jiwa
        </Text>

        <View style={styles.cardFooterActions}>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('maps')
              setTimeout(() => focusToCoordinate(item.lat, item.lng, { ...item, isWargaMarker: true }), 300)
            }}
            style={styles.mapActionBtn}
            activeOpacity={0.7}
          >
            <MapIcon size={12} color={colors.primary} />
            <Text style={styles.mapActionText}>Lihat di Peta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openGoogleMaps(item.lat, item.lng, `Rumah ${item.nama}`)}
            style={styles.mapActionBtn}
            activeOpacity={0.7}
          >
            <Navigation size={12} color={colors.primary} />
            <Text style={styles.mapActionText}>Google Maps</Text>
          </TouchableOpacity>
          {item.noHp ? (
            <TouchableOpacity
              onPress={() => openWhatsApp(item.noHp)}
              style={styles.waActionBtn}
              activeOpacity={0.7}
            >
              <Phone size={12} color="#059669" />
              <Text style={styles.waActionText}>Chat WA</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </AppCard>
    )
  }

  const renderRtPoskoItem = (rtItem) => {
    return (
      <AppCard key={rtItem.id} style={styles.poskoCard}>
        <View style={styles.poskoHeader}>
          <View style={styles.poskoIconBox}>
            <Landmark size={20} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.poskoTitleRow}>
              <Text style={styles.poskoTitle}>🏛️ {rtItem.name}</Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>Posko Aktif</Text>
              </View>
            </View>
            <Text style={styles.poskoSubtitle} numberOfLines={2}>
              {rtItem.lokasi || rtItem.keterangan || 'Pos Balai Warga & Pos Ronda Lingkungan'}
            </Text>
          </View>
        </View>

        <View style={styles.poskoInfoBox}>
          <View style={styles.poskoInfoRow}>
            <Text style={styles.poskoInfoLabel}>Ketua RT:</Text>
            <Text style={styles.poskoInfoVal}>{rtItem.ketua || 'Belum diatur'}</Text>
          </View>
          <View style={styles.poskoInfoRow}>
            <Text style={styles.poskoInfoLabel}>Bendahara:</Text>
            <Text style={styles.poskoInfoVal}>{rtItem.bendahara || 'Belum diatur'}</Text>
          </View>
          {rtItem.kontak ? (
            <View style={styles.poskoInfoRow}>
              <Text style={styles.poskoInfoLabel}>Kontak WhatsApp:</Text>
              <Text style={[styles.poskoInfoVal, { color: colors.primary, fontFamily: 'monospace' }]}>
                {rtItem.kontak}
              </Text>
            </View>
          ) : null}
          <View style={styles.poskoInfoRow}>
            <Text style={styles.poskoInfoLabel}>Koordinat GIS:</Text>
            <Text style={[styles.poskoInfoVal, { fontFamily: 'monospace', fontSize: 11 }]}>
              {Number(rtItem.lat || -6.59715).toFixed(5)}, {Number(rtItem.lng || 106.76415).toFixed(5)}
            </Text>
          </View>
        </View>

        <View style={styles.poskoActionsRow}>
          <TouchableOpacity
            style={styles.openMapsBtn}
            onPress={() => {
              setActiveTab('maps')
              setTimeout(() => focusToCoordinate(rtItem.lat, rtItem.lng, { ...rtItem, isPoskoMarker: true }), 300)
            }}
            activeOpacity={0.8}
          >
            <MapIcon size={14} color={colors.white} />
            <Text style={styles.openMapsBtnText}>Fokus Peta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.openMapsBtn, { backgroundColor: '#4338CA' }]}
            onPress={() => openGoogleMaps(rtItem.lat, rtItem.lng, `Posko ${rtItem.name}`)}
            activeOpacity={0.8}
          >
            <Navigation size={14} color={colors.white} />
            <Text style={styles.openMapsBtnText}>Navigasi</Text>
          </TouchableOpacity>
          {rtItem.kontak ? (
            <TouchableOpacity
              style={styles.hubungiWaBtn}
              onPress={() => openWhatsApp(rtItem.kontak)}
              activeOpacity={0.8}
            >
              <Phone size={14} color="#059669" />
              <Text style={styles.hubungiWaBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </AppCard>
    )
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Peta & Denah Lingkungan"
        subtitle="Sistem GIS Interaktif RT/RW (Mobile & Desktop)"
        onBack={() => navigation.goBack()}
      />

      {/* Main View Mode Selector */}
      <View style={styles.modeTabsWrap}>
        <TouchableOpacity
          style={[styles.modeTab, activeTab === 'maps' && styles.modeTabActive]}
          onPress={() => setActiveTab('maps')}
          activeOpacity={0.8}
        >
          <MapIcon size={14} color={activeTab === 'maps' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.modeTabText, activeTab === 'maps' && styles.modeTabTextActive]}>
            Peta Leaflet / Maps
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, activeTab === 'denah' && styles.modeTabActive]}
          onPress={() => setActiveTab('denah')}
          activeOpacity={0.8}
        >
          <Compass size={14} color={activeTab === 'denah' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.modeTabText, activeTab === 'denah' && styles.modeTabTextActive]}>
            Denah Visual
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, activeTab === 'posko' && styles.modeTabActive]}
          onPress={() => setActiveTab('posko')}
          activeOpacity={0.8}
        >
          <Landmark size={14} color={activeTab === 'posko' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.modeTabText, activeTab === 'posko' && styles.modeTabTextActive]}>
            Pos RT ({(rts || []).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, activeTab === 'list' && styles.modeTabActive]}
          onPress={() => setActiveTab('list')}
          activeOpacity={0.8}
        >
          <Layers size={14} color={activeTab === 'list' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.modeTabText, activeTab === 'list' && styles.modeTabTextActive]}>
            Daftar ({filteredWarga.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* RT Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={[styles.filterChip, selectedRt === 'Semua' && styles.filterChipActive]}
            onPress={() => setSelectedRt('Semua')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, selectedRt === 'Semua' && styles.filterTextActive]}>
              Semua RT
            </Text>
          </TouchableOpacity>
          {(rts || []).map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.filterChip, selectedRt === r.id && styles.filterChipActive]}
              onPress={() => setSelectedRt(r.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, selectedRt === r.id && styles.filterTextActive]}>
                🏛️ {r.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Blok Filter Chips (Jika mode list, denah, atau maps) */}
      {activeTab !== 'posko' && (
        <View style={[styles.filterSection, { paddingTop: 2 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {bloks.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.blokFilterChip, selectedBlok === b && styles.blokFilterChipActive]}
                onPress={() => setSelectedBlok(b)}
                activeOpacity={0.8}
              >
                <Text style={[styles.blokFilterText, selectedBlok === b && styles.blokFilterTextActive]}>
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ===================== VIEW MODE 1: PETA INTERAKTIF LEAFLET ===================== */}
      {activeTab === 'maps' && (
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            /* DESKTOP & WEB: Full Interactive Leaflet Map via iframe */
            <iframe
              ref={iframeRef}
              title="Peta Lingkungan Leaflet"
              srcDoc={generateLeafletHtml()}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 0
              }}
            />
          ) : WebView ? (
            /* MOBILE NATIVE (ANDROID & IOS): Full Interactive Leaflet Map via WebView */
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: generateLeafletHtml() }}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Memuat Peta Leaflet Lingkungan...</Text>
                </View>
              )}
              onMessage={handleWebViewMessage}
            />
          ) : (
            /* FALLBACK FOR ENVIRONMENT WITHOUT WEBVIEW */
            <View style={styles.mapFallbackContainer}>
              <MapIcon size={48} color={colors.primary} style={{ marginBottom: 12 }} />
              <Text style={styles.mapFallbackTitle}>Peta Interaktif Leaflet Siap</Text>
              <Text style={styles.mapFallbackDesc}>
                Titik koordinat {filteredWarga.length} unit rumah & {(rts || []).length} balai posko siap diakses.
              </Text>
              <TouchableOpacity
                style={styles.openFallbackMapsBtn}
                onPress={() => openGoogleMaps(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude, 'Lingkungan RT/RW')}
              >
                <Navigation size={16} color={colors.white} />
                <Text style={styles.openFallbackMapsBtnText}>Buka Seluruh Wilayah di Google Maps</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Floating Controls on Map */}
          <View style={styles.mapFloatingControls}>
            <TouchableOpacity
              style={styles.floatingMapBtn}
              onPress={() => getUserCurrentLocation(true)}
              activeOpacity={0.85}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Crosshair size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.floatingMapBtn}
              onPress={resetMapZoom}
              activeOpacity={0.85}
            >
              <Compass size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Map Legend Bar */}
          <View style={styles.mapLegendBar}>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendDotSmall, { backgroundColor: '#059669' }]} />
              <Text style={styles.mapLegendText}>Lunas ({filteredWarga.filter(isWargaPaid).length})</Text>
            </View>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendDotSmall, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.mapLegendText}>Belum ({filteredWarga.filter((w) => !isWargaPaid(w)).length})</Text>
            </View>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendDotSmall, { backgroundColor: '#064E3B' }]} />
              <Text style={styles.mapLegendText}>Balai RT ({filteredRts.length})</Text>
            </View>
          </View>

          {/* Bottom Card for Selected Marker */}
          {selectedMarker && (
            <View style={styles.selectedMarkerDrawer}>
              <View style={styles.drawerHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawerTag}>
                    {selectedMarker.isUserLocationMarker
                      ? 'LOKASI PERANGKAT ANDA'
                      : selectedMarker.isPoskoMarker
                      ? 'POSKO BALAI WARGA'
                      : `RUMAH WARGA • BLOK ${selectedMarker.blok}/${selectedMarker.noRumah}`}
                  </Text>
                  <Text style={styles.drawerTitle} numberOfLines={1}>
                    {selectedMarker.nama || selectedMarker.name || 'Titik Lokasi'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedMarker(null)} style={styles.drawerCloseBtn}>
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {selectedMarker.isWargaMarker && (
                <View style={styles.drawerWargaRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AppBadge status={isWargaPaid(selectedMarker) ? 'Lunas' : 'Belum Bayar'} />
                    <Text style={styles.drawerWargaInfo}>
                      {selectedMarker.statusHuni || 'Tetap'} • {selectedMarker.jumlahJiwa || 1} Jiwa
                    </Text>
                  </View>
                  <Text style={styles.drawerCoordText}>
                    GIS: {Number(selectedMarker.lat).toFixed(4)}, {Number(selectedMarker.lng).toFixed(4)}
                  </Text>
                </View>
              )}

              {selectedMarker.isPoskoMarker && (
                <Text style={styles.drawerPoskoDesc} numberOfLines={2}>
                  {selectedMarker.lokasi || selectedMarker.keterangan || 'Posko Balai Warga & Pos Ronda'}
                </Text>
              )}

              <View style={styles.drawerActionRow}>
                <TouchableOpacity
                  style={styles.drawerNavBtn}
                  onPress={() =>
                    openGoogleMaps(
                      selectedMarker.lat || selectedMarker.latitude,
                      selectedMarker.lng || selectedMarker.longitude,
                      selectedMarker.nama || selectedMarker.name
                    )
                  }
                  activeOpacity={0.85}
                >
                  <Navigation size={14} color="#FFFFFF" />
                  <Text style={styles.drawerNavBtnText}>Buka Google Maps</Text>
                </TouchableOpacity>

                {selectedMarker.noHp || selectedMarker.kontak ? (
                  <TouchableOpacity
                    style={styles.drawerWaBtn}
                    onPress={() => openWhatsApp(selectedMarker.noHp || selectedMarker.kontak)}
                    activeOpacity={0.85}
                  >
                    <Phone size={14} color="#059669" />
                    <Text style={styles.drawerWaBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                ) : null}

                {selectedMarker.isWargaMarker && (
                  <TouchableOpacity
                    style={styles.drawerDetailBtn}
                    onPress={() => navigation.navigate('DetailWarga', { warga: selectedMarker })}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.drawerDetailBtnText}>Detail</Text>
                    <ChevronRight size={14} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* ===================== VIEW MODE 2: DENAH VISUAL GRID ===================== */}
      {activeTab === 'denah' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* RT Balai Banner */}
          <View style={styles.denahRtHeader}>
            <Text style={styles.sectionHeaderTitle}>🏛️ Posko & Balai Warga Terdaftar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {filteredRts.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.denahRtCard}
                  onPress={() => {
                    setActiveTab('maps')
                    setTimeout(() => focusToCoordinate(r.lat, r.lng, { ...r, isPoskoMarker: true }), 300)
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.denahRtIconBox}>
                    <Landmark size={16} color={colors.white} />
                  </View>
                  <View>
                    <Text style={styles.denahRtName}>{r.name}</Text>
                    <Text style={styles.denahRtKetua} numberOfLines={1}>
                      Ketua: {r.ketua || '-'}
                    </Text>
                    <Text style={styles.denahRtMapsLink}>Lihat di Peta 📍</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Units Grid by Block */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: spacing.md, marginBottom: spacing.xs }]}>
            🏠 Denah Unit Rumah Warga (Status IPL)
          </Text>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>IPL Lunas</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Belum Bayar</Text>
            </View>
          </View>

          <View style={styles.gridContainer}>
            {filteredWarga.map((item) => {
              const isPaid = isWargaPaid(item)

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.gridUnitCard, isPaid ? styles.gridUnitPaid : styles.gridUnitUnpaid]}
                  onPress={() => navigation.navigate('DetailWarga', { warga: item })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.gridUnitBlok, isPaid ? styles.gridTextPaid : styles.gridTextUnpaid]}>
                    {item.blok}-{item.noRumah}
                  </Text>
                  <Text style={styles.gridUnitNama} numberOfLines={1}>
                    {item.nama?.split(' ')[0]}
                  </Text>
                  <View style={[styles.gridStatusPill, isPaid ? styles.pillPaid : styles.pillUnpaid]}>
                    <Text style={[styles.gridStatusText, isPaid ? styles.textPaid : styles.textUnpaid]}>
                      {isPaid ? 'Lunas' : 'Belum'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      )}

      {/* ===================== VIEW MODE 3: POSKO & BALAI RT LIST ===================== */}
      {activeTab === 'posko' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.infoBanner}>
            <MapPin size={18} color={colors.primary} />
            <Text style={styles.infoBannerText}>
              Lokasi Pos Ronda dan Balai Warga masing-masing RT telah terhubung dengan koordinat GIS Google Maps.
            </Text>
          </View>
          {filteredRts.map((r) => renderRtPoskoItem(r))}
        </ScrollView>
      )}

      {/* ===================== VIEW MODE 4: DAFTAR UNIT RUMAH ===================== */}
      {activeTab === 'list' && (
        <FlatList
          data={filteredWarga}
          keyExtractor={(item) => item.id || String(Math.random())}
          renderItem={renderWargaItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  modeTabsWrap: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.xs
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  modeTabActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  modeTabTextActive: {
    color: colors.primary
  },
  filterSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 4
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6
  },
  filterChipActive: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  blokFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6
  },
  blokFilterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  blokFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  blokFilterTextActive: {
    color: colors.white,
    fontWeight: '700'
  },

  /* MAPS STYLES */
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden'
  },
  webView: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    zIndex: 10
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 8
  },
  mapView: {
    width: '100%',
    height: '100%'
  },
  mapFallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: '#F8FAFC'
  },
  mapFallbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6
  },
  mapFallbackDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg
  },
  openFallbackMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    ...shadows.card
  },
  openFallbackMapsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white
  },
  userLocationPin: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  userLocationPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.25)'
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  poskoMapPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.soft
  },
  wargaMapPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.soft
  },
  wargaMapPinPaid: {
    backgroundColor: '#10B981'
  },
  wargaMapPinUnpaid: {
    backgroundColor: '#EF4444'
  },
  wargaMapPinSelected: {
    transform: [{ scale: 1.3 }],
    borderColor: '#F59E0B',
    borderWidth: 3
  },
  mapFloatingControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 10
  },
  floatingMapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  mapLegendBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    ...shadows.soft
  },
  mapLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  mapLegendText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary
  },

  /* SELECTED MARKER BOTTOM DRAWER */
  selectedMarkerDrawer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...shadows.card
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  drawerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2
  },
  drawerCloseBtn: {
    padding: 4
  },
  drawerWargaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6
  },
  drawerWargaInfo: {
    fontSize: 11,
    color: colors.textSecondary
  },
  drawerCoordText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted
  },
  drawerPoskoDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 4
  },
  drawerActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  drawerNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: radius.md
  },
  drawerNavBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.white
  },
  drawerWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  drawerWaBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669'
  },
  drawerDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  drawerDetailBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary
  },

  /* OTHER MODES STYLES */
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 150
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 150
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  denahRtHeader: {
    marginBottom: spacing.sm
  },
  denahRtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 170
  },
  denahRtIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  denahRtName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary
  },
  denahRtKetua: {
    fontSize: 10,
    color: colors.textSecondary
  },
  denahRtMapsLink: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  gridUnitCard: {
    width: '31%',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  gridUnitPaid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4'
  },
  gridUnitUnpaid: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2'
  },
  gridUnitBlok: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace'
  },
  gridTextPaid: {
    color: '#065F46'
  },
  gridTextUnpaid: {
    color: '#991B1B'
  },
  gridUnitNama: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2
  },
  gridStatusPill: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full
  },
  pillPaid: {
    backgroundColor: '#D1FAE5'
  },
  pillUnpaid: {
    backgroundColor: '#FEE2E2'
  },
  gridStatusText: {
    fontSize: 9,
    fontWeight: '700'
  },
  textPaid: {
    color: '#065F46'
  },
  textUnpaid: {
    color: '#991B1B'
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: spacing.md
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: colors.primaryDark,
    lineHeight: 16
  },
  poskoCard: {
    marginBottom: spacing.md,
    padding: spacing.md
  },
  poskoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  poskoIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  poskoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  poskoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary
  },
  activePill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#C7D2FE'
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3730A3'
  },
  poskoSubtitle: {
    fontSize: 11,
    color: colors.textSecondary
  },
  poskoInfoBox: {
    backgroundColor: colors.background,
    padding: spacing.sm + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: 4
  },
  poskoInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  poskoInfoLabel: {
    fontSize: 11,
    color: colors.textSecondary
  },
  poskoInfoVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary
  },
  poskoActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  openMapsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primary
  },
  openMapsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white
  },
  hubungiWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  hubungiWaBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669'
  },
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  blokBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  blokText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary
  },
  rtTagBadge: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  rtTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary
  },
  wargaNama: {
    ...typography.cardTitle,
    marginBottom: 2
  },
  wargaInfo: {
    ...typography.caption,
    marginBottom: spacing.xs
  },
  cardFooterActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  mapActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: radius.sm
  },
  mapActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary
  },
  waActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: radius.sm
  },
  waActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669'
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  restrictedIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  restrictedTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.xs
  },
  restrictedSubtitle: {
    ...typography.bodySecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: spacing.lg
  }
})
