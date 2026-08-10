import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'bassir.serverUrl';
let cachedUrl;

export async function getServerUrl() {
  if (cachedUrl === undefined) {
    cachedUrl = (await AsyncStorage.getItem(KEY)) || null;
  }
  return cachedUrl;
}

export async function setServerUrl(url) {
  const clean = String(url || '').trim().replace(/\/+$/, '');
  cachedUrl = clean || null;
  if (clean) await AsyncStorage.setItem(KEY, clean);
  else await AsyncStorage.removeItem(KEY);
  return cachedUrl;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const base = await getServerUrl();
  if (!base) throw new ApiError('No server configured', 0);
  let res;
  try {
    res = await fetch(base + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
  } catch (e) {
    throw new ApiError('Cannot reach the portal server', 0);
  }
  if (!res.ok) {
    let message = `Server error (HTTP ${res.status})`;
    try {
      const body = await res.json();
      if (body && body.error) message = body.error;
    } catch {}
    throw new ApiError(message, res.status);
  }
  return res.json();
}
