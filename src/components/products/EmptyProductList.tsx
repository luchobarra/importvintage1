type EmptyProductListProps = {
  message: string;
  title: string;
};

export function EmptyProductList({ message, title }: EmptyProductListProps) {
  return (
    <div className="admin-empty-state ui-empty-state">
      <div className="ui-empty-state__content">
        <h2 className="text-h2">{title}</h2>
        <p className="text-body">{message}</p>
      </div>
    </div>
  );
}
