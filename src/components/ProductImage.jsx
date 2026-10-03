export default function ProductImage({ src, alt }) {
  if (!src) {
    return <div className="product-image" aria-hidden="true" />
  }

  return <img className="product-image" src={src} alt={alt} width="300" height="300" />
}
