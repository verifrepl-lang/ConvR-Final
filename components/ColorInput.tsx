import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  placeholder?: string;
}

function isValidHex(hex: string): boolean {
  return /^[0-9a-fA-F]{6}$/.test(hex);
}

export default function ColorInput({ label, value, onChange, placeholder = 'FF0000' }: ColorInputProps) {
  const [raw, setRaw] = useState(value.replace(/^#/, ''));

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9a-fA-F]/g, '').substring(0, 6).toUpperCase();
    setRaw(cleaned);
    if (cleaned.length === 6) {
      onChange('#' + cleaned);
    }
  };

  const previewColor = isValidHex(raw) ? '#' + raw : '#888888';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <View style={[styles.preview, { backgroundColor: previewColor }]} />
        <Text style={styles.hash}>#</Text>
        <TextInput
          style={styles.input}
          value={raw}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor="#888"
          maxLength={6}
          autoCapitalize="characters"
          keyboardType="default"
        />
        {isValidHex(raw) && (
          <Ionicons name="checkmark-circle" size={20} color="#22C55E" style={styles.icon} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
  preview: {
    width: 28,
    height: 28,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  hash: {
    fontSize: 16,
    color: '#333',
    fontWeight: '700',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#111',
    fontWeight: '600',
    letterSpacing: 2,
    padding: 0,
  },
  icon: {
    marginLeft: 8,
  },
});
