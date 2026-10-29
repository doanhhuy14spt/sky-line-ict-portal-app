"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Users,
  Search,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  SunMedium,
  Sunset,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  School,
  X,
  RefreshCw,
  Loader2,
  Info,
  Check,
  PlusCircle,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Layers,
  AlertTriangle,
  GraduationCap,
  Clock,
  Laptop,
  Eye,
  Lock,
  ShieldAlert,
  Bot,
  Wand2,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface SchoolAssignedSlot {
  id?: string;
  school_year_id?: string;
  teacher_name: string;
  teacher_raw?: string;
  day_of_week: number; // 2..6 (Thứ Hai -> Thứ Sáu)
  period: number; // 1..8
  session?: "morning" | "afternoon";
  time_slot: string;
  class_name: string;
  subject: string;
  room?: string;
  notes?: string;
}

export interface SelfManagedTeacherSlot {
  id: string;
  school_year_id?: string;
  teacher_id: string;
  teacher_code: string;
  teacher_name: string;
  campus_id?: string;
  day_of_week: number;
  period: number;
  session?: "morning" | "afternoon";
  time_slot: string;
  class_name: string;
  subject: string;
  room: string;
  notes?: string;
}

export interface AiSuggestedLabSlot {
  tempId: string;
  selected: boolean;
  class_name: string;
  grade: string;
  campus: string;
  periodIndex: number;
  totalPeriodsForClass: number;
  day_of_week: number;
  period: number;
  room: string;
  subject: string;
  reason: string;
  matchType: "school_tkb_match" | "campus_fallback_lab" | "ai_optimized";
}

interface TeacherAssignedScheduleSectionProps {
  supabase: SupabaseClient;
  showToast: (text: string, type?: "success" | "warning" | "info") => void;
  selectedSchoolYear: string;
  classesList?: any[];
  teachersList?: any[];
  currentUserProfile?: {
    id: string;
    email: string;
    name: string;
    role: "leader" | "teacher" | "guest";
    campus: string;
  };
  onScheduleChanged?: () => void;
}

// Khung giờ chuẩn theo TKB nhà trường
const PERIOD_TIMES: Record<number, string> = {
  1: "08:00 - 08:45",
  2: "08:50 - 09:35",
  3: "09:50 - 10:35",
  4: "10:40 - 11:25",
  5: "13:15 - 14:00",
  6: "14:05 - 14:50",
  7: "15:05 - 15:50",
  8: "15:55 - 16:40",
};

// =========================================================================
// 6 PHÒNG LAB CHÍNH THỨC ĐÃ ĐƯỢC KHAI BÁO TRONG CƠ SỞ DỮ LIỆU
// =========================================================================
export const SIX_LAB_ROOMS = [
  { id: "riverside_primary", name: "Phòng Lab Sky-Line Riverside Tiểu Học", shortName: "Riverside Tiểu Học", campus: "Cơ sở Riverside" },
  { id: "riverside_secondary", name: "Phòng Lab Sky-Line Riverside Trung Học", shortName: "Riverside Trung Học", campus: "Cơ sở Riverside" },
  { id: "central", name: "Phòng Lab Sky-Line Central", shortName: "Central", campus: "Cơ sở Central" },
  { id: "global", name: "Phòng Lab Sky-Line Global", shortName: "Global", campus: "Cơ sở Quốc Tế" },
  { id: "hill", name: "Phòng Lab Sky-Line Hill", shortName: "Hill", campus: "Cơ sở Hill" },
  { id: "beach", name: "Phòng Lab Sky-Line Beach", shortName: "Beach", campus: "Cơ sở Beach" },
];

// Hàm rút gọn tên phòng Lab hiển thị trên ô lưới thời khóa biểu (Bỏ "Phòng Lab Sky-Line")
export const formatShortLabRoomName = (room?: string): string => {
  if (!room) return "";
  const trimmed = room.trim();

  // 1. So khớp với danh bạ 6 phòng Lab chính thức
  const matched = SIX_LAB_ROOMS.find(
    (l) =>
      l.name.toLowerCase() === trimmed.toLowerCase() ||
      trimmed.toLowerCase().includes(l.shortName.toLowerCase())
  );
  if (matched) return matched.shortName;

  // 2. Tự động bóc tách loại bỏ các tiền tố dài dòng
  return (
    trimmed
      .replace(/^Phòng\s+Lab\s+Sky-Line\s*/i, "")
      .replace(/^Phòng\s+Lab\s*/i, "")
      .replace(/^Sky-Line\s*/i, "")
      .trim() || trimmed
  );
};

// Hàm chuẩn hóa mã phòng Lab để đối chiếu chống trùng phòng Lab tại cùng 1 tiết học
export const normalizeLabRoomKey = (room?: string): string => {
  if (!room) return "";
  const r = room.toLowerCase().trim();
  if (r.includes("tiểu học") || r.includes("cs1-th") || (r.includes("riverside") && !r.includes("trung học"))) {
    return "riverside_primary";
  }
  if (r.includes("trung học") || r.includes("cs1-trh")) {
    return "riverside_secondary";
  }
  if (r.includes("central") || r.includes("cs2")) return "central";
  if (r.includes("global") || r.includes("quốc tế") || r.includes("cs3")) return "global";
  if (r.includes("hill") || r.includes("cs4")) return "hill";
  if (r.includes("beach") || r.includes("cs5")) return "beach";
  return r;
};

// =========================================================================
// BẢNG ÁNH XẠ NĂM HỌC SANG UUID CHUẨN TRONG SUPABASE
// =========================================================================
export const SCHOOL_YEAR_NAME_TO_UUID: Record<string, string> = {
  "2027-2028": "c7027028-0000-4000-8000-000020272028",
  "2026-2027": "985ffcb7-73c6-4d33-89da-1102e2fb1699",
  "2025-2026": "ae2b44fb-7d4c-41fc-b5b8-e702f301a110",
  "2024-2025": "b4024025-0000-4000-8000-000020242025",
};

export const resolveSchoolYearUUID = (input?: string): string => {
  if (!input) return "985ffcb7-73c6-4d33-89da-1102e2fb1699";
  const trimmed = input.trim();
  // Nếu đã là UUID chuẩn (8-4-4-4-12)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed;
  }
  return SCHOOL_YEAR_NAME_TO_UUID[trimmed] || "985ffcb7-73c6-4d33-89da-1102e2fb1699";
};

// =========================================================================
// BẢNG ÁNH XẠ CHÍNH THỨC: TÊN GIÁO VIÊN ➔ TÊN TRONG FILE TKB NHÀ TRƯỜNG
// (Cung cấp bởi Thầy Tổ trưởng Chuyên môn ICT)
// =========================================================================
export interface IctTeacherMapping {
  officialName: string;   // Tên đầy đủ
  fileKeyName: string;    // Tên chuẩn trong file TKB
  aliases: string[];      // Các biến thể trong file Excel
  excludes: string[];     // Các tên môn khác cần loại trừ
}

export const OFFICIAL_ICT_TEACHERS_MAPPINGS: IctTeacherMapping[] = [
  {
    officialName: "Đồng Nguyên Tuấn",
    fileKeyName: "Tuấn ICT",
    aliases: ["Tuấn ICT", "Tuan ICT"],
    excludes: ["Tuấn KTPL", "Tuấn TD", "Tuan KTPL", "Tuan TD", "Tuấn", "Tuan"],
  },
  {
    officialName: "Đỗ Anh Huy",
    fileKeyName: "Huy ICT",
    aliases: ["Huy ICT"],
    excludes: ["Huy"],
  },
  {
    officialName: "Đào Thị Mỹ Linh",
    fileKeyName: "Linh ICT",
    aliases: ["Linh ICT"],
    excludes: ["Linh Dance", "Linh TD", "Linh"],
  },
  {
    officialName: "Trần Thị Phi Yến",
    fileKeyName: "Yến ICT",
    aliases: ["Yến ICT", "Yen ICT"],
    excludes: ["Yến", "Yen"],
  },
  {
    officialName: "Lương Thị Ngọc Ánh",
    fileKeyName: "Ánh ICT",
    aliases: ["Ánh ICT", "Anh ICT"],
    excludes: ["Như Anh", "Lan Anh", "Vân Anh", "Ánh", "Anh"],
  },
  {
    officialName: "Nguyễn Thị Mỹ Tâm",
    fileKeyName: "Tâm ICT",
    aliases: ["Tâm ICT", "Tam ICT"],
    excludes: ["Tâm V", "Tam V", "Tâm", "Tam"],
  },
  {
    officialName: "Trịnh Thị Đăng",
    fileKeyName: "Đăng ICT",
    aliases: ["Đăng ICT", "Dang ICT"],
    excludes: ["Đăng", "Dang"],
  },
  {
    officialName: "Phạm Thị Thanh Bình",
    fileKeyName: "Bình ICT",
    aliases: ["Bình ICT", "Binh ICT"],
    excludes: ["Bình", "Binh"],
  },
];

// Hàm kiểm tra một tiết dạy trong TKB nhà trường có khớp với giáo viên được chọn hay không (khớp đúng tên tuyệt đối)
export function checkSlotBelongsToTeacher(
  slotTeacherName: string,
  teacher: { id?: string; name?: string; email?: string }
): boolean {
  if (!slotTeacherName) return false;
  const sName = slotTeacherName.replace(/\s+/g, " ").trim().toLowerCase();
  const tName = (teacher.name || "").replace(/\s+/g, " ").trim().toLowerCase();

  // Tìm trong bảng cấu hình ánh xạ theo tên giáo viên hoặc theo fileKeyName
  const mapping = OFFICIAL_ICT_TEACHERS_MAPPINGS.find(
    (m) =>
      tName.includes(m.officialName.toLowerCase()) ||
      m.officialName.toLowerCase().includes(tName) ||
      tName === m.fileKeyName.toLowerCase()
  );

  if (mapping) {
    // 1. Kiểm tra nếu nằm trong danh sách tên loại trừ (giáo viên môn khác)
    if (mapping.excludes.some((ex) => sName === ex.toLowerCase())) {
      return false;
    }
    // 2. Khớp ĐÚNG TÊN TUYỆT ĐỐI (fileKeyName)
    const keyLower = mapping.fileKeyName.toLowerCase();
    if (sName === keyLower) return true;
    return mapping.aliases.some((al) => sName === al.toLowerCase());
  }

  // Fallback nếu không nằm trong danh bạ 8 giáo viên trên
  return sName === tName;
}

// Map màu sắc môn học cho sống động và chuyên nghiệp
const getSubjectBadgeStyle = (subject: string) => {
  const s = (subject || "").toLowerCase().trim();
  if (s.includes("ict") || s.includes("tin học") || s.includes("robotics")) {
    return "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800";
  }
  if (s.includes("toán") || s.includes("math")) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800";
  }
  if (s.includes("văn") || s.includes("tiếng việt")) {
    return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800";
  }
  if (s.includes("esl") || s.includes("ta") || s.includes("tiếng anh") || s.includes("ielts")) {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
  }
  if (s.includes("khtn") || s.includes("science") || s.includes("lí") || s.includes("hóa") || s.includes("sinh")) {
    return "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800";
  }
  if (s.includes("sử") || s.includes("địa") || s.includes("gdcd")) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800";
  }
  if (s.includes("mĩ thuật") || s.includes("âm nhạc") || s.includes("thể dục") || s.includes("clb")) {
    return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800";
  }
  return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700";
};

