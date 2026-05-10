import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES } from '@/src/data/categories';
import ToolCard from '@/components/ToolCard';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const category = CATEGORIES.find((c) => c.id === id);

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Категория не найдена</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <Text style={styles.categoryDesc}>{category.description}</Text>
        </View>

        <Text style={styles.sectionLabel}>Доступные инструменты</Text>

        {category.tools.map((tool) => (
          <ToolCard
            key={tool.id}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            onPress={() => router.push(`/tools/${tool.id}` as any)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  content: {
    padding: 16,
    paddingTop: 20,
  },
  categoryHeader: {
    backgroundColor: '#111',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  error: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
});
