import React, { useState, useCallback } from 'react'
import { ValidationRule, validateField, validateForm } from '../lib/validation'

interface FormState<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
}

interface UseFormValidationOptions<T> {
  initialValues: T
  validationRules: Partial<Record<keyof T, ValidationRule[]>>
  onSubmit: (values: T) => Promise<void> | void
}

export function useFormValidation<T extends Record<string, unknown>>({
  initialValues,
  validationRules,
  onSubmit
}: UseFormValidationOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {}
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setFieldValue = useCallback((field: keyof T, value: unknown) => {
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, [field]: value }
    }))

    // Validate field immediately if it has been touched
    if (formState.touched[field] && validationRules[field]) {
      const error = validateField(value, validationRules[field])
      setFormState(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: error || undefined }
      }))
    }
  }, [formState.touched, validationRules])

  const setFieldTouched = useCallback((field: keyof T, touched = true) => {
    setFormState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: touched }
    }))

    // Validate field when touched
    if (touched && validationRules[field]) {
      const error = validateField(formState.values[field], validationRules[field])
      setFormState(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: error || undefined }
      }))
    }
  }, [formState.values, validationRules])

  const handleBlur = useCallback((field: keyof T) => {
    setFieldTouched(field, true)
  }, [setFieldTouched])

  const validateAllFields = useCallback((): boolean => {
    const errors = validateForm(formState.values, validationRules as Record<string, ValidationRule[]>)
    
    setFormState(prev => ({
      ...prev,
      errors: errors as Partial<Record<keyof T, string>>,
      touched: Object.keys(prev.values).reduce((acc, key) => ({
        ...acc,
        [key]: true
      }), {} as Partial<Record<keyof T, boolean>>)
    }))

    return Object.keys(errors).length === 0
  }, [formState.values, validationRules])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!validateAllFields()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formState.values)
    } finally {
      setIsSubmitting(false)
    }
  }, [validateAllFields, onSubmit, formState.values])

  const resetForm = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {}
    })
  }, [initialValues])

  const getFieldProps = useCallback((field: keyof T) => ({
    value: formState.values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFieldValue(field, e.target.value)
    },
    onBlur: () => handleBlur(field),
    'aria-invalid': !!formState.errors[field],
    'aria-describedby': formState.errors[field] ? `${String(field)}-error` : undefined
  }), [formState.values, formState.errors, setFieldValue, handleBlur])

  const getFieldError = useCallback((field: keyof T) => {
    return formState.touched[field] ? formState.errors[field] : undefined
  }, [formState.touched, formState.errors])

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting,
    setFieldValue,
    setFieldTouched,
    handleBlur,
    handleSubmit,
    resetForm,
    validateAllFields,
    getFieldProps,
    getFieldError,
    isValid: Object.keys(formState.errors).length === 0
  }
}