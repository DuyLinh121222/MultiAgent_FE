import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

/** Điện thoại / máy tính bảng: dùng camera gốc của máy qua <input capture> (nét hơn, có lấy nét) */
export const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

export const canUseWebcam = () =>
  typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

/**
 * Chụp ảnh bằng webcam trên máy tính. Bấm "Chụp" -> trả về File JPG qua onCapture.
 * Không mở được camera (bị chặn quyền, không có webcam) thì báo lỗi để học sinh tải ảnh lên thay.
 */
export default function CameraCapture({ open, onClose, onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    setError('')
    setReady(false)
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().then(() => setReady(true)).catch(() => setReady(true))
        }
      })
      .catch(() => setError('Không mở được camera. Em cho phép trình duyệt dùng camera, hoặc bấm "Chọn ảnh" để tải ảnh lên nhé.'))
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [open])

  const snap = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      onCapture(new File([blob], `bai-lam-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.9)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-inverse-surface/80 p-space-md">
      <div className="pop-in flex w-full max-w-2xl flex-col gap-space-md rounded-[28px] bg-surface-container-lowest p-space-md shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-sm text-on-surface">Chụp bài làm</h2>
          <button type="button" className="btn-ghost px-2" onClick={onClose} aria-label="Đóng"><Icon name="close" /></button>
        </div>
        {error ? (
          <div className="rounded-2xl bg-error-container p-space-md text-label-lg text-on-error-container">{error}</div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} playsInline muted className="max-h-[60vh] w-full object-contain" />
            {!ready && <div className="absolute inset-0 flex items-center justify-center text-label-lg text-white">Đang mở camera...</div>}
          </div>
        )}
        <p className="text-body-sm text-on-surface-variant">Đặt trang vở thẳng, đủ sáng, chữ rõ. Bài dài thì chụp nhiều ảnh.</p>
        <div className="flex justify-end gap-space-sm">
          <button type="button" className="btn-ghost" onClick={onClose}>Xong</button>
          <button type="button" className="btn-primary px-space-xl" disabled={!ready || Boolean(error)} onClick={snap}>
            <Icon name="photo_camera" filled className="text-[22px]" /> Chụp
          </button>
        </div>
      </div>
    </div>
  )
}
