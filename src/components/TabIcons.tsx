import React from 'react';
import { StyleSheet, View } from 'react-native';

export function ClientsIcon({ tint }: { tint: string }) {
  return (
    <View style={styles.box}>
      <View style={[styles.head, styles.headFront, { backgroundColor: tint }]} />
      <View style={[styles.head, styles.headBack, { borderColor: tint }]} />
      <View style={[styles.body, { backgroundColor: tint }]} />
    </View>
  );
}

export function ProfileIcon({ tint }: { tint: string }) {
  return (
    <View style={styles.box}>
      <View style={[styles.headCentered, { backgroundColor: tint }]} />
      <View style={[styles.bodyCentered, { backgroundColor: tint }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
  },
  head: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  headFront: {
    left: 3,
    top: 2,
  },
  headBack: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    right: 2,
    top: 4,
  },
  body: {
    position: 'absolute',
    bottom: 2,
    left: 1,
    right: 1,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headCentered: {
    position: 'absolute',
    top: 2,
    alignSelf: 'center',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bodyCentered: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
    width: 18,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
  },
});
