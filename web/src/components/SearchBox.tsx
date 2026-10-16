"use client";

import { useEffect, useRef, useState } from "react";
import { SearchField } from "@heroui/react";

/** A search field that waits 400 ms after the last keystroke before telling the page. */
export function SearchBox({
  value,
  onChange,
  label,
  placeholder,
  className,
}: {
  /** The committed value (from the URL). */
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  const latest = useRef(onChange);

  // The URL changed from outside (clear filters, back button): show the new value instead of sending the old text again.
  if (value !== synced) {
    setSynced(value);
    setText(value);
  }

  useEffect(() => {
    latest.current = onChange;
  });

  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => latest.current(text), 400);
    return () => clearTimeout(timer);
  }, [text, value]);

  return (
    <SearchField value={text} onChange={setText} aria-label={label} className={className}>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input dir="auto" placeholder={placeholder} />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}