"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { suggestAddresses, type AddressSuggestion } from "@/lib/address-autocomplete";

type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
};

type SearchStatus = "idle" | "loading" | "ready" | "empty" | "unavailable" | "selected";

const inputId = "property-address";
const listId = `${inputId}-suggestions`;
const helperId = `${inputId}-help`;
const errorId = `${inputId}-error`;

export function AddressAutocomplete({ value, onChange, error }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [resultsFor, setResultsFor] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef<AbortController | null>(null);
  const requestNumber = useRef(0);
  const composing = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const activeOption = useRef<HTMLLIElement>(null);

  const currentSuggestions = resultsFor === value.trim() ? suggestions : [];
  const expanded = open && currentSuggestions.length > 0;
  const activeSuggestion = expanded ? currentSuggestions[activeIndex] : undefined;

  useEffect(() => {
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
      request.current?.abort();
      requestNumber.current += 1;
    };
  }, []);

  useEffect(() => {
    if (expanded && activeIndex >= 0) {
      activeOption.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeIndex, expanded]);

  function cancelPending() {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    request.current?.abort();
    request.current = null;
    requestNumber.current += 1;
  }

  function scheduleSearch(nextValue: string) {
    cancelPending();
    setSuggestions([]);
    setResultsFor("");
    setActiveIndex(-1);
    setOpen(false);

    const query = nextValue.trim();
    if (query.length < 3 || composing.current) {
      setStatus("idle");
      return;
    }

    setStatus("loading");
    const number = requestNumber.current;
    timer.current = setTimeout(async () => {
      timer.current = null;
      const controller = new AbortController();
      request.current = controller;

      try {
        const matches = (await suggestAddresses(query, controller.signal)).slice(0, 5);
        if (controller.signal.aborted || number !== requestNumber.current) return;
        setSuggestions(matches);
        setResultsFor(query);
        setStatus(matches.length ? "ready" : "empty");
        setOpen(matches.length > 0);
      } catch {
        if (controller.signal.aborted || number !== requestNumber.current) return;
        setStatus("unavailable");
        setOpen(false);
      } finally {
        if (number === requestNumber.current) request.current = null;
      }
    }, 350);
  }

  function selectSuggestion(suggestion: AddressSuggestion) {
    cancelPending();
    setOpen(false);
    setActiveIndex(-1);
    setSuggestions([]);
    setResultsFor("");
    setStatus("selected");
    onChange(suggestion.address);
    input.current?.focus({ preventScroll: true });
  }

  function closeSuggestions() {
    cancelPending();
    setOpen(false);
    setActiveIndex(-1);
    if (status === "loading") setStatus("idle");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || composing.current) return;

    if (event.key === "ArrowDown" && currentSuggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(expanded ? (activeIndex + 1) % currentSuggestions.length : 0);
    } else if (event.key === "ArrowUp" && currentSuggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(
        expanded && activeIndex > 0 ? activeIndex - 1 : currentSuggestions.length - 1,
      );
    } else if (event.key === "Enter" && activeSuggestion) {
      event.preventDefault();
      selectSuggestion(activeSuggestion);
    } else if (event.key === "Escape") {
      if (expanded) event.preventDefault();
      closeSuggestions();
    } else if (event.key === "Tab") {
      closeSuggestions();
    }
  }

  let message = "Start with the house number and street. Suggestions cover Palm Beach County, Florida. Manual entry also works.";
  if (status === "loading") message = "Finding county address suggestions… This may take a few seconds.";
  if (status === "ready" && expanded) {
    message = `${currentSuggestions.length} address ${currentSuggestions.length === 1 ? "suggestion" : "suggestions"}. Use the arrow keys and Enter to select, or keep typing.`;
  }
  if (status === "empty") message = "No matching addresses found. Try adding the street name, or continue with your address as typed.";
  if (status === "unavailable") message = "Address suggestions are temporarily unavailable. You can still type your address and continue.";
  if (status === "selected") message = "Address selected. You can edit it or continue.";

  return (
    <div className="min-w-0">
      <div className="relative">
        <input
          ref={input}
          id={inputId}
          name="property-address"
          type="text"
          role="combobox"
          value={value}
          maxLength={160}
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={activeSuggestion ? `${listId}-${activeIndex}` : undefined}
          aria-describedby={`${helperId}${error ? ` ${errorId}` : ""}`}
          aria-invalid={Boolean(error)}
          placeholder="Start typing a street address"
          className="min-h-14 w-full rounded border border-navy/20 bg-paper px-4 py-3 text-base text-navy outline-none focus:border-champagne focus:ring-2 focus:ring-champagne/40 sm:text-lg"
          onChange={(event) => {
            const nextValue = event.target.value.slice(0, 160);
            onChange(nextValue);
            scheduleSearch(nextValue);
          }}
          onFocus={() => {
            if (currentSuggestions.length) setOpen(true);
          }}
          onBlur={closeSuggestions}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => {
            composing.current = true;
            cancelPending();
            setSuggestions([]);
            setOpen(false);
            setActiveIndex(-1);
            setStatus("idle");
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            scheduleSearch(event.currentTarget.value);
          }}
        />
        {expanded ? (
          <ul
            id={listId}
            role="listbox"
            aria-label="Suggested property addresses"
            className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto overscroll-contain rounded border border-navy/20 bg-paper p-1 shadow-lg"
          >
            {currentSuggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                ref={index === activeIndex ? activeOption : undefined}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`min-h-12 cursor-pointer rounded px-3 py-3 text-base leading-snug wrap-anywhere ${index === activeIndex ? "bg-cream-dark text-navy" : "text-navy hover:bg-cream"}`}
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => selectSuggestion(suggestion)}
              >
                {suggestion.address}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p id={helperId} role="status" aria-live="polite" aria-atomic="true" className="mt-2 text-sm leading-relaxed text-muted">
        {message}
      </p>
      <p className="mt-1 text-xs text-muted">
        <a href="https://maps.co.palm-beach.fl.us/arcgis/rest/services/OpenData/Tables/MapServer/1" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
          Address data: Palm Beach County
        </a>
      </p>
      {error ? <p id={errorId} role="alert" className="mt-2 text-sm text-terracotta">{error}</p> : null}
    </div>
  );
}
