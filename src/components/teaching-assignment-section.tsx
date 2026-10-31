"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  GraduationCap,
  Users,
  Search,
  Filter,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  School,
  Check,
  X,
  Loader2,
  CheckSquare,
  Square,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Layers,
  ChevronDown,
  RotateCcw,
  PlusCircle,
  Pencil,
  Trash2,
  ArrowRightLeft,
  AlertTriangle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ClassItem {
  id: string;
  name: string;
  campus: string;
  campus_name?: string;
  grade: string;
  curriculum: string;
  periods_per_week: number;
  teacher_id: string | null;
  teacher_name: string | null;
  school_year_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  campus: string;
  role: string;
  specialty?: string;
  lab?: string;
}

interface TeachingAssignmentSectionProps {
  classesList: ClassItem[];
  setClassesList: React.Dispatch<React.SetStateAction<ClassItem[]>>;
  teachersList: TeacherProfile[];
  supabase: SupabaseClient;
  showToast: (text: string, type?: "success" | "warning" | "info") => void;
  selectedSchoolYear: string;
  timetableSlots?: any[];
  setTimetableSlots?: React.Dispatch<React.SetStateAction<any[]>>;
  teacherTimetablesList?: any[];
  setTeacherTimetablesList?: React.Dispatch<React.SetStateAction<any[]>>;
  reloadDashboardData?: () => Promise<void>;
}

const campusInfoMap: Record<
  string,
  { name: string; shortName: string; badgeClass: string; borderClass: string; dotClass: string }
> = {
  "1": {
    name: "Cơ sở 1 - Riverside",
    shortName: "CS1 - Riverside",
    badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800",
    borderClass: "border-l-sky-500",
    dotClass: "bg-sky-500",
  },
  "2": {
    name: "Cơ sở 2 - Central",
    shortName: "CS2 - Central",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800",
    borderClass: "border-l-purple-500",
    dotClass: "bg-purple-500",
  },
  "3": {
    name: "Cơ sở 3 - Quốc tế",
    shortName: "CS3 - Quốc Tế",
    badgeClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800",
    borderClass: "border-l-cyan-500",
    dotClass: "bg-cyan-500",
  },
  "4": {
    name: "Cơ sở 4 - Hill",
    shortName: "CS4 - Hill",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    borderClass: "border-l-amber-500",
    dotClass: "bg-amber-500",
  },
  "5": {
    name: "Cơ sở 5 - Beach",
    shortName: "CS5 - Beach",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    borderClass: "border-l-rose-500",
    dotClass: "bg-rose-500",
  },
};

const revCampusMap: Record<string, string> = {
  riverside: "1",
  central: "2",
  international: "3",
  hill: "4",
  beach: "5",
};

const classAliases: Record<string, string> = {
  // Central (Campus 2)
  "mgn_2": "Flight - C1",
  "mgl_2": "Ready for Sky-line - C1",
  "1.2nt_2": "Roots - C1",
  "song ngữ_2": "Newton - C1",
  "1/4_2": "1/2INT_CS2",
  // Hill (Campus 4)
  "mgn_4": "Flight - H1",
  "mgl_4": "Ready for Sky-Line - H1",
  "ngl_4": "Ready for Sky-Line - H1",
  "1.2nt_4": "Roots - H1",
  "newton / 15h-16h_4": "Roots - H1",
  "8s_1": "8S_CS4",
  "9s_1": "9S_CS4",
  "10s_1": "10S_CS4",
  "12s_1": "12S_CS4",
  "9int_1": "9INT_CS3",
  "9uk_1": "9UK_CS3",
  "11int_1": "11INT_CS3",
  "12int_1": "12INT_CS3",
  // Global / International (Campus 3)
  "1int_3": "1/1INT_CS3",
  "2int_3": "2/1INT_CS3",
  "3int_3": "3/1INT_CS3",
  "5int_3": "5/1INT_CS3",
  "10int_3": "10 Compass_CS3",
  // Beach (Campus 5)
  "1int_5": "1/3INT_CS5",
  "2int_5": "2/2INT_CS5",
  "3int_5": "3/2INT_CS5",
  "5int_5": "5/2INT_CS5",
  "ready b1_5": "READY FOR SKY-LINE-B1",
  "ready b2_5": "READY FOR SKY-LINE-B2",
  "ready b3_5": "READY FOR SKY-LINE-B3",
  "flight b1_5": "FLIGHT-B1",
  "flight b2_5": "FLIGHT-B2",
  "flight b3_5": "FLIGHT-B3",
  "roots b1_5": "ROOTS-B1",
  "roots b2_5": "ROOTS-B2",
};

