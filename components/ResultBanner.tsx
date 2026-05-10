import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ResultBannerProps {
  success: boolean;
  message: string;
  onDismiss?: () => void;
}

export default function ResultBanner({ success, message, onDismiss }: ResultBannerProps) {
  return (
    <View style={[styles.banner, success ? styles.success : styles.error]}>
      <Ionicons
        name={success ? 'checkmark-circle' : 'close-circle'}
        size={22}
        color={success ? '#16A34A' : '#DC2626'}
        style={styles.icon}
      />
      <Text style={[styles.text, success ? styles.successText : styles.errorText]}>
        {message}
      </Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color={success ? '#16A34A' : '#DC2626'} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  success: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  error: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  successText: {
    color: '#15803D',
  },
  errorText: {
    color: '#B91C1C',
  },
});
