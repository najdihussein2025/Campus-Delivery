import AsyncStorage from '@react-native-async-storage/async-storage';
import localData from '../data/campus.json';

// Leave empty to use the local JSON. With json-server: 'http://<laptop-ip>:3000'
export const API_URL = '';

const COLLECTIONS = ['campuses', 'stores', 'products', 'buildings', 'deliverySlots', 'printPrices', 'couriers', 'faculties', 'seasons', 'uaRegistry', 'calendar'];
const CACHE_KEY = 'campusgo:catalogCache';

// Upgrade only IDs with an explicit match in the bundled mock registry.
const mockIds = new Map(localData.uaRegistry.map(({ legacyId, id }) => [legacyId, id]));
const legacyIds = new Map(localData.uaRegistry.map(({ legacyId, id }) => [id, legacyId]));
const upgradeMockRegistry = (data) => {
  const records = data.uaRegistry;
  if (!Array.isArray(records)) return { ...data, uaRegistry: localData.uaRegistry };
  const ids = new Set(records.map(({ id }) => id));
  return {
    ...data,
    uaRegistry: records.flatMap((record) => {
      const id = mockIds.get(record.id);
      if (!id) {
        const legacyId = legacyIds.get(record.id);
        return [legacyId && !record.legacyId ? { ...record, legacyId } : record];
      }
      return ids.has(id) ? [] : [{ ...record, id, legacyId: record.id }];
    }),
  };
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const timeout = (ms) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms));

const fetchCollection = async (name) => {
  const response = await Promise.race([fetch(`${API_URL}/${name}`), timeout(3000)]);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

// The last successful server load is kept so the app can show saved data when offline
const readCache = async () => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const writeCache = async (data) => {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.log('Catalog cache write failed', error.message);
  }
};

// Chapter 19: Promise, async/await and fetch. Fallback order: server -> saved catalog cache -> bundled JSON.
export const loadCampusData = async () => {
  if (!API_URL) {
    await wait(600);
    return localData;
  }
  try {
    const results = await Promise.all(COLLECTIONS.map(fetchCollection));
    const data = {};
    COLLECTIONS.forEach((name, i) => {
      data[name] = results[i];
    });
    const upgraded = upgradeMockRegistry(data);
    writeCache(upgraded);
    return upgraded;
  } catch (error) {
    console.log('API unavailable, using saved data:', error.message);
    const cached = await readCache();
    return cached ? upgradeMockRegistry(cached) : localData;
  }
};
