"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DANISH_CONSTANTS = exports.groupByDanish = exports.sortByDanish = exports.truncateText = exports.createDanishSlug = exports.capitalizeDanish = exports.calculateWorkingHours = exports.calculateMarginPercentage = exports.calculateNetFromGross = exports.calculateDanishMOMS = exports.formatDanishPhone = exports.validateDanishPhone = exports.validateDanishCVR = exports.isDanishHoliday = exports.getDanishWeekday = exports.formatDanishDateTime = exports.formatDanishDate = exports.getDanishToday = exports.getDanishNow = exports.parseDanishCurrency = exports.formatDanishCurrency = exports.kronerToOre = exports.oreToKroner = void 0;
const oreToKroner = (ore) => {
    return ore / 100;
};
exports.oreToKroner = oreToKroner;
const kronerToOre = (kroner) => {
    return Math.round(kroner * 100);
};
exports.kronerToOre = kronerToOre;
const formatDanishCurrency = (ore, showDecimals = true) => {
    const kroner = (0, exports.oreToKroner)(ore);
    if (!showDecimals && kroner % 1 === 0) {
        return `${kroner.toLocaleString('da-DK')} kr`;
    }
    return `${kroner.toLocaleString('da-DK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} kr`;
};
exports.formatDanishCurrency = formatDanishCurrency;
const parseDanishCurrency = (currencyString) => {
    const normalized = currencyString
        .replace(/\s*kr\s*/gi, '')
        .replace(/\./g, '')
        .replace(',', '.');
    const kroner = parseFloat(normalized);
    if (isNaN(kroner)) {
        throw new Error(`Invalid currency format: ${currencyString}`);
    }
    return (0, exports.kronerToOre)(kroner);
};
exports.parseDanishCurrency = parseDanishCurrency;
const getDanishNow = () => {
    return new Date().toLocaleString('sv-SE', {
        timeZone: 'Europe/Copenhagen',
    }).replace(' ', 'T') + 'Z';
};
exports.getDanishNow = getDanishNow;
const getDanishToday = () => {
    return new Date().toLocaleDateString('sv-SE', {
        timeZone: 'Europe/Copenhagen',
    });
};
exports.getDanishToday = getDanishToday;
const formatDanishDate = (dateString) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('da-DK', {
        timeZone: 'Europe/Copenhagen',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};
exports.formatDanishDate = formatDanishDate;
const formatDanishDateTime = (dateTimeString) => {
    const date = typeof dateTimeString === 'string' ? new Date(dateTimeString) : dateTimeString;
    const dateStr = date.toLocaleDateString('da-DK', {
        timeZone: 'Europe/Copenhagen',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('da-DK', {
        timeZone: 'Europe/Copenhagen',
        hour: '2-digit',
        minute: '2-digit',
    });
    return `${dateStr} kl. ${timeStr}`;
};
exports.formatDanishDateTime = formatDanishDateTime;
const getDanishWeekday = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('da-DK', {
        timeZone: 'Europe/Copenhagen',
        weekday: 'long',
    });
};
exports.getDanishWeekday = getDanishWeekday;
const isDanishHoliday = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const fixedHolidays = [
        '01-01',
        '06-05',
        '12-24',
        '12-25',
        '12-26',
        '12-31',
    ];
    const dateStr = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
    if (fixedHolidays.includes(dateStr)) {
        return true;
    }
    const easterDates = getEasterDates(year);
    const currentDate = dateObj.getTime();
    return easterDates.some(easterDate => easterDate.getTime() === currentDate);
};
exports.isDanishHoliday = isDanishHoliday;
function getEasterDates(year) {
    const easter = new Date(year, 3, 20);
    return [
        new Date(easter.getTime() - 7 * 24 * 60 * 60 * 1000),
        new Date(easter.getTime() - 3 * 24 * 60 * 60 * 1000),
        new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000),
        easter,
        new Date(easter.getTime() + 1 * 24 * 60 * 60 * 1000),
        new Date(easter.getTime() + 26 * 24 * 60 * 60 * 1000),
        new Date(easter.getTime() + 39 * 24 * 60 * 60 * 1000),
        new Date(easter.getTime() + 49 * 24 * 60 * 60 * 1000),
        new Date(easter.getTime() + 50 * 24 * 60 * 60 * 1000),
    ];
}
const validateDanishCVR = (cvr) => {
    const cleanCVR = cvr.replace(/\s/g, '');
    if (!/^\d{8}$/.test(cleanCVR)) {
        return false;
    }
    const weights = [2, 7, 6, 1, 2, 7, 6, 1];
    let sum = 0;
    for (let i = 0; i < 8; i++) {
        sum += parseInt(cleanCVR[i]) * weights[i];
    }
    return sum % 11 === 0;
};
exports.validateDanishCVR = validateDanishCVR;
const validateDanishPhone = (phone) => {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return /^(\+45)?\d{8}$/.test(cleanPhone);
};
exports.validateDanishPhone = validateDanishPhone;
const formatDanishPhone = (phone) => {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.startsWith('+45')) {
        const number = cleanPhone.substring(3);
        return `+45 ${number.substring(0, 2)} ${number.substring(2, 4)} ${number.substring(4, 6)} ${number.substring(6, 8)}`;
    }
    else if (cleanPhone.length === 8) {
        return `+45 ${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 4)} ${cleanPhone.substring(4, 6)} ${cleanPhone.substring(6, 8)}`;
    }
    return phone;
};
exports.formatDanishPhone = formatDanishPhone;
const calculateDanishMOMS = (netAmount, vatRate = 25) => {
    return Math.round(netAmount * (vatRate / 100));
};
exports.calculateDanishMOMS = calculateDanishMOMS;
const calculateNetFromGross = (grossAmount, vatRate = 25) => {
    return Math.round(grossAmount / (1 + vatRate / 100));
};
exports.calculateNetFromGross = calculateNetFromGross;
const calculateMarginPercentage = (revenue, cost) => {
    if (revenue === 0)
        return 0;
    return Math.round(((revenue - cost) / revenue) * 100 * 100) / 100;
};
exports.calculateMarginPercentage = calculateMarginPercentage;
const calculateWorkingHours = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
    }
    return (endMinutes - startMinutes) / 60;
};
exports.calculateWorkingHours = calculateWorkingHours;
const capitalizeDanish = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
};
exports.capitalizeDanish = capitalizeDanish;
const createDanishSlug = (text) => {
    return text
        .toLowerCase()
        .replace(/[æåä]/g, 'a')
        .replace(/[øö]/g, 'o')
        .replace(/[é]/g, 'e')
        .replace(/[ü]/g, 'u')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};
