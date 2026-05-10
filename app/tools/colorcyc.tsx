import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ColorInput from '@/components/ColorInput';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ResultBanner from '@/components/ResultBanner';
import { generateColorcyc } from '@/src/converters/templates';
import { saveAndShare } from '@/src/utils/files';
import * as Haptics from 'expo-haptics';

export default function ColorcycScreen() {
  const insets = useSafeAreaInsets();
  const [color, setColor] = useState('#1a5276');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleGenerate = async () => {
    try {
      setProcessing(true);
      setResult(null);
      const content = generateColorcyc(color);
      await saveAndShare('colorcycle.dat', content, 'application/octet-stream');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult({ success: true, message: 'colorcycle.dat сгенерирован!' });
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResult({ success: false, message: e?.message ?? 'Ошибка' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ProcessingOverlay visible={processing} message="Генерация colorcycle.dat..." />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#7C3AED" />
          <Text style={styles.infoText}>
            Выберите 1 цвет для генерации colorcycle.dat — файл настройки цвета вида GTA SA Mobile
          </Text>
        </View>

        <Text style={styles.section}>Цвет вида</Text>
        <ColorInput label="Основной цвет" value={color} onChange={setColor} placeholder="1A5276" />

        <View style={[styles.bigPreview, { backgroundColor: color }]}>
          <Text style={styles.previewText}>Предпросмотр цвета</Text>
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
          <Text style={styles.buttonText}>Создать colorcycle.dat</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  content: { padding: 16, paddingTop: 20 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F5F3FF',
    borderRadius: 14, padding: 14, marginBottom: 20, gap: 10,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  infoText: { flex: 1, fontSize: 13, color: '#5B21B6', lineHeight: 20 },
  section: { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  bigPreview: { height: 100, borderRadius: 16, marginVertical: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  previewText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  button: {
    backgroundColor: '#111', borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
