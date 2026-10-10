export interface LocationDetails {
  latitude: string;
  longitude: string;
  manufacturingLocation?: string;
  manufacturingAddress?: string;
  manufacturingCity?: string;
  manufacturingState?: string;
  manufacturingCountry?: string;
  manufacturingPostalCode?: string;
  source: 'gps' | 'ip' | 'manual';
  accuracy?: number;
}

/**
 * Fetch automatic location details:
 * 1. Attempts high-accuracy browser Geolocation API
 * 2. Reverse-geocodes coordinates to street, city, country, etc.
 * 3. Falls back to IP-based geolocation if browser GPS is denied or unavailable
 */
export async function detectAutomaticLocation(): Promise<LocationDetails> {
  // Step 1: Attempt browser GPS geolocation
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000,
        });
      });

      const lat = position.coords.latitude.toFixed(6);
      const lon = position.coords.longitude.toFixed(6);

      // Attempt reverse geocoding from backend endpoint
      try {
        const reverseRes = await fetch(
          `/api/geolocation/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
          { signal: AbortSignal.timeout(6000) },
        );

        if (reverseRes.ok) {
          const revData = await reverseRes.json();
          if (revData.success) {
            return {
              latitude: lat,
              longitude: lon,
              manufacturingLocation: revData.locationName || '',
              manufacturingAddress: revData.address || '',
              manufacturingCity: revData.city || '',
              manufacturingState: revData.state || '',
              manufacturingCountry: revData.country || '',
              manufacturingPostalCode: revData.postalCode || '',
              source: 'gps',
              accuracy: position.coords.accuracy,
            };
          }
        }
      } catch (revError) {
        console.warn('Reverse geocode via backend failed, trying direct client lookup:', revError);
      }

      // Client-side reverse geocode fallback
      try {
        const clientRev = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
          {
            headers: { 'User-Agent': 'OpenELabel/1.0' },
            signal: AbortSignal.timeout(5000),
          },
        );
        if (clientRev.ok) {
          const cData = await clientRev.json();
          const addr = cData.address || {};
          const city = addr.city || addr.town || addr.village || addr.municipality || '';
          const state = addr.state || addr.region || '';
          const country = addr.country || '';
          const postal = addr.postcode || '';
          const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
          const formattedAddress = [street, city, state, postal, country].filter(Boolean).join(', ');

          return {
            latitude: lat,
            longitude: lon,
            manufacturingLocation: addr.winery || addr.amenity || (city ? `${city} Production Site` : ''),
            manufacturingAddress: formattedAddress || cData.display_name || '',
            manufacturingCity: city,
            manufacturingState: state,
            manufacturingCountry: country,
            manufacturingPostalCode: postal,
            source: 'gps',
            accuracy: position.coords.accuracy,
          };
        }
      } catch (cErr) {
        console.warn('Direct reverse geocoding failed:', cErr);
      }

      // Return GPS coordinates even if reverse geocoding was unavailable
      return {
        latitude: lat,
        longitude: lon,
        source: 'gps',
        accuracy: position.coords.accuracy,
      };
    } catch (gpsError) {
      console.warn('Browser geolocation denied or timed out, trying IP fallback:', gpsError);
    }
  }

  // Step 2: Fallback to IP geolocation
  try {
    const ipRes = await fetch('/api/geolocation/detect', {
      signal: AbortSignal.timeout(6000),
    });
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (ipData.success) {
        return {
          latitude: ipData.latitude || '',
          longitude: ipData.longitude || '',
          manufacturingLocation: ipData.locationName || '',
          manufacturingAddress: ipData.address || '',
          manufacturingCity: ipData.city || '',
          manufacturingState: ipData.state || '',
          manufacturingCountry: ipData.country || '',
          manufacturingPostalCode: ipData.postalCode || '',
          source: 'ip',
        };
      }
    }
  } catch (ipError) {
    console.warn('Backend IP detection failed, trying direct ipapi.co:', ipError);
  }

  // Step 3: Direct ipapi.co fallback from browser
  try {
    const directIp = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000),
    });
    if (directIp.ok) {
      const data = await directIp.json();
      return {
        latitude: data.latitude ? String(data.latitude) : '',
        longitude: data.longitude ? String(data.longitude) : '',
        manufacturingLocation: data.city ? `${data.city} Facility` : '',
        manufacturingAddress: [data.city, data.region, data.country_name].filter(Boolean).join(', '),
        manufacturingCity: data.city || '',
        manufacturingState: data.region || '',
        manufacturingCountry: data.country_name || data.country || '',
        manufacturingPostalCode: data.postal || '',
        source: 'ip',
      };
    }
  } catch (directIpErr) {
    console.warn('Direct IP geolocation failed:', directIpErr);
  }

  throw new Error('Unable to automatically detect location. Please enter details manually.');
}

/**
 * Forward geocoding: Lookup latitude and longitude from an address query
 */
export async function searchCoordinatesFromAddress(query: string): Promise<{
  latitude: string;
  longitude: string;
  displayName: string;
} | null> {
  if (!query || !query.trim()) return null;

  try {
    const res = await fetch(`/api/geolocation/search?q=${encodeURIComponent(query.trim())}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.latitude && data.longitude) {
        return {
          latitude: String(data.latitude),
          longitude: String(data.longitude),
          displayName: data.displayName || query,
        };
      }
    }
  } catch (err) {
    console.warn('Backend geocode search failed, trying Nominatim directly:', err);
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query.trim())}&limit=1`,
      { headers: { 'User-Agent': 'OpenELabel/1.0' } },
    );
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        return {
          latitude: String(list[0].lat),
          longitude: String(list[0].lon),
          displayName: list[0].display_name,
        };
      }
    }
  } catch (err) {
    console.warn('Direct geocode search failed:', err);
  }

  return null;
}
