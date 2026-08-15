"use client";

import { ProductListItemActions } from "@/components/products/ProductListItemActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import {
  ResultModal,
  type ResultModalVariant,
} from "@/components/ui/ResultModal";
import { deleteProduct } from "@/features/products/actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ProductListItemActionsContainerProps = {
  productId: string;
};

type ResultState = {
  description: string;
  shouldRefresh: boolean;
  title: string;
  variant: ResultModalVariant;
};

export function ProductListItemActionsContainer({
  productId,
}: ProductListItemActionsContainerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  function handleDelete() {
    setResult(null);
    setIsConfirmOpen(true);
  }

  function handleConfirmDelete() {
    if (isPending) {
      return;
    }

    setIsConfirmOpen(false);

    startTransition(async () => {
      const actionResult = await deleteProduct(productId);

      if (!actionResult.success) {
        setResult({
          description: actionResult.message,
          shouldRefresh: false,
          title: "No se pudo eliminar el producto",
          variant: "error",
        });
        return;
      }

      setResult({
        description:
          "El producto y sus imágenes se eliminaron correctamente del catálogo.",
        shouldRefresh: true,
        title: "Producto eliminado",
        variant: "success",
      });
    });
  }

  function handleCloseResult() {
    const shouldRefresh = result?.shouldRefresh === true;

    setResult(null);

    if (shouldRefresh) {
      router.refresh();
    }
  }

  return (
    <>
      <ProductListItemActions
        isDeleting={isPending}
        onDelete={handleDelete}
        productId={productId}
      />
      <ConfirmDialog
        confirmLabel="Eliminar producto"
        description="Se eliminará este producto y también sus imágenes. Esta acción no se puede deshacer."
        isOpen={isConfirmOpen}
        isPending={isPending}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar producto"
        variant="danger"
      />
      <LoadingOverlay isVisible={isPending} message="Eliminando producto..." />
      <ResultModal
        autoCloseMs={8000}
        description={result?.description ?? ""}
        isOpen={result !== null}
        onClose={handleCloseResult}
        title={result?.title ?? ""}
        variant={result?.variant ?? "success"}
      />
    </>
  );
}
