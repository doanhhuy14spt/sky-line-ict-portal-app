"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Bot,
  CheckCircle2,
  GraduationCap,
  Trophy,
  Users,
  Layers,
  PlusCircle,
  RefreshCw,
  XCircle,
  Sparkles,
} from "lucide-react";

export interface NotificationItem {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string;
  action_type: "INSERT" | "UPDATE" | "DELETE";
  category: string;
  title: string;
  message: string;
  target_tab: string;
  is_read: boolean;
  batch_count?: number;
  created_at: string;
}

interface NotificationBellProps {
  supabase: any;
  currentUserProfile: {
    id: string;
    email: string;
    name: string;
    role: "leader" | "teacher";
    campus: string;
  };
  onNavigateTab?: (
    tab: "dashboard" | "timetable" | "devices" | "tasks" | "teams" | "achievements" | "teachers"
  ) => void;
  showToast?: (text: string, type?: "success" | "warning" | "info") => void;
}

export function NotificationBell({
  supabase,
  currentUserProfile,
  onNavigateTab,
  showToast,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "unread">("all");
  const [isBellRinging, setIsBellRinging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!currentUserProfile?.id) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", currentUserProfile.id)
        .order("created_at", { ascending: false })
        .limit(40);

      if (!error && data) {
        setNotifications(data);
      }
    } catch {
      // Bỏ qua lỗi kết nối tạm thời
    }
  }, [supabase, currentUserProfile?.id]);

  useEffect(() => {
    loadNotifications();

    if (!currentUserProfile?.id) return;

    const channel = supabase
      .channel(`notifications_${currentUserProfile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${currentUserProfile.id}`,
        },
        (payload: any) => {
          loadNotifications();
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            setIsBellRinging(true);
            setTimeout(() => setIsBellRinging(false), 1800);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUserProfile?.id, loadNotifications]);

  // Đóng menu khi bấm ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayedNotifications =
    filterMode === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  const handleMarkAsRead = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === notif.id ? { ...item, is_read: true } : item))
      );
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
    }

    if (onNavigateTab && notif.target_tab) {
      const validTabs = [
        "dashboard",
        "timetable",
        "devices",
        "tasks",
        "teams",
        "achievements",
        "teachers",
      ];
      if (validTabs.includes(notif.target_tab)) {
        onNavigateTab(notif.target_tab as any);
      }
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", currentUserProfile.id)
      .eq("is_read", false);

    if (showToast) {
      showToast("Đã đánh dấu tất cả thông báo là đã đọc!", "info");
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    setNotifications([]);
    await supabase.from("notifications").delete().eq("recipient_id", currentUserProfile.id);
    if (showToast) {
      showToast("Đã làm sạch danh sách thông báo!", "info");
    }
  };

  const handleDeleteOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  const formatRelativeTime = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 45) return "Vừa xong";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} giờ trước`;
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay < 7) return `${diffDay} ngày trước`;
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "assignment":
      case "timetable":
        return <Calendar className="w-4 h-4 text-sky-500" />;
      case "device":
        return <Bot className="w-4 h-4 text-amber-500" />;
      case "task":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "team":
        return <GraduationCap className="w-4 h-4 text-indigo-500" />;
      case "achievement":
        return <Trophy className="w-4 h-4 text-rose-500" />;
      case "profile":
        return <Users className="w-4 h-4 text-teal-500" />;
      default:
        return <Layers className="w-4 h-4 text-sky-500" />;
    }
  };

  const getActionBadge = (actionType: "INSERT" | "UPDATE" | "DELETE") => {
    switch (actionType) {
      case "INSERT":
        return (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-800/60">
            <PlusCircle className="w-2.5 h-2.5" />
            Thêm mới
          </span>
        );
      case "UPDATE":
        return (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300/40 dark:border-sky-800/60">
            <RefreshCw className="w-2.5 h-2.5" />
            Cập nhật
          </span>
        );
      case "DELETE":
        return (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/40 dark:border-rose-800/60">
            <XCircle className="w-2.5 h-2.5" />
            Đã xóa
          </span>
        );
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* NÚT HÌNH CHIẾC CHUÔNG TRÊN THANH HEADER */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            loadNotifications();
          }
        }}
        className={`relative p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 ${
          isOpen
            ? "bg-sky-50 dark:bg-sky-950/80 border-sky-400/70 dark:border-sky-500/70 text-sky-600 dark:text-sky-400 shadow-sm shadow-sky-500/20"
            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300"
        }`}
        title="Thông báo hoạt động hệ thống"
        aria-label="Thông báo hoạt động hệ thống"
      >
        <Bell
          className={`w-4 h-4 transition-transform ${
            isBellRinging ? "animate-bounce text-amber-400" : unreadCount > 0 ? "text-amber-500 dark:text-amber-400" : ""
          }`}
        />

        {/* Huy hiệu đếm số thông báo chưa đọc */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-black flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 animate-in zoom-in duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* KHUNG DROPDOWN DANH SÁCH THÔNG BÁO */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[340px] sm:w-[400px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-black/40 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header khung thông báo */}
          <div className="p-3.5 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      Thông Báo Hệ Thống
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/30">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    {currentUserProfile.role === "leader"
                      ? "Ghi nhận mọi thay đổi dữ liệu từ giáo viên"
                      : "Cập nhật phân công & công việc từ Tổ trưởng"}
                  </p>
                </div>
              </div>

              {/* Nút thao tác nhanh: Đọc hết & Xóa hết */}
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="p-1.5 rounded-lg text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-100/70 dark:hover:bg-sky-950/60 transition-colors cursor-pointer inline-flex items-center gap-1"
                    title="Đánh dấu tất cả là đã đọc"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Đã đọc</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="p-1.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Xóa toàn bộ thông báo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Thanh lọc Tất cả / Chưa đọc */}
            <div className="mt-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterMode === "all"
                    ? "bg-sky-600 text-white shadow-2xs"
                    : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("unread")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterMode === "unread"
                    ? "bg-sky-600 text-white shadow-2xs"
                    : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>
          </div>

          {/* Danh sách thông báo cuộn mượt */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 custom-scrollbar">
            {displayedNotifications.length === 0 ? (
              <div className="py-10 px-6 text-center space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5 text-amber-400/80" />
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {filterMode === "unread"
                    ? "Không còn thông báo nào chưa đọc"
                    : "Chưa có thông báo mới"}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {currentUserProfile.role === "leader"
                    ? "Khi giáo viên thêm, sửa hoặc xóa dữ liệu trên hệ thống, thông báo chi tiết sẽ xuất hiện ngay tại đây."
                    : "Khi Tổ trưởng cập nhật phân công chuyên môn, lịch dạy hoặc giao công việc liên quan đến bạn, thông báo sẽ hiển thị ngay tại đây."}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif)}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 group relative ${
                    !notif.is_read
                      ? "bg-sky-50/60 hover:bg-sky-50 dark:bg-sky-950/25 dark:hover:bg-sky-950/45"
                      : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {/* Chấm xanh đánh dấu chưa đọc */}
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-2 shadow-xs shadow-sky-500/50" />
                  )}

                  {/* Icon chuyên mục */}
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-center shrink-0 mt-0.5">
                    {getCategoryIcon(notif.category)}
                  </div>

                  {/* Nội dung thông báo ngắn gọn, cụ thể */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate">
                          {notif.title}
                        </span>
                        {getActionBadge(notif.action_type)}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>

                    <p
                      className={`text-xs leading-snug ${
                        !notif.is_read
                          ? "font-semibold text-slate-900 dark:text-slate-100"
                          : "font-normal text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {notif.message}
                    </p>
                  </div>

                  {/* Nút xóa 1 thông báo khi di chuột */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteOne(e, notif.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0 cursor-pointer"
                    title="Xóa thông báo này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

