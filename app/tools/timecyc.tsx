import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ColorInput from '@/components/ColorInput';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ResultBanner from '@/components/ResultBanner';
import { generateTimecyc } from '@/src/converters/templates';
import { saveAndShare, textToUint8Array } from '@/src/utils/files';
import * as Haptics from 'expo-haptics';

export default function TimecycScreen() {
  const insets = useSafeAreaInsets();
  const [topColor, setTopColor] = useState('#1a2a6c');
  const [bottomColor, setBottomColor] = useState('#4a90d9');
  const [sunColor, setSunColor] = useState('#ffd700');
  const [cloudColor, setCloudColor] = useState('#c0c0c0');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleGenerate = async () => {
    try {
      setProcessing(true);
      setResult(null);
      const content = generateTimecyc(topColor, bottomColor, sunColor, cloudColor);
      await saveAndShare('timecyc.json', content, 'application/json');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult({ success: true, message: 'timecyc.json сгенерирован и готов к сохранению!' });
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResult({ success: false, message: e?.message ?? 'Ошибка генерации' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ProcessingOverlay visible={processing} message="Генерация timecyc.json..." />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
          <Text style={styles.infoText}>
            Введите 4 hex-цвета для генерации timecyc.json — файл настройки неба GTA SA Mobile
          </Text>
        </View>

        <Text style={styles.section}>Цвета неба</Text>
        <ColorInput label="Верх неба (top)" value={topColor} onChange={setTopColor} placeholder="1A2A6C" />
        <ColorInput label="Низ неба / горизонт" value={bottomColor} onChange={setBottomColor} placeholder="4A90D9" />

        <Text style={styles.section}>Солнце и облака</Text>
        <ColorInput label="Цвет солнца" value={sunColor} onChange={setSunColor} placeholder="FFD700" />
        <ColorInput label="Цвет облаков" value={cloudColor} onChange={setCloudColor} placeholder="C0C0C0" />

        <View style={styles.previewRow}>
          {[topColor, bottomColor, sunColor, cloudColor].map((c, i) => (
            <View key={i} style={[styles.colorChip, { backgroundColor: c }]} />
          ))}
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
          <Text style={styles.buttonText}>Создать timecyc.json</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  content: { padding: 16, paddingTop: 20 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EFF6FF',
    borderRadius: 14, padding: 14, marginBottom: 20, gap: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 20 },
  section: { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  previewRow: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 8 },
  colorChip: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  button: {
    backgroundColor: '#111', borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
