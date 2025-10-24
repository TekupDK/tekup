import { formatCurrency, formatDate, formatPhoneNumber } from "../formatting";

describe("Formatting Utils", () => {
  describe("formatCurrency", () => {
    it("should format currency with Danish locale", () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain("1");
      expect(result).toContain("234");
      expect(result).toContain("56");
      expect(result).toContain("kr");
    });

    it("should handle zero", () => {
      const result = formatCurrency(0);
      expect(result).toContain("0");
      expect(result).toContain("kr");
    });

    it("should handle negative numbers", () => {
      const result = formatCurrency(-1234.56);
      expect(result).toContain("-");
      expect(result).toContain("1");
      expect(result).toContain("234");
    });

    it("should round to 2 decimals", () => {
      const result = formatCurrency(1234.567);
      expect(result).toContain("57"); // Rounded
    });
  });

  describe("formatDate", () => {
    it("should format date to Danish locale", () => {
      const date = new Date("2025-10-24T12:00:00Z");
      const formatted = formatDate(date);
      expect(formatted).toMatch(/24\./); // Day should be 24
    });

    it("should handle string dates", () => {
      const formatted = formatDate("2025-10-24");
      expect(formatted).toBeTruthy();
    });

    it("should throw error for invalid date", () => {
      expect(() => formatDate("invalid-date")).toThrow();
    });
  });

  describe("formatPhoneNumber", () => {
    it("should format Danish phone number", () => {
      expect(formatPhoneNumber("12345678")).toBe("12 34 56 78");
    });

    it("should handle phone with country code", () => {
      expect(formatPhoneNumber("+4512345678")).toBe("+45 12 34 56 78");
    });

    it("should handle phone with spaces", () => {
      const result = formatPhoneNumber("12 34 56 78");
      expect(result).toContain("12");
      expect(result).toContain("34");
      expect(result).toContain("56");
      expect(result).toContain("78");
    });

    it("should handle unrecognized format", () => {
      expect(formatPhoneNumber("abc")).toBe("abc"); // Returns original
    });
  });
});
