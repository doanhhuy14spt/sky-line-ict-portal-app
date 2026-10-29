"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  KeyRound,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Lock,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  userEmail,
}: ChangePasswordModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form khi modal mở ra hoặc đóng lại
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setErrorMessage(null);
      setIsSuccess(false);
    }
  }, [isOpen]);

  // Đóng modal khi bấm phím Escape (khi không trong trạng thái đang gửi)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !mounted) return null;

  // Đánh giá độ mạnh của mật khẩu
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "Chưa nhập", color: "bg-slate-200 dark:bg-slate-700" };
    if (pwd.length < 6) return { score: 1, label: "Quá ngắn (Tối thiểu 6 ký tự)", color: "bg-rose-500" };

    let strength = 1;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { score: 2, label: "Trung bình", color: "bg-amber-500" };
    if (strength <= 4) return { score: 3, label: "Tốt", color: "bg-sky-500" };
    return { score: 4, label: "Rất mạnh", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(newPassword);
  const isSameAsCurrent =
    currentPassword.length > 0 && newPassword.length > 0 && currentPassword === newPassword;
  const isMatch =
    newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Kiểm tra dữ liệu đầu vào
    if (!currentPassword) {
      setErrorMessage("Vui lòng nhập mật khẩu hiện tại để xác minh bảo mật!");
      return;
    }

    if (!newPassword) {
      setErrorMessage("Vui lòng nhập mật khẩu mới!");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 6 ký tự để bảo đảm an toàn!");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage("Mật khẩu mới phải khác với mật khẩu hiện tại đang sử dụng!");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp với mật khẩu mới. Vui lòng kiểm tra lại!");
      return;
    }

    setIsLoading(true);

    try {
      // 2. Lấy email tài khoản hiện tại để xác thực lại mật khẩu cũ
      let targetEmail = userEmail?.trim() || "";
      if (!targetEmail) {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        targetEmail = currentUser?.email || "";
      }

      if (!targetEmail) {
        setErrorMessage("Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại!");
        setIsLoading(false);
        return;
      }

      // 3. Xác minh mật khẩu hiện tại bằng cách đăng nhập kiểm tra
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: currentPassword,
      });

      if (verifyError) {
        setErrorMessage("Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra và nhập lại!");
        setIsLoading(false);
        return;
      }

      // 4. Cập nhật mật khẩu mới lên Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        let friendlyMsg = error.message;
        if (error.message.toLowerCase().includes("at least 6 characters")) {
          friendlyMsg = "Mật khẩu mới cần tối thiểu 6 ký tự!";
        } else if (error.message.toLowerCase().includes("should be different")) {
          friendlyMsg = "Mật khẩu mới không được trùng với mật khẩu hiện tại!";
        } else if (
          error.message.toLowerCase().includes("network") ||
          error.message.toLowerCase().includes("failed to fetch")
        ) {
          friendlyMsg = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng!";
        }
        setErrorMessage(friendlyMsg);
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2200);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(
        "Đã có sự cố xảy ra: " + (error?.message || "Không thể đổi mật khẩu lúc này.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TIÊU ĐỀ HỘP THOẠI (HEADER) */}
        <div className="relative px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-sky-600 to-sky-700 text-white">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors disabled:opacity-50 cursor-pointer"
            title="Đóng lại"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/25 text-white flex items-center justify-center shadow-sm shrink-0">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0 pr-6">
              <h3 className="text-base font-extrabold text-white leading-tight">
                Đổi Mật Khẩu Bảo Mật
              </h3>
              <p className="text-xs text-sky-100 mt-0.5 truncate">
                {userEmail ? (
                  <>
                    Tài khoản: <span className="font-bold text-white">{userEmail}</span>
                  </>
                ) : (
                  "Cập nhật mật khẩu cá nhân cho tài khoản của thầy cô"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* NỘI DUNG FORM */}
        <div className="p-6 overflow-y-auto">
          {isSuccess ? (
            /* TRẠNG THÁI THÀNH CÔNG */
            <div className="py-6 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Đổi Mật Khẩu Thành Công!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Mật khẩu mới của thầy cô đã được cập nhật và mã hóa an toàn trên hệ thống. Thầy cô hãy sử dụng mật khẩu mới này cho các lần đăng nhập tiếp theo.
              </p>
              <div className="pt-3">
                <Button
                  type="button"
                  onClick={onClose}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-6 cursor-pointer"
                >
                  Hoàn Tất & Đóng Lại
                </Button>
              </div>
            </div>
          ) : (
            /* FORM NHẬP MẬT KHẨU */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cảnh báo lỗi nếu có */}
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span className="leading-snug font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Ô 1: Mật khẩu hiện tại */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Mật Khẩu Hiện Tại: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Nhập mật khẩu đang sử dụng"
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="pr-10 text-xs rounded-xl h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Ô 2: Mật khẩu mới */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Mật Khẩu Mới: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="pr-10 text-xs rounded-xl h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Cảnh báo nếu trùng mật khẩu hiện tại */}
                {isSameAsCurrent && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Mật khẩu mới phải khác với mật khẩu hiện tại.</span>
                  </div>
                )}

                {/* Thanh đo độ mạnh mật khẩu */}
                {newPassword.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Độ mạnh bảo mật:</span>
                      <span
                        className={`font-bold ${
                          strength.score <= 1
                            ? "text-rose-500"
                            : strength.score === 2
                            ? "text-amber-500"
                            : strength.score === 3
                            ? "text-sky-600 dark:text-sky-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {strength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`rounded-full transition-colors ${
                            strength.score >= level
                              ? strength.color
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          newPassword.length >= 6
                            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                            : ""
                        }`}
                      >
                        <Check className="w-3 h-3" /> Từ 6 ký tự trở lên
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          /[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword)
                            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                            : ""
                        }`}
                      >
                        <Check className="w-3 h-3" /> Có chữ số hoặc ký tự đặc biệt
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Ô 3: Xác nhận mật khẩu mới */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Xác Nhận Mật Khẩu Mới: <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Nhập lại mật khẩu mới vừa gõ"
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="pr-10 text-xs rounded-xl h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Trạng thái so khớp mật khẩu */}
                {isMatch && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Mật khẩu xác nhận hoàn toàn trùng khớp!</span>
                  </div>
                )}
                {isMismatch && (
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-500 dark:text-rose-400 font-medium pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Mật khẩu xác nhận chưa khớp với mật khẩu mới.</span>
                  </div>
                )}
              </div>

              {/* Lời nhắc bảo mật sư phạm thân thiện */}
              <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 flex items-start gap-2.5 text-[11px] text-sky-800 dark:text-sky-300">
                <ShieldCheck className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
                <span className="leading-relaxed">
                  Hệ thống sẽ kiểm tra mật khẩu hiện tại trước khi lưu mật khẩu mới để bảo vệ an toàn tuyệt đối cho tài khoản của thầy cô.
                </span>
              </div>

              {/* NÚT BẤM THAO TÁC */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isLoading}
                  className="rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  isLoading={isLoading}
                  disabled={
                    isLoading ||
                    !currentPassword ||
                    !newPassword ||
                    newPassword.length < 6 ||
                    isSameAsCurrent ||
                    newPassword !== confirmPassword
                  }
                  className="rounded-xl text-xs font-bold px-5 cursor-pointer"
                >
                  {isLoading ? "Đang Xác Thực & Lưu..." : "Lưu Mật Khẩu Mới"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
