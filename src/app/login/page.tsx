"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  KeyRound,
  Info,
  X,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  User,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { createClient } from "@/lib/supabase/client";

interface VerifiedTeacherInfo {
  id: string;
  email: string;
  full_name: string;
  role: string;
  campus_id: string;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "info";
  } | null>(null);

  // =========================================================================
  // STATE CHO CỬA SỔ KHÔI PHỤC MẬT KHẨU ("QUÊN MẬT KHẨU?")
  // =========================================================================
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotFullName, setForgotFullName] = useState("");
  const [verifiedTeacher, setVerifiedTeacher] = useState<VerifiedTeacherInfo | null>(null);
  const [newResetPassword, setNewResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [showNewResetPassword, setShowNewResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Khởi tạo và đồng bộ chế độ Sáng / Tối từ bộ nhớ trình duyệt
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("skyline_theme");
      if (savedTheme === "dark") {
        setIsDark(true);
        document.documentElement.classList.add("dark");
      } else if (savedTheme === "light") {
        setIsDark(false);
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // Bỏ qua lỗi lưu trữ
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try {
      localStorage.setItem("skyline_theme", nextDark ? "dark" : "light");
    } catch {
      // Bỏ qua lỗi lưu trữ
    }
    showToast(
      nextDark
        ? "Đã chuyển sang giao diện Chế độ Tối (Bảo vệ mắt)!"
        : "Đã chuyển sang giao diện Chế độ Sáng!",
      "info"
    );
  };

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mở cửa sổ Quên mật khẩu
  const handleOpenForgotModal = () => {
    setForgotEmail(email.trim());
    setForgotFullName("");
    setVerifiedTeacher(null);
    setNewResetPassword("");
    setConfirmResetPassword("");
    setShowNewResetPassword(false);
    setShowConfirmResetPassword(false);
    setForgotError(null);
    setForgotStep(1);
    setIsForgotOpen(true);
  };

  // Bước 1: Xác minh Email + Họ và tên giáo viên
  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotEmail.trim()) {
      setForgotError("Vui lòng nhập địa chỉ Email nhà trường cấp!");
      return;
    }

    if (!forgotFullName.trim()) {
      setForgotError("Vui lòng nhập Họ và tên của thầy/cô để đối chiếu hồ sơ!");
      return;
    }

    setIsForgotSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("verify_teacher_recovery_identity", {
        p_email: forgotEmail.trim(),
        p_full_name: forgotFullName.trim(),
      });

      if (error) {
        setForgotError("Không thể kết nối xác minh hồ sơ: " + error.message);
        return;
      }

      if (!data?.verified) {
        setForgotError(
          data?.message ||
            "Thông tin Email hoặc Họ và tên chưa khớp với hồ sơ Tổ Chuyên Môn ICT!"
        );
        return;
      }

      setVerifiedTeacher({
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        campus_id: data.campus_id,
      });
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err?.message || "Đã xảy ra lỗi khi kiểm tra thông tin!");
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // Bước 2: Lưu mật khẩu mới
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!newResetPassword || newResetPassword.length < 6) {
      setForgotError("Mật khẩu mới phải có tối thiểu 6 ký tự!");
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      setForgotError("Mật khẩu xác nhận chưa trùng khớp với mật khẩu mới!");
      return;
    }

    setIsForgotSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("reset_teacher_password_secure", {
        p_email: forgotEmail.trim(),
        p_full_name: forgotFullName.trim(),
        p_new_password: newResetPassword,
      });

      if (error) {
        setForgotError("Không thể cập nhật mật khẩu mới: " + error.message);
        return;
      }

      if (!data?.success) {
        setForgotError(data?.message || "Đặt lại mật khẩu không thành công!");
        return;
      }

      // Tự động điền sẵn vào form Đăng nhập bên ngoài
      setEmail(verifiedTeacher?.email || forgotEmail.trim());
      setPassword(newResetPassword);
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err?.message || "Đã có lỗi xảy ra khi đặt lại mật khẩu!");
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // Xử lý đăng nhập thực tế với Supabase Auth
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      showToast("Vui lòng nhập đầy đủ Email và Mật khẩu trường cấp!", "info");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setIsLoading(false);
        const errorMsg =
          error.message === "Invalid login credentials"
            ? "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!"
            : error.message;
        showToast(errorMsg, "info");
        return;
      }

      // Lấy thông tin hồ sơ giáo viên / tổ trưởng từ Supabase
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", data.user.id)
        .single();

      setIsLoading(false);
      const isLeader =
        profile?.role === "leader" ||
        data.user.email?.includes("huyda") ||
        data.user.email?.includes("totruong");

      showToast(
        isLeader
          ? "Đăng nhập thành công! Nhận diện quyền: Tổ Trưởng Chuyên Môn ICT"
          : `Đăng nhập thành công! Chào mừng ${profile?.full_name || "Thầy Cô"}`,
        "success"
      );

      // Chuyển hướng vào Bảng điều khiển /dashboard và làm mới phiên làm việc
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 700);
    } catch {
      setIsLoading(false);
      showToast("Có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại!", "info");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-amber-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Vòng hào quang trang trí nhận diện Sky-Line */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Nút đổi giao diện Sáng / Tối góc trên bên phải */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleTheme}
          className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
          title={isDark ? "Chuyển sang Chế độ Sáng" : "Chuyển sang Chế độ Tối"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-sky-600" />
          )}
        </button>
      </div>

      {/* Thông báo Toast góc dưới */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-in fade-in slide-in-from-bottom-5 duration-300 ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-white dark:bg-sky-600 border-sky-400/30"
              : "bg-slate-800 text-white border-slate-700"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-white shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-sky-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* KHUNG THẺ ĐĂNG NHẬP CĂN GIỮA TINH TẾ */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <Card className="border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-2xl shadow-sky-950/10 dark:shadow-black/50 backdrop-blur-md rounded-3xl overflow-hidden">
          {/* Header thẻ với nhận diện Sky-Line */}
          <div className="bg-gradient-to-r from-sky-600 to-sky-700 dark:from-sky-700 dark:to-slate-900 p-6 text-white text-center relative">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-black/10">
              <span className="font-black text-2xl tracking-wider text-amber-300">SL</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">SKY-LINE ICT PORTAL</h2>
            <p className="text-xs text-sky-100 font-medium mt-1">
              Cổng Thông Tin Tổ Chuyên Môn Tin Học & Robotics
            </p>
            <div className="flex justify-center gap-1.5 mt-2.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white font-semibold">
                5 Cơ Sở
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white font-semibold">
                Khối 1 - 12
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-bold">
                Năm Học 2026 - 2027
              </span>
            </div>
          </div>

          <CardHeader className="pt-6 pb-2 text-center">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Đăng Nhập Hệ Thống
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Sử dụng tài khoản email trường cấp để truy cập không gian số
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Ô nhập Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Email Nhà Trường:
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ví dụ: huyda@skylineschool.edu.vn"
                    className="h-11 pl-3.5 text-sm"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Ô nhập Mật khẩu */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    Mật Khẩu:
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenForgotModal}
                    className="text-[11px] text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline font-bold cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu cá nhân"
                    className="h-11 pl-3.5 pr-10 text-sm"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nút bấm Đăng nhập chính */}
              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="w-full font-bold shadow-lg shadow-sky-600/25 text-sm h-11 cursor-pointer"
              >
                {!isLoading && <ArrowRight className="w-4 h-4 mr-1.5" />}
                {isLoading ? "Đang Xác Thực Tài Khoản..." : "Đăng Nhập"}
              </Button>
            </form>

            {/* Hướng dẫn tài khoản nội bộ */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Thông Tin Tài Khoản:
              </div>
              <p>
                Sử dụng tài khoản email trường cấp (@skylineschool.edu.vn). Mật khẩu khởi tạo:{" "}
                <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold text-slate-900 dark:text-slate-100">
                  SkyLine@2026
                </code>
                .
              </p>
            </div>
          </CardContent>

          <CardFooter className="pb-6 pt-1 flex flex-col items-center justify-center border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <Link
              href="/"
              className="text-sky-600 dark:text-sky-400 font-semibold hover:underline inline-flex items-center gap-1 mt-2"
            >
              ← Quay về Trang Tổng Quan
            </Link>
          </CardFooter>
        </Card>

        {/* Thông tin chân trang nhỏ */}
        <div className="text-center text-slate-400 text-xs mt-4">
          Hệ Thống Giáo Dục Sky-Line • Phòng Công Nghệ & Chuyển Đổi Số
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CỬA SỔ KHÔI PHỤC MẬT KHẨU ("QUÊN MẬT KHẨU?")                          */}
      {/* ===================================================================== */}
      {isForgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if (!isForgotSubmitting) setIsForgotOpen(false);
          }}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER MODAL */}
            <div className="relative px-6 pt-5 pb-4 bg-gradient-to-r from-sky-600 to-sky-700 text-white">
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                disabled={isForgotSubmitting}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                title="Đóng lại"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-amber-300" />
                </div>
                <div className="pr-6">
                  <h3 className="text-base font-extrabold text-white leading-tight">
                    Khôi Phục Mật Khẩu Tài Khoản
                  </h3>
                  <p className="text-xs text-sky-100 mt-0.5">
                    {forgotStep === 1 && "Bước 1/2: Xác minh hồ sơ giáo viên Tổ ICT"}
                    {forgotStep === 2 && "Bước 2/2: Thiết lập mật khẩu mới an toàn"}
                    {forgotStep === 3 && "Hoàn tất khôi phục mật khẩu"}
                  </p>
                </div>
              </div>
            </div>

            {/* BODY MODAL */}
            <div className="p-6 overflow-y-auto space-y-4">
              {forgotError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span className="leading-snug font-medium">{forgotError}</span>
                </div>
              )}

              {/* BƯỚC 1: XÁC MINH DANH TÍNH GIÁO VIÊN */}
              {forgotStep === 1 && (
                <form onSubmit={handleVerifyIdentity} className="space-y-4">
                  <div className="p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
                    Thầy cô vui lòng nhập đúng <strong>Email công vụ</strong> và{" "}
                    <strong>Họ tên giáo viên</strong> đã đăng ký trong Tổ Chuyên Môn ICT để hệ thống xác minh và cấp lại mật khẩu mới.
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      Email Nhà Trường Cấp: <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder="ví dụ: huyda@skylineschool.edu.vn"
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-500" />
                      Họ và Tên Giáo Viên: <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={forgotFullName}
                      onChange={(e) => {
                        setForgotFullName(e.target.value);
                        if (forgotError) setForgotError(null);
                      }}
                      placeholder="ví dụ: Đỗ Anh Huy hoặc Thầy Đỗ Anh Huy"
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsForgotOpen(false)}
                      disabled={isForgotSubmitting}
                      className="rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Hủy Bỏ
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      isLoading={isForgotSubmitting}
                      className="rounded-xl text-xs font-bold px-5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                      {isForgotSubmitting ? "Đang Kiểm Tra..." : "Xác Minh Hồ Sơ"}
                    </Button>
                  </div>
                </form>
              )}

              {/* BƯỚC 2: ĐẶT LẠI MẬT KHẨU MỚI */}
              {forgotStep === 2 && verifiedTeacher && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  {/* Thẻ xác nhận hồ sơ đã khớp */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Đã xác minh đúng hồ sơ giáo viên:
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {verifiedTeacher.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {verifiedTeacher.email}
                      </div>
                    </div>
                    <Badge variant="amber" className="text-[10px] font-bold shrink-0">
                      {verifiedTeacher.role === "leader" ? "Tổ Trưởng" : "Giáo Viên"}
                    </Badge>
                  </div>

                  {/* Nút chọn nhanh mật khẩu khởi tạo của trường */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Muốn dùng lại mật khẩu mặc định?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewResetPassword("SkyLine@2026");
                        setConfirmResetPassword("SkyLine@2026");
                        setForgotError(null);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Điền SkyLine@2026
                    </button>
                  </div>

                  {/* Ô nhập mật khẩu mới */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      Mật Khẩu Mới: <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewResetPassword ? "text" : "password"}
                        value={newResetPassword}
                        onChange={(e) => {
                          setNewResetPassword(e.target.value);
                          if (forgotError) setForgotError(null);
                        }}
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        className="h-10 pr-10 text-xs rounded-xl"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewResetPassword(!showNewResetPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showNewResetPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Ô xác nhận mật khẩu mới */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Xác Nhận Mật Khẩu Mới: <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmResetPassword ? "text" : "password"}
                        value={confirmResetPassword}
                        onChange={(e) => {
                          setConfirmResetPassword(e.target.value);
                          if (forgotError) setForgotError(null);
                        }}
                        placeholder="Nhập lại mật khẩu mới"
                        className="h-10 pr-10 text-xs rounded-xl"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showConfirmResetPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setForgotStep(1);
                        setForgotError(null);
                      }}
                      disabled={isForgotSubmitting}
                      className="rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      Quay Lại
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      isLoading={isForgotSubmitting}
                      disabled={
                        isForgotSubmitting ||
                        !newResetPassword ||
                        newResetPassword.length < 6 ||
                        newResetPassword !== confirmResetPassword
                      }
                      className="rounded-xl text-xs font-bold px-5 cursor-pointer"
                    >
                      {isForgotSubmitting ? "Đang Cập Nhật..." : "Lưu Mật Khẩu Mới"}
                    </Button>
                  </div>
                </form>
              )}

              {/* BƯỚC 3: HOÀN TẤT */}
              {forgotStep === 3 && (
                <div className="py-5 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Khôi Phục Mật Khẩu Thành Công!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Mật khẩu mới của <strong>{verifiedTeacher?.full_name}</strong> đã được lưu an toàn. Hệ thống đã điền sẵn thông tin vào khung đăng nhập cho thầy/cô.
                  </p>
                  <div className="pt-3 flex items-center justify-center gap-2.5">
                    <Button
                      type="button"
                      onClick={() => {
                        setIsForgotOpen(false);
                        showToast(
                          "Đã điền sẵn mật khẩu mới! Thầy cô bấm Đăng Nhập để vào hệ thống.",
                          "success"
                        );
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-6 cursor-pointer"
                    >
                      Quay Lại Đăng Nhập Ngay
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
