"use strict";
// Formatting utilities for RendetaljeOS
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = exports.generateJobNumber = exports.formatJobNumber = exports.formatPhoneNumber = exports.formatDuration = exports.formatDateTime = exports.formatDate = exports.formatCurrency = void 0;
const formatCurrency = (amount, currency = 'DKK') => {
    return new Intl.NumberFormat('da-DK', {
        style: 'currency',
        currency,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
const formatDate = (date, locale = 'da-DK') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(dateObj);
};
exports.formatDate = formatDate;
const formatDateTime = (date, locale = 'da-DK') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(dateObj);
};
exports.formatDateTime = formatDateTime;
const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) {
        return `${remainingMinutes} min`;
    }
    if (remainingMinutes === 0) {
        return `${hours} t`;
    }
    return `${hours} t ${remainingMinutes} min`;
};
exports.formatDuration = formatDuration;
const formatPhoneNumber = (phone) => {
    // Format Danish phone numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('45') && cleaned.length === 10) {
        // International format
        return `+45 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
    }
    if (cleaned.length === 8) {
        // National format
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
    }
    return phone; // Return original if format not recognized
};
exports.formatPhoneNumber = formatPhoneNumber;
const formatJobNumber = (jobNumber) => {
    // Format job numbers for display
    return jobNumber.replace(/^JOB-/, '').replace(/-/g, ' ');
};
exports.formatJobNumber = formatJobNumber;
const generateJobNumber = (date = new Date()) => {
    const year = date.getFullYear();
    const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const sequence = Math.floor(Math.random() * 9999) + 1;
    return `JOB-${year}-${dayOfYear.toString().padStart(3, '0')}-${sequence.toString().padStart(4, '0')}`;
};
exports.generateJobNumber = generateJobNumber;
const slugify = (text) => {
    return text
        .toLowerCase()
        .replace(/[æ]/g, 'ae')
        .replace(/[ø]/g, 'oe')
        .replace(/[å]/g, 'aa')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.slugify = slugify;
