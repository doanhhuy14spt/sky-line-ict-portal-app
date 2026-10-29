"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  School,
  Calendar,
  Clock,
  Laptop,
  Bot,
  Users,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Moon,
  Sun,
  Layers,
  Sparkles,
  MapPin,
  PlusCircle,
  Check,
  ChevronRight,
  ShieldCheck,
  Cpu,
  X,
  Printer,
  Trash2,
  Info,
  Building2,
  SunMedium,
  Sunset,
  Coffee,
  GraduationCap,
  Eye,
  RefreshCw,
  Pencil,
  Phone,
  Mail,
  Briefcase,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UserNav } from "@/components/user-nav";
import { createClient } from "@/lib/supabase/client";
import { LAB_ROOMS, INITIAL_LAB_TIMETABLES, LabSlot } from "@/data/lab-timetables";
import { TEACHER_TIMETABLES, TeacherTimetableProfile, TeacherSlot } from "@/data/teacher-timetables";
import { TeachingAssignmentSection, ClassItem } from "@/components/teaching-assignment-section";
import { TeacherAssignedScheduleSection } from "@/components/teacher-assigned-schedule-section";
import { LabDevicesSection } from "@/components/lab-devices-section";
import { AssignedTasksSection } from "@/components/assigned-tasks-section";
import { TrainingTeamsSection } from "@/components/training-teams-section";
import { AchievementsSection, AchievementItem } from "@/components/achievements-section";
import { OverviewSection } from "@/components/overview-section";
import { SiteFooter } from "@/components/site-footer";
import { NotificationBell } from "@/components/notification-bell";

interface TimetableSlot {
  id: string;
  day: number;
  period: number;
  time: string;
  className: string;
  teacher: string;
  subject: string;
  room: string;
  campusId: string;
  topic?: string;
}

interface DeviceItem {
  id: string;
  name: string;
  category: "robotics" | "computers" | "lab_room" | "accessories";
  campusId: string;
  campusName: string;
  room: string;
  manager: string;
  quantity: string;
  status: "good" | "in_use" | "needs_maintenance" | "broken";
  notes?: string;
}

interface TaskItem {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  priority: "urgent" | "important" | "normal";
  status: "todo" | "in_progress" | "waiting_approval" | "completed";
}

