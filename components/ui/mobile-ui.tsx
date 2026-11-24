import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const colors = {
  background: '#FFFBF5',
  card: '#FFFFFF',
  text: '#1F2937',
  muted: '#6B7280',
  border: '#E5E7EB',
  teal: '#0F766E',
  amber: '#F59E0B',
};

export function AppScreen({
  children,
  scroll = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: object;
}) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.screenContent, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screenContent, styles.fill, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {content}
    </SafeAreaView>
  );
}

export function BrandLogo({ size = 58 }: { size?: number }) {
  return (
    <Image
      accessibilityLabel="DR Star"
      source={require('@/assets/images/logobaru.png')}
      contentFit="contain"
      style={{ width: size * 2.2, height: size }}
    />
  );
}

export function ScreenTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(115)}
      style={styles.titleBlock}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Animated.View>
  );
}

export function Field({
  label,
  error,
  style: inputStyle,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#9CA3AF"
        style={[styles.field, props.multiline && styles.multiline, inputStyle]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
}) {
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 13, stiffness: 170 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 13, stiffness: 170 }); }}
        style={[
          styles.button,
          variant === 'outline' && styles.buttonOutline,
          variant === 'danger' && styles.buttonDanger,
          isDisabled && styles.buttonDisabled,
        ]}>
        {loading ? (
          <ActivityIndicator color={variant === 'outline' ? colors.teal : '#FFFFFF'} />
        ) : (
          <Text style={[styles.buttonText, variant === 'outline' && styles.buttonOutlineText]}>
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function InlineLink({
  label,
  href,
}: {
  label: string;
  href: '/(auth)/welcome' | '/(auth)/login' | '/(auth)/register' | '/(auth)/forgot-password' | '/legal/terms' | '/legal/privacy';
}) {
  return (
    <Link href={href} style={styles.link}>
      {label}
    </Link>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(130)}
      accessibilityRole="alert"
      style={styles.errorBanner}>
      <Text style={styles.errorBannerText}>{message}</Text>
    </Animated.View>
  );
}

export function LoadingState({ label = 'Memuat...' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.teal} size="large" />
      <Text style={styles.subtitle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    flexGrow: 1,
  },
  fill: {
    justifyContent: 'center',
  },
  titleBlock: {
    marginBottom: 22,
  },
  eyebrow: {
    color: colors.amber,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },
  fieldContainer: {
    gap: 7,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  field: {
    minHeight: 49,
    borderRadius: 13,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  multiline: {
    minHeight: 100,
    paddingTop: 13,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#B42318',
    fontSize: 11,
  },
  button: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  buttonOutline: {
    backgroundColor: colors.card,
    borderColor: colors.teal,
    borderWidth: 1,
  },
  buttonOutlineText: {
    color: colors.teal,
  },
  buttonDanger: {
    backgroundColor: '#B42318',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  link: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    borderRadius: 12,
    borderColor: '#FECACA',
    borderWidth: 1,
    backgroundColor: '#FEF2F2',
    padding: 13,
  },
  errorBannerText: {
    color: '#B42318',
    fontSize: 12,
    lineHeight: 18,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 32,
  },
});
