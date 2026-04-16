import * as React from "react";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/FormField";
import { cn } from "@/lib/utils";

interface FormInputProps extends React.ComponentProps<"input"> {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  wrapperClassName?: string;
}

/**
 * FormInput = FormField + Input combined into a single primitive.
 * Use this for standard text/email/password inputs in forms.
 *
 * Usage:
 *   <FormInput
 *     id="email"
 *     label="Email address"
 *     type="email"
 *     placeholder="you@example.com"
 *     error={errors.email?.message}
 *     required
 *   />
 */
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ id, label, error, required, wrapperClassName, className, ...rest }, ref) => {
    return (
      <FormField
        id={id}
        label={label}
        error={error}
        required={required}
        className={wrapperClassName}
      >
        <Input
          id={id}
          ref={ref}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
          className={cn("h-10 text-sm", className)}
          {...rest}
        />
      </FormField>
    );
  }
);

FormInput.displayName = "FormInput";
