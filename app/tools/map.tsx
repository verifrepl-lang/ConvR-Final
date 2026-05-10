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

const GRID = 14; // 14x14 = 196 tiles

export default function MapScreen() {
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

  const handleConvert = async () => {
    if (!selectedFile) {
      setResult({ success: false, message: 'Выберите PNG файл карты' });
      return;
    }
    try {
      setProcessing(true);
      setResult(null);

      // Get image dimensions
      const info = await ImageManipulator.manipulateAsync(selectedFile.uri, [], {
        format: ImageManipulator.SaveFormat.PNG,
      });
      const { width: imgW, height: imgH } = info;

      // Resize to be divisible by 14
      const tileW = Math.floor(imgW / GRID);
      const tileH = Math.floor(imgH / GRID);

      const zip = new JSZip();
      let tileIndex = 0;

      for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
          setProgress(`Тайл ${tileIndex + 1}/${GRID * GRID} (${row},${col})...`);

          const cropped = await ImageManipulator.manipulateAsync(
            selectedFile.uri,
            [{
              crop: {
                originX: col * tileW,
                originY: row * tileH,
                width: tileW,
                height: tileH,
              }
            }],
            { format: ImageManipulator.SaveFormat.PNG }
          );

          const b64 = await FileSystem.readAsStringAsync(cropped.uri, {
            encoding: 'base64',
          });

          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);

          // Naming convention: radar00.png to radar195.png
          const tileName = `radar${String(tileIndex).padStart(2, '0')}.png`;
          zip.file(tileName, bytes);
          tileIndex++;
        }
      }

      setProgress('Создание ZIP...');
      const zipData = await zip.generateAsync({ type: 'uint8array' });
      await saveAndShare('map_tiles.zip', zipData, 'application/zip');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult({
        success: true,
        message: `Карта разрезана на ${GRID * GRID} тайлов (${tileW}×${tileH} px каждый)!`,
      });
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResult({ success: false, message: e?.message ?? 'Ошибка нарезки карты' });
    } finally {
      setProcessing(false);
      setProgress('');
    }
  };

  return (
    <View style={styles.container}>
      <ProcessingOverlay visible={processing} message={progress || 'Нарезка карты...'} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="grid-outline" size={20} color="#059669" />
          <Text style={styles.infoText}>
            Разрезает PNG карту на сетку 14×14 = 196 тайлов (radar00.png — radar195.png). Размер тайлов вычисляется автоматически.
          </Text>
        </View>

        <View style={styles.gridPreview}>
          {Array.from({ length: 49 }).map((_, i) => (
            <View key={i} style={styles.gridCell} />
          ))}
        </View>
        <Text style={styles.gridLabel}>Схема нарезки 14×14 (показано 7×7)</Text>

        <TouchableOpacity style={styles.filePicker} onPress={handlePickFile} activeOpacity={0.7}>
          <Ionicons name="folder-open-outline" size={32} color={selectedFile ? '#111' : '#CCC'} />
          <Text style={[styles.filePickerText, selectedFile && styles.filePickerTextActive]}>
            {selectedFile ? selectedFile.name : 'Нажмите для выбора PNG карты'}
          </Text>
          {selectedFile && <Ionicons name="checkmark-circle" size={22} color="#22C55E" />}
        </TouchableOpacity>

        <View style={styles.noteCard}>
          <Ionicons name="time-outline" size={16} color="#888" />
          <Text style={styles.noteText}>
            Обработка 196 тайлов может занять 1–2 минуты. Не закрывайте приложение.
          </Text>
        </View>

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
          <Ionicons name="grid-outline" size={22} color="#fff" />
          <Text style={styles.buttonText}>Разрезать карту</Text>
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
  gridPreview: {
    flexDirection: 'row', flexWrap: 'wrap', width: 112, gap: 2,
    marginBottom: 4, alignSelf: 'center',
  },
  gridCell: { width: 14, height: 14, backgroundColor: '#E5E5E5', borderRadius: 2 },
  gridLabel: { fontSize: 11, color: '#999', textAlign: 'center', marginBottom: 20 },
  filePicker: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: '#E5E5E5',
    borderStyle: 'dashed', padding: 28, alignItems: 'center', gap: 12, marginBottom: 12,
  },
  filePickerText: { fontSize: 15, color: '#AAA', fontWeight: '500', textAlign: 'center' },
  filePickerTextActive: { color: '#111', fontWeight: '600' },
  noteCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 8,
  },
  noteText: { flex: 1, fontSize: 12, color: '#777', lineHeight: 18 },
  button: {
    backgroundColor: '#111', borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8,
  },
  buttonDisabled: { backgroundColor: '#CCC' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
