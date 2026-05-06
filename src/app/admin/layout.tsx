// 관리자 페이지 전용 레이아웃
// 루트 layout.tsx의 max-w-[480px] 제한을 CSS로 해제
import "./admin.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="admin-root">
      {children}
    </div>
  );
}
