/**
 * Godabaya Tailor — Web-Compatible Alert
 * 
 * react-native-web mengosongkan implementasi Alert (tidak menampilkan apa-apa).
 * Wrapper ini mempertahankan perilaku native di Android/iOS, dan menyediakan
 * pengganti yang berfungsi di web (window.alert / window.confirm).
 */

import { Alert as RNAlert, AlertButton, AlertOptions, Platform } from 'react-native';

function isCancelButton(button: AlertButton): boolean {
  return button.text === 'Batal' || button.text === 'Cancel' || button.style === 'cancel';
}

function showWebAlert(title: string, message?: string, buttons?: AlertButton[], _options?: AlertOptions): void {
  const text = [title, message].filter(Boolean).join('\n\n') || '';

  const hasButtons = Array.isArray(buttons) && buttons.length > 0;
  const confirmButton = hasButtons ? buttons!.find((b) => !isCancelButton(b)) : undefined;

  if (hasButtons && confirmButton) {
    if (typeof window !== 'undefined' && window.confirm(text)) {
      confirmButton.onPress?.();
    }
    return;
  }

  if (typeof window !== 'undefined') {
    window.alert(text);
  }
}

export function alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions): void {
  if (Platform.OS === 'web') {
    showWebAlert(title, message, buttons, options);
    return;
  }
  RNAlert.alert(title, message, buttons, options);
}

export const Alert = { alert };
