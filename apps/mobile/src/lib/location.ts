import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };

/** Cape Town CBD — sensible fallback when GPS is unavailable. */
export const DEFAULT_COORDS: Coords = { latitude: -33.9249, longitude: 18.4241 };

export async function getCurrentCoords(): Promise<Coords> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return DEFAULT_COORDS;
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return DEFAULT_COORDS;
  }
}

export async function reverseGeocode(coords: Coords): Promise<string | null> {
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (!place) return null;
    return [place.name, place.street, place.city, place.region]
      .filter(Boolean)
      .join(', ');
  } catch {
    return null;
  }
}

/**
 * PostGIS geography columns are returned by PostgREST as GeoJSON strings/objects,
 * but our RPCs already return distance_km, so the app rarely parses raw geometry.
 * When we DO need to send a point, we insert a WKT string via the geography cast.
 */
export async function geocodeAddress(address: string): Promise<Coords | null> {
  try {
    const results = await Location.geocodeAsync(address);
    if (results?.length) {
      return { latitude: results[0].latitude, longitude: results[0].longitude };
    }
  } catch {
    // ignore
  }
  return null;
}

export function pointWkt({ latitude, longitude }: Coords): string {
  return `SRID=4326;POINT(${longitude} ${latitude})`;
}
