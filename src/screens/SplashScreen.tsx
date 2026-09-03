import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { color, space } from '../theme';

interface SplashScreenProps {
  isReady?: boolean;
  onFinish?: () => void;
}

export default function SplashScreen({
  isReady = true,
  onFinish,
}: SplashScreenProps) {
  const translateY = useRef(new Animated.Value(-160)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const isReadyRef = useRef(isReady);
  isReadyRef.current = isReady;

  useEffect(() => {
    // 1. Slide "Molt Coach" from top to bottom while fading in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 850,
        easing: Easing.out(Easing.back(1.15)),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Hold momentarily so user sees it clearly
      const checkAndExit = () => {
        if (isReadyRef.current) {
          // 3. Smooth fade out transition
          Animated.timing(screenOpacity, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
            onFinish?.();
          });
        } else {
          setTimeout(checkAndExit, 100);
        }
      };

      const timer = setTimeout(checkAndExit, 1100);
      return () => clearTimeout(timer);
    });
  }, [contentOpacity, onFinish, screenOpacity, translateY]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={color.accent} />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.brandMark} />
        <Text style={styles.wordmark}>Molt Coach</Text>
        <Text style={styles.tagline}>Progress, shed by shed.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  content: {
    alignItems: 'center',
    gap: space.s,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    marginBottom: space.m,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  wordmark: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.2,
  },
});
