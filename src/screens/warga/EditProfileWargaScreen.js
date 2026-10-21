import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native'
import {
  ArrowLeft,
  User,
  Home,
  Phone,
  CreditCard,
  FileText,
  Save,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react-native'
import { colors, spacing, radius, shadows, typography } from '../../utils/theme'
import { useApp } from '../../context/AppContext'

export default function EditProfileWargaScreen({ navigation }) {
  const { currentWarga, currentUser, updateWarga, updateCurrentUser, currentRT, currentRW } = useApp()

  const [wargaNama, setWargaNama] = useState(currentWarga?.nama || currentUser?.name || '')
  const [wargaNik, setWargaNik] = useState(currentWarga?.nik || '')
  const [wargaNoKk, setWargaNoKk] = useState(currentWarga?.noKk || '')
  const [wargaNoHp, setWargaNoHp] = useState(currentWarga?.noHp || '')
  const [wargaBlok, setWargaBlok] = useState(currentWarga?.blok || 'A')
  const [wargaNoRumah, setWargaNoRumah] = useState(currentWarga?.noRumah || '01')
  const [savingWarga, setSavingWarga] = useState(false)

  const handleSimpanWarga = async () => {
    if (!wargaNama.trim()) {
      Alert.alert('Perhatian', 'Nama lengkap warga wajib diisi!')
      return
    }

    setSavingWarga(true)
    try {
      const payload = {
        nama: wargaNama.trim(),
        nik: wargaNik.trim(),
        noKk: wargaNoKk.trim(),
        noHp: wargaNoHp.trim(),
        blok: wargaBlok.trim().toUpperCase(),
        noRumah: wargaNoRumah.trim()
      }

      if (currentWarga?.id) {
        await updateWarga(currentWarga.id, payload)
      }
      await updateCurrentUser({ name: wargaNama.trim() })

      Alert.alert('Sukses', 'Data profil Anda berhasil diperbarui!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (e) {
      Alert.alert('Error', 'Gagal memperbarui profil: ' + e.message)
    } finally {
      setSavingWarga(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color={colors.textDark} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Edit Profil Warga</Text>
          <Text style={styles.headerSubtitle}>Perbarui data diri dan unit rumah Anda</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Unit Info Badge */}
        <View style={styles.unitCard}>
          <View style={styles.unitAvatar}>
            <Home size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.unitTitle}>
              Unit Blok {wargaBlok || '-'}/{wargaNoRumah || '-'}
            </Text>
            <Text style={styles.unitSubtitle}>
              {currentRT?.name || 'RT 001'} • {currentRW?.name || 'RW 005'}
            </Text>
          </View>
          <View style={styles.activeTag}>
            <CheckCircle2 size={12} color="#166534" />
            <Text style={styles.activeTagText}>Warga Tetap</Text>
          </View>
        </View>

        {/* Form Data Diri */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <User size={18} color={colors.primary} />
            <Text style={styles.cardHeaderTitle}>Identitas Penghuni</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabelBold}>Nama Lengkap *</Text>
            <TextInput
              style={styles.input}
              value={wargaNama}
              onChangeText={setWargaNama}
              placeholder="Nama lengkap sesuai KTP"
              placeholderTextColor={colors.gray400}
            />

            <View style={styles.formRowTwo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabelBold}>Blok Rumah</Text>
                <TextInput
                  style={styles.input}
                  value={wargaBlok}
                  onChangeText={setWargaBlok}
                  autoCapitalize="characters"
                  placeholder="Contoh: A"
                  placeholderTextColor={colors.gray400}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabelBold}>Nomor Rumah</Text>
                <TextInput
                  style={styles.input}
                  value={wargaNoRumah}
                  onChangeText={setWargaNoRumah}
                  placeholder="Contoh: 01"
                  placeholderTextColor={colors.gray400}
                />
              </View>
            </View>

            <Text style={styles.inputLabelBold}>Nomor WhatsApp / HP</Text>
            <TextInput
              style={styles.input}
              value={wargaNoHp}
              onChangeText={setWargaNoHp}
              keyboardType="phone-pad"
              placeholder="08123456789"
              placeholderTextColor={colors.gray400}
            />

            <Text style={styles.inputLabelBold}>NIK (Nomor Induk Kependudukan)</Text>
            <TextInput
              style={styles.input}
              value={wargaNik}
              onChangeText={setWargaNik}
              keyboardType="numeric"
              placeholder="3201xxxxxxxxxxxx"
              placeholderTextColor={colors.gray400}
            />

            <Text style={styles.inputLabelBold}>Nomor Kartu Keluarga (KK)</Text>
            <TextInput
              style={styles.input}
              value={wargaNoKk}
              onChangeText={setWargaNoKk}
              keyboardType="numeric"
              placeholder="3201xxxxxxxxxxxx"
              placeholderTextColor={colors.gray400}
            />
          </View>
        </View>

        {/* Security / Privacy notice */}
        <View style={styles.privacyCard}>
          <ShieldAlert size={16} color={colors.gray600} />
          <Text style={styles.privacyText}>
            Data identitas NIK & KK tersimpan terenkripsi dan hanya dapat diakses oleh Pengurus RT/RW yang berwenang untuk administrasi kependudukan.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, savingWarga && { opacity: 0.7 }]}
          onPress={handleSimpanWarga}
          disabled={savingWarga}
        >
          {savingWarga ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Save size={18} color="#ffffff" />
          )}
          <Text style={styles.saveButtonText}>
            {savingWarga ? 'Menyimpan Perubahan...' : 'Simpan Profil'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 48,
    paddingBottom: spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    ...shadows.sm
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
    marginRight: spacing.sm
  },
  headerTextWrap: {
    flex: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: typography.bold,
    color: colors.textDark
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 2
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: 16
  },
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    ...shadows.sm,
    gap: 12
  },
  unitAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  unitTitle: {
    fontSize: 15,
    fontWeight: typography.bold,
    color: colors.textDark
  },
  unitSubtitle: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 2
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: typography.semibold,
    color: '#166534'
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    ...shadows.sm
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: typography.bold,
    color: colors.textDark
  },
  formGroup: {
    gap: 12
  },
  formRowTwo: {
    flexDirection: 'row',
    gap: 12
  },
  inputLabelBold: {
    fontSize: 13,
    fontWeight: typography.bold,
    color: colors.textDark
  },
  input: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textDark
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: colors.gray600,
    lineHeight: 18
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: 8,
    ...shadows.sm
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: typography.bold,
    color: '#ffffff'
  }
})
