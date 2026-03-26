export default function SubcategoryList({
  subcategories,
  selectedId,
  onSelect,
}: {
  subcategories: Array<{ id: string; name: string }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  [key: string]: unknown;
}) {
  return (
    <div>
      {subcategories.map((sub) => (
        <button
          key={sub.id}
          data-testid={`subcategory-row-${sub.id}`}
          aria-selected={sub.id === selectedId}
          onClick={() => onSelect(sub.id)}
        >
          {sub.name}
        </button>
      ))}
    </div>
  );
}
