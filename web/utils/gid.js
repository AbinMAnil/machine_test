/**
 * Shopify GID utility helpers
 */

export function toProductGid(id) {
  if (!id) return '';
  const str = String(id).trim();
  if (/^\d+$/.test(str)) {
    return `gid://shopify/Product/${str}`;
  }
  return str;
}

export function toCollectionGid(id) {
  if (!id) return '';
  const str = String(id).trim();
  if (/^\d+$/.test(str)) {
    return `gid://shopify/Collection/${str}`;
  }
  return str;
}

export function extractIdFromGid(gid) {
  if (!gid) return '';
  const parts = String(gid).split('/');
  return parts[parts.length - 1];
}
