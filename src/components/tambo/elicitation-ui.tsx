"use client";

import { cn } from "@/lib/utils";
import {
  type TamboElicitationRequest,
  type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import * as React from "react";
import { useMemo, useState } from "react";

type FieldSchema =
  TamboElicitationRequest["requestedSchema"]["properties"][string];


interface FieldProps {
  name: string;
  schema: FieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  required: boolean;
  autoFocus?: boolean;
  validationError?: string | null;
}


const BooleanField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
}) => {
  const boolValue = value as boolean | undefined;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {schema.description ?? name}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          autoFocus={autoFocus}
          onClick={() => onChange(true)}
          className={cn(
            "flex-1 px-4 py-2 rounded-lg border transition-colors",
            boolValue === true
              ? "bg-accent text-accent-foreground border-accent"
              : "bg-background border-border hover:bg-muted",
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "flex-1 px-4 py-2 rounded-lg border transition-colors",
            boolValue === false
              ? "bg-accent text-accent-foreground border-accent"
              : "bg-background border-border hover:bg-muted",
          )}
        >
          No
        </button>
      </div>
    </div>
  );
};


const EnumField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
}) => {
  if (schema.type !== "string" || !("enum" in schema)) {
    return null;
  }
  const options = schema.enum ?? [];
  const optionNames =
    "enumNames" in schema ? (schema.enumNames ?? []) : options;
  const stringValue = value as string | undefined;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {schema.description ?? name}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            autoFocus={autoFocus && index === 0}
            onClick={() => onChange(option)}
            className={cn(
              "px-4 py-2 rounded-lg border transition-colors",
              stringValue === option
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-background border-border hover:bg-muted",
            )}
          >
            {optionNames[index] ?? option}
          </button>
        ))}
      </div>
    </div>
  );
};


const StringField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
  validationError,
}) => {
  const inputId = React.useId();

  if (schema.type !== "string") {
    return null;
  }
  const stringValue = (value as string | undefined) ?? "";

  
  const getInputType = (): string => {
    const format = "format" in schema ? schema.format : undefined;
    switch (format) {
      case "email":
        return "email";
      case "uri":
        return "url";
      case "date":
        return "date";
      case "date-time":
        return "datetime-local";
      default:
        return "text";
    }
  };

  const inputType = getInputType();
  const hasError = !!validationError;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {schema.description ?? name}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        id={inputId}
        type={inputType}
        autoFocus={autoFocus}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2",
          hasError
            ? "border-destructive focus:ring-destructive"
            : "border-border focus:ring-accent",
        )}
        placeholder={schema.description ?? name}
        minLength={"minLength" in schema ? schema.minLength : undefined}
        maxLength={"maxLength" in schema ? schema.maxLength : undefined}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
      />
      {validationError && (
        <p id={errorId} className="text-xs text-destructive" aria-live="polite">
          {validationError}
        </p>
      )}
    </div>
  );
};


const NumberField: React.FC<FieldProps> = ({
  name,
  schema,
  value,
  onChange,
  required,
  autoFocus,
  validationError,
}) => {
  const inputId = React.useId();

  if (schema.type !== "number" && schema.type !== "integer") {
    return null;
  }
  const numberSchema = schema;
  const numberValue = value as number | undefined;
  const hasError = !!validationError;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {schema.description ?? name}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        id={inputId}
        type="number"
        autoFocus={autoFocus}
        value={numberValue ?? ""}
        onChange={(e) => {
          const { value, valueAsNumber } = e.currentTarget;
          onChange(
            value === "" || Number.isNaN(valueAsNumber)
              ? undefined
              : valueAsNumber,
          );
        }}
        className={cn(
          "w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2",
          hasError
            ? "border-destructive focus:ring-destructive"
            : "border-border focus:ring-accent",
        )}
        placeholder={schema.description ?? name}
        min={numberSchema.minimum}
        max={numberSchema.maximum}
        step={numberSchema.type === "integer" ? 1 : "any"}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
      />
      {validationError && (
        <p id={errorId} className="text-xs text-destructive" aria-live="polite">
          {validationError}
        </p>
      )}
    </div>
  );
};


const Field: React.FC<FieldProps> = (props) => {
  const { schema } = props;

  if (schema.type === "boolean") {
    return <BooleanField {...props} />;
  }

  if (schema.type === "string" && "enum" in schema) {
    return <EnumField {...props} />;
  }

  if (schema.type === "string") {
    return <StringField {...props} />;
  }

  if (schema.type === "number" || schema.type === "integer") {
    return <NumberField {...props} />;
  }

  return null;
};


function isSingleEntryMode(request: TamboElicitationRequest): boolean {
  const fields = Object.entries(request.requestedSchema.properties);

  if (fields.length !== 1) {
    return false;
  }

  const [, schema] = fields[0];

  return (
    schema.type === "boolean" || (schema.type === "string" && "enum" in schema)
  );
}


