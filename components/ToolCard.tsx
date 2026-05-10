import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ToolCardProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}

export default function ToolCard({ title, description, icon, onPress }: ToolCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        <Ionicons name={icon as any} size={26} color="#111" />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#BBB" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textBox: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  desc: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
});
