export declare class SuccessResponseDto<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    timestamp?: string;
    constructor(data?: T, message?: string);
}
export declare class ErrorResponseDto {
    success: boolean;
    error: string;
    message: string;
    details?: string[];
    statusCode: number;
    timestamp: string;
    path: string;
    constructor(error: string, message: string, statusCode: number, path: string, details?: string[]);
}
