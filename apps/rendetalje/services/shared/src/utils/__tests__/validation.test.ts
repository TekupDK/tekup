import { validateEmail, validatePhone, validatePostalCode } from '../validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate Danish phone numbers', () => {
      expect(validatePhone('12345678')).toBe(true);
      expect(validatePhone('+4512345678')).toBe(true);
      expect(validatePhone('12 34 56 78')).toBe(true);
      expect(validatePhone('+45 12 34 56 78')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('1234')).toBe(false);
      expect(validatePhone('abcdefgh')).toBe(false);
      expect(validatePhone('+1234567890')).toBe(false); // Non-Danish
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('validatePostalCode', () => {
    it('should validate Danish postal codes', () => {
      expect(validatePostalCode('1234')).toBe(true);
      expect(validatePostalCode('8000')).toBe(true);
      expect(validatePostalCode('2100')).toBe(true);
    });

    it('should reject invalid postal codes', () => {
      expect(validatePostalCode('123')).toBe(false); // Too short
      expect(validatePostalCode('12345')).toBe(false); // Too long
      expect(validatePostalCode('abcd')).toBe(false); // Non-numeric
      expect(validatePostalCode('')).toBe(false);
    });
  });
});