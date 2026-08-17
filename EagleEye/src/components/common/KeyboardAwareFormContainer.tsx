import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  KeyboardEvent,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

export interface KeyboardAwareFormContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  extraScrollHeight?: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  nestedScrollEnabled?: boolean;
  bounces?: boolean;
}

export interface KeyboardAwareFormContainerRef {
  scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToEnd: (options?: { animated?: boolean }) => void;
  getScrollView: () => ScrollView | null;
}

export const KeyboardAwareFormContainer = forwardRef<
  KeyboardAwareFormContainerRef,
  KeyboardAwareFormContainerProps
>(({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  extraScrollHeight = 120,
  onScroll,
  scrollEventThrottle = 16,
  nestedScrollEnabled = false,
  bounces = true,
}, ref) => {
  const internalScrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  useImperativeHandle(ref, () => ({
    scrollTo: (options) => {
      internalScrollViewRef.current?.scrollTo(options);
    },
    scrollToEnd: (options) => {
      internalScrollViewRef.current?.scrollToEnd(options);
    },
    getScrollView: () => internalScrollViewRef.current,
  }));

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (e: KeyboardEvent) => {
      const height = e.endCoordinates?.height || 0;
      setKeyboardHeight(height);
    };

    const onKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Compute dynamic bottom padding when keyboard is open
  const basePaddingBottom =
    (StyleSheet.flatten(contentContainerStyle)?.paddingBottom as number) || 24;
  const dynamicPaddingBottom =
    keyboardHeight > 0
      ? Math.max(basePaddingBottom, extraScrollHeight + 40)
      : basePaddingBottom;

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        ref={internalScrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          contentContainerStyle,
          { paddingBottom: dynamicPaddingBottom },
        ]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode="on-drag"
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        nestedScrollEnabled={nestedScrollEnabled}
        bounces={bounces}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

KeyboardAwareFormContainer.displayName = 'KeyboardAwareFormContainer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
