// Geocoding utilities using Nominatim (OpenStreetMap) so no API key needed
// Docs: https://nominatim.openstreetmap.org

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Required by Nominatim's usage policy
const HEADERS = {
    'User-Agent': 'PawsMate/1.0 (final year project)',
    'Accept-Language': 'en',
};

// Forward geocode a place name into { latitude, longitude }
// Returns null if not found or on network error
export const geocodeAddress = async (
    address: string
): Promise<{ latitude: number; longitude: number } | null> => {
    try {
        const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
        const response = await fetch(url, { headers: HEADERS });

        if (!response.ok) return null;

        const results = await response.json();

        if (!Array.isArray(results) || results.length === 0) return null;

        const { lat, lon } = results[0];
        return {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
        };
    } catch (error) {
        console.error('geocodeAddress error:', error);
        return null;
    }
};

// Reverse geocode coordinates into a readable string like "Battersea, London"
// Falls back to a coordinate string if geocoding fails
export const reverseGeocode = async (
    latitude: number,
    longitude: number
): Promise<string> => {
    const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    try {
        const url = `${NOMINATIM_BASE}/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        const response = await fetch(url, { headers: HEADERS });

        if (!response.ok) return fallback;

        const data = await response.json();

        if (!data?.address) return fallback;

        const { address } = data;

        // Build short, readable string from the most useful parts
        const suburb = address.suburb || address.neighbourhood || address.quarter;
        const city = address.city || address.town || address.village || address.county;

        if (suburb && city) return `${suburb}, ${city}`;
        if (city) return city;

        // Last resort, trim the full display_name to the first two parts
        if (data.display_name) {
            const parts = (data.display_name as string).split(',');
            return parts.slice(0, 2).join(',').trim();
        }

        return fallback;

    } catch (error) {
        console.error('reverseGeocode error:', error);
        return fallback;
    }
};
