import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import JSZip from 'jszip';
import ColorInput from '@/components/ColorInput';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ResultBanner from '@/components/ResultBanner';
import { HP_ASSETS } from '@/src/data/skinMap';
import { readAssetBinary, saveAndShare, uint8ArrayToBase64 } from '@/src/utils/files';
import { recolorPng } from '@/src/converters/pngutil';
import * as Haptics from 'expo-haptics';

const HP_FILES = [
  'hud_armor_scale.png',
  'hud_health_scale.png',
  'hud_heart.png',
  'hud_ruble.png',
  'hud_armor.png',
];

export default function HpScreen() {
  const insets = useSafeAreaInsets();
  const [color, setColor] = useState('#ff0000');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [progress, setProgress] = useState('');

  const handleGenerate = async () => {
    try {
      setProcessing(true);
      setResult(null);

      const zip = new JSZip();

      for (const filename of HP_FILES) {
        setProgress(`Обработка ${filename}...`);
        const moduleId = HP_ASSETS[filename];
        const originalData = await readAssetBinary(moduleId);
        const recolored = recolorPng(originalData, color);
        zip.file(filename, recolored);
      }

      setProgress('Создание ZIP...');
      const zipData = await zip.generateAsync({ type: 'uint8array' });
      await saveAndShare('hp_icons.zip', zipData, 'application/zip');

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult({ success: true, message: 'hp_icons.zip с 5 перекрашенными иконками готов!' });
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResult({ success: false, message: e?.message ?? 'Ошибка перекраски' });
    } finally {
      setProcessing(false);
      setProgress('');
    }
  };

  return (
    <View style={styles.container}>
      <ProcessingOverlay visible={processing} message={progress || 'Перекраска иконок...'} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoCard}>
          <Ionicons name="heart-outline" size={20} color="#DC2626" />
          <Text style={styles.infoText}>
            Выберите цвет для перекраски 5 HP иконок. Иконки: шкала брони, шкала HP, сердце, рубль, броня. Результат — ZIP с перекрашенными PNG.
          </Text>
        </View>

        <View style={styles.iconRow}>
          {HP_FILES.map((f, i) => (
            <View key={i} style={[styles.iconPlaceholder, { backgroundColor: color }]}>
              <Text style={styles.iconLabel}>{['A', 'H', '♥', '₽', '🛡'][i]}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Цвет иконок</Text>
        <ColorInput label="Цвет покраски" value={color} onChange={setColor} placeholder="FF0000" />

        {result && (
          <ResultBanner
            success={result.success}
            message={result.message}
            onDismiss={() => setResult(null)}
          />
        )}

        <TouchableOpacity style={styles.button} onPress={handleGenerate} activeOpacity={0.85}>
          <Ionicons name="color-filter-outline" size={22} color="#fff" />
          <Text style={styles.buttonText}>Перекрасить иконки</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  content: { padding: 16, paddingTop: 20 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FEF2F2',
    borderRadius: 14, padding: 14, marginBottom: 20, gap: 10,
    borderWidth: 1, borderColor: '#FECACA',
  },
  infoText: { flex: 1, fontSize: 13, color: '#991B1B', lineHeight: 20 },
  iconRow: { flexDirection: 'row', gap: 8, marginBottom: 20, justifyContent: 'center' },
  iconPlaceholder: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  iconLabel: { fontSize: 20, color: '#fff' },
  section: { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  button: {
    backgroundColor: '#111', borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
