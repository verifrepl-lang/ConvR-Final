import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '@/src/data/categories';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoTriangle} />
          <Text style={styles.title}>ConvR</Text>
        </View>
        <Text style={styles.subtitle}>GTA SA Mobile Toolkit</Text>
      </View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/cat', params: { id: item.id } })}
          >
            <View style={styles.cardIcon}>
              <Ionicons name={item.icon as any} size={26} color="#111" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.tools.length}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionLabel}>Инструменты</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  logoTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 19,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#111',
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginLeft: 32,
    fontWeight: '500',
  },
  list: {
    padding: 16,
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  badge: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