exports.createDanishSlug = createDanishSlug;
const truncateText = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 3) + '...';
};
exports.truncateText = truncateText;
const sortByDanish = (array, key, order = 'asc') => {
    const collator = new Intl.Collator('da-DK', {
        sensitivity: 'base',
        numeric: true,
    });
    return [...array].sort((a, b) => {
        const valueA = String(a[key]);
        const valueB = String(b[key]);
        const result = collator.compare(valueA, valueB);
        return order === 'desc' ? -result : result;
    });
};
exports.sortByDanish = sortByDanish;
const groupByDanish = (array, keyFn) => {
    const groups = {};
    for (const item of array) {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
    }
    const sortedGroups = {};
    const sortedKeys = Object.keys(groups).sort((a, b) => new Intl.Collator('da-DK').compare(a, b));
    for (const key of sortedKeys) {
        sortedGroups[key] = groups[key];
    }
    return sortedGroups;
};
exports.groupByDanish = groupByDanish;
exports.DANISH_CONSTANTS = {
    CURRENCY: {
        CODE: 'DKK',
        SYMBOL: 'kr',
        MINOR_UNIT: 'øre',
        DECIMALS: 2,
    },
    LOCALE: {
        CODE: 'da-DK',
        LANGUAGE: 'da',
        COUNTRY: 'DK',
    },
    TIMEZONE: {
        NAME: 'Europe/Copenhagen',
        OFFSET_WINTER: '+01:00',
        OFFSET_SUMMER: '+02:00',
    },
    BUSINESS: {
        STANDARD_VAT_RATE: 25,
        CVR_LENGTH: 8,
        PHONE_LENGTH: 8,
        POSTAL_CODE_LENGTH: 4,
    },
    LABOR: {
        MAX_WEEKLY_HOURS: 48,
        MAX_DAILY_HOURS: 10,
        MIN_DAILY_REST: 11,
        OVERTIME_MULTIPLIER: 1.5,
    },
};
exports.default = {
    oreToKroner: exports.oreToKroner,
    kronerToOre: exports.kronerToOre,
    formatDanishCurrency: exports.formatDanishCurrency,
    parseDanishCurrency: exports.parseDanishCurrency,
    getDanishNow: exports.getDanishNow,
    getDanishToday: exports.getDanishToday,
    formatDanishDate: exports.formatDanishDate,
    formatDanishDateTime: exports.formatDanishDateTime,
    getDanishWeekday: exports.getDanishWeekday,
    isDanishHoliday: exports.isDanishHoliday,
    validateDanishCVR: exports.validateDanishCVR,
    validateDanishPhone: exports.validateDanishPhone,
    formatDanishPhone: exports.formatDanishPhone,
    calculateDanishMOMS: exports.calculateDanishMOMS,
    calculateNetFromGross: exports.calculateNetFromGross,
    calculateMarginPercentage: exports.calculateMarginPercentage,
    calculateWorkingHours: exports.calculateWorkingHours,
    capitalizeDanish: exports.capitalizeDanish,
    createDanishSlug: exports.createDanishSlug,
    truncateText: exports.truncateText,
    sortByDanish: exports.sortByDanish,
    groupByDanish: exports.groupByDanish,
    DANISH_CONSTANTS: exports.DANISH_CONSTANTS,
};
//# sourceMappingURL=index.js.map