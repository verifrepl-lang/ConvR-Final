import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ResultBanner from '@/components/ResultBanner';
import { SKIN_FILES, SKIN_NAMES, SKIN_ASSETS } from '@/src/data/skinMap';
import { readAssetBinary, saveAndShare } from '@/src/utils/files';
import * as Haptics from 'expo-haptics';

export default function SkinScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const skinNumbers = Array.from({ length: 50 }, (_, i) => i + 1);

  const handleGet = async () => {
    if (!selected) {
      setResult({ success: false, message: 'Выберите скин' });
      return;
    }
    try {
      setProcessing(true);
      setResult(null);
      const moduleId = SKIN_ASSETS[selected];
      const data = await readAssetBinary(moduleId);
      const filename = SKIN_FILES[selected];
      await saveAndShare(filename, data, 'application/zip');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult({ success: true, message: `Скин "${SKIN_NAMES[selected]}" готов!` });
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResult({ success: false, message: e?.message ?? 'Ошибка' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ProcessingOverlay visible={processing} message="Загрузка скина..." />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="person-outline" size={20} color="#059669" />
          <Text style={styles.infoText}>
            Выберите скин (1–50) для GTA SA Mobile. ZIP-архив будет сохранён для дальнейшего использования.
          </Text>
        </View>

        {selected && (
          <View style={styles.selectedBanner}>
            <Text style={styles.selectedText}>
              Выбран #{selected} — {SKIN_NAMES[selected]}
            </Text>
          </View>
        )}

        <Text style={styles.section}>Выберите скин</Text>

        <View style={styles.grid}>
          {skinNumbers.map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.skinBtn, selected === num && styles.skinBtnActive]}
              onPress={() => { setSelected(num); setResult(null); Haptics.selectionAsync(); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.skinNum, selected === num && styles.skinNumActive]}>{num}</Text>
              <Text style={[styles.skinName, selected === num && styles.skinNameActive]} numberOfLines={1}>
                {SKIN_NAMES[num]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {result && (
          <ResultBanner
            success={result.success}
            message={result.message}
            onDismiss={() => setResult(null)}
          />
        )}

        <TouchableOpacity
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={handleGet}
          activeOpacity={0.85}
          disabled={!selected}
        >
          <Ionicons name="archive-outline" size={22} color="#fff" />
          <Text style={styles.buttonText}>
            {selected ? `Получить скин #${selected}` : 'Выберите скин'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  content: { padding: 16, paddingTop: 20 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#ECFDF5',
    borderRadius: 14, padding: 14, marginBottom: 20, gap: 10,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  infoText: { flex: 1, fontSize: 13, color: '#065F46', lineHeight: 20 },
  selectedBanner: {
    backgroundColor: '#111', borderRadius: 12, padding: 14, marginBottom: 16,
  },
  selectedText: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  section: { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8,
  },
  skinBtn: {
    width: '30%', backgroundColor: '#fff', borderRadius: 12, padding: 10,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E5E5',
  },
  skinBtnActive: {
    backgroundColor: '#111', borderColor: '#111',
  },
  skinNum: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 2 },
  skinNumActive: { color: '#fff' },
  skinName: { fontSize: 10, color: '#888', textAlign: 'center' },
  skinNameActive: { color: 'rgba(255,255,255,0.8)' },
  button: {
    backgroundColor: '#111', borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16,
  },
  buttonDisabled: { backgroundColor: '#CCC' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
