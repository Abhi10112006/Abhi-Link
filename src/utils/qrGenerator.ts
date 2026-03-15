import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';
import ViewShot from 'react-native-view-shot';

/**
 * Captures a ViewShot ref as a PNG and shares it via the native share sheet.
 */
export const handleShare = async (
  viewShotRef: React.RefObject<ViewShot>,
  amount: string,
  payeeName: string,
  remarks: string,
  upiId: string,
  _onlyImage: boolean = false,
): Promise<void> => {
  if (!viewShotRef.current) return;
  try {
    const uri = await (viewShotRef.current as any).capture();
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: payeeName
          ? `Pay ${payeeName}${amount ? ` ₹${amount}` : ''}`
          : 'ABHI LINK Payment QR',
      });
    } else {
      Alert.alert('Sharing not available', 'Your device does not support sharing.');
    }
  } catch (err: any) {
    if (err?.message !== 'User canceled') {
      console.error('Error sharing QR:', err);
    }
  }
};

/**
 * Captures a ViewShot ref as a PNG and saves it to the device media library.
 */
export const handleDownload = async (
  viewShotRef: React.RefObject<ViewShot>,
  amount: string,
  _payeeName: string,
  _remarks: string,
): Promise<void> => {
  if (!viewShotRef.current) return;
  try {
    const uri = await (viewShotRef.current as any).capture();
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please grant photo library permission to save QR codes.',
        );
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      const cleanAmount = amount ? amount.replace(/,/g, '') : '';
      Alert.alert(
        'Saved!',
        `QR code${cleanAmount ? ` for ₹${cleanAmount}` : ''} saved to your photos.`,
      );
    } else {
      // Web fallback via sharing
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      }
    }
  } catch (err) {
    console.error('Error saving QR:', err);
    Alert.alert('Error', 'Could not save the QR code. Please try again.');
  }
};
