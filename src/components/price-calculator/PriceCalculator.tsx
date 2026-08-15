"use client";

import { ResultModal } from "@/components/ui/ResultModal";
import { updatePriceCalculatorSettings } from "@/features/price-calculator/actions";
import { calculateProductPrice } from "@/features/price-calculator/calculations";
import {
  formatCurrency,
  formatNumberInput,
  formatPercent,
  fromPercentInputValue,
  toPercentInputValue,
  parseNumberInput,
} from "@/features/price-calculator/formatters";
import type { PriceCalculatorSettings } from "@/features/price-calculator/types";
import { Pencil, RotateCcw, Save } from "lucide-react";
import { useMemo, useState, useTransition, type ChangeEvent } from "react";

type PriceCalculatorProps = {
  initialSettings: PriceCalculatorSettings;
};

type EditableSettings = {
  commissionRate: string;
  finalRoundingIncrement: string;
  markupRate: string;
  packagingCost: string;
  shippingCost: string;
  vatRate: string;
};

type ResultMessage = {
  description: string;
  title: string;
  variant: "error" | "success";
};

export function PriceCalculator({ initialSettings }: PriceCalculatorProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [draftSettings, setDraftSettings] = useState(
    createEditableSettings(initialSettings),
  );
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [acquisitionValue, setAcquisitionValue] = useState("");
  const [resultMessage, setResultMessage] = useState<ResultMessage | null>(null);
  const [isPending, startTransition] = useTransition();

  const acquisitionCost = parseCurrencyInputValue(acquisitionValue);
  const hasValidAcquisition =
    acquisitionValue.trim().length > 0 &&
    Number.isFinite(acquisitionCost) &&
    acquisitionCost > 0;
  const calculationError =
    acquisitionValue.trim().length > 0 && acquisitionCost <= 0
      ? "La adquisición debe ser mayor a cero."
      : "";
  const calculation = useMemo(
    () =>
      hasValidAcquisition && !calculationError
        ? calculateProductPrice({ acquisitionCost, settings })
        : null,
    [acquisitionCost, calculationError, hasValidAcquisition, settings],
  );

  function handleAcquisitionChange(event: ChangeEvent<HTMLInputElement>) {
    setAcquisitionValue(formatCurrencyInputValue(event.target.value));
  }

  function handleDraftChange(
    fieldName: keyof EditableSettings,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setDraftSettings((currentValue) => ({
      ...currentValue,
      [fieldName]: event.target.value,
    }));
  }

  function handleCancelSettings() {
    setDraftSettings(createEditableSettings(settings));
    setIsEditingSettings(false);
  }

  function handleSaveSettings() {
    const nextSettings = parseEditableSettings(draftSettings);
    const formData = new FormData();

    Object.entries(draftSettings).forEach(([key, value]) => {
      formData.set(key, value);
    });

    startTransition(async () => {
      const result = await updatePriceCalculatorSettings(formData);

      if (!result.success) {
        setResultMessage({
          description: result.message,
          title: "No se pudo actualizar",
          variant: "error",
        });
        return;
      }

      setSettings(nextSettings);
      setDraftSettings(createEditableSettings(nextSettings));
      setIsEditingSettings(false);
      setResultMessage({
        description: result.message,
        title: "Configuración guardada",
        variant: "success",
      });
    });
  }

  return (
    <section className="price-calculator">
      <div className="price-calculator__table ui-panel">
        <div className="price-calculator__header">
          <div>
            <h2 className="text-h2">Tabla de calculo</h2>
            <p className="text-body">
              Ingresa el costo de adquisición y revisa los valores calculados.
            </p>
          </div>
          <button
            aria-label={
              isEditingSettings
                ? "Cerrar edicion de valores fijos"
                : "Editar valores fijos"
            }
            className="price-calculator__icon-button"
            onClick={() => setIsEditingSettings((currentValue) => !currentValue)}
            title={
              isEditingSettings
                ? "Cerrar edicion de valores fijos"
                : "Editar valores fijos"
            }
            type="button"
          >
            <Pencil aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="price-calculator__grid" role="table">
          <CalculatorInputRow
            error={calculationError}
            label="Adquisicion"
            onChange={handleAcquisitionChange}
            value={acquisitionValue}
          />
          <SettingsRow
            inputMode="decimal"
            isEditing={isEditingSettings}
            label="Packaging"
            onChange={(event) => handleDraftChange("packagingCost", event)}
            value={formatCurrency(settings.packagingCost)}
            draftValue={draftSettings.packagingCost}
          />
          <SettingsRow
            inputMode="decimal"
            isEditing={isEditingSettings}
            label="Envío"
            onChange={(event) => handleDraftChange("shippingCost", event)}
            value={formatCurrency(settings.shippingCost)}
            draftValue={draftSettings.shippingCost}
          />
          <SettingsRow
            inputMode="decimal"
            isEditing={isEditingSettings}
            label="Margen marcación"
            onChange={(event) => handleDraftChange("markupRate", event)}
            suffix="%"
            value={formatPercent(settings.markupRate)}
            draftValue={draftSettings.markupRate}
          />
          <SettingsRow
            inputMode="decimal"
            isEditing={isEditingSettings}
            label="Comision"
            onChange={(event) => handleDraftChange("commissionRate", event)}
            suffix="%"
            value={formatPercent(settings.commissionRate)}
            draftValue={draftSettings.commissionRate}
          />
          <SettingsRow
            inputMode="decimal"
            isEditing={isEditingSettings}
            label="IVA"
            onChange={(event) => handleDraftChange("vatRate", event)}
            suffix="%"
            value={formatPercent(settings.vatRate)}
            draftValue={draftSettings.vatRate}
          />
          <SettingsRow
            inputMode="numeric"
            isEditing={isEditingSettings}
            label="Redondeo final"
            onChange={(event) =>
              handleDraftChange("finalRoundingIncrement", event)
            }
            value={`Cada ${formatCurrency(settings.finalRoundingIncrement)}`}
            draftValue={draftSettings.finalRoundingIncrement}
          />
          <ResultRow
            label="Costo total"
            value={calculation ? formatCurrency(calculation.costTotal) : "-"}
          />
          <ResultRow
            label="Precio de venta"
            value={calculation ? formatCurrency(calculation.salePrice) : "-"}
          />
          <ResultRow
            label="PV + IVA"
            value={calculation ? formatCurrency(calculation.priceWithVat) : "-"}
          />
          <ResultRow
            label="Contribucion marginal"
            value={
              calculation ? formatCurrency(calculation.contributionMargin) : "-"
            }
          />
          <ResultRow
            label="Margen contribucion"
            value={
              calculation
                ? formatPercent(calculation.contributionMarginRate)
                : "-"
            }
          />
          <ResultRow
            label="Precio con comision"
            value={
              calculation ? formatCurrency(calculation.priceWithCommission) : "-"
            }
          />
          <ResultRow
            label="Contribucion con comision"
            value={
              calculation
                ? formatCurrency(calculation.contributionMarginWithCommission)
                : "-"
            }
          />
          <ResultRow
            label="Margen con comision"
            value={
              calculation
                ? formatPercent(calculation.contributionMarginWithCommissionRate)
                : "-"
            }
          />
          <ResultRow
            label="PV + IVA + comision"
            value={
              calculation
                ? formatCurrency(calculation.finalPriceWithCommissionVat)
                : "-"
            }
          />
          <ResultRow
            isStrong
            label="Precio final redondeado"
            value={
              calculation ? formatCurrency(calculation.finalRoundedPrice) : "-"
            }
          />
        </div>

        {isEditingSettings ? (
          <div className="price-calculator__settings-actions">
            <button
              className="button button--secondary"
              disabled={isPending}
              onClick={handleCancelSettings}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={16} />
              Cancelar
            </button>
            <button
              className="button button--primary"
              disabled={isPending}
              onClick={handleSaveSettings}
              type="button"
            >
              <Save aria-hidden="true" size={16} />
              Actualizar valores
            </button>
          </div>
        ) : null}

      </div>

      <ResultModal
        autoCloseMs={8000}
        description={resultMessage?.description ?? ""}
        isOpen={Boolean(resultMessage)}
        onClose={() => setResultMessage(null)}
        title={resultMessage?.title ?? ""}
        variant={resultMessage?.variant ?? "success"}
      />
    </section>
  );
}