export function TeachingAssignmentSection({
  classesList,
  setClassesList,
  teachersList,
  supabase,
  showToast,
  selectedSchoolYear,
  timetableSlots,
  setTimetableSlots,
  teacherTimetablesList,
  setTeacherTimetablesList,
  reloadDashboardData,
}: TeachingAssignmentSectionProps) {
  // --- STATES ---
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingToTimetables, setIsSyncingToTimetables] = useState(false);

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCampus, setFilterCampus] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterCurriculum, setFilterCurriculum] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "assigned" | "unassigned">("all");
  const [activeTeacherFilter, setActiveTeacherFilter] = useState<string | null>(null);

  // Chọn hàng loạt (Batch select)
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [batchTargetTeacherId, setBatchTargetTeacherId] = useState<string>("");

  // Modal Import File
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedPreview, setImportedPreview] = useState<Partial<ClassItem>[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [importedFileName, setImportedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Thêm Lớp Mới (Task 1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addClassForm, setAddClassForm] = useState({
    name: "",
    campus: "1",
    grade: "1",
    curriculum: "S",
    periods_per_week: 2,
    teacher_id: "",
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Modal Sửa Lớp Học (Task 1)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [editClassForm, setEditClassForm] = useState({
    name: "",
    campus: "1",
    grade: "1",
    curriculum: "S",
    periods_per_week: 2,
    teacher_id: "",
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Modal Xác Nhận Xóa Lớp (Task 1)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // --- TÍNH TOÁN THỐNG KÊ GIÁO VIÊN THEO THỜI GIAN THỰC ---
  const teacherStats = useMemo(() => {
    return teachersList.map((teacher) => {
      const assigned = classesList.filter(
        (c) =>
          c.teacher_id === teacher.id ||
          (c.teacher_name && c.teacher_name.trim().toLowerCase() === teacher.name.trim().toLowerCase())
      );
      const totalPeriods = assigned.reduce((sum, c) => sum + (Number(c.periods_per_week) || 2), 0);
      return {
        ...teacher,
        assignedCount: assigned.length,
        totalPeriods,
      };
    });
  }, [teachersList, classesList]);

  // Thống kê tổng quan
  const totalClasses = classesList.length;
  const assignedCount = classesList.filter((c) => c.teacher_id || c.teacher_name).length;
  const unassignedCount = totalClasses - assignedCount;
  const totalWeeklyPeriods = classesList.reduce((sum, c) => sum + (Number(c.periods_per_week) || 2), 0);

  // --- LỌC DANH SÁCH LỚP HỌC ---
  const filteredClasses = useMemo(() => {
    return classesList.filter((c) => {
      if (filterCampus !== "all" && c.campus !== filterCampus) return false;

      if (filterGrade !== "all") {
        if (filterGrade === "mam_non") {
          if (!["NT", "MGB", "MGN", "MGL", "Song ngữ MGL", "Song ngữ MGN+MGL"].includes(c.grade)) return false;
        } else if (filterGrade === "tieu_hoc") {
          if (!["1", "2", "3", "4", "5"].includes(c.grade)) return false;
        } else if (filterGrade === "thcs") {
          if (!["6", "7", "8", "9"].includes(c.grade)) return false;
        } else if (filterGrade === "thpt") {
          if (!["10", "11", "12"].includes(c.grade)) return false;
        } else if (c.grade !== filterGrade) {
          return false;
        }
      }

      if (filterCurriculum !== "all" && c.curriculum !== filterCurriculum) return false;

      if (filterStatus === "assigned" && !c.teacher_id && !c.teacher_name) return false;
      if (filterStatus === "unassigned" && (c.teacher_id || c.teacher_name)) return false;

      if (activeTeacherFilter) {
        const isMatch =
          c.teacher_id === activeTeacherFilter ||
          (c.teacher_name &&
            c.teacher_name.toLowerCase().includes(
              (teachersList.find((t) => t.id === activeTeacherFilter)?.name || "").toLowerCase()
            ));
        if (!isMatch) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchGrade = c.grade.toLowerCase().includes(q);
        const matchTeacher = c.teacher_name?.toLowerCase().includes(q);
        const matchCampus = (c.campus_name || "").toLowerCase().includes(q);
        if (!matchName && !matchGrade && !matchTeacher && !matchCampus) return false;
      }

      return true;
    });
  }, [classesList, filterCampus, filterGrade, filterCurriculum, filterStatus, activeTeacherFilter, searchQuery, teachersList]);

  // --- HÀM KIỂM TRA ĐỘ KHỚP TIẾT HỌC VÀ LỚP HỌC (TASK 2) ---
  const checkSlotMatchesClass = (
    slotClassName: string,
    slotCampusId: string,
    cls: ClassItem
  ) => {
    if (!slotClassName || !cls) return false;
    const sClean = slotClassName.trim();
    const cNum = cls.campus;
    const slotCampusNum = revCampusMap[slotCampusId] || "";

    // 1. Khớp chính xác hoàn toàn
    if (sClean.toLowerCase() === cls.name.trim().toLowerCase()) return true;

    // 2. Khớp theo định danh gốc (bỏ hậu tố _CSx)
    const cBase = cls.name.replace(/_CS\d+$/i, "").trim();
    if (sClean.toLowerCase() === cBase.toLowerCase()) return true;

    // 3. Khớp qua danh mục từ đồng nghĩa (alias)
    const aliasKey = `${sClean.toLowerCase()}_${slotCampusNum || cNum}`;
    if (classAliases[aliasKey] && classAliases[aliasKey].toLowerCase() === cls.name.toLowerCase()) {
      return true;
    }

    // 4. Nếu tên ô tiết học có dấu gạch chéo tổ hợp (vd: Ready B1 / Flight B1)
    if (sClean.includes("/") && !sClean.replace(/\//g, "").match(/^\d+$/)) {
      const parts = sClean.split("/").map((p) => p.trim());
      for (const p of parts) {
        const pKey = `${p.toLowerCase()}_${slotCampusNum || cNum}`;
        if (classAliases[pKey] && classAliases[pKey].toLowerCase() === cls.name.toLowerCase()) {
          return true;
        }
      }
    }

    // 5. Chuẩn hóa bỏ ký tự đặc biệt
    const sAlpha = sClean
      .replace(/Toán Matific\s*-\s*/i, "")
      .replace(/_CS\d+$/i, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    const cAlpha = cls.name
      .replace(/_CS\d+$/i, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

    if (sAlpha && cAlpha && sAlpha === cAlpha) {
      if (!slotCampusNum || slotCampusNum === cNum) return true;
    }

    return false;
  };

  // --- HÀM ĐỒNG BỘ TOÀN DIỆN TỪ PHẦN 3 SANG PHẦN 1 VÀ PHẦN 2 (TASK 2) ---
  const handleSyncToTimetables = async (overrideClasses?: ClassItem[]) => {
    setIsSyncingToTimetables(true);
    const sourceClasses = overrideClasses || classesList;

    try {
      // 1. Tải toàn bộ tiết dạy hiện tại từ teacher_timetables theo Năm học (dùng chung cho cả Phần 1 Lịch Phòng Lab & Phần 2 TKB Giáo viên)
      const { data: teacherSlotsData, error: ttErr } = await supabase
        .from("teacher_timetables")
        .select("*")
        .eq("school_year", selectedSchoolYear);

      if (ttErr) {
        showToast("Lỗi khi tải dữ liệu thời khóa biểu: " + ttErr.message, "warning");
        return;
      }

      let teacherUpdatedCount = 0;

      // 2. Đồng bộ sang teacher_timetables (Phục vụ đồng thời Phần 1: Lịch Phòng Lab & Phần 2: Lịch Cá Nhân Giáo Viên)
      const teacherCodeMap: Record<string, string> = {
        "Cô Đào Thị Mỹ Linh": "LINH",
        "Thầy Đồng Nguyên Tuấn": "TUAN",
        "Thầy Đỗ Anh Huy": "HUY",
        "Cô Lương Thị Ngọc Ánh": "ANH",
        "Cô Nguyễn Thị Mỹ Tâm": "TAM",
        "Cô Trịnh Thị Đăng": "DANG",
        "Cô Phạm Thị Thanh Bình": "BINH",
        "Cô Trần Thị Phi Yến": "YEN",
      };

      const updatedTeacherSlots = (teacherSlotsData || []).map((slot: any) => {
        const matchedClass = sourceClasses.find((c) =>
          checkSlotMatchesClass(slot.class_name, slot.campus_id, c)
        );

        if (matchedClass) {
          let changed = false;
          const newSlot = { ...slot };

          // Đặc biệt: Đồng bộ Tên Lớp chuẩn từ Phần 3
          if (newSlot.class_name !== matchedClass.name) {
            newSlot.class_name = matchedClass.name;
            changed = true;
          }

          // Đồng bộ Giáo viên phụ trách từ Phần 3
          if (matchedClass.teacher_name && newSlot.teacher_name !== matchedClass.teacher_name) {
            newSlot.teacher_name = matchedClass.teacher_name;
            newSlot.teacher_id = matchedClass.teacher_id;
            newSlot.teacher_code = teacherCodeMap[matchedClass.teacher_name] || slot.teacher_code;
            changed = true;
          }

          if (changed) {
            teacherUpdatedCount++;
            newSlot.updated_at = new Date().toISOString();
            return newSlot;
          }
        }
        return slot;
      });

      // 3. Lưu lại dữ liệu đã đồng bộ vào Supabase
      if (teacherUpdatedCount > 0) {
        await supabase.from("teacher_timetables").upsert(updatedTeacherSlots);
      }

      // 4. Cập nhật lại giao diện tức thì
      if (reloadDashboardData) {
        await reloadDashboardData();
      }

      showToast(
        `Đã đồng bộ thành công ${teacherUpdatedCount} tiết dạy sang Lịch phòng Lab (Phần 1) và TKB giáo viên (Phần 2)!`,
        "success"
      );
    } catch (err: any) {
      console.error("Lỗi đồng bộ:", err);
      showToast("Có lỗi xảy ra khi đồng bộ: " + err.message, "warning");
    } finally {
      setIsSyncingToTimetables(false);
    }
  };

  // --- THAO TÁC PHÂN CÔNG TỪNG LỚP ---
  const handleAssignTeacher = (classId: string, teacherIdVal: string) => {
    setClassesList((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          if (!teacherIdVal) {
            return { ...c, teacher_id: null, teacher_name: null };
          }
          const teacher = teachersList.find((t) => t.id === teacherIdVal);
          return {
            ...c,
            teacher_id: teacher ? teacher.id : null,
            teacher_name: teacher ? teacher.name : null,
          };
        }
        return c;
      })
    );
    setHasUnsavedChanges(true);
  };

  // --- THAO TÁC CHỌN TẤT CẢ / BỎ CHỌN ---
  const isAllFilteredSelected =
    filteredClasses.length > 0 && filteredClasses.every((c) => selectedClassIds.includes(c.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredClasses.map((c) => c.id));
      setSelectedClassIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = new Set([...selectedClassIds, ...filteredClasses.map((c) => c.id)]);
      setSelectedClassIds(Array.from(newIds));
    }
  };

  const handleToggleSelectOne = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  // --- PHÂN CÔNG HÀNG LOẠT ---
  const handleBatchAssign = () => {
    if (selectedClassIds.length === 0) {
      showToast("Vui lòng chọn ít nhất một lớp học để phân công!", "warning");
      return;
    }

    const teacher = teachersList.find((t) => t.id === batchTargetTeacherId);
    setClassesList((prev) =>
      prev.map((c) => {
        if (selectedClassIds.includes(c.id)) {
          if (!batchTargetTeacherId) {
            return { ...c, teacher_id: null, teacher_name: null };
          }
          return {
            ...c,
            teacher_id: teacher ? teacher.id : null,
            teacher_name: teacher ? teacher.name : null,
          };
        }
        return c;
      })
    );

    const count = selectedClassIds.length;
    setSelectedClassIds([]);
    setBatchTargetTeacherId("");
    setHasUnsavedChanges(true);
    showToast(
      batchTargetTeacherId && teacher
        ? `Đã phân công ${count} lớp cho ${teacher.name}!`
        : `Đã hủy phân công cho ${count} lớp đã chọn!`,
      "success"
    );
  };

  // --- LƯU TRỮ PHÂN CÔNG LÊN SUPABASE & TỰ ĐỘNG ĐỒNG BỘ (TASK 2) ---
  const handleSaveAllAssignments = async () => {
    setIsSaving(true);
    try {
      const toUpsert = classesList.map((c) => ({
        id: c.id,
        name: c.name,
        campus: c.campus,
        campus_name: c.campus_name || campusInfoMap[c.campus]?.name || `Cơ sở ${c.campus}`,
        grade: c.grade,
        curriculum: c.curriculum,
        periods_per_week: c.periods_per_week || 2,
        teacher_id: c.teacher_id,
        teacher_name: c.teacher_name,
        school_year: selectedSchoolYear,
        school_year_id: c.school_year_id,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("classes").upsert(toUpsert);

      if (error) {
        console.error("Lỗi lưu phân công:", error);
        showToast("Lỗi khi lưu trữ phân công: " + error.message, "warning");
      } else {
        setHasUnsavedChanges(false);
        showToast(
          `Đã xác nhận và lưu trữ thành công phân công chuyên môn cho ${classesList.length} lớp học lên Supabase!`,
          "success"
        );

        // Tự động kích hoạt đồng bộ sang Phần 1 và Phần 2
        await handleSyncToTimetables(classesList);
      }
    } catch (err: any) {
      console.error(err);
      showToast("Có lỗi xảy ra: " + err.message, "warning");
    } finally {
      setIsSaving(false);
    }
  };

  // --- XỬ LÝ THÊM LỚP HỌC MỚI (TASK 1) ---
  const handleAddClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = addClassForm.name.trim();

    if (!trimmedName) {
      showToast("Vui lòng nhập tên lớp học!", "warning");
      return;
    }

    const isDuplicate = classesList.some(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      showToast(`Tên lớp "${trimmedName}" đã tồn tại trên hệ thống!`, "warning");
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const teacher = teachersList.find((t) => t.id === addClassForm.teacher_id);
      const newClassData = {
        name: trimmedName,
        campus: addClassForm.campus,
        campus_name: campusInfoMap[addClassForm.campus]?.name || `Cơ sở ${addClassForm.campus}`,
        grade: addClassForm.grade,
        curriculum: addClassForm.curriculum,
        periods_per_week: Number(addClassForm.periods_per_week) || 2,
        teacher_id: teacher ? teacher.id : null,
        teacher_name: teacher ? teacher.name : null,
        school_year: selectedSchoolYear,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("classes")
        .insert([newClassData])
        .select()
        .single();

      if (error) {
        showToast("Lỗi khi thêm lớp học: " + error.message, "warning");
      } else if (data) {
        const updatedList = [...classesList, data];
        setClassesList(updatedList);
        setIsAddModalOpen(false);
        setAddClassForm({
          name: "",
          campus: "1",
          grade: "1",
          curriculum: "S",
          periods_per_week: 2,
          teacher_id: "",
        });
        showToast(`Đã thêm thành công lớp học "${data.name}" vào hệ thống!`, "success");

        // Đồng bộ sang TKB nếu lớp có giáo viên
        if (data.teacher_name) {
          await handleSyncToTimetables(updatedList);
        }
      }
    } catch (err: any) {
      showToast("Có lỗi xảy ra: " + err.message, "warning");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // --- XỬ LÝ CHỈNH SỬA LỚP HỌC (TASK 1) ---
  const handleOpenEditModal = (cls: ClassItem) => {
    setEditingClass(cls);
    setEditClassForm({
      name: cls.name,
      campus: cls.campus,
      grade: cls.grade,
      curriculum: cls.curriculum || "S",
      periods_per_week: cls.periods_per_week || 2,
      teacher_id: cls.teacher_id || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    const trimmedName = editClassForm.name.trim();
    if (!trimmedName) {
      showToast("Tên lớp không được để trống!", "warning");
      return;
    }

    const isDuplicate = classesList.some(
      (c) => c.id !== editingClass.id && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      showToast(`Tên lớp "${trimmedName}" đã bị trùng với một lớp khác!`, "warning");
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const teacher = teachersList.find((t) => t.id === editClassForm.teacher_id);
      const oldName = editingClass.name;

      const updatedFields = {
        name: trimmedName,
        campus: editClassForm.campus,
        campus_name: campusInfoMap[editClassForm.campus]?.name || `Cơ sở ${editClassForm.campus}`,
        grade: editClassForm.grade,
        curriculum: editClassForm.curriculum,
        periods_per_week: Number(editClassForm.periods_per_week) || 2,
        teacher_id: teacher ? teacher.id : null,
        teacher_name: teacher ? teacher.name : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("classes")
        .update(updatedFields)
        .eq("id", editingClass.id)
        .select()
        .single();

      if (error) {
        showToast("Lỗi khi cập nhật lớp học: " + error.message, "warning");
      } else if (data) {
        const updatedList = classesList.map((c) => (c.id === editingClass.id ? data : c));
        setClassesList(updatedList);
        setIsEditModalOpen(false);
        setEditingClass(null);
        showToast(`Đã cập nhật thông tin lớp "${trimmedName}" thành công!`, "success");

        // Đồng bộ tên lớp mới và phân công sang Phần 1 và Phần 2
        await handleSyncToTimetables(updatedList);
      }
    } catch (err: any) {
      showToast("Có lỗi xảy ra: " + err.message, "warning");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // --- XỬ LÝ XÓA LỚP HỌC (TASK 1) ---
  const handleOpenDeleteModal = (cls: ClassItem) => {
    setClassToDelete(cls);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    setIsSubmittingDelete(true);

    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classToDelete.id);

      if (error) {
        showToast("Lỗi khi xóa lớp học: " + error.message, "warning");
      } else {
        const remaining = classesList.filter((c) => c.id !== classToDelete.id);
        setClassesList(remaining);
        setIsDeleteModalOpen(false);
        showToast(`Đã xóa thành công lớp "${classToDelete.name}" khỏi hệ thống!`, "success");
        setClassToDelete(null);
      }
    } catch (err: any) {
      showToast("Có lỗi xảy ra: " + err.message, "warning");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // --- IMPORT FILE (XLSX / CSV) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames.includes("DanhSachLop")
          ? "DanhSachLop"
          : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length < 2) {
          showToast("File không chứa dữ liệu lớp học!", "warning");
          return;
        }

        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const rowStr = rows[i].map((cell) => String(cell || "").toLowerCase()).join(" ");
          if (rowStr.includes("tên lớp") || rowStr.includes("khối") || rowStr.includes("lớp")) {
            headerRowIdx = i;
            break;
          }
        }

        const headers = rows[headerRowIdx].map((cell) => String(cell || "").trim().toLowerCase());
        const gradeIdx = headers.findIndex((h) => h.includes("khối"));
        const nameIdx = headers.findIndex((h) => h.includes("tên lớp") || h === "lớp");
        const currIdx = headers.findIndex((h) => h.includes("hệ") || h.includes("đào tạo"));
        const campusIdx = headers.findIndex((h) => h.includes("cơ sở"));
        const periodIdx = headers.findIndex((h) => h.includes("tiết"));
        const teacherIdx = headers.findIndex((h) => h.includes("giáo viên") || h.includes("gv"));

        const parsed: Partial<ClassItem>[] = [];

        for (let r = headerRowIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;

          const nIdx = nameIdx !== -1 ? nameIdx : 2;
          const nameVal = String(row[nIdx] || "").trim();
          if (!nameVal) continue;

          const gradeVal = String(row[gradeIdx !== -1 ? gradeIdx : 1] || "1").trim();
          const currVal = String(row[currIdx !== -1 ? currIdx : 3] || "S").trim();
          const campusVal = String(row[campusIdx !== -1 ? campusIdx : 4] || "1").trim();
          const periodVal = Number(row[periodIdx !== -1 ? periodIdx : 5]) || 2;
          const teacherNameVal =
            teacherIdx !== -1 && row[teacherIdx] ? String(row[teacherIdx]).trim() : null;

          let teacherIdVal: string | null = null;
          if (teacherNameVal) {
            const matchedTeacher = teachersList.find(
              (t) =>
                t.name.toLowerCase().includes(teacherNameVal.toLowerCase()) ||
                teacherNameVal.toLowerCase().includes(t.name.toLowerCase())
            );
            if (matchedTeacher) {
              teacherIdVal = matchedTeacher.id;
            }
          }

          parsed.push({
            name: nameVal,
            grade: gradeVal,
            curriculum: currVal,
            campus: campusVal,
            campus_name: campusInfoMap[campusVal]?.name || `Cơ sở ${campusVal}`,
            periods_per_week: periodVal,
            teacher_id: teacherIdVal,
            teacher_name: teacherNameVal,
          });
        }

        if (parsed.length === 0) {
          showToast("Không tìm thấy dòng thông tin lớp học hợp lệ!", "warning");
          return;
        }

        setImportedPreview(parsed);
        setIsImportModalOpen(true);
        showToast(`Đã nhận diện ${parsed.length} lớp học từ file!`, "info");
      } catch (err: any) {
        console.error("Lỗi đọc file:", err);
        showToast("Lỗi phân tích file: " + (err.message || "Định dạng không hợp lệ"), "warning");
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (importedPreview.length === 0) return;
    setIsUploading(true);

    try {
      const toUpsert = importedPreview.map((item) => ({
        name: item.name!,
        campus: item.campus || "1",
        campus_name: item.campus_name || campusInfoMap[item.campus || "1"]?.name || `Cơ sở ${item.campus || "1"}`,
        grade: item.grade || "1",
        curriculum: item.curriculum || "S",
        periods_per_week: item.periods_per_week || 2,
        teacher_id: item.teacher_id || null,
        teacher_name: item.teacher_name || null,
        school_year: selectedSchoolYear,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from("classes")
        .upsert(toUpsert, { onConflict: "school_year_id, name" })
        .select();

      if (error) {
        console.error("Lỗi import vào Supabase:", error);
        showToast("Lỗi nhập dữ liệu vào Supabase: " + error.message, "warning");
      } else {
        showToast(`Đã nhập và lưu thành công ${toUpsert.length} lớp học vào Supabase!`, "success");
        setIsImportModalOpen(false);
        setImportedPreview([]);

        const { data: refreshed } = await supabase
          .from("classes")
          .select("*")
          .order("campus", { ascending: true })
          .order("grade", { ascending: true })
          .order("name", { ascending: true });

        if (refreshed && refreshed.length > 0) {
          setClassesList(refreshed);
          await handleSyncToTimetables(refreshed);
        }
      }
    } catch (err: any) {
      showToast("Có lỗi xảy ra: " + err.message, "warning");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const wsData = [
      ["STT", "Khối lớp", "Tên lớp", "Hệ đào tạo", "Cơ sở", "Số tiết / tuần", "Giáo viên bộ môn ICT"],
      [1, "1", "1/1_CS1", "S", 1, 2, "Cô Đào Thị Mỹ Linh"],
      [2, "6", "6/1_CS1", "S", 1, 2, "Cô Đào Thị Mỹ Linh"],
      [3, "10", "10/1_CS1", "S", 1, 2, "Thầy Đồng Nguyên Tuấn"],
      [4, "12", "12/1_CS1", "S", 1, 2, "Thầy Đỗ Anh Huy"],
      [5, "MGN", "Flight - H1", "S", 4, 2, "Cô Phạm Thị Thanh Bình"],
      [6, "MGL", "READY FOR SKY-LINE-B3", "S", 5, 2, "Cô Trịnh Thị Đăng"],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "DanhSachLop");
    XLSX.writeFile(wb, "Mau_Danh_Sach_Lop_SkyLine.xlsx");
    showToast("Đã tải xuống file mẫu Excel thành công!", "info");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. KHUNG TIÊU ĐỀ, THỐNG KÊ TỔNG THỂ & CÁC NÚT TÁC VỤ CHÍNH               */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <GraduationCap className="w-6 h-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Phần 3: Phân Công Chuyên Môn & Danh Sách Lớp
                </h2>
                <Badge variant="default" className="text-xs font-bold">
                  Năm học {selectedSchoolYear}
                </Badge>
                {hasUnsavedChanges && (
                  <Badge variant="amber" className="text-xs font-bold animate-pulse">
                    Có thay đổi chưa lưu
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Quản lý danh sách lớp học (Thêm, Sửa, Xóa), sắp xếp giáo viên bộ môn ICT và đồng bộ chuẩn xác tên lớp sang Thời khóa biểu 6 phòng Lab và TKB cá nhân giáo viên.
              </p>
            </div>
          </div>

          {/* CÁC NÚT TÁC VỤ CHÍNH */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Nút Thêm Lớp Mới (Task 1) */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 shadow-2xs"
            >
              <PlusCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
              + Thêm Lớp Mới
            </Button>

            {/* Nút Đồng Bộ Sang TKB & Lịch Lab (Task 2) */}
            <Button
              size="sm"
              variant="outline"
              isLoading={isSyncingToTimetables}
              onClick={() => handleSyncToTimetables()}
              className="text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 hover:bg-sky-100 shadow-2xs"
              title="Đồng bộ toàn bộ tên lớp và phân công giáo viên sang Phần 1 (Lịch Lab) và Phần 2 (TKB Giáo Viên)"
            >
              <ArrowRightLeft className="w-4 h-4 mr-1.5 text-sky-600" />
              Đồng Bộ Sang TKB & Lịch Lab
            </Button>

            {/* Nút Tải Mẫu */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs font-semibold hover:border-slate-400"
              title="Tải file mẫu Excel chuẩn để nhập dữ liệu"
            >
              <Download className="w-4 h-4 mr-1.5 text-slate-500" />
              Tải File Mẫu
            </Button>

            {/* Nút Import File */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100"
            >
              <UploadCloud className="w-4 h-4 mr-1.5 text-slate-600" />
              Import File Lớp
            </Button>

            {/* Nút Xác Nhận & Lưu Trữ */}
            <Button
              size="sm"
              variant={hasUnsavedChanges ? "amber" : "default"}
              isLoading={isSaving}
              onClick={handleSaveAllAssignments}
              className={`text-xs font-bold shadow-md transition-all ${
                hasUnsavedChanges ? "shadow-amber-500/20 scale-[1.02]" : "shadow-sky-600/20"
              }`}
            >
              <Save className="w-4 h-4 mr-1.5" />
              {hasUnsavedChanges ? "Xác Nhận & Lưu Trữ Lên Supabase *" : "Đã Đồng Bộ Supabase"}
            </Button>
          </div>
        </div>

        {/* CÁC HUY HIỆU THỐNG KÊ NHANH */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Tổng số lớp toàn trường:
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-slate-900 dark:text-white">{totalClasses}</span>
              <span className="text-xs text-slate-500 font-semibold">lớp (5 cơ sở)</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50">
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 block">
              Đã phân công giáo viên:
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{assignedCount}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                ({totalClasses > 0 ? Math.round((assignedCount / totalClasses) * 100) : 0}%)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 block">
              Chưa phân công:
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-amber-700 dark:text-amber-300">{unassignedCount}</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">lớp cần xếp GV</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/50">
            <span className="text-[11px] font-medium text-sky-700 dark:text-sky-400 block">
              Tổng số tiết ICT toàn hệ thống:
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-sky-700 dark:text-sky-300">{totalWeeklyPeriods}</span>
              <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold">tiết / tuần</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DANH SÁCH 8 GIÁO VIÊN VÀ ĐỊNH MỨC TẢI DẠY (WORKLOAD CARDS)           */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              Danh Sách Giáo Viên Tổ Chuyên Môn ICT ({teachersList.length} Thầy Cô)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bấm vào từng thẻ giáo viên để <strong>lọc nhanh các lớp</strong> đang được phân công cho thầy cô đó.
            </p>
          </div>

          {activeTeacherFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTeacherFilter(null)}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-slate-400"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Xóa Lọc Giáo Viên (Hiện Tất Cả)
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {teacherStats.map((teacher) => {
            const isSelected = activeTeacherFilter === teacher.id;
            let statusText = "Đạt chuẩn";
            let statusBadge = "emerald";
            if (teacher.totalPeriods < 18) {
              statusText = `Còn thiếu ${18 - teacher.totalPeriods} tiết`;
              statusBadge = "secondary";
            } else if (teacher.totalPeriods > 24) {
              statusText = `Vượt chuẩn (+${teacher.totalPeriods - 24}t)`;
              statusBadge = "amber";
            }

            return (
              <div
                key={teacher.id}
                onClick={() =>
                  setActiveTeacherFilter((prev) => (prev === teacher.id ? null : teacher.id))
                }
                className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border relative ${
                  isSelected
                    ? "bg-sky-50/90 dark:bg-sky-950/60 border-sky-500 shadow-md ring-2 ring-sky-500/30 scale-[1.01]"
                    : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700 hover:shadow-xs"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                  </span>
                )}

                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    {teacher.name.replace(/Thầy|Cô/g, "").trim().charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={teacher.name}>
                      {teacher.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {teacher.campus}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Số lớp:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {teacher.assignedCount} lớp
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Tải dạy:</span>
                    <span className="font-black text-sky-600 dark:text-sky-400">
                      {teacher.totalPeriods} tiết/tuần
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <Badge variant={statusBadge as any} className="text-[9px] px-1.5 py-0.5">
                    {statusText}
                  </Badge>
                  <span className="text-[10px] text-slate-400 hover:text-sky-600 font-semibold">
                    {isSelected ? "Đang lọc ✓" : "Lọc lớp →"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. THANH CÔNG CỤ TÌM KIẾM, LỌC & THAO TÁC HÀNG LOẠT                    */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên lớp (vd: 1/1, Roots, Ready, 10S...)"
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          <div>
            <select
              value={filterCampus}
              onChange={(e) => setFilterCampus(e.target.value)}
              className="w-full h-9 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Tất cả 5 Cơ sở</option>
              <option value="1">Cơ sở 1 - Riverside</option>
              <option value="2">Cơ sở 2 - Central</option>
              <option value="3">Cơ sở 3 - Quốc tế</option>
              <option value="4">Cơ sở 4 - Hill</option>
              <option value="5">Cơ sở 5 - Beach</option>
            </select>
          </div>

          <div>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full h-9 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Tất cả Khối lớp</option>
              <option value="mam_non">Mầm non (NT, MGB, MGN, MGL)</option>
              <option value="tieu_hoc">Tiểu học (Khối 1 - 5)</option>
              <option value="thcs">THCS (Khối 6 - 9)</option>
              <option value="thpt">THPT (Khối 10 - 12)</option>
              <option value="1">Khối 1</option>
              <option value="2">Khối 2</option>
              <option value="3">Khối 3</option>
              <option value="4">Khối 4</option>
              <option value="5">Khối 5</option>
              <option value="6">Khối 6</option>
              <option value="7">Khối 7</option>
              <option value="8">Khối 8</option>
              <option value="9">Khối 9</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </select>
          </div>

          <div>
            <select
              value={filterCurriculum}
              onChange={(e) => setFilterCurriculum(e.target.value)}
              className="w-full h-9 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Tất cả Hệ Đào tạo</option>
              <option value="S">Hệ S (Chất Lượng Cao / Chuẩn)</option>
              <option value="QT">Hệ QT (Quốc Tế Song Ngữ)</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full h-9 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Tất cả Trạng thái</option>
              <option value="assigned">Đã phân công GV</option>
              <option value="unassigned">Chưa phân công</option>
            </select>
          </div>
        </div>

        {activeTeacherFilter && (
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              Đang lọc danh sách lớp của:{" "}
              <strong>
                {teachersList.find((t) => t.id === activeTeacherFilter)?.name}
              </strong>
            </span>
            <button
              onClick={() => setActiveTeacherFilter(null)}
              className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
            >
              Xóa Lọc ✕
            </button>
          </div>
        )}

        {selectedClassIds.length > 0 && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <CheckSquare className="w-4 h-4 text-amber-600" />
              <span>Đang chọn {selectedClassIds.length} lớp học:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={batchTargetTeacherId}
                onChange={(e) => setBatchTargetTeacherId(e.target.value)}
                className="h-8 px-2.5 text-xs font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="">-- Chọn Giáo Viên Gán Nhanh --</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.campus})
                  </option>
                ))}
              </select>

              <Button
                size="sm"
                variant="amber"
                onClick={handleBatchAssign}
                className="h-8 text-xs font-bold"
                disabled={!batchTargetTeacherId}
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Gán Cho {selectedClassIds.length} Lớp
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setBatchTargetTeacherId("");
                  handleBatchAssign();
                }}
                className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Hủy Phân Công
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedClassIds([])}
                className="h-8 text-xs text-slate-500"
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. BẢNG DANH SÁCH LỚP HỌC KÈM CỘT THAO TÁC (SỬA / XÓA) (TASK 1)         */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Bảng Danh Sách Lớp & Phân Công Chuyên Môn ({filteredClasses.length} / {totalClasses} Lớp)
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              + Thêm Lớp
            </Button>
            <span className="text-xs text-slate-500 font-medium hidden md:inline">
              Mẹo: Bấm nút bút chì để sửa thông tin hoặc biểu tượng thùng rác để xóa lớp.
            </span>
          </div>
        </div>

        {filteredClasses.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <School className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Không tìm thấy lớp học nào phù hợp
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Vui lòng thử điều chỉnh lại từ khóa tìm kiếm hoặc các tiêu chí bộ lọc phía trên.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterCampus("all");
                  setFilterGrade("all");
                  setFilterCurriculum("all");
                  setFilterStatus("all");
                  setActiveTeacherFilter(null);
                }}
                className="text-xs font-semibold"
              >
                Đặt Lại Toàn Bộ Lọc
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Thêm Lớp Mới Ngay
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/90 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      onClick={handleToggleSelectAll}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      title={isAllFilteredSelected ? "Bỏ chọn tất cả" : "Chọn tất cả các lớp đang hiển thị"}
                    >
                      {isAllFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-sky-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-4 min-w-[140px]">Tên Lớp</th>
                  <th className="py-3 px-4 min-w-[150px]">Cơ Sở</th>
                  <th className="py-3 px-3 w-20 text-center">Khối</th>
                  <th className="py-3 px-3 w-24 text-center">Hệ Đào Tạo</th>
                  <th className="py-3 px-3 w-24 text-center">Số Tiết/Tuần</th>
                  <th className="py-3 px-4 min-w-[230px]">Giáo Viên Bộ Môn ICT</th>
                  <th className="py-3 px-3 w-24 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClasses.map((cls, idx) => {
                  const isSelected = selectedClassIds.includes(cls.id);
                  const campusInfo = campusInfoMap[cls.campus] || {
                    name: cls.campus_name || `Cơ sở ${cls.campus}`,
                    shortName: `CS${cls.campus}`,
                    badgeClass: "bg-slate-100 text-slate-800",
                    borderClass: "border-l-slate-400",
                    dotClass: "bg-slate-400",
                  };
                  const isAssigned = !!(cls.teacher_id || cls.teacher_name);

                  return (
                    <tr
                      key={cls.id || cls.name}
                      className={`transition-colors duration-150 border-l-4 ${campusInfo.borderClass} ${
                        isSelected
                          ? "bg-sky-50/70 dark:bg-sky-950/40"
                          : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelectOne(cls.id)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* STT */}
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      {/* Tên Lớp */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cls.name}</span>
                        </div>
                      </td>

                      {/* Cơ Sở */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${campusInfo.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${campusInfo.dotClass}`}></span>
                          {campusInfo.name}
                        </span>
                      </td>

                      {/* Khối */}
                      <td className="py-3 px-3 text-center">
                        <Badge variant="secondary" className="text-[10px] font-bold px-2">
                          Khối {cls.grade}
                        </Badge>
                      </td>

                      {/* Hệ Đào Tạo */}
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={cls.curriculum === "QT" ? "amber" : "secondary"}
                          className="text-[10px] font-bold px-2"
                        >
                          {cls.curriculum === "QT" ? "Hệ Quốc Tế" : "Hệ Chuẩn (S)"}
                        </Badge>
                      </td>

                      {/* Số Tiết / Tuần */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                          {cls.periods_per_week || 2} tiết
                        </span>
                      </td>

                      {/* Giáo Viên Bộ Môn ICT */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={cls.teacher_id || ""}
                            onChange={(e) => handleAssignTeacher(cls.id, e.target.value)}
                            className={`w-full h-8 px-2.5 text-xs font-bold rounded-xl border transition-all ${
                              isAssigned
                                ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 focus:ring-1 focus:ring-sky-500 shadow-2xs"
                                : "bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold"
                            }`}
                          >
                            <option value="">-- Chưa phân công --</option>
                            {teachersList.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.campus})
                              </option>
                            ))}
                          </select>
                          {isAssigned && (
                            <span title="Đã có giáo viên">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột Thao Tác: Sửa & Xóa (Task 1) */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(cls)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 transition-all cursor-pointer shadow-2xs"
                            title={`Sửa thông tin lớp ${cls.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(cls)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
                            title={`Xóa lớp ${cls.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER BẢNG */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị <strong>{filteredClasses.length}</strong> trên tổng số <strong>{totalClasses}</strong> lớp học.
          </div>
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Thầy vui lòng bấm Lưu Trữ để cập nhật vào cơ sở dữ liệu
              </span>
            )}
            <Button
              size="sm"
              variant={hasUnsavedChanges ? "amber" : "default"}
              isLoading={isSaving}
              onClick={handleSaveAllAssignments}
              className="text-xs font-bold shadow-xs"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Lưu Trữ Phân Công Chuyên Môn
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL THÊM LỚP HỌC MỚI (TASK 1)                                       */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                  <PlusCircle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Thêm Lớp Học Mới
                  </h3>
                  <p className="text-xs text-slate-500">Năm học {selectedSchoolYear} • Hệ thống Sky-Line</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClassSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tên Lớp Học: <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={addClassForm.name}
                  onChange={(e) => setAddClassForm({ ...addClassForm, name: e.target.value })}
                  placeholder="Ví dụ: 1/1_CS1, 6/2_CS1, Roots - R1, 10S_CS4..."
                  required
                  className="rounded-xl h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Cơ Sở:
                  </label>
                  <select
                    value={addClassForm.campus}
                    onChange={(e) => setAddClassForm({ ...addClassForm, campus: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="1">Cơ sở 1 - Riverside</option>
                    <option value="2">Cơ sở 2 - Central</option>
                    <option value="3">Cơ sở 3 - Quốc tế</option>
                    <option value="4">Cơ sở 4 - Hill</option>
                    <option value="5">Cơ sở 5 - Beach</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Khối Lớp:
                  </label>
                  <select
                    value={addClassForm.grade}
                    onChange={(e) => setAddClassForm({ ...addClassForm, grade: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="NT">Nhà trẻ (NT)</option>
                    <option value="MGB">Mẫu giáo bé (MGB)</option>
                    <option value="MGN">Mẫu giáo nhỡ (MGN)</option>
                    <option value="MGL">Mẫu giáo lớn (MGL)</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={String(g)}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Hệ Đào Tạo:
                  </label>
                  <select
                    value={addClassForm.curriculum}
                    onChange={(e) => setAddClassForm({ ...addClassForm, curriculum: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="S">Hệ Chuẩn / Chất Lượng Cao (S)</option>
                    <option value="QT">Hệ Quốc Tế Song Ngữ (QT)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Số Tiết / Tuần:
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={addClassForm.periods_per_week}
                    onChange={(e) => setAddClassForm({ ...addClassForm, periods_per_week: Number(e.target.value) || 2 })}
                    className="rounded-xl h-9"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Giáo Viên Phụ Trách ICT:
                </label>
                <select
                  value={addClassForm.teacher_id}
                  onChange={(e) => setAddClassForm({ ...addClassForm, teacher_id: e.target.value })}
                  className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Chưa phân công --</option>
                  {teachersList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.campus})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Hủy Bỏ
                </Button>
                <Button type="submit" variant="default" size="sm" isLoading={isSubmittingAdd} className="font-bold shadow-md shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700">
                  <Check className="w-4 h-4 mr-1.5" />
                  + Thêm Lớp Học
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL SỬA LỚP HỌC (TASK 1)                                            */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600">
                  <Pencil className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Chỉnh Sửa Thông Tin Lớp Học
                  </h3>
                  <p className="text-xs text-slate-500">Mã lớp: {editingClass.id.slice(0, 8)}...</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditClassSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tên Lớp Học: <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={editClassForm.name}
                  onChange={(e) => setEditClassForm({ ...editClassForm, name: e.target.value })}
                  placeholder="Ví dụ: 1/1_CS1, 6/2_CS1..."
                  required
                  className="rounded-xl h-9"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Lưu ý: Đổi tên lớp tại đây sẽ tự động cập nhật tên mới sang TKB phòng Lab và TKB cá nhân giáo viên.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Cơ Sở:
                  </label>
                  <select
                    value={editClassForm.campus}
                    onChange={(e) => setEditClassForm({ ...editClassForm, campus: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="1">Cơ sở 1 - Riverside</option>
                    <option value="2">Cơ sở 2 - Central</option>
                    <option value="3">Cơ sở 3 - Quốc tế</option>
                    <option value="4">Cơ sở 4 - Hill</option>
                    <option value="5">Cơ sở 5 - Beach</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Khối Lớp:
                  </label>
                  <select
                    value={editClassForm.grade}
                    onChange={(e) => setEditClassForm({ ...editClassForm, grade: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="NT">Nhà trẻ (NT)</option>
                    <option value="MGB">Mẫu giáo bé (MGB)</option>
                    <option value="MGN">Mẫu giáo nhỡ (MGN)</option>
                    <option value="MGL">Mẫu giáo lớn (MGL)</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={String(g)}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Hệ Đào Tạo:
                  </label>
                  <select
                    value={editClassForm.curriculum}
                    onChange={(e) => setEditClassForm({ ...editClassForm, curriculum: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="S">Hệ Chuẩn / Chất Lượng Cao (S)</option>
                    <option value="QT">Hệ Quốc Tế Song Ngữ (QT)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Số Tiết / Tuần:
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={editClassForm.periods_per_week}
                    onChange={(e) => setEditClassForm({ ...editClassForm, periods_per_week: Number(e.target.value) || 2 })}
                    className="rounded-xl h-9"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Giáo Viên Phụ Trách ICT:
                </label>
                <select
                  value={editClassForm.teacher_id}
                  onChange={(e) => setEditClassForm({ ...editClassForm, teacher_id: e.target.value })}
                  className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Chưa phân công --</option>
                  {teachersList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.campus})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)}>
                  Hủy Bỏ
                </Button>
                <Button type="submit" variant="default" size="sm" isLoading={isSubmittingEdit} className="font-bold shadow-md shadow-sky-600/20">
                  <Check className="w-4 h-4 mr-1.5" />
                  Lưu Thay Đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL XÁC NHẬN XÓA LỚP (TASK 1)                                       */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Xác Nhận Xóa Lớp Học
                </h3>
                <p className="text-xs text-slate-500">Hành động này sẽ xóa dữ liệu khỏi hệ thống</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <p>
                Thầy có chắc chắn muốn xóa lớp học <strong>{classToDelete.name}</strong> thuộc <strong>{campusInfoMap[classToDelete.campus]?.name || `Cơ sở ${classToDelete.campus}`}</strong>?
              </p>
              <p className="text-[11px] text-rose-600/90 dark:text-rose-400">
                Lớp này sẽ được xóa khỏi bảng phân công chuyên môn và cơ sở dữ liệu Supabase.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
                Hủy Bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={isSubmittingDelete}
                onClick={handleConfirmDelete}
                className="font-bold shadow-md shadow-rose-600/20"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Xác Nhận Xóa Lớp
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL XEM TRƯỚC VÀ XÁC NHẬN IMPORT FILE (XLSX / CSV)                   */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Xác Nhận Import Danh Sách Lớp Vào Supabase
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tệp: <strong>{importedFileName}</strong> • Đã nhận diện{" "}
                    <strong>{importedPreview.length} lớp học</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                ✓ Hệ thống sẽ ghi đè hoặc bổ sung trực tiếp vào bảng Lớp (<code>classes</code>) trong cơ sở dữ liệu Supabase.
              </div>
              <div>
                • Cột nhận diện chống trùng: <strong>Tên lớp + Năm học ({selectedSchoolYear})</strong>.
              </div>
              <div>
                • Sau khi nhập thành công, hệ thống sẽ tự động đồng bộ tên lớp và giáo viên sang Thời khóa biểu 6 phòng Lab và TKB cá nhân.
              </div>
            </div>

            {/* BẢNG XEM TRƯỚC 5 DÒNG ĐẦU */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
              <div className="bg-slate-100 dark:bg-slate-800/80 px-3 py-2 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                Bản xem trước 5 dòng đầu tiên:
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                {importedPreview.slice(0, 6).map((item, i) => (
                  <div key={i} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        Khối {item.grade}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {campusInfoMap[item.campus || "1"]?.name || `Cơ sở ${item.campus}`}
                      </Badge>
                    </div>
                    <div className="text-right text-slate-500">
                      <span>{item.periods_per_week || 2} tiết/tuần</span>
                      {item.teacher_name && (
                        <span className="ml-2 font-semibold text-sky-600">• {item.teacher_name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => setIsImportModalOpen(false)}>
                Hủy Bỏ
              </Button>
              <Button
                variant="default"
                size="sm"
                isLoading={isUploading}
                onClick={handleConfirmImport}
                className="font-bold shadow-md shadow-sky-600/20"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Xác Nhận Import Vào Supabase
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
