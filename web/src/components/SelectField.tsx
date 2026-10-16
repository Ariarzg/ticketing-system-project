"use client";

import { Label, ListBox, Select } from "@heroui/react";

export type Option = { id: string; label: string };

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  className,
  hideLabel = false,
}: {
  label: string;
  value: string | null;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Keep the label for screen readers but do not show it (used in toolbars). */
  hideLabel?: boolean;
}) {
  return (
    <Select
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={(key) => key !== null && onChange(String(key))}
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
    </Select>
  );
}