function CalculatorInputRow({
  error,
  label,
  onChange,
  value,
}: {
  error: string;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
}) {
  return (
    <div className="price-calculator__row price-calculator__row--input">
      <label className={`form-field${error ? " form-field--error" : ""}`}>
        <span>{label}</span>
        <input
          aria-describedby={error ? "acquisition-error" : undefined}
          aria-invalid={Boolean(error)}
          inputMode="numeric"
          onChange={onChange}
          placeholder="$0"
          type="text"
          value={value}
        />
        {error ? (
          <p className="form-field__error" id="acquisition-error" role="alert">
            {error}
          </p>
        ) : null}
      </label>
    </div>
  );
}

function SettingsRow({
  draftValue,
  inputMode,
  isEditing,
  label,
  onChange,
  suffix,
  value,
}: {
  draftValue: string;
  inputMode: "decimal" | "numeric";
  isEditing: boolean;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  suffix?: string;
  value: string;
}) {
  return (
    <div className="price-calculator__row">
      <span className="price-calculator__label">{label}</span>
      {isEditing ? (
        <label className="price-calculator__setting-field">
          <input
            aria-label={label}
            inputMode={inputMode}
            onChange={onChange}
            type="text"
            value={draftValue}
          />
          {suffix ? <span>{suffix}</span> : null}
        </label>
      ) : (
        <strong className="price-calculator__value">{value}</strong>
      )}
    </div>
  );
}

function ResultRow({
  isStrong = false,
  label,
  value,
}: {
  isStrong?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div
      className={`price-calculator__row price-calculator__row--result${
        isStrong ? " price-calculator__row--strong" : ""
      }`}
    >
      <span className="price-calculator__label">{label}</span>
      <strong className="price-calculator__value">{value}</strong>
    </div>
  );
}

function createEditableSettings(settings: PriceCalculatorSettings) {
  return {
    commissionRate: toPercentInputValue(settings.commissionRate),
    finalRoundingIncrement: formatNumberInput(settings.finalRoundingIncrement),
    markupRate: toPercentInputValue(settings.markupRate),
    packagingCost: formatNumberInput(settings.packagingCost),
    shippingCost: formatNumberInput(settings.shippingCost),
    vatRate: toPercentInputValue(settings.vatRate),
  };
}

function parseEditableSettings(settings: EditableSettings): PriceCalculatorSettings {
  return {
    commissionRate: fromPercentInputValue(settings.commissionRate),
    finalRoundingIncrement: parseNumberInput(settings.finalRoundingIncrement),
    markupRate: fromPercentInputValue(settings.markupRate),
    packagingCost: parseNumberInput(settings.packagingCost),
    shippingCost: parseNumberInput(settings.shippingCost),
    vatRate: fromPercentInputValue(settings.vatRate),
  };
}

function formatCurrencyInputValue(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return `$ ${new Intl.NumberFormat("es-AR").format(Number(digits))}`;
}

function parseCurrencyInputValue(value: string) {
  const digits = value.replace(/\D/g, "");

  return digits ? Number(digits) : Number.NaN;
}
