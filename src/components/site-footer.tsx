"use client";

import React from "react";
import { ExternalLink, MapPin, Phone, Sparkles } from "lucide-react";

interface CampusFooterItem {
  name: string;
  address: string;
  phoneDisplay: string;
  phoneHref: string;
  mapUrl: string;
  campusUrl: string;
}

const SKYLINE_CAMPUSES: CampusFooterItem[] = [
  {
    name: "Cơ sở Sky-Line Riverside",
    address: "Lô A2.4 Trần Đăng Ninh, phường Hòa Cường, Thành phố Đà Nẵng",
    phoneDisplay: "(+84) 236.378.7777",
    phoneHref: "tel:+842363787777",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Sky-Line+Riverside+L%C3%B4+A2.4+Tr%E1%BA%A7n+%C4%90%C4%83ng+Ninh+%C4%90%C3%A0+N%E1%BA%B5ng",
    campusUrl: "https://skylineschool.edu.vn/",
  },
  {
    name: "Cơ sở Sky-Line Central",
    address: "48 Nguyễn Du, phường Hải Châu, Thành phố Đà Nẵng",
    phoneDisplay: "(+84) 236.356.8777",
    phoneHref: "tel:+842363568777",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Sky-Line+Central+48+Nguy%E1%BB%85n+Du+H%E1%BA%A3i+Ch%C3%A2u+%C4%90%C3%A0+N%E1%BA%B5ng",
    campusUrl: "https://skylineschool.edu.vn/",
  },
  {
    name: "Cơ sở Sky-Line Global",
    address: "Lô A2 Trần Đăng Ninh, phường Hòa Cường, Thành phố Đà Nẵng",
    phoneDisplay: "(+84) 236.378.7779",
    phoneHref: "tel:+842363787779",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Sky-Line+Global+L%C3%B4+A2+Tr%E1%BA%A7n+%C4%90%C4%83ng+Ninh+%C4%90%C3%A0+N%E1%BA%B5ng",
    campusUrl: "https://skylineschool.edu.vn/",
  },
  {
    name: "Cơ sở Sky-Line Hill",
    address: "Khối Hà My Đông A, phường Điện Bàn Đông, Thành phố Đà Nẵng",
    phoneDisplay: "(+84) 235.375.1777",
    phoneHref: "tel:+842353751777",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Sky-Line+Hill+H%C3%A0+My+%C4%90%C3%B4ng+A+%C4%90i%E1%BB%87n+B%C3%A0n",
    campusUrl: "https://skylineschool.edu.vn/",
  },
  {
    name: "Cơ sở Sky-Line Beach",
    address: "199 Trần Anh Tông, phường Thanh Khê, Thành phố Đà Nẵng",
    phoneDisplay: "(+84) 236.366.9777",
    phoneHref: "tel:+842363669777",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Sky-Line+Beach+199+Tr%E1%BA%A7n+Anh+T%C3%B4ng+Thanh+Kh%C3%AA+%C4%90%C3%A0+N%E1%BA%B5ng",
    campusUrl: "https://skylineschool.edu.vn/",
  },
  {
    name: "Trung tâm Sống Thành Công Sky-Line",
    address: "48 Nguyễn Du, phường Hải Châu, Thành phố Đà Nẵng",
    phoneDisplay: "(+84) 236.382.6677",
    phoneHref: "tel:+842363826677",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=48+Nguy%E1%BB%85n+Du+H%E1%BA%A3i+Ch%C3%A2u+%C4%90%C3%A0+N%E1%BA%B5ng",
    campusUrl: "https://skylineschool.edu.vn/",
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#060d1f] text-slate-200 border-t border-slate-800/80 relative overflow-hidden select-none">
      {/* Hiệu ứng ánh sáng viền trên tinh tế */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#00a19a]/60 to-transparent pointer-events-none" />

      {/* PHẦN TRÊN: HỆ THỐNG 6 CƠ SỞ SKY-LINE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-9">
        {/* Hàng tiêu đề: HỆ THỐNG CƠ SỞ & Xem tất cả cơ sở */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
            HỆ THỐNG CƠ SỞ
          </h3>
          <a
            href="https://skylineschool.edu.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm font-semibold text-[#00b5ad] hover:text-[#2dd4bf] transition-colors inline-flex items-center gap-1.5 group"
          >
            <span>Xem tất cả cơ sở</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* Lưới 3 cột x 2 hàng hiển thị 6 Cơ sở / Trung tâm */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-7">
          {SKYLINE_CAMPUSES.map((campus, index) => (
            <div
              key={index}
              className="pt-4 border-t border-slate-800/90 hover:border-[#00a19a]/50 transition-colors group"
            >
              <a
                href={campus.campusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-bold text-sm sm:text-[15px] text-white group-hover:text-[#2dd4bf] transition-colors"
              >
                {campus.name}
              </a>

              <p className="mt-2 text-xs sm:text-[13px] text-slate-300/90 leading-relaxed flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5 hidden sm:inline-block" />
                <span>{campus.address}</span>
              </p>

              <div className="mt-2.5 flex items-center gap-5 text-xs sm:text-[13px]">
                <a
                  href={campus.phoneHref}
                  className="text-slate-200 hover:text-white font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3 h-3 text-[#00b5ad] hidden sm:inline-block" />
                  <span>{campus.phoneDisplay}</span>
                </a>

                <a
                  href={campus.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#00b5ad] hover:text-[#2dd4bf] hover:underline underline-offset-4 transition-colors"
                >
                  Xem bản đồ
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ĐƯỜNG KẺ NGĂN CÁCH */}
      <div className="border-t border-slate-800/90 bg-[#040917]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Bản quyền Hệ thống Giáo dục Sky-Line */}
          <div className="text-slate-400 font-medium text-center sm:text-left">
            <a
              href="https://skylineschool.edu.vn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition-colors"
            >
              © 2026 Hệ thống Giáo dục Sky-Line
            </a>
          </div>

          {/* DẤU ẤN TÁC GIẢ: Design by DAH95 */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-sky-950/90 via-slate-900 to-amber-950/80 border border-sky-500/30 shadow-sm shadow-sky-500/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[11px] sm:text-xs font-semibold text-slate-300 tracking-wide">
                Design by{" "}
                <span className="font-black tracking-wider bg-gradient-to-r from-sky-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
                  DAH95
                </span>
              </span>
            </div>
          </div>

          {/* Liên kết Liên hệ */}
          <div className="flex items-center gap-5 text-slate-400 font-medium">
            <a
              href="https://skylineschool.edu.vn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#2dd4bf] transition-colors"
            >
              Trang chủ Sky-Line
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="https://skylineschool.edu.vn/vi/lien-he"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#2dd4bf] transition-colors"
            >
              Liên hệ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
