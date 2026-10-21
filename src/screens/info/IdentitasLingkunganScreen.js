import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform
} from 'react-native'
import {
  Building2,
  Users,
  Save,
  Phone,
  CreditCard,
  MapPin,
  UserCheck
} from 'lucide-react-native'
import { useApp } from '../../context/AppContext'
import AppHeader from '../../components/layout/AppHeader'
import AppButton from '../../components/shared/AppButton'
import { colors, spacing, radius, typography } from '../../utils/theme'

export default function IdentitasLingkunganScreen({ navigation }) {
  const {
    config,
    updateConfig,
    rts = [],
    updateRtData,
    isRT,
    currentRT
  } = useApp()

  const [lingkunganTab, setLingkunganTab] = useState('rw')
  const [rwNamaLingkungan, setRwNamaLingkungan] = useState(config?.namaLingkungan || 'Perumahan Alam Tirta Lestari')
  const [rwNomor, setRwNomor] = useState(config?.rw || 'RW 01')
  const [rwKetua, setRwKetua] = useState(config?.ketuaRw || 'Bpk. H. Rahmat Hidayat')
  const [rwKontak, setRwKontak] = useState(config?.kontakRw || '081122334455')
  const [rwRekening, setRwRekening] = useState(config?.rekeningRw || 'BCA 7788990011 a.n Kas RW 01')

  const [selectedRtId, setSelectedRtId] = useState(isRT ? (currentRT?.id || 'rt-01-01') : (rts?.[0]?.id || 'rt-01-01'))
  const activeRt = (rts || []).find((r) => r.id === selectedRtId) || rts?.[0]
  const [rtKetua, setRtKetua] = useState('')
  const [rtBendahara, setRtBendahara] = useState('')
  const [rtKontak, setRtKontak] = useState('')
  const [rtRekening, setRtRekening] = useState('')
  const [rtLokasi, setRtLokasi] = useState('')

  useEffect(() => {
    if (activeRt) {
      setRtKetua(activeRt.ketua || '')
      setRtBendahara(activeRt.bendahara || '')
      setRtKontak(activeRt.kontak || '')
      setRtRekening(activeRt.rekening || '')
      setRtLokasi(activeRt.lokasi || activeRt.deskripsi || '')
    }
  }, [selectedRtId, activeRt])

  const handleSimpanRw = async () => {
    if (!rwNamaLingkungan.trim() || !rwNomor.trim()) {
      Alert.alert('Perhatian', 'Nama lingkungan dan nomor RW wajib diisi!')
      return
    }
    await updateConfig({
      namaLingkungan: rwNamaLingkungan.trim(),
      rw: rwNomor.trim(),
      ketuaRw: rwKetua.trim(),
      kontakRw: rwKontak.trim(),
      rekeningRw: rwRekening.trim()
    })
    Alert.alert('Sukses', 'Data identitas RW berhasil diperbarui!')
  }

  const handleSimpanRt = async () => {
    if (!selectedRtId) return
    await updateRtData(selectedRtId, {
      ketua: rtKetua.trim(),
      bendahara: rtBendahara.trim(),
      kontak: rtKontak.trim(),
      rekening: rtRekening.trim(),
      lokasi: rtLokasi.trim(),
      deskripsi: rtLokasi.trim()
    })
    Alert.alert('Sukses', `Data kepengurusan ${activeRt?.name || 'RT'} berhasil disimpan!`)
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Identitas Wilayah RT & RW"
        subtitle="Profil pengurus, kontak, dan info lingkungan"
        navigation={navigation}
        variant="surface"
      />

      <View style={styles.content}>
        {/* Sub Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, lingkunganTab === 'rw' && styles.tabBtnActive]}
            onPress={() => setLingkunganTab('rw')}
            activeOpacity={0.7}
          >
            <Building2 size={16} color={lingkunganTab === 'rw' ? '#2563EB' : '#64748B'} />
            <Text style={[styles.tabBtnText, lingkunganTab === 'rw' && styles.tabBtnTextActive]}>
              Profil Rukun Warga (RW)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, lingkunganTab === 'rt' && styles.tabBtnActive]}
            onPress={() => setLingkunganTab('rt')}
            activeOpacity={0.7}
          >
            <Users size={16} color={lingkunganTab === 'rt' ? '#7C3AED' : '#64748B'} />
            <Text style={[styles.tabBtnText, lingkunganTab === 'rt' && styles.tabBtnTextActive]}>
              Profil Rukun Tetangga (RT)
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
          keyboardShouldPersistTaps="handled"
        >
          {lingkunganTab === 'rw' ? (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelBold}>Nama Lingkungan Perumahan *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={rwNamaLingkungan}
                  onChangeText={setRwNamaLingkungan}
                  placeholder="Contoh: Perumahan Alam Tirta Lestari"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelBold}>Nomor Rukun Warga (RW) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={rwNomor}
                  onChangeText={setRwNomor}
                  placeholder="Contoh: RW 01"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelBold}>Ketua RW</Text>
                <TextInput
                  style={styles.modalInput}
                  value={rwKetua}
                  onChangeText={setRwKetua}
                  placeholder="Nama lengkap Ketua RW"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelBold}>Kontak WhatsApp / Telepon RW</Text>
                <TextInput
                  style={styles.modalInput}
                  value={rwKontak}
                  onChangeText={setRwKontak}
                  keyboardType="phone-pad"
                  placeholder="081122334455"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelBold}>Rekening Resmi Kas RW</Text>
                <TextInput
                  style={styles.modalInput}
                  value={rwRekening}
                  onChangeText={setRwRekening}
                  placeholder="Bank & nomor rekening kas RW"
                />
              </View>

              <AppButton
                title="Simpan Profil RW"
                variant="primary"
                icon={<Save size={16} color="#FFFFFF" />}
                onPress={handleSimpanRw}
                style={{ marginTop: 8 }}
              />
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.inputLabelBold}>Pilih Rukun Tetangga (RT)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 4 }}>
                {rts.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.pillBtn, selectedRtId === r.id && styles.pillBtnActive, { marginRight: 8 }]}
                    onPress={() => setSelectedRtId(r.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillBtnText, selectedRtId === r.id && styles.pillBtnTextActive]}>
                      {r.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelBold}>Ketua {activeRt?.name || 'RT'}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={rtKetua}
                  onChangeText={setRtKetua}
                  placeholder="Nama Ketua RT"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelBold}>Bendahara {activeRt?.name || 'RT'}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={rtBendahara}
                  onChangeText={setRtBendahara}
                  placeholder="Nama Bendahara RT"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelBold}>Kontak Telepon / WA RT</Text>
                <TextInput
                  style={styles.modalInput}
                  value={rtKontak}
                  onChangeText={setRtKontak}
                  keyboardType="phone-pad"
                  placeholder="08123456789"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelBold}>Rekening Kas RT</Text>
                <TextInput
                  style={styles.modalInput}
                  value={rtRekening}
                  onChangeText={setRtRekening}
                  placeholder="BCA 12345678 a.n Kas RT"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelBold}>Lokasi / Pos Ronda / Alamat RT</Text>
                <TextInput
                  style={styles.modalInput}
                  value={rtLokasi}
                  onChangeText={setRtLokasi}
                  placeholder="Contoh: Balai Warga Blok B"
                />
              </View>

              <AppButton
                title={'Simpan ' + (activeRt?.name || 'RT')}
                variant="primary"
                icon={<Save size={16} color="#FFFFFF" />}
                onPress={handleSimpanRt}
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    gap: 4,
    marginBottom: 12
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.06)' },
      default: { elevation: 2 }
    })
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },
  tabBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700'
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05)' },
      default: { elevation: 1 }
    })
  },
  inputGroup: {
    gap: 4
  },
  inputLabelBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC'
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  pillBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.primary
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },
  pillBtnTextActive: {
    color: colors.primary,
    fontWeight: '800'
  }
})
