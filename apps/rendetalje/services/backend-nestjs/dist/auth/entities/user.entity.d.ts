export declare enum UserRole {
    ADMIN = "admin",
    MANAGER = "manager",
    EMPLOYEE = "employee",
    CLIENT = "client"
}
export declare class User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
