import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Design dimensions (based on standard screen size)
const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

export const scale = (size) => {
  const screenRatio = SCREEN_WIDTH / DESIGN_WIDTH;
  return PixelRatio.roundToNearestPixel(size * screenRatio);
};

export const verticalScale = (size) => {
  const screenRatio = SCREEN_HEIGHT / DESIGN_HEIGHT;
  return PixelRatio.roundToNearestPixel(size * screenRatio);
};

export const moderateScale = (size, factor = 0.5) => {
  const screenRatio = SCREEN_WIDTH / DESIGN_WIDTH;
  return PixelRatio.roundToNearestPixel(size + (size * factor * (screenRatio - 1)));
};

// Helper to get screen size categories
export const getScreenSize = () => {
  if (SCREEN_WIDTH < 360) {
    return 'small';
  } else if (SCREEN_WIDTH < 414) {
    return 'medium';
  } else {
    return 'large';
  }
};

export const isTablet = () => {
  return SCREEN_WIDTH >= 768;
};