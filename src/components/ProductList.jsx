import ProductCard from './ProductCard.jsx'

export default function ProductList({ products }) {
  return (
    <ul className="product-list">
      {products.map((product) => (
        <li key={product.name}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}