function validateField(
  value: unknown,
  schema: FieldSchema,
  required: boolean,
): { valid: boolean; error: string | null } {
  
  if (required && (value === undefined || value === "" || value === null)) {
    return { valid: false, error: "This field is required" };
  }

  
  if (!required && (value === undefined || value === "" || value === null)) {
    return { valid: true, error: null };
  }

  
  if (schema.type === "string") {
    const stringSchema = schema;
    const stringValue = String(value);

    if (
      "minLength" in stringSchema &&
      stringSchema.minLength !== undefined &&
      stringValue.length < stringSchema.minLength
    ) {
      return {
        valid: false,
        error: `Minimum length is ${stringSchema.minLength} characters`,
      };
    }

    if (
      "maxLength" in stringSchema &&
      stringSchema.maxLength !== undefined &&
      stringValue.length > stringSchema.maxLength
    ) {
      return {
        valid: false,
        error: `Maximum length is ${stringSchema.maxLength} characters`,
      };
    }

    if ("pattern" in stringSchema && stringSchema.pattern) {
      try {
        const regex = new RegExp(stringSchema.pattern as string);
        if (!regex.test(stringValue)) {
          return {
            valid: false,
            error: "Value does not match required pattern",
          };
        }
      } catch {
        
      }
    }

    
    if ("format" in stringSchema && stringSchema.format) {
      switch (stringSchema.format) {
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
            return {
              valid: false,
              error: "Please enter a valid email address",
            };
          }
          break;
        case "uri":
          try {
            new URL(stringValue);
          } catch {
            return { valid: false, error: "Please enter a valid URL" };
          }
          break;
      }
    }
  }

  
  if (schema.type === "number" || schema.type === "integer") {
    const numberSchema = schema;
    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      return { valid: false, error: "Please enter a valid number" };
    }

    if (
      numberSchema.minimum !== undefined &&
      numberValue < numberSchema.minimum
    ) {
      return {
        valid: false,
        error: `Minimum value is ${numberSchema.minimum}`,
      };
    }

    if (
      numberSchema.maximum !== undefined &&
      numberValue > numberSchema.maximum
    ) {
      return {
        valid: false,
        error: `Maximum value is ${numberSchema.maximum}`,
      };
    }

    if (schema.type === "integer" && !Number.isInteger(numberValue)) {
      return { valid: false, error: "Please enter a whole number" };
    }
  }

  return { valid: true, error: null };
}


function getValidationError(
  value: unknown,
  schema: FieldSchema,
  required: boolean,
): string | null {
  return validateField(value, schema, required).error;
}


export interface ElicitationUIProps {
  request: TamboElicitationRequest;
  onResponse: (response: TamboElicitationResponse) => void;
  className?: string;
}


export const ElicitationUI: React.FC<ElicitationUIProps> = ({
  request,
  onResponse,
  className,
}) => {
  const singleEntry = isSingleEntryMode(request);
  const fields = useMemo(
    () => Object.entries(request.requestedSchema.properties),
    [request.requestedSchema.properties],
  );
  const requiredFields = useMemo(
    () => request.requestedSchema.required ?? [],
    [request.requestedSchema.required],
  );
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    fields.forEach(([name, schema]) => {
      if (schema.default !== undefined) {
        initial[name] = schema.default;
      }
    });
    return initial;
  });

  
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const handleFieldChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    setTouchedFields((prev) => new Set(prev).add(name));
  };

  const handleAccept = () => {
    
    if (!isValid) {
      
      setTouchedFields(new Set(fields.map(([name]) => name)));
      return;
    }
    onResponse({ action: "accept", content: formData });
  };

  const handleDecline = () => {
    onResponse({ action: "decline" });
  };

  const handleCancel = () => {
    onResponse({ action: "cancel" });
  };

  
  const handleSingleEntryChange = (name: string, value: unknown) => {
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    
    setTouchedFields((prev) => new Set(prev).add(name));
    
    onResponse({ action: "accept", content: updatedData });
  };

  
  const isValid = fields.every(([fieldName, fieldSchema]) => {
    const value = formData[fieldName];
    const isRequired = requiredFields.includes(fieldName);
    return validateField(value, fieldSchema, isRequired).valid;
  });

  if (singleEntry) {
    const [fieldName, fieldSchema] = fields[0];
    const validationError = touchedFields.has(fieldName)
      ? getValidationError(
          formData[fieldName],
          fieldSchema,
          requiredFields.includes(fieldName),
        )
      : null;

    return (
      <div
        className={cn(
          "flex flex-col rounded-xl bg-background border border-border p-4 space-y-3",
          className,
        )}
      >
        <div className="text-base font-semibold text-foreground mb-2">
          {request.message}
        </div>
        <Field
          name={fieldName}
          schema={fieldSchema}
          value={formData[fieldName]}
          onChange={(value) => handleSingleEntryChange(fieldName, value)}
          required={requiredFields.includes(fieldName)}
          autoFocus
          validationError={validationError}
        />
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    );
  }

  
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl bg-background border border-border p-4 space-y-4",
        className,
      )}
    >
      <div className="text-base font-semibold text-foreground">
        {request.message}
      </div>
      <div className="space-y-3">
        {fields.map(([name, schema], index) => {
          const validationError = touchedFields.has(name)
            ? getValidationError(
                formData[name],
                schema,
                requiredFields.includes(name),
              )
            : null;

          return (
            <Field
              key={name}
              name={name}
              schema={schema}
              value={formData[name]}
              onChange={(value) => handleFieldChange(name, value)}
              required={requiredFields.includes(name)}
              autoFocus={index === 0}
              validationError={validationError}
            />
          );
        })}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDecline}
          className="px-4 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted transition-colors"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={handleAccept}
          disabled={!isValid}
          className="px-6 py-2 text-sm rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Submit
        </button>
      </div>
    </div>
  );
};
