import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const OUTPUT_DIR = (FileSystem.documentDirectory ?? 'file:///') + 'ConvR/';

export async function ensureOutputDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(OUTPUT_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(OUTPUT_DIR, { intermediates: true });
  }
}

export async function saveAndShare(
  filename: string,
  data: Uint8Array | string,
  mimeType = 'application/octet-stream'
): Promise<string> {
  await ensureOutputDir();
  const uri = OUTPUT_DIR + filename;

  if (typeof data === 'string') {
    await FileSystem.writeAsStringAsync(uri, data, { encoding: 'utf8' });
  } else {
    const base64 = uint8ArrayToBase64(data);
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: 'base64' });
  }

  if (Platform.OS !== 'web') {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, { mimeType, dialogTitle: `Сохранить ${filename}` });
    }
  }

  return uri;
}

export async function pickFile(
  extensions?: string[]
): Promise<{ uri: string; name: string } | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: extensions ? extensions.map(ext => `*/${ext}`) : '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return null;
    const asset = result.assets[0];
    return { uri: asset.uri, name: asset.name ?? 'file' };
  } catch {
    return null;
  }
}

export async function readFileBinary(uri: string): Promise<Uint8Array> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64',
  });
  return base64ToUint8Array(base64);
}

export async function readAssetBinary(moduleId: number): Promise<Uint8Array> {
  const { Asset } = await import('expo-asset');
  const asset = Asset.fromModule(moduleId);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }
  const uri = asset.localUri!;
  return readFileBinary(uri);
}

export function uint8ArrayToBase64(data: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function textToUint8Array(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export async function getListInOutputDir(): Promise<string[]> {
  await ensureOutputDir();
  try {
    return await FileSystem.readDirectoryAsync(OUTPUT_DIR);
  } catch {
    return [];
  }
}
