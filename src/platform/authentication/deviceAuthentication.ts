import * as LocalAuthentication from 'expo-local-authentication';

export type DeviceAuthenticationAvailability = {
  level: LocalAuthentication.SecurityLevel;
  hasBiometricHardware: boolean;
  hasEnrolledBiometrics: boolean;
  canAuthenticate: boolean;
};

export type DeviceAuthenticationCopy = {
  promptMessage: string;
  promptDescription: string;
  cancelLabel: string;
  fallbackLabel: string;
};

export async function getDeviceAuthenticationAvailability(): Promise<DeviceAuthenticationAvailability> {
  const [level, hasBiometricHardware, hasEnrolledBiometrics] =
    await Promise.all([
      LocalAuthentication.getEnrolledLevelAsync(),
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);

  return {
    level,
    hasBiometricHardware,
    hasEnrolledBiometrics,
    canAuthenticate: level !== LocalAuthentication.SecurityLevel.NONE,
  };
}

export async function authenticateDevice(
  copy: DeviceAuthenticationCopy,
): Promise<LocalAuthentication.LocalAuthenticationResult> {
  return LocalAuthentication.authenticateAsync({
    promptMessage: copy.promptMessage,
    promptDescription: copy.promptDescription,
    cancelLabel: copy.cancelLabel,
    fallbackLabel: copy.fallbackLabel,
    disableDeviceFallback: false,
    biometricsSecurityLevel: 'strong',
  });
}
