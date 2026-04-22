import { geocodeAddress, reverseGeocode } from '@/utils/geocoding';

global.fetch = jest.fn();
const mockFetch = fetch as jest.Mock;

beforeEach(() => jest.resetAllMocks());

describe('geocodeAddress', () => {
    it('returns coordinates when the API responds with a result', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => [{ lat: '51.5074', lon: '-0.1278' }],
        });

        const result = await geocodeAddress('London');

        expect(result).toEqual({ latitude: 51.5074, longitude: -0.1278 });
    });

    it('returns null when the response is not ok', async () => {
        mockFetch.mockResolvedValue({ ok: false });

        expect(await geocodeAddress('London')).toBeNull();
    });

    it('returns null when results array is empty', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

        expect(await geocodeAddress('nowhere')).toBeNull();
    });

    it('returns null on network error', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        expect(await geocodeAddress('London')).toBeNull();
    });
});

describe('reverseGeocode', () => {
    it('returns "suburb, city" when both are present', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ address: { suburb: 'Battersea', city: 'London' } }),
        });

        expect(await reverseGeocode(51.4816, -0.1484)).toBe('Battersea, London');
    });

    it('returns just the city when there is no suburb', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ address: { city: 'London' } }),
        });

        expect(await reverseGeocode(51.5074, -0.1278)).toBe('London');
    });

    it('falls back to first two display_name parts when address has no suburb or city', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                address: {},
                display_name: 'Some Place, Greater London, England',
            }),
        });

        expect(await reverseGeocode(51.5074, -0.1278)).toBe('Some Place, Greater London');
    });

    it('returns coordinate string when response is not ok', async () => {
        mockFetch.mockResolvedValue({ ok: false });

        expect(await reverseGeocode(51.5074, -0.1278)).toBe('51.5074, -0.1278');
    });

    it('returns coordinate string on network error', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        expect(await reverseGeocode(51.5074, -0.1278)).toBe('51.5074, -0.1278');
    });
});
