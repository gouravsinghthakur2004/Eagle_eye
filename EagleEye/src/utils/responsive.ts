import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Baseline mobile layout dimensions (standard iPhone 13/14 / Android 375x812 width)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const scale = (size: number): number => {
  const scaled = (SCREEN_WIDTH / BASE_WIDTH) * size;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

export const verticalScale = (size: number): number => {
  const scaled = (SCREEN_HEIGHT / BASE_HEIGHT) * size;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

export const moderateScale = (size: number, factor = 0.5): number => {
  const scaled = size + (scale(size) - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

export const SCREEN_BOUNDS = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallScreen: SCREEN_WIDTH < 360,
  isTablet: SCREEN_WIDTH >= 600,
};
