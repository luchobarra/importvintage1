import Link from "next/link";

type ProductListItemActionsProps = {
  isDeleting: boolean;
  productId: string;
  onDelete: () => void;
};

export function ProductListItemActions({
  isDeleting,
  productId,
  onDelete,
}: ProductListItemActionsProps) {
  return (
    <div className="admin-product-item__actions">
      <Link className="button" href={`/retro-campus-admin/productos/${productId}`}>
        Editar
      </Link>
      <button
        className="button button--danger"
        disabled={isDeleting}
        onClick={onDelete}
        type="button"
      >
        Eliminar
      </button>
    </div>
  );
}
