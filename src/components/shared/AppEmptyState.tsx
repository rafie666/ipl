import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  ShieldCheck,
  ReceiptText,
  SearchX,
  MessageSquareWarning,
  Inbox,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../theme';
import Button from '../ui/Button';

export type EmptyStateType = 'all_paid' | 'no_reports' | 'no_history' | 'no_search' | 'generic';

export interface AppEmptyStateProps {
  type?: EmptyStateType;
  variant?: EmptyStateType;
  icon?: React.ReactNode | React.ComponentType<any>;
  title?: string;
  description?: string;
  subtitle?: string;
  ctaText?: string;
  onPressCta?: () => void;
  ctaVariant?: 'primary' | 'secondary' | 'ghost';
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  type,
  variant,
  icon,
  title,
  description,
  subtitle,
  ctaText,
  onPressCta,
  ctaVariant,
}) => {
  const activeType = type || variant || 'generic';
  const getConfig = () => {
    switch (activeType) {
      case 'all_paid':
        return {
          icon: <ShieldCheck size={56} color={colors.primary} strokeWidth={1.8} />,
          title: 'Semua Tagihan Sudah Lunas',
          desc: 'Terima kasih sudah ikut menjaga keamanan dan kebersihan komplek.',
          cta: 'Lihat Arsip Kuitansi',
          variant: 'ghost' as const,
        };
      case 'no_reports':
        return {
          icon: <MessageSquareWarning size={56} color="#B45309" strokeWidth={1.8} />,
          title: 'Belum Ada Laporan',
          desc: 'Jika menemukan fasilitas rusak, laporkan agar segera ditangani.',
          cta: 'Buat Laporan Baru',
          variant: 'primary' as const,
        };
      case 'no_history':
        return {
          icon: <ReceiptText size={48} color={colors.borderStrong} strokeWidth={1.5} />,
          title: 'Belum Ada Riwayat',
          desc: 'Transaksi Anda akan muncul di sini.',
          cta: undefined,
          variant: 'ghost' as const,
        };
      case 'no_search':
        return {
          icon: <SearchX size={48} color={colors.borderStrong} strokeWidth={1.5} />,
          title: 'Tidak Ditemukan',
          desc: 'Coba kata kunci lain.',
          cta: 'Hapus Filter',
          variant: 'ghost' as const,
        };
      case 'generic':
      default:
        return {
          icon: <Inbox size={48} color={colors.borderStrong} strokeWidth={1.5} />,
          title: 'Belum Ada Data',
          desc: 'Data akan ditampilkan di sini setelah tersedia.',
          cta: undefined,
          variant: 'ghost' as const,
        };
    }
  };

  const config = getConfig();
  const displayTitle = title || config.title;
  const displayDesc = description || subtitle || config.desc;
  const displayCta = ctaText !== undefined ? ctaText : config.cta;
  const displayVariant = ctaVariant || config.variant;

  const renderIcon = () => {
    if (!icon) return config.icon;
    if (React.isValidElement(icon)) return icon;
    if (
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))
    ) {
      const IconComponent = icon as React.ComponentType<any>;
      return <IconComponent size={48} color={colors.borderStrong} strokeWidth={1.5} />;
    }
    return config.icon;
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>{renderIcon()}</View>
      <Text style={styles.titleText}>{displayTitle}</Text>
      <Text style={styles.descText} numberOfLines={2}>
        {displayDesc}
      </Text>
      {displayCta && onPressCta ? (
        <View style={styles.ctaWrapper}>
          <Button
            title={displayCta}
            variant={displayVariant}
            onPress={onPressCta}
            fullWidth={false}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  iconBox: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary, // #0F172A
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 8,
  },
  descText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary, // #475569
    textAlign: 'center',
    maxWidth: 320,
  },
  ctaWrapper: {
    marginTop: 24,
  },
});

export default AppEmptyState;
