"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  School,
  LayoutDashboard,
  Calendar,
  Laptop,
  Bot,
  Users,
  CheckCircle2,
  Trophy,
  Moon,
  Sun,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  MapPin,
  Clock,
  KeyRound,
  Check,
  ChevronRight,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserNav } from "@/components/user-nav";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);

  // Khi truy cập trang web thì tự động chuyển sang /login (hoặc /dashboard nếu đã đăng nhập)
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    };
    checkAuthAndRedirect();
  }, [router]);

  // Đồng bộ chế độ sáng / tối
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const campuses = [
    {
      name: "Sky-Line Riverside",
      address: "Số 51 Xô Viết Nghệ Tĩnh, Q. Hải Châu",
      type: "Trụ sở chính & Lab STEM Tiêu Chuẩn",
      color: "from-sky-500 to-blue-600",
      tag: "Trụ sở chính",
    },
    {
      name: "Sky-Line Central",
      address: "Số 48 Nguyễn Tri Phương, Q. Thanh Khê",
      type: "Phòng máy ICT & Đồ họa số",
      color: "from-blue-600 to-indigo-600",
      tag: "Cơ sở trung tâm",
    },
    {
      name: "Sky-Line Beach",
      address: "Đường Nguyễn Hữu Thọ, Q. Cẩm Lệ",
      type: "Trung tâm Huấn luyện Đội tuyển Robot VEX",
      color: "from-amber-500 to-orange-600",
      tag: "Trọng điểm Robotics",
    },
    {
      name: "Sky-Line Hill",
      address: "Khu Đô thị Sinh thái Hòa Xuân, Cẩm Lệ",
      type: "Không gian Sáng tạo Công nghệ số",
      color: "from-emerald-500 to-teal-600",
      tag: "Không gian Xanh",
    },
    {
      name: "Sky-Line International",
      address: "Đường Trần Đăng Ninh, Q. Hải Châu",
      type: "Chương trình Tin học Quốc tế Cambridge",
      color: "from-purple-500 to-indigo-700",
      tag: "Chuẩn Quốc Tế",
    },
  ];

  const pillars = [
    {
      icon: <Calendar className="w-7 h-7 text-sky-500" />,
      badge: "Trụ Cột 2B",
      badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
      title: "Thời Khóa Biểu & Lịch Phòng Lab Chống Trùng",
      description:
        "Lưới xếp lịch trực quan từ Thứ 2 đến Thứ 7. Hệ thống tự động phát hiện và cảnh báo tức thời nếu giáo viên bị trùng tiết hoặc phòng Lab bị đặt đúp.",
      benefits: [
        "Phát hiện xung đột lịch dạy tức thời",
        "Xem lịch theo từng giáo viên và từng cơ sở",
        "Hỗ trợ in ấn và xuất báo cáo PDF chuẩn chỉnh",
      ],
      linkText: "Xem Lịch Dạy",
      href: "/dashboard",
    },
    {
      icon: <Bot className="w-7 h-7 text-amber-500" />,
      badge: "Trụ Cột 3A",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
      title: "Quản Trị Thiết Bị & Robot STEM Linh Hoạt",
      description:
        "Kiểm kê chi tiết bộ kit Lego Spike Prime, robot VEX IQ và dàn máy tính tại 5 cơ sở. Báo cáo sự cố hư hỏng tức thời không cần văn bản giấy tờ rườm rà.",
      benefits: [
        "Theo dõi số lượng và vị trí từng thiết bị",
        "Gửi phiếu báo hỏng có ghi chú chi tiết",
        "Tổ trưởng duyệt bảo trì trực tiếp trên hệ thống",
      ],
      linkText: "Kiểm Kê Thiết Bị",
      href: "/dashboard",
    },
    {
      icon: <Users className="w-7 h-7 text-emerald-500" />,
      badge: "Trụ Cột 1A",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
      title: "Cấp Tài Khoản & Phân Quyền Bảo Mật",
      description:
        "Tổ trưởng ICT chủ động cấp tài khoản giáo viên mới ngay tại màn hình quản trị. Dữ liệu được bảo vệ an toàn từng dòng với công nghệ Supabase RLS.",
      benefits: [
        "Tổ trưởng chủ động tạo tài khoản không cần nhờ IT",
        "Phân quyền minh bạch: Tổ Trưởng & Giáo Viên",
        "Đồng bộ hồ sơ tự động qua tủ hồ sơ Supabase",
      ],
      linkText: "Quản Lý Nhân Sự",
      href: "/dashboard",
    },
    {
      icon: <Trophy className="w-7 h-7 text-rose-500" />,
      badge: "Trụ Cột 4",
      badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
      title: "Phân Công Nhiệm Vụ & Bảng Vàng Vinh Danh",
      description:
        "Quản lý tiến độ công việc chuẩn Kanban. Lưu trữ và vinh danh những thành tích rực rỡ tại các đấu trường Robothon Quốc tế và Tin học trẻ.",
      benefits: [
        "Bảng công việc trực quan 4 cột trạng thái",
        "Hồ sơ thành tích và giải thưởng Robothon",
        "Ghi nhận đóng góp của từng thầy cô hướng dẫn",
      ],
      linkText: "Xem Bảng Vàng",
      href: "/dashboard",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans">
      {/* ========================================================================= */}
      {/* THANH ĐIỀU HƯỚNG TRANG CHỦ (HEADER)                                       */}
      {/* Có đầy đủ nút vào /dashboard và Logo tài khoản ở góc trên bên phải        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo nhận diện Hệ thống Giáo dục Sky-Line */}
          <Link href="/" className="flex items-center gap-3.5 group cursor-pointer">
            <div className="h-11 px-3 py-1.5 rounded-2xl bg-white dark:bg-white/95 border border-slate-200/80 dark:border-white/20 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/LogoSKL.png"
                alt="Logo Trường Sky-Line"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs font-black tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                Hệ Thống Giáo Dục Sky-Line
              </div>
              <div className="text-base sm:text-lg font-black bg-gradient-to-r from-sky-700 via-sky-600 to-amber-600 dark:from-sky-400 dark:to-amber-400 bg-clip-text text-transparent">
                Cổng Thông Tin Tổ Chuyên Môn ICT
              </div>
            </div>
          </Link>

          {/* Menu liên kết điều hướng trên máy tính */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#tinh-nang" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Tính Năng Nổi Bật
            </a>
            <a href="#co-so" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              5 Cơ Sở Sky-Line
            </a>
            <Link href="/dashboard" className="text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 font-bold">
              Bảng Điều Khiển
              <Badge variant="default" className="text-[9px] px-1 py-0 ml-0.5">/dashboard</Badge>
            </Link>
          </nav>

          {/* Khu vực thao tác góc trên bên phải */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* NÚT VÀO BẢNG ĐIỀU KHIỂN (/dashboard) NỔI BẬT */}
            <Link href="/dashboard">
              <Button
                variant="default"
                size="sm"
                className="shadow-md shadow-sky-600/20 font-bold text-xs sm:text-sm flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Vào Bảng Điều Khiển</span>
                <span className="sm:hidden">Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>

            {/* Nút Đổi giao diện Sáng / Tối */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              title="Đổi giao diện Sáng / Tối"
              aria-label="Đổi giao diện Sáng / Tối"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-600" />}
            </button>

            {/* LOGO TÀI KHOẢN ĐĂNG NHẬP Ở GÓC PHÍA TRÊN BÊN PHẢI & THOÁT KHỎI TÀI KHOẢN */}
            <UserNav />
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION TRANG CHỦ                                                    */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 pt-12 pb-18 sm:pt-16 sm:pb-24 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Hào quang màu Sky-Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 bg-gradient-to-r from-sky-400/15 via-amber-400/10 to-sky-500/15 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Huy hiệu Cổng thông tin */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-800/90 border border-sky-200 dark:border-sky-800/60 shadow-sm text-sky-800 dark:text-sky-300 text-xs sm:text-sm font-bold mb-6 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Nền Tảng Điều Hành Chuyên Môn Số Hoá 2026-2027</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Trực Tuyến</span>
          </div>

          {/* Tiêu đề chính */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Cổng Thông Tin Quản Trị & Vận Hành{" "}
            <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-amber-500 bg-clip-text text-transparent">
              Tổ Chuyên Môn ICT
            </span>
          </h1>

          {/* Đoạn mô tả sư phạm thân thiện */}
          <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Giải pháp toàn diện kết nối 5 cơ sở trường Sky-Line: Sắp xếp Thời khóa biểu thông minh chống trùng giờ,
            giám sát thiết bị phòng Lab & Robot STEM, điều phối công việc và vinh danh thành tích học sinh.
          </p>

          {/* Các nút hành động chính (CTAs) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
            <Link href="/dashboard">
              <Button
                variant="default"
                size="lg"
                className="font-bold text-sm sm:text-base px-6 sm:px-8 py-3.5 shadow-xl shadow-sky-600/25 flex items-center gap-2"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Truy Cập Bảng Điều Khiển (/dashboard)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="font-bold text-sm sm:text-base px-6 py-3.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <KeyRound className="w-5 h-5 text-amber-500" />
                <span>Đăng Nhập Tài Khoản (/login)</span>
              </Button>
            </Link>
          </div>

          {/* 4 Thống kê nhanh minh chứng chất lượng */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">05</div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">Cơ Sở Kết Nối Đồng Bộ</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">100%</div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">Chống Trùng Tiết & Phòng Lab</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400">48+</div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">Bộ Kit Robot VEX & Lego</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-rose-500 dark:text-rose-400">100%</div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">Bảo Mật Tủ Hồ Sơ Supabase</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TÍNH NĂNG NỔI BẬT (THEO ĐÚNG BẢN KẾ HOẠCH DỰ ÁN)                           */}
      {/* ========================================================================= */}
      <section id="tinh-nang" className="py-16 sm:py-20 bg-slate-50/70 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4 text-amber-500" />
              Các Trụ Cột Vận Hành Cốt Lõi
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Được Thiết Kế Riêng Biệt Cho Thầy Cô ICT Sky-Line
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Mỗi tính năng đều được tối ưu để tiết kiệm thời gian sổ sách, giúp thầy cô tập trung tối đa vào công tác giảng dạy và bồi dưỡng học sinh tài năng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((pillar, idx) => (
              <Card
                key={idx}
                className="border-slate-200/90 dark:border-slate-800/90 hover:shadow-xl hover:border-sky-300 dark:hover:border-sky-800 transition-all duration-200 group bg-white dark:bg-slate-900"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                      {pillar.icon}
                    </div>
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${pillar.badgeColor}`}>
                      {pillar.badge}
                    </span>
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-bold group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {pillar.title}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {pillar.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="space-y-2 mb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {pillar.benefits.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>

                  <Link href={pillar.href}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full font-bold text-xs flex items-center justify-center gap-1.5 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600 transition-all"
                    >
                      <span>{pillar.linkText} tại /dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5 CƠ SỞ SKY-LINE                                                          */}
      {/* ========================================================================= */}
      <section id="co-so" className="py-16 sm:py-20 bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
              <MapPin className="w-4 h-4" />
              Mạng Lưới Giáo Dục
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Đồng Bộ Dữ Liệu Chuyên Môn Qua 5 Cơ Sở Trường
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Tổ trưởng và các thầy cô dễ dàng chuyển đổi góc nhìn theo từng cơ sở để theo dõi sát sao phòng Lab, máy tính và lịch dạy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {campuses.map((campus, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-slate-700 inline-block mb-2">
                    {campus.tag}
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {campus.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {campus.address}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  ⚡ {campus.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BANNER KÊU GỌI HÀNH ĐỘNG (CTA)                                            */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-16 bg-gradient-to-r from-sky-700 via-sky-600 to-amber-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Sẵn Sàng Bắt Đầu Ca Làm Việc Tại Bảng Điều Khiển?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-sky-100 max-w-2xl mx-auto font-normal">
            Bấm ngay vào Bảng Điều Khiển để xem thời khóa biểu hôm nay, kiểm tra tình trạng phòng Lab và cập nhật nhiệm vụ mới.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-white text-sky-800 hover:bg-slate-100 font-extrabold text-sm sm:text-base px-8 py-3.5 shadow-2xl rounded-2xl"
              >
                <LayoutDashboard className="w-5 h-5 mr-2 text-sky-600" />
                Vào Bảng Điều Khiển (/dashboard)
              </Button>
            </Link>

            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="bg-sky-800/40 border-white/40 text-white hover:bg-sky-800/70 font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl"
              >
                <KeyRound className="w-4 h-4 mr-1.5" />
                Đăng Nhập Tài Khoản
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER BẢN QUYỀN SKY-LINE                                                 */}
      {/* ========================================================================= */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 px-2 py-1 rounded-xl bg-white/95 flex items-center justify-center shadow-xs">
              <img
                src="/LogoSKL.png"
                alt="Logo Trường Sky-Line"
                className="h-5 w-auto object-contain"
              />
            </div>
            <div>
              <div className="font-bold text-slate-200">
                Hệ Thống Giáo Dục Sky-Line • Tổ Chuyên Môn ICT
              </div>
              <div className="text-[11px] text-slate-500">
                Cổng thông tin nội bộ bám sát Bản Kế Hoạch Chuyên Môn 2026-2027
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/" className="hover:text-white transition-colors">
              Trang Chủ
            </Link>
            <span>•</span>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Bảng Điều Khiển (/dashboard)
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-white transition-colors">
              Đăng Nhập (/login)
            </Link>
          </div>

          <div className="text-[11px] text-slate-500 text-center md:text-right">
            © 2026 Sky-Line Education Group. Bản quyền thuộc về Tổ Chuyên Môn ICT.
          </div>
        </div>
      </footer>
    </div>
  );
}
