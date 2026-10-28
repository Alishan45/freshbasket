// Geoapify Geocoding, Reverse Geocoding, Static Maps & Fleet Routing Service
// API Key provided for comprehensive location intelligence
export const GEOAPIFY_API_KEY = '884ee10ba0034a499dacd7a6359821ce';

// Standard FreshBasket Regional Fulfillment & Cold-Chain Hubs
export const FRESHBASKET_HUBS = [
  { id: 'hub-lahore-central', name: 'Central Urban Hub (Gulberg)', city: 'Lahore', lat: 31.5204, lon: 74.3587, address: 'Main Boulevard, Gulberg III, Lahore' },
  { id: 'hub-dha-cantt', name: 'DHA & Cantt Cold-Chain Hub', city: 'Lahore', lat: 31.4756, lon: 74.3792, address: 'Sector Y, Commercial Area, DHA Phase 3' },
  { id: 'hub-johar-town', name: 'Johar Town Express Center', city: 'Lahore', lat: 31.4697, lon: 74.2728, address: 'G-Block, Near Expo Centre, Johar Town' },
  { id: 'hub-islamabad', name: 'Margalla Farm-Direct Center', city: 'Islamabad', lat: 33.6844, lon: 73.0479, address: 'Blue Area, Islamabad' },
  { id: 'hub-karachi', name: 'Clifton Fresh Produce Terminal', city: 'Karachi', lat: 24.8607, lon: 67.0011, address: 'Boat Basin, Clifton Block 5, Karachi' }
];

/**
 * Haversine formula to calculate geodesic distance in Kilometers
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Find the closest FreshBasket hub to given coordinates
 */
export function getNearestHub(lat = 31.5204, lon = 74.3587) {
  let closest = FRESHBASKET_HUBS[0];
  let minDistance = calculateDistanceKm(lat, lon, closest.lat, closest.lon);

  for (const hub of FRESHBASKET_HUBS) {
    const dist = calculateDistanceKm(lat, lon, hub.lat, hub.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = hub;
    }
  }

  // Estimated dispatch & delivery duration in minutes (avg 18 km/h urban speed + 10 min packing)
  const estimatedMins = Math.max(15, Math.min(60, Math.round(10 + minDistance * 3)));

  return {
    ...closest,
    distanceKm: minDistance,
    estimatedMins,
    isWithinExpressRadius: minDistance <= 25
  };
}

/**
 * Generate Geoapify Static Map URL for doorstep address preview
 */
export function getStaticMapUrl({ lat, lon, zoom = 14, width = 600, height = 300, markerColor = '%2316a34a' }) {
  if (!lat || !lon) {
    lat = 31.5204;
    lon = 74.3587;
  }
  return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=${width}&height=${height}&center=lonlat:${lon},${lat}&zoom=${zoom}&marker=lonlat:${lon},${lat};color:${markerColor};size:medium&apiKey=${GEOAPIFY_API_KEY}`;
}

/**
 * Generate Dual-Marker Map URL (Hub -> Courier -> Doorstep)
 */
export function getDeliveryRouteMapUrl({ hubLat, hubLon, userLat, userLon, width = 700, height = 320 }) {
  const hLat = hubLat || 31.5204;
  const hLon = hubLon || 74.3587;
  const uLat = userLat || 31.4756;
  const uLon = userLon || 74.3792;

  const centerLat = (hLat + uLat) / 2;
  const centerLon = (hLon + uLon) / 2;

  return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=${width}&height=${height}&center=lonlat:${centerLon},${centerLat}&zoom=12&marker=lonlat:${hLon},${hLat};color:%232563eb;size:medium;text:H|lonlat:${uLon},${uLat};color:%2316a34a;size:medium;text:D&apiKey=${GEOAPIFY_API_KEY}`;
}

/**
 * Reverse geocode latitude & longitude to human-readable street address & city
 */
export async function reverseGeocode(lat, lon) {
  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`Geoapify error: ${res.statusText}`);
    const data = await res.json();

    if (data.features && data.features.length > 0) {
      const prop = data.features[0].properties;
      const nearestHub = getNearestHub(lat, lon);

      const result = {
        formatted: prop.formatted || `${prop.city || 'Your Area'}, ${prop.country || ''}`,
        street: prop.street ? `${prop.housenumber ? prop.housenumber + ' ' : ''}${prop.street}` : '',
        suburb: prop.suburb || prop.district || prop.neighbourhood || '',
        city: prop.city || prop.county || 'Lahore',
        state: prop.state || 'Punjab',
        postcode: prop.postcode || '',
        country: prop.country || 'Pakistan',
        lat,
        lon,
        nearestHub
      };

      try {
        localStorage.setItem('freshbasket_user_location', JSON.stringify(result));
      } catch (e) {}

      return result;
    }
    throw new Error('No location found for coordinates');
  } catch (error) {
    console.error('Geoapify reverse geocode failed:', error);
    throw error;
  }
}

/**
 * Search / autocomplete address string using Geoapify
 */
export async function searchAddress(text) {
  if (!text || text.trim().length < 2) return [];
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text.trim())}&apiKey=${GEOAPIFY_API_KEY}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`Geoapify search error: ${res.statusText}`);
    const data = await res.json();

    if (data.features && Array.isArray(data.features)) {
      return data.features.map(f => {
        const p = f.properties;
        return {
          formatted: p.formatted,
          street: p.street ? `${p.housenumber ? p.housenumber + ' ' : ''}${p.street}` : p.name || '',
          suburb: p.suburb || p.district || '',
          city: p.city || p.county || '',
          postcode: p.postcode || '',
          state: p.state || '',
          country: p.country || '',
          lat: p.lat,
          lon: p.lon
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Geoapify address search failed:', error);
    return [];
  }
}

/**
 * Request browser geolocation and reverse-geocode into current delivery location
 */
export async function detectCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const fallback = getDefaultLocation();
      resolve(fallback);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const loc = await reverseGeocode(latitude, longitude);
          resolve(loc);
        } catch (err) {
          resolve(getDefaultLocation());
        }
      },
      (err) => {
        console.warn('Geolocation permission not granted, using verified hub default:', err.message);
        resolve(getDefaultLocation());
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}

function getDefaultLocation() {
  const fallback = {
    formatted: 'Gulberg III, Lahore, Punjab',
    street: 'Main Boulevard, Gulberg',
    suburb: 'Gulberg III',
    city: 'Lahore',
    state: 'Punjab',
    country: 'Pakistan',
    lat: 31.5204,
    lon: 74.3587,
    nearestHub: getNearestHub(31.5204, 74.3587)
  };
  try {
    localStorage.setItem('freshbasket_user_location', JSON.stringify(fallback));
  } catch (e) {}
  return fallback;
}

/**
 * Get cached user location from localStorage if available
 */
export function getSavedLocation() {
  try {
    const raw = localStorage.getItem('freshbasket_user_location');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
