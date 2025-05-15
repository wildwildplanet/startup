import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import { testConnection, fetchStartups, fetchLeaderboard } from '../../lib/supabase/supabaseClient';
import { supabase } from '../../lib/supabase/supabaseClient';

type TestResult = {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export const SupabaseTest = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    try {
      setError(null);
      setResults([]);
      setLoading(true);

      // Test 1: Basic connection
      addResult({
        name: 'Connection Test',
        status: 'pending',
        message: 'Testing connection to Supabase...',
      });

      try {
        const connectionResult = await testConnection();
        addResult({
          name: 'Connection Test',
          status: connectionResult.success ? 'success' : 'error',
          message: connectionResult.success 
            ? 'Successfully connected to Supabase' 
            : `Connection error: ${connectionResult.error ? (connectionResult.error as any).message || JSON.stringify(connectionResult.error) : 'Unknown error'}`,
          data: connectionResult.data,
        });
      } catch (error: any) {
        addResult({
          name: 'Connection Test',
          status: 'error',
          message: `Connection test exception: ${error?.message || JSON.stringify(error)}`,
        });
      }

      // Test 2: Read startups table
      addResult({
        name: 'Startups Table',
        status: 'pending',
        message: 'Testing read access to startups table...',
      });

      try {
        const { data, error } = await supabase
          .from('startups')
          .select('*')
          .limit(2);
        
        if (error) throw error;
        
        addResult({
          name: 'Startups Table',
          status: data && data.length > 0 ? 'success' : 'error',
          message: data && data.length > 0 
            ? `Successfully read ${data.length} startups` 
            : 'No startups found or access denied',
          data,
        });
      } catch (error: any) {
        addResult({
          name: 'Startups Table',
          status: 'error',
          message: `Read startups error: ${error?.message || JSON.stringify(error)}`,
        });
      }

      // Test 3: Read user_profiles table
      addResult({
        name: 'User Profiles Table',
        status: 'pending',
        message: 'Testing read access to user_profiles table...',
      });

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .limit(2);
        
        if (error) throw error;
        
        addResult({
          name: 'User Profiles Table',
          status: data && data.length > 0 ? 'success' : 'error',
          message: data && data.length > 0 
            ? `Successfully read ${data.length} user profiles` 
            : 'No user profiles found or access denied',
          data,
        });
      } catch (error: any) {
        addResult({
          name: 'User Profiles Table',
          status: 'error',
          message: `Read user profiles error: ${error?.message || JSON.stringify(error)}`,
        });
      }

      // Test 4: Read investments table
      addResult({
        name: 'Investments Table',
        status: 'pending',
        message: 'Testing read access to investments table...',
      });

      try {
        const { data, error } = await supabase
          .from('investments')
          .select('*')
          .limit(2);
        
        if (error) throw error;
        
        addResult({
          name: 'Investments Table',
          status: data && data.length > 0 ? 'success' : 'error',
          message: data && data.length > 0 
            ? `Successfully read ${data.length} investments` 
            : 'No investments found or access denied',
          data,
        });
      } catch (error: any) {
        addResult({
          name: 'Investments Table',
          status: 'error',
          message: `Read investments error: ${error?.message || JSON.stringify(error)}`,
        });
      }

      // Test 5: Read achievements table
      addResult({
        name: 'Achievements Table',
        status: 'pending',
        message: 'Testing read access to achievements table...',
      });

      try {
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .limit(2);
        
        if (error) throw error;
        
        addResult({
          name: 'Achievements Table',
          status: data && data.length > 0 ? 'success' : 'error',
          message: data && data.length > 0 
            ? `Successfully read ${data.length} achievements` 
            : 'No achievements found or access denied',
          data,
        });
      } catch (error: any) {
        addResult({
          name: 'Achievements Table',
          status: 'error',
          message: `Read achievements error: ${error?.message || JSON.stringify(error)}`,
        });
      }

      // Test 6: Read user_achievements table
      addResult({
        name: 'User Achievements Table',
        status: 'pending',
        message: 'Testing read access to user_achievements table...',
      });

      try {
        const { data, error } = await supabase
          .from('user_achievements')
          .select('*')
          .limit(2);
        
        if (error) throw error;
        
        addResult({
          name: 'User Achievements Table',
          status: data && data.length > 0 ? 'success' : 'error',
          message: data && data.length > 0 
            ? `Successfully read ${data.length} user achievements` 
            : 'No user achievements found or access denied',
          data,
        });
      } catch (error: any) {
        addResult({
          name: 'User Achievements Table',
          status: 'error',
          message: `Read user achievements error: ${error?.message || JSON.stringify(error)}`,
        });
      }

      // Test 7: Test joining tables (relationships)
      addResult({
        name: 'Join Tables Test',
        status: 'pending',
        message: 'Testing relationships between tables...',
      });

      try {
        const { data, error } = await supabase
          .from('investments')
          .select(`
            id,
            amount,
            equity,
            user_profiles:user_id (name, username),
            startups:startup_id (name, logo)
          `)
          .limit(2);
        
        if (error) throw error;
        
        addResult({
          name: 'Join Tables Test',
          status: data && data.length > 0 ? 'success' : 'error',
          message: data && data.length > 0 
            ? `Successfully joined investments with related tables` 
            : 'Unable to join tables or no data found',
          data,
        });
      } catch (error: any) {
        addResult({
          name: 'Join Tables Test',
          status: 'error',
          message: `Join tables error: ${error?.message || JSON.stringify(error)}`,
        });
      }
    } catch (e: any) {
      setError(`Something went wrong: ${e?.message || JSON.stringify(e)}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run tests when component mounts
  useEffect(() => {
    runTests();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Error Running Tests</Text>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
            <Button 
              mode="contained" 
              onPress={runTests}
              style={{ marginTop: 16 }}
            >
              Try Again
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Database Test</Text>
      
      <Button 
        mode="contained" 
        onPress={runTests} 
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Test All Database Connections
      </Button>

      {results.length === 0 && !loading && (
        <Card style={styles.messageCard}>
          <Card.Content>
            <Text style={styles.messageText}>Click the button to start tests</Text>
          </Card.Content>
        </Card>
      )}

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Card key={`${result.name}-${index}`} style={styles.resultCard}>
            <Card.Content>
              <View style={styles.resultHeader}>
                <Text style={styles.resultName}>{result.name}</Text>
                {result.status === 'pending' ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Text style={[
                    styles.resultStatus,
                    { color: result.status === 'success' ? '#06D6A0' : '#FF6B6B' }
                  ]}>
                    {result.status.toUpperCase()}
                  </Text>
                )}
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
      </ScrollView>
    </View>
  );
};

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
  resultStatus: {
    fontWeight: 'bold',
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
    marginTop: 20,
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