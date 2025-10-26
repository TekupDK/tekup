"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACKAGE_INFO = exports.BUILD_DATE = exports.PACKAGE_NAME = exports.VERSION = void 0;
__exportStar(require("./types/core"), exports);
__exportStar(require("./types/restaurant"), exports);
__exportStar(require("./schemas/validation"), exports);
__exportStar(require("./utils"), exports);
exports.VERSION = '1.0.0';
exports.PACKAGE_NAME = '@restaurantiq/shared';
exports.BUILD_DATE = new Date().toISOString();
exports.PACKAGE_INFO = {
    name: exports.PACKAGE_NAME,
    version: exports.VERSION,
    description: 'Shared types and utilities for RestaurantIQ platform',
    buildDate: exports.BUILD_DATE,
    targetMarket: 'Denmark',
    locale: 'da-DK',
    currency: 'DKK',
    timezone: 'Europe/Copenhagen',
};
//# sourceMappingURL=index.js.map