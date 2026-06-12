type EmptyProductListProps = {
  message: string;
  title: string;
};

export function EmptyProductList({ message, title }: EmptyProductListProps) {
  return (
    <div className="admin-empty-state">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