export function TeacherAssignedScheduleSection({
  supabase,
  showToast,
  selectedSchoolYear,
  classesList = [],
  teachersList = [],
  currentUserProfile,
  onScheduleChanged,
}: TeacherAssignedScheduleSectionProps) {
  const isGuest = currentUserProfile?.role === "guest";
  // Chuyển đổi giữa 2 phần: 2.1 (TKB Nhà Trường) & 2.2 (Lịch Tự Nhập Của Giáo Viên)
  const [activeSubTab, setActiveSubTab] = useState<"2.1" | "2.2">("2.1");

  // =========================================================================
  // STATE CHO PHẦN 2.1: XEM TKB CÁ NHÂN THEO TKB NHÀ TRƯỜNG
  // =========================================================================
  const [assignedSlots, setAssignedSlots] = useState<SchoolAssignedSlot[]>([]);
  const [isLoadingSchool, setIsLoadingSchool] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher21, setSelectedTeacher21] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // =========================================================================
  // STATE CHO PHẦN 2.2: LỊCH GIẢNG DẠY CỦA TỪNG GIÁO VIÊN (TỰ NHẬP)
  // =========================================================================
  const [teacherTimetableSlots, setTeacherTimetableSlots] = useState<SelfManagedTeacherSlot[]>([]);
  const [isLoadingSelf, setIsLoadingSelf] = useState(false);
  const [isSyncingFromSchool, setIsSyncingFromSchool] = useState(false);

  // Giáo viên đang thao tác ở Phần 2.2 (mặc định lấy từ currentUserProfile hoặc giáo viên đầu tiên)
  const [selectedTeacherId22, setSelectedTeacherId22] = useState<string>(
    currentUserProfile?.id || "a0000001-0000-0000-0000-000000000001"
  );

  // Modal Xếp/Sửa Tiết Dạy ở Phần 2.2
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [slotModalMode, setSlotModalMode] = useState<"add" | "edit">("add");
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [isSubmittingSlot, setIsSubmittingSlot] = useState(false);
  const [slotConflictError, setSlotConflictError] = useState<string | null>(null);
  const [slotFormData, setSlotFormData] = useState({
    day_of_week: 2,
    period: 1,
    class_name: "",
    subject: "Tin học",
    room: SIX_LAB_ROOMS[0].name,
    notes: "",
  });

  // Modal xác nhận xóa tiết
  const [deleteConfirmSlot, setDeleteConfirmSlot] = useState<SelfManagedTeacherSlot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal xác nhận xóa sạch lịch tuần
  const [isClearWeekModalOpen, setIsClearWeekModalOpen] = useState(false);
  const [isClearingWeek, setIsClearingWeek] = useState(false);

  // Modal AI Gợi Ý Sắp Xếp Lịch Phòng Lab Chống Trùng (Đầu vào từ Bảng Phân Công Chuyên Môn Phần 3)
  const [isAiSchedulerModalOpen, setIsAiSchedulerModalOpen] = useState(false);
  const [aiScheduleMode, setAiScheduleMode] = useState<"fill_missing" | "rebuild_all">("fill_missing");
  const [aiSuggestedSlots, setAiSuggestedSlots] = useState<AiSuggestedLabSlot[]>([]);
  const [isApplyingAiSchedule, setIsApplyingAiSchedule] = useState(false);

  // =========================================================================
  // TẢI DỮ LIỆU TỪ SUPABASE
  // =========================================================================

  // Tải dữ liệu TKB nhà trường (Phần 2.1) theo Năm học đang chọn
  // Lưu ý: Toàn bộ TKB nhà trường có ~1.764 tiết (mỗi ngày Thứ 2 -> Thứ 6 có ~350 tiết).
  // Mặc định 1 truy vấn đơn lẻ của Supabase chỉ trả về tối đa 1.000 dòng đầu tiên (khiến Thứ 5 và Thứ 6 bị cắt mất).
  // Do đó, ta tải song song theo từng thứ trong tuần (2, 3, 4, 5, 6) kèm phân trang để luôn lấy đủ 100% tiết học.
  const loadSchoolAssignedData = async () => {
    setIsLoadingSchool(true);
    try {
      const days = [2, 3, 4, 5, 6];
      const dayResults = await Promise.all(
        days.map(async (dayNum) => {
          const allForDay: SchoolAssignedSlot[] = [];
          const pageSize = 1000;
          let from = 0;

          while (true) {
            const { data, error } = await supabase
              .from("school_assigned_timetables")
              .select("*")
              .eq("school_year", selectedSchoolYear)
              .eq("day_of_week", dayNum)
              .order("period", { ascending: true })
              .order("id", { ascending: true })
              .range(from, from + pageSize - 1);

            if (error) {
              console.error(`Lỗi tải TKB nhà trường Thứ ${dayNum}:`, error);
              break;
            }

            const batch = (data as SchoolAssignedSlot[]) || [];
            allForDay.push(...batch);

            if (batch.length < pageSize) {
              break;
            }
            from += pageSize;
          }

          return allForDay;
        })
      );

      const mergedSlots = dayResults.flat();
      setAssignedSlots(mergedSlots);
    } catch (err) {
      console.error("Lỗi nạp dữ liệu TKB:", err);
    } finally {
      setIsLoadingSchool(false);
    }
  };

  // Tải dữ liệu Lịch giảng dạy tự nhập của giáo viên (Phần 2.2) theo Năm học đang chọn
  const loadTeacherSelfTimetables = async () => {
    setIsLoadingSelf(true);
    try {
      const { data, error } = await supabase
        .from("teacher_timetables")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("day_of_week", { ascending: true })
        .order("period", { ascending: true });

      if (error) {
        console.error("Lỗi tải lịch cá nhân giáo viên:", error);
      } else if (data) {
        setTeacherTimetableSlots(data as SelfManagedTeacherSlot[]);
      }
    } catch (err) {
      console.error("Lỗi nạp lịch giáo viên:", err);
    } finally {
      setIsLoadingSelf(false);
    }
  };

  useEffect(() => {
    loadSchoolAssignedData();
    loadTeacherSelfTimetables();
  }, [selectedSchoolYear]);

  // Cập nhật selectedTeacherId22 khi currentUserProfile thay đổi
  useEffect(() => {
    if (currentUserProfile?.id) {
      setSelectedTeacherId22(currentUserProfile.id);
    }
  }, [currentUserProfile?.id]);

  // =========================================================================
  // LOGIC & DATA CHO PHẦN 2.1: TKB NHÀ TRƯỜNG
  // =========================================================================
  const uniqueTeachers21 = useMemo(() => {
    const set = new Set<string>();
    assignedSlots.forEach((s) => {
      if (s.teacher_name && s.teacher_name.trim()) {
        set.add(s.teacher_name.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [assignedSlots]);

  const filteredTeacherSuggestions21 = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return uniqueTeachers21.filter((t) => t.toLowerCase().includes(term)).slice(0, 12);
  }, [uniqueTeachers21, searchTerm]);

  // Lấy các tiết của giáo viên đang chọn ở Phần 2.1 (áp dụng đối chiếu đúng tên tuyệt đối)
  const currentTeacherSlots21 = useMemo(() => {
    if (!selectedTeacher21) return [];
    const term = selectedTeacher21.replace(/\s+/g, " ").toLowerCase().trim();

    // Tìm xem selectedTeacher21 có thuộc 1 trong 8 giáo viên ICT không
    const mapping = OFFICIAL_ICT_TEACHERS_MAPPINGS.find(
      (m) =>
        m.fileKeyName.toLowerCase() === term ||
        m.officialName.toLowerCase() === term ||
        m.officialName.toLowerCase().includes(term) ||
        term.includes(m.officialName.toLowerCase()) ||
        m.aliases.some((a) => a.toLowerCase() === term)
    );

    if (mapping) {
      return assignedSlots.filter((s) =>
        checkSlotBelongsToTeacher(s.teacher_name, { name: mapping.officialName })
      );
    }

    // Nếu là giáo viên môn khác tra cứu từ thanh tìm kiếm
    return assignedSlots.filter(
      (s) => (s.teacher_name || "").replace(/\s+/g, " ").toLowerCase().trim() === term
    );
  }, [assignedSlots, selectedTeacher21]);

  const slotMap21 = useMemo(() => {
    const map = new Map<string, SchoolAssignedSlot>();
    currentTeacherSlots21.forEach((s) => {
      const key = `${s.day_of_week}_${s.period}`;
      map.set(key, s);
    });
    return map;
  }, [currentTeacherSlots21]);

  const teacherStats21 = useMemo(() => {
    if (!selectedTeacher21 || currentTeacherSlots21.length === 0) {
      return { total: 0, morning: 0, afternoon: 0, classes: [] };
    }
    const total = currentTeacherSlots21.length;
    const morning = currentTeacherSlots21.filter((s) => s.period <= 4).length;
    const afternoon = currentTeacherSlots21.filter((s) => s.period > 4).length;
    const classes = Array.from(new Set(currentTeacherSlots21.map((s) => s.class_name))).sort();
    return { total, morning, afternoon, classes };
  }, [currentTeacherSlots21, selectedTeacher21]);

  // Import File TKB_SKYLINE.xlsx từ Phần 2.1
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    showToast(`Đang phân tích tệp "${file.name}"...`, "info");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];

      if (!sheet) {
        throw new Error("Không tìm thấy bảng tính hợp lệ trong file Excel!");
      }

      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (rows.length < 8) {
        throw new Error("Cấu trúc file không đúng định dạng TKB nhà trường (quá ít dòng).");
      }

      const row5 = rows[4] || [];
      const classesListFromExcel: { col: number; name: string }[] = [];

      for (let c = 4; c < row5.length; c += 3) {
        const val = row5[c];
        if (val && String(val).trim()) {
          classesListFromExcel.push({ col: c, name: String(val).trim() });
        }
      }

      if (classesListFromExcel.length === 0) {
        throw new Error("Không nhận diện được cột danh sách lớp học ở dòng 5 của file Excel.");
      }

      const dayMapping: Record<string, number> = {
        hai: 2,
        "thứ hai": 2,
        "thu hai": 2,
        ba: 3,
        "thứ ba": 3,
        "thu ba": 3,
        tư: 4,
        tu: 4,
        "thứ tư": 4,
        "thu tu": 4,
        năm: 5,
        nam: 5,
        "thứ năm": 5,
        "thu nam": 5,
        sáu: 6,
        sau: 6,
        "thứ sáu": 6,
        "thu sau": 6,
      };

      const parsedSlots: SchoolAssignedSlot[] = [];
      let currentDayNum = 2;

      for (let r = 7; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const dayCell = String(row[1] || "").toLowerCase().trim();
        const timeCell = String(row[2] || "").trim();
        const periodCell = parseInt(String(row[3] || "").trim(), 10);

        if (dayCell) {
          for (const [key, num] of Object.entries(dayMapping)) {
            if (dayCell.includes(key)) {
              currentDayNum = num;
              break;
            }
          }
        }

        if (currentDayNum < 2 || currentDayNum > 6) continue;
        if (isNaN(periodCell) || periodCell < 1 || periodCell > 8) continue;

        const timeSlot = timeCell || PERIOD_TIMES[periodCell] || "";
        const session = periodCell <= 4 ? "morning" : "afternoon";

        classesListFromExcel.forEach((cls) => {
          const subject = String(row[cls.col] || "").trim();
          const gv = String(row[cls.col + 1] || "").trim();
          const room = String(row[cls.col + 2] || "").trim();

          if (gv) {
            const teacherParts = gv
              .replace(/&/g, "/")
              .replace(/,/g, "/")
              .split("/")
              .map((t) => t.trim())
              .filter((t) => Boolean(t));

            teacherParts.forEach((tName) => {
              // Tự động chuẩn hóa tên giáo viên nếu dạy môn ICT và viết tên ngắn
              let normalizedTeacherName = tName.trim();
              const subLower = (subject || "").toLowerCase();
              const isIctSubject =
                subLower.includes("ict") ||
                subLower.includes("tin học") ||
                subLower.includes("robotics") ||
                subLower.includes("tin");

              if (isIctSubject) {
                const cleanT = tName.replace(/\s+/g, " ").trim().toLowerCase();
                if (cleanT === "huy" || cleanT === "huy ict") {
                  normalizedTeacherName = "Huy ICT";
                } else if (cleanT === "đăng" || cleanT === "dang" || cleanT === "đăng ict") {
                  normalizedTeacherName = "Đăng ICT";
                } else if (cleanT === "tuấn" || cleanT === "tuan" || cleanT === "tuấn ict") {
                  normalizedTeacherName = "Tuấn ICT";
                } else if (cleanT === "linh" || cleanT === "linh ict") {
                  normalizedTeacherName = "Linh ICT";
                } else if (cleanT === "tâm" || cleanT === "tam" || cleanT === "tâm ict") {
                  normalizedTeacherName = "Tâm ICT";
                } else if (cleanT === "bình" || cleanT === "binh" || cleanT === "bình ict") {
                  normalizedTeacherName = "Bình ICT";
                } else if (cleanT === "yến" || cleanT === "yen" || cleanT === "yến ict") {
                  normalizedTeacherName = "Yến ICT";
                } else if (cleanT === "ánh" || cleanT === "anh" || cleanT === "ánh ict") {
                  normalizedTeacherName = "Ánh ICT";
                }
              }

              parsedSlots.push({
                teacher_name: normalizedTeacherName,
                teacher_raw: gv,
                day_of_week: currentDayNum,
                period: periodCell,
                session,
                time_slot: timeSlot,
                class_name: cls.name,
                subject,
                room,
                notes: "",
              });
            });
          }
        });
      }

      if (parsedSlots.length === 0) {
        throw new Error("Không trích xuất được tiết học nào từ file Excel.");
      }

      showToast(`Đã nhận diện ${parsedSlots.length} tiết dạy. Đang lưu vào cơ sở dữ liệu năm học ${selectedSchoolYear}...`, "info");

      await supabase
        .from("school_assigned_timetables")
        .delete()
        .eq("school_year", selectedSchoolYear);

      const slotsWithSchoolYear = parsedSlots.map((s) => ({
        ...s,
        school_year: selectedSchoolYear,
        school_year_id: resolveSchoolYearUUID(selectedSchoolYear),
      }));

      const chunkSize = 200;
      for (let i = 0; i < slotsWithSchoolYear.length; i += chunkSize) {
        const chunk = slotsWithSchoolYear.slice(i, i + chunkSize);
        await supabase.from("school_assigned_timetables").insert(chunk);
      }

      setAssignedSlots(slotsWithSchoolYear);

      showToast(`Thành công! Đã nạp ${parsedSlots.length} tiết dạy từ file ${file.name}.`, "success");

      // Chọn mặc định Thầy Tuấn ICT
      setSelectedTeacher21("Tuấn ICT");
      setSearchTerm("Tuấn ICT");
    } catch (err: any) {
      console.error("Lỗi import file TKB:", err);
      showToast(err.message || "Không thể đọc file TKB_SKYLINE.xlsx. Vui lòng kiểm tra lại cấu trúc file!", "warning");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // =========================================================================
  // LOGIC & DATA CHO PHẦN 2.2: LỊCH GIẢNG DẠY CỦA TỪNG GIÁO VIÊN (TỰ NHẬP)
  // =========================================================================

  // Thông tin giáo viên đang chọn ở Phần 2.2
  const currentSelectedTeacher22 = useMemo(() => {
    return (
      teachersList.find((t) => t.id === selectedTeacherId22) ||
      teachersList[0] || {
        id: "a0000001-0000-0000-0000-000000000001",
        name: "Thầy Đỗ Anh Huy",
        code: "HUY-ICT",
        specialty: "Quản trị hệ thống & Huấn luyện HSG",
        campus: "Sky-Line Riverside",
      }
    );
  }, [teachersList, selectedTeacherId22]);

  // Cấu hình đối chiếu TKB trường tương ứng với giáo viên đang chọn ở Phần 2.2
  const teacherMappingConfig22 = useMemo(() => {
    const tName = (currentSelectedTeacher22.name || "").trim();
    return OFFICIAL_ICT_TEACHERS_MAPPINGS.find(
      (m) =>
        tName.toLowerCase().includes(m.officialName.toLowerCase()) ||
        m.officialName.toLowerCase().includes(tName.toLowerCase())
    );
  }, [currentSelectedTeacher22]);

  // =========================================================================
  // PHÂN QUYỀN TRUY CẬP & ĐIỀU CHỈNH LỊCH GIẢNG DẠY (PHẦN 2.2)
  // Quy chuẩn:
  // - Tổ trưởng chuyên môn (role === 'leader'): Toàn quyền xếp và điều chỉnh
  // - Giáo viên (role === 'teacher'): Chỉ được tự nhập/sửa lịch của CHÍNH MÌNH.
  // - Lịch của giáo viên khác trong tổ: Giáo viên chỉ có quyền XEM (Read-only)
  // =========================================================================
  const isLeader = currentUserProfile?.role === "leader";

  const isOwner = useMemo(() => {
    if (!currentUserProfile) return false;

    // 1. So khớp ID tài khoản
    if (currentUserProfile.id && currentSelectedTeacher22.id && currentUserProfile.id === currentSelectedTeacher22.id) {
      return true;
    }

    // 2. So khớp qua Email
    if (currentUserProfile.email && (currentSelectedTeacher22 as any).email) {
      const curEmail = currentUserProfile.email.toLowerCase().trim();
      const targetEmail = ((currentSelectedTeacher22 as any).email || "").toLowerCase().trim();
      if (curEmail && targetEmail && curEmail === targetEmail) return true;
    }

    // 3. So khớp qua Họ và Tên (loại bỏ tiền tố Thầy/Cô và khoảng trắng thừa)
    const clean = (name: string) =>
      (name || "")
        .replace(/^(Thầy|Cô)\s+/i, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    const curName = clean(currentUserProfile.name);
    const targetName = clean(currentSelectedTeacher22.name);
    if (curName && targetName && (curName.includes(targetName) || targetName.includes(curName))) {
      return true;
    }

    return false;
  }, [currentUserProfile, currentSelectedTeacher22]);

  // canEdit: Chỉ Tổ trưởng hoặc chính giáo viên đó mới được phép xếp lớp & chỉnh sửa
  const canEdit = isLeader || isOwner;

  // Các lớp mà giáo viên này ĐƯỢC TỔ TRƯỞNG PHÂN CÔNG Ở PHẦN 3 (classesList)
  const assignedClassesFromSection3 = useMemo(() => {
    if (!classesList || classesList.length === 0) return [];
    const tName = (currentSelectedTeacher22.name || "").toLowerCase().trim();
    const tId = currentSelectedTeacher22.id;

    return classesList.filter((cls) => {
      const clsTeacherName = (cls.teacher_name || "").toLowerCase().trim();
      return (
        (cls.teacher_id && cls.teacher_id === tId) ||
        (clsTeacherName && (clsTeacherName === tName || tName.includes(clsTeacherName) || clsTeacherName.includes(tName)))
      );
    });
  }, [classesList, currentSelectedTeacher22]);

  // Tổng số tiết được phân công ở Phần 3
  const totalAssignedPeriodsFromSection3 = useMemo(() => {
    return assignedClassesFromSection3.reduce((sum, c) => sum + (Number(c.periods_per_week) || 2), 0);
  }, [assignedClassesFromSection3]);

  // Lọc các tiết giảng dạy cá nhân của giáo viên đang chọn ở Phần 2.2
  const activeTeacherSlots22 = useMemo(() => {
    const tId = currentSelectedTeacher22.id;
    const tName = (currentSelectedTeacher22.name || "").toLowerCase().trim();

    return teacherTimetableSlots.filter((s) => {
      const slotTeacherName = (s.teacher_name || "").toLowerCase().trim();
      return s.teacher_id === tId || slotTeacherName === tName || (slotTeacherName && tName.includes(slotTeacherName));
    });
  }, [teacherTimetableSlots, currentSelectedTeacher22]);

  // Map tiết dạy Phần 2.2 theo (day_period)
  const slotMap22 = useMemo(() => {
    const map = new Map<string, SelfManagedTeacherSlot>();
    activeTeacherSlots22.forEach((s) => {
      const key = `${s.day_of_week}_${s.period}`;
      map.set(key, s);
    });
    return map;
  }, [activeTeacherSlots22]);

  // Tìm kiếm gợi ý từ TKB nhà trường (Phần 2.1) đối chiếu với (day, period) đang xếp
  const getSchoolAssignedHint = (day: number, period: number) => {
    return assignedSlots.find(
      (s) =>
        s.day_of_week === day &&
        s.period === period &&
        checkSlotBelongsToTeacher(s.teacher_name, currentSelectedTeacher22)
    );
  };

  // Mở modal thêm tiết vào ô trống
  const handleOpenAddSlot = (day: number, period: number) => {
    if (!canEdit) {
      showToast("Thầy/Cô chỉ có quyền xem lịch của đồng nghiệp, không được xếp tiết dạy!", "warning");
      return;
    }

    const hint = getSchoolAssignedHint(day, period);
    const matchedClass = assignedClassesFromSection3.find(
      (c) => c.name.toLowerCase() === (hint?.class_name || "").toLowerCase()
    );
    const defaultClass = matchedClass?.name || assignedClassesFromSection3[0]?.name || "";

    setSlotFormData({
      day_of_week: day,
      period: period,
      class_name: defaultClass,
      subject: "Tin học",
      room: SIX_LAB_ROOMS[0].name,
      notes: "",
    });
    setSlotConflictError(null);
    setSlotModalMode("add");
    setEditingSlotId(null);
    setIsSlotModalOpen(true);
  };

  // Mở modal sửa tiết đã có
  const handleOpenEditSlot = (slot: SelfManagedTeacherSlot) => {
    if (!canEdit) {
      showToast("Thầy/Cô chỉ có quyền xem lịch của đồng nghiệp, không được chỉnh sửa tiết dạy!", "warning");
      return;
    }

    const matchedRoom = SIX_LAB_ROOMS.find(
      (r) => r.name === slot.room || slot.room?.includes(r.name) || r.name.includes(slot.room || "")
    );

    setSlotFormData({
      day_of_week: slot.day_of_week,
      period: slot.period,
      class_name: slot.class_name,
      subject: slot.subject || "Tin học",
      room: matchedRoom ? matchedRoom.name : SIX_LAB_ROOMS[0].name,
      notes: slot.notes || "",
    });
    setSlotConflictError(null);
    setSlotModalMode("edit");
    setEditingSlotId(slot.id);
    setIsSlotModalOpen(true);
  };

  // Lưu tiết dạy vào Supabase teacher_timetables (Chống trùng phòng Lab tuyệt đối: mỗi tiết của mỗi phòng Lab chỉ duy nhất 1 lớp học)
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlotConflictError(null);
    if (!canEdit) {
      showToast("Thầy/Cô không có quyền chỉnh sửa thời khóa biểu của giáo viên này!", "warning");
      return;
    }
    if (!slotFormData.class_name.trim()) {
      showToast("Vui lòng chọn lớp học được phân công!", "warning");
      return;
    }
    if (!slotFormData.room.trim()) {
      showToast("Vui lòng chọn phòng Lab!", "warning");
      return;
    }

    setIsSubmittingSlot(true);
    try {
      // KIỂM TRA CHỐNG TRÙNG PHÒNG LAB TẠI CÙNG TIẾT HỌC TRÊN TOÀN HỆ THỐNG
      const { data: latestPeriodSlots } = await supabase
        .from("teacher_timetables")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .eq("day_of_week", slotFormData.day_of_week)
        .eq("period", slotFormData.period);

      const existingOwnSlot = slotMap22.get(`${slotFormData.day_of_week}_${slotFormData.period}`);
      const ignoreSlotId = slotModalMode === "edit" ? editingSlotId : existingOwnSlot?.id;
      const targetLabKey = normalizeLabRoomKey(slotFormData.room);

      const slotsToCheck =
        latestPeriodSlots && latestPeriodSlots.length > 0
          ? latestPeriodSlots
          : teacherTimetableSlots.filter(
              (s) => s.day_of_week === slotFormData.day_of_week && s.period === slotFormData.period
            );

      const conflictingLabSlot = slotsToCheck.find(
        (s: any) => s.id !== ignoreSlotId && normalizeLabRoomKey(s.room) === targetLabKey
      );

      if (conflictingLabSlot) {
        const conflictMsg = "Tiết dạy này tại phòng Lab đã có lớp học, vui lòng chọn tiết khác";
        setSlotConflictError(conflictMsg);
        showToast(conflictMsg, "warning");
        setIsSubmittingSlot(false);
        return;
      }

      const timeSlot = PERIOD_TIMES[slotFormData.period] || "";
      const session = slotFormData.period <= 4 ? "morning" : "afternoon";

      if (slotModalMode === "add") {
        const existing = slotMap22.get(`${slotFormData.day_of_week}_${slotFormData.period}`);
        if (existing) {
          const { error } = await supabase
            .from("teacher_timetables")
            .update({
              class_name: slotFormData.class_name.trim(),
              subject: (slotFormData.subject || "Tin học").trim(),
              room: (slotFormData.room || SIX_LAB_ROOMS[0].name).trim(),
              notes: (slotFormData.notes || "").trim(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (error) throw error;
        } else {
          const newSlotRecord = {
            school_year: selectedSchoolYear,
            school_year_id: resolveSchoolYearUUID(selectedSchoolYear),
            teacher_id: currentSelectedTeacher22.id,
            teacher_code: currentSelectedTeacher22.code || "GV-ICT",
            teacher_name: currentSelectedTeacher22.name,
            day_of_week: slotFormData.day_of_week,
            period: slotFormData.period,
            session,
            time_slot: timeSlot,
            class_name: slotFormData.class_name.trim(),
            subject: (slotFormData.subject || "Tin học").trim(),
            room: (slotFormData.room || SIX_LAB_ROOMS[0].name).trim(),
            notes: (slotFormData.notes || "").trim(),
          };

          const { error } = await supabase.from("teacher_timetables").insert(newSlotRecord);
          if (error) throw error;
        }

        showToast(
          `Đã xếp tiết ${slotFormData.period} Thứ ${slotFormData.day_of_week} cho lớp ${slotFormData.class_name}!`,
          "success"
        );
      } else {
        if (!editingSlotId) return;
        const { error } = await supabase
          .from("teacher_timetables")
          .update({
            day_of_week: slotFormData.day_of_week,
            period: slotFormData.period,
            session,
            time_slot: timeSlot,
            class_name: slotFormData.class_name.trim(),
            subject: (slotFormData.subject || "Tin học").trim(),
            room: (slotFormData.room || SIX_LAB_ROOMS[0].name).trim(),
            notes: (slotFormData.notes || "").trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingSlotId);

        if (error) throw error;
        showToast("Đã cập nhật thông tin tiết dạy thành công!", "success");
      }

      setIsSlotModalOpen(false);
      await loadTeacherSelfTimetables();
      onScheduleChanged?.();
      } catch (err: any) {
      console.error("Lỗi lưu tiết dạy:", err);
      const errMsg = String(err?.message || "");
      if (errMsg.toLowerCase().includes("tiết dạy này tại phòng lab đã có lớp học")) {
        const conflictMsg = "Tiết dạy này tại phòng Lab đã có lớp học, vui lòng chọn tiết khác";
        setSlotConflictError(conflictMsg);
        showToast(conflictMsg, "warning");
      } else {
        showToast(err.message || "Lỗi khi lưu vào cơ sở dữ liệu!", "warning");
      }
    } finally {
      setIsSubmittingSlot(false);
    }
  };

  // Xóa một tiết dạy
  const handleDeleteSlot = async () => {
    if (!deleteConfirmSlot) return;
    if (!canEdit) {
      showToast("Thầy/Cô không có quyền xóa tiết dạy của giáo viên khác!", "warning");
      return;
    }
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("teacher_timetables").delete().eq("id", deleteConfirmSlot.id);
      if (error) throw error;

      showToast(
        `Đã gỡ tiết ${deleteConfirmSlot.period} Thứ ${deleteConfirmSlot.day_of_week} (Lớp ${deleteConfirmSlot.class_name}) khỏi lịch!`,
        "success"
      );
      setDeleteConfirmSlot(null);
      await loadTeacherSelfTimetables();
      onScheduleChanged?.();
    } catch (err: any) {
      console.error("Lỗi xóa tiết:", err);
      showToast(err.message || "Lỗi khi xóa tiết dạy!", "warning");
    } finally {
      setIsDeleting(false);
    }
  };

  // =========================================================================
  // TÍNH NĂNG CỐT LÕI: TỰ ĐỘNG ĐIỀN TỪ TKB TRƯỜNG ĐỐI CHIẾU THEO TÊN QUY CHUẨN
  // =========================================================================
  const handleAutoSyncFromSchoolSchedule = async () => {
    if (!canEdit) {
      showToast("Thầy/Cô chỉ có quyền tự động điền TKB cho lịch giảng dạy của chính mình!", "warning");
      return;
    }
    setIsSyncingFromSchool(true);
    try {
      // 1. Quét toàn bộ tiết trong assignedSlots khớp với giáo viên đang chọn
      const matchingSlots = assignedSlots.filter((s) =>
        checkSlotBelongsToTeacher(s.teacher_name, currentSelectedTeacher22)
      );

      const fileKey = teacherMappingConfig22?.fileKeyName || currentSelectedTeacher22.name;

      if (matchingSlots.length === 0) {
        showToast(
          `Không tìm thấy tiết dạy nào của "${currentSelectedTeacher22.name}" (Tên trong file: "${fileKey}") trong TKB nhà trường! Vui lòng kiểm tra lại tệp TKB đã import ở Phần 2.1.`,
          "warning"
        );
        return;
      }

      showToast(
        `Đang đối chiếu & điền ${matchingSlots.length} tiết từ TKB nhà trường (Tên file: "${fileKey}")...`,
        "info"
      );

      // 2. Xóa các tiết hiện có của giáo viên này trong năm học đang chọn
      await supabase
        .from("teacher_timetables")
        .delete()
        .eq("teacher_id", currentSelectedTeacher22.id)
        .eq("school_year", selectedSchoolYear);

      // 3. Chuẩn hóa tên lớp đối chiếu với Danh sách phân công ở Phần 3 (classesList)
      const recordsToInsert = matchingSlots.map((s) => {
        let finalClassName = s.class_name.trim();

        // Thử tìm xem lớp trong TKB có tương ứng với lớp nào trong Phần 3 không
        // Ví dụ: s.class_name là "7/1", Phần 3 có "7/1_CS1" hoặc "7/1"
        const matchedClassFromP3 = assignedClassesFromSection3.find((cls) => {
          const cName = cls.name.trim();
          return (
            cName.toLowerCase() === finalClassName.toLowerCase() ||
            cName.toLowerCase().startsWith(finalClassName.toLowerCase() + "_") ||
            cName.toLowerCase().startsWith(finalClassName.toLowerCase() + " ")
          );
        });

        if (matchedClassFromP3) {
          finalClassName = matchedClassFromP3.name;
        }

        return {
          school_year: selectedSchoolYear,
          school_year_id: resolveSchoolYearUUID(selectedSchoolYear),
          teacher_id: currentSelectedTeacher22.id,
          teacher_code: currentSelectedTeacher22.code || "GV-ICT",
          teacher_name: currentSelectedTeacher22.name,
          day_of_week: s.day_of_week,
          period: s.period,
          session: s.period <= 4 ? "morning" : "afternoon",
          time_slot: s.time_slot || PERIOD_TIMES[s.period] || "",
          class_name: finalClassName,
          subject: s.subject || "Tin học",
          room: s.room ? (s.room.toLowerCase().includes("lab") ? s.room : `Phòng Lab ${s.room}`) : SIX_LAB_ROOMS[0].name,
          notes: `Tự động điền từ TKB Trường (${fileKey})`,
        };
      });

      const { error } = await supabase.from("teacher_timetables").insert(recordsToInsert);
      if (error) throw error;

      showToast(
        `Thành công! Đã tự động điền ${recordsToInsert.length} tiết giảng dạy cho ${currentSelectedTeacher22.name} (Tên TKB: ${fileKey})!`,
        "success"
      );
      await loadTeacherSelfTimetables();
      onScheduleChanged?.();
    } catch (err: any) {
      console.error("Lỗi tự động điền TKB:", err);
      showToast(err.message || "Không thể tự động điền từ TKB nhà trường!", "warning");
    } finally {
      setIsSyncingFromSchool(false);
    }
  };

  // Xóa toàn bộ lịch tuần của giáo viên
  const handleClearWeekSchedule = async () => {
    if (!canEdit) {
      showToast("Thầy/Cô không có quyền xóa lịch tuần của giáo viên khác!", "warning");
      return;
    }
    setIsClearingWeek(true);
    try {
      const { error } = await supabase
        .from("teacher_timetables")
        .delete()
        .eq("teacher_id", currentSelectedTeacher22.id)
        .eq("school_year", selectedSchoolYear);

      if (error) throw error;

      showToast(`Đã làm sạch toàn bộ lịch tuần của ${currentSelectedTeacher22.name}!`, "success");
      setIsClearWeekModalOpen(false);
      await loadTeacherSelfTimetables();
      onScheduleChanged?.();
    } catch (err: any) {
      console.error("Lỗi xóa toàn bộ lịch:", err);
      showToast(err.message || "Không thể xóa lịch!", "warning");
    } finally {
      setIsClearingWeek(false);
    }
  };

  // =========================================================================
  // HẠNG MỤC AI CỐT LÕI (SKY-LINE AI SPARK - BẢNG B):
  // AI GỢI Ý SẮP XẾP LỊCH PHÒNG LAB CHỐNG TRÙNG TỪ BẢNG PHÂN CÔNG PHẦN 3
  // =========================================================================

  // So khớp tên lớp giữa TKB / Lịch cá nhân và Bảng Phân Công Chuyên Môn (Phần 3)
  const isMatchingClassName = (nameA?: string, nameB?: string): boolean => {
    if (!nameA || !nameB) return false;
    const a = nameA.trim().toLowerCase();
    const b = nameB.trim().toLowerCase();
    if (a === b) return true;
    const stripSuffix = (s: string) => s.replace(/(_cs\d+|\s*-?\s*cs\d+)$/i, "").trim();
    return stripSuffix(a) === stripSuffix(b);
  };

  // Nhận diện thông minh Phòng Lab chính & Phòng Lab dự phòng theo Cơ sở và Khối lớp
  const resolveSmartLabRoomsForClass = (cls: any): {
    primaryRoom: string;
    fallbackRoom?: string;
    campusLabel: string;
    campusKey: string;
  } => {
    const rawCampus = String(cls?.campus || "").toLowerCase().trim();
    const rawCampusName = String(cls?.campus_name || "").toLowerCase().trim();
    const rawClassName = String(cls?.name || "").toLowerCase().trim();
    const teacherLab = String((currentSelectedTeacher22 as any)?.lab || "").toLowerCase();

    // Cơ sở 2 - Central
    if (
      rawCampus === "2" ||
      rawCampus === "cs2" ||
      rawCampusName.includes("central") ||
      rawClassName.includes("_cs2") ||
      rawClassName.includes("- c1")
    ) {
      return {
        primaryRoom: "Phòng Lab Sky-Line Central",
        campusLabel: "CS2 - Central",
        campusKey: "cs2",
      };
    }

    // Cơ sở 3 - Global
    if (
      rawCampus === "3" ||
      rawCampus === "cs3" ||
      rawCampusName.includes("global") ||
      rawCampusName.includes("quốc tế") ||
      rawClassName.includes("_cs3")
    ) {
      return {
        primaryRoom: "Phòng Lab Sky-Line Global",
        campusLabel: "CS3 - Global",
        campusKey: "cs3",
      };
    }

    // Cơ sở 4 - Hill
    if (
      rawCampus === "4" ||
      rawCampus === "cs4" ||
      rawCampusName.includes("hill") ||
      rawClassName.includes("_cs4") ||
      rawClassName.includes("- h1")
    ) {
      return {
        primaryRoom: "Phòng Lab Sky-Line Hill",
        campusLabel: "CS4 - Hill",
        campusKey: "cs4",
      };
    }

    // Cơ sở 5 - Beach
    if (
      rawCampus === "5" ||
      rawCampus === "cs5" ||
      rawCampusName.includes("beach") ||
      rawClassName.includes("_cs5")
    ) {
      return {
        primaryRoom: "Phòng Lab Sky-Line Beach",
        campusLabel: "CS5 - Beach",
        campusKey: "cs5",
      };
    }

    // Mặc định Cơ sở 1 - Riverside: Phân loại Tiểu học (Khối 1-5) và Trung học (Khối 6-12)
    const gradeMatch =
      String(cls?.grade || "").match(/(\d{1,2})/) ||
      String(cls?.name || "").match(/^(\d{1,2})(?:\/|\.|A|B|C|I|S|_|\s|$)/i);
    const gradeNum = gradeMatch ? parseInt(gradeMatch[1], 10) : null;

    if (gradeNum !== null && gradeNum >= 6 && gradeNum <= 12) {
      return {
        primaryRoom: "Phòng Lab Sky-Line Riverside Trung Học",
        fallbackRoom: "Phòng Lab Sky-Line Riverside Tiểu Học",
        campusLabel: "CS1 - Riverside (Trung học)",
        campusKey: "cs1",
      };
    }

    if (gradeNum !== null && gradeNum >= 1 && gradeNum <= 5) {
      return {
        primaryRoom: "Phòng Lab Sky-Line Riverside Tiểu Học",
        fallbackRoom: "Phòng Lab Sky-Line Riverside Trung Học",
        campusLabel: "CS1 - Riverside (Tiểu học)",
        campusKey: "cs1",
      };
    }

    // Nếu không rõ khối số, ưu tiên theo phòng Lab phụ trách của Giáo viên
    if (teacherLab.includes("trung học")) {
      return {
        primaryRoom: "Phòng Lab Sky-Line Riverside Trung Học",
        fallbackRoom: "Phòng Lab Sky-Line Riverside Tiểu Học",
        campusLabel: "CS1 - Riverside (Trung học)",
        campusKey: "cs1",
      };
    }

    return {
      primaryRoom: "Phòng Lab Sky-Line Riverside Tiểu Học",
      fallbackRoom: "Phòng Lab Sky-Line Riverside Trung Học",
      campusLabel: "CS1 - Riverside (Tiểu học)",
      campusKey: "cs1",
    };
  };

  // Thuật toán AI tạo danh sách gợi ý sắp xếp lịch Phòng Lab chống trùng
  const generateAiLabScheduleSuggestions = (mode: "fill_missing" | "rebuild_all") => {
    setAiScheduleMode(mode);

    if (assignedClassesFromSection3.length === 0) {
      setAiSuggestedSlots([]);
      return;
    }

    // 1. Khởi tạo bản đồ chiếm dụng 6 phòng Lab trên toàn trường (Thứ 2..6, Tiết 1..8)
    // Key: `${day}_${period}_${normalizedLabKey}`
    const occupiedLabMap = new Map<string, { class_name: string; teacher_name: string }>();
    const occupiedTeacherSet = new Set<string>(); // Key: `${day}_${period}`
    const classScheduledDays = new Map<string, Set<number>>(); // className -> Set<day>
    const teacherDayLoad = new Map<number, number>([
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
      [6, 0],
    ]);
    const teacherSessionCampus = new Map<string, string>(); // `${day}_${session}` -> campusKey

    // Đưa toàn bộ lịch của các giáo viên KHÁC (và của chính GV này nếu ở chế độ "fill_missing") vào bản đồ chống trùng
    teacherTimetableSlots.forEach((slot) => {
      const isCurrentTeacherSlot = activeTeacherSlots22.some((own) => own.id === slot.id);
      if (isCurrentTeacherSlot && mode === "rebuild_all") {
        return; // Bỏ qua lịch cũ của GV đang chọn nếu xếp mới toàn bộ
      }

      const labKey = normalizeLabRoomKey(slot.room);
      if (labKey) {
        occupiedLabMap.set(`${slot.day_of_week}_${slot.period}_${labKey}`, {
          class_name: slot.class_name,
          teacher_name: slot.teacher_name,
        });
      }

      if (isCurrentTeacherSlot) {
        occupiedTeacherSet.add(`${slot.day_of_week}_${slot.period}`);
        teacherDayLoad.set(slot.day_of_week, (teacherDayLoad.get(slot.day_of_week) || 0) + 1);

        const matchedCls = assignedClassesFromSection3.find((c) => isMatchingClassName(c.name, slot.class_name));
        const cKey = (matchedCls?.name || slot.class_name).toLowerCase();
        if (!classScheduledDays.has(cKey)) {
          classScheduledDays.set(cKey, new Set());
        }
        classScheduledDays.get(cKey)!.add(slot.day_of_week);

        if (matchedCls) {
          const { campusKey } = resolveSmartLabRoomsForClass(matchedCls);
          const sessionKey = `${slot.day_of_week}_${slot.period <= 4 ? "morning" : "afternoon"}`;
          teacherSessionCampus.set(sessionKey, campusKey);
        }
      }
    });

    // 2. Lấy danh sách tiết gợi ý từ TKB nhà trường (Phần 2.1) của giáo viên đang chọn
    const teacherSchoolHints = assignedSlots.filter((s) =>
      checkSlotBelongsToTeacher(s.teacher_name, currentSelectedTeacher22)
    );
    const usedSchoolHintKeys = new Set<string>();

    const suggestions: AiSuggestedLabSlot[] = [];

    // 3. Duyệt qua từng lớp được Tổ trưởng phân công ở Phần 3
    assignedClassesFromSection3.forEach((cls) => {
      const requiredPeriods = Math.max(1, Number(cls.periods_per_week) || 2);
      const existingPeriodsForClass =
        mode === "fill_missing"
          ? activeTeacherSlots22.filter((s) => isMatchingClassName(s.class_name, cls.name))
          : [];

      const startPeriodIdx = existingPeriodsForClass.length + 1;
      const missingCount = Math.max(0, requiredPeriods - existingPeriodsForClass.length);
      if (missingCount === 0) return;

      const { primaryRoom, fallbackRoom, campusLabel, campusKey } = resolveSmartLabRoomsForClass(cls);
      const primaryLabKey = normalizeLabRoomKey(primaryRoom);
      const fallbackLabKey = fallbackRoom ? normalizeLabRoomKey(fallbackRoom) : "";
      const cKey = String(cls.name).toLowerCase();

      if (!classScheduledDays.has(cKey)) {
        classScheduledDays.set(cKey, new Set());
      }

      for (let idx = 0; idx < missingCount; idx++) {
        const periodNumberInWeek = startPeriodIdx + idx;
        let chosenDay = -1;
        let chosenPeriod = -1;
        let chosenRoom = primaryRoom;
        let chosenReason = "";
        let chosenMatchType: "school_tkb_match" | "campus_fallback_lab" | "ai_optimized" = "ai_optimized";

        // BƯỚC 3.1: Ưu tiên kiểm tra xem trong TKB Nhà trường (Phần 2.1) có tiết của lớp này không
        const matchingHint = teacherSchoolHints.find((h) => {
          const hKey = `${h.day_of_week}_${h.period}`;
          if (usedSchoolHintKeys.has(hKey)) return false;
          if (occupiedTeacherSet.has(hKey)) return false;
          return isMatchingClassName(h.class_name, cls.name);
        });

        if (matchingHint) {
          const d = matchingHint.day_of_week;
          const p = matchingHint.period;
          const primaryConflict = occupiedLabMap.get(`${d}_${p}_${primaryLabKey}`);

          if (!primaryConflict) {
            chosenDay = d;
            chosenPeriod = p;
            chosenRoom = primaryRoom;
            chosenMatchType = "school_tkb_match";
            chosenReason = `Khớp chuẩn TKB Nhà trường & ${formatShortLabRoomName(primaryRoom)} đang trống`;
            usedSchoolHintKeys.add(`${d}_${p}`);
          } else if (fallbackRoom && fallbackLabKey && !occupiedLabMap.has(`${d}_${p}_${fallbackLabKey}`)) {
            chosenDay = d;
            chosenPeriod = p;
            chosenRoom = fallbackRoom;
            chosenMatchType = "campus_fallback_lab";
            chosenReason = `Khớp tiết TKB Trường • Điều phối sang ${formatShortLabRoomName(fallbackRoom)} (do phòng chính có lớp ${primaryConflict.class_name})`;
            usedSchoolHintKeys.add(`${d}_${p}`);
          }
        }

        // BƯỚC 3.2: Nếu không có trong TKB trường (hoặc tiết đó bị kín cả phòng Lab), AI quét 40 tiết trong tuần để tối ưu đa mục tiêu
        if (chosenDay === -1 || chosenPeriod === -1) {
          let bestScore = -999999;

          for (let d = 2; d <= 6; d++) {
            for (let p = 1; p <= 8; p++) {
              const teacherKey = `${d}_${p}`;
              if (occupiedTeacherSet.has(teacherKey)) continue; // Giáo viên đã có tiết dạy khác

              const candidateRooms: Array<{
                room: string;
                labKey: string;
                isFallback: boolean;
                conflictClass?: string;
              }> = [];

              const primaryOccupied = occupiedLabMap.get(`${d}_${p}_${primaryLabKey}`);
              if (!primaryOccupied) {
                candidateRooms.push({
                  room: primaryRoom,
                  labKey: primaryLabKey,
                  isFallback: false,
                });
              } else if (fallbackRoom && fallbackLabKey && !occupiedLabMap.has(`${d}_${p}_${fallbackLabKey}`)) {
                candidateRooms.push({
                  room: fallbackRoom,
                  labKey: fallbackLabKey,
                  isFallback: true,
                  conflictClass: primaryOccupied.class_name,
                });
              }

              for (const cand of candidateRooms) {
                let score = cand.isFallback ? 75 : 100;

                // Tiêu chí 1: Rải đều các tiết của cùng 1 lớp sang các ngày khác nhau trong tuần
                const daysUsedByClass = classScheduledDays.get(cKey)!;
                const isNewDayForClass = !daysUsedByClass.has(d);
                if (isNewDayForClass) {
                  score += 45;
                } else {
                  score -= 20;
                }

                // Tiêu chí 2: Cân bằng số tiết giảng dạy trong ngày của giáo viên
                const currentDayLoad = teacherDayLoad.get(d) || 0;
                score -= currentDayLoad * 10;

                // Tiêu chí 3: Đồng bộ cơ sở giảng dạy trong cùng buổi (tránh di chuyển giữa 2 cơ sở trong 1 buổi)
                const sessionKey = `${d}_${p <= 4 ? "morning" : "afternoon"}`;
                const existingSessionCampus = teacherSessionCampus.get(sessionKey);
                if (existingSessionCampus) {
                  if (existingSessionCampus === campusKey) {
                    score += 18;
                  } else {
                    score -= 35;
                  }
                }

                // Tiêu chí 4: Ưu tiên khung giờ vàng (Tiết 1-3 buổi sáng & Tiết 5-6 buổi chiều)
                if (p === 1 || p === 2 || p === 3 || p === 5 || p === 6) {
                  score += 12;
                } else if (p === 4 || p === 7) {
                  score += 6;
                }

                if (score > bestScore) {
                  bestScore = score;
                  chosenDay = d;
                  chosenPeriod = p;
                  chosenRoom = cand.room;
                  if (cand.isFallback) {
                    chosenMatchType = "campus_fallback_lab";
                    chosenReason = `Tự động chuyển sang ${formatShortLabRoomName(cand.room)} (phòng chính bận lớp ${cand.conflictClass}) • Không trùng lịch`;
                  } else {
                    chosenMatchType = "ai_optimized";
                    const reasonParts: string[] = [`${formatShortLabRoomName(cand.room)} trống 100%`];
                    if (isNewDayForClass && requiredPeriods > 1) {
                      reasonParts.push("Rải đều ngày học trong tuần");
                    }
                    reasonParts.push(`Cân bằng tải cho GV (${currentDayLoad + 1} tiết/ngày)`);
                    chosenReason = reasonParts.join(" • ");
                  }
                }
              }
            }
          }
        }

        // Nếu tìm được ô tối ưu thì ghi nhận ngay vào bản đồ tạm để các tiết tiếp theo không bao giờ đụng nhau
        if (chosenDay !== -1 && chosenPeriod !== -1) {
          const finalLabKey = normalizeLabRoomKey(chosenRoom);
          occupiedLabMap.set(`${chosenDay}_${chosenPeriod}_${finalLabKey}`, {
            class_name: cls.name,
            teacher_name: currentSelectedTeacher22.name,
          });
          occupiedTeacherSet.add(`${chosenDay}_${chosenPeriod}`);
          classScheduledDays.get(cKey)!.add(chosenDay);
          teacherDayLoad.set(chosenDay, (teacherDayLoad.get(chosenDay) || 0) + 1);
          const sessionKey = `${chosenDay}_${chosenPeriod <= 4 ? "morning" : "afternoon"}`;
          teacherSessionCampus.set(sessionKey, campusKey);

          suggestions.push({
            tempId: `ai_slot_${cls.id}_${periodNumberInWeek}_${Date.now()}_${idx}`,
            selected: true,
            class_name: cls.name,
            grade: String(cls.grade || ""),
            campus: campusLabel,
            periodIndex: periodNumberInWeek,
            totalPeriodsForClass: requiredPeriods,
            day_of_week: chosenDay,
            period: chosenPeriod,
            room: chosenRoom,
            subject: cls.curriculum ? `Tin học (${cls.curriculum})` : "Tin học",
            reason: chosenReason,
            matchType: chosenMatchType,
          });
        }
      }
    });

    // Sắp xếp danh sách gợi ý theo Thứ -> Tiết để thầy cô dễ rà soát
    suggestions.sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.period - b.period;
    });

    setAiSuggestedSlots(suggestions);
  };

  // Mở cửa sổ AI Gợi Ý Sắp Xếp Lịch Phòng Lab
  const handleOpenAiSchedulerModal = () => {
    if (!canEdit) {
      showToast("Thầy/Cô chỉ có quyền chạy AI gợi ý xếp lịch cho thời khóa biểu của chính mình!", "warning");
      return;
    }
    const defaultMode: "fill_missing" | "rebuild_all" =
      activeTeacherSlots22.length > 0 && activeTeacherSlots22.length < totalAssignedPeriodsFromSection3
        ? "fill_missing"
        : activeTeacherSlots22.length === 0
        ? "fill_missing"
        : "rebuild_all";

    generateAiLabScheduleSuggestions(defaultMode);
    setIsAiSchedulerModalOpen(true);
  };

  // Kiểm tra xung đột thời gian thực cho từng dòng trong bảng Gợi ý AI (khi người dùng tự chỉnh sửa Thứ/Tiết/Phòng Lab)
  const getAiSlotLiveConflict = (item: AiSuggestedLabSlot): { hasConflict: boolean; message: string } => {
    const targetLabKey = normalizeLabRoomKey(item.room);

    // 1. Kiểm tra xung đột với lịch của giáo viên khác (hoặc lịch đã có của GV này nếu ở chế độ fill_missing)
    for (const existing of teacherTimetableSlots) {
      const isOwn = activeTeacherSlots22.some((own) => own.id === existing.id);
      if (isOwn && aiScheduleMode === "rebuild_all") continue;

      if (existing.day_of_week === item.day_of_week && existing.period === item.period) {
        if (isOwn) {
          return {
            hasConflict: true,
            message: `Trùng tiết dạy đã xếp của Thầy/Cô (Lớp ${existing.class_name})`,
          };
        }
        if (normalizeLabRoomKey(existing.room) === targetLabKey) {
          return {
            hasConflict: true,
            message: `Phòng Lab đã có lớp ${existing.class_name} (${existing.teacher_name})`,
          };
        }
      }
    }

    // 2. Kiểm tra xung đột với các dòng đang được tích chọn khác ngay trong bảng gợi ý AI
    for (const other of aiSuggestedSlots) {
      if (!other.selected || other.tempId === item.tempId) continue;
      if (other.day_of_week === item.day_of_week && other.period === item.period) {
        return {
          hasConflict: true,
          message: `Trùng Thứ ${item.day_of_week} • Tiết ${item.period} với lớp ${other.class_name} trong bảng đề xuất`,
        };
      }
    }

    return {
      hasConflict: false,
      message: "Phòng Lab trống • Không trùng lịch",
    };
  };

  // Cập nhật 1 dòng gợi ý trong bảng khi người dùng tùy chỉnh Thứ / Tiết / Phòng Lab / Checkbox
  const handleUpdateAiSuggestedSlot = (
    tempId: string,
    patch: Partial<Pick<AiSuggestedLabSlot, "selected" | "day_of_week" | "period" | "room">>
  ) => {
    setAiSuggestedSlots((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;
        const updated = { ...item, ...patch };
        if (patch.day_of_week !== undefined || patch.period !== undefined || patch.room !== undefined) {
          updated.reason = "Thầy/Cô đã tùy chỉnh thủ công • Đã kiểm tra chống trùng trực tiếp";
        }
        return updated;
      })
    );
  };

  // Phê duyệt & Lưu các tiết do AI đề xuất vào bảng teacher_timetables trên Supabase
  const handleApplyAiSchedule = async () => {
    if (!canEdit) {
      showToast("Thầy/Cô không có quyền lưu lịch cho giáo viên khác!", "warning");
      return;
    }

    const selectedItems = aiSuggestedSlots.filter((s) => s.selected);
    if (selectedItems.length === 0) {
      showToast("Vui lòng tích chọn ít nhất 1 tiết dạy trong danh sách gợi ý để lưu!", "warning");
      return;
    }

    // Kiểm tra xem có dòng nào đang bị cảnh báo xung đột không
    const conflictingItem = selectedItems.find((item) => getAiSlotLiveConflict(item).hasConflict);
    if (conflictingItem) {
      const conflictInfo = getAiSlotLiveConflict(conflictingItem);
      showToast(
        `Không thể lưu: Lớp ${conflictingItem.class_name} (Thứ ${conflictingItem.day_of_week} - Tiết ${conflictingItem.period}) đang bị xung đột: ${conflictInfo.message}`,
        "warning"
      );
      return;
    }

    setIsApplyingAiSchedule(true);
    try {
      // Nếu ở chế độ xếp mới toàn bộ tuần theo Phần 3 -> Xóa lịch cũ của GV này trong năm học đang chọn trước
      if (aiScheduleMode === "rebuild_all") {
        const { error: delErr } = await supabase
          .from("teacher_timetables")
          .delete()
          .eq("teacher_id", currentSelectedTeacher22.id)
          .eq("school_year", selectedSchoolYear);

        if (delErr) throw delErr;
      }

      const recordsToInsert = selectedItems.map((item) => ({
        school_year: selectedSchoolYear,
        school_year_id: resolveSchoolYearUUID(selectedSchoolYear),
        teacher_id: currentSelectedTeacher22.id,
        teacher_code: currentSelectedTeacher22.code || "GV-ICT",
        teacher_name: currentSelectedTeacher22.name,
        day_of_week: item.day_of_week,
        period: item.period,
        session: item.period <= 4 ? "morning" : "afternoon",
        time_slot: PERIOD_TIMES[item.period] || "",
        class_name: item.class_name.trim(),
        subject: "Tin học",
        room: item.room.trim(),
        notes: `AI Gợi ý chống trùng từ Phân công Phần 3 (${item.reason})`,
      }));

      const { error } = await supabase.from("teacher_timetables").insert(recordsToInsert);
      if (error) throw error;

      showToast(
        `Đã phê duyệt & lưu thành công ${recordsToInsert.length} tiết phòng Lab chống trùng cho ${currentSelectedTeacher22.name}!`,
        "success"
      );
      setIsAiSchedulerModalOpen(false);
      await loadTeacherSelfTimetables();
      onScheduleChanged?.();
    } catch (err: any) {
      console.error("Lỗi khi lưu lịch gợi ý từ AI:", err);
      showToast(err?.message || "Không thể lưu lịch gợi ý AI. Vui lòng kiểm tra lại!", "warning");
    } finally {
      setIsApplyingAiSchedule(false);
    }
  };

  // =========================================================================
  // RENDER ROW CHO PHẦN 2.2 (THU GỌN HIỂN THỊ TRỌN VẸN KHÔNG CẦN THANH CUỘN DỌC)
  // =========================================================================
  const renderSelfManagedRow = (period: number, defaultTime: string) => {
    return (
      <tr key={`self_tt_row_${period}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
        {/* CỘT 1: TIẾT VÀ GIỜ */}
        <td className="py-1 px-2 text-center bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 w-28 shrink-0 align-middle">
          <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs leading-tight">Tiết {period}</div>
          <div className="text-[10px] text-slate-500 font-medium leading-tight">{defaultTime}</div>
        </td>

        {/* 5 CỘT: THỨ HAI -> THỨ SÁU (CHIA ĐỀU BẰNG NHAU 100%) */}
        {[2, 3, 4, 5, 6].map((dayNum) => {
          const key = `${dayNum}_${period}`;
          const slot = slotMap22.get(key);
          const isToday = new Date().getDay() + 1 === dayNum;
          const schoolHint = getSchoolAssignedHint(dayNum, period);

          return (
            <td
              key={`self_cell_${dayNum}_${period}`}
              className={`py-1 px-1.5 transition-all border border-slate-100 dark:border-slate-800/60 relative group w-1/5 overflow-hidden align-middle ${
                isToday ? "bg-amber-50/20 dark:bg-amber-950/20" : ""
              }`}
            >
              {slot ? (
                <div className="py-1 px-2 rounded-xl bg-gradient-to-br from-white via-amber-50/40 to-amber-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all space-y-0.5 relative w-full overflow-hidden">
                  {/* DÒNG 1: TÊN LỚP + NÚT SỬA/XÓA */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="font-extrabold text-slate-900 dark:text-white text-[11px] leading-tight truncate">
                      Lớp: {slot.class_name}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-0.5 shrink-0 opacity-85 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSlot(slot)}
                          className="p-0.5 rounded hover:bg-amber-200/60 dark:hover:bg-amber-900/60 text-slate-600 dark:text-slate-300 hover:text-amber-800 transition-colors cursor-pointer"
                          title="Sửa tiết dạy này"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmSlot(slot)}
                          className="p-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                          title="Xóa tiết dạy này"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DÒNG 2: PHÒNG LAB (RÚT GỌN TÊN: BỎ "Phòng Lab Sky-Line") */}
                  <div
                    className="flex items-center gap-1 text-[10px] font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/70 px-1.5 py-0 rounded-md truncate shadow-2xs w-full min-w-0 leading-tight"
                    title={slot.room}
                  >
                    <Laptop className="w-2.5 h-2.5 text-sky-500 shrink-0" />
                    <span className="truncate">{formatShortLabRoomName(slot.room)}</span>
                  </div>
                </div>
              ) : canEdit ? (
                <div
                  onClick={() => handleOpenAddSlot(dayNum, period)}
                  className="h-8 rounded-xl border border-dashed border-slate-200/70 dark:border-slate-800/60 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 cursor-pointer transition-all flex items-center justify-center gap-1.5 px-1.5 select-none group/empty w-full"
                >
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover/empty:text-amber-600 dark:group-hover/empty:text-amber-400 transition-colors inline-flex items-center gap-0.5 shrink-0">
                    <PlusCircle className="w-3 h-3 opacity-60 group-hover/empty:opacity-100" />
                    Xếp tiết
                  </span>
                  {schoolHint && (
                    <span className="text-[9px] text-amber-600/90 dark:text-amber-400/90 font-semibold truncate max-w-full">
                      💡 TKB: {schoolHint.class_name}
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-8 rounded-xl border border-dashed border-slate-100 dark:border-slate-800/40 flex items-center justify-center text-xs text-slate-300 dark:text-slate-600 select-none cursor-default bg-slate-50/20 dark:bg-slate-900/10 w-full">
                  -
                </div>
              )}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* THANH ĐIỀU HƯỚNG 2 PHẦN CON: PHẦN 2.1 & PHẦN 2.2                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveSubTab("2.1")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === "2.1"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-amber-200/80 dark:border-amber-900/60"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Phần 2.1: Xem TKB Cá Nhân Theo TKB Nhà Trường</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("2.2")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === "2.2"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-amber-200/80 dark:border-amber-900/60"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Phần 2.2: Lịch Giảng Dạy Của Từng Giáo Viên (Tự Nhập)</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-semibold px-2">
          {activeSubTab === "2.1" ? (
            <span>Tra cứu theo tệp Excel TKB toàn trường</span>
          ) : (
            <span>Tự xếp lịch theo phân công chuyên môn Phần 3</span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NỘI DUNG PHẦN 2.1: XEM TKB CÁ NHÂN THEO TKB NHÀ TRƯỜNG                     */}
      {/* ========================================================================= */}
      {activeSubTab === "2.1" && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Phần 2.1: Xem TKB Cá Nhân Theo TKB Nhà Trường
                    <Badge variant="amber" className="text-[10px] font-bold px-2 py-0">
                      TKB Toàn Trường
                    </Badge>
                  </h2>
                </div>
              </div>

              {/* NÚT IMPORT EXCEL & LÀM MỚI */}
              <div className="flex flex-wrap items-center gap-2">
                {!isGuest && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".xlsx,.xls"
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      variant="amber"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                      className="font-bold text-xs h-7 px-2.5 shadow-sm shadow-amber-500/20"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          Đang Import TKB...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5 mr-1" />
                          Import File TKB Nhà Trường (.xlsx)
                        </>
                      )}
                    </Button>
                  </>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadSchoolAssignedData}
                  disabled={isLoadingSchool}
                  className="font-bold text-xs h-7 px-2.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoadingSchool ? "animate-spin" : ""}`} />
                  Làm Mới
                </Button>

                {selectedTeacher21 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="font-bold text-xs h-7 px-2.5"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1 text-slate-600 dark:text-slate-400" />
                    In TKB (PDF)
                  </Button>
                )}
              </div>
            </div>

            {/* Ô TÌM KIẾM GIÁO VIÊN & 8 CHIP CHỌN NHANH */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
              <div className="relative w-full xl:w-80 shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Tìm tên giáo viên (Tuấn ICT, Linh ICT...)"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!e.target.value.trim()) {
                      setSelectedTeacher21("");
                    }
                  }}
                  className="pl-9 pr-8 text-xs h-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 font-semibold focus:ring-2 focus:ring-amber-500/20"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeacher21("");
                      setSearchTerm("");
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {filteredTeacherSuggestions21.length > 0 && selectedTeacher21 !== searchTerm && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-56 overflow-y-auto space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Gợi ý giáo viên phù hợp:
                    </div>
                    {filteredTeacherSuggestions21.map((t) => (
                      <button
                        key={`sug21_${t}`}
                        type="button"
                        onClick={() => {
                          setSelectedTeacher21(t);
                          setSearchTerm(t);
                          showToast(`Đang hiển thị lịch giảng dạy của: ${t}`, "info");
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center justify-between"
                      >
                        <span>{t}</span>
                        <span className="text-[10px] font-normal text-slate-400">
                          {assignedSlots.filter((s) => s.teacher_name === t).length} tiết
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 8 CHIP GIÁO VIÊN TỔ ICT CHUẨN XÁC THEO TÊN FILE TKB NHÀ TRƯỜNG */}
              <div className="flex flex-wrap items-center gap-1.5">
                {OFFICIAL_ICT_TEACHERS_MAPPINGS.map((mapping) => {
                  const isSelected =
                    selectedTeacher21.toLowerCase() === mapping.fileKeyName.toLowerCase() ||
                    selectedTeacher21.toLowerCase() === mapping.officialName.toLowerCase();

                  const count = assignedSlots.filter((s) =>
                    checkSlotBelongsToTeacher(s.teacher_name, { name: mapping.officialName })
                  ).length;

                  return (
                    <button
                      key={`chip21_${mapping.fileKeyName}`}
                      type="button"
                      onClick={() => {
                        setSelectedTeacher21(mapping.fileKeyName);
                        setSearchTerm(mapping.fileKeyName);
                        showToast(
                          `Đang hiển thị TKB của ${mapping.officialName} (Tên file: ${mapping.fileKeyName})`,
                          "info"
                        );
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-amber-500 text-white border-amber-500 shadow-xs shadow-amber-500/30"
                          : "bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60"
                      }`}
                      title={`${mapping.officialName} ➔ Tên trong file: "${mapping.fileKeyName}"`}
                    >
                      <span>{mapping.fileKeyName}</span>
                      <span
                        className={`text-[9px] px-1 py-0 rounded-full font-black ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {count}t
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* THANH TÓM TẮT GỌN GIÁO VIÊN ĐANG CHỌN */}
            {selectedTeacher21 && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    GV: {selectedTeacher21}
                  </span>
                  <Badge variant="amber" className="text-[10px] font-bold px-2 py-0">
                    {teacherStats21.total} Tiết / Tuần
                  </Badge>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                    (Sáng: <strong>{teacherStats21.morning}t</strong> • Chiều: <strong>{teacherStats21.afternoon}t</strong> • Lớp: <strong>{teacherStats21.classes.join(", ") || "Chưa có"}</strong>)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* LƯỚI THỜI KHÓA BIỂU PHẦN 2.1 (THỨ 2 -> THỨ 6 • TIẾT 1 -> 8) - GỌN TRONG 1 MÀN HÌNH */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs border-collapse min-w-[760px] table-fixed">
              <colgroup>
                <col className="w-28" style={{ width: "112px" }} />
                <col style={{ width: "calc((100% - 112px) / 5)" }} />
                <col style={{ width: "calc((100% - 112px) / 5)" }} />
                <col style={{ width: "calc((100% - 112px) / 5)" }} />
                <col style={{ width: "calc((100% - 112px) / 5)" }} />
                <col style={{ width: "calc((100% - 112px) / 5)" }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 px-2 font-bold w-28 text-center bg-slate-200/60 dark:bg-slate-800">
                    Tiết / Giờ
                  </th>
                  {[
                    { day: 2, label: "Thứ Hai" },
                    { day: 3, label: "Thứ Ba" },
                    { day: 4, label: "Thứ Tư" },
                    { day: 5, label: "Thứ Năm" },
                    { day: 6, label: "Thứ Sáu" },
                  ].map((d) => {
                    const isToday = new Date().getDay() + 1 === d.day;
                    return (
                      <th
                        key={`h21_${d.day}`}
                        className={`py-2 px-2 font-bold text-center w-1/5 ${
                          isToday
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-x border-amber-200 dark:border-amber-800"
                            : ""
                        }`}
                      >
                        {d.label}{" "}
                        {isToday && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            (Hôm nay)
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {!selectedTeacher21 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="max-w-md mx-auto space-y-2.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 mx-auto flex items-center justify-center border border-amber-200/80 dark:border-amber-800">
                          <Search className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                            Chưa chọn giáo viên
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Thầy/Cô vui lòng <strong>nhập tên giáo viên</strong> vào ô tìm kiếm ở trên hoặc <strong>bấm vào thẻ tên giáo viên</strong> để xem lịch giảng dạy chi tiết.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr className="bg-amber-50/70 dark:bg-amber-950/40 border-y border-amber-200/80 dark:border-amber-900/60">
                      <td colSpan={6} className="px-3 py-1 font-black text-amber-900 dark:text-amber-300 text-[11px] tracking-wide">
                        <span className="inline-flex items-center gap-1.5">
                          <SunMedium className="w-3.5 h-3.5 text-amber-500" />
                          BUỔI SÁNG (08:00 - 11:25 • 4 TIẾT)
                        </span>
                      </td>
                    </tr>

                    {[1, 2].map((p) => {
                      return (
                        <tr key={`r21_${p}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-1 px-2 text-center bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 align-middle">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs leading-tight">Tiết {p}</div>
                            <div className="text-[10px] text-slate-500 font-medium leading-tight">{PERIOD_TIMES[p]}</div>
                          </td>
                          {[2, 3, 4, 5, 6].map((dayNum) => {
                            const slot = slotMap21.get(`${dayNum}_${p}`);
                            return (
                              <td key={`c21_${dayNum}_${p}`} className="py-1 px-1.5 border border-slate-100 dark:border-slate-800/60 align-middle">
                                {slot ? (
                                  <div className="py-1 px-2.5 rounded-xl bg-gradient-to-br from-white via-amber-50/40 to-amber-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs space-y-0.5">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-[10px] font-black px-1.5 py-0 rounded-md border leading-tight ${getSubjectBadgeStyle(slot.subject)}`}>
                                        {slot.subject || "Tiết dạy"}
                                      </span>
                                      {slot.room && (
                                        <span className="text-[9px] font-bold px-1.5 py-0 rounded bg-sky-100 text-sky-700 truncate max-w-[70px] leading-tight">
                                          {slot.room}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-black text-slate-900 dark:text-white text-[11px] leading-tight">Lớp: {slot.class_name}</div>
                                  </div>
                                ) : (
                                  <div className="h-8 rounded-xl border border-dashed border-slate-200/60 dark:border-slate-800/50 flex items-center justify-center text-xs text-slate-300 dark:text-slate-700 select-none">-</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-[10px] italic">
                      <td className="py-0.5 px-2 text-center bg-slate-100 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800 font-semibold">09:35 - 09:50</td>
                      <td colSpan={5} className="py-0.5 px-2 text-center">
                        <span className="inline-flex items-center gap-1"><Coffee className="w-3 h-3 text-amber-500" /> Giờ ra chơi & sinh hoạt giữa giờ (15 phút)</span>
                      </td>
                    </tr>

                    {[3, 4].map((p) => {
                      return (
                        <tr key={`r21_${p}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-1 px-2 text-center bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 align-middle">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs leading-tight">Tiết {p}</div>
                            <div className="text-[10px] text-slate-500 font-medium leading-tight">{PERIOD_TIMES[p]}</div>
                          </td>
                          {[2, 3, 4, 5, 6].map((dayNum) => {
                            const slot = slotMap21.get(`${dayNum}_${p}`);
                            return (
                              <td key={`c21_${dayNum}_${p}`} className="py-1 px-1.5 border border-slate-100 dark:border-slate-800/60 align-middle">
                                {slot ? (
                                  <div className="py-1 px-2.5 rounded-xl bg-gradient-to-br from-white via-amber-50/40 to-amber-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs space-y-0.5">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-[10px] font-black px-1.5 py-0 rounded-md border leading-tight ${getSubjectBadgeStyle(slot.subject)}`}>
                                        {slot.subject || "Tiết dạy"}
                                      </span>
                                      {slot.room && (
                                        <span className="text-[9px] font-bold px-1.5 py-0 rounded bg-sky-100 text-sky-700 truncate max-w-[70px] leading-tight">
                                          {slot.room}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-black text-slate-900 dark:text-white text-[11px] leading-tight">Lớp: {slot.class_name}</div>
                                  </div>
                                ) : (
                                  <div className="h-8 rounded-xl border border-dashed border-slate-200/60 dark:border-slate-800/50 flex items-center justify-center text-xs text-slate-300 dark:text-slate-700 select-none">-</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold border-y border-slate-200 dark:border-slate-700">
                      <td className="py-1 px-2 text-center bg-slate-200/70 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">11:25 - 13:15</td>
                      <td colSpan={5} className="py-1 px-2 text-center">🍱 NGHỈ TRƯA, ĂN BÁN TRÚ & NGHỈ NGƠI TẠI TRƯỜNG</td>
                    </tr>

                    <tr className="bg-indigo-50/70 dark:bg-indigo-950/40 border-y border-indigo-200/80 dark:border-indigo-900/60">
                      <td colSpan={6} className="px-3 py-1 font-black text-indigo-900 dark:text-indigo-300 text-[11px] tracking-wide">
                        <span className="inline-flex items-center gap-1.5">
                          <Sunset className="w-3.5 h-3.5 text-orange-500" />
                          BUỔI CHIỀU (13:15 - 16:40 • 4 TIẾT)
                        </span>
                      </td>
                    </tr>

                    {[5, 6].map((p) => {
                      return (
                        <tr key={`r21_${p}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-1 px-2 text-center bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 align-middle">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs leading-tight">Tiết {p}</div>
                            <div className="text-[10px] text-slate-500 font-medium leading-tight">{PERIOD_TIMES[p]}</div>
                          </td>
                          {[2, 3, 4, 5, 6].map((dayNum) => {
                            const slot = slotMap21.get(`${dayNum}_${p}`);
                            return (
                              <td key={`c21_${dayNum}_${p}`} className="py-1 px-1.5 border border-slate-100 dark:border-slate-800/60 align-middle">
                                {slot ? (
                                  <div className="py-1 px-2.5 rounded-xl bg-gradient-to-br from-white via-amber-50/40 to-amber-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs space-y-0.5">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-[10px] font-black px-1.5 py-0 rounded-md border leading-tight ${getSubjectBadgeStyle(slot.subject)}`}>
                                        {slot.subject || "Tiết dạy"}
                                      </span>
                                      {slot.room && (
                                        <span className="text-[9px] font-bold px-1.5 py-0 rounded bg-sky-100 text-sky-700 truncate max-w-[70px] leading-tight">
                                          {slot.room}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-black text-slate-900 dark:text-white text-[11px] leading-tight">Lớp: {slot.class_name}</div>
                                  </div>
                                ) : (
                                  <div className="h-8 rounded-xl border border-dashed border-slate-200/60 dark:border-slate-800/50 flex items-center justify-center text-xs text-slate-300 dark:text-slate-700 select-none">-</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-[10px] italic">
                      <td className="py-0.5 px-2 text-center bg-slate-100 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800 font-semibold">14:50 - 15:05</td>
                      <td colSpan={5} className="py-0.5 px-2 text-center">
                        <span className="inline-flex items-center gap-1"><Coffee className="w-3 h-3 text-amber-500" /> Giờ ăn xế & giải lao chiều (15 phút)</span>
                      </td>
                    </tr>

                    {[7, 8].map((p) => {
                      return (
                        <tr key={`r21_${p}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-1 px-2 text-center bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 align-middle">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs leading-tight">Tiết {p}</div>
                            <div className="text-[10px] text-slate-500 font-medium leading-tight">{PERIOD_TIMES[p]}</div>
                          </td>
                          {[2, 3, 4, 5, 6].map((dayNum) => {
                            const slot = slotMap21.get(`${dayNum}_${p}`);
                            return (
                              <td key={`c21_${dayNum}_${p}`} className="py-1 px-1.5 border border-slate-100 dark:border-slate-800/60 align-middle">
                                {slot ? (
                                  <div className="py-1 px-2.5 rounded-xl bg-gradient-to-br from-white via-amber-50/40 to-amber-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs space-y-0.5">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-[10px] font-black px-1.5 py-0 rounded-md border leading-tight ${getSubjectBadgeStyle(slot.subject)}`}>
                                        {slot.subject || "Tiết dạy"}
                                      </span>
                                      {slot.room && (
                                        <span className="text-[9px] font-bold px-1.5 py-0 rounded bg-sky-100 text-sky-700 truncate max-w-[70px] leading-tight">
                                          {slot.room}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-black text-slate-900 dark:text-white text-[11px] leading-tight">Lớp: {slot.class_name}</div>
                                  </div>
                                ) : (
                                  <div className="h-8 rounded-xl border border-dashed border-slate-200/60 dark:border-slate-800/50 flex items-center justify-center text-xs text-slate-300 dark:text-slate-700 select-none">-</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NỘI DUNG PHẦN 2.2: LỊCH GIẢNG DẠY CỦA TỪNG GIÁO VIÊN (TỰ NHẬP & QUẢN LÝ) */}
      {/* ========================================================================= */}
      {activeSubTab === "2.2" && (
        <div className="space-y-2.5">
          {/* KHUNG TIÊU ĐỀ & CHỌN GIÁO VIÊN THU GỌN */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shadow-xs">
                  <Users className="w-4 h-4" />
                </span>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  Phần 2.2: Lịch Giảng Dạy Của Từng Giáo Viên
                  <Badge variant="amber" className="text-[10px] font-bold px-2 py-0">
                    Tự Nhập & Quản Lý Cá Nhân
                  </Badge>
                </h2>
              </div>

              {/* NÚT THAO TÁC NHANH: CHỈ HIỂN THỊ NẾU CÓ QUYỀN CHỈNH SỬA (canEdit) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {canEdit ? (
                  <>
                    <Button
                      size="sm"
                      variant="amber"
                      onClick={() => handleOpenAddSlot(2, 1)}
                      className="font-bold text-xs h-7 px-2.5 shadow-sm shadow-amber-500/20"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1" />
                      + Xếp Tiết Mới
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleOpenAiSchedulerModal}
                      className="font-bold text-xs h-7 px-2.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-500 hover:via-indigo-500 hover:to-sky-600 text-white border-0 shadow-sm shadow-sky-500/25 cursor-pointer"
                      title="AI phân tích Bảng Phân Công Chuyên Môn (Phần 3) và gợi ý sắp xếp lịch Phòng Lab đảm bảo 0% trùng tiết giữa các lớp"
                    >
                      <Wand2 className="w-3.5 h-3.5 mr-1 text-amber-300" />
                      AI Gợi Ý Xếp Lịch Phòng Lab
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAutoSyncFromSchoolSchedule}
                      disabled={isSyncingFromSchool}
                      className="font-bold text-xs h-7 px-2.5 hover:border-amber-400 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30"
                      title={`Tự động sao chép các tiết từ TKB nhà trường ứng với tên file: "${teacherMappingConfig22?.fileKeyName || "ICT"}"`}
                    >
                      {isSyncingFromSchool ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          Đang Điền Tiết...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                          Tự Động Điền Từ TKB Trường ({teacherMappingConfig22?.fileKeyName || "TKB"})
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsClearWeekModalOpen(true)}
                      className="font-bold text-xs h-7 px-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      title="Xóa trắng lịch tuần này để xếp lại"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Xóa Lịch Tuần
                    </Button>
                  </>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold shadow-2xs">
                    <Eye className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Chế độ Chỉ Xem</span>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="font-bold text-xs h-7 px-2.5"
                >
                  <Printer className="w-3.5 h-3.5 mr-1 text-slate-600 dark:text-slate-400" />
                  In TKB
                </Button>
              </div>
            </div>

            {/* BỘ CHỌN 8 GIÁO VIÊN DẠNG THẺ THU GỌN */}
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
                {teachersList.map((t) => {
                  const isSelected = selectedTeacherId22 === t.id;
                  const slotCount = teacherTimetableSlots.filter(
                    (s) => s.teacher_id === t.id || s.teacher_name === t.name
                  ).length;

                  const isThisTeacher = currentUserProfile?.id === t.id ||
                    (currentUserProfile?.name && t.name && (
                      currentUserProfile.name.toLowerCase().includes(t.name.replace(/^(Thầy|Cô)\s+/i, "").toLowerCase()) ||
                      t.name.toLowerCase().includes(currentUserProfile.name.replace(/^(Thầy|Cô)\s+/i, "").toLowerCase())
                    ));

                  const tMap = OFFICIAL_ICT_TEACHERS_MAPPINGS.find(
                    (m) =>
                      t.name.toLowerCase().includes(m.officialName.toLowerCase()) ||
                      m.officialName.toLowerCase().includes(t.name.toLowerCase())
                  );

                  return (
                    <button
                      key={`tcard_${t.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedTeacherId22(t.id);
                        showToast(`Đang hiển thị lịch giảng dạy của: ${t.name}`, "info");
                      }}
                      className={`py-1.5 px-2 rounded-xl text-left transition-all border cursor-pointer relative ${
                        isSelected
                          ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-500 shadow-sm shadow-amber-500/20"
                          : "bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {isThisTeacher && (
                        <span className="absolute -top-1.5 -right-1 px-1 py-0 rounded bg-emerald-500 text-white text-[8px] font-black uppercase shadow-xs">
                          Của tôi
                        </span>
                      )}

                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-black px-1 py-0 rounded ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          {tMap?.fileKeyName || t.code || "ICT"}
                        </span>
                        <span className={`text-[10px] font-bold ${isSelected ? "text-white" : "text-amber-600"}`}>
                          {slotCount}t
                        </span>
                      </div>
                      <div className="font-extrabold text-[11px] line-clamp-1 leading-tight flex items-center gap-1 mt-0.5">
                        {!isThisTeacher && !isLeader && <Eye className="w-2.5 h-2.5 text-slate-400 shrink-0" />}
                        <span>{(t.name || "").split("(")[0].replace("Thầy ", "").replace("Cô ", "")}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* THANH TỔNG QUAN PHÂN CÔNG TỪ PHẦN 3 & TIẾN ĐỘ XẾP LỊCH TRÊN 1 DÒNG */}
              <div className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-200/90 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                    {currentSelectedTeacher22.name}
                  </span>
                  <Badge variant="amber" className="text-[10px] font-bold px-2 py-0">
                    {teacherMappingConfig22?.fileKeyName || "ICT"}
                  </Badge>
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 ml-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Lớp phân công (Phần 3):
                  </span>
                  {assignedClassesFromSection3.length > 0 ? (
                    assignedClassesFromSection3.map((cls) => (
                      <span
                        key={`assigned_c3_${cls.id}`}
                        className="px-1.5 py-0 rounded-md bg-white dark:bg-slate-800 text-[10px] font-extrabold text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-amber-800"
                      >
                        {cls.name} ({cls.periods_per_week || 2}t)
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] italic text-slate-400">
                      Chưa có lớp phân công riêng ở Phần 3
                    </span>
                  )}
                </div>

                {/* KHỐI TIẾN ĐỘ ĐÃ XẾP */}
                <div className="flex items-center gap-2 shrink-0">
                  {canEdit ? (
                    <Badge variant="emerald" className="text-[10px] font-bold px-2 py-0 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {isLeader ? "Quyền Tổ Trưởng" : "Lịch của bạn"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-amber-500" />
                      Chỉ xem
                    </Badge>
                  )}
                  <div className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-[11px] font-bold shadow-2xs">
                    Đã xếp:{" "}
                    <strong className="text-amber-600 dark:text-amber-400">
                      {activeTeacherSlots22.length}
                    </strong>{" "}
                    / {totalAssignedPeriodsFromSection3 || 21} tiết
                  </div>
                  {canEdit && assignedClassesFromSection3.length > 0 && (
                    <button
                      type="button"
                      onClick={handleOpenAiSchedulerModal}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-extrabold shadow-2xs transition-colors cursor-pointer"
                      title="Mở Trợ lý AI tự động xếp lịch phòng Lab chống trùng theo danh sách lớp Phần 3"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>AI Xếp Tự Động</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* LƯỚI THỜI KHÓA BIỂU PHẦN 2.2 (HIỂN THỊ TRỌN VẸN KHÔNG CẦN CUỘN DỌC) */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs border-collapse min-w-[820px] table-fixed">
              <colgroup>
                <col className="w-28" style={{ width: "112px" }} />
                <col style={{ width: "calc((100% - 112px) / 5)" }} />
                <col style={{ width: "calc((100% - 112px) / 5)" }} />
                <col style={{ width: "calc((100% - 112px) / 5)" }} />
                <col style={{ width: "calc((100% - 112px) / 5)" }} />
                <col style={{ width: "calc((100% - 112px) / 5)" }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-1.5 px-2 font-bold w-28 text-center bg-slate-200/60 dark:bg-slate-800">
                    Tiết / Giờ
                  </th>
                  {[
                    { day: 2, label: "Thứ Hai" },
                    { day: 3, label: "Thứ Ba" },
                    { day: 4, label: "Thứ Tư" },
                    { day: 5, label: "Thứ Năm" },
                    { day: 6, label: "Thứ Sáu" },
                  ].map((d) => {
                    const isToday = new Date().getDay() + 1 === d.day;
                    return (
                      <th
                        key={`h22_${d.day}`}
                        className={`py-1.5 px-2 font-bold text-center w-1/5 ${
                          isToday
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-x border-amber-200 dark:border-amber-800"
                            : ""
                        }`}
                      >
                        {d.label} {isToday && <span className="text-[10px] font-normal text-amber-600 ml-1">(Hôm nay)</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* BUỔI SÁNG (TIẾT 1 -> 4) */}
                <tr className="bg-amber-50/70 dark:bg-amber-950/40 border-y border-amber-200/80 dark:border-amber-900/60">
                  <td colSpan={6} className="px-3 py-1 font-black text-amber-900 dark:text-amber-300 text-[11px] tracking-wide">
                    <span className="inline-flex items-center gap-1.5">
                      <SunMedium className="w-3.5 h-3.5 text-amber-500" />
                      BUỔI SÁNG (08:00 - 11:25 • 4 TIẾT)
                    </span>
                  </td>
                </tr>

                {[1, 2].map((p) => renderSelfManagedRow(p, PERIOD_TIMES[p]))}

                {/* NGHỈ GIẢI LAO SÁNG */}
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-[10px] italic">
                  <td className="py-0.5 px-2 text-center bg-slate-100 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800 font-semibold">09:35 - 09:50</td>
                  <td colSpan={5} className="py-0.5 px-2 text-center">
                    <span className="inline-flex items-center gap-1"><Coffee className="w-3 h-3 text-amber-500" /> Giờ ra chơi & sinh hoạt giữa giờ (15 phút)</span>
                  </td>
                </tr>

                {[3, 4].map((p) => renderSelfManagedRow(p, PERIOD_TIMES[p]))}

                {/* NGHỈ TRƯA & BÁN TRÚ */}
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold border-y border-slate-200 dark:border-slate-700">
                  <td className="py-1 px-2 text-center bg-slate-200/70 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">11:25 - 13:15</td>
                  <td colSpan={5} className="py-1 px-2 text-center">🍱 NGHỈ TRƯA, ĂN BÁN TRÚ & NGHỈ NGƠI TẠI TRƯỜNG</td>
                </tr>

                {/* BUỔI CHIỀU (TIẾT 5 -> 8) */}
                <tr className="bg-indigo-50/70 dark:bg-indigo-950/40 border-y border-indigo-200/80 dark:border-indigo-900/60">
                  <td colSpan={6} className="px-3 py-1 font-black text-indigo-900 dark:text-indigo-300 text-[11px] tracking-wide">
                    <span className="inline-flex items-center gap-1.5">
                      <Sunset className="w-3.5 h-3.5 text-orange-500" />
                      BUỔI CHIỀU (13:15 - 16:40 • 4 TIẾT)
                    </span>
                  </td>
                </tr>

                {[5, 6].map((p) => renderSelfManagedRow(p, PERIOD_TIMES[p]))}

                {/* NGHỈ GIẢI LAO CHIỀU */}
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-[10px] italic">
                  <td className="py-0.5 px-2 text-center bg-slate-100 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800 font-semibold">14:50 - 15:05</td>
                  <td colSpan={5} className="py-0.5 px-2 text-center">
                    <span className="inline-flex items-center gap-1"><Coffee className="w-3 h-3 text-amber-500" /> Giờ ăn xế & giải lao chiều (15 phút)</span>
                  </td>
                </tr>

                {[7, 8].map((p) => renderSelfManagedRow(p, PERIOD_TIMES[p]))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL THÊM / SỬA TIẾT GIẢNG DẠY (PHẦN 2.2)                                */}
      {/* ========================================================================= */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/30">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {slotModalMode === "add" ? "Xếp Tiết Giảng Dạy Mới" : "Chỉnh Sửa Tiết Giảng Dạy"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Giáo viên: <strong>{currentSelectedTeacher22.name}</strong>{" "}
                    (Tên TKB: <strong>{teacherMappingConfig22?.fileKeyName}</strong>)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* THÔNG TIN THỨ & TIẾT ĐANG XẾP */}
            <div className="mx-5 mt-4 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  {(() => {
                    const dayLabels: Record<number, string> = {
                      2: "Thứ Hai",
                      3: "Thứ Ba",
                      4: "Thứ Tư",
                      5: "Thứ Năm",
                      6: "Thứ Sáu",
                    };
                    return dayLabels[slotFormData.day_of_week] || `Thứ ${slotFormData.day_of_week}`;
                  })()} • Tiết {slotFormData.period} ({PERIOD_TIMES[slotFormData.period] || ""})
                </span>
              </div>
              <Badge variant="amber" className="text-[10px] font-black uppercase tracking-wider">
                {slotFormData.period <= 4 ? "Buổi Sáng" : "Buổi Chiều"}
              </Badge>
            </div>

            {/* FORM XẾP TIẾT GIẢNG DẠY */}
            <form onSubmit={handleSaveSlot} className="p-5 space-y-4 text-xs">
              {/* LỚP GIẢNG DẠY (CHỈ HIỂN THỊ CÁC LỚP ĐƯỢC PHÂN CÔNG Ở PHẦN 3) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs">
                    <GraduationCap className="w-4 h-4 text-amber-500" />
                    Lớp giảng dạy *
                  </span>
                  <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400">
                    (Lớp được phân công ở Phần 3)
                  </span>
                </label>

                {assignedClassesFromSection3.length > 0 ? (
                  <select
                    value={slotFormData.class_name}
                    onChange={(e) => setSlotFormData({ ...slotFormData, class_name: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 shadow-2xs"
                    required
                  >
                    <option value="">-- Bấm chọn lớp học được phân công --</option>
                    {assignedClassesFromSection3.map((c) => (
                      <option key={`c_assigned_${c.id}`} value={c.name}>
                        Lớp {c.name} {c.grade ? `(Khối ${c.grade})` : ""} {c.campus ? `• CS${c.campus}` : ""} ({c.periods_per_week || 2} tiết/tuần)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                    <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      Chưa có lớp nào được phân công ở Phần 3
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Thầy/Cô <strong>{currentSelectedTeacher22.name}</strong> hiện chưa có lớp nào được Tổ trưởng chuyên môn phân công tại mục <em>"Phần 3: Phân công chuyên môn"</em>. Vui lòng phân công lớp ở Phần 3 trước khi xếp thời khóa biểu.
                    </p>
                  </div>
                )}
              </div>

              {/* PHÒNG LAB (6 PHÒNG LAB KHAI BÁO TRONG CƠ SỞ DỮ LIỆU) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                  <Laptop className="w-4 h-4 text-sky-500" />
                  Phòng Lab *
                </label>
                <select
                  value={slotFormData.room}
                  onChange={(e) => {
                    setSlotFormData({ ...slotFormData, room: e.target.value });
                    setSlotConflictError(null);
                  }}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40 shadow-2xs"
                  required
                >
                  {SIX_LAB_ROOMS.map((lab) => (
                    <option key={lab.id} value={lab.name}>
                      {lab.shortName} ({lab.campus})
                    </option>
                  ))}
                </select>
              </div>

              {/* THÔNG BÁO CẢNH BÁO TRÙNG PHÒNG LAB KHI BẤM LƯU TIẾT DẠY */}
              {slotConflictError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{slotConflictError}</span>
                </div>
              )}

              {/* 2 NÚT BẤM: HỦY BỎ VÀ LƯU TIẾT DẠY */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="font-bold text-xs px-4 h-9 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="amber"
                  size="sm"
                  disabled={isSubmittingSlot || assignedClassesFromSection3.length === 0}
                  className="font-bold text-xs px-5 h-9 rounded-xl shadow-md shadow-amber-500/20"
                >
                  {isSubmittingSlot ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Đang Lưu...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Lưu tiết dạy
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL XÁC NHẬN XÓA 1 TIẾT DẠY                                             */}
      {/* ========================================================================= */}
      {deleteConfirmSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Xác Nhận Xóa Tiết Dạy
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thầy/Cô có chắc chắn muốn gỡ tiết này?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
              <div>Lớp: <strong>{deleteConfirmSlot.class_name}</strong></div>
              <div>Thời gian: <strong>Thứ {deleteConfirmSlot.day_of_week} • Tiết {deleteConfirmSlot.period}</strong></div>
              <div>Môn: <strong>{deleteConfirmSlot.subject}</strong> ({deleteConfirmSlot.room})</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteConfirmSlot(null)}
                className="font-bold text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteSlot}
                disabled={isDeleting}
                className="font-bold text-xs"
              >
                {isDeleting ? "Đang xóa..." : "Xóa Tiết Này"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL XÁC NHẬN XÓA TOÀN BỘ LỊCH TUẦN CỦA GIÁO VIÊN                        */}
      {/* ========================================================================= */}
      {isClearWeekModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950">
                <Trash2 className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Xóa Toàn Bộ Lịch Tuần
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Giáo viên: <strong>{currentSelectedTeacher22.name}</strong>{" "}
                  (Tên TKB: <strong>{teacherMappingConfig22?.fileKeyName}</strong>)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Hành động này sẽ xóa toàn bộ {activeTeacherSlots22.length} tiết giảng dạy của Thầy/Cô trong tuần này để xếp lại từ đầu. Thầy/Cô có chắc chắn không?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsClearWeekModalOpen(false)}
                className="font-bold text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleClearWeekSchedule}
                disabled={isClearingWeek}
                className="font-bold text-xs"
              >
                {isClearingWeek ? "Đang xóa..." : "Xóa Sạch Lịch"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL AI GỢI Ý SẮP XẾP LỊCH PHÒNG LAB CHỐNG TRÙNG (TỪ PHÂN CÔNG PHẦN 3)   */}
      {/* ========================================================================= */}
      {isAiSchedulerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* HEADER MODAL AI */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-md shadow-sky-500/20">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      Trợ Lý AI Gợi Ý Sắp Xếp Lịch Phòng Lab Chống Trùng
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      Đầu vào: Bảng Phân Công Chuyên Môn (Phần 3)
                    </span>
                  </div>
                  <p className="text-xs text-sky-200/90 mt-0.5">
                    Giáo viên: <strong className="text-white">{currentSelectedTeacher22.name}</strong> • Năm học:{" "}
                    <strong className="text-amber-300">{selectedSchoolYear}</strong> • Đối chiếu chống trùng trực tiếp trên toàn bộ{" "}
                    <strong className="text-emerald-300">6 Phòng Lab</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiSchedulerModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BODY CUỘN DỌC */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* 4 THẺ CHỈ SỐ TỔNG QUAN */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60">
                  <div className="text-[10px] font-bold uppercase text-sky-700 dark:text-sky-300">
                    Đầu vào từ Phần 3
                  </div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {assignedClassesFromSection3.length} lớp ({totalAssignedPeriodsFromSection3} tiết/tuần)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Phân công bởi Tổ trưởng ICT
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
                  <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                    Lịch đã xếp hiện tại
                  </div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {aiScheduleMode === "fill_missing" ? activeTeacherSlots22.length : 0} tiết giữ lại
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {aiScheduleMode === "fill_missing"
                      ? "Giữ nguyên các tiết đã có"
                      : "Xếp mới lại toàn bộ tuần"}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60">
                  <div className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300">
                    Tiết AI đề xuất thêm
                  </div>
                  <div className="text-base font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
                    {aiSuggestedSlots.filter((s) => s.selected).length} / {aiSuggestedSlots.length} tiết chọn
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Tự động phân bổ rải đều Thứ 2 - Thứ 6
                  </div>
                </div>

                {(() => {
                  const selectedWithConflicts = aiSuggestedSlots.filter(
                    (s) => s.selected && getAiSlotLiveConflict(s).hasConflict
                  );
                  const isAllClean = selectedWithConflicts.length === 0;
                  return (
                    <div
                      className={`p-3 rounded-2xl border ${
                        isAllClean
                          ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60"
                          : "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
                      }`}
                    >
                      <div
                        className={`text-[10px] font-bold uppercase ${
                          isAllClean ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        Kiểm tra 6 Phòng Lab
                      </div>
                      <div
                        className={`text-base font-black mt-0.5 flex items-center gap-1.5 ${
                          isAllClean ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isAllClean ? (
                          <>
                            <ShieldCheck className="w-4 h-4 shrink-0" />
                            <span>0 trùng lịch (100%)</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{selectedWithConflicts.length} tiết bị trùng</span>
                          </>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isAllClean
                          ? "Không đụng tiết bất kỳ lớp nào"
                          : "Vui lòng đổi tiết hoặc phòng Lab"}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* THANH CHỌN CHẾ ĐỘ XẾP LỊCH & NÚT TẠO LẠI */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-slate-700 dark:text-slate-200 text-xs">
                    Chế độ AI gợi ý:
                  </span>
                  <button
                    type="button"
                    onClick={() => generateAiLabScheduleSuggestions("fill_missing")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      aiScheduleMode === "fill_missing"
                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400"
                    }`}
                  >
                    1. Bổ sung các tiết còn thiếu (Giữ nguyên {activeTeacherSlots22.length} tiết đã xếp)
                  </button>
                  <button
                    type="button"
                    onClick={() => generateAiLabScheduleSuggestions("rebuild_all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      aiScheduleMode === "rebuild_all"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                    }`}
                  >
                    2. Xếp mới toàn bộ tuần theo Phân công Phần 3 ({totalAssignedPeriodsFromSection3} tiết)
                  </button>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => generateAiLabScheduleSuggestions(aiScheduleMode)}
                  className="font-bold text-xs h-8 px-3 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                  Tối ưu lại phương án
                </Button>
              </div>

              {/* DANH SÁCH LỚP ĐẦU VÀO TỪ PHẦN 3 & PHÒNG LAB TƯƠNG ỨNG */}
              {assignedClassesFromSection3.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-900 dark:text-amber-300 text-[11px] flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-amber-600" />
                      Chi tiết các lớp được Tổ trưởng phân công ở Phần 3 & Phòng Lab chỉ định:
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      AI tự động nhận diện Cơ sở & Khối lớp để gán đúng phòng Lab
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedClassesFromSection3.map((cls) => {
                      const req = Math.max(1, Number(cls.periods_per_week) || 2);
                      const existingCount =
                        aiScheduleMode === "fill_missing"
                          ? activeTeacherSlots22.filter((s) => isMatchingClassName(s.class_name, cls.name)).length
                          : 0;
                      const suggestedCount = aiSuggestedSlots.filter(
                        (s) => s.selected && isMatchingClassName(s.class_name, cls.name)
                      ).length;
                      const totalAfter = existingCount + suggestedCount;
                      const { primaryRoom } = resolveSmartLabRoomsForClass(cls);

                      return (
                        <div
                          key={`ai_p3_cls_${cls.id}`}
                          className={`px-2.5 py-1 rounded-xl border text-[11px] flex items-center gap-1.5 ${
                            totalAfter >= req
                              ? "bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800"
                              : "bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800"
                          }`}
                        >
                          <span className="font-extrabold text-slate-900 dark:text-white">{cls.name}</span>
                          <span className="text-[10px] px-1.5 py-0 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold">
                            {formatShortLabRoomName(primaryRoom)}
                          </span>
                          <span
                            className={`text-[10px] font-black ${
                              totalAfter >= req ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"
                            }`}
                          >
                            ({totalAfter}/{req} tiết)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BẢNG CHI TIẾT CÁC TIẾT ĐỀ XUẤT BỞI AI (CÓ THỂ TÙY CHỈNH TRỰC TIẾP) */}
              {assignedClassesFromSection3.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Giáo viên {currentSelectedTeacher22.name} chưa có lớp được phân công ở Phần 3
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                    Trợ lý AI sử dụng dữ liệu đầu vào từ <strong>Phần 3: Bảng Phân Công Chuyên Môn</strong> của Tổ trưởng. Vui lòng phân công lớp giảng dạy cho giáo viên ở Phần 3 trước khi chạy AI xếp lịch.
                  </p>
                </div>
              ) : aiSuggestedSlots.length === 0 ? (
                <div className="p-8 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Đã xếp đủ 100% số tiết theo Bảng Phân Công Chuyên Môn (Phần 3)!
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                    Tất cả {assignedClassesFromSection3.length} lớp ({totalAssignedPeriodsFromSection3} tiết/tuần) của{" "}
                    <strong>{currentSelectedTeacher22.name}</strong> đều đã được xếp đầy đủ trên thời khóa biểu. Nếu muốn AI sắp xếp lại từ đầu, Thầy/Cô có thể bấm chọn chế độ{" "}
                    <strong>"2. Xếp mới toàn bộ tuần theo Phân công Phần 3"</strong> ở phía trên.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                  <div className="px-3.5 py-2 bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={aiSuggestedSlots.length > 0 && aiSuggestedSlots.every((s) => s.selected)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAiSuggestedSlots((prev) => prev.map((item) => ({ ...item, selected: checked })));
                        }}
                        className="w-4 h-4 rounded accent-sky-600 cursor-pointer"
                      />
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                        Danh sách {aiSuggestedSlots.length} tiết học do AI đề xuất (Thầy/Cô có thể đổi Thứ, Tiết hoặc Phòng Lab trực tiếp bên dưới)
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300">
                      Đã chọn: {aiSuggestedSlots.filter((s) => s.selected).length} tiết
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-[340px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2 px-3 w-10 text-center">Chọn</th>
                          <th className="py-2 px-3">Lớp (Từ Phần 3)</th>
                          <th className="py-2 px-3">Thứ trong tuần</th>
                          <th className="py-2 px-3">Tiết học & Khung giờ</th>
                          <th className="py-2 px-3">Phòng Lab chỉ định</th>
                          <th className="py-2 px-3">Giải thích của AI & Kiểm tra chống trùng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {aiSuggestedSlots.map((item) => {
                          const liveConflict = getAiSlotLiveConflict(item);
                          return (
                            <tr
                              key={item.tempId}
                              className={`transition-colors ${
                                !item.selected
                                  ? "opacity-50 bg-slate-50/40 dark:bg-slate-900/40"
                                  : liveConflict.hasConflict
                                  ? "bg-rose-50/50 dark:bg-rose-950/30"
                                  : "hover:bg-sky-50/40 dark:hover:bg-sky-950/20"
                              }`}
                            >
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.selected}
                                  onChange={(e) =>
                                    handleUpdateAiSuggestedSlot(item.tempId, { selected: e.target.checked })
                                  }
                                  className="w-4 h-4 rounded accent-sky-600 cursor-pointer"
                                />
                              </td>

                              <td className="py-2 px-3">
                                <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                                  <span>Lớp {item.class_name}</span>
                                  <span className="px-1.5 py-0 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                    Tiết {item.periodIndex}/{item.totalPeriodsForClass}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {item.campus}
                                </div>
                              </td>

                              <td className="py-2 px-3">
                                <select
                                  value={item.day_of_week}
                                  onChange={(e) =>
                                    handleUpdateAiSuggestedSlot(item.tempId, {
                                      day_of_week: Number(e.target.value),
                                    })
                                  }
                                  className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                                >
                                  <option value={2}>Thứ Hai</option>
                                  <option value={3}>Thứ Ba</option>
                                  <option value={4}>Thứ Tư</option>
                                  <option value={5}>Thứ Năm</option>
                                  <option value={6}>Thứ Sáu</option>
                                </select>
                              </td>

                              <td className="py-2 px-3">
                                <select
                                  value={item.period}
                                  onChange={(e) =>
                                    handleUpdateAiSuggestedSlot(item.tempId, {
                                      period: Number(e.target.value),
                                    })
                                  }
                                  className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                                    <option key={`ai_p_opt_${p}`} value={p}>
                                      Tiết {p} ({PERIOD_TIMES[p]}) - {p <= 4 ? "Sáng" : "Chiều"}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="py-2 px-3">
                                <select
                                  value={item.room}
                                  onChange={(e) =>
                                    handleUpdateAiSuggestedSlot(item.tempId, {
                                      room: e.target.value,
                                    })
                                  }
                                  className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs font-bold text-sky-800 dark:text-sky-300"
                                >
                                  {SIX_LAB_ROOMS.map((lab) => (
                                    <option key={`ai_lab_opt_${lab.id}`} value={lab.name}>
                                      {lab.shortName} ({lab.campus})
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="py-2 px-3">
                                {liveConflict.hasConflict ? (
                                  <div className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{liveConflict.message}</span>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <div className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                      <span>{liveConflict.message}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {item.reason}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER: NGUYÊN TẮC KIỂM CHỨNG CON NGƯỜI & NÚT PHÊ DUYỆT */}
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-start sm:items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  <strong>Cơ chế Kiểm chứng Con người:</strong> AI gợi ý phương án tối ưu chống trùng từ Bảng phân công Phần 3; lịch chỉ được áp dụng khi Thầy/Cô bấm <strong>Phê duyệt & Lưu</strong>.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAiSchedulerModalOpen(false)}
                  className="font-bold text-xs h-9 px-4"
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyAiSchedule}
                  disabled={
                    isApplyingAiSchedule ||
                    aiSuggestedSlots.filter((s) => s.selected).length === 0 ||
                    aiSuggestedSlots.some((s) => s.selected && getAiSlotLiveConflict(s).hasConflict)
                  }
                  className="font-bold text-xs h-9 px-5 bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-500 hover:via-indigo-500 hover:to-sky-600 text-white border-0 shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  {isApplyingAiSchedule ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Đang Lưu Lịch Phòng Lab...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Phê duyệt & Lưu {aiSuggestedSlots.filter((s) => s.selected).length} tiết vào Lịch Phòng Lab
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
