import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearAuthError, signIn } from '../store/slices/authSlice';
import { ApiFailure } from '../api/types';
import { color, radius, space, type } from '../theme';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function serverErrorText(failure: ApiFailure): string {
  if (failure.status === 401) {
    return 'Email or password is wrong.';
  }
  if (failure.status === 503 || failure.status === null) {
    return 'The server is unavailable right now. Please try again in a moment.';
  }
  return failure.message;
}

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(state => state.auth.status);
  const serverError = useAppSelector(state => state.auth.error);
  const sessionExpired = useAppSelector(state => state.auth.sessionExpired);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const signingIn = status === 'signingIn';

  const onSubmit = () => {
    if (signingIn) {
      return;
    }
    const errors: typeof fieldErrors = {};
    const trimmed = email.trim();
    if (!trimmed) {
      errors.email = 'Enter your email.';
    } else if (!EMAIL_PATTERN.test(trimmed)) {
      errors.email = 'That does not look like an email address.';
    }
    if (!password) {
      errors.password = 'Enter your password.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    dispatch(signIn({ email: trimmed, password }));
  };

  const clearErrors = () => {
    if (serverError) {
      dispatch(clearAuthError());
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandBlock}>
            <View style={styles.brandMark} />
            <Text style={styles.wordmark}>Molt Coach</Text>
            <Text style={styles.tagline}>Progress, shed by shed.</Text>
          </View>

          {sessionExpired ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                Your session expired. Please sign in again.
              </Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, fieldErrors.email && styles.inputError]}
              value={email}
              onChangeText={value => {
                setEmail(value);
                setFieldErrors(prev => ({ ...prev, email: undefined }));
                clearErrors();
              }}
              placeholder="coach@molt.app"
              placeholderTextColor={color.inkFaint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!signingIn}
            />
            {fieldErrors.email ? (
              <Text style={styles.fieldError}>{fieldErrors.email}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, fieldErrors.password && styles.inputError]}
              value={password}
              onChangeText={value => {
                setPassword(value);
                setFieldErrors(prev => ({ ...prev, password: undefined }));
                clearErrors();
              }}
              placeholder="••••••••"
              placeholderTextColor={color.inkFaint}
              secureTextEntry
              editable={!signingIn}
              onSubmitEditing={onSubmit}
            />
            {fieldErrors.password ? (
              <Text style={styles.fieldError}>{fieldErrors.password}</Text>
            ) : null}
          </View>

          <Pressable
            style={[styles.button, signingIn && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={signingIn}
            accessibilityRole="button"
          >
            {signingIn ? (
              <ActivityIndicator color={color.surface} />
            ) : (
              <Text style={styles.buttonLabel}>Sign in</Text>
            )}
          </Pressable>

          {serverError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {serverErrorText(serverError)}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bg,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: space.xl,
    gap: space.l,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: space.xl,
    gap: space.s,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: color.accent,
    transform: [{ rotate: '45deg' }],
    marginBottom: space.s,
  },
  wordmark: {
    fontSize: 30,
    fontWeight: '800',
    color: color.ink,
    letterSpacing: -0.5,
  },
  tagline: {
    ...type.caption,
  },
  field: {
    gap: 6,
  },
  label: {
    ...type.overline,
  },
  input: {
    backgroundColor: color.surface,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: color.line,
    paddingVertical: 14,
    paddingHorizontal: space.l,
    fontSize: 16,
    color: color.ink,
  },
  inputError: {
    borderColor: color.danger,
  },
  fieldError: {
    ...type.caption,
    color: color.danger,
  },
  button: {
    backgroundColor: color.ink,
    borderRadius: radius.m,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: space.s,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonLabel: {
    color: color.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  noticeBox: {
    backgroundColor: color.accentSoft,
    borderRadius: radius.m,
    padding: space.l,
  },
  noticeText: {
    ...type.caption,
    color: color.accent,
  },
  errorBox: {
    backgroundColor: color.dangerSoft,
    borderRadius: radius.m,
    padding: space.l,
  },
  errorText: {
    ...type.caption,
    color: color.danger,
  },
});
