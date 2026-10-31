import DashboardPage from "../page";

export function generateStaticParams() {
  return [
    { slug: ["tong-quan"] },
    { slug: ["lich-giang-day"] },
    { slug: ["lich-giang-day", "lich-phong-lab"] },
    { slug: ["lich-giang-day", "tkb-giao-vien"] },
    { slug: ["lich-giang-day", "phan-cong-chuyen-mon"] },
    { slug: ["thiet-bi-robot"] },
    { slug: ["cong-viec"] },
    { slug: ["cong-viec", "xu-ly-su-vu"] },
    { slug: ["doi-tuyen"] },
    { slug: ["thanh-tich"] },
    { slug: ["nhan-su"] },
    { slug: ["nhan-su", "danh-gia-nang-luc"] },
  ];
}

export default function DashboardCatchAllRoutePage() {
  return <DashboardPage />;
}
