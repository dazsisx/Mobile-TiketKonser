import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  FadeInUp,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { BrandLogo } from '@/components/ui/mobile-ui';

export default function LaunchSplash() {
  const rotation = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 5200, easing: Easing.linear }),
      -1,
      false
    );
    float.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1050, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1050, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(float);
    };
  }, [float, rotation]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  return (
    <Animated.View
      accessibilityLabel="DR Star sedang dimuat"
      exiting={FadeOut.duration(300)}
      style={styles.screen}>
      <View style={styles.glow} />
      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(700)} style={[styles.orbit, orbitStyle]}>
          <View style={styles.orbitDot} />
        </Animated.View>
        <Animated.View entering={FadeInUp.springify().damping(16).stiffness(105)} style={[styles.logoCard, logoStyle]}>
          <BrandLogo size={64} />
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(180).duration(650)} style={styles.copy}>
          <Text style={styles.brand}>DR STAR</Text>
          <Text style={styles.tagline}>Temukan event. Ciptakan cerita.</Text>
        </Animated.View>
      </View>
      <Animated.View entering={FadeIn.delay(420).duration(500)} style={styles.loading}>
        <ActivityIndicator size="small" color="#0F766E" />
        <Text style={styles.loadingText}>Menyiapkan pengalamanmu</Text>
      </Animated.View>
      <View style={styles.bottomAccent} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 20,
    backgroundColor: '#FFFBF5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: '#ECFDF5',
    opacity: 0.8,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -25,
  },
  orbit: {
    position: 'absolute',
    width: 212,
    height: 212,
    borderRadius: 106,
    borderWidth: 1,
    borderColor: '#B5D9C9',
    borderStyle: 'dashed',
  },
  orbitDot: {
    position: 'absolute',
    top: 20,
    right: 24,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
    borderWidth: 3,
    borderColor: '#FFFBF5',
  },
  logoCard: {
    width: 184,
    height: 146,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#155E52',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.11,
    shadowRadius: 24,
    elevation: 7,
  },
  copy: {
    alignItems: 'center',
    marginTop: 31,
  },
  brand: {
    color: '#155E52',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 4,
  },
  tagline: {
    color: '#75827C',
    fontSize: 12,
    marginTop: 7,
  },
  loading: {
    position: 'absolute',
    bottom: 76,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#87918B',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    width: 62,
    height: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: '#0F766E',
  },
});
