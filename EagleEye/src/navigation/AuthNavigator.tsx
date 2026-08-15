import React from 'react';
import { useAppNavigation } from '@/context/NavigationContext';
import {
  LandingScreen,
  SignupScreen,
  PostSignupOtpScreen,
  ForgotPasswordScreen,
  OtpScreen,
  SetPasswordScreen,
  LoginScreen,
} from '@/screens/auth';

export const AuthNavigator: React.FC = () => {
  const { currentScreen } = useAppNavigation();

  switch (currentScreen) {
    case 'Landing':
      return <LandingScreen />;
    case 'Signup':
      return <SignupScreen />;
    case 'PostSignupOtp':
      return <PostSignupOtpScreen />;
    case 'ForgotPassword':
      return <ForgotPasswordScreen />;
    case 'Otp':
      return <OtpScreen />;
    case 'SetPassword':
      return <SetPasswordScreen />;
    case 'Login':
      return <LoginScreen />;
    default:
      return <LandingScreen />;
  }
};
