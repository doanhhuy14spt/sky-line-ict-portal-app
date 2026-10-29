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
  ShieldAlert
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
    role: "leader" | "teacher";
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

  // =========================================================================
  // TẢI DỮ LIỆU TỪ SUPABASE
  // =========================================================================

  // Tải dữ liệu TKB nhà trường (Phần 2.1) theo Năm học đang chọn
  const loadSchoolAssignedData = async () => {
    setIsLoadingSchool(true);
    try {
      const { data, error } = await supabase
        .from("school_assigned_timetables")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("day_of_week", { ascending: true })
        .order("period", { ascending: true });

      if (error) {
        console.error("Lỗi tải TKB phân công nhà trường:", error);
      } else {
        setAssignedSlots((data as SchoolAssignedSlot[]) || []);
      }
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
    setSlotModalMode("edit");
    setEditingSlotId(slot.id);
    setIsSlotModalOpen(true);
  };

  // Lưu tiết dạy vào Supabase teacher_timetables
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
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
      showToast(err.message || "Lỗi khi lưu vào cơ sở dữ liệu!", "warning");
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
  // RENDER ROW CHO PHẦN 2.2
  // =========================================================================
  const renderSelfManagedRow = (period: number, defaultTime: string) => {
    return (
      <tr key={`self_tt_row_${period}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
        {/* CỘT 1: TIẾT VÀ GIỜ */}
        <td className="p-3 text-center bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 w-32 shrink-0">
          <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Tiết {period}</div>
          <div className="text-[10px] text-slate-500 font-medium">{defaultTime}</div>
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
              className={`p-2 transition-all border border-slate-100 dark:border-slate-800/60 relative group w-1/5 overflow-hidden align-top ${
                isToday ? "bg-amber-50/20 dark:bg-amber-950/20" : ""
              }`}
            >
              {slot ? (
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-white via-amber-50/40 to-amber-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all space-y-1.5 relative w-full overflow-hidden">
                  {/* 1. TÊN LỚP */}
                  <div className="font-extrabold text-slate-900 dark:text-white text-xs tracking-wide truncate">
                    Lớp: {slot.class_name}
                  </div>

                  {/* 2. PHÒNG LAB (RÚT GỌN TÊN: BỎ "Phòng Lab Sky-Line") */}
                  <div
                    className="flex items-center gap-1.5 text-[10.5px] font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/70 px-2 py-0.5 rounded-lg truncate shadow-2xs w-full min-w-0"
                    title={slot.room}
                  >
                    <Laptop className="w-3 h-3 text-sky-500 shrink-0" />
                    <span className="truncate">{formatShortLabRoomName(slot.room)}</span>
                  </div>

                  {/* NÚT THAO TÁC SỬA / XÓA - CHỈ HIỂN THỊ NẾU CÓ QUYỀN CHỈNH SỬA (canEdit) */}
                  {canEdit && (
                    <div className="pt-1.5 border-t border-amber-200/50 dark:border-amber-900/40 flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSlot(slot)}
                        className="p-1 rounded-lg hover:bg-amber-200/60 dark:hover:bg-amber-900/60 text-slate-600 dark:text-slate-300 hover:text-amber-800 transition-colors"
                        title="Sửa tiết dạy này"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmSlot(slot)}
                        className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 hover:text-rose-700 transition-colors"
                        title="Xóa tiết dạy này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ) : canEdit ? (
                <div
                  onClick={() => handleOpenAddSlot(dayNum, period)}
                  className="h-16 rounded-2xl border border-dashed border-slate-200/70 dark:border-slate-800/60 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 p-1 select-none group/empty w-full"
                >
                  <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600 group-hover/empty:text-amber-600 dark:group-hover/empty:text-amber-400 transition-colors flex items-center gap-1">
                    <PlusCircle className="w-3.5 h-3.5 opacity-60 group-hover/empty:opacity-100" />
                    Xếp tiết
                  </span>
                  {schoolHint && (
                    <span className="text-[9px] text-amber-600/80 dark:text-amber-400/80 font-medium truncate max-w-full">
                      💡 TKB: {schoolHint.class_name}
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-16 rounded-2xl border border-dashed border-slate-100 dark:border-slate-800/40 flex items-center justify-center text-xs text-slate-300 dark:text-slate-600 select-none cursor-default bg-slate-50/20 dark:bg-slate-900/10 w-full">
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* THANH ĐIỀU HƯỚNG 2 PHẦN CON: PHẦN 2.1 & PHẦN 2.2                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveSubTab("2.1")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Phần 2.1: Xem TKB Cá Nhân Theo TKB Nhà Trường
                    <Badge variant="amber" className="text-[11px] font-bold">
                      TKB Toàn Trường
                    </Badge>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Nhập tên giáo viên để tra cứu lịch giảng dạy từ Thứ 2 đến Thứ 6 (Tiết 1 đến Tiết 8) theo thời khóa biểu nhà trường.
                  </p>
                </div>
              </div>

              {/* NÚT IMPORT EXCEL & LÀM MỚI */}
              <div className="flex flex-wrap items-center gap-2">
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
                  className="font-bold text-xs shadow-md shadow-amber-500/20"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Đang Import TKB...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 mr-1.5" />
                      Import File TKB Nhà Trường (.xlsx)
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadSchoolAssignedData}
                  disabled={isLoadingSchool}
                  className="font-bold text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoadingSchool ? "animate-spin" : ""}`} />
                  Làm Mới
                </Button>

                {selectedTeacher21 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="font-bold text-xs"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1 text-slate-600 dark:text-slate-400" />
                    In TKB (PDF)
                  </Button>
                )}
              </div>
            </div>

            {/* Ô TÌM KIẾM GIÁO VIÊN & GỢI Ý */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="relative max-w-xl">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Nhập tên giáo viên cần tra cứu (ví dụ: Tuấn ICT, Linh ICT, Huy ICT, Yến ICT...)"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!e.target.value.trim()) {
                      setSelectedTeacher21("");
                    }
                  }}
                  className="pl-10 pr-9 text-xs h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 font-semibold focus:ring-2 focus:ring-amber-500/20"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeacher21("");
                      setSearchTerm("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {filteredTeacherSuggestions21.length > 0 && selectedTeacher21 !== searchTerm && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-56 overflow-y-auto space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
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
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center justify-between"
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
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Giáo viên Tổ Chuyên Môn ICT (Đối chiếu TKB):
                </span>
                {OFFICIAL_ICT_TEACHERS_MAPPINGS.map((mapping) => {
                  const isSelected =
                    selectedTeacher21.toLowerCase() === mapping.fileKeyName.toLowerCase() ||
                    selectedTeacher21.toLowerCase() === mapping.officialName.toLowerCase();

                  // Đếm tổng số tiết khớp trong assignedSlots
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
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-amber-500 text-white border-amber-500 shadow-xs shadow-amber-500/30 scale-105"
                          : "bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60"
                      }`}
                      title={`${mapping.officialName} ➔ Tên trong file: "${mapping.fileKeyName}"`}
                    >
                      <span>{mapping.fileKeyName}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
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

            {/* THẺ TÓM TẮT GIÁO VIÊN ĐANG CHỌN */}
            {selectedTeacher21 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-200/90 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-amber-500/25">
                    {selectedTeacher21.charAt(0)}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <span>Giáo Viên: {selectedTeacher21}</span>
                      <Badge variant="amber" className="text-[10px] font-bold">
                        {teacherStats21.total} Tiết / Tuần
                      </Badge>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 flex flex-wrap items-center gap-2">
                      <span>Buổi sáng: <strong>{teacherStats21.morning} tiết</strong></span>
                      <span>•</span>
                      <span>Buổi chiều: <strong>{teacherStats21.afternoon} tiết</strong></span>
                      <span>•</span>
                      <span className="truncate max-w-xs">
                        Các lớp: <strong>{teacherStats21.classes.join(", ") || "Chưa có"}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedTeacher21("");
                    setSearchTerm("");
                  }}
                  className="text-slate-500 hover:text-slate-800 text-xs self-start sm:self-auto"
                >
                  Đổi giáo viên khác
                </Button>
              </div>
            )}
          </div>

          {/* LƯỚI THỜI KHÓA BIỂU PHẦN 2.1 (THỨ 2 -> THỨ 6 • TIẾT 1 -> 8) */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs border-collapse min-w-[900px] table-fixed">
              <colgroup>
                <col className="w-32" style={{ width: "128px" }} />
                <col style={{ width: "calc((100% - 128px) / 5)" }} />
                <col style={{ width: "calc((100% - 128px) / 5)" }} />
                <col style={{ width: "calc((100% - 128px) / 5)" }} />
                <col style={{ width: "calc((100% - 128px) / 5)" }} />
                <col style={{ width: "calc((100% - 128px) / 5)" }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5 font-bold w-32 text-center bg-slate-200/60 dark:bg-slate-800">
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
                        className={`p-3.5 font-bold text-center w-1/5 ${
                          isToday
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-x border-amber-200 dark:border-amber-800"
                            : ""
                        }`}
                      >
                        {d.label} {isToday && <span className="text-[10px] font-normal block text-amber-600">(Hôm nay)</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {!selectedTeacher21 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-14 h-14 rounded-3xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 mx-auto flex items-center justify-center border border-amber-200/80 dark:border-amber-800">
                          <Search className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                            Chưa chọn giáo viên
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Toàn bộ ô lưới đang để trống. Thầy/Cô vui lòng <strong>nhập tên giáo viên</strong> vào ô tìm kiếm ở trên hoặc <strong>bấm vào thẻ tên giáo viên</strong> để xem lịch giảng dạy chi tiết.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr className="bg-amber-50/70 dark:bg-amber-950/40 border-y border-amber-200/80 dark:border-amber-900/60">
                      <td colSpan={6} className="px-4 py-2 font-black text-amber-900 dark:text-amber-300 text-xs tracking-wide">
                        <span className="inline-flex items-center gap-2">
                          <SunMedium className="w-4 h-4 text-amber-500" />
                          BUỔI SÁNG (08:00 - 11:25 • 4 TIẾT)
                        </span>
                      </td>
                    </tr>

                    {[1, 2].map((p) => {
                      return (
                        <tr key={`r21_${p}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 text-center bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 w-36">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Tiết {p}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{PERIOD_TIMES[p]}</div>
                          </td>
                          {[2, 3, 4, 5, 6].map((dayNum) => {
                            const slot = slotMap21.get(`${dayNum}_${p}`);
                            return (
                              <td key={`c21_${dayNum}_${p}`} className="p-2 border border-slate-100 dark:border-slate-800/60">
                                {slot ? (
                                  <div className="p-3 rounded-2xl bg-gradient-to-br from-white via-amber-50/40 to-amber-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs space-y-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${getSubjectBadgeStyle(slot.subject)}`}>
                                        {slot.subject || "Tiết dạy"}
                                      </span>
                                      {slot.room && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-sky-100 text-sky-700 truncate max-w-[70px]">
                                          {slot.room}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-black text-slate-900 dark:text-white text-xs">Lớp: {slot.class_name}</div>
                                  </div>
                                ) : (
                                  <div className="h-16 rounded-2xl border border-dashed border-slate-200/60 dark:border-slate-800/50 flex items-center justify-center text-xs text-slate-300 select-none">-</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-[11px] italic">
                      <td className="p-2 text-center bg-slate-100 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800 font-semibold">09:35 - 09:50</td>
                      <td colSpan={5} className="p-2 text-center">
                        <span className="inline-flex items-center gap-1.5"><Coffee className="w-3.5 h-3.5 text-amber-500" /> Giờ ra chơi & sinh hoạt giữa giờ (15 phút)</span>
                      </td>
                    </tr>

                    {[3, 4].map((p) => {
                      return (
                        <tr key={`r21_${p}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 text-center bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 w-36">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Tiết {p}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{PERIOD_TIMES[p]}</div>
                          </td>
                          {[2, 3, 4, 5, 6].map((dayNum) => {
                            const slot = slotMap21.get(`${dayNum}_${p}`);
                            return (
                              <td key={`c21_${dayNum}_${p}`} className="p-2 border border-slate-100 dark:border-slate-800/60">
                                {slot ? (
                                  <div className="p-3 rounded-2xl bg-gradient-to-br from-white via-amber-50/40 to-amber-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs space-y-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${getSubjectBadgeStyle(slot.subject)}`}>
                                        {slot.subject || "Tiết dạy"}
                                      </span>
                                      {slot.room && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-sky-100 text-sky-700 truncate max-w-[70px]">
                                          {slot.room}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-black text-slate-900 dark:text-white text-xs">Lớp: {slot.class_name}</div>
                                  </div>
                                ) : (
                                  <div className="h-16 rounded-2xl border border-dashed border-slate-200/60 dark:border-slate-800/50 flex items-center justify-center text-xs text-slate-300 select-none">-</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs font-bold border-y-2 border-slate-200 dark:border-slate-700">
                      <td className="p-2.5 text-center bg-slate-200/70 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">11:25 - 13:15</td>
                      <td colSpan={5} className="p-2.5 text-center">🍱 NGHỈ TRƯA, ĂN BÁN TRÚ & NGHỈ NGƠI TẠI TRƯỜNG</td>
                    </tr>

                    <tr className="bg-indigo-50/70 dark:bg-indigo-950/40 border-y border-indigo-200/80 dark:border-indigo-900/60">
                      <td colSpan={6} className="px-4 py-2 font-black text-indigo-900 dark:text-indigo-300 text-xs tracking-wide">
                        <span className="inline-flex items-center gap-2">
                          <Sunset className="w-4 h-4 text-orange-500" />
                          BUỔI CHIỀU (13:15 - 16:40 • 4 TIẾT)
                        </span>
                      </td>
                    </tr>

                    {[5, 6].map((p) => {
                      return (
                        <tr key={`r21_${p}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 text-center bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 w-36">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Tiết {p}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{PERIOD_TIMES[p]}</div>
                          </td>
                          {[2, 3, 4, 5, 6].map((dayNum) => {
                            const slot = slotMap21.get(`${dayNum}_${p}`);
                            return (
                              <td key={`c21_${dayNum}_${p}`} className="p-2 border border-slate-100 dark:border-slate-800/60">
                                {slot ? (
                                  <div className="p-3 rounded-2xl bg-gradient-to-br from-white via-amber-50/40 to-amber-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs space-y-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${getSubjectBadgeStyle(slot.subject)}`}>
                                        {slot.subject || "Tiết dạy"}
                                      </span>
                                      {slot.room && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-sky-100 text-sky-700 truncate max-w-[70px]">
                                          {slot.room}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-black text-slate-900 dark:text-white text-xs">Lớp: {slot.class_name}</div>
                                  </div>
                                ) : (
                                  <div className="h-16 rounded-2xl border border-dashed border-slate-200/60 dark:border-slate-800/50 flex items-center justify-center text-xs text-slate-300 select-none">-</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-[11px] italic">
                      <td className="p-2 text-center bg-slate-100 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800 font-semibold">14:50 - 15:05</td>
                      <td colSpan={5} className="p-2 text-center">
                        <span className="inline-flex items-center gap-1.5"><Coffee className="w-3.5 h-3.5 text-amber-500" /> Giờ ăn xế & giải lao chiều (15 phút)</span>
                      </td>
                    </tr>

                    {[7, 8].map((p) => {
                      return (
                        <tr key={`r21_${p}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 text-center bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 w-36">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Tiết {p}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{PERIOD_TIMES[p]}</div>
                          </td>
                          {[2, 3, 4, 5, 6].map((dayNum) => {
                            const slot = slotMap21.get(`${dayNum}_${p}`);
                            return (
                              <td key={`c21_${dayNum}_${p}`} className="p-2 border border-slate-100 dark:border-slate-800/60">
                                {slot ? (
                                  <div className="p-3 rounded-2xl bg-gradient-to-br from-white via-amber-50/40 to-amber-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 shadow-2xs space-y-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${getSubjectBadgeStyle(slot.subject)}`}>
                                        {slot.subject || "Tiết dạy"}
                                      </span>
                                      {slot.room && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-sky-100 text-sky-700 truncate max-w-[70px]">
                                          {slot.room}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-black text-slate-900 dark:text-white text-xs">Lớp: {slot.class_name}</div>
                                  </div>
                                ) : (
                                  <div className="h-16 rounded-2xl border border-dashed border-slate-200/60 dark:border-slate-800/50 flex items-center justify-center text-xs text-slate-300 select-none">-</div>
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
        <div className="space-y-6">
          {/* KHUNG TIÊU ĐỀ & CHỌN GIÁO VIÊN */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shadow-xs">
                  <Users className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Phần 2.2: Lịch Giảng Dạy Của Từng Giáo Viên
                    <Badge variant="amber" className="text-[11px] font-bold">
                      Tự Nhập & Quản Lý Cá Nhân
                    </Badge>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mỗi giáo viên tự xếp lịch giảng dạy theo <strong>danh sách lớp phân công ở Phần 3</strong> và bấm nút{" "}
                    <strong>"Tự Động Điền Từ TKB Trường"</strong> để nạp ngay các tiết học chính xác từ Phần 2.1.
                  </p>
                </div>
              </div>

              {/* NÚT THAO TÁC NHANH: CHỈ HIỂN THỊ NẾU CÓ QUYỀN CHỈNH SỬA (canEdit) */}
              <div className="flex flex-wrap items-center gap-2">
                {canEdit ? (
                  <>
                    <Button
                      size="sm"
                      variant="amber"
                      onClick={() => handleOpenAddSlot(2, 1)}
                      className="font-bold text-xs shadow-md shadow-amber-500/20"
                    >
                      <PlusCircle className="w-4 h-4 mr-1.5" />
                      + Xếp Tiết Giảng Dạy Mới
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAutoSyncFromSchoolSchedule}
                      disabled={isSyncingFromSchool}
                      className="font-bold text-xs hover:border-amber-400 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30"
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
                      className="font-bold text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      title="Xóa trắng lịch tuần này để xếp lại"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Xóa Lịch Tuần
                    </Button>
                  </>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs">
                    <Eye className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Chế độ xem lịch đồng nghiệp (Chỉ đọc)</span>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="font-bold text-xs"
                >
                  <Printer className="w-3.5 h-3.5 mr-1 text-slate-600 dark:text-slate-400" />
                  In TKB (PDF)
                </Button>
              </div>
            </div>

            {/* BỘ CHỌN 8 GIÁO VIÊN DẠNG THẺ (DÀNH CHO TỔ TRƯỞNG & THẦY CÔ CHUYỂN ĐỔI) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  Chọn tài khoản giáo viên để xem & xếp lịch giảng dạy:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                    Đang xem: <strong>{currentSelectedTeacher22.name}</strong>{" "}
                    (Tên TKB: <strong className="text-sky-600 dark:text-sky-400">{teacherMappingConfig22?.fileKeyName}</strong>)
                  </span>
                  {canEdit ? (
                    <Badge variant="emerald" className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {isLeader ? "Quyền Tổ Trưởng" : "Lịch của bạn (Tự xếp lớp)"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-amber-500" />
                      Lịch đồng nghiệp (Chỉ xem)
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {teachersList.map((t) => {
                  const isSelected = selectedTeacherId22 === t.id;
                  const slotCount = teacherTimetableSlots.filter(
                    (s) => s.teacher_id === t.id || s.teacher_name === t.name
                  ).length;

                  // Kiểm tra có phải chính là tài khoản đang đăng nhập không
                  const isThisTeacher = currentUserProfile?.id === t.id ||
                    (currentUserProfile?.name && t.name && (
                      currentUserProfile.name.toLowerCase().includes(t.name.replace(/^(Thầy|Cô)\s+/i, "").toLowerCase()) ||
                      t.name.toLowerCase().includes(currentUserProfile.name.replace(/^(Thầy|Cô)\s+/i, "").toLowerCase())
                    ));

                  // Lấy tên quy chuẩn trong file
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
                      className={`p-2.5 rounded-2xl text-left transition-all border cursor-pointer relative ${
                        isSelected
                          ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/25 scale-[1.02]"
                          : "bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {/* Huy hiệu tài khoản của tôi */}
                      {isThisTeacher && (
                        <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-md bg-emerald-500 text-white text-[8px] font-black uppercase shadow-xs">
                          Của tôi
                        </span>
                      )}

                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
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
                      <div className="font-extrabold text-xs line-clamp-1 leading-snug flex items-center gap-1">
                        {!isThisTeacher && !isLeader && <Eye className="w-2.5 h-2.5 text-slate-400 shrink-0" />}
                        <span>{(t.name || "").split("(")[0].replace("Thầy ", "").replace("Cô ", "")}</span>
                      </div>
                      <div
                        className={`text-[9px] truncate ${
                          isSelected ? "text-amber-100" : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {t.campus || "Sky-Line"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* THẺ TỔNG QUAN PHÂN CÔNG TỪ PHẦN 3 & TIẾN ĐỘ XẾP LỊCH */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-200/90 dark:border-amber-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1.5">
                <div className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span>Hồ Sơ: {currentSelectedTeacher22.name}</span>
                  <Badge variant="amber" className="text-[10px] font-bold">
                    Tên TKB: {teacherMappingConfig22?.fileKeyName || "ICT"}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    {currentSelectedTeacher22.campus}
                  </Badge>
                </div>
                <div className="text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2 text-[11px]">
                  <span>Chuyên môn: <strong>{currentSelectedTeacher22.specialty}</strong></span>
                </div>

                {/* DANH SÁCH LỚP PHÂN CÔNG TỪ PHẦN 3 */}
                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Lớp được phân công (Phần 3):
                  </span>
                  {assignedClassesFromSection3.length > 0 ? (
                    assignedClassesFromSection3.map((cls) => (
                      <span
                        key={`assigned_c3_${cls.id}`}
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-[10px] font-extrabold text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-amber-800 shadow-2xs"
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
              </div>

              {/* KHỐI TIẾN ĐỘ ĐÃ XẾP */}
              <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                <div className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-center shadow-xs">
                  <span className="text-[10px] text-slate-500 block">Tiết Đã Xếp / Phân Công</span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-base font-black text-amber-600 dark:text-amber-400">
                      {activeTeacherSlots22.length}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      / {totalAssignedPeriodsFromSection3 || 21} tiết
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LƯỚI THỜI KHÓA BIỂU PHẦN 2.2 (THỨ 2 -> THỨ 6 • TIẾT 1 -> 8) */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs border-collapse min-w-[900px] table-fixed">
              <colgroup>
                <col className="w-32" style={{ width: "128px" }} />
                <col style={{ width: "calc((100% - 128px) / 5)" }} />
                <col style={{ width: "calc((100% - 128px) / 5)" }} />
                <col style={{ width: "calc((100% - 128px) / 5)" }} />
                <col style={{ width: "calc((100% - 128px) / 5)" }} />
                <col style={{ width: "calc((100% - 128px) / 5)" }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5 font-bold w-32 text-center bg-slate-200/60 dark:bg-slate-800">
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
                        className={`p-3.5 font-bold text-center w-1/5 ${
                          isToday
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-x border-amber-200 dark:border-amber-800"
                            : ""
                        }`}
                      >
                        {d.label} {isToday && <span className="text-[10px] font-normal block text-amber-600">(Hôm nay)</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* BUỔI SÁNG (TIẾT 1 -> 4) */}
                <tr className="bg-amber-50/70 dark:bg-amber-950/40 border-y border-amber-200/80 dark:border-amber-900/60">
                  <td colSpan={6} className="px-4 py-2 font-black text-amber-900 dark:text-amber-300 text-xs tracking-wide">
                    <span className="inline-flex items-center gap-2">
                      <SunMedium className="w-4 h-4 text-amber-500" />
                      BUỔI SÁNG (08:00 - 11:25 • 4 TIẾT)
                    </span>
                  </td>
                </tr>

                {[1, 2].map((p) => renderSelfManagedRow(p, PERIOD_TIMES[p]))}

                {/* NGHỈ GIẢI LAO SÁNG */}
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-[11px] italic">
                  <td className="p-2 text-center bg-slate-100 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800 font-semibold">09:35 - 09:50</td>
                  <td colSpan={5} className="p-2 text-center">
                    <span className="inline-flex items-center gap-1.5"><Coffee className="w-3.5 h-3.5 text-amber-500" /> Giờ ra chơi & sinh hoạt giữa giờ (15 phút)</span>
                  </td>
                </tr>

                {[3, 4].map((p) => renderSelfManagedRow(p, PERIOD_TIMES[p]))}

                {/* NGHỈ TRƯA & BÁN TRÚ */}
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs font-bold border-y-2 border-slate-200 dark:border-slate-700">
                  <td className="p-2.5 text-center bg-slate-200/70 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">11:25 - 13:15</td>
                  <td colSpan={5} className="p-2.5 text-center">🍱 NGHỈ TRƯA, ĂN BÁN TRÚ & NGHỈ NGƠI TẠI TRƯỜNG</td>
                </tr>

                {/* BUỔI CHIỀU (TIẾT 5 -> 8) */}
                <tr className="bg-indigo-50/70 dark:bg-indigo-950/40 border-y border-indigo-200/80 dark:border-indigo-900/60">
                  <td colSpan={6} className="px-4 py-2 font-black text-indigo-900 dark:text-indigo-300 text-xs tracking-wide">
                    <span className="inline-flex items-center gap-2">
                      <Sunset className="w-4 h-4 text-orange-500" />
                      BUỔI CHIỀU (13:15 - 16:40 • 4 TIẾT)
                    </span>
                  </td>
                </tr>

                {[5, 6].map((p) => renderSelfManagedRow(p, PERIOD_TIMES[p]))}

                {/* NGHỈ GIẢI LAO CHIỀU */}
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-[11px] italic">
                  <td className="p-2 text-center bg-slate-100 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800 font-semibold">14:50 - 15:05</td>
                  <td colSpan={5} className="p-2 text-center">
                    <span className="inline-flex items-center gap-1.5"><Coffee className="w-3.5 h-3.5 text-amber-500" /> Giờ ăn xế & giải lao chiều (15 phút)</span>
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
                  onChange={(e) => setSlotFormData({ ...slotFormData, room: e.target.value })}
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
    </div>
  );
}
