import React, { useState } from 'react';
import { StyleSheet, View, Image, KeyboardAvoidingView, Platform, TouchableOpacity, ImageBackground } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase/supabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignupScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignup = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!email || !password || !confirm) {
      setErrorMessage('All fields are required');
      return;
    }
    if (password !== confirm) {
      setErrorMessage('Passwords do not match');
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setIsLoading(false);
    if (error) {
      setErrorMessage(error.message);
    } else {
      // New user: initialize profile with 1M starting cash
      const userId = data.user?.id;
      if (userId) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            name: '',
            username: '',
            email: email,
            avatar: '',
            bio: '',
            cash_available: 1000000,
            portfolio_value: 0,
            level: 0,
            experience_points: 0,
            experience_to_next_level: 1000,
            rank: 0,
            achievements: []
          });
        if (profileError) console.error('Error initializing user_profiles:', profileError);
      }
      setSuccessMessage('Account created! Check your email to confirm.');
    }
  };

  return (
    <ImageBackground source={require('../../assets/images/investor-bg.jpg')} style={styles.backgroundImage}>
      <LinearGradient colors={['rgba(22,28,36,0.8)','rgba(22,28,36,0.95)']} style={styles.gradientOverlay}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <StatusBar style="light" />
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image source={{uri:'https://cdn-icons-png.flaticon.com/512/6295/6295417.png'}} style={styles.logo} />
              <Text style={styles.title}>STARTUP PITCH CHALLENGE</Text>
              <Text style={styles.subtitle}>Create your investor account</Text>
            </View>

            <View style={styles.formContainer}>
              {errorMessage && <HelperText type="error" visible>{errorMessage}</HelperText>}
              {successMessage && <HelperText type="info" visible>{successMessage}</HelperText>}
              <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" style={styles.input} autoCapitalize="none" keyboardType="email-address" disabled={isLoading} theme={{colors:{primary:'#D4AF37', onSurfaceVariant:'#CCCCCC', background:'rgba(28,35,45,0.8)', text:'#FFFFFF', placeholder:'#CCCCCC'}}} contentStyle={{color:'#FFFFFF'}} />
              <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry mode="outlined" style={styles.input} disabled={isLoading} theme={{colors:{primary:'#D4AF37', onSurfaceVariant:'#CCCCCC', background:'rgba(28,35,45,0.8)', text:'#FFFFFF', placeholder:'#CCCCCC'}}} contentStyle={{color:'#FFFFFF'}} />
              <TextInput label="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry mode="outlined" style={styles.input} disabled={isLoading} theme={{colors:{primary:'#D4AF37', onSurfaceVariant:'#CCCCCC', background:'rgba(28,35,45,0.8)', text:'#FFFFFF', placeholder:'#CCCCCC'}}} contentStyle={{color:'#FFFFFF'}} />
              <Button mode="contained" onPress={handleSignup} style={styles.loginButton} contentStyle={styles.buttonContent} loading={isLoading}>Sign Up</Button>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/auth/login')}><Text style={styles.signUpText}>Sign In</Text></TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => router.replace('/auth/forgot-password')} style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  gradientOverlay: { flex: 1 },
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 80, height: 80, marginBottom: 16, tintColor: '#D4AF37' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8, letterSpacing: 1 },
  subtitle: { fontSize: 18, color: '#D4AF37' },
  formContainer: { marginBottom: 32, backgroundColor: 'rgba(28,37,51,0.75)', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', shadowColor: '#000', shadowOffset: {width:0,height:4}, shadowOpacity:0.3, shadowRadius:5, elevation:8 },
  input: { marginBottom: 16, backgroundColor: 'rgba(28,35,45,0.8)', color: '#FFFFFF' },
  errorContainer: { backgroundColor: 'rgba(255,77,77,0.2)', borderRadius:4, padding:8, marginBottom:16, borderWidth:1, borderColor:'rgba(255,77,77,0.5)' },
  errorText: { color: '#FF6B6B', textAlign: 'center', fontSize: 14 },
  loginButton: { marginBottom: 16, borderRadius: 8, elevation: 4 },
  demoButton: { borderColor: '#D4AF37', borderWidth: 2, borderRadius: 8 },
  buttonContent: { paddingVertical: 8, height: 50, justifyContent: 'center' },
  footer: { flexDirection:'row', justifyContent:'center', alignItems:'center', marginTop:16 },
  footerText: { color: '#CCCCCC', marginRight:8 },
  signUpText: { color: '#D4AF37', fontWeight:'bold' },
  forgotPasswordContainer: { marginTop:16, alignItems:'center' },
  forgotPasswordText: { color: '#AAAAAA', textAlign:'center', fontSize:14 }
}); 