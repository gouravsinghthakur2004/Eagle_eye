import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUnauthorizedListener } from '@/api/client';
import { profileService, UserProfile } from '@/services/profileService';
import { AuthService } from '@/services/authService';
import { bookingService } from '@/services/bookingService';

export type ScreenName =
  | 'Landing'
  | 'Signup'
  | 'PostSignupOtp'
  | 'ForgotPassword'
  | 'Otp'
  | 'SetPassword'
  | 'Login'
  | 'Home'
  | 'Events'
  | 'MyEvents'
  | 'EventDetails'
  | 'JoinEvent'
  | 'SelectDriver'
  | 'SelectNavigator'
  | 'SelectVehicle'
  | 'TermsConditions'
  | 'Drivers'
  | 'Profile'
  | 'DriverNavigatorProfile'
  | 'Vehicles'
  | 'Organizations'
  | 'Results'
  | 'Notifications'
  | 'Settings';

export interface JoinFormDraft {
  asn: string;
  team: string;
  category: any;
  classItem: any;
  paymentMode: string;
  paymentReference: string;
  paymentDate: string;
  paymentAmount: string;
}

const DEFAULT_JOIN_FORM_DRAFT: JoinFormDraft = {
  asn: '',
  team: '',
  category: null,
  classItem: null,
  paymentMode: '',
  paymentReference: '',
  paymentDate: '',
  paymentAmount: '',
};

interface NavigationContextType {
  currentScreen: ScreenName;
  history: ScreenName[];
  navigate: (screen: ScreenName) => void;
  goBack: () => void;
  finishJoinEventAndNavigateToMyEvents: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  unreadCount: number;

  // Post Signup flow state
  signupEmail: string;
  setSignupEmail: (email: string) => void;
  signupPassword: string;
  setSignupPassword: (password: string) => void;
  clearSignupContext: () => void;

  // Forgot password flow state
  resetEmail: string;
  setResetEmail: (email: string) => void;
  resetOtp: string;
  setResetOtp: (otp: string) => void;
  clearResetContext: () => void;

  // Event selection state
  selectedEventId: string;
  selectedEventData: any;
  openEventDetails: (eventId: string, eventData?: any) => void;

  // Join Event Flow State & Actions
  selectedJoinEvent: any;
  selectedDriverForJoin: any;
  selectedNavigatorForJoin: any;
  selectedVehicleForJoin: any;
  termsAcceptedInJoin: boolean;
  joinFormDraft: JoinFormDraft;
  updateJoinFormDraft: (fields: Partial<JoinFormDraft>) => void;
  openJoinEvent: (event: any) => Promise<boolean>;
  selectDriverForJoin: (driver: any) => void;
  selectNavigatorForJoin: (navigator: any) => void;
  selectVehicleForJoin: (vehicle: any) => void;
  setTermsAcceptedInJoin: (accepted: boolean) => void;

  // Session & Auth state
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  onLoginSuccess: (user?: UserProfile) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<ScreenName[]>(['Home']);

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [unreadCount] = useState<number>(3);

  // Post Signup flow states
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');

  const clearSignupContext = () => {
    setSignupEmail('');
    setSignupPassword('');
  };

