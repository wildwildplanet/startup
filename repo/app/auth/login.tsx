import { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
// Add this line to automatically handle redirects from OAuth
WebBrowser.maybeCompleteAuthSession();
import { StyleSheet, View, Image, KeyboardAvoidingView, Platform, TouchableOpacity, ImageBackground } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import { SUPABASE_REDIRECT_URL, SUPABASE_URL } from '@env';

export default function LoginScreen() {
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Email and password are required');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        if (error.message.includes('Invalid login')) {
          throw new Error('Invalid email or password');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email before logging in');
        } else {
          throw new Error(error.message);
        }
      }

      if (!data.user) {
        throw new Error('No user returned from login');
      }

      // Fetch the full user object and log it
      const { data: userData, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) {
        console.error('Error fetching user after login:', getUserError);
      } else {
        console.log('Supabase user object:', userData.user);
      }

      // Navigate to the home screen
      router.replace('/tabs/home');
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for Supabase auth state changes to handle sign-in state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsLoading(false);
        router.replace('/tabs/home');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <ImageBackground 
      source={require('../../assets/images/investor-bg.jpg')}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={['rgba(22, 28, 36, 0.8)', 'rgba(22, 28, 36, 0.95)']}
        style={styles.gradientOverlay}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <StatusBar style="light" />
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6295/6295417.png' }}
                style={styles.logo}
              />
              <Text style={styles.title}>STARTUP PITCH CHALLENGE</Text>
              <Text style={styles.subtitle}>Invest in the next big thing</Text>
            </View>

            <View style={styles.formContainer}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={(text) => { setEmail(text); setErrorMessage(null); }}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                disabled={isLoading}
                theme={{ colors: { primary: '#D4AF37', onSurfaceVariant: '#CCCCCC', background: 'rgba(28, 35, 45, 0.8)', text: '#FFFFFF', placeholder: '#CCCCCC' } }}
                contentStyle={{ color: '#FFFFFF' }}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={(text) => { setPassword(text); setErrorMessage(null); }}
                secureTextEntry={secureTextEntry}
                mode="outlined"
                style={styles.input}
                disabled={isLoading}
                theme={{ colors: { primary: '#D4AF37', onSurfaceVariant: '#CCCCCC', background: 'rgba(28, 35, 45, 0.8)', text: '#FFFFFF', placeholder: '#CCCCCC' } }}
                contentStyle={{ color: '#FFFFFF' }}
                right={
                  <TextInput.Icon icon={secureTextEntry ? "eye" : "eye-off"} onPress={() => setSecureTextEntry(!secureTextEntry)} color="#D4AF37" />
                }
              />

              {errorMessage && (
                <View style={styles.errorContainer}>
                  <HelperText type="error" visible={!!errorMessage} style={styles.errorText}>
                    {errorMessage}
                  </HelperText>
                </View>
              )}

              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
                loading={isLoading}
                disabled={isLoading}
                buttonColor="#D4AF37"
                textColor="#1C1C1C"
              >
                Sign In
              </Button>

              <TouchableOpacity onPress={() => router.push('/auth/forgot-password')} style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
    tintColor: '#D4AF37',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#D4AF37',
  },
  formContainer: {
    marginBottom: 32,
    backgroundColor: 'rgba(28, 37, 51, 0.75)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(28, 35, 45, 0.8)',
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 77, 77, 0.2)',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.5)',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontSize: 14,
  },
  loginButton: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
  },
  demoButton: {
    borderColor: '#D4AF37',
    borderWidth: 2,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
    height: 50,
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#CCCCCC',
    marginRight: 8,
  },
  signUpText: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#AAAAAA',
    textAlign: 'center',
    fontSize: 14,
  },
}); 