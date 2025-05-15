import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { supabase } from '../lib/supabase/supabaseClient';

export default function TestPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Test connection
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase.from('startups').select('id').limit(1);
      
      if (error) {
        setError(`Error connecting to Supabase: ${error.message}`);
        console.error('Connection error:', error);
        return;
      }
      
      setResults(prev => [...prev, {
        name: 'Connection Test',
        status: 'success',
        message: 'Successfully connected to Supabase',
        data
      }]);

      // Test startups table
      const { data: startups, error: startupsError } = await supabase
        .from('startups')
        .select('*')
        .limit(3);
      
      if (startupsError) {
        setResults(prev => [...prev, {
          name: 'Startups Table',
          status: 'error',
          message: `Error: ${startupsError.message}`
        }]);
      } else {
        setResults(prev => [...prev, {
          name: 'Startups Table',
          status: 'success',
          message: `Read ${startups?.length || 0} startups`,
          data: startups
        }]);
      }
    } catch (e: any) {
      setError(`Unexpected error: ${e?.message || String(e)}`);
      console.error('Test error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Run test on mount
  useEffect(() => {
    runTest();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>
      
      <Button 
        mode="contained" 
        onPress={runTest} 
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Test Connection
      </Button>

      {error && (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      )}

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Card key={index} style={styles.resultCard}>
            <Card.Content>
              <View style={styles.resultHeader}>
                <Text style={styles.resultName}>{result.name}</Text>
                <Text style={{
                  fontWeight: 'bold',
                  color: result.status === 'success' ? '#06D6A0' : '#FF6B6B'
                }}>
                  {result.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.resultMessage}>{result.message}</Text>
              {result.data && (
                <Text style={styles.resultData}>
                  {JSON.stringify(result.data, null, 2)}
                </Text>
              )}
            </Card.Content>
          </Card>
        ))}

        {results.length === 0 && !loading && !error && (
          <Card style={styles.messageCard}>
            <Card.Content>
              <Text style={styles.messageText}>Running tests...</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1C1B1F',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    marginBottom: 20,
  },
  resultsContainer: {
    flex: 1,
  },
  resultCard: {
    marginBottom: 12,
    backgroundColor: '#2B2930',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultMessage: {
    color: '#CCCCCC',
    marginBottom: 8,
  },
  resultData: {
    backgroundColor: '#0F1729',
    padding: 8,
    borderRadius: 4,
    color: '#CCCCCC',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  errorCard: {
    backgroundColor: '#2B2930',
    marginBottom: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
  },
  messageCard: {
    backgroundColor: '#2B2930',
    marginBottom: 20,
  },
  messageText: {
    color: '#CCCCCC',
    textAlign: 'center',
  }
}); 