export default function DashboardPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState("all");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("2026-2027");
  const [selectedLab, setSelectedLab] = useState<string>("riverside_primary"); // Mặc định: Sky-Line Riverside Tiểu Học
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<"all" | "morning" | "afternoon">("all");
  const [timetableSubTab, setTimetableSubTab] = useState<"lab_view" | "teacher_view" | "assignment_view">("lab_view"); // 3 phần: Lịch Lab, TKB giáo viên & Phân công chuyên môn
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("huy"); // Mặc định: Thầy Quốc Huy (Tổ trưởng)
  const [activeTab, setActiveTab] = useState<"dashboard" | "timetable" | "devices" | "tasks" | "teams" | "achievements" | "teachers">("dashboard");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "warning" | "info" } | null>(null);
  const [isLoadingTab, setIsLoadingTab] = useState(false);

  // --- STATE DANH SÁCH LỚP HỌC & PHÂN CÔNG CHUYÊN MÔN (PHẦN 3) ---
  const [classesList, setClassesList] = useState<ClassItem[]>([]);

  // --- STATE DANH SÁCH THÀNH TÍCH THEO NĂM HỌC (ĐỒNG BỘ SANG TAB NHÂN SỰ ICT) ---
  const [teacherAchievementsList, setTeacherAchievementsList] = useState<AchievementItem[]>([]);

  // --- STATE THỜI KHÓA BIỂU (Làm sạch ô trống, sẵn sàng để xếp mới) ---
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [teacherTimetablesList, setTeacherTimetablesList] = useState<TeacherTimetableProfile[]>(
    TEACHER_TIMETABLES.map((p) => ({ ...p, totalSlots: 0, slots: [] }))
  );
  // Dữ liệu thời khóa biểu gốc từ bảng teacher_timetables (đồng bộ trực tiếp từ Phần 2.2 sang Phần 1)
  const [rawTeacherTimetables, setRawTeacherTimetables] = useState<any[]>([]);
  const [isLoadingLabSchedule, setIsLoadingLabSchedule] = useState<boolean>(false);

  // Hàm đối chiếu chuẩn xác một tiết dạy trong teacher_timetables có thuộc về phòng Lab chỉ định hay không
  const isSlotInLabRoom = (room: string | undefined, labId: string): boolean => {
    if (!room) return false;
    const r = room.toLowerCase().trim();
    switch (labId) {
      case "riverside_primary":
        return (
          r.includes("tiểu học") ||
          r.includes("cs1-th") ||
          (r.includes("riverside") && !r.includes("trung học"))
        );
      case "riverside_secondary":
        return (
          r.includes("trung học") ||
          r.includes("cs1-trh")
        );
      case "central":
        return r.includes("central") || r.includes("cs2");
      case "global":
        return r.includes("global") || r.includes("quốc tế") || r.includes("cs3");
      case "hill":
        return r.includes("hill") || r.includes("cs4");
      case "beach":
        return r.includes("beach") || r.includes("cs5");
      default:
        return false;
    }
  };

  const [filterTeacher, setFilterTeacher] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");

  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [selectedSlotForEdit, setSelectedSlotForEdit] = useState<{ day: number; period: number; labId?: string } | null>(null);
  const [slotForm, setSlotForm] = useState({
    className: "Lớp 3/1",
    teacher: "Thầy Quốc Huy",
    subject: "Robotics STEM",
    room: "Sky-Line Riverside Tiểu Học",
    labId: "riverside_primary",
    campusId: "riverside",
    topic: "",
  });
  const [isSubmittingSlot, setIsSubmittingSlot] = useState(false);
  const [slotConflictWarning, setSlotConflictWarning] = useState<string | null>(null);

  // --- STATE KANBAN ---
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("Thầy Nguyễn Hoàng Nam");
  const [newTaskDeadline, setNewTaskDeadline] = useState("30/10/2026");
  const [newTaskPriority, setNewTaskPriority] = useState<"urgent" | "important" | "normal">("normal");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);


  // --- SUPABASE CLIENT & CURRENT USER PROFILE ---
  const supabase = createClient();
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    id: string;
    email: string;
    name: string;
    role: "leader" | "teacher" | "guest";
    campus: string;
  }>({
    id: "a0000001-0000-0000-0000-000000000001",
    email: "huyda@skylineschool.edu.vn",
    name: "Thầy Đỗ Anh Huy",
    role: "leader",
    campus: "Sky-Line Riverside (Bao quát 5 cơ sở)",
  });

  // Kiểm tra vai trò tài khoản: Tổ trưởng chuyên môn mới có quyền truy cập Phần 3
  const isLeader = currentUserProfile?.role === "leader";

  // Phân quyền bảo vệ: Nếu là giáo viên thì tự động chuyển khỏi Phần 3
  useEffect(() => {
    if (currentUserProfile && currentUserProfile.role !== "leader" && timetableSubTab === "assignment_view") {
      setTimetableSubTab("teacher_view");
    }
  }, [currentUserProfile?.role, timetableSubTab]);

  // Danh bạ giáo viên (Profiles) từ Supabase
  const [teachersList, setTeachersList] = useState([
    {
      id: "a0000001-0000-0000-0000-000000000001",
      name: "Thầy Đỗ Anh Huy",
      email: "huyda@skylineschool.edu.vn",
      phone: "",
      campusId: "all",
      campus: "Bao quát 5 Cơ sở",
      roleCode: "leader" as "leader" | "teacher",
      role: "Tổ trưởng chuyên môn",
      specialty: "Quản trị hệ thống, Huấn luyện HSG Robotics Quốc Tế",
      lab: "Quản trị toàn bộ 6 phòng Lab",
    },
    {
      id: "a0000001-0000-0000-0000-000000000002",
      name: "Thầy Đồng Nguyên Tuấn",
      email: "tuandn@skylineschool.edu.vn",
      phone: "",
      campusId: "riverside",
      campus: "Sky-Line Riverside",
      roleCode: "teacher" as "leader" | "teacher",
      role: "Giáo viên",
      specialty: "Robotics Lego Spike Prime & STEM Trung học",
      lab: "Phòng Lab Sky-Line Riverside Trung Học",
    },
    {
      id: "a0000001-0000-0000-0000-000000000003",
      name: "Cô Đào Thị Mỹ Linh",
      email: "linhdtm@skylineschool.edu.vn",
      phone: "",
      campusId: "riverside",
      campus: "Sky-Line Riverside",
      roleCode: "teacher" as "leader" | "teacher",
      role: "Giáo viên",
      specialty: "Tin Học Tiểu Học & Lập Trình Scratch",
      lab: "Phòng Lab Sky-Line Riverside Tiểu Học",
    },
    {
      id: "a0000001-0000-0000-0000-000000000004",
      name: "Cô Lương Thị Ngọc Ánh",
      email: "anhltn@skylineschool.edu.vn",
      phone: "",
      campusId: "international",
      campus: "Sky-Line Global",
      roleCode: "teacher" as "leader" | "teacher",
      role: "Giáo viên",
      specialty: "Tin Học Song Ngữ & Ứng Dụng AI Giáo Dục",
      lab: "Phòng Lab Sky-Line Global",
    },
    {
      id: "a0000001-0000-0000-0000-000000000005",
      name: "Cô Nguyễn Thị Mỹ Tâm",
      email: "tamntm@skylineschool.edu.vn",
      phone: "",
      campusId: "international",
      campus: "Sky-Line Global",
      roleCode: "teacher" as "leader" | "teacher",
      role: "Giáo viên",
      specialty: "Tin Học Quốc Tế Cambridge IGCSE & Computer Science",
      lab: "Phòng Lab Sky-Line Global",
    },
    {
      id: "a0000001-0000-0000-0000-000000000006",
      name: "Cô Trịnh Thị Đăng",
      email: "dangtt@skylineschool.edu.vn",
      phone: "",
      campusId: "beach",
      campus: "Sky-Line Beach",
      roleCode: "teacher" as "leader" | "teacher",
      role: "Giáo viên",
      specialty: "Lập Trình Python & Đồ Họa Kỹ Thuật Số",
      lab: "Phòng Lab Sky-Line Beach",
    },
    {
      id: "a0000001-0000-0000-0000-000000000007",
      name: "Cô Phạm Thị Thanh Bình",
      email: "binhptt@skylineschool.edu.vn",
      phone: "",
      campusId: "hill",
      campus: "Sky-Line Hill",
      roleCode: "teacher" as "leader" | "teacher",
      role: "Giáo viên",
      specialty: "STEM Robotics & Trí Tuệ Nhân Tạo Tiểu Học",
      lab: "Phòng Lab Sky-Line Hill",
    },
    {
      id: "a0000001-0000-0000-0000-000000000008",
      name: "Cô Trần Thị Phi Yến",
      email: "yenttp@skylineschool.edu.vn",
      phone: "",
      campusId: "central",
      campus: "Sky-Line Central",
      roleCode: "teacher" as "leader" | "teacher",
      role: "Giáo viên",
      specialty: "Tin Học Đồ Họa & Thiết Kế Đa Phương Tiện",
      lab: "Phòng Lab Sky-Line Central",
    },
  ]);

  // --- STATE QUẢN LÝ & CHỈNH SỬA HỒ SƠ GIÁO VIÊN TRONG TAB NHÂN SỰ ICT ---
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<"add" | "edit">("edit");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    id: "",
    name: "",
    roleCode: "teacher" as "leader" | "teacher",
    email: "",
    phone: "",
    campusId: "riverside",
    lab: "",
  });
  const [deleteConfirmTeacher, setDeleteConfirmTeacher] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [isDeletingTeacher, setIsDeletingTeacher] = useState(false);

  // Khởi tạo và đồng bộ chế độ Sáng / Tối từ bộ nhớ trình duyệt (Mặc định: Chế độ Tối)
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("skyline_portal_theme");
      if (savedTheme === "light") {
        setIsDark(false);
        document.documentElement.classList.remove("dark");
      } else {
        setIsDark(true);
        document.documentElement.classList.add("dark");
      }
    } catch {
      setIsDark(true);
      document.documentElement.classList.add("dark");
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
      localStorage.setItem("skyline_portal_theme", nextDark ? "dark" : "light");
    } catch {
      // Bỏ qua lỗi lưu trữ
    }
    showToast(
      nextDark
        ? "Đã chuyển sang giao diện Chế độ Tối (Bảo vệ mắt ban đêm)!"
        : "Đã chuyển sang giao diện Chế độ Sáng!",
      "info"
    );
  };

  const showToast = (text: string, type: "success" | "warning" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTabChange = (newTab: typeof activeTab) => {
    setIsLoadingTab(true);
    setActiveTab(newTab);
    setTimeout(() => setIsLoadingTab(false), 200);
  };

  const campuses = [
    { id: "all", name: "Toàn bộ 5 Cơ sở" },
    { id: "riverside", name: "Sky-Line Riverside" },
    { id: "central", name: "Sky-Line Central" },
    { id: "beach", name: "Sky-Line Beach" },
    { id: "hill", name: "Sky-Line Hill" },
    { id: "international", name: "Sky-Line Global" },
  ];

  // --- TẢI DỮ LIỆU TỪ KHO SUPABASE VÀ ĐĂNG KÝ REALTIME ---
  const loadDashboardData = async () => {
    try {
      // 1. Nhận diện tài khoản đăng nhập hiện tại từ Supabase Auth an toàn
      let authUser = null;
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          const isInvalidToken =
            authError.status === 400 ||
            (authError as any).code === "refresh_token_not_found" ||
            (authError as any).code === "refresh_token_already_used" ||
            authError.message?.toLowerCase().includes("refresh token");

          if (isInvalidToken) {
            // Khi token phiên làm việc cũ không còn hợp lệ, xóa sạch và chuyển hướng về /login
            await supabase.auth.signOut().catch(() => {});
            router.push("/login");
            return;
          }
        } else {
          authUser = user;
        }
      } catch {
        // Bắt lỗi an toàn
      }

      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profile) {
          setCurrentUserProfile({
            id: profile.id,
            email: profile.email || authUser.email || "",
            name: profile.full_name || authUser.email || "Giáo Viên",
            role: (profile.role as "leader" | "teacher" | "guest") || "teacher",
            campus:
              profile.role === "leader"
                ? "Sky-Line Riverside (Bao quát 5 cơ sở)"
                : profile.role === "guest"
                ? "Toàn hệ thống Sky-Line (Chế độ Chỉ Xem)"
                : `Cơ sở Sky-Line (${campuses.find((c) => c.id === profile.campus_id)?.name || "Riverside"})`,
          });
        }
      }

      // 2. Tải thời khóa biểu (timetables) từ Supabase kết hợp với 193 tiết phòng Lab
      const periodsTimes: Record<number, string> = {
        1: "07:30 - 08:15",
        2: "08:20 - 09:05",
        3: "09:20 - 10:05",
        4: "10:10 - 10:55",
        5: "13:30 - 14:15",
        6: "14:20 - 15:05",
        7: "15:20 - 16:05",
        8: "16:10 - 16:55",
      };

      // 2. Tải thời khóa biểu 6 phòng Lab từ Supabase (lab_timetables) theo Năm học
      let labTtQuery = supabase
        .from("lab_timetables")
        .select("*")
        .eq("school_year", selectedSchoolYear);
      if (selectedCampus !== "all") {
        labTtQuery = labTtQuery.eq("campus_id", selectedCampus);
      }
      const { data: labTtData } = await labTtQuery;
      if (labTtData && labTtData.length > 0) {
        const mappedLabSlots: TimetableSlot[] = labTtData.map((t: any) => ({
          id: t.id,
          day: t.day_of_week,
          period: t.period,
          time: t.time_slot || periodsTimes[t.period] || "07:30 - 08:15",
          className: t.class_name,
          teacher: t.teacher_name,
          subject: t.subject || "Robotics & Tin Học STEM",
          room: t.room || t.lab_name,
          labId: t.lab_id,
          campusId: t.campus_id,
          topic: t.notes || "",
        }));
        setTimetableSlots(mappedLabSlots);
      } else {
        setTimetableSlots([]);
      }

      // 2b. Tải tiết dạy của từng giáo viên từ Supabase (teacher_timetables) theo Năm học
      const { data: teacherTtData } = await supabase
        .from("teacher_timetables")
        .select("*")
        .eq("school_year", selectedSchoolYear);
      setRawTeacherTimetables(teacherTtData || []);
      if (teacherTtData && teacherTtData.length > 0) {
        const teacherCodeMap: Record<string, string> = {
          HUY: "huy",
          TUAN: "tuan",
          LINH: "linh",
          ANH: "anh",
          TAM: "tam",
          DANG: "dang",
          BINH: "binh",
          YEN: "yen",
        };

        const updatedProfiles = TEACHER_TIMETABLES.map((prof) => {
          const profSlots = teacherTtData
            .filter((row: any) => (teacherCodeMap[row.teacher_code] || row.teacher_code?.toLowerCase()) === prof.id)
            .map((row: any) => ({
              id: row.id,
              teacherId: prof.id,
              teacherName: row.teacher_name,
              day: row.day_of_week,
              period: row.period,
              session: row.session as "morning" | "afternoon",
              time: row.time_slot,
              className: row.class_name,
              subject: row.subject,
              room: row.room,
            }));

          return {
            ...prof,
            totalSlots: profSlots.length,
            slots: profSlots,
          };
        });

        setTeacherTimetablesList(updatedProfiles);
      } else {
        setTeacherTimetablesList(
          TEACHER_TIMETABLES.map((prof) => ({
            ...prof,
            totalSlots: 0,
            slots: [],
          }))
        );
      }



      // 5. Tải hồ sơ giáo viên (profiles) - Không hiển thị tài khoản Khách (guest) trong danh bạ Nhân sự ICT
      const { data: profilesData } = await supabase.from("profiles").select("*");
      if (profilesData && profilesData.length > 0) {
        const sortedProfiles = [...profilesData]
          .filter((p: any) => p.role !== "guest")
          .sort((a: any, b: any) => {
            if (a.role === "leader" && b.role !== "leader") return -1;
            if (a.role !== "leader" && b.role === "leader") return 1;
            return String(a.id).localeCompare(String(b.id));
          });
        setTeachersList(
          sortedProfiles.map((p: any) => ({
            id: p.id,
            name: p.full_name,
            email: p.email,
            phone: p.phone_number || "",
            campusId: p.campus_id || (p.role === "leader" ? "all" : "riverside"),
            campus:
              p.campus_id === "all"
                ? "Bao quát 5 Cơ sở"
                : campuses.find((c) => c.id === p.campus_id)?.name || "Sky-Line Riverside",
            roleCode: (p.role === "leader" ? "leader" : "teacher") as "leader" | "teacher",
            role: p.role === "leader" ? "Tổ trưởng chuyên môn" : "Giáo viên",
            specialty: p.specialty || "Robotics STEM & Tin Học",
            lab:
              p.lab_management ||
              (p.role === "leader" ? "Quản trị toàn bộ 6 phòng Lab" : "Chưa phân công"),
          }))
        );
      }

      // 6. Tải danh sách lớp học và phân công chuyên môn từ Supabase (classes) theo Năm học
      const { data: classesData } = await supabase
        .from("classes")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("campus", { ascending: true })
        .order("grade", { ascending: true })
        .order("name", { ascending: true });

      setClassesList(classesData || []);

      // 7. Tải danh sách thành tích của Giáo viên & Học sinh từ Supabase (achievements) theo Năm học
      const { data: achievementsData } = await supabase
        .from("achievements")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("created_at", { ascending: false });

      setTeacherAchievementsList((achievementsData as AchievementItem[]) || []);
    } catch (err) {
      console.error("Lỗi đồng bộ Supabase:", err);
    }
  };

  // Hàm tải đồng bộ dữ liệu thời khóa biểu phòng Lab từ teacher_timetables theo Năm học
  const loadLabScheduleFromTeacherTimetables = useCallback(async () => {
    setIsLoadingLabSchedule(true);
    try {
      const { data, error } = await supabase
        .from("teacher_timetables")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("period", { ascending: true });
      if (!error && data) {
        setRawTeacherTimetables(data);
      }
    } catch (err) {
      console.error("Lỗi tải lịch phòng Lab từ teacher_timetables:", err);
    } finally {
      setIsLoadingLabSchedule(false);
    }
  }, [supabase, selectedSchoolYear]);

  // Tự động tải lại lịch phòng Lab khi chuyển sang tab Phần 1
  useEffect(() => {
    if (timetableSubTab === "lab_view") {
      loadLabScheduleFromTeacherTimetables();
    }
  }, [timetableSubTab, loadLabScheduleFromTeacherTimetables]);

  // Tự động làm mới danh sách thành tích khi chuyển sang tab Nhân sự ICT hoặc đổi Năm học
  useEffect(() => {
    if (activeTab === "teachers") {
      supabase
        .from("achievements")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) {
            setTeacherAchievementsList(data as AchievementItem[]);
          }
        });
    }
  }, [activeTab, selectedSchoolYear, supabase]);

  useEffect(() => {
    loadDashboardData();

    // Lắng nghe thay đổi tức thì qua Supabase Realtime (Không cần bấm F5)
    const channel = supabase
      .channel("portal_realtime_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "timetables" }, () => {
        loadDashboardData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "teacher_timetables" }, () => {
        loadLabScheduleFromTeacherTimetables();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        loadDashboardData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classes" }, async () => {
        const { data: refreshedClasses } = await supabase
          .from("classes")
          .select("*")
          .eq("school_year", selectedSchoolYear)
          .order("campus", { ascending: true })
          .order("grade", { ascending: true })
          .order("name", { ascending: true });
        setClassesList(refreshedClasses || []);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "achievements" }, async () => {
        const { data: refreshedAchievements } = await supabase
          .from("achievements")
          .select("*")
          .eq("school_year", selectedSchoolYear)
          .order("created_at", { ascending: false });
        setTeacherAchievementsList((refreshedAchievements as AchievementItem[]) || []);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCampus, selectedSchoolYear, loadLabScheduleFromTeacherTimetables]);

  // Xử lý đăng xuất thực tế
  const handleLogout = async () => {
    showToast("Đang đăng xuất an toàn khỏi hệ thống...", "info");
    await supabase.auth.signOut();
    setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 400);
  };

  const checkSlotConflict = (day: number, period: number, teacher: string, room: string) => {
    const existing = timetableSlots.find(
      (s) => s.day === day && s.period === period && (s.teacher === teacher || s.room === room)
    );
    if (existing) {
      if (existing.teacher === teacher) {
        return `Trùng lịch: ${teacher} đã có tiết tại ${existing.className} (${existing.room})!`;
      }
      if (existing.room === room) {
        return `Trùng phòng: ${room} đã được lớp ${existing.className} (${existing.teacher}) đặt!`;
      }
    }
    return null;
  };

  const handleOpenSlotModal = (day: number, period: number, labRoomName?: string, labId?: string) => {
    const currentLabName = labRoomName || LAB_ROOMS.find((l) => l.id === selectedLab)?.name || "Sky-Line Riverside Tiểu Học";
    const currentLabObj = LAB_ROOMS.find((l) => l.id === (labId || selectedLab));
    setSelectedSlotForEdit({ day, period, labId: labId || selectedLab });

    const existing = timetableSlots.find(
      (s) => s.day === day && s.period === period && (s.room === currentLabName || s.room.includes(currentLabName))
    );
    if (existing) {
      setSlotForm({
        className: existing.className,
        teacher: existing.teacher,
        subject: existing.subject,
        room: existing.room,
        labId: labId || selectedLab,
        campusId: existing.campusId,
        topic: existing.topic || "",
      });
      setSlotConflictWarning(null);
    } else {
      setSlotForm({
        className: "Lớp 3/1",
        teacher: currentUserProfile.name || "Thầy Quốc Huy",
        subject: "Robotics STEM",
        room: currentLabName,
        labId: labId || selectedLab,
        campusId: currentLabObj?.campusId || "riverside",
        topic: "",
      });
      setSlotConflictWarning(checkSlotConflict(day, period, currentUserProfile.name, currentLabName));
    }
    setIsSlotModalOpen(true);
  };

  // Lưu lịch dạy vào Supabase (Chuẩn 2B) & hiển thị tức thì
  const handleSaveSlot = async () => {
    if (!selectedSlotForEdit) return;
    setIsSubmittingSlot(true);
    const { day, period } = selectedSlotForEdit;

    const periodsTimes: Record<number, string> = {
      1: "07:30 - 08:15",
      2: "08:20 - 09:05",
      3: "09:20 - 10:05",
      4: "10:10 - 10:55",
      5: "13:30 - 14:15",
      6: "14:20 - 15:05",
      7: "15:20 - 16:05",
      8: "16:10 - 16:55",
    };

    let generatedId = `t_${Date.now()}`;

    try {
      const { data } = await supabase
        .from("lab_timetables")
        .upsert({
          school_year_id: "985ffcb7-73c6-4d33-89da-1102e2fb1699",
          semester: "HK1",
          lab_id: slotForm.labId || "riverside_primary",
          lab_name: slotForm.room,
          campus_id: slotForm.campusId,
          day_of_week: day,
          period: period,
          session: period <= 4 ? "morning" : "afternoon",
          time_slot: periodsTimes[period] || "07:30 - 08:15",
          class_name: slotForm.className,
          teacher_name: slotForm.teacher,
          subject: slotForm.subject,
          room: slotForm.room,
        })
        .select()
        .single();

      if (data) {
        generatedId = data.id;
      }
    } catch (err) {
      console.error(err);
    }

    // Cập nhật giao diện tức thì
    setTimetableSlots((prev) => {
      const filtered = prev.filter(
        (s) => !(s.day === day && s.period === period && (s.room === slotForm.room || s.room.includes(slotForm.room)))
      );
      return [
        ...filtered,
        {
          id: generatedId,
          day,
          period,
          time: periodsTimes[period] || "07:30 - 08:15",
          className: slotForm.className,
          teacher: slotForm.teacher,
          subject: slotForm.subject,
          room: slotForm.room,
          campusId: slotForm.campusId,
          topic: slotForm.topic,
        },
      ];
    });

    setIsSubmittingSlot(false);
    setIsSlotModalOpen(false);
    showToast(`Đã xếp lịch và đồng bộ cho ${slotForm.className} tại ${slotForm.room}!`, "success");
  };

  const handleDeleteSlot = async () => {
    if (!selectedSlotForEdit) return;
    const { day, period } = selectedSlotForEdit;
    const slotToDelete = timetableSlots.find((s) => s.day === day && s.period === period);
    if (slotToDelete && slotToDelete.id && !slotToDelete.id.startsWith("t_")) {
      await supabase.from("lab_timetables").delete().eq("id", slotToDelete.id);
      await supabase.from("timetables").delete().eq("id", slotToDelete.id);
    }
    setTimetableSlots((prev) => prev.filter((s) => !(s.day === day && s.period === period)));
    setIsSlotModalOpen(false);
    showToast("Đã hủy tiết dạy và đồng bộ vào kho Supabase!", "info");
  };

  // Hàm hiển thị từng hàng thời khóa biểu theo đúng phòng Lab được chọn và 8 tiết (Sáng 4, Chiều 4)
  // Lấy dữ liệu đồng bộ từ teacher_timetables (Phần 2.2), chỉ hiển thị Tên Lớp & Tên Giáo Viên, hoàn toàn chỉ xem (Read-only)
  const renderTimetableRow = (slotTime: { period: number; time: string }) => {
    return (
      <tr key={slotTime.period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
        <td className="py-1 px-2 text-center bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 align-middle">
          <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200 leading-tight">Tiết {slotTime.period}</div>
          <div className="text-[10px] text-slate-500 font-medium leading-tight">{slotTime.time}</div>
        </td>

        {[2, 3, 4, 5, 6].map((dayNum) => {
          // Tìm các tiết học tương ứng trong phòng Lab đang chọn từ teacher_timetables
          const matchingSlots = rawTeacherTimetables.filter(
            (s) =>
              Number(s.day_of_week) === dayNum &&
              Number(s.period) === slotTime.period &&
              isSlotInLabRoom(s.room, selectedLab)
          );

          const visibleSlots =
            filterTeacher === "all"
              ? matchingSlots
              : matchingSlots.filter((s) => s.teacher_name === filterTeacher);

          const isFilteredOut = filterTeacher !== "all" && matchingSlots.length > 0 && visibleSlots.length === 0;

          return (
            <td
              key={dayNum}
              className="py-1 px-1.5 border border-slate-100 dark:border-slate-800/60 select-none cursor-default align-middle"
            >
              {visibleSlots.length > 0 ? (
                <div className="space-y-1">
                  {visibleSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="py-1 px-2 rounded-xl bg-white dark:bg-slate-800/95 border border-sky-200/80 dark:border-sky-800/70 shadow-2xs text-center space-y-0.5"
                    >
                      {/* NỘI DUNG 1: TÊN LỚP */}
                      <div className="font-extrabold text-[11px] px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 border border-sky-200/80 dark:border-sky-800 shadow-2xs tracking-wide inline-block leading-none">
                        {slot.class_name}
                      </div>
                      {/* NỘI DUNG 2: HỌ VÀ TÊN GIÁO VIÊN GIẢNG DẠY */}
                      <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate flex items-center justify-center gap-1 leading-tight">
                        <span className="text-sky-600 dark:text-sky-400 text-[10px]">👤</span>
                        <span className="truncate">{slot.teacher_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isFilteredOut ? (
                <div className="h-8 rounded-xl border border-dashed border-slate-100 dark:border-slate-800/60 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-600 italic select-none">
                  (Khác GV lọc)
                </div>
              ) : (
                <div className="h-8 rounded-xl border border-dashed border-slate-100 dark:border-slate-800/60 flex items-center justify-center text-slate-300 dark:text-slate-700 font-bold select-none text-xs">
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
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* TOAST THÔNG BÁO NỔI */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-in fade-in slide-in-from-bottom-5 duration-300 ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-white dark:bg-sky-600 border-sky-400/30"
              : toastMessage.type === "warning"
              ? "bg-amber-600 text-white border-amber-300/40"
              : "bg-slate-800 text-white border-slate-700"
          }`}
        >
          {toastMessage.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-white" />}
          {toastMessage.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-200" />}
          {toastMessage.type === "info" && <Info className="w-5 h-5 text-sky-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* TOP HEADER: THANH TIÊU ĐỀ TRÊN CÙNG (LOGO, CƠ SỞ, SÁNG/TỐI, TÀI KHOẢN) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo & Nhận diện Sky-Line */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="h-10 px-2.5 py-1.5 rounded-xl bg-white dark:bg-white/95 border border-slate-200/80 dark:border-white/20 flex items-center justify-center shadow-md shadow-sky-600/15 select-none group-hover:scale-105 transition-transform">
              <img
                src="/LogoSKL.png"
                alt="Logo Trường Sky-Line"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-sky-700 via-sky-600 to-amber-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-amber-400">
                  SKY-LINE ICT PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
                Cổng Quản Trị & Vận Hành Chuyên Môn
              </p>
            </div>
          </Link>

          {/* Khu vực công cụ & Tài khoản góc trên bên phải */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bộ chọn Năm học tương tác linh hoạt */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="hidden lg:inline text-slate-500 dark:text-slate-400">Năm học:</span>
              <select
                aria-label="Chọn năm học"
                value={selectedSchoolYear}
                onChange={(e) => {
                  setSelectedSchoolYear(e.target.value);
                  showToast(`Đã chuyển sang xem dữ liệu Năm học ${e.target.value}!`, "info");
                }}
                className="bg-transparent font-bold text-sky-700 dark:text-sky-400 focus:outline-none cursor-pointer"
              >
                <option value="2026-2027" className="dark:bg-slate-900">2026 - 2027</option>
                <option value="2025-2026" className="dark:bg-slate-900">2025 - 2026</option>
                <option value="2024-2025" className="dark:bg-slate-900">2024 - 2025</option>
              </select>
            </div>

            {/* Bộ chọn Cơ sở (5 Cơ sở Sky-Line) */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <select
                aria-label="Chọn cơ sở trường"
                value={selectedCampus}
                onChange={(e) => {
                  setSelectedCampus(e.target.value);
                  showToast(`Đã lọc dữ liệu theo: ${campuses.find((c) => c.id === e.target.value)?.name}`, "info");
                }}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-slate-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Nút Chuông Thông Báo Hoạt Động Hệ Thống */}
            <NotificationBell
              supabase={supabase}
              currentUserProfile={currentUserProfile}
              onNavigateTab={handleTabChange}
              showToast={showToast}
            />

            {/* Nút Đổi giao diện Sáng / Tối */}
            <button
              type="button"
              onClick={handleToggleTheme}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              title={isDark ? "Chuyển sang Chế độ Sáng" : "Chuyển sang Chế độ Tối"}
              aria-label="Đổi giao diện Sáng / Tối"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-600" />}
            </button>

            {/* LOGO TÀI KHOẢN ĐĂNG NHẬP Ở GÓC TRÊN BÊN PHẢI & THOÁT KHỎI TÀI KHOẢN */}
            <UserNav
              user={currentUserProfile}
              onLogout={handleLogout}
              onSwitchProfile={(profile) => {
                setCurrentUserProfile(profile);
                showToast(
                  `Đã chuyển đổi góc nhìn sang: ${profile.name} (${profile.role === "leader" ? "Tổ Trưởng" : "Giáo Viên"})`,
                  "info"
                );
              }}
            />
          </div>
        </div>
      </header>

      {/* THANH ĐIỀU HƯỚNG DASHBOARD (THANH TABS CHUYÊN MÔN & TÁC VỤ NHANH) */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 py-2">
            {/* Dãy nút chuyển đổi chuyên mục (Segmented Tabs) */}
            <div
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              className="bg-slate-100/95 dark:bg-slate-800/90 p-1 rounded-2xl inline-flex items-center gap-1 border border-slate-200/80 dark:border-slate-700/80 no-scrollbar overflow-x-auto max-w-full"
            >
              {[
                { id: "dashboard", label: "Tổng Quan", icon: Layers },
                { id: "timetable", label: "TKB & Lịch phòng Lab", icon: Calendar },
                { id: "devices", label: "Thiết Bị & Robot", icon: Bot },
                { id: "tasks", label: "Công Việc Được Giao", icon: CheckCircle2 },
                { id: "teams", label: "Đội Tuyển", icon: GraduationCap },
                { id: "achievements", label: "Thành Tích", icon: Trophy },
                { id: "teachers", label: "Nhân Sự ICT", icon: Users },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as any)}
                    className={`inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-sky-700 dark:bg-slate-900 dark:text-sky-300 shadow-sm border border-slate-200/80 dark:border-slate-700/80 scale-[1.01]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SKELETON LOADING INDICATOR */}
      {isLoadingTab && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {!isLoadingTab && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full">
          {/* TAB 1: DASHBOARD OVERVIEW (TRANG TỔNG QUAN MỚI ĐỒNG BỘ DỮ LIỆU THỰC TẾ) */}
          {activeTab === "dashboard" && (
            <OverviewSection
              supabase={supabase}
              selectedSchoolYear={selectedSchoolYear}
              selectedCampus={selectedCampus}
              campuses={campuses}
              currentUserProfile={currentUserProfile}
              teachersList={teachersList}
              classesList={classesList}
              timetableSlotsCount={timetableSlots.length}
              rawTeacherTimetables={rawTeacherTimetables}
              onNavigateTab={handleTabChange}
            />
          )}

          {/* TAB 2: TKB & LỊCH PHÒNG LAB (GỒM 2 PHẦN NỘI DUNG) */}
          {activeTab === "timetable" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* THANH ĐIỀU KHIỂN CHUYỂN ĐỔI 3 PHẦN NỘI DUNG */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 p-2 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
                <div className="inline-flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <button
                    onClick={() => {
                      setTimetableSubTab("lab_view");
                      showToast("Đang xem Phần 1: Lịch phòng Lab", "info");
                    }}
                    className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      timetableSubTab === "lab_view"
                        ? "bg-sky-600 text-white shadow-sm scale-[1.01]"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Phần 1: Lịch phòng Lab</span>
                  </button>

                  <button
                    onClick={() => {
                      setTimetableSubTab("teacher_view");
                      showToast("Đang xem Phần 2: Lịch giảng dạy cá nhân từng giáo viên (TKB CÁ NHÂN)", "info");
                    }}
                    className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      timetableSubTab === "teacher_view"
                        ? "bg-amber-600 text-white shadow-sm scale-[1.01]"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Phần 2: Lịch Giảng Dạy Từng Giáo Viên</span>
                    <Badge variant="amber" className="text-[9px] px-1 py-0 ml-1">
                      TKB Cá Nhân
                    </Badge>
                  </button>

                  {/* NÚT PHẦN 3: CHỈ HIỂN THỊ VỚI TÀI KHOẢN TỔ TRƯỞNG CHUYÊN MÔN */}
                  {isLeader && (
                    <button
                      onClick={() => {
                        setTimetableSubTab("assignment_view");
                        showToast("Đang xem Phần 3: Phân công chuyên môn & Danh sách lớp học", "info");
                      }}
                      className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        timetableSubTab === "assignment_view"
                          ? "bg-emerald-600 text-white shadow-sm scale-[1.01]"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Phần 3: Phân Công Chuyên Môn</span>
                      <Badge variant="emerald" className="text-[9px] px-1 py-0 ml-1">
                        {classesList.length > 0 ? `${classesList.length} Lớp` : "113 Lớp"}
                      </Badge>
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 px-2 font-medium hidden md:block">
                  {timetableSubTab === "lab_view"
                    ? "Lịch giảng dạy & thiết bị 6 phòng Lab Sky-Line"
                    : timetableSubTab === "teacher_view"
                    ? "Lịch phân công giảng dạy chi tiết của 8 Giáo viên Tổ ICT"
                    : "Sắp xếp phân công giáo viên giảng dạy & Quản lý danh sách 113 lớp"}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* PHẦN 1: LỊCH PHÒNG LAB                                                    */}
              {/* ========================================================================= */}
              {timetableSubTab === "lab_view" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* KHUNG TIÊU ĐỀ & BỘ CHỌN 6 PHÒNG LAB GỌN GÀNG */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2.5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                          <Building2 className="w-4 h-4" />
                        </span>
                        <div>
                          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            Phần 1: Lịch phòng Lab
                            <Badge variant="default" className="text-[10px] font-bold px-2 py-0">
                              Năm học {selectedSchoolYear}
                            </Badge>
                          </h2>
                        </div>
                      </div>

                      {/* CÔNG CỤ LỌC PHỤ: THEO GIÁO VIÊN, BUỔI HỌC & ĐỒNG BỘ */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Lọc theo Giáo viên */}
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                          <Users className="w-3.5 h-3.5 text-sky-600" />
                          <select
                            aria-label="Lọc theo giáo viên giảng dạy"
                            value={filterTeacher}
                            onChange={(e) => setFilterTeacher(e.target.value)}
                            className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                          >
                            <option value="all" className="dark:bg-slate-900">Tất cả giáo viên</option>
                            {teachersList.map((t) => (
                              <option key={t.id} value={t.name} className="dark:bg-slate-900">
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Lọc theo buổi (Sáng / Chiều) */}
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <select
                            aria-label="Lọc theo buổi học"
                            value={selectedSessionFilter}
                            onChange={(e) => setSelectedSessionFilter(e.target.value as any)}
                            className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                          >
                            <option value="all" className="dark:bg-slate-900">Cả Ngày (8 Tiết)</option>
                            <option value="morning" className="dark:bg-slate-900">Chỉ Buổi Sáng (4 Tiết)</option>
                            <option value="afternoon" className="dark:bg-slate-900">Chỉ Buổi Chiều (4 Tiết)</option>
                          </select>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            loadLabScheduleFromTeacherTimetables();
                            showToast("Đã đồng bộ lại dữ liệu thời khóa biểu phòng Lab!", "success");
                          }}
                          className="font-bold text-xs h-7 px-2.5"
                          title="Làm mới dữ liệu từ cơ sở dữ liệu"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoadingLabSchedule ? "animate-spin" : ""}`} />
                          Đồng bộ
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => showToast(`Đã xuất Thời khóa biểu phòng Lab năm học ${selectedSchoolYear} sẵn sàng để in!`, "info")}
                          className="font-bold text-xs h-7 px-2.5"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1 text-slate-600 dark:text-slate-400" />
                          In TKB (PDF)
                        </Button>
                      </div>
                    </div>

                    {/* THANH CHỌN 6 PHÒNG LAB SKY-LINE (DẠNG THẺ GỌN) */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {LAB_ROOMS.map((lab) => {
                          const isSelected = selectedLab === lab.id;
                          const labSlotsCount = rawTeacherTimetables.filter(
                            (s) => isSlotInLabRoom(s.room, lab.id)
                          ).length;

                          return (
                            <button
                              key={lab.id}
                              onClick={() => {
                                setSelectedLab(lab.id);
                                showToast(`Đang hiển thị lịch: ${lab.name} (${labSlotsCount} tiết/tuần)`, "info");
                              }}
                              className={`p-2 rounded-xl text-left transition-all border cursor-pointer relative overflow-hidden group ${
                                isSelected
                                  ? "bg-gradient-to-br from-sky-600 to-sky-700 text-white border-sky-500 shadow-sm shadow-sky-600/25"
                                  : "bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                                }`}>
                                  {lab.sheet}
                                </span>
                                <span className={`text-[10px] font-bold ${isSelected ? "text-amber-300" : "text-amber-600 dark:text-amber-400"}`}>
                                  {labSlotsCount} tiết
                                </span>
                              </div>

                              <div className="font-extrabold text-[11px] line-clamp-1 leading-tight">
                                {lab.name.replace("Sky-Line ", "")}
                              </div>
                              <div className={`text-[9px] truncate leading-tight ${isSelected ? "text-sky-100" : "text-slate-500 dark:text-slate-400"}`}>
                                GV: {lab.defaultTeacher}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* BẢNG LƯỚI THỜI KHÓA BIỂU 8 TIẾT (BUỔI SÁNG 4 TIẾT, BUỔI CHIỀU 4 TIẾT) - GỌN TRONG 1 MÀN HÌNH */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <table className="w-full text-left text-xs border-collapse min-w-[760px] table-fixed">
                      <colgroup>
                        <col className="w-28" />
                        <col className="w-1/5" />
                        <col className="w-1/5" />
                        <col className="w-1/5" />
                        <col className="w-1/5" />
                        <col className="w-1/5" />
                      </colgroup>
                      <thead>
                        <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2 px-2 font-bold w-28 text-center bg-slate-200/60 dark:bg-slate-800">Tiết / Giờ</th>
                          {[
                            { day: 2, label: "Thứ Hai" },
                            { day: 3, label: "Thứ Ba" },
                            { day: 4, label: "Thứ Tư" },
                            { day: 5, label: "Thứ Năm" },
                            { day: 6, label: "Thứ Sáu" },
                          ].map((d) => (
                            <th
                              key={d.day}
                              className="py-2 px-2 font-bold text-center"
                            >
                              {d.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {/* KHỐI 1: BUỔI SÁNG (TIẾT 1 ĐẾN TIẾT 4) */}
                        {(selectedSessionFilter === "all" || selectedSessionFilter === "morning") && (
                          <>
                            <tr className="bg-sky-50/70 dark:bg-sky-950/40 border-y border-sky-200/80 dark:border-sky-900/60">
                              <td colSpan={6} className="px-3 py-1 font-black text-sky-900 dark:text-sky-300 text-[11px] tracking-wide">
                                <span className="inline-flex items-center gap-1.5">
                                  <SunMedium className="w-3.5 h-3.5 text-amber-500" />
                                  BUỔI SÁNG (07:30 - 10:55 • 4 TIẾT)
                                </span>
                              </td>
                            </tr>

                            {[
                              { period: 1, time: "07:30 - 08:15" },
                              { period: 2, time: "08:20 - 09:05" },
                            ].map((slotTime) => renderTimetableRow(slotTime))}

                            {/* DÒNG NGHỈ GIẢI LAO SÁNG */}
                            <tr className="bg-amber-50/50 dark:bg-amber-950/20 text-slate-500 dark:text-slate-400 text-[10px] italic">
                              <td className="py-0.5 px-2 text-center bg-amber-100/50 dark:bg-amber-950/40 border-r border-slate-200 dark:border-slate-800 font-semibold text-amber-800 dark:text-amber-300">
                                09:05 - 09:20
                              </td>
                              <td colSpan={5} className="py-0.5 px-2 text-center">
                                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                                  <Coffee className="w-3 h-3" /> Giờ ra chơi, ăn phụ & thể dục giữa giờ (15 phút)
                                </span>
                              </td>
                            </tr>

                            {[
                              { period: 3, time: "09:20 - 10:05" },
                              { period: 4, time: "10:10 - 10:55" },
                            ].map((slotTime) => renderTimetableRow(slotTime))}
                          </>
                        )}

                        {/* DÒNG NGHỈ TRƯA & BÁN TRÚ NẾU HIỂN THỊ CẢ NGÀY */}
                        {selectedSessionFilter === "all" && (
                          <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-bold border-y border-slate-200 dark:border-slate-700">
                            <td className="py-1 px-2 text-center bg-slate-200/70 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">
                              11:00 - 13:30
                            </td>
                            <td colSpan={5} className="py-1 px-2 text-center">
                              🍱 NGHỈ TRƯA, ĂN BÁN TRÚ & NGHỈ NGƠI TẠI CƠ SỞ
                            </td>
                          </tr>
                        )}

                        {/* KHỐI 2: BUỔI CHIỀU (TIẾT 5 ĐẾN TIẾT 8) */}
                        {(selectedSessionFilter === "all" || selectedSessionFilter === "afternoon") && (
                          <>
                            <tr className="bg-indigo-50/70 dark:bg-indigo-950/40 border-y border-indigo-200/80 dark:border-indigo-900/60">
                              <td colSpan={6} className="px-3 py-1 font-black text-indigo-900 dark:text-indigo-300 text-[11px] tracking-wide">
                                <span className="inline-flex items-center gap-1.5">
                                  <Sunset className="w-3.5 h-3.5 text-orange-500" />
                                  BUỔI CHIỀU (13:30 - 16:55 • 4 TIẾT)
                                </span>
                              </td>
                            </tr>

                            {[
                              { period: 5, time: "13:30 - 14:15" },
                              { period: 6, time: "14:20 - 15:05" },
                            ].map((slotTime) => renderTimetableRow(slotTime))}

                            {/* DÒNG NGHỈ GIẢI LAO CHIỀU */}
                            <tr className="bg-amber-50/50 dark:bg-amber-950/20 text-slate-500 dark:text-slate-400 text-[10px] italic">
                              <td className="py-0.5 px-2 text-center bg-amber-100/50 dark:bg-amber-950/40 border-r border-slate-200 dark:border-slate-800 font-semibold text-amber-800 dark:text-amber-300">
                                15:05 - 15:20
                              </td>
                              <td colSpan={5} className="py-0.5 px-2 text-center">
                                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                                  <Coffee className="w-3 h-3" /> Giờ ăn xế & giải lao chiều (15 phút)
                                </span>
                              </td>
                            </tr>

                            {[
                              { period: 7, time: "15:20 - 16:05" },
                              { period: 8, time: "16:10 - 16:55" },
                            ].map((slotTime) => renderTimetableRow(slotTime))}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* PHẦN 2: LỊCH GIẢNG DẠY CÁ NHÂN CỦA TỪNG GIÁO VIÊN (2.1 & 2.2)              */}
              {/* ========================================================================= */}
              {timetableSubTab === "teacher_view" && (
                <TeacherAssignedScheduleSection
                  supabase={supabase}
                  showToast={showToast}
                  selectedSchoolYear={selectedSchoolYear}
                  classesList={classesList}
                  teachersList={teachersList}
                  currentUserProfile={currentUserProfile}
                  onScheduleChanged={loadLabScheduleFromTeacherTimetables}
                />
              )}

              {/* ========================================================================= */}
              {/* PHẦN 3: PHÂN CÔNG CHUYÊN MÔN & DANH SÁCH LỚP (CHỈ DÀNH CHO TỔ TRƯỞNG)     */}
              {/* ========================================================================= */}
              {timetableSubTab === "assignment_view" && isLeader && (
                <TeachingAssignmentSection
                  classesList={classesList}
                  setClassesList={setClassesList}
                  teachersList={teachersList}
                  timetableSlots={timetableSlots}
                  setTimetableSlots={setTimetableSlots}
                  teacherTimetablesList={teacherTimetablesList}
                  setTeacherTimetablesList={setTeacherTimetablesList}
                  supabase={supabase}
                  showToast={showToast}
                  selectedSchoolYear={selectedSchoolYear}
                  reloadDashboardData={loadDashboardData}
                />
              )}
            </div>
          )}

          {/* TAB 3: THIẾT BỊ & ROBOT 6 PHÒNG LAB (PHÂN QUYỀN THEO QUẢN LÝ LAB) */}
          {activeTab === "devices" && (
            <LabDevicesSection
              supabase={supabase}
              showToast={showToast}
              currentUserProfile={currentUserProfile}
              selectedSchoolYear={selectedSchoolYear}
            />
          )}

          {/* TAB 4: VIỆC CẦN LÀM - PHÂN CÔNG CÔNG VIỆC CHUYÊN MÔN */}
          {activeTab === "tasks" && (
            <AssignedTasksSection
              supabase={supabase}
              showToast={showToast}
              currentUserProfile={currentUserProfile}
              teachersList={teachersList}
              selectedSchoolYear={selectedSchoolYear}
            />
          )}

          {/* TAB 4.5: ĐỘI TUYỂN BỒI DƯỠNG HỌC SINH GIỎI ICT */}
          {activeTab === "teams" && (
            <TrainingTeamsSection
              supabase={supabase}
              showToast={showToast}
              currentUserProfile={currentUserProfile}
              classesList={classesList}
              teachersList={teachersList}
              selectedSchoolYear={selectedSchoolYear}
            />
          )}

          {/* TAB 5: THÀNH TÍCH CUỘC THI & KÌ THI */}
          {activeTab === "achievements" && (
            <AchievementsSection
              supabase={supabase}
              showToast={showToast}
              currentUserProfile={currentUserProfile}
              classesList={classesList}
              teachersList={teachersList}
              selectedSchoolYear={selectedSchoolYear}
            />
          )}

          {/* TAB 6: NHÂN SỰ TỔ CHUYÊN MÔN ICT */}
          {activeTab === "teachers" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-sky-600" />
                      Danh Bạ Đội Ngũ Nhân Sự Tổ ICT ({teachersList.length} Thầy Cô)
                    </h2>
                    {isLeader && (
                      <Badge variant="amber" className="text-[10px] font-bold">
                        👑 Quyền Tổ Trưởng (Toàn quyền Thêm • Sửa • Xóa)
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isLeader
                      ? "Tổ trưởng chuyên môn có toàn quyền thêm mới, chỉnh sửa và xóa thông tin giáo viên trong danh sách Nhân sự ICT."
                      : "Mỗi tài khoản có quyền chỉnh sửa thông tin cá nhân của chính mình; thông tin của các thầy cô khác ở chế độ chỉ xem."}
                  </p>
                </div>

                {/* Các nút thao tác trên thanh tiêu đề */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isLeader && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setProfileModalMode("add");
                        setEditProfileForm({
                          id: "",
                          name: "",
                          roleCode: "teacher",
                          email: "",
                          phone: "",
                          campusId: "riverside",
                          lab: "Phòng Lab Sky-Line Riverside Tiểu Học",
                        });
                        setIsEditProfileModalOpen(true);
                      }}
                      className="font-bold text-xs flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/20 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      + Thêm Giáo Viên Mới
                    </Button>
                  )}

                  {(() => {
                    const myTeacherObj = teachersList.find(
                      (t) =>
                        t.id === currentUserProfile.id ||
                        t.email?.toLowerCase() === currentUserProfile.email?.toLowerCase()
                    );
                    if (!myTeacherObj) return null;
                    return (
                      <Button
                        size="sm"
                        variant={isLeader ? "outline" : "default"}
                        onClick={() => {
                          setProfileModalMode("edit");
                          setEditProfileForm({
                            id: myTeacherObj.id,
                            name: myTeacherObj.name,
                            roleCode: myTeacherObj.roleCode || (myTeacherObj.role.includes("Tổ trưởng") ? "leader" : "teacher"),
                            email: myTeacherObj.email,
                            phone: myTeacherObj.phone || "",
                            campusId: myTeacherObj.campusId || "riverside",
                            lab: myTeacherObj.lab || "",
                          });
                          setIsEditProfileModalOpen(true);
                        }}
                        className="font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Chỉnh sửa hồ sơ của tôi
                      </Button>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {teachersList.map((teacher, idx) => {
                  const isOwnProfile =
                    teacher.id === currentUserProfile.id ||
                    (Boolean(teacher.email) &&
                      Boolean(currentUserProfile.email) &&
                      teacher.email.toLowerCase() === currentUserProfile.email.toLowerCase());

                  const canEditProfile = isLeader || isOwnProfile;
                  const canDeleteProfile = isLeader && !isOwnProfile;

                  const avatarInitial =
                    teacher.name
                      .replace(/^(Thầy|Cô)\s+/i, "")
                      .trim()
                      .charAt(0)
                      .toUpperCase() || teacher.name.charAt(0);

                  const normalizeName = (s?: string) =>
                    (s || "")
                      .toLowerCase()
                      .replace(/^(thầy|cô)\s+/i, "")
                      .replace(/\s+/g, " ")
                      .trim();
                  const normTeacherName = normalizeName(teacher.name);
                  const teacherAchievements = teacherAchievementsList.filter((ach) => {
                    if (ach.user_id && ach.user_id === teacher.id) return true;
                    const normAchTeacher = normalizeName(ach.teacher_name);
                    return Boolean(normTeacherName && normAchTeacher && normAchTeacher === normTeacherName);
                  });

                  return (
                    <Card
                      key={teacher.id || idx}
                      className={`transition-all relative overflow-hidden ${
                        isOwnProfile
                          ? "border-sky-500/70 dark:border-sky-500/60 shadow-md shadow-sky-500/10 ring-1 ring-sky-500/30"
                          : "hover:shadow-md border-slate-200/90 dark:border-slate-800"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-11 h-11 rounded-2xl text-white font-extrabold text-base flex items-center justify-center shadow-xs shrink-0 ${
                                teacher.role.includes("Tổ trưởng")
                                  ? "bg-gradient-to-tr from-sky-600 via-sky-500 to-amber-500"
                                  : "bg-gradient-to-tr from-sky-600 to-sky-700"
                              }`}
                            >
                              {avatarInitial}
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-sm sm:text-[15px] font-extrabold text-slate-900 dark:text-white truncate">
                                {teacher.name}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <Badge
                                  variant={teacher.role.includes("Tổ trưởng") ? "amber" : "secondary"}
                                  className="text-[10px]"
                                >
                                  {teacher.role}
                                </Badge>
                                {isOwnProfile && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-800">
                                    Hồ sơ của bạn
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* PHÂN QUYỀN: TỔ TRƯỞNG TOÀN QUYỀN SỬA/XÓA; GIÁO VIÊN CHỈ SỬA HỒ SƠ CỦA MÌNH */}
                          {canEditProfile ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setProfileModalMode("edit");
                                  setEditProfileForm({
                                    id: teacher.id,
                                    name: teacher.name,
                                    roleCode: teacher.roleCode || (teacher.role.includes("Tổ trưởng") ? "leader" : "teacher"),
                                    email: teacher.email,
                                    phone: teacher.phone || "",
                                    campusId: teacher.campusId || "riverside",
                                    lab: teacher.lab || "",
                                  });
                                  setIsEditProfileModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/80 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-bold transition-colors cursor-pointer"
                                title={
                                  isOwnProfile
                                    ? "Chỉnh sửa thông tin cá nhân của bạn"
                                    : `Chỉnh sửa hồ sơ của ${teacher.name}`
                                }
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Chỉnh sửa</span>
                              </button>

                              {canDeleteProfile && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteConfirmTeacher({
                                      id: teacher.id,
                                      name: teacher.name,
                                      email: teacher.email,
                                    })
                                  }
                                  className="inline-flex items-center justify-center p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/70 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 transition-colors cursor-pointer"
                                  title={`Xóa ${teacher.name} khỏi danh sách Nhân sự ICT`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] font-semibold shrink-0 select-none"
                              title="Bạn chỉ có quyền xem thông tin của thầy cô khác"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Chỉ xem</span>
                            </span>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                        <div>
                          Email:{" "}
                          <strong className="text-slate-800 dark:text-slate-200">{teacher.email}</strong>
                        </div>
                        <div>
                          SĐT:{" "}
                          {teacher.phone ? (
                            <strong className="text-emerald-700 dark:text-emerald-400">{teacher.phone}</strong>
                          ) : (
                            <span className="italic text-slate-400 dark:text-slate-500">Chưa cập nhật</span>
                          )}
                        </div>
                        <div>
                          Cơ sở:{" "}
                          <strong className="text-slate-800 dark:text-slate-200">{teacher.campus}</strong>
                        </div>
                        <div>
                          Kiêm nhiệm:{" "}
                          <span className="text-amber-700 dark:text-amber-400 font-semibold">
                            {teacher.lab || "Chưa phân công"}
                          </span>
                        </div>
                        <div>
                          Thành tích:{" "}
                          {teacherAchievements.length === 0 ? (
                            <span className="italic text-slate-400 dark:text-slate-500">Chưa cập nhật</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/80 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/70">
                              <Trophy className="w-2.5 h-2.5 text-amber-500" />
                              {teacherAchievements.length} giải thưởng ({selectedSchoolYear})
                            </span>
                          )}
                          {teacherAchievements.length > 0 && (
                            <div className="mt-1.5 space-y-1 pl-2.5 border-l-2 border-amber-400/60 dark:border-amber-500/50">
                              {teacherAchievements.map((ach) => {
                                const isTeacherAward = ach.achievement_of === "Giáo viên đạt giải";
                                return (
                                  <div
                                    key={ach.id}
                                    className="text-[11px] leading-snug text-slate-700 dark:text-slate-300"
                                  >
                                    {isTeacherAward ? (
                                      <>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                          [GV đạt giải]
                                        </span>{" "}
                                        <strong className="text-amber-600 dark:text-amber-400">
                                          {ach.achievement_result}
                                        </strong>{" "}
                                        — {ach.competition_name}{" "}
                                        <span className="text-slate-400 dark:text-slate-500">({ach.level})</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="font-bold text-sky-600 dark:text-sky-400">
                                          [HS: {ach.student_name}
                                          {ach.class_name ? ` - Lớp ${ach.class_name}` : ""}]
                                        </span>{" "}
                                        <strong className="text-amber-600 dark:text-amber-400">
                                          {ach.achievement_result}
                                        </strong>{" "}
                                        — {ach.competition_name}{" "}
                                        <span className="text-slate-400 dark:text-slate-500">({ach.level})</span>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* MODAL THÊM MỚI / CHỈNH SỬA HỒ SƠ GIÁO VIÊN */}
              {isEditProfileModalOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
                  onClick={() => {
                    if (!isSavingProfile) setIsEditProfileModalOpen(false);
                  }}
                >
                  <div
                    className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            profileModalMode === "add"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                              : "bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400"
                          }`}
                        >
                          {profileModalMode === "add" ? (
                            <PlusCircle className="w-4 h-4" />
                          ) : (
                            <Pencil className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {profileModalMode === "add"
                              ? "Thêm Giáo Viên Mới Vào Tổ ICT"
                              : editProfileForm.id === currentUserProfile.id
                              ? "Chỉnh Sửa Thông Tin Cá Nhân"
                              : "Chỉnh Sửa Hồ Sơ Giáo Viên"}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {profileModalMode === "add"
                              ? "Quyền Tổ trưởng: Bổ sung nhân sự mới vào danh bạ Tổ Chuyên môn ICT"
                              : editProfileForm.id === currentUserProfile.id
                              ? "Cập nhật hồ sơ cá nhân của bạn trên hệ thống Nhân sự ICT"
                              : "Quyền Tổ trưởng: Cập nhật thông tin nhân sự trong Tổ Chuyên môn ICT"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditProfileModalOpen(false)}
                        disabled={isSavingProfile}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                        title="Đóng"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();

                        if (!editProfileForm.name.trim()) {
                          showToast("Vui lòng nhập Họ và tên giáo viên!", "warning");
                          return;
                        }

                        if (!editProfileForm.email.trim()) {
                          showToast("Vui lòng nhập địa chỉ Email!", "warning");
                          return;
                        }

                        const campusLabel =
                          editProfileForm.campusId === "all"
                            ? "Bao quát 5 Cơ sở"
                            : campuses.find((c) => c.id === editProfileForm.campusId)?.name || "Sky-Line Riverside";
                        const roleLabel =
                          editProfileForm.roleCode === "leader" ? "Tổ trưởng chuyên môn" : "Giáo viên";

                        // TRƯỜNG HỢP 1: THÊM GIÁO VIÊN MỚI (CHỈ DÀNH CHO TỔ TRƯỞNG)
                        if (profileModalMode === "add") {
                          if (!isLeader) {
                            showToast("Chỉ Tổ trưởng chuyên môn mới có quyền thêm giáo viên mới!", "warning");
                            return;
                          }

                          setIsSavingProfile(true);
                          try {
                            const { data: rpcRes, error: rpcErr } = await supabase.rpc(
                              "create_teacher_profile",
                              {
                                p_full_name: editProfileForm.name.trim(),
                                p_role: editProfileForm.roleCode,
                                p_email: editProfileForm.email.trim(),
                                p_phone_number: editProfileForm.phone.trim(),
                                p_campus_id: editProfileForm.campusId,
                                p_lab_management: editProfileForm.lab.trim() || "Chưa phân công",
                              }
                            );

                            let newProfileId = rpcRes?.profile?.id;

                            if (rpcErr || (rpcRes && rpcRes.success === false)) {
                              if (rpcRes?.message) {
                                throw new Error(rpcRes.message);
                              }
                              const { data: insertedRow, error: directInsertErr } = await supabase
                                .from("profiles")
                                .insert({
                                  full_name: editProfileForm.name.trim(),
                                  role: editProfileForm.roleCode,
                                  email: editProfileForm.email.trim(),
                                  phone_number: editProfileForm.phone.trim(),
                                  campus_id: editProfileForm.campusId,
                                  lab_management: editProfileForm.lab.trim() || "Chưa phân công",
                                  specialty: "Robotics STEM & Tin Học",
                                })
                                .select()
                                .single();

                              if (directInsertErr) {
                                throw new Error(directInsertErr.message);
                              }
                              newProfileId = insertedRow?.id;
                            }

                            const createdTeacher = {
                              id: newProfileId || `t_${Date.now()}`,
                              name: editProfileForm.name.trim(),
                              email: editProfileForm.email.trim(),
                              phone: editProfileForm.phone.trim(),
                              campusId: editProfileForm.campusId,
                              campus: campusLabel,
                              roleCode: editProfileForm.roleCode,
                              role: roleLabel,
                              specialty: "Robotics STEM & Tin Học",
                              lab: editProfileForm.lab.trim() || "Chưa phân công",
                            };

                            setTeachersList((prev) => [...prev, createdTeacher]);
                            setIsEditProfileModalOpen(false);
                            showToast(
                              `Đã thêm ${editProfileForm.name.trim()} vào danh sách Nhân sự ICT!`,
                              "success"
                            );
                          } catch (err: any) {
                            showToast(
                              "Không thể thêm giáo viên: " + (err?.message || "Vui lòng kiểm tra lại kết nối"),
                              "warning"
                            );
                          } finally {
                            setIsSavingProfile(false);
                          }
                          return;
                        }

                        // TRƯỜNG HỢP 2: CHỈNH SỬA HỒ SƠ (TỔ TRƯỞNG HOẶC CHÍNH CHỦ TÀI KHOẢN)
                        const isReallyMine =
                          editProfileForm.id === currentUserProfile.id ||
                          editProfileForm.email.toLowerCase() === currentUserProfile.email.toLowerCase();
                        if (!isLeader && !isReallyMine) {
                          showToast("Bạn chỉ có quyền chỉnh sửa thông tin cá nhân của chính mình!", "warning");
                          return;
                        }

                        setIsSavingProfile(true);
                        try {
                          // 1. Gọi hàm RPC bảo mật trên Supabase
                          const { data: rpcRes, error: rpcErr } = await supabase.rpc(
                            "update_own_teacher_profile",
                            {
                              p_profile_id: editProfileForm.id,
                              p_full_name: editProfileForm.name.trim(),
                              p_role: editProfileForm.roleCode,
                              p_email: editProfileForm.email.trim(),
                              p_phone_number: editProfileForm.phone.trim(),
                              p_campus_id: editProfileForm.campusId,
                              p_lab_management: editProfileForm.lab.trim(),
                            }
                          );

                          if (rpcErr || (rpcRes && rpcRes.success === false)) {
                            const { error: directErr } = await supabase
                              .from("profiles")
                              .update({
                                full_name: editProfileForm.name.trim(),
                                role: editProfileForm.roleCode,
                                email: editProfileForm.email.trim(),
                                phone_number: editProfileForm.phone.trim(),
                                campus_id: editProfileForm.campusId,
                                lab_management: editProfileForm.lab.trim(),
                                updated_at: new Date().toISOString(),
                              })
                              .eq("id", editProfileForm.id);

                            if (directErr) {
                              throw new Error(rpcRes?.message || directErr.message);
                            }
                          }

                          // 2. Cập nhật tức thì danh sách giáo viên trên giao diện
                          setTeachersList((prev) =>
                            prev.map((t) =>
                              t.id === editProfileForm.id
                                ? {
                                    ...t,
                                    name: editProfileForm.name.trim(),
                                    roleCode: editProfileForm.roleCode,
                                    role: roleLabel,
                                    email: editProfileForm.email.trim(),
                                    phone: editProfileForm.phone.trim(),
                                    campusId: editProfileForm.campusId,
                                    campus: campusLabel,
                                    lab: editProfileForm.lab.trim() || "Chưa phân công",
                                  }
                                : t
                            )
                          );

                          // 3. Nếu đang sửa hồ sơ của chính mình thì đồng bộ luôn thông tin ở góc trên bên phải
                          if (editProfileForm.id === currentUserProfile.id) {
                            setCurrentUserProfile((prev) => ({
                              ...prev,
                              name: editProfileForm.name.trim(),
                              email: editProfileForm.email.trim(),
                              role: editProfileForm.roleCode,
                              campus:
                                editProfileForm.campusId === "all"
                                  ? "Sky-Line Riverside (Bao quát 5 cơ sở)"
                                  : `Cơ sở ${campusLabel}`,
                            }));
                          }

                          setIsEditProfileModalOpen(false);
                          showToast(
                            `Đã lưu thay đổi hồ sơ của ${editProfileForm.name.trim()} thành công!`,
                            "success"
                          );
                        } catch (err: any) {
                          showToast(
                            "Không thể lưu thay đổi: " + (err?.message || "Vui lòng kiểm tra lại kết nối"),
                            "warning"
                          );
                        } finally {
                          setIsSavingProfile(false);
                        }
                      }}
                      className="space-y-3.5 text-xs"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* 1. Họ và tên */}
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                            <User className="w-3.5 h-3.5 text-sky-600" />
                            Họ và tên: <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            value={editProfileForm.name}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                            placeholder="Ví dụ: Thầy Nguyễn Văn A"
                            required
                          />
                        </div>

                        {/* 2. Chức vụ */}
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                            <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                            Chức vụ:
                          </label>
                          <select
                            aria-label="Chọn chức vụ"
                            value={editProfileForm.roleCode}
                            onChange={(e) =>
                              setEditProfileForm({
                                ...editProfileForm,
                                roleCode: e.target.value as "leader" | "teacher",
                              })
                            }
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="leader">Tổ trưởng chuyên môn</option>
                            <option value="teacher">Giáo viên</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* 3. Email */}
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                            <Mail className="w-3.5 h-3.5 text-sky-600" />
                            Email: <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            type="email"
                            value={editProfileForm.email}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                            placeholder="Ví dụ: giaovien@skylineschool.edu.vn"
                            required
                          />
                        </div>

                        {/* 4. Số điện thoại (SĐT) */}
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-500" />
                            Số điện thoại (SĐT):
                          </label>
                          <Input
                            type="tel"
                            value={editProfileForm.phone}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                            placeholder="Nhập số điện thoại liên hệ"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* 5. Cơ sở */}
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                            Cơ sở công tác:
                          </label>
                          <select
                            aria-label="Chọn cơ sở công tác"
                            value={editProfileForm.campusId}
                            onChange={(e) =>
                              setEditProfileForm({ ...editProfileForm, campusId: e.target.value })
                            }
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                          >
                            <option value="all">Bao quát 5 Cơ sở</option>
                            <option value="riverside">Sky-Line Riverside</option>
                            <option value="central">Sky-Line Central</option>
                            <option value="international">Sky-Line Global</option>
                            <option value="hill">Sky-Line Hill</option>
                            <option value="beach">Sky-Line Beach</option>
                          </select>
                        </div>

                        {/* 6. Kiêm nhiệm */}
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                            <Laptop className="w-3.5 h-3.5 text-sky-600" />
                            Kiêm nhiệm:
                          </label>
                          <Input
                            value={editProfileForm.lab}
                            onChange={(e) => setEditProfileForm({ ...editProfileForm, lab: e.target.value })}
                            placeholder="Ví dụ: Phòng Lab Sky-Line Riverside Trung Học"
                          />
                        </div>
                      </div>

                      {/* Gợi ý chọn nhanh Kiêm nhiệm phòng Lab */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          Chọn nhanh nhiệm vụ kiêm nhiệm:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Quản trị toàn bộ 6 phòng Lab",
                            "Phòng Lab Sky-Line Riverside Tiểu Học",
                            "Phòng Lab Sky-Line Riverside Trung Học",
                            "Phòng Lab Sky-Line Central",
                            "Phòng Lab Sky-Line Global",
                            "Phòng Lab Sky-Line Hill",
                            "Phòng Lab Sky-Line Beach",
                            "Không kiêm nhiệm",
                          ].map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => setEditProfileForm({ ...editProfileForm, lab: suggestion })}
                              className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                                editProfileForm.lab === suggestion
                                  ? "bg-sky-600 text-white border-sky-600"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400"
                              }`}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditProfileModalOpen(false)}
                          disabled={isSavingProfile}
                        >
                          Hủy bỏ
                        </Button>
                        <Button type="submit" size="sm" isLoading={isSavingProfile}>
                          <Check className="w-4 h-4 mr-1" />
                          {profileModalMode === "add" ? "Thêm giáo viên" : "Lưu thay đổi"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL XÁC NHẬN XÓA GIÁO VIÊN (CHỈ DÀNH CHO TỔ TRƯỞNG) */}
              {deleteConfirmTeacher && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
                  onClick={() => {
                    if (!isDeletingTeacher) setDeleteConfirmTeacher(null);
                  }}
                >
                  <div
                    className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          Xác Nhận Xóa Giáo Viên
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Thầy có chắc chắn muốn xóa hồ sơ của{" "}
                          <strong className="text-slate-900 dark:text-white">
                            {deleteConfirmTeacher.name}
                          </strong>{" "}
                          ({deleteConfirmTeacher.email}) khỏi danh sách Nhân sự Tổ ICT không?
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmTeacher(null)}
                        disabled={isDeletingTeacher}
                      >
                        Hủy bỏ
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        isLoading={isDeletingTeacher}
                        onClick={async () => {
                          if (!isLeader || !deleteConfirmTeacher) return;
                          setIsDeletingTeacher(true);
                          try {
                            const { data: rpcRes, error: rpcErr } = await supabase.rpc(
                              "delete_teacher_profile",
                              {
                                p_profile_id: deleteConfirmTeacher.id,
                              }
                            );

                            if (rpcErr || (rpcRes && rpcRes.success === false)) {
                              if (rpcRes?.message) {
                                throw new Error(rpcRes.message);
                              }
                              const { error: directDelErr } = await supabase
                                .from("profiles")
                                .delete()
                                .eq("id", deleteConfirmTeacher.id);
                              if (directDelErr) {
                                throw new Error(directDelErr.message);
                              }
                            }

                            const deletedName = deleteConfirmTeacher.name;
                            setTeachersList((prev) =>
                              prev.filter((t) => t.id !== deleteConfirmTeacher.id)
                            );
                            setDeleteConfirmTeacher(null);
                            showToast(
                              `Đã xóa hồ sơ ${deletedName} khỏi danh sách Nhân sự ICT!`,
                              "info"
                            );
                          } catch (err: any) {
                            showToast(
                              "Không thể xóa hồ sơ: " + (err?.message || "Vui lòng kiểm tra lại kết nối"),
                              "warning"
                            );
                          } finally {
                            setIsDeletingTeacher(false);
                          }
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Xác nhận xóa
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* MODAL XẾP LỊCH TIẾT DẠY */}
      {isSlotModalOpen && selectedSlotForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-600" />
                  Xếp Lịch Tiết Dạy / Đặt Phòng Lab
                </h3>
                <p className="text-xs text-slate-500">Thứ {selectedSlotForEdit.day} • Tiết {selectedSlotForEdit.period}</p>
              </div>
              <button onClick={() => setIsSlotModalOpen(false)} className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {slotConflictWarning && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{slotConflictWarning}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Khối Lớp Giảng Dạy:</label>
                <Input value={slotForm.className} onChange={(e) => setSlotForm({ ...slotForm, className: e.target.value })} placeholder="Lớp 4/1, Lớp 11A1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Giáo Viên Đứng Lớp:</label>
                  <select
                    value={slotForm.teacher}
                    onChange={(e) => {
                      const t = e.target.value;
                      setSlotForm({ ...slotForm, teacher: t });
                      setSlotConflictWarning(checkSlotConflict(selectedSlotForEdit.day, selectedSlotForEdit.period, t, slotForm.room));
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {teachersList.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Phòng Lab Sky-Line:</label>
                  <select
                    value={slotForm.room}
                    onChange={(e) => {
                      const r = e.target.value;
                      const labObj = LAB_ROOMS.find((l) => l.name === r);
                      setSlotForm({
                        ...slotForm,
                        room: r,
                        labId: labObj?.id || slotForm.labId,
                        campusId: labObj?.campusId || slotForm.campusId,
                      });
                      setSlotConflictWarning(checkSlotConflict(selectedSlotForEdit.day, selectedSlotForEdit.period, slotForm.teacher, r));
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {LAB_ROOMS.map((lab) => (
                      <option key={lab.id} value={lab.name}>
                        {lab.name} ({lab.sheet})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Môn Học / Chủ Đề:</label>
                <Input value={slotForm.subject} onChange={(e) => setSlotForm({ ...slotForm, subject: e.target.value })} placeholder="Robotics Lego Spike, Python..." />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button variant="destructive" size="sm" onClick={handleDeleteSlot}>
                <Trash2 className="w-4 h-4 mr-1" /> Hủy Tiết Này
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsSlotModalOpen(false)}>Đóng Lại</Button>
                <Button size="sm" isLoading={isSubmittingSlot} onClick={handleSaveSlot}>
                  <Check className="w-4 h-4 mr-1" /> Lưu Vào TKB
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* FOOTER HỆ THỐNG CƠ SỞ SKY-LINE & DESIGN BY DAH95 */}
      <SiteFooter />
    </div>
  );
}
