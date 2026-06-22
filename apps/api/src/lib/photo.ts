// URL de la primera foto de un producto, servida por el endpoint /photo/:id del
// propio API. IMPORTANTE: no embebemos la imagen en base64 — traer los blobs de
// las fotos en las queries de lista (products.list, transactions) revienta el
// límite de tamaño de D1 (SQLITE_TOOBIG) en cuanto hay fotos reales. Por eso la
// query trae solo el `id` de la foto y acá construimos la URL absoluta con el
// origin de la request (context.apiOrigin). Si el producto no tiene fotos caemos
// a un placeholder (el campo `img` es no-nullable en los schemas del front).
// Compartido por products y transactions.
export function firstPhotoToImg(
  photoId: number | null | undefined,
  apiOrigin: string,
  productId: number,
): string {
  if (photoId == null)
    return `https://picsum.photos/seed/product-${productId}/200`;
  return `${apiOrigin}/photo/${photoId}`;
}
