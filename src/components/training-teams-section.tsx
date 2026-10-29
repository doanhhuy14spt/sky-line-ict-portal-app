"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  GraduationCap,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Filter,
  UserCheck,
  Award,
  Target,
  Compass,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClassItem } from "@/components/teaching-assignment-section";

export interface TrainingTeamItem {
  id: string;
  student_name: string;
  class_id?: string | null;
  class_name: string;
  teacher_id?: string | null;
  teacher_name: string;
  orientation: string;
  expected_goal: string;
  is_goal_locked: boolean;
  actual_achievement: string;
  result_status: "" | "Chưa đánh giá" | "Vượt chỉ tiêu" | "Hoàn thành" | "Không đạt";
  school_year?: string;
  school_year_id?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface TrainingTeamsSectionProps {
  supabase: SupabaseClient;
  showToast: (message: string, type?: "success" | "warning" | "info") => void;
  currentUserProfile: {
    id: string;
    email: string;
    name: string;
    role: "leader" | "teacher";
    campus: string;
  };
  classesList: ClassItem[];
  teachersList: any[];
  selectedSchoolYear?: string;
}

export const RESULT_OPTIONS = [
  "Vượt chỉ tiêu",
  "Hoàn thành",
  "Không đạt",
] as const;

const ORIENTATION_SUGGESTIONS = [
  "Tin học trẻ",
  "Robothon Quốc tế",
  "Robotics VEX IQ",
  "Lập trình Scratch",
  "Lập trình Python",
  "Olympic Tin học",
  "Sáng tạo KHKT",
];

const GOAL_SUGGESTIONS = [
  "Giải Nhất",
  "Giải Nhì",
  "Giải Ba",
  "Giải Khuyến khích",
  "Huy chương Vàng",
  "Huy chương Bạc",
  "Huy chương Đồng",
];

export function TrainingTeamsSection({
  supabase,
  showToast,
  currentUserProfile,
  classesList: propClassesList,
  teachersList,
  selectedSchoolYear = "2026-2027",
}: TrainingTeamsSectionProps) {
  const router = useRouter();
  const isLeader = currentUserProfile?.role === "leader";

  // =========================================================================
  // 1. STATE DỮ LIỆU ĐỘI TUYỂN & DANH SÁCH LỚP TỪ SUPABASE
  // =========================================================================
  const [teamList, setTeamList] = useState<TrainingTeamItem[]>([]);
  const [localClasses, setLocalClasses] = useState<ClassItem[]>(propClassesList || []);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Đồng bộ danh sách lớp từ props hoặc tải từ bảng classes theo năm học
  useEffect(() => {
    if (propClassesList && propClassesList.length > 0) {
      setLocalClasses(propClassesList);
    } else {
      supabase
        .from("classes")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("campus", { ascending: true })
        .order("grade", { ascending: true })
        .order("name", { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setLocalClasses(data);
          } else {
            setLocalClasses([]);
          }
        });
    }
  }, [propClassesList, supabase, selectedSchoolYear]);

