import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import JSZip from 'jszip';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ResultBanner from '@/components/ResultBanner';
import { btxToKtx, detectBtxFile } from '@/src/converters/btxpng';
import { pickFile, readFileBinary, saveAndShare } from '@/src/utils/files';
import * as Haptics from 'expo-haptics';

export default function BtxPngScreen() {
  const insets = useSafeAreaInsets();
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string } | null>(null);
  const [processing, setProcessing] = useState(false);
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
      setResult({ success: false, message: 'Выберите ZIP файл' });
      return;
    }
    try {
      setProcessing(true);
      setResult(null);

      const rawData = await readFileBinary(selectedFile.uri);
      const inputZip = await JSZip.loadAsync(rawData);
      const outputZip = new JSZip();
      let converted = 0;

      for (const [name, zipEntry] of Object.entries(inputZip.files)) {
        if (zipEntry.dir) continue;
        const fileData = await zipEntry.async('uint8array');
        const type = detectBtxFile(fileData);

        if (type === 'btx' || name.toLowerCase().endsWith('.btx')) {
          const ktxData = btxToKtx(fileData);
          const outName = name.replace(/\.btx$/i, '.ktx');
          outputZip.file(outName, ktxData);
          converted++;
        } else {
          outputZip.file(name, fileData);
        }
      }

      if (converted === 0) {
        throw new Error('Не найдено BTX файлов в ZIP архиве');
      }

      const zipData = await outputZip.generateAsync({ type: 'uint8array' });
      const outName = selectedFile.name.replace(/\.zip$/i, '') + '_ktx.zip';
      await saveAndShare(outName, zipData, 'application/zip');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult({
        success: true,
        message: `Конвертировано ${converted} BTX → KTX файлов. Примечание: для декодирования ASTC в PNG используйте ПК-инструмент.`,
      });
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResult({ success: false, message: e?.message ?? 'Ошибка конвертации' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ProcessingOverlay visible={processing} message="Конвертация BTX → KTX..." />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={20} color="#D97706" />
          <Text style={styles.warningText}>
            Ограничение: BTX содержит ASTC текстуры. На мобильном устройстве выполняется только удаление BTX-заголовка (4 байта). Для полного декодирования в PNG используйте ПК-версию (astcenc).
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="document-outline" size={20} color="#2563EB" />
          <Text style={styles.infoText}>
            Конвертирует ZIP с BTX файлами → ZIP с KTX файлами (снимает 4-байтовый BTX-заголовок).
          </Text>
        </View>

        <TouchableOpacity style={styles.filePicker} onPress={handlePickFile} activeOpacity={0.7}>
          <Ionicons name="folder-open-outline" size={32} color={selectedFile ? '#111' : '#CCC'} />
          <Text style={[styles.filePickerText, selectedFile && styles.filePickerTextActive]}>
            {selectedFile ? selectedFile.name : 'Нажмите для выбора ZIP с BTX файлами'}
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
          <Ionicons name="download-outline" size={22} color="#fff" />
          <Text style={styles.buttonText}>Конвертировать BTX → KTX</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  content: { padding: 16, paddingTop: 20 },
  warningCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFBEB',
    borderRadius: 14, padding: 14, marginBottom: 12, gap: 10,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  warningText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 20 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EFF6FF',
    borderRadius: 14, padding: 14, marginBottom: 20, gap: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 20 },
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
