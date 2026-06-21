// Primera foto de un producto como data URI base64 (mismo criterio que el
// avatar en users.ts: la columna es BLOB, el MIME se infiere de los magic
// bytes). Si el producto no tiene fotos, caemos a un placeholder (el campo `img`
// es no-nullable en los schemas del front). A futuro: thumbnail en R2 y devolver
// URL en vez de base64. Compartido por products y transactions.
export function firstPhotoToImg(
  photo: Buffer | null | undefined,
  productId: number,
): string {
  if (!photo || photo.length === 0)
    return `https://picsum.photos/seed/product-${productId}/200`;
  const mime =
    photo[0] === 0x89
      ? "image/png"
      : photo[0] === 0x47
        ? "image/gif"
        : "image/jpeg"; // JPEG (0xFF) y fallback
  return `data:${mime};base64,${Buffer.from(photo).toString("base64")}`;
}
