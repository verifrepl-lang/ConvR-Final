import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import JSZip from 'jszip';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ResultBanner from '@/components/ResultBanner';
import { pickFile, saveAndShare } from '@/src/utils/files';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';

const RECTANGLES: [number, number, number, number][] = [
  [53, 119, 563, 223],
  [53, 234, 403, 385],
  [53, 390, 468, 608],
  [53, 615, 410, 722],
  [418, 615, 526, 722],
];

const HUD_NAMES = ['hud_up.png', 'hud_center.png', 'hud_down.png', 'hud_menu.png', 'hud_donat_store.png'];

// Circle: center (563, 393), radius 202
const CIRCLE_X = 563 - 202; // 361
const CIRCLE_Y = 393 - 202; // 191
const CIRCLE_SIZE = 404;

export default function Hudrz2Screen() {
  const insets = useSafeAreaInsets();
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handlePickFile = async () => {
    const file = await pickFile();
    if (file) {
      setSelectedFile(file);
      setResult(null);
      await Haptics.selectionAsync();
    }
  };

  const cropToBase64 = async (uri: string, x: number, y: number, w: number, h: number): Promise<Uint8Array> => {
    const cropped = await ImageManipulator.manipulateAsync(
      uri,
      [{ crop: { originX: x, originY: y, width: w, height: h } }],
      { format: ImageManipulator.SaveFormat.PNG }
    );
    const b64 = await FileSystem.readAsStringAsync(cropped.uri, {
      encoding: 'base64',
    });
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
    return bytes;
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setResult({ success: false, message: 'Выберите PNG файл HUD' });
      return;
    }
    try {
      setProcessing(true);
      setResult(null);
      const zip = new JSZip();

      for (let i = 0; i < RECTANGLES.length; i++) {
        const [x1, y1, x2, y2] = RECTANGLES[i];
        setProgress(`Вырезаем часть ${i + 1}/${RECTANGLES.length + 1}...`);
        const bytes = await cropToBase64(selectedFile.uri, x1, y1, x2 - x1, y2 - y1);
        zip.file(HUD_NAMES[i], bytes);
      }

      // Crop circle region
      setProgress(`Вырезаем круг (${RECTANGLES.length + 1}/${RECTANGLES.length + 1})...`);
      const circleBytes = await cropToBase64(selectedFile.uri, CIRCLE_X, CIRCLE_Y, CIRCLE_SIZE, CIRCLE_SIZE);
      zip.file('hud_back.png', circleBytes);

      setProgress('Создание ZIP...');
      const zipData = await zip.generateAsync({ type: 'uint8array' });
      await saveAndShare('hud_with_circle.zip', zipData, 'application/zip');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult({ success: true, message: `HUD разрезан: ${HUD_NAMES.length} частей + круг (квадрат)` });
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResult({ success: false, message: e?.message ?? 'Ошибка обрезки' });
    } finally {
      setProcessing(false);
      setProgress('');
    }
  };

  return (
    <View style={styles.container}>
      <ProcessingOverlay visible={processing} message={progress || 'Обработка HUD...'} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#7C3AED" />
          <Text style={styles.infoText}>
            Разрезает HUD изображение на 5 частей + круговой элемент (hud_back.png). Круг вырезается как квадрат 404×404 пикс.
          </Text>
        </View>

        <View style={styles.partsGrid}>
          {[...HUD_NAMES, 'hud_back.png'].map((name, i) => (
            <View key={i} style={[styles.partBadge, i === HUD_NAMES.length && styles.partBadgeSpecial]}>
              {i === HUD_NAMES.length && <Ionicons name="radio-button-on-outline" size={12} color="#7C3AED" />}
              <Text style={[styles.partText, i === HUD_NAMES.length && styles.partTextSpecial]}>{name}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.filePicker} onPress={handlePickFile} activeOpacity={0.7}>
          <Ionicons name="folder-open-outline" size={32} color={selectedFile ? '#111' : '#CCC'} />
          <Text style={[styles.filePickerText, selectedFile && styles.filePickerTextActive]}>
            {selectedFile ? selectedFile.name : 'Нажмите для выбора HUD изображения'}
          </Text>
          {selectedFile && <Ionicons name="checkmark-circle" size={22} color="#22C55E" />}
        </TouchableOpacity>

        {result && (
          <ResultBanner
            success={result.success}
            message={result.message}
            onDismiss={() => setResult(null)}
          />
        )}

        <TouchableOpacity
          style={[styles.button, !selectedFile && styles.buttonDisabled]}
          onPress={handleConvert}
          activeOpacity={0.85}
          disabled={!selectedFile}
        >
          <Ionicons name="radio-button-on-outline" size={22} color="#fff" />
          <Text style={styles.buttonText}>Разрезать HUD с кругом</Text>
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
  partsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  partBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  partBadgeSpecial: { backgroundColor: '#EDE9FE' },
  partText: { fontSize: 12, color: '#555', fontWeight: '600' },
  partTextSpecial: { color: '#7C3AED' },
  filePicker: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: '#E5E5E5',
    borderStyle: 'dashed', padding: 28, alignItems: 'center', gap: 12, marginBottom: 16,
  },
  filePickerText: { fontSize: 15, color: '#AAA', fontWeight: '500', textAlign: 'center' },
  filePickerTextActive: { color: '#111', fontWeight: '600' },
  button: {
    backgroundColor: '#111', borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8,
  },
  buttonDisabled: { backgroundColor: '#CCC' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