  // =========================================================================
  // 2. STATE BỘ LỌC THÔNG TIN TRÊN BẢNG
  // =========================================================================
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [orientationFilter, setOrientationFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [onlyMyStudents, setOnlyMyStudents] = useState<boolean>(false);

  // =========================================================================
  // 3. STATE FORM MODAL THÊM / SỬA HỌC SINH ĐỘI TUYỂN
  // =========================================================================
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingItem, setEditingItem] = useState<TrainingTeamItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [classCampusFilter, setClassCampusFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    student_name: "",
    class_name: "",
    teacher_id: "",
    teacher_name: "",
    orientation: "",
    expected_goal: "",
    actual_achievement: "",
    result_status: "" as "" | "Chưa đánh giá" | "Vượt chỉ tiêu" | "Hoàn thành" | "Không đạt",
  });

  // Modal xác nhận xóa
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<TrainingTeamItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // =========================================================================
  // 4. TẢI DỮ LIỆU TỪ SUPABASE THEO NĂM HỌC & ĐĂNG KÝ REALTIME
  // =========================================================================
  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("training_teams")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeamList((data as TrainingTeamItem[]) || []);
    } catch (err: any) {
      console.error("Lỗi tải danh sách đội tuyển:", err);
      showToast("Không thể tải dữ liệu bảng đội tuyển!", "warning");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedSchoolYear, showToast]);

  useEffect(() => {
    loadTeams();

    const channel = supabase
      .channel("realtime_training_teams")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "training_teams" },
        () => {
          loadTeams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTeams, supabase]);

  // =========================================================================
  // 5. DANH SÁCH LỚP & ĐỊNH HƯỚNG PHỤC VỤ BỘ LỌC VÀ FORM
  // =========================================================================
  const filteredModalClasses = useMemo(() => {
    if (classCampusFilter === "all") return localClasses;
    return localClasses.filter((c) => c.campus === classCampusFilter);
  }, [localClasses, classCampusFilter]);

  const availableOrientations = useMemo(() => {
    const set = new Set<string>();
    teamList.forEach((item) => {
      if (item.orientation && item.orientation.trim()) {
        set.add(item.orientation.trim());
      }
    });
    return Array.from(set);
  }, [teamList]);

  const availableClassesInTable = useMemo(() => {
    const set = new Set<string>();
    teamList.forEach((item) => {
      if (item.class_name && item.class_name.trim()) {
        set.add(item.class_name.trim());
      }
    });
    return Array.from(set).sort();
  }, [teamList]);

  // Kiểm tra mục tiêu kì vọng đã bị khóa hay chưa (sau khi nhập xong sẽ khóa lại không cho sửa)
  const isGoalLockedInModal = useMemo(() => {
    if (modalMode === "add") return false;
    if (!editingItem) return false;
    return (
      editingItem.is_goal_locked &&
      Boolean(editingItem.expected_goal && editingItem.expected_goal.trim().length > 0)
    );
  }, [modalMode, editingItem]);

  // =========================================================================
  // 6. LỌC DỮ LIỆU TRÊN BẢNG & THỐNG KÊ NHANH
  // =========================================================================
  const filteredTeams = useMemo(() => {
    return teamList.filter((item) => {
      // 1. Tìm kiếm từ khóa
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.student_name?.toLowerCase().includes(q) ||
        item.class_name?.toLowerCase().includes(q) ||
        item.teacher_name?.toLowerCase().includes(q) ||
        item.orientation?.toLowerCase().includes(q) ||
        item.expected_goal?.toLowerCase().includes(q) ||
        item.actual_achievement?.toLowerCase().includes(q) ||
        item.result_status?.toLowerCase().includes(q);

      // 2. Lọc theo Lớp
      const matchClass = classFilter === "all" || item.class_name === classFilter;

      // 3. Lọc theo Giáo viên bồi dưỡng
      const matchTeacher =
        teacherFilter === "all" ||
        item.teacher_id === teacherFilter ||
        item.teacher_name === teacherFilter;

      // 4. Lọc theo Định hướng
      const matchOrientation =
        orientationFilter === "all" ||
        item.orientation?.trim().toLowerCase() === orientationFilter.trim().toLowerCase();

      // 5. Lọc theo Kết quả
      const matchResult =
        resultFilter === "all" ||
        (resultFilter === "Chưa đánh giá"
          ? !item.result_status || item.result_status === "Chưa đánh giá"
          : item.result_status === resultFilter);

      // 6. Lọc học sinh do chính giáo viên đang đăng nhập bồi dưỡng
      const matchMine =
        !onlyMyStudents ||
        item.teacher_id === currentUserProfile?.id ||
        item.teacher_name?.toLowerCase() === currentUserProfile?.name?.toLowerCase();

      return (
        matchSearch &&
        matchClass &&
        matchTeacher &&
        matchOrientation &&
        matchResult &&
        matchMine
      );
    });
  }, [
    teamList,
    searchTerm,
    classFilter,
    teacherFilter,
    orientationFilter,
    resultFilter,
    onlyMyStudents,
    currentUserProfile,
  ]);

  const stats = useMemo(() => {
    const total = teamList.length;
    const exceeded = teamList.filter((t) => t.result_status === "Vượt chỉ tiêu").length;
    const completed = teamList.filter((t) => t.result_status === "Hoàn thành").length;
    const notMet = teamList.filter((t) => t.result_status === "Không đạt").length;
    return { total, exceeded, completed, notMet };
  }, [teamList]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    classFilter !== "all" ||
    teacherFilter !== "all" ||
    orientationFilter !== "all" ||
    resultFilter !== "all" ||
    onlyMyStudents;

  const handleResetFilters = () => {
    setSearchTerm("");
    setClassFilter("all");
    setTeacherFilter("all");
    setOrientationFilter("all");
    setResultFilter("all");
    setOnlyMyStudents(false);
  };

  // Kiểm tra học sinh này có phải do chính tài khoản giáo viên đang đăng nhập bồi dưỡng hay không
  const isMyTrainedStudent = useCallback(
    (item: TrainingTeamItem): boolean => {
      if (!currentUserProfile) return false;
      if (item.teacher_id && currentUserProfile.id && item.teacher_id === currentUserProfile.id) {
        return true;
      }
      if (item.user_id && currentUserProfile.id && item.user_id === currentUserProfile.id) {
        return true;
      }
      if (
        item.teacher_name &&
        currentUserProfile.name &&
        item.teacher_name.trim().toLowerCase() === currentUserProfile.name.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    },
    [currentUserProfile]
  );

  // =========================================================================
  // 7. CÁC HÀM THÊM / SỬA / XÓA HỌC SINH ĐỘI TUYỂN
  // =========================================================================
  const handleOpenAddModal = () => {
    const defaultClass = localClasses.length > 0 ? localClasses[0].name : "";
    const myTeacherProfile = teachersList.find(
      (t) =>
        t.id === currentUserProfile?.id ||
        t.email?.toLowerCase() === currentUserProfile?.email?.toLowerCase()
    );

    setModalMode("add");
    setEditingItem(null);
    setClassCampusFilter("all");
    setFormData({
      student_name: "",
      class_name: defaultClass,
      teacher_id: myTeacherProfile?.id || currentUserProfile?.id || "",
      teacher_name: currentUserProfile?.name || myTeacherProfile?.name || "",
      orientation: "",
      expected_goal: "",
      actual_achievement: "",
      result_status: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TrainingTeamItem) => {
    if (!isMyTrainedStudent(item)) {
      showToast(
        `Thầy/Cô chỉ được phép chỉnh sửa học sinh do chính mình bồi dưỡng (${item.teacher_name})!`,
        "warning"
      );
      return;
    }

    setModalMode("edit");
    setEditingItem(item);
    setClassCampusFilter("all");
    setFormData({
      student_name: item.student_name || "",
      class_name: item.class_name || "",
      teacher_id: item.teacher_id || "",
      teacher_name: item.teacher_name || "",
      orientation: item.orientation || "",
      expected_goal: item.expected_goal || "",
      actual_achievement: item.actual_achievement || "",
      result_status: item.result_status || "",
    });
    setIsModalOpen(true);
  };

  // Xử lý khi giáo viên bấm nút "Xác nhận" trong form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.student_name.trim()) {
      showToast("Vui lòng nhập Họ và tên học sinh!", "warning");
      return;
    }

    if (!formData.class_name.trim()) {
      showToast("Vui lòng chọn Lớp của học sinh từ danh sách lớp!", "warning");
      return;
    }

    if (!formData.orientation.trim()) {
      showToast("Vui lòng nhập Định hướng bồi dưỡng cho học sinh!", "warning");
      return;
    }

    if (!formData.expected_goal.trim()) {
      showToast("Vui lòng nhập Mục tiêu kì vọng (sau khi lưu sẽ được khóa cố định)!", "warning");
      return;
    }

    const matchedClass = localClasses.find((c) => c.name === formData.class_name);
    const myTeacherProfile = teachersList.find(
      (t) =>
        t.id === currentUserProfile?.id ||
        t.email?.toLowerCase() === currentUserProfile?.email?.toLowerCase()
    );

    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        // Giáo viên bồi dưỡng mặc định là họ tên của tài khoản giáo viên đang đăng nhập, không khai báo thay cho GV khác
        const lockedTeacherId = myTeacherProfile?.id || currentUserProfile?.id || null;
        const lockedTeacherName =
          currentUserProfile?.name || myTeacherProfile?.name || formData.teacher_name.trim();

        const payload = {
          student_name: formData.student_name.trim(),
          class_id: matchedClass?.id || null,
          class_name: formData.class_name.trim(),
          teacher_id: lockedTeacherId,
          teacher_name: lockedTeacherName,
          orientation: formData.orientation.trim(),
          expected_goal: formData.expected_goal.trim(),
          is_goal_locked: true, // Khóa ngay sau khi nhập xong
          actual_achievement: formData.actual_achievement.trim(),
          result_status: formData.result_status || "",
          school_year: selectedSchoolYear,
          user_id: currentUserProfile?.id || null,
        };

        const { error } = await supabase.from("training_teams").insert(payload);
        if (error) throw error;

        showToast(
          `Đã xác nhận thêm học sinh "${formData.student_name.trim()}" (${formData.class_name}) vào Đội tuyển và khóa Mục tiêu kì vọng!`,
          "success"
        );
      } else if (modalMode === "edit" && editingItem) {
        if (!isMyTrainedStudent(editingItem)) {
          showToast(
            "Thầy/Cô không có quyền chỉnh sửa học sinh do giáo viên khác bồi dưỡng!",
            "warning"
          );
          setIsSubmitting(false);
          return;
        }

        // Nếu mục tiêu kì vọng đã khóa thì giữ nguyên giá trị cũ
        const finalExpectedGoal = isGoalLockedInModal
          ? editingItem.expected_goal
          : formData.expected_goal.trim();

        const payload = {
          student_name: formData.student_name.trim(),
          class_id: matchedClass?.id || editingItem.class_id || null,
          class_name: formData.class_name.trim(),
          teacher_id: editingItem.teacher_id || null,
          teacher_name: editingItem.teacher_name,
          orientation: formData.orientation.trim(),
          expected_goal: finalExpectedGoal,
          is_goal_locked: true,
          actual_achievement: formData.actual_achievement.trim(),
          result_status: formData.result_status || "",
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("training_teams")
          .update(payload)
          .eq("id", editingItem.id);

        if (error) throw error;

        showToast(
          `Đã xác nhận cập nhật thông tin học sinh "${formData.student_name.trim()}" thành công!`,
          "success"
        );
      }

      setIsModalOpen(false);
      await loadTeams();
      router.refresh();
    } catch (err: any) {
      console.error("Lỗi lưu học sinh đội tuyển:", err);
      showToast(err.message || "Không thể lưu thông tin đội tuyển!", "warning");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật nhanh cột Kết quả ngay trên bảng (Chỉ giáo viên bồi dưỡng học sinh đó mới được sửa)
  const handleQuickUpdateResult = async (
    item: TrainingTeamItem,
    newStatus: "" | "Chưa đánh giá" | "Vượt chỉ tiêu" | "Hoàn thành" | "Không đạt"
  ) => {
    if (!isMyTrainedStudent(item)) {
      showToast(
        `Chỉ giáo viên bồi dưỡng (${item.teacher_name}) mới được phép cập nhật kết quả của học sinh này!`,
        "warning"
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("training_teams")
        .update({
          result_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) throw error;

      setTeamList((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, result_status: newStatus } : row))
      );
      showToast(
        `Đã cập nhật kết quả của học sinh "${item.student_name}" thành: ${
          newStatus || "Chưa đánh giá"
        }!`,
        "success"
      );
    } catch (err: any) {
      showToast(err.message || "Không thể cập nhật kết quả!", "warning");
    }
  };

  // Xóa học sinh khỏi danh sách đội tuyển (Chỉ dành cho Tổ trưởng chuyên môn)
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmItem) return;
    if (!isLeader) {
      showToast("Chỉ Tổ trưởng chuyên môn mới có quyền xóa học sinh khỏi danh sách Đội tuyển!", "warning");
      setDeleteConfirmItem(null);
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("training_teams")
        .delete()
        .eq("id", deleteConfirmItem.id);

      if (error) throw error;

      showToast(
        `Đã xóa học sinh "${deleteConfirmItem.student_name}" khỏi danh sách Đội tuyển!`,
        "success"
      );
      setDeleteConfirmItem(null);
      await loadTeams();
      router.refresh();
    } catch (err: any) {
      console.error("Lỗi xóa học sinh đội tuyển:", err);
      showToast(err.message || "Không thể xóa bản ghi này!", "warning");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* =================================================================== */}
      {/* 1. HEADER & THỐNG KÊ TỔNG QUAN ĐỘI TUYỂN                             */}
      {/* =================================================================== */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Quản Lý Bồi Dưỡng Đội Tuyển Học Sinh Giỏi ICT
                </h2>
                <Badge variant="amber" className="text-xs font-bold">
                  Năm học {selectedSchoolYear}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Theo dõi danh sách học sinh đội tuyển, giáo viên bồi dưỡng, định hướng và đối chiếu Mục tiêu kì vọng (khóa cố định sau khi xác nhận) với Thành tích thực tế.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              type="button"
              onClick={handleOpenAddModal}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md shadow-sky-600/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              + Thêm Học Sinh Đội Tuyển
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadTeams}
              className="rounded-xl font-semibold cursor-pointer h-10 px-3"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* 4 THẺ CHỈ SỐ ĐỘI TUYỂN */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Tổng Học Sinh Đội Tuyển
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {stats.total}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/25 border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                Vượt Chỉ Tiêu
              </div>
              <div className="text-2xl font-black text-purple-900 dark:text-purple-200 mt-0.5">
                {stats.exceeded}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Hoàn Thành Mục Tiêu
              </div>
              <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                {stats.completed}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/25 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                Không Đạt Chỉ Tiêu
              </div>
              <div className="text-2xl font-black text-rose-900 dark:text-rose-200 mt-0.5">
                {stats.notMet}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. THANH CÔNG CỤ LỌC THÔNG TIN ĐA CHIỀU                           */}
        {/* ================================================================= */}
        <div className="pt-1 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-2.5">
            {/* Ô tìm kiếm từ khóa */}
            <div className="relative xl:col-span-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên học sinh, định hướng, mục tiêu, thành tích..."
                className="pl-9 h-10 text-xs rounded-xl"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Lọc theo Lớp */}
            <div className="xl:col-span-2">
              <select
                aria-label="Lọc theo lớp"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">Tất cả các lớp ({localClasses.length} lớp)</option>
                {(availableClassesInTable.length > 0
                  ? availableClassesInTable
                  : localClasses.map((c) => c.name)
                ).map((clsName) => (
                  <option key={clsName} value={clsName}>
                    Lớp {clsName}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo Giáo viên bồi dưỡng */}
            <div className="xl:col-span-2">
              <select
                aria-label="Lọc theo giáo viên bồi dưỡng"
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">Tất cả GV bồi dưỡng</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo Định hướng */}
            <div className="xl:col-span-2">
              <select
                aria-label="Lọc theo định hướng"
                value={orientationFilter}
                onChange={(e) => setOrientationFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">Tất cả định hướng</option>
                {Array.from(
                  new Set([...ORIENTATION_SUGGESTIONS, ...availableOrientations])
                ).map((ori) => (
                  <option key={ori} value={ori}>
                    {ori}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo Kết quả */}
            <div className="xl:col-span-2">
              <select
                aria-label="Lọc theo kết quả"
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">Tất cả kết quả</option>
                <option value="Vượt chỉ tiêu">🌟 Vượt chỉ tiêu</option>
                <option value="Hoàn thành">✅ Hoàn thành</option>
                <option value="Không đạt">⚠️ Không đạt</option>
                <option value="Chưa đánh giá">⏳ Chưa đánh giá</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyMyStudents(!onlyMyStudents)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                  onlyMyStudents
                    ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Học sinh tôi bồi dưỡng</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Xóa bộ lọc
                </button>
              )}
            </div>

            <div className="text-slate-500 dark:text-slate-400 font-medium">
              Đang hiển thị <strong className="text-slate-800 dark:text-slate-100">{filteredTeams.length}</strong> / {teamList.length} học sinh đội tuyển
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. BẢNG DANH SÁCH HỌC SINH ĐỘI TUYỂN (RỘNG KHÍT 100% MÀN HÌNH)      */}
      {/* =================================================================== */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/70 animate-pulse"
              />
            ))}
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {hasActiveFilters
                  ? "Không tìm thấy học sinh đội tuyển nào khớp với bộ lọc"
                  : `Chưa có dữ liệu Đội tuyển trong Năm học ${selectedSchoolYear}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Thầy cô hãy thử thay đổi từ khóa tìm kiếm hoặc bấm Xóa bộ lọc để xem toàn bộ danh sách."
                  : "Tất cả giáo viên trong tổ ICT đều có thể thêm học sinh vào danh sách bồi dưỡng đội tuyển và đăng ký Mục tiêu kì vọng."}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="rounded-xl text-xs font-bold cursor-pointer"
                >
                  Đặt Lại Bộ Lọc
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleOpenAddModal}
                  className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  + Thêm Học Sinh Đầu Tiên
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto md:overflow-x-visible">
            <table className="w-full table-fixed text-left border-collapse text-xs">
              <colgroup>
                <col className="w-[4%]" />
                <col className="w-[15%]" />
                <col className="w-[8%]" />
                <col className="w-[15%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[12%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase text-[11px] font-extrabold tracking-wider">
                  <th className="py-3.5 px-2 text-center">STT</th>
                  <th className="py-3.5 px-2.5">Họ và Tên Học Sinh</th>
                  <th className="py-3.5 px-2 text-center">Lớp</th>
                  <th className="py-3.5 px-2.5">Giáo Viên Bồi Dưỡng</th>
                  <th className="py-3.5 px-2.5">Định Hướng</th>
                  <th className="py-3.5 px-2.5">Mục Tiêu Kì Vọng</th>
                  <th className="py-3.5 px-2.5">Thành Tích Thực Tế</th>
                  <th className="py-3.5 px-2 text-center">Kết Quả</th>
                  <th className="py-3.5 px-2 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTeams.map((item, index) => {
                  const lockedGoal =
                    item.is_goal_locked &&
                    Boolean(item.expected_goal && item.expected_goal.trim());
                  const canEditRow = isMyTrainedStudent(item);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-sky-50/40 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Cột 1: STT */}
                      <td className="py-3.5 px-2 text-center font-bold text-slate-500 dark:text-slate-400 align-middle">
                        {index + 1}
                      </td>

                      {/* Cột 2: Họ và tên học sinh */}
                      <td className="py-3.5 px-2.5 align-middle break-words">
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs leading-snug">
                          {item.student_name}
                        </div>
                      </td>

                      {/* Cột 3: Lớp */}
                      <td className="py-3.5 px-2 text-center align-middle">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800 font-extrabold text-[11px]">
                          {item.class_name}
                        </span>
                      </td>

                      {/* Cột 4: Giáo viên bồi dưỡng */}
                      <td className="py-3.5 px-2.5 align-middle break-words">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                          <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">
                            {item.teacher_name ? item.teacher_name.charAt(0) : "G"}
                          </span>
                          <span className="leading-snug">{item.teacher_name}</span>
                        </div>
                      </td>

                      {/* Cột 5: Định hướng */}
                      <td className="py-3.5 px-2.5 align-middle break-words">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900 font-bold text-[11px] leading-snug">
                          <Compass className="w-3 h-3 shrink-0 text-indigo-500" />
                          <span>{item.orientation || "Chưa cập nhật"}</span>
                        </span>
                      </td>

                      {/* Cột 6: Mục tiêu kì vọng (Có biểu tượng khóa sau khi nhập xong) */}
                      <td className="py-3.5 px-2.5 align-middle break-words">
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 font-bold text-[11px] leading-snug"
                          title={
                            lockedGoal
                              ? "Mục tiêu kì vọng đã được khóa cố định sau khi xác nhận"
                              : "Mục tiêu kì vọng"
                          }
                        >
                          {lockedGoal ? (
                            <Lock className="w-3 h-3 shrink-0 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <Target className="w-3 h-3 shrink-0 text-amber-600 dark:text-amber-400" />
                          )}
                          <span>{item.expected_goal || "Chưa nhập"}</span>
                        </div>
                      </td>

                      {/* Cột 7: Thành tích thực tế */}
                      <td className="py-3.5 px-2.5 align-middle break-words">
                        {item.actual_achievement && item.actual_achievement.trim() ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 font-bold text-[11px] leading-snug">
                            <Award className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>{item.actual_achievement}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                            Chưa cập nhật
                          </span>
                        )}
                      </td>

                      {/* Cột 8: Kết quả (Chỉ giáo viên bồi dưỡng học sinh đó mới được chọn/sửa) */}
                      <td className="py-3.5 px-2 text-center align-middle">
                        {canEditRow ? (
                          <select
                            aria-label="Chọn kết quả đánh giá"
                            value={item.result_status || ""}
                            onChange={(e) =>
                              handleQuickUpdateResult(
                                item,
                                e.target.value as
                                  | ""
                                  | "Chưa đánh giá"
                                  | "Vượt chỉ tiêu"
                                  | "Hoàn thành"
                                  | "Không đạt"
                              )
                            }
                            className={`w-full px-2 py-1.5 rounded-xl text-[11px] font-extrabold border text-center cursor-pointer focus:outline-none transition-colors ${
                              item.result_status === "Vượt chỉ tiêu"
                                ? "bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-800"
                                : item.result_status === "Hoàn thành"
                                ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
                                : item.result_status === "Không đạt"
                                ? "bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <option value="">-- Chọn kết quả --</option>
                            <option value="Vượt chỉ tiêu">🌟 Vượt chỉ tiêu</option>
                            <option value="Hoàn thành">✅ Hoàn thành</option>
                            <option value="Không đạt">⚠️ Không đạt</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center justify-center w-full px-2 py-1.5 rounded-xl text-[11px] font-extrabold border select-none ${
                              item.result_status === "Vượt chỉ tiêu"
                                ? "bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-800"
                                : item.result_status === "Hoàn thành"
                                ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
                                : item.result_status === "Không đạt"
                                ? "bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                            }`}
                            title={`Chỉ ${item.teacher_name} mới được cập nhật kết quả`}
                          >
                            {item.result_status === "Vượt chỉ tiêu"
                              ? "🌟 Vượt chỉ tiêu"
                              : item.result_status === "Hoàn thành"
                              ? "✅ Hoàn thành"
                              : item.result_status === "Không đạt"
                              ? "⚠️ Không đạt"
                              : "Chưa đánh giá"}
                          </span>
                        )}
                      </td>

                      {/* Cột 9: Thao tác Sửa / Xóa (Chỉ GV bồi dưỡng được Sửa, chỉ Tổ trưởng được Xóa) */}
                      <td className="py-3.5 px-2 text-center align-middle">
                        <div className="inline-flex items-center justify-center gap-1">
                          {canEditRow ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-xl text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/50 transition-colors cursor-pointer"
                              title="Cập nhật thông tin học sinh đội tuyển"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 rounded-xl text-slate-300 dark:text-slate-700 cursor-not-allowed"
                              title={`Học sinh do ${item.teacher_name} bồi dưỡng (Không thể chỉnh sửa)`}
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {isLeader && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmItem(item)}
                              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                              title="Xóa khỏi danh sách đội tuyển (Chỉ dành cho Tổ trưởng)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 4. MODAL THÊM / CẬP NHẬT HỌC SINH ĐỘI TUYỂN (CÓ NÚT XÁC NHẬN & HỦY) */}
      {/* =================================================================== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            if (!isSubmitting) setIsModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-6 py-4 bg-gradient-to-r from-sky-600 to-sky-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    {modalMode === "add"
                      ? "Thêm Học Sinh Vào Đội Tuyển"
                      : "Cập Nhật Thông Tin Học Sinh Đội Tuyển"}
                  </h3>
                  <p className="text-xs text-sky-100 mt-0.5">
                    Năm học {selectedSchoolYear} • Bấm Xác nhận sau khi điền đầy đủ thông tin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Hàng 1: Họ và tên học sinh + Lớp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200 block">
                    Họ và Tên Học Sinh: <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.student_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, student_name: e.target.value }))
                    }
                    placeholder="Ví dụ: Nguyễn Minh Khôi"
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-200">
                      Lớp (Từ danh sách lớp): <span className="text-rose-500">*</span>
                    </label>
                    <select
                      aria-label="Lọc cơ sở tìm lớp"
                      value={classCampusFilter}
                      onChange={(e) => {
                        const nextCampus = e.target.value;
                        setClassCampusFilter(nextCampus);
                        const list =
                          nextCampus === "all"
                            ? localClasses
                            : localClasses.filter((c) => c.campus === nextCampus);
                        if (list.length > 0) {
                          setFormData((prev) => ({ ...prev, class_name: list[0].name }));
                        }
                      }}
                      className="text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tất cả 5 CS ({localClasses.length} lớp)</option>
                      <option value="CS1">CS1 - Riverside</option>
                      <option value="CS2">CS2 - Central</option>
                      <option value="CS3">CS3 - Global</option>
                      <option value="CS4">CS4 - Hill</option>
                      <option value="CS5">CS5 - Beach</option>
                    </select>
                  </div>
                  <select
                    aria-label="Chọn lớp của học sinh"
                    value={formData.class_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, class_name: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    required
                  >
                    <option value="">-- Chọn lớp học --</option>
                    {filteredModalClasses.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name} (Khối {cls.grade})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hàng 2: Giáo viên bồi dưỡng (Mặc định theo tài khoản đang đăng nhập, khóa không cho khai báo thay GV khác) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Giáo Viên Bồi Dưỡng: <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Mặc định theo tài khoản giáo viên (Không khai báo thay GV khác)
                  </span>
                </div>
                <Input
                  type="text"
                  value={formData.teacher_name}
                  disabled
                  readOnly
                  className="h-10 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold cursor-not-allowed opacity-90"
                />
              </div>

              {/* Hàng 3: Định hướng bồi dưỡng */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-200 block">
                  Định Hướng Bồi Dưỡng: <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.orientation}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, orientation: e.target.value }))
                  }
                  placeholder="Ví dụ: Tin học trẻ, Robothon Quốc tế, Lập trình Scratch / Python..."
                  className="h-10 text-xs rounded-xl"
                  required
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400">Chọn nhanh:</span>
                  {ORIENTATION_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, orientation: sug }))
                      }
                      className="px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hàng 4: Mục tiêu kì vọng (Khóa lại sau khi nhập xong) */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    {isGoalLockedInModal ? (
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <Target className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    Mục Tiêu Kì Vọng: <span className="text-rose-500">*</span>
                  </label>
                  {isGoalLockedInModal ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-extrabold">
                      <Lock className="w-3 h-3" />
                      Đã khóa cố định (Không thể sửa)
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                      Sẽ khóa lại sau khi bấm Xác nhận
                    </span>
                  )}
                </div>

                <Input
                  type="text"
                  value={formData.expected_goal}
                  onChange={(e) => {
                    if (isGoalLockedInModal) return;
                    setFormData((prev) => ({ ...prev, expected_goal: e.target.value }));
                  }}
                  disabled={isGoalLockedInModal}
                  readOnly={isGoalLockedInModal}
                  placeholder="Ví dụ: Giải Nhất cấp Thành phố, Huy chương Vàng..."
                  className={`h-10 text-xs rounded-xl ${
                    isGoalLockedInModal
                      ? "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold cursor-not-allowed opacity-90"
                      : "bg-white dark:bg-slate-900"
                  }`}
                  required
                />

                {!isGoalLockedInModal && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                      Chọn nhanh:
                    </span>
                    {GOAL_SUGGESTIONS.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, expected_goal: goal }))
                        }
                        className="px-2.5 py-0.5 rounded-lg bg-white hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hàng 5: Thành tích thực tế & Kết quả */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200 block">
                    Thành Tích Thực Tế:
                  </label>
                  <Input
                    type="text"
                    value={formData.actual_achievement}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        actual_achievement: e.target.value,
                      }))
                    }
                    placeholder="Nhập kết quả đạt được thực tế..."
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200 block">
                    Kết Quả Đánh Giá:
                  </label>
                  <select
                    aria-label="Chọn kết quả đánh giá"
                    value={formData.result_status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        result_status: e.target.value as
                          | ""
                          | "Chưa đánh giá"
                          | "Vượt chỉ tiêu"
                          | "Hoàn thành"
                          | "Không đạt",
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="">-- Chọn kết quả (Hoặc cập nhật sau) --</option>
                    <option value="Vượt chỉ tiêu">🌟 Vượt chỉ tiêu</option>
                    <option value="Hoàn thành">✅ Hoàn thành</option>
                    <option value="Không đạt">⚠️ Không đạt</option>
                  </select>
                </div>
              </div>

              {/* Chân Form: Nút Hủy Bỏ và Nút Xác Nhận */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold px-5 cursor-pointer"
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold px-6 shadow-md shadow-sky-600/20 cursor-pointer"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  {isSubmitting ? "Đang Xử Lý..." : "Xác Nhận"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. MODAL XÁC NHẬN XÓA HỌC SINH ĐỘI TUYỂN                             */}
      {/* =================================================================== */}
      {deleteConfirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeleting) setDeleteConfirmItem(null);
          }}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Xác Nhận Xóa Học Sinh Đội Tuyển
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thao tác này sẽ xóa thông tin học sinh khỏi danh sách năm học {selectedSchoolYear}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1">
              <div>
                Học sinh:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {deleteConfirmItem.student_name}
                </strong>{" "}
                ({deleteConfirmItem.class_name})
              </div>
              <div>
                Giáo viên bồi dưỡng:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {deleteConfirmItem.teacher_name}
                </strong>
              </div>
              <div>
                Định hướng:{" "}
                <strong className="text-sky-700 dark:text-sky-300">
                  {deleteConfirmItem.orientation}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={isDeleting}
                className="rounded-xl text-xs font-bold px-4 cursor-pointer"
              >
                Hủy Bỏ
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteConfirm}
                className="rounded-xl text-xs font-bold px-5 cursor-pointer"
              >
                {isDeleting ? "Đang Xóa..." : "Xác Nhận Xóa"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

