"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  ShieldCheck,
  ChevronDown,
  KeyRound,
  Mail,
  MapPin,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ChangePasswordModal } from "@/components/change-password-modal";

interface UserNavProps {
  user?: {
    id?: string;
    name: string;
    email: string;
    role: "leader" | "teacher" | "guest";
    campus: string;
    avatar?: string;
  };
  onLogout?: () => void;
  onSwitchProfile?: (profile: {
    id: string;
    name: string;
    email: string;
    role: "leader" | "teacher" | "guest";
    campus: string;
  }) => void;
}

export function UserNav({
  user: initialUser,
  onLogout,
}: UserNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState(
    initialUser || {
      name: "Thầy Đỗ Anh Huy",
      email: "huyda@skylineschool.edu.vn",
      role: "leader" as const,
      campus: "Sky-Line Riverside (Bao quát 5 cơ sở)",
    }
  );

  // Tự động tải thông tin tài khoản thật từ Supabase Auth nếu chưa có từ component cha
  useEffect(() => {
    // Nếu component cha đã truyền thông tin người dùng vào thì không cần query lại
    if (initialUser && initialUser.email) {
      setCurrentUser(initialUser);
      return;
    }

    async function loadUser() {
      try {
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          // Bỏ qua nếu phiên đăng nhập không tồn tại hoặc refresh token hết hạn
          return;
        }

        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, role, campus_id")
            .eq("id", authUser.id)
            .single();

          if (profile) {
            setCurrentUser({
              name: profile.full_name || authUser.email || "Giáo Viên",
              email: profile.email || authUser.email || "",
              role: (profile.role as "leader" | "teacher" | "guest") || "teacher",
              campus:
                profile.role === "leader"
                  ? "Sky-Line Riverside (Bao quát 5 cơ sở)"
                  : profile.role === "guest"
                  ? "Toàn hệ thống Sky-Line (Chế độ Chỉ Xem)"
                  : `Cơ sở Sky-Line (${profile.campus_id || "Riverside"})`,
            });
          }
        }
      } catch {
        // Bắt lỗi an toàn
      }
    }
    loadUser();
  }, [initialUser]);

  // Cập nhật khi prop thay đổi
  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
    }
  }, [initialUser]);

  // Đóng dropdown khi nhấp chuột ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = async () => {
    setIsOpen(false);
    await supabase.auth.signOut();
    if (onLogout) {
      onLogout();
    } else {
      router.push("/login");
      router.refresh();
    }
  };

  const user = currentUser;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Nút bấm Avatar Tài Khoản ở góc trên bên phải */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500"
        title="Quản lý tài khoản cá nhân"
      >
        {/* Logo Avatar tròn cách điệu */}
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-amber-500 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
            {user.role === "leader" ? "TT" : user.role === "guest" ? "KH" : "GV"}
          </div>
          {/* Đèn xanh báo trạng thái trực tuyến */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
        </div>

        {/* Họ tên và vai trò (hiển thị trên màn hình máy tính) */}
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[140px] truncate leading-tight">
            {user.name}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 leading-tight">
            <ShieldCheck className="w-3 h-3 text-amber-500" />
            {user.role === "leader"
              ? "Tổ Trưởng ICT"
              : user.role === "guest"
              ? "Khách (Chỉ xem)"
              : "Giáo Viên"}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Menu thả xuống (Dropdown): Chỉ giữ lại Hồ sơ cá nhân, Đổi mật khẩu bảo mật (ẩn với Khách), Đăng xuất */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsProfileModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold text-left cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Hồ sơ cá nhân</span>
            </button>

            {user.role !== "guest" && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsPasswordModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-semibold text-left cursor-pointer text-slate-700 dark:text-slate-200"
              >
                <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Đổi mật khẩu bảo mật</span>
              </button>
            )}
          </div>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          {/* NÚT ĐĂNG XUẤT */}
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}

      {/* CỬA SỔ MODAL HỒ SƠ CÁ NHÂN */}
      {isProfileModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 font-sans animate-in fade-in duration-150"
            onClick={() => setIsProfileModalOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 bg-gradient-to-r from-sky-600 to-sky-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <User className="w-5 h-5" />
                  <h3 className="font-bold text-base tracking-normal">Hồ Sơ Cá Nhân</h3>
                </div>
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-amber-500 text-white font-bold flex items-center justify-center text-lg shadow-md shrink-0">
                    {user.role === "leader" ? "TT" : user.role === "guest" ? "KH" : "GV"}
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="text-base font-bold text-slate-900 dark:text-white truncate leading-snug">
                      {user.name}
                    </div>
                    <Badge variant="amber" className="text-xs font-semibold px-2.5 py-0.5">
                      {user.role === "leader"
                        ? "Tổ Trưởng Chuyên Môn ICT"
                        : user.role === "guest"
                        ? "Tài Khoản Khách (Chỉ Xem)"
                        : "Giáo Viên Chuyên Môn ICT"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 shrink-0">
                      <Mail className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      Email công vụ:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {user.email}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 shrink-0">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      Cơ sở công tác:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 text-right">
                      {user.campus}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="rounded-xl px-5 font-semibold cursor-pointer"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* CỬA SỔ MODAL ĐỔI MẬT KHẨU BẢO MẬT */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmail={user.email}
      />
    </div>
  );
}
