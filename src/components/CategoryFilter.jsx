// Kategori filtresi: seçili kategori aria-pressed ile işaretlenir; boş değer ('') tüm ürünleri gösterir.
export default function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <div className="category-filter" role="group" aria-label="Kategoriye göre filtrele">
      {['', ...categories].map((category) => (
        <button type="button" key={category} aria-pressed={selected === category} onClick={() => onSelect(category)}>
          {category || 'Tümü'}
        </button>
      ))}
    </div>
  )
}
