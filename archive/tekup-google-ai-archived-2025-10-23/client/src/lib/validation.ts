// Form validation utilities

export interface ValidationRule {
  validate: (value: unknown) => boolean
  message: string
}

export const validators = {
  required: (message = 'Dette felt er påkrævet'): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0
      return value !== null && value !== undefined
    },
    message
  }),

  email: (message = 'Ugyldig email adresse'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true // Let required handle empty values
      if (typeof value !== 'string' && typeof value !== 'number') return false
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(typeof value === 'string' ? value : String(value))
    },
    message
  }),

  phone: (message = 'Ugyldigt telefonnummer'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      if (typeof value !== 'string' && typeof value !== 'number') return false
      // Danish phone number format
      const phoneRegex = /^(\+45)?[\s]?[0-9]{2}[\s]?[0-9]{2}[\s]?[0-9]{2}[\s]?[0-9]{2}$/
      const phoneStr = typeof value === 'string' ? value : String(value)
      return phoneRegex.test(phoneStr.replace(/\s/g, ''))
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      if (typeof value !== 'string' && typeof value !== 'number') return false
      const valueStr = typeof value === 'string' ? value : String(value)
      return valueStr.length >= min
    },
    message: message || `Minimum ${min} tegn krævet`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      if (typeof value !== 'string' && typeof value !== 'number') return false
      const valueStr = typeof value === 'string' ? value : String(value)
      return valueStr.length <= max
    },
    message: message || `Maksimum ${max} tegn tilladt`
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (value === null || value === undefined || value === '') return true
      return Number(value) >= min
    },
    message: message || `Værdien skal være mindst ${min}`
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (value === null || value === undefined || value === '') return true
      return Number(value) <= max
    },
    message: message || `Værdien må højst være ${max}`
  }),

  pattern: (pattern: RegExp, message = 'Ugyldigt format'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      if (typeof value !== 'string' && typeof value !== 'number') return false
      const valueStr = typeof value === 'string' ? value : String(value)
      return pattern.test(valueStr)
    },
    message
  }),

  url: (message = 'Ugyldig URL'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      if (typeof value !== 'string' && typeof value !== 'number') return false
      try {
        const urlStr = typeof value === 'string' ? value : String(value)
        new URL(urlStr)
        return true
      } catch {
        return false
      }
    },
    message
  }),

  date: (message = 'Ugyldig dato'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      if (typeof value !== 'string' && typeof value !== 'number') return false
      const dateStr = typeof value === 'string' ? value : String(value)
      const date = new Date(dateStr)
      return !isNaN(date.getTime())
    },
    message
  }),

  futureDate: (message = 'Datoen skal være i fremtiden'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true
      if (typeof value !== 'string' && typeof value !== 'number') return false
      const dateStr = typeof value === 'string' ? value : String(value)
      const date = new Date(dateStr)
      return date > new Date()
    },
    message
  }),

  custom: (validate: (value: unknown) => boolean, message: string): ValidationRule => ({
    validate,
    message
  })
}

export function validateField(value: unknown, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message
    }
  }
  return null
}

export function validateForm(values: Record<string, unknown>, rules: Record<string, ValidationRule[]>): Record<string, string> {
  const errors: Record<string, string> = {}
  
  Object.keys(rules).forEach(field => {
    const error = validateField(values[field], rules[field])
    if (error) {
      errors[field] = error
    }
  })
  
  return errors
}