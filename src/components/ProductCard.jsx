import ProductImage from './ProductImage.jsx'

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <ProductImage src={product.image} alt={product.name} />
      <h3 className="product-name">{product.name}</h3>
      <p className="product-category">{product.category}</p>
      <p className="product-price">{product.price}</p>
      <p className="product-description">{product.description}</p>
    </article>
  )
}
