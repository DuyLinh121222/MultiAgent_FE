/**
 * Thu nhỏ ảnh trước khi tải lên (ảnh điện thoại 4-8MB -> khoảng 300-600KB): tải nhanh hơn, AI đọc vẫn rõ.
 * Trình duyệt không đọc được định dạng (VD HEIC trên Chrome) thì giữ nguyên ảnh gốc.
 */
export async function compressImage(file, maxSide = 1800, quality = 0.85) {
  if (!file?.type?.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}
