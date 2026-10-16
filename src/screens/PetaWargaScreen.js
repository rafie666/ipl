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

// Conditionally require react-native-maps for native platforms
let MapView, Marker, Callout, Circle
try {
  if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps')
    MapView = Maps.default
    Marker = Maps.Marker
    Callout = Maps.Callout
    Circle = Maps.Circle
  }
} catch (err) {
  MapView = null
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function PetaWargaScreen({ navigation }) {
  const { warga, scopedWarga, tagihan, rts = [], isWarga, isAdminLoggedIn, currentWarga, currentUser, isAdmin } = useApp()
  const [activeTab, setActiveTab] = useState('maps') // 'maps' | 'denah' | 'posko' | 'list'
  const [selectedRt, setSelectedRt] = useState('Semua')
  const [selectedBlok, setSelectedBlok] = useState('Semua')

  // Maps states
  const mapRef = useRef(null)
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

  // Restrict to RT and RW only
  if (isWarga && !isAdminLoggedIn) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="Peta & Denah Lingkungan"
          subtitle="Akses Terbatas"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedIconWrap}>
            <Shield size={38} color={colors.primary} />
          </View>
          <Text style={styles.restrictedTitle}>Akses Khusus Pengurus RT & RW</Text>
          <Text style={styles.restrictedSubtitle}>
            Fitur pemetaan GIS interaktif, sebaran status iuran rumah warga, dan denah posko hanya dapat diakses oleh Pengurus RT dan Super Admin RW.
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

  const wargaToDisplay = scopedWarga || warga

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

  const getUserCurrentLocation = async (shouldAnimate = false) => {
    setLocationLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setLocationPermission(status)
      if (status !== 'granted') {
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

        if (shouldAnimate && mapRef.current) {
          mapRef.current.animateToRegion(
            {
              ...coords,
              latitudeDelta: 0.0035,
              longitudeDelta: 0.0035
            },
            700
          )
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
    if (mapRef.current && lat && lng) {
      mapRef.current.animateToRegion(
        {
          latitude: Number(lat),
          longitude: Number(lng),
          latitudeDelta: 0.0025,
          longitudeDelta: 0.0025
        },
        600
      )
    }
  }

  const resetMapZoom = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(DEFAULT_REGION, 600)
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

  // Generate Leaflet Interactive Map HTML for Desktop Web & Fallback
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
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #e2e8f0; }
    .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); padding: 0; }
    .leaflet-popup-content { margin: 12px 14px; line-height: 1.4; font-size: 12px; }
    .popup-title { font-weight: 800; font-size: 14px; color: #0f172a; margin-bottom: 3px; }
    .popup-sub { color: #64748b; font-size: 11px; margin-bottom: 6px; }
    .popup-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 10px; margin-bottom: 8px; }
    .badge-lunas { background: #d1fae5; color: #065f46; }
    .badge-belum { background: #fee2e2; color: #991b1b; }
    .badge-posko { background: #e0e7ff; color: #3730a3; }
    .popup-actions { display: flex; gap: 6px; margin-top: 6px; }
    .popup-btn { flex: 1; text-align: center; padding: 6px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; text-decoration: none; cursor: pointer; }
    .btn-maps { background: #2563eb; color: #ffffff; }
    .btn-wa { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .pin-home { width: 26px; height: 26px; border-radius: 13px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: bold; border: 2px solid #fff; box-shadow: 0 3px 8px rgba(0,0,0,0.3); }
    .pin-lunas { background: #10b981; }
    .pin-belum { background: #ef4444; }
    .pin-posko { width: 30px; height: 30px; border-radius: 15px; background: #4f46e5; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; border: 2.5px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); }
    .pin-user { width: 22px; height: 22px; border-radius: 11px; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 0 0 4px rgba(37,99,235,0.35); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Circle radius lingkungan
    L.circle([${centerLat}, ${centerLng}], {
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
      radius: 280
    }).addTo(map);

    // User location
    const userLoc = ${userLocationJson};
    if (userLoc && userLoc.latitude) {
      const userIcon = L.divIcon({ className: 'custom-pin', html: '<div class="pin-user"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
      L.marker([userLoc.latitude, userLoc.longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup('<div class="popup-title">📍 Lokasi Anda Saat Ini</div><div class="popup-sub">Posisi GPS Perangkat</div>');
    }

    // Posko RT Markers
    const rtsData = ${JSON.stringify(rtsMarkersData)};
    rtsData.forEach(rt => {
      const icon = L.divIcon({ className: 'custom-pin', html: '<div class="pin-posko">🏛️</div>', iconSize: [30, 30], iconAnchor: [15, 15] });
      const popupHtml = '<div class="popup-title">🏛️ ' + rt.name + '</div>' +
        '<div class="popup-badge badge-posko">Posko Balai Warga</div>' +
        '<div class="popup-sub">' + rt.lokasi + '<br>Ketua: ' + (rt.ketua || '-') + '<br>Bendahara: ' + (rt.bendahara || '-') + '</div>' +
        '<div class="popup-actions">' +
          '<a class="popup-btn btn-maps" href="https://www.google.com/maps/search/?api=1&query=' + rt.lat + ',' + rt.lng + '" target="_blank">Google Maps</a>' +
          (rt.kontak ? '<a class="popup-btn btn-wa" href="https://wa.me/' + rt.kontak.replace(/\\D/g, '').replace(/^0/, '62') + '" target="_blank">WhatsApp</a>' : '') +
        '</div>';
      L.marker([rt.lat, rt.lng], { icon: icon }).addTo(map).bindPopup(popupHtml);
    });

    // Warga Markers
    const wargaData = ${JSON.stringify(wargaMarkersData)};
    wargaData.forEach(w => {
      const pinClass = w.isPaid ? 'pin-lunas' : 'pin-belum';
      const badgeClass = w.isPaid ? 'badge-lunas' : 'badge-belum';
      const statusText = w.isPaid ? 'IPL LUNAS ✓' : 'BELUM BAYAR';
      const icon = L.divIcon({ className: 'custom-pin', html: '<div class="pin-home ' + pinClass + '">🏠</div>', iconSize: [26, 26], iconAnchor: [13, 13] });
      const popupHtml = '<div class="popup-title">Blok ' + w.blok + '/' + w.noRumah + ' • ' + w.nama + '</div>' +
        '<div class="popup-badge ' + badgeClass + '">' + statusText + '</div>' +
        '<div class="popup-sub">Status: ' + w.statusHuni + ' • ' + w.jumlahJiwa + ' Jiwa</div>' +
        '<div class="popup-actions">' +
          '<a class="popup-btn btn-maps" href="https://www.google.com/maps/search/?api=1&query=' + w.lat + ',' + w.lng + '" target="_blank">Navigasi</a>' +
          (w.noHp ? '<a class="popup-btn btn-wa" href="https://wa.me/' + w.noHp.replace(/\\D/g, '').replace(/^0/, '62') + '" target="_blank">Chat WA</a>' : '') +
        '</div>';
      L.marker([w.lat, w.lng], { icon: icon }).addTo(map).bindPopup(popupHtml);
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

      {/* ===================== VIEW MODE 1: PETA INTERAKTIF (LEAFLET WEB / REACT-NATIVE-MAPS) ===================== */}
      {activeTab === 'maps' && (
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            /* DESKTOP & WEB: Full Interactive Leaflet Map */
            <iframe
              title="Peta Lingkungan Leaflet"
              srcDoc={generateLeafletHtml()}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 0
              }}
            />
          ) : MapView ? (
            /* MOBILE NATIVE: react-native-maps */
            <MapView
              ref={mapRef}
              style={styles.mapView}
              initialRegion={DEFAULT_REGION}
              showsUserLocation={false}
              showsCompass={true}
              showsScale={true}
              onPress={() => setSelectedMarker(null)}
            >
              {/* Radius Lingkungan */}
              <Circle
                center={{ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude }}
                radius={250}
                fillColor="rgba(37, 99, 235, 0.08)"
                strokeColor="rgba(37, 99, 235, 0.3)"
                strokeWidth={1.5}
              />

              {/* Marker Lokasi Pengguna (Live GPS) */}
              {userLocation && (
                <Marker
                  coordinate={userLocation}
                  title="Lokasi Anda"
                  description="Posisi GPS perangkat Anda saat ini"
                  onPress={() =>
                    setSelectedMarker({
                      nama: 'Lokasi Anda Saat Ini',
                      isUserLocationMarker: true,
                      lat: userLocation.latitude,
                      lng: userLocation.longitude
                    })
                  }
                >
                  <View style={styles.userLocationPin}>
                    <View style={styles.userLocationPulse} />
                    <View style={styles.userLocationDot} />
                  </View>
                </Marker>
              )}

              {/* Marker Posko / Balai RT */}
              {filteredRts.map((rtItem) => (
                <Marker
                  key={`rt-${rtItem.id}`}
                  coordinate={{
                    latitude: Number(rtItem.lat || -6.59715),
                    longitude: Number(rtItem.lng || 106.76415)
                  }}
                  title={rtItem.name}
                  description={rtItem.lokasi || 'Posko Balai Warga RT'}
                  onPress={() => setSelectedMarker({ ...rtItem, isPoskoMarker: true })}
                >
                  <View style={styles.poskoMapPin}>
                    <Landmark size={14} color="#FFFFFF" />
                  </View>
                </Marker>
              ))}

              {/* Marker Rumah Warga */}
              {filteredWarga.map((wItem) => {
                const isPaid = isWargaPaid(wItem)
                const isSelected = selectedMarker?.id === wItem.id

                return (
                  <Marker
                    key={`warga-${wItem.id}`}
                    coordinate={{
                      latitude: Number(wItem.lat || -6.59715),
                      longitude: Number(wItem.lng || 106.76415)
                    }}
                    title={`Blok ${wItem.blok}/${wItem.noRumah} - ${wItem.nama}`}
                    description={`Status IPL: ${isPaid ? 'LUNAS' : 'BELUM BAYAR'}`}
                    onPress={() => setSelectedMarker({ ...wItem, isWargaMarker: true })}
                  >
                    <View
                      style={[
                        styles.wargaMapPin,
                        isPaid ? styles.wargaMapPinPaid : styles.wargaMapPinUnpaid,
                        isSelected && styles.wargaMapPinSelected
                      ]}
                    >
                      <Home size={12} color="#FFFFFF" />
                    </View>
                  </Marker>
                )
              })}
            </MapView>
          ) : (
            /* FALLBACK FOR ENVIRONMENT WITHOUT NATIVE MAPVIEW */
            <View style={styles.mapFallbackContainer}>
              <MapIcon size={48} color={colors.primary} style={{ marginBottom: 12 }} />
              <Text style={styles.mapFallbackTitle}>Peta Interaktif GIS Siap</Text>
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

          {/* Quick Floating Controls on Map (Only for Native MapView) */}
          {Platform.OS !== 'web' && (
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
          )}

          {/* Map Legend Bar */}
          <View style={styles.mapLegendBar}>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendDotSmall, { backgroundColor: '#10B981' }]} />
              <Text style={styles.mapLegendText}>IPL Lunas</Text>
            </View>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendDotSmall, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.mapLegendText}>Belum Lunas</Text>
            </View>
            <View style={styles.mapLegendItem}>
              <View style={[styles.legendDotSmall, { backgroundColor: '#4F46E5' }]} />
              <Text style={styles.mapLegendText}>Balai RT</Text>
            </View>
          </View>

          {/* Bottom Card for Selected Marker (Native MapView mode) */}
          {selectedMarker && Platform.OS !== 'web' && (
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
    position: 'relative'
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
