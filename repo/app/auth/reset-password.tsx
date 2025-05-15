import { useState, useEffect } from 'react';
import { StyleSheet, View, Image, KeyboardAvoidingView, Platform, TouchableOpacity, ImageBackground } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if we have the necessary params
  useEffect(() => {
    if (!params.access_token) {
      setErrorMessage('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [params]);

  const validatePasswordReset = () => {
    if (!password || !confirmPassword) {
      setErrorMessage('All fields are required');
      return false;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validatePasswordReset()) {
      return;
    }

    setIsLoading(true);

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccessMessage('Password successfully updated! Redirecting to login...');
      
      // Redirect back to login after a delay
      setTimeout(() => {
        router.replace('/auth/login');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMessage(err.message || 'Failed to reset password');
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
              <Text style={styles.subtitle}>Set New Password</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.instructions}>
                Please enter your new password below.
              </Text>

              <TextInput
                label="New Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage(null);
                }}
                secureTextEntry={secureTextEntry}
                mode="outlined"
                style={styles.input}
                disabled={isLoading || !!successMessage || !params.access_token}
                theme={{ 
                  colors: { 
                    primary: '#D4AF37',
                    onSurfaceVariant: '#CCCCCC',
                    background: 'rgba(28, 35, 45, 0.8)',
                    text: '#FFFFFF'
                  } 
                }}
                right={
                  <TextInput.Icon 
                    icon={secureTextEntry ? "eye" : "eye-off"} 
                    onPress={() => setSecureTextEntry(!secureTextEntry)} 
                    color="#D4AF37"
                  />
                }
              />

              <TextInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrorMessage(null);
                }}
                secureTextEntry={secureConfirmTextEntry}
                mode="outlined"
                style={styles.input}
                disabled={isLoading || !!successMessage || !params.access_token}
                theme={{ 
                  colors: { 
                    primary: '#D4AF37',
                    onSurfaceVariant: '#CCCCCC',
                    background: 'rgba(28, 35, 45, 0.8)',
                    text: '#FFFFFF'
                  } 
                }}
                right={
                  <TextInput.Icon 
                    icon={secureConfirmTextEntry ? "eye" : "eye-off"} 
                    onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)} 
                    color="#D4AF37"
                  />
                }
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
                disabled={isLoading || !!successMessage || !params.access_token}
                buttonColor="#D4AF37"
                textColor="#1C1C1C"
              >
                Update Password
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