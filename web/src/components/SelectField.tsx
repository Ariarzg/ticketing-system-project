"use client";

import { FieldError, Label, ListBox, Select } from "@heroui/react";

export type Option = { id: string; label: string };

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  className,
  hideLabel = false,
  requiredMessage,
}: {
  label: string;
  value: string | null;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Keep the label for screen readers but do not show it (used in toolbars). */
  hideLabel?: boolean;
  /** Makes the field required; shown under it when the form is sent without a choice. */
  requiredMessage?: string;
}) {
  return (
    <Select
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={(key) => key !== null && onChange(String(key))}
      isRequired={requiredMessage !== undefined}
    >
      <Label className={hideLabel ? "sr-only" : undefined}>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((o) => (
            <ListBox.Item key={o.id} id={o.id} textValue={o.label}>
              {o.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
      {/* Select ignores `validate` for a missing value and shows the browser's English text, so the message is given here. */}
      <FieldError>{requiredMessage}</FieldError>
    </Select>
  );
}