"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  formatSuggestionAddress,
  suggestAddresses,
  suggestUnitsForBuilding,
  type AddressSuggestion,
  type BuildingKey,
} from "@/lib/address-autocomplete";

type AddressAutocompleteProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  onSelect?: (suggestion: AddressSuggestion) => void;
};

type SearchStatus = "idle" | "loading" | "ready" | "empty" | "unavailable" | "selected";

export function AddressAutocomplete({
  id,
  value,
  onChange,
  error,
  onSelect,
}: AddressAutocompleteProps) {
  const reactId = useId();
  const inputId = id ?? `property-address-${reactId}`;
  const listId = `${inputId}-suggestions`;
  const helperId = `${inputId}-help`;
  const errorId = `${inputId}-error`;

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [resultsFor, setResultsFor] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [building, setBuilding] = useState<BuildingKey | null>(null);
  const [unitFilter, setUnitFilter] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef<AbortController | null>(null);
  const requestNumber = useRef(0);
  const composing = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const activeOption = useRef<HTMLLIElement>(null);

  const inUnitMode = building !== null;
  const currentSuggestions = inUnitMode
    ? suggestions
    : resultsFor === value.trim()
      ? suggestions
      : [];
  const expanded = open && (currentSuggestions.length > 0 || status === "loading" || status === "empty" || status === "unavailable");
  const activeSuggestion = currentSuggestions[activeIndex];

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
    if (building) return;
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
    setOpen(true);
    const number = requestNumber.current;
    timer.current = setTimeout(async () => {
      timer.current = null;
      const controller = new AbortController();
      request.current = controller;

      try {
        const matches = await suggestAddresses(query, controller.signal);
        if (controller.signal.aborted || number !== requestNumber.current) return;
        setSuggestions(matches);
        setResultsFor(query);
        setStatus(matches.length ? "ready" : "empty");
        setOpen(true);
        setActiveIndex(matches.length ? 0 : -1);
      } catch {
        if (controller.signal.aborted || number !== requestNumber.current) return;
        setStatus("unavailable");
        setSuggestions([]);
        setOpen(true);
      } finally {
        if (number === requestNumber.current) request.current = null;
      }
    }, 350);
  }

  function scheduleUnitSearch(nextBuilding: BuildingKey, nextFilter: string) {
    cancelPending();
    setStatus("loading");
    setOpen(true);
    setActiveIndex(-1);
    const number = requestNumber.current;
    timer.current = setTimeout(async () => {
      timer.current = null;
      const controller = new AbortController();
      request.current = controller;
      try {
        const matches = await suggestUnitsForBuilding(nextBuilding, nextFilter, controller.signal);
        if (controller.signal.aborted || number !== requestNumber.current) return;
        setSuggestions(matches);
        setResultsFor(nextFilter);
        setStatus(matches.length ? "ready" : "empty");
        setOpen(true);
        setActiveIndex(matches.length ? 0 : -1);
      } catch {
        if (controller.signal.aborted || number !== requestNumber.current) return;
        setStatus("unavailable");
        setSuggestions([]);
        setOpen(true);
      } finally {
        if (number === requestNumber.current) request.current = null;
      }
    }, 200);
  }

  function selectParcel(suggestion: AddressSuggestion) {
    cancelPending();
    setBuilding(null);
    setUnitFilter("");
    setOpen(false);
    setActiveIndex(-1);
    setSuggestions([]);
    setResultsFor("");
    setStatus("selected");
    onChange(suggestion.address);
    onSelect?.(suggestion);
    input.current?.focus({ preventScroll: true });
  }

  function selectBuilding(suggestion: AddressSuggestion) {
    if (!suggestion.building) return;
    cancelPending();
    setBuilding(suggestion.building);
    setUnitFilter("");
    setSuggestions([]);
    setResultsFor("");
    setStatus("loading");
    setOpen(true);
    onChange(formatSuggestionAddress(suggestion.building));
    scheduleUnitSearch(suggestion.building, "");
    input.current?.focus({ preventScroll: true });
  }

  function selectSuggestion(suggestion: AddressSuggestion) {
    if (suggestion.kind === "building") selectBuilding(suggestion);
    else selectParcel(suggestion);
  }

  function leaveUnitMode() {
    cancelPending();
    const previous = building;
    setBuilding(null);
    setUnitFilter("");
    setSuggestions([]);
    setResultsFor("");
    setActiveIndex(-1);
    setStatus("idle");
    setOpen(false);
    if (previous) {
      const restart = formatSuggestionAddress(previous).split(",")[0];
      onChange(restart);
      scheduleSearch(restart);
    }
  }

  function closeSuggestions() {
    if (inUnitMode) return;
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
      setActiveIndex(activeIndex < 0 ? 0 : (activeIndex + 1) % currentSuggestions.length);
    } else if (event.key === "ArrowUp" && currentSuggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(
        activeIndex > 0 ? activeIndex - 1 : currentSuggestions.length - 1,
      );
    } else if (event.key === "Enter" && activeSuggestion) {
      event.preventDefault();
      selectSuggestion(activeSuggestion);
    } else if (event.key === "Escape") {
      if (inUnitMode) {
        event.preventDefault();
        leaveUnitMode();
      } else if (open) {
        event.preventDefault();
        closeSuggestions();
      }
    } else if (event.key === "Tab") {
      if (!inUnitMode) closeSuggestions();
    }
  }

  let message = "Start with a house number and street, or a street name. Add a city or ZIP after a comma to narrow results. Suggestions use Palm Beach County situs addresses.";
  if (inUnitMode) {
    message = status === "loading"
      ? "Loading units for this building…"
      : status === "unavailable"
        ? "Unit lookup is temporarily unavailable. Go back and try the building again."
        : status === "empty"
          ? "No units match that filter. Clear the unit search or try another number."
          : `${currentSuggestions.length} searchable unit${currentSuggestions.length === 1 ? "" : "s"} at this building. Select a unit to open its parcel report.`;
  } else {
    if (status === "loading") message = "Finding county address suggestions… This may take a few seconds.";
    if (status === "ready" && currentSuggestions.length) {
      message = `${currentSuggestions.length} address ${currentSuggestions.length === 1 ? "suggestion" : "suggestions"}. Use the arrow keys and Enter to select, or keep typing.`;
    }
    if (status === "empty") message = "No matching addresses found. Check the street name, suffix, city, or ZIP, then try again.";
    if (status === "unavailable") message = "Address suggestions are temporarily unavailable. Please wait a moment and try again.";
    if (status === "selected") message = "Address selected. You can edit it or continue to the property report.";
  }

  return (
    <div className="min-w-0">
      {inUnitMode ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          <button
            type="button"
            className="font-semibold text-navy underline underline-offset-2"
            onMouseDown={(event) => event.preventDefault()}
            onClick={leaveUnitMode}
          >
            ← Building list
          </button>
          <span aria-hidden="true">·</span>
          <span>{formatSuggestionAddress(building)}</span>
        </div>
      ) : null}
      <div className="relative">
        <input
          ref={input}
          id={inputId}
          name="property-address"
          type="text"
          role="combobox"
          value={inUnitMode ? unitFilter : value}
          maxLength={160}
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={activeSuggestion ? `${listId}-${activeIndex}` : undefined}
          aria-describedby={`${helperId}${error ? ` ${errorId}` : ""}`}
          aria-invalid={Boolean(error)}
          placeholder={inUnitMode ? "Search unit number" : "Start typing a street address"}
          className="min-h-14 w-full rounded border border-navy/20 bg-paper px-4 py-3 text-base text-navy outline-none focus:border-champagne focus:ring-2 focus:ring-champagne/40 sm:text-lg"
          onChange={(event) => {
            const nextValue = event.target.value.slice(0, 160);
            if (inUnitMode && building) {
              setUnitFilter(nextValue);
              scheduleUnitSearch(building, nextValue);
              return;
            }
            onChange(nextValue);
            scheduleSearch(nextValue);
          }}
          onFocus={() => {
            if (currentSuggestions.length || status === "empty" || status === "unavailable" || inUnitMode) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            if (!inUnitMode) closeSuggestions();
          }}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => {
            composing.current = true;
            cancelPending();
            if (!inUnitMode) {
              setSuggestions([]);
              setOpen(false);
              setActiveIndex(-1);
              setStatus("idle");
            }
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            if (inUnitMode && building) scheduleUnitSearch(building, event.currentTarget.value);
            else scheduleSearch(event.currentTarget.value);
          }}
        />
        {expanded ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={inUnitMode ? "Units at this building" : "Suggested property addresses"}
            className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto overscroll-contain rounded border border-navy/20 bg-paper p-1 shadow-lg"
          >
            {status === "loading" && !currentSuggestions.length ? (
              <li className="px-3 py-3 text-sm text-muted" role="presentation">Finding matches…</li>
            ) : null}
            {status === "empty" ? (
              <li className="px-3 py-3 text-sm text-muted" role="presentation">No matching addresses.</li>
            ) : null}
            {status === "unavailable" ? (
              <li className="px-3 py-3 text-sm text-terracotta" role="presentation">Address service unavailable. Please try again.</li>
            ) : null}
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
                <span className="block">{suggestion.address}</span>
                {suggestion.kind === "building" ? (
                  <span className="mt-1 block text-sm text-muted">Choose building, then search units</span>
                ) : null}
                {suggestion.kind === "parcel" && suggestion.parcelNumber &&
                currentSuggestions.some((other) => other.id !== suggestion.id && other.address === suggestion.address) ? (
                  <span className="mt-1 block text-sm text-muted">Parcel {suggestion.parcelNumber}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p id={helperId} role="status" aria-live="polite" aria-atomic="true" className="mt-1.5 text-sm leading-snug text-muted">
        {message}
      </p>
      <p className="mt-1 text-xs leading-snug text-muted">
        <a href={SITUS_LINK} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
          Address data: Palm Beach County situs addresses
        </a>
        {" · "}
        Parcel reports use PAO.PROPINFO.
      </p>
      {error ? <p id={errorId} role="alert" className="mt-2 text-sm text-terracotta">{error}</p> : null}
    </div>
  );
}

const SITUS_LINK =
  "https://maps.co.palm-beach.fl.us/arcgis/rest/services/OpenData/open_data_v2/FeatureServer/0";
