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
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addWeight } from '../store/slices/weightSlice';
import { addDays, formatDayLong, isSameDay } from '../lib/dates';
import { color, radius, space, type } from '../theme';
import type { ClientsStackScreenProps } from '../navigation/types';

interface FieldErrors {
  weightKg?: string;
  dateISO?: string;
  general?: string;
}

function toEntryISO(date: Date): string {
  const now = new Date();
  if (isSameDay(date, now)) {
    return now.toISOString();
  }
  const atNoon = new Date(date.getTime());
  atNoon.setHours(12, 0, 0, 0);
  return atNoon.toISOString();
}

export default function AddWeightScreen({
  route,
  navigation,
}: ClientsStackScreenProps<'AddWeight'>) {
  const { clientId } = route.params;
  const dispatch = useAppDispatch();
  const saving = useAppSelector(state => state.weight.adding);

  const [date, setDate] = useState(new Date());
  const [weightText, setWeightText] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const today = new Date();
  const isToday = isSameDay(date, today);

  const shiftDate = (days: number) => {
    const next = addDays(date, days);
    if (next.getTime() > today.getTime() && !isSameDay(next, today)) {
      return;
    }
    setDate(next);
    setErrors(prev => ({ ...prev, dateISO: undefined, general: undefined }));
  };

  const onSave = () => {
    if (saving) {
      return;
    }
    const nextErrors: FieldErrors = {};
    const normalized = weightText.replace(',', '.').trim();
    const value = Number(normalized);
    if (!normalized) {
      nextErrors.weightKg = 'Enter a weight.';
    } else if (!Number.isFinite(value)) {
      nextErrors.weightKg = 'Weight must be a number.';
    } else if (value < 20 || value > 400) {
      nextErrors.weightKg = 'Weight must be between 20 and 400 kg.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    dispatch(
      addWeight({
        clientId,
        dateISO: toEntryISO(date),
        weightKg: value,
        note: note.trim() ? note.trim() : null,
      }),
    )
      .unwrap()
      .then(() => navigation.goBack())
      .catch(failure => {
        if (failure.field === 'weightKg' || failure.field === 'dateISO') {
          setErrors({ [failure.field]: failure.message });
        } else {
          setErrors({ general: failure.message });
        }
      });
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Date</Text>
          <View style={styles.dateRow}>
            <Pressable
              style={styles.dateStep}
              onPress={() => shiftDate(-1)}
              accessibilityRole="button"
              accessibilityLabel="Previous day"
            >
              <Text style={styles.dateStepLabel}>‹</Text>
            </Pressable>
            <View style={styles.dateValueBox}>
              <Text style={styles.dateValue}>{formatDayLong(date)}</Text>
              {isToday ? <Text style={styles.dateHint}>Today</Text> : null}
            </View>
            <Pressable
              style={[styles.dateStep, isToday && styles.dateStepDisabled]}
              onPress={() => shiftDate(1)}
              disabled={isToday}
              accessibilityRole="button"
              accessibilityLabel="Next day"
            >
              <Text
                style={[
                  styles.dateStepLabel,
                  isToday && styles.dateStepLabelDisabled,
                ]}
              >
                ›
              </Text>
            </Pressable>
          </View>
          {!isToday ? (
            <Pressable
              onPress={() => setDate(new Date())}
              accessibilityRole="button"
            >
              <Text style={styles.todayLink}>Jump back to today</Text>
            </Pressable>
          ) : null}
          {errors.dateISO ? (
            <Text style={styles.fieldError}>{errors.dateISO}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={[styles.input, errors.weightKg && styles.inputError]}
            value={weightText}
            onChangeText={value => {
              setWeightText(value);
              setErrors(prev => ({
                ...prev,
                weightKg: undefined,
                general: undefined,
              }));
            }}
            placeholder="85.4"
            placeholderTextColor={color.inkFaint}
            keyboardType="decimal-pad"
            editable={!saving}
          />
          {errors.weightKg ? (
            <Text style={styles.fieldError}>{errors.weightKg}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Morning, fasted"
            placeholderTextColor={color.inkFaint}
            editable={!saving}
          />
        </View>

        {errors.general ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errors.general}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.save, saving && styles.saveDisabled]}
          onPress={onSave}
          disabled={saving}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color={color.surface} />
          ) : (
            <Text style={styles.saveLabel}>Save</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
  },
  container: {
    padding: space.xl,
    gap: space.l,
  },
  field: {
    gap: 6,
  },
  label: {
    ...type.overline,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
  },
  dateStep: {
    width: 46,
    height: 52,
    borderRadius: radius.m,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateStepDisabled: {
    opacity: 0.4,
  },
  dateStepLabel: {
    fontSize: 24,
    color: color.ink,
    marginTop: -2,
  },
  dateStepLabelDisabled: {
    color: color.inkFaint,
  },
  dateValueBox: {
    flex: 1,
    height: 52,
    borderRadius: radius.m,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateValue: {
    ...type.bodyStrong,
  },
  dateHint: {
    ...type.caption,
    fontSize: 11,
  },
  todayLink: {
    ...type.caption,
    color: color.accent,
    fontWeight: '700',
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
  errorBox: {
    backgroundColor: color.dangerSoft,
    borderRadius: radius.m,
    padding: space.l,
  },
  errorText: {
    ...type.caption,
    color: color.danger,
  },
  save: {
    backgroundColor: color.accent,
    borderRadius: radius.m,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: space.s,
  },
  saveDisabled: {
    opacity: 0.7,
  },
  saveLabel: {
    color: color.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
