import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ResultBanner from '@/components/ResultBanner';
import { encryptDff } from '@/src/converters/moddff';
import { pickFile, readFileBinary, saveAndShare } from '@/src/utils/files';
import * as Haptics from 'expo-haptics';

export default function DffModScreen() {
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
      setResult({ success: false, message: 'Выберите файл' });
      return;
    }
    try {
      setProcessing(true);
      setResult(null);
      const data = await readFileBinary(selectedFile.uri);
      const encrypted = encryptDff(data);
      const outName = selectedFile.name.replace(/\.dff$/i, '') + '.mod';
      await saveAndShare(outName, encrypted, 'application/octet-stream');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult({ success: true, message: `${outName} готов!` });
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResult({ success: false, message: e?.message ?? 'Ошибка' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ProcessingOverlay visible={processing} message="Шифрование DFF..." />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#7C3AED" />
          <Text style={styles.infoText}>
            Конвертирует .dff (RenderWare) файл в зашифрованный .mod с помощью TEA-шифра.
          </Text>
        </View>

        <TouchableOpacity style={styles.filePicker} onPress={handlePickFile} activeOpacity={0.7}>
          <Ionicons name="folder-open-outline" size={32} color={selectedFile ? '#111' : '#CCC'} />
          <Text style={[styles.filePickerText, selectedFile && styles.filePickerTextActive]}>
            {selectedFile ? selectedFile.name : 'Нажмите для выбора .dff файла'}
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
          <Ionicons name="arrow-back-circle-outline" size={22} color="#fff" />
          <Text style={styles.buttonText}>Конвертировать DFF → MOD</Text>
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
