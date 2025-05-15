import { useState } from 'react';
import { StyleSheet, View, Image, KeyboardAvoidingView, Platform, TouchableOpacity, ImageBackground } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { SUPABASE_REDIRECT_URL } from '@env';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!email) {
      setErrorMessage('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Deep link back to the app's reset-password screen
      const redirectTo = SUPABASE_REDIRECT_URL || Linking.createURL('auth/reset-password');
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (error) {
        throw new Error(error.message);
      }

      setSuccessMessage('Password reset email sent. Please check your inbox.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMessage(err.message || 'Failed to send reset password email');
    } finally {
      setIsLoading(false);
    }
  };

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
              <Text style={styles.subtitle}>Reset Your Password</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.instructions}>
                Enter your email address and we'll send you instructions to reset your password.
              </Text>

              <TextInput
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage(null);
                }}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                disabled={isLoading || !!successMessage}
                theme={{ 
                  colors: { 
                    primary: '#D4AF37',
                    onSurfaceVariant: '#CCCCCC',
                    background: 'rgba(28, 35, 45, 0.8)',
                    text: '#FFFFFF'
                  } 
                }}
              />

              {errorMessage && (
                <View style={styles.errorContainer}>
                  <HelperText type="error" visible={!!errorMessage} style={styles.errorText}>
                    {errorMessage}
                  </HelperText>
                </View>
              )}

              {successMessage && (
                <View style={styles.successContainer}>
                  <HelperText type="info" visible={!!successMessage} style={styles.successText}>
                    {successMessage}
                  </HelperText>
                </View>
              )}

              <Button
                mode="contained"
                onPress={handleResetPassword}
                style={styles.resetButton}
                contentStyle={styles.buttonContent}
                loading={isLoading}
                disabled={isLoading || !!successMessage}
                buttonColor="#D4AF37"
                textColor="#1C1C1C"
              >
                Send Reset Link
              </Button>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password?</Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.loginText}>Sign In</Text>
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
  instructions: {
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
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
  successContainer: {
    backgroundColor: 'rgba(75, 181, 67, 0.2)',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 181, 67, 0.5)',
  },
  successText: {
    color: '#4BB543',
    textAlign: 'center',
    fontSize: 14,
  },
  resetButton: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
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
  loginText: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
}); 