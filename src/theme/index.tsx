import { Dimensions, PixelRatio, Platform } from 'react-native';
import StyleCommon from './styleCommon';
import Color from 'color';
export const Colors = {
  primary: '#355AA5',
  secondary: '#0ef76c',
  tertiary: 'white',
  backgroundIcon: '#e6ebeb',
  colorIcon: '#929492',
  text: '#1e1f1e',
  backgroundColor: 'white',
  pink: '#fc8598',
  border: '#dadadd',
  blurPrmiary: Color('#f71336').lighten(0.35).toString(),
  caption: Color('#929492').darken(0.2).toString(),
  purple: '#cf5bed',
  register: {
    normal: '#00FF00', // xanh lục
    upper: '#FFFF00', // vàng
    lower: '#808080', // xám
    negative: '#0000FF', // xanh dương
    //error: '',
    notRead: '#f6a8bf',//'#FF0000', // red
    byHand: '#FFA500', // cam

    // user define
    selected: '#e3e6e8',
  },
};
1;

export const Fonts = 'Lato-Regular';
//'SourceCodePro-SemiBold';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');
export const sizeScreen = Dimensions.get('screen');

const getSaleWidth = (widthScreen: number): number => {
  let scaleWidth = 1;
  if (widthScreen > 392) {
    scaleWidth = 1 + (widthScreen - 392) / widthScreen;
  } else if (widthScreen < 392) {
    scaleWidth = 1 - (-widthScreen + 392) / widthScreen;
  } else {
    scaleWidth = 1;
  }
  return scaleWidth;
};
const getSaleHeight = (heightScreen: number): number => {
  let scaleWidth = 1;
  if (heightScreen > 776) {
    scaleWidth = 1 + (heightScreen - 776) / heightScreen;
  } else if (heightScreen < 776) {
    scaleWidth = 1 - (-heightScreen + 776) / heightScreen;
  } else {
    scaleWidth = 1;
  }
  return scaleWidth;
};
export const scaleWidth = getSaleWidth(SCREEN_WIDTH);
export const scaleHeight = getSaleHeight(SCREEN_HEIGHT);
export const scale = scaleWidth < scaleHeight ? scaleWidth : scaleHeight;

export function normalize(size: number) {
  const newSize = size * scale;
  const obj = Dimensions.get('screen');
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize / obj.fontScale));
  } else {
    return (
      Math.round(PixelRatio.roundToNearestPixel(newSize / obj.fontScale)) - 2
    );
  }
}

console.log('color:', Colors.blurPrmiary);
console.log('width:', SCREEN_WIDTH);
console.log('height:', SCREEN_HEIGHT);
console.log('scale:', scale);
console.log('scaleWidth:', scaleWidth);
console.log('scaleHeight:', scaleHeight);

console.log(Dimensions.get('screen'));

export const CommonFontSize = normalize(18);
export const CommonHeight = 40 * scaleHeight;

console.log('CommonFontSize:', CommonFontSize);

export default { StyleCommon, Colors, Fonts };
//react-native setup-ios-permissions && pod-install &&
