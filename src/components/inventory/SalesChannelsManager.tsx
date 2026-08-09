"use client";

import {
  createSalesChannel,
  toggleSalesChannel,
  type InventoryFormState,
} from "@/features/inventory/actions";
import type { SalesChannel } from "@/features/inventory/types";
import { Plus } from "lucide-react";
import { useRef, useState, useTransition } from "react";

type SalesChannelsManagerProps = {
  channels: SalesChannel[];
};

const initialState: InventoryFormState = {
  message: "",
  success: false,
};

export function SalesChannelsManager({ channels }: SalesChannelsManagerProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<InventoryFormState>(initialState);
  const [isPending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    setState(initialState);

    startTransition(async () => {
      const result = await createSalesChannel(formData);
      setState(result);

      if (result.success) {
        formRef.current?.reset();
      }
    });
  }

  function handleToggle(channelId: string, isActive: boolean) {
    setState(initialState);

    startTransition(async () => {
      const result = await toggleSalesChannel(channelId, isActive);
      setState(result);
    });
  }

  return (
    <div className="sales-channels-manager">
      <form action={handleCreate} className="sales-channels-manager__form" ref={formRef}>
        <label className="form-field" htmlFor="sales-channel-name">
          <span className="form-field__label-row">
            <span>Nuevo medio de venta</span>
          </span>
          <input
            disabled={isPending}
            id="sales-channel-name"
            name="name"
            placeholder="Ej: Feria"
            required
            type="text"
          />
        </label>
        <button className="button button--primary" disabled={isPending} type="submit">
          <Plus aria-hidden="true" size={16} />
          Agregar
        </button>
      </form>

      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.success
              ? "sales-channels-manager__message"
              : "auth-form__error"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="sales-channels-manager__list">
        {channels.map((channel) => (
          <article className="sales-channel-row" key={channel.id}>
            <div>
              <strong>{channel.name}</strong>
              <span>{channel.slug}</span>
            </div>
            <button
              className={`button ${
                channel.is_active ? "button--secondary" : "button--primary"
              }`}
              disabled={isPending}
              onClick={() => handleToggle(channel.id, !channel.is_active)}
              type="button"
            >
              {channel.is_active ? "Desactivar" : "Activar"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