  // Forgot password flow states
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetOtp, setResetOtp] = useState<string>('');

  const clearResetContext = () => {
    setResetEmail('');
    setResetOtp('');
  };

  // Event selection state
  const [selectedEventId, setSelectedEventId] = useState<string>('3');
  const [selectedEventData, setSelectedEventData] = useState<any>(null);

  // Join Event Selection States
  const [selectedJoinEvent, setSelectedJoinEvent] = useState<any>(null);
  const [selectedDriverForJoin, setSelectedDriverForJoin] = useState<any>(null);
  const [selectedNavigatorForJoin, setSelectedNavigatorForJoin] = useState<any>(null);
  const [selectedVehicleForJoin, setSelectedVehicleForJoin] = useState<any>(null);
  const [termsAcceptedInJoin, setTermsAcceptedInJoin] = useState<boolean>(false);
  const [joinFormDraft, setJoinFormDraft] = useState<JoinFormDraft>(DEFAULT_JOIN_FORM_DRAFT);

  const updateJoinFormDraft = (fields: Partial<JoinFormDraft>) => {
    setJoinFormDraft((prev) => ({ ...prev, ...fields }));
  };

  const openEventDetails = (eventId: string, eventData?: any) => {
    setSelectedEventId(eventId);
    if (eventData) {
      setSelectedEventData(eventData);
    }
    navigate('EventDetails');
  };

  const finishJoinEventAndNavigateToMyEvents = () => {
    setIsDrawerOpen(false);
    setSelectedJoinEvent(null);
    setSelectedDriverForJoin(null);
    setSelectedNavigatorForJoin(null);
    setSelectedVehicleForJoin(null);
    setTermsAcceptedInJoin(false);
    setJoinFormDraft(DEFAULT_JOIN_FORM_DRAFT);

    setHistory((prev) => {
      // Remove any completed JoinEvent and sub-selection screens from navigation history stack
      const cleaned = prev.filter(
        (s) =>
          s !== 'JoinEvent' &&
          s !== 'SelectDriver' &&
          s !== 'SelectNavigator' &&
          s !== 'SelectVehicle' &&
          s !== 'TermsConditions'
      );
      return [...cleaned, 'MyEvents'];
    });
  };

  const openJoinEvent = async (event: any): Promise<boolean> => {
    if (!event || !event.id) return false;

    // Protection check: Determine if user has already joined this event using real data
    try {
      const isAlreadyJoined = await bookingService.isEventAlreadyJoined(String(event.id));
      if (isAlreadyJoined) {
        finishJoinEventAndNavigateToMyEvents();
        return false;
      }
    } catch (e) {
      console.warn('[openJoinEvent] Join check error:', e);
    }

    setSelectedJoinEvent(event);
    setSelectedDriverForJoin(null);
    setSelectedNavigatorForJoin(null);
    setSelectedVehicleForJoin(null);
    setTermsAcceptedInJoin(false);
    setJoinFormDraft(DEFAULT_JOIN_FORM_DRAFT);
    navigate('JoinEvent');
    return true;
  };

  const selectDriverForJoin = (driver: any) => {
    setSelectedDriverForJoin(driver);
    goBack();
  };

  const selectNavigatorForJoin = (navigator: any) => {
    setSelectedNavigatorForJoin(navigator);
    goBack();
  };

  const selectVehicleForJoin = (vehicle: any) => {
    setSelectedVehicleForJoin(vehicle);
    goBack();
  };

  // Session restoration states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);


  // Session restoration on app launch - Persistent session management
  const restoreSession = async () => {
    let token: string | null = null;

    // Safety fallback timer to prevent infinite loading state
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    try {
      setIsLoading(true);

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 600));

      token = await Promise.race([AuthService.getStoredToken(), timeoutPromise]);
      const storedUser = await Promise.race([AuthService.getStoredUser(), timeoutPromise]);

      if (token && storedUser) {
        setIsAuthenticated(true);
        setUser(storedUser);
        setHistory(['Home']);
      } else {
        // Fresh install / no session available -> Show Landing Page
        setIsAuthenticated(false);
        setUser(null);
        setHistory(['Landing']);
      }
    } catch (e) {
      console.warn('Error restoring session on app startup:', e);
      setIsAuthenticated(false);
      setUser(null);
      setHistory(['Landing']);
    } finally {
      clearTimeout(safetyTimer);
      setIsLoading(false);
    }

    // Non-blocking background profile sync AFTER unblocking UI
    if (token) {
      profileService
        .getUserProfile()
        .then((profileRes) => {
          if (profileRes && profileRes.user) {
            setUser(profileRes.user);
            AuthService.saveUserSession(token || undefined, profileRes.user);
          }
        })
        .catch((profileErr) => {
          console.log('[restoreSession] Background profile refresh skipped:', profileErr);
        });
    }
  };

  useEffect(() => {
    restoreSession();

    // Attach 401 Unauthorized listener
    setUnauthorizedListener(async () => {
      await AuthService.logout();
      setIsAuthenticated(false);
      setUser(null);
      setIsDrawerOpen(false);
      setHistory(['Landing']);
    });

    return () => {
      setUnauthorizedListener(null);
    };
  }, []);

  const onLoginSuccess = (userData?: UserProfile) => {
    setIsAuthenticated(true);
    if (userData) {
      setUser(userData);
      AuthService.saveUserSession(undefined, userData);
    }
    setHistory(['Home']);
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (e) {}
    setIsAuthenticated(false);
    setUser(null);
    setIsDrawerOpen(false);
    setHistory(['Landing']);
  };


  const refreshProfile = async () => {
    try {
      const profileRes = await profileService.getUserProfile();
      if (profileRes && profileRes.user) {
        setUser(profileRes.user);
      }
    } catch (e) {
      console.warn('Failed to refresh profile:', e);
    }
  };

  const currentScreen = history[history.length - 1] || (isAuthenticated ? 'Home' : 'Landing');

  const navigate = (screen: ScreenName) => {
    setIsDrawerOpen(false);
    setHistory((prev) => [...prev, screen]);
  };

  const goBack = () => {
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, -1));
    }
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  return (
    <NavigationContext.Provider
      value={{
        currentScreen,
        history,
        navigate,
        goBack,
        finishJoinEventAndNavigateToMyEvents,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        unreadCount,
        signupEmail,
        setSignupEmail,
        signupPassword,
        setSignupPassword,
        clearSignupContext,
        resetEmail,
        setResetEmail,
        resetOtp,
        setResetOtp,
        clearResetContext,
        selectedEventId,
        selectedEventData,
        openEventDetails,
        selectedJoinEvent,
        selectedDriverForJoin,
        selectedNavigatorForJoin,
        selectedVehicleForJoin,
        termsAcceptedInJoin,
        joinFormDraft,
        updateJoinFormDraft,
        openJoinEvent,
        selectDriverForJoin,
        selectNavigatorForJoin,
        selectVehicleForJoin,
        setTermsAcceptedInJoin,
        isLoading,
        isAuthenticated,
        user,
        onLoginSuccess,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useAppNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within NavigationProvider');
  }
  return context;
};
