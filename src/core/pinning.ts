import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { AppError } from './errors';
import { getApiUrl } from './config';
import pins from '../../config/pinning.json';

let initialization: Promise<void> | undefined;

/** Called before the first API request, never falls back on pin mismatch. */
export async function ensurePinnedTransport() {
  if (Platform.OS === 'web') return; // Browsers own their TLS stack; no native security claim.
  if (!initialization) initialization = initialize();
  await initialization;
}

async function initialize() {
  if (__DEV__ && Constants.executionEnvironment === 'storeClient') return;
  const hostname = new URL(getApiUrl()).hostname;
  const qa = Constants.expoConfig?.android?.package === 'com.econolab.mobile.qa' && Constants.expoConfig?.extra?.nativeQa === true;
  if (hostname !== pins.hostname && !(qa && hostname === '10.0.2.2')) throw new AppError('configuration', 'La dirección del servicio no coincide con la configuración de seguridad.');
  // Conditional loading keeps Expo Go usable; a native release always requires the module.
  let native: typeof import('react-native-ssl-public-key-pinning');
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    native = require('react-native-ssl-public-key-pinning') as typeof import('react-native-ssl-public-key-pinning');
  } catch {
    throw new AppError('configuration', 'Esta versión necesita una instalación actualizada de Econolab.');
  }
  const { initializeSslPinning, isSslPinningAvailable } = native;
  if (!isSslPinningAvailable()) throw new AppError('configuration', 'Esta versión necesita una instalación actualizada de Econolab.');
  const publicKeyHashes = qa ? [String(Constants.expoConfig?.extra?.qaPin), 'mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c='] : pins.publicKeyHashes;
  if (publicKeyHashes.length < 2 || publicKeyHashes.some(pin => !/^[A-Za-z0-9+/]{43}=$/.test(pin))) {
    throw new AppError('configuration', 'No pudimos verificar la configuración de seguridad del servicio.');
  }
  try {
    await initializeSslPinning({ [hostname]: { includeSubdomains: false, publicKeyHashes } });
  } catch {
    throw new AppError('configuration', 'No pudimos activar la conexión segura. Actualiza la app o contacta a soporte.');
  }
}
