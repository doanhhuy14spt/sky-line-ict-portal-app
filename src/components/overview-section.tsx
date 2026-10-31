"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  GraduationCap,
  Layers,
  Sparkles,
  Trophy,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Award,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  Target,
  Wrench,
  RefreshCw,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SIX_LAB_MANAGERS } from "@/components/lab-devices-section";
import { ClassItem } from "@/components/teaching-assignment-section";
import { maskStudentName } from "@/lib/student-privacy";
import { LeaderAISparkHub } from "@/components/leader-ai-spark-hub";

interface OverviewSectionProps {
  supabase: SupabaseClient;
  selectedSchoolYear: string;
  selectedCampus: string;
  campuses: { id: string; name: string }[];
  currentUserProfile: {
    id: string;
    email: string;
    name: string;
    role: "leader" | "teacher" | "guest";
    campus: string;
  };
  teachersList: any[];
  classesList: ClassItem[];
  timetableSlotsCount: number;
  rawTeacherTimetables: any[];
  isStudentPrivacyActive?: boolean;
  onNavigateTab: (
    tab: "dashboard" | "timetable" | "devices" | "tasks" | "teams" | "achievements" | "teachers",
    subOverrides?: {
      timetableSub?: "lab_view" | "teacher_view" | "assignment_view";
      tasksSub?: "part1_assigned_tasks" | "part2_incidents";
      teachersSub?: "part1_directory" | "part2_evaluation";
    }
  ) => void;
  showToast?: (text: string, type?: "success" | "warning" | "info") => void;
}

