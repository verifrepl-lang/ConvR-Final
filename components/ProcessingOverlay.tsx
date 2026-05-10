import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';

interface ProcessingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function ProcessingOverlay({
  visible,
  message = 'Обработка...',
}: ProcessingOverlayProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#111" style={styles.spinner} />
          <Text style={styles.text}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    minWidth: 200,
  },
  spinner: {
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
});
