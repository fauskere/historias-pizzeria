/**
 * Utility helper para obtener información de media de carpetas
 * (imágenes individuales o packs secuenciales).
 */
export function getFolderMediaInfo(folder) {
  if (!folder) {
    return { 
      count: 0, 
      packsCount: 0, 
      previewUrl: '', 
      mediaType: 'image', 
      hasMedia: false, 
      isSingle: true 
    };
  }

  const packs = Array.isArray(folder.packs) ? folder.packs : [];
  const items = Array.isArray(folder.items) ? folder.items : [];
  const isSingle = folder.mode === 'single' || (packs.length === 0 && items.length > 0);

  if (!isSingle && packs.length > 0) {
    const totalImgs = packs.reduce((acc, p) => acc + (p.images?.length || 0), 0);
    const firstImg = packs.find(p => p.images?.length > 0)?.images[0];
    return {
      count: totalImgs,
      packsCount: packs.length,
      previewUrl: firstImg?.url || '',
      mediaType: firstImg?.mediaType || 'image',
      hasMedia: totalImgs > 0,
      isSingle: false
    };
  }

  return {
    count: items.length,
    packsCount: items.length,
    previewUrl: items[0]?.url || '',
    mediaType: items[0]?.mediaType || 'image',
    hasMedia: items.length > 0,
    isSingle: true
  };
}
