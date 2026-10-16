import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  StyleProp,
  ViewStyle,
  DimensionValue,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius as themeRadius } from '../../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  onCard?: boolean;
  style?: StyleProp<ViewStyle>;
  reducedMotion?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = themeRadius.xs,
  onCard = false,
  style,
  reducedMotion = false,
}) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation;
    if (reducedMotion) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 600,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
    } else {
      animLoop = Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        })
      );
    }
    animLoop.start();
    return () => animLoop.stop();
  }, [reducedMotion]);

  const baseColor = onCard ? colors.onCardSkeleton : colors.skeletonBase;
  const highlightColor = onCard ? colors.onCardSkeletonHighlight : colors.skeletonHighlight;

  if (reducedMotion) {
    const opacity = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1.0],
    });

    return (
      <Animated.View
        accessibilityLabel="Memuat"
        accessibilityState={{ busy: true }}
        style={[
          styles.container,
          {
            width,
            height,
            borderRadius,
            backgroundColor: baseColor,
            opacity,
          },
          style,
        ]}
      />
    );
  }

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 260],
  });

  return (
    <View
      accessibilityLabel="Memuat"
      accessibilityState={{ busy: true }}
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
            width: '60%',
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', highlightColor, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
});

export default Skeleton;
