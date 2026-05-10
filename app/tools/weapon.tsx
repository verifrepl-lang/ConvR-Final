import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ResultBanner from '@/components/ResultBanner';
import { generateWeapon } from '@/src/converters/templates';
import { saveAndShare } from '@/src/utils/files';
import * as Haptics from 'expo-haptics';

export default function WeaponScreen() {
  const insets = useSafeAreaInsets();
  const [pt, setPt] = useState('');
  const [razb, setRazb] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleGenerate = async () => {
    if (!pt.trim() || !razb.trim()) {
      setResult({ success: false, message: 'Заполните оба поля' });
      return;
    }
    try {
      setProcessing(true);
      setResult(null);
      const content = generateWeapon(pt.trim(), razb.trim());
      await saveAndShare('weapon.dat', content, 'application/octet-stream');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult({ success: true, message: 'weapon.dat создан!' });
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResult({ success: false, message: e?.message ?? 'Ошибка' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ProcessingOverlay visible={processing} message="Генерация weapon.dat..." />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#D97706" />
          <Text style={styles.infoText}>
            Введите параметры оружия для генерации weapon.dat. PT — штраф за выстрел, Разброс — точность.
          </Text>
        </View>

        <Text style={styles.section}>Параметры оружия</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ПТ (Penalty Time, float)</Text>
          <TextInput
            style={styles.input}
            value={pt}
            onChangeText={setPt}
            placeholder="например: 0.5"
            placeholderTextColor="#AAA"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Разброс (int)</Text>
          <TextInput
            style={styles.input}
            value={razb}
            onChangeText={setRazb}
            placeholder="например: 50"
            placeholderTextColor="#AAA"
            keyboardType="number-pad"
          />
        </View>

        {result && (
          <ResultBanner
            success={result.success}
            message={result.message}
            onDismiss={() => setResult(null)}
          />
        )}

        <TouchableOpacity style={styles.button} onPress={handleGenerate} activeOpacity={0.85}>
          <Ionicons name="cloud-download-outline" size={22} color="#fff" />
          <Text style={styles.buttonText}>Создать weapon.dat</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  content: { padding: 16, paddingTop: 20 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFBEB',
    borderRadius: 14, padding: 14, marginBottom: 20, gap: 10,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  infoText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 20 },
  section: { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 17, color: '#111', fontWeight: '600',
    borderWidth: 1.5, borderColor: '#E5E5E5',
  },
  button: {
    backgroundColor: '#111', borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
