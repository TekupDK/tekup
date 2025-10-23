"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserProfileSchema = exports.RegisterSchema = exports.LoginSchema = exports.UserSchema = exports.UserRole = void 0;
const zod_1 = require("zod");
// User Roles
var UserRole;
(function (UserRole) {
    UserRole["OWNER"] = "owner";
    UserRole["ADMIN"] = "admin";
    UserRole["EMPLOYEE"] = "employee";
    UserRole["CUSTOMER"] = "customer";
})(UserRole || (exports.UserRole = UserRole = {}));
// User Schema
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    organizationId: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1),
    role: zod_1.z.nativeEnum(UserRole),
    phone: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().url().optional(),
    settings: zod_1.z.record(zod_1.z.any()).default({}),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// Authentication
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6)
});
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(1),
    phone: zod_1.z.string().optional()
});
// User Profile Update
exports.UpdateUserProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    phone: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().url().optional(),
    settings: zod_1.z.record(zod_1.z.any()).optional()
});
