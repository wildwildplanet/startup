import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DebugPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Page</Text>
      <Text style={styles.subtitle}>If you see this, basic rendering is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
