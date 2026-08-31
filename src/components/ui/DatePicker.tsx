"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
} from "react";

type DatePickerProps = {
  ariaDescribedBy?: string;
  defaultValue?: string;
  disabled?: boolean;
  id: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  onBlur?: (fieldName: string, value: string) => void;
  onChange?: (fieldName: string, value: string) => void;
};

const monthFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "long",
});

const displayDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const weekdays = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

export function DatePicker({
  ariaDescribedBy,
  defaultValue = "",
  disabled = false,
  id,
  name,
  placeholder = "Seleccionar fecha",
  required = false,
  onBlur,
  onChange,
}: DatePickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [viewDate, setViewDate] = useState(() =>
    parseDateInputValue(defaultValue) ?? new Date(),
  );
  const days = useMemo(() => getCalendarDays(viewDate), [viewDate]);
  const yearOptions = useMemo(() => getYearOptions(viewDate), [viewDate]);
  const selectedDate = parseDateInputValue(selectedValue);
  const todayValue = formatDateInputValue(new Date());

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        pickerRef.current &&
        event.target instanceof Node &&
        !pickerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function selectDate(value: string) {
    setSelectedValue(value);
    setViewDate(parseDateInputValue(value) ?? new Date());
    setIsOpen(false);
    onChange?.(name, value);
  }

  function moveMonth(direction: -1 | 1) {
    setViewDate(
      (currentDate) =>
        new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1),
    );
  }

  function selectYear(year: string) {
    setViewDate(
      (currentDate) =>
        new Date(Number(year), currentDate.getMonth(), 1),
    );
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextFocusedElement = event.relatedTarget;

    if (
      nextFocusedElement instanceof Node &&
      event.currentTarget.contains(nextFocusedElement)
    ) {
      return;
    }

    onBlur?.(name, selectedValue);
  }

  return (
    <div className="date-picker" onBlur={handleBlur} ref={pickerRef}>
      <input
        id={id}
        name={name}
        readOnly
        required={required}
        type="hidden"
        value={selectedValue}
      />
      <button
        aria-describedby={ariaDescribedBy}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`date-picker__trigger${isOpen ? " date-picker__trigger--open" : ""}`}
        disabled={disabled}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span>{selectedDate ? displayDateFormatter.format(selectedDate) : placeholder}</span>
        <Calendar aria-hidden="true" size={17} />
      </button>

      {isOpen ? (
        <div className="date-picker__popover" role="dialog">
          <div className="date-picker__header">
            <button
              aria-label="Mes anterior"
              className="date-picker__nav"
              onClick={() => moveMonth(-1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={17} />
            </button>
            <div className="date-picker__title">
              <strong>{capitalize(monthFormatter.format(viewDate))}</strong>
              <select
                aria-label="Seleccionar año"
                onChange={(event) => selectYear(event.currentTarget.value)}
                value={viewDate.getFullYear()}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              aria-label="Mes siguiente"
              className="date-picker__nav"
              onClick={() => moveMonth(1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={17} />
            </button>
          </div>

          <div className="date-picker__weekdays" aria-hidden="true">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="date-picker__grid">
            {days.map((day, index) =>
              day ? (
                <button
                  className={getDayClassName({
                    isSelected: day.value === selectedValue,
                    isToday: day.value === todayValue,
                  })}
                  key={day.value}
                  onClick={() => selectDate(day.value)}
                  type="button"
                >
                  {day.label}
                </button>
              ) : (
                <span aria-hidden="true" key={`empty-${index}`} />
              ),
            )}
          </div>

          <div className="date-picker__footer">
            <button
              className="date-picker__today"
              onClick={() => selectDate(todayValue)}
              type="button"
            >
              Hoy
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekdayIndex = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Array<{ label: number; value: string } | null> = [];

  for (let index = 0; index < firstWeekdayIndex; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      label: day,
      value: formatDateInputValue(new Date(year, month, day)),
    });
  }

  return days;
}

function parseDateInputValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getYearOptions(viewDate: Date) {
  const currentYear = new Date().getFullYear();
  const firstYear = Math.min(currentYear - 15, viewDate.getFullYear());
  const lastYear = Math.max(currentYear + 2, viewDate.getFullYear());
  const years = [];

  for (let year = lastYear; year >= firstYear; year -= 1) {
    years.push(year);
  }

  return years;
}

function getDayClassName({
  isSelected,
  isToday,
}: {
  isSelected: boolean;
  isToday: boolean;
}) {
  return [
    "date-picker__day",
    isSelected ? "date-picker__day--selected" : "",
    isToday ? "date-picker__day--today" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
