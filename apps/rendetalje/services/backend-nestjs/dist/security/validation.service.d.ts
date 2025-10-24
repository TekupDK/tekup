export declare class ValidationService {
    sanitizeHtml(input: string): string;
    sanitizeText(input: string): string;
    validateEmail(email: string): {
        isValid: boolean;
        sanitized: string;
    };
    validatePhoneNumber(phone: string): {
        isValid: boolean;
        sanitized: string;
    };
    validatePostalCode(postalCode: string): {
        isValid: boolean;
        sanitized: string;
    };
    validateUrl(url: string): {
        isValid: boolean;
        sanitized: string;
    };
    validateFileName(fileName: string): {
        isValid: boolean;
        sanitized: string;
    };
    validateSqlInput(input: string): {
        isValid: boolean;
        sanitized: string;
    };
    validateJson(input: string): {
        isValid: boolean;
        parsed: any;
    };
    validatePassword(password: string): {
        isValid: boolean;
        score: number;
        feedback: string[];
    };
    sanitizeObject(obj: any, maxDepth?: number): any;
}
