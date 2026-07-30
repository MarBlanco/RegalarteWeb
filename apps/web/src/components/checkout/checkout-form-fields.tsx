'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type CheckoutFieldKey,
  type FieldDef,
  getFieldValue,
  setFieldValue,
  type CheckoutFormValues,
} from '@/lib/checkout'

export interface CheckoutFormFieldsProps {
  field: FieldDef
  form: CheckoutFormValues
  onChange: (next: CheckoutFormValues) => void
  disabled?: boolean
  error?: string
}

export function CheckoutFormFields({
  field,
  form,
  onChange,
  disabled = false,
  error,
}: CheckoutFormFieldsProps) {
  const value = getFieldValue(form, field.id as CheckoutFieldKey)
  const hasError = Boolean(error)
  const fieldErrorId = hasError ? `${field.id}-error` : undefined

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} className="text-sm">
        {field.label}
        {field.required ? <span aria-hidden> *</span> : null}
      </Label>
      {field.type === 'textarea' ? (
        <textarea
          id={field.id}
          name={field.id}
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
          required={field.required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={fieldErrorId}
          value={value}
          onChange={(e) =>
            onChange(
              setFieldValue(form, field.id as CheckoutFieldKey, e.target.value),
            )
          }
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive"
        />
      ) : (
        <Input
          id={field.id}
          name={field.id}
          type={field.type}
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
          required={field.required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={fieldErrorId}
          value={value}
          onChange={(e) =>
            onChange(
              setFieldValue(form, field.id as CheckoutFieldKey, e.target.value),
            )
          }
        />
      )}
      {hasError ? (
        <p
          id={fieldErrorId}
          className="text-xs font-medium text-destructive"
        >
          {error}
        </p>
      ) : field.helpText ? (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      ) : null}
    </div>
  )
}
