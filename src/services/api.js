import localData from '../data/campus.json';

// Leave empty to use the local JSON. With json-server: 'http://<laptop-ip>:3000'
export const API_URL = '';

const COLLECTIONS = ['campuses', 'stores', 'products', 'buildings', 'deliverySlots', 'printPrices', 'couriers', 'faculties'];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const timeout = (ms) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms));

const fetchCollection = async (name) => {
  const response = await Promise.race([fetch(`${API_URL}/${name}`), timeout(3000)]);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

// Chapter 19: Promise, async/await and fetch, with a safe fallback to the local JSON
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
    return data;
  } catch (error) {
    console.log('API unavailable, using local data:', error.message);
    return localData;
  }
};
