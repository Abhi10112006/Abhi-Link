import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';

export const PremiumBackground: React.FC = () => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
      <Defs>
        <Pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <Circle cx="1" cy="1" r="1" fill="rgba(45,45,43,0.06)" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="#e6e1dc" />
      <Rect width="100%" height="100%" fill="url(#dots)" />
    </Svg>
  </View>
);
