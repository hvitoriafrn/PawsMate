import { calculateDistance, formatDistance } from '@/utils/distance';

//  calculateDistance 
describe('calculateDistance', () => {
    it('returns 0 for the same point', () => {
        expect(calculateDistance(51.5074, -0.1278, 51.5074, -0.1278)).toBe(0);
    });

    it('is symmetric — A→B equals B→A', () => {
        const ab = calculateDistance(51.5074, -0.1278, 53.4808, -2.2426);
        const ba = calculateDistance(53.4808, -2.2426, 51.5074, -0.1278);
        expect(ab).toBeCloseTo(ba, 5);
    });

    it('returns the correct distance between London and Manchester (~262 km)', () => {
        const dist = calculateDistance(51.5074, -0.1278, 53.4808, -2.2426);
        expect(dist).toBeGreaterThan(255);
        expect(dist).toBeLessThan(270);
    });

    it('returns the correct distance between London and Paris (~341 km)', () => {
        const dist = calculateDistance(51.5074, -0.1278, 48.8566, 2.3522);
        expect(dist).toBeGreaterThan(330);
        expect(dist).toBeLessThan(350);
    });

    it('returns a positive number for any two different points', () => {
        expect(calculateDistance(0, 0, 1, 1)).toBeGreaterThan(0);
    });
});

// formatDistance 

describe('formatDistance', () => {
    it('shows metres when distance is under 1 km', () => {
        expect(formatDistance(0.5)).toBe('500m away');
        expect(formatDistance(0.1)).toBe('100m away');
    });

    it('shows one decimal place when distance is between 1 and 10 km', () => {
        expect(formatDistance(1.0)).toBe('1.0km away');
        expect(formatDistance(5.3)).toBe('5.3km away');
        expect(formatDistance(9.9)).toBe('9.9km away');
    });

    it('rounds to a whole number when distance is 10 km or more', () => {
        expect(formatDistance(10)).toBe('10km away');
        expect(formatDistance(15.7)).toBe('16km away');
        expect(formatDistance(262)).toBe('262km away');
    });
});