export function OverviewSection({
  supabase,
  selectedSchoolYear,
  selectedCampus,
  campuses,
  currentUserProfile,
  teachersList,
  classesList,
  rawTeacherTimetables,
  isStudentPrivacyActive,
  onNavigateTab,
  showToast,
}: OverviewSectionProps) {
  const shouldMaskStudent = Boolean(isStudentPrivacyActive || currentUserProfile?.role === "guest");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [devicesData, setDevicesData] = useState<any[]>([]);
  const [tasksData, setTasksData] = useState<any[]>([]);
  const [teamsData, setTeamsData] = useState<any[]>([]);
  const [achievementsData, setAchievementsData] = useState<any[]>([]);
  const [competitionsCount, setCompetitionsCount] = useState<number>(0);

  // Tải dữ liệu tổng hợp thực tế từ Supabase theo năm học đang chọn
  const loadOverviewMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [devicesRes, tasksRes, teamsRes, achRes, compRes] = await Promise.all([
        supabase
          .from("lab_devices")
          .select("*")
          .eq("school_year", selectedSchoolYear),
        supabase
          .from("department_tasks")
          .select("*")
          .eq("school_year", selectedSchoolYear)
          .order("deadline", { ascending: true }),
        supabase
          .from("training_teams")
          .select("*")
          .eq("school_year", selectedSchoolYear)
          .order("created_at", { ascending: false }),
        supabase
          .from("achievements")
          .select("*")
          .eq("school_year", selectedSchoolYear)
          .order("created_at", { ascending: false }),
        supabase
          .from("competition_catalog")
          .select("id", { count: "exact", head: true })
          .eq("school_year", selectedSchoolYear),
      ]);

      setDevicesData(devicesRes.data || []);
      setTasksData(tasksRes.data || []);
      setTeamsData(teamsRes.data || []);
      setAchievementsData(achRes.data || []);
      setCompetitionsCount(compRes.count || 0);
    } catch (err) {
      console.error("Lỗi tải dữ liệu tổng quan:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedSchoolYear]);

  useEffect(() => {
    loadOverviewMetrics();
  }, [loadOverviewMetrics]);

  // Ngày hiện tại tiếng Việt (đặt trong useEffect để tương thích Cache Components của Next.js 16)
  const [todayFormatted, setTodayFormatted] = useState("Trực tuyến 24/7");
  useEffect(() => {
    const now = new Date();
    const days = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const dayName = days[now.getDay()];
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    setTodayFormatted(`${dayName}, ngày ${dd}/${mm}/${yyyy}`);
  }, []);

  // =========================================================================
  // TÍNH TOÁN CÁC CHỈ SỐ THỰC TẾ (LIVE METRICS)
  // =========================================================================
  const classMetrics = useMemo(() => {
    const totalClasses = classesList.length;
    const assignedClasses = classesList.filter(
      (c) =>
        c.teacher_name &&
        c.teacher_name.trim() !== "" &&
        c.teacher_name !== "Chưa phân công"
    ).length;
    const totalPeriodsPerWeek = classesList.reduce(
      (sum, c) => sum + (Number(c.periods_per_week) || 2),
      0
    );
    return { totalClasses, assignedClasses, totalPeriodsPerWeek };
  }, [classesList]);

  const deviceMetrics = useMemo(() => {
    const totalItems = devicesData.length;
    const totalQuantity = devicesData.reduce(
      (sum, d) => sum + (Number(d.quantity) || 0),
      0
    );
    const normalItems = devicesData.filter((d) => d.status === "Bình thường").length;
    const brokenItems = devicesData.filter((d) => d.status === "Hư hỏng");
    return {
      totalItems,
      totalQuantity,
      normalItems,
      brokenCount: brokenItems.length,
      brokenItems,
    };
  }, [devicesData]);

  const taskMetrics = useMemo(() => {
    const total = tasksData.length;
    const completed = tasksData.filter((t) => t.status === "Hoàn thành").length;
    const inProgress = tasksData.filter((t) => t.status === "Đang thực hiện").length;
    const overdue = tasksData.filter((t) => t.status === "Trễ tiến độ").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, overdue, completionRate };
  }, [tasksData]);

  const teamMetrics = useMemo(() => {
    const total = teamsData.length;
    const exceeded = teamsData.filter((t) => t.result_status === "Vượt chỉ tiêu").length;
    const completed = teamsData.filter((t) => t.result_status === "Hoàn thành").length;
    const notMet = teamsData.filter((t) => t.result_status === "Không đạt").length;
    return { total, exceeded, completed, notMet };
  }, [teamsData]);

  const achievementMetrics = useMemo(() => {
    const total = achievementsData.length;
    const studentCount = achievementsData.filter(
      (a) => a.achievement_of === "Học sinh đạt giải"
    ).length;
    const teacherCount = achievementsData.filter(
      (a) => a.achievement_of === "Giáo viên đạt giải"
    ).length;
    return { total, studentCount, teacherCount };
  }, [achievementsData]);

  // Tổng hợp trạng thái 6 Phòng Lab thực tế
  const sixLabsOverview = useMemo(() => {
    return SIX_LAB_MANAGERS.map((lab) => {
      const labDevices = devicesData.filter((d) => d.lab_id === lab.id);
      const totalQty = labDevices.reduce((s, d) => s + (Number(d.quantity) || 0), 0);
      const brokenCount = labDevices.filter((d) => d.status === "Hư hỏng").length;
      const labScheduleCount = rawTeacherTimetables.filter((slot) => {
        const roomStr = (slot.room || "").toUpperCase();
        return roomStr.includes(lab.sheet.toUpperCase());
      }).length;

      return {
        ...lab,
        deviceTypesCount: labDevices.length,
        totalQty,
        brokenCount,
        labScheduleCount,
      };
    });
  }, [devicesData, rawTeacherTimetables]);

  const currentCampusName =
    campuses.find((c) => c.id === selectedCampus)?.name || "Toàn bộ 5 Cơ sở";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* =================================================================== */}
      {/* 1. BANNER ĐIỀU HÀNH TRUNG TÂM (EXECUTIVE HERO BANNER)                */}
      {/* =================================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-700 via-sky-600 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-sky-950/10 border border-sky-500/30">
        {/* Họa tiết ánh sáng nền tinh tế */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-sky-300/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                Năm học {selectedSchoolYear}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-sky-100">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {currentCampusName}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-semibold text-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {todayFormatted}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Trung Tâm Điều Hành Tổ Chuyên Môn ICT
              </h1>
              <p className="text-xs sm:text-sm text-sky-100/90 mt-1.5 leading-relaxed">
                Xin chào{" "}
                <strong className="text-amber-300 font-extrabold">
                  {currentUserProfile.name}
                </strong>{" "}
                ({currentUserProfile.role === "leader" ? "Tổ Trưởng Chuyên Môn" : "Giáo Viên ICT"}).
                Toàn bộ số liệu thời khóa biểu, 6 phòng Lab, công việc, đội tuyển và thành tích dưới đây được tổng hợp trực tiếp theo thời gian thực.
              </p>
            </div>
          </div>

          {/* Cụm nút lối tắt điều hướng nhanh */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab("timetable")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-sky-800 hover:bg-sky-50 font-extrabold text-xs shadow-lg shadow-black/10 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Lịch Phòng Lab & TKB</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("tasks")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Công Việc Được Giao</span>
            </button>
            <button
              type="button"
              onClick={() => loadOverviewMetrics()}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer"
              title="Làm mới số liệu tổng quan"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. DẢI 6 THẺ CHỈ SỐ CỐT LÕI TOÀN HỆ THỐNG (KPI BENTO CARDS)          */}
      {/* =================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Thẻ 1: Quy mô Lớp & Giảng dạy */}
        <button
          type="button"
          onClick={() => onNavigateTab("timetable")}
          className="group text-left p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {classMetrics.totalClasses}{" "}
              <span className="text-xs font-bold text-slate-500">lớp</span>
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              Quy Mô Giảng Dạy
            </div>
            <div className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-1">
              {classMetrics.totalPeriodsPerWeek} tiết ICT / tuần
            </div>
          </div>
        </button>

        {/* Thẻ 2: Vận hành 6 Phòng Lab */}
        <button
          type="button"
          onClick={() => onNavigateTab("timetable")}
          className="group text-left p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              6 <span className="text-xs font-bold text-slate-500">phòng Lab</span>
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              Hệ Thống Phòng Máy
            </div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
              {rawTeacherTimetables.length} tiết TKB đã xếp
            </div>
          </div>
        </button>

        {/* Thẻ 3: Thiết bị & Robot STEM */}
        <button
          type="button"
          onClick={() => onNavigateTab("devices")}
          className="group text-left p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {deviceMetrics.totalQuantity}{" "}
              <span className="text-xs font-bold text-slate-500">thiết bị</span>
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              Thiết Bị & Robot
            </div>
            <div
              className={`text-[11px] font-semibold mt-1 ${
                deviceMetrics.brokenCount > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {deviceMetrics.brokenCount > 0
                ? `${deviceMetrics.brokenCount} mục báo hư hỏng`
                : "100% hoạt động tốt"}
            </div>
          </div>
        </button>

        {/* Thẻ 4: Công việc chuyên môn */}
        <button
          type="button"
          onClick={() => onNavigateTab("tasks")}
          className="group text-left p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {taskMetrics.total}{" "}
              <span className="text-xs font-bold text-slate-500">nhiệm vụ</span>
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              Công Việc Được Giao
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
              {taskMetrics.completed} hoàn thành ({taskMetrics.completionRate}%)
            </div>
          </div>
        </button>

        {/* Thẻ 5: Đội tuyển bồi dưỡng */}
        <button
          type="button"
          onClick={() => onNavigateTab("teams")}
          className="group text-left p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {teamMetrics.total}{" "}
              <span className="text-xs font-bold text-slate-500">học sinh</span>
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              Đội Tuyển Bồi Dưỡng
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
              {teamMetrics.exceeded + teamMetrics.completed} đạt & vượt mục tiêu
            </div>
          </div>
        </button>

        {/* Thẻ 6: Thành tích & Giải thưởng */}
        <button
          type="button"
          onClick={() => onNavigateTab("achievements")}
          className="group text-left p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {achievementMetrics.total}{" "}
              <span className="text-xs font-bold text-slate-500">giải thưởng</span>
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              Thành Tích Cuộc Thi
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
              {competitionsCount} cuộc thi / kì thi
            </div>
          </div>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 2B. HỆ SINH THÁI TRỢ LÝ AI (BẢN TIN 08H00 THỨ BẢY & TRỢ LÝ TỔ TRƯỞNG) */}
      {/* =================================================================== */}
      <LeaderAISparkHub
        supabase={supabase}
        selectedSchoolYear={selectedSchoolYear}
        currentUserProfile={currentUserProfile}
        teachersList={teachersList}
        classesCount={classMetrics.totalClasses}
        devicesData={devicesData}
        tasksData={tasksData}
        teamsData={teamsData}
        achievementsData={achievementsData}
        onNavigateTab={onNavigateTab}
        showToast={showToast}
      />

      {/* =================================================================== */}
      {/* 3. TẦNG BENTO 1: TRẠNG THÁI 6 PHÒNG LAB & TIẾN ĐỘ CÔNG VIỆC         */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (7/12): BỨC TRANH VẬN HÀNH 6 PHÒNG LAB TOÀN TRƯỜNG */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Hiện Trạng 6 Phòng Lab & Thiết Bị Thực Hành
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Quản lý trực tiếp bởi 6 thầy cô phụ trách phòng máy tại 5 cơ sở
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab("devices")}
                className="rounded-xl text-xs font-bold cursor-pointer shrink-0"
              >
                Kiểm Kê Chi Tiết
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {sixLabsOverview.map((lab) => (
                <div
                  key={lab.id}
                  onClick={() => onNavigateTab("devices")}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-black">
                          {lab.sheet}
                        </span>
                        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Lab {lab.shortName}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Phụ trách:{" "}
                        <strong className="text-slate-700 dark:text-slate-200">
                          {lab.managerName}
                        </strong>
                      </p>
                    </div>

                    {lab.brokenCount > 0 ? (
                      <Badge variant="destructive" className="text-[10px] font-bold">
                        {lab.brokenCount} báo hỏng
                      </Badge>
                    ) : (
                      <Badge variant="emerald" className="text-[10px] font-bold">
                        Ổn định
                      </Badge>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                      📦 <strong>{lab.deviceTypesCount}</strong> danh mục ({lab.totalQty} thiết bị)
                    </span>
                    <span className="text-sky-700 dark:text-sky-300 font-bold">
                      🗓️ {lab.labScheduleCount} tiết/tuần
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5/12): TIẾN ĐỘ CÔNG VIỆC ĐƯỢC GIAO (DEPARTMENT TASKS) */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Tiến Độ Công Việc Chuyên Môn
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Theo dõi nhiệm vụ trọng tâm năm học {selectedSchoolYear}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab("tasks")}
                className="rounded-xl text-xs font-bold cursor-pointer shrink-0"
              >
                Xem Tất Cả
              </Button>
            </div>

            {/* Thanh tiến độ hoàn thành công việc */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Tỷ lệ hoàn thành nhiệm vụ
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {taskMetrics.completionRate}% ({taskMetrics.completed}/{taskMetrics.total})
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${taskMetrics.completionRate}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                  ✅ Hoàn thành: {taskMetrics.completed}
                </div>
                <div className="text-sky-700 dark:text-sky-400 font-bold">
                  ⏳ Đang làm: {taskMetrics.inProgress}
                </div>
                <div className="text-rose-600 dark:text-rose-400 font-bold">
                  ⚠️ Trễ hạn: {taskMetrics.overdue}
                </div>
              </div>
            </div>

            {/* Danh sách công việc gần nhất */}
            <div className="space-y-2.5">
              {tasksData.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                  Chưa có nhiệm vụ nào được giao trong năm học {selectedSchoolYear}.
                </div>
              ) : (
                tasksData.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onNavigateTab("tasks")}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 bg-white dark:bg-slate-900/60 transition-all cursor-pointer flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {task.task_content}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Phụ trách:{" "}
                        <strong className="text-slate-700 dark:text-slate-200">
                          {task.assignee_name}
                        </strong>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        variant={
                          task.status === "Hoàn thành"
                            ? "emerald"
                            : task.status === "Trễ tiến độ"
                            ? "destructive"
                            : "default"
                        }
                        className="text-[10px]"
                      >
                        {task.status}
                      </Badge>
                      {task.deadline && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          Hạn: {task.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. TẦNG BENTO 2: ĐỘI TUYỂN & THÀNH TÍCH + ĐỘI NGŨ NHÂN SỰ ICT       */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (6/12): ĐIỂM SÁNG ĐỘI TUYỂN & THÀNH TÍCH CUỘC THI */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Điểm Sáng Đội Tuyển & Thành Tích
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kết quả bồi dưỡng học sinh giỏi và giải thưởng chuyên môn
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab("teams")}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                Đội Tuyển ({teamMetrics.total})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab("achievements")}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                Thành Tích ({achievementMetrics.total})
              </Button>
            </div>
          </div>

          {/* Tóm tắt nhanh Đội tuyển & Giải thưởng */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 text-center">
              <div className="text-lg font-black text-purple-800 dark:text-purple-300">
                {teamMetrics.total}
              </div>
              <div className="text-[11px] font-bold text-purple-700 dark:text-purple-400">
                HS Đội Tuyển
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/40 text-center">
              <div className="text-lg font-black text-sky-800 dark:text-sky-300">
                {achievementMetrics.studentCount}
              </div>
              <div className="text-[11px] font-bold text-sky-700 dark:text-sky-400">
                Giải Học Sinh
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-center">
              <div className="text-lg font-black text-amber-800 dark:text-amber-300">
                {achievementMetrics.teacherCount}
              </div>
              <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                Giải Giáo Viên
              </div>
            </div>
          </div>

          {/* Danh sách Thành tích & Đội tuyển tiêu biểu */}
          <div className="space-y-2.5">
            {achievementsData.length === 0 && teamsData.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                Chưa có bản ghi thành tích hoặc đội tuyển nào trong năm học {selectedSchoolYear}.
              </div>
            ) : (
              <>
                {achievementsData.slice(0, 3).map((ach) => (
                  <div
                    key={ach.id}
                    onClick={() => onNavigateTab("achievements")}
                    className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {ach.competition_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                        {ach.achievement_of === "Giáo viên đạt giải" ? (
                          <span>
                            GV đạt giải: <strong>{ach.teacher_name}</strong>
                          </span>
                        ) : (
                          <span>
                            HS: <strong>{maskStudentName(ach.student_name, shouldMaskStudent)}</strong> ({ach.class_name})
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="amber" className="text-[10px] font-extrabold shrink-0">
                      {ach.achievement_result}
                    </Badge>
                  </div>
                ))}

                {teamsData.slice(0, 2).map((team) => (
                  <div
                    key={team.id}
                    onClick={() => onNavigateTab("teams")}
                    className="p-3.5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 hover:border-purple-300 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        🎓 HS Đội tuyển: {maskStudentName(team.student_name, shouldMaskStudent)} ({team.class_name})
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                        Bồi dưỡng: <strong>{team.teacher_name}</strong> • Định hướng:{" "}
                        <em>{team.orientation}</em>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-bold shrink-0">
                      Mục tiêu: {team.expected_goal}
                    </Badge>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (6/12): ĐỘI NGŨ NHÂN SỰ TỔ CHUYÊN MÔN ICT (8 THẦY CÔ) */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Đội Ngũ Nhân Sự Tổ ICT ({teachersList.length} Thầy Cô)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phân công phụ trách chuyên môn liên cấp tại 5 cơ sở Sky-Line
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab("teachers")}
              className="rounded-xl text-xs font-bold cursor-pointer shrink-0"
            >
              Hồ Sơ Nhân Sự
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {teachersList.map((teacher, idx) => {
              const assignedClassCount = classesList.filter(
                (c) =>
                  c.teacher_id === teacher.id ||
                  c.teacher_name === teacher.name
              ).length;

              return (
                <div
                  key={teacher.id || idx}
                  onClick={() => onNavigateTab("teachers")}
                  className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {teacher.name ? teacher.name.charAt(0) : "G"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {teacher.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="truncate">{teacher.campus}</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400 shrink-0 ml-1">
                        {assignedClassCount} lớp
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
