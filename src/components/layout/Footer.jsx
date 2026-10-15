export default function Footer() {
  return (
    <footer className="mt-space-xl w-full bg-surface-container-low py-space-xl">
      <div className="flex w-full flex-col items-center justify-between gap-space-md px-margin-mobile text-body-sm text-on-surface-variant md:flex-row md:px-margin">
        <div>MAEL – Nền tảng học Toán THCS đa trí tuệ nhân tạo (Thầy AI • Bạn Soát Lỗi • Bạn Sáng Tạo).</div>
        <div className="flex items-center gap-space-lg">
          <a className="transition-colors hover:text-primary" href="#">Điều khoản sử dụng</a>
          <a className="transition-colors hover:text-primary" href="#">Chính sách bảo mật</a>
          <a className="transition-colors hover:text-primary" href="#">Hỗ trợ phụ huynh</a>
        </div>
      </div>
    </footer>
  )
}
