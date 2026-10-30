"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Link2,
  Lock,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  X,
  Check,
  CornerDownRight,
  MessageCircleWarning,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface TeacherProfileItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  campusId: string;
  campus: string;
  roleCode?: "leader" | "teacher";
  role: string;
  specialty: string;
  lab: string;
}

export interface DiscussionLogItem {
  id: string;
  role: "leader" | "teacher";
  sender_name: string;
  action_type: "leader_direction" | "teacher_feedback" | "teacher_confirm";
  content: string;
  created_at: string;
}

export interface IncidentReportItem {
  id: string;
  school_year: string;
  teacher_id: string; // Mã nhân sự đồng bộ từ staff_code (ICT-01, ICT-02...)
  teacher_name: string;
  teacher_email: string;
  campus: string;
  category: string;
  urgency_level: "Khẩn cấp" | "Ưu tiên cao" | "Bình thường";
  incident_date: string; // Định dạng chuẩn Ngày/Tháng/Năm (dd/mm/yyyy)
  impact_scopes: string[];
  description: string;
  proposed_solution: string;
  evidence_link: string;
  status: "Chưa xử lý" | "Đang xử lý" | "Hoàn thành";
  direction_status: "waiting_leader" | "waiting_teacher" | "confirmed";
  latest_leader_direction: string;
  discussion_logs: DiscussionLogItem[];
  confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface IncidentHandlingSectionProps {
  supabase: any;
  showToast: (text: string, type?: "success" | "warning" | "info") => void;
  currentUserProfile: {
    id: string;
    email: string;
    name: string;
    role: "leader" | "teacher" | "guest";
    campus: string;
  };
  teachersList: TeacherProfileItem[];
  selectedSchoolYear: string;
}

export const INCIDENT_CATEGORIES = [
  "1. Sự cố Cơ sở vật chất & Hạ tầng kỹ thuật phòng Lab",
  "2. Chuyên môn giảng dạy & Khung chương trình",
  "3. Kỷ luật phòng máy & An toàn số (Cyber Safety)",
  "4. Thi đấu phong trào, CLB & Sự kiện công nghệ",
  "5. Lịch biểu, Nhân sự & Vận hành nội bộ",
  "6. Ý kiến Phản hồi (Phụ huynh, quản lý lãnh đạo, đồng nghiệp)",
];

export const URGENCY_LEVELS: Array<{
  value: "Khẩn cấp" | "Ưu tiên cao" | "Bình thường";
  label: string;
  desc: string;
  activeClass: string;
  badgeClass: string;
  dotClass: string;
}> = [
  {
    value: "Khẩn cấp",
    label: "Khẩn cấp",
    desc: "Cần xử lý và xin chỉ đạo ngay lập tức",
    activeClass:
      "border-rose-500 bg-rose-50/90 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/25",
    badgeClass:
      "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-500 animate-ping",
  },
  {
    value: "Ưu tiên cao",
    label: "Ưu tiên cao",
    desc: "Ảnh hưởng trực tiếp đến tiết học / vận hành trong ngày",
    activeClass:
      "border-amber-500 bg-amber-50/90 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/25",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  {
    value: "Bình thường",
    label: "Bình thường",
    desc: "Sự vụ phát sinh cần ghi nhận và xử lý theo quy trình",
    activeClass:
      "border-sky-500 bg-sky-50/90 dark:bg-sky-950/50 text-sky-800 dark:text-sky-200 ring-2 ring-sky-500/25",
    badgeClass:
      "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800",
    dotClass: "bg-sky-500",
  },
];

export const IMPACT_SCOPE_OPTIONS = [
  "Phòng Lab",
  "Nhà trường",
  "1 Học sinh",
  "1 Lớp",
  "1 Khối",
  "1 Cấp học",
];

export const INCIDENT_STATUS_OPTIONS: Array<"Chưa xử lý" | "Đang xử lý" | "Hoàn thành"> = [
  "Chưa xử lý",
  "Đang xử lý",
  "Hoàn thành",
];

// Hàm lấy ngày hiện tại theo định dạng chuẩn Ngày/Tháng/Năm (dd/mm/yyyy)
function getTodayDdMmYyyy(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Chuyển đổi từ yyyy-mm-dd (của input type="date") sang dd/mm/yyyy
function isoToDdMmYyyy(isoStr: string): string {
  if (!isoStr) return getTodayDdMmYyyy();
  const parts = isoStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
}

// Chuyển đổi từ dd/mm/yyyy sang yyyy-mm-dd (để đồng bộ với lịch chọn ngày)
function ddMmYyyyToIso(ddMmYyyy: string): string {
  if (!ddMmYyyy) return "";
  const parts = ddMmYyyy.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(ddMmYyyy)) {
    return ddMmYyyy;
  }
  return "";
}

export function IncidentHandlingSection({
  supabase,
  showToast,
  currentUserProfile,
  teachersList,
  selectedSchoolYear,
}: IncidentHandlingSectionProps) {
  const isLeader = currentUserProfile?.role === "leader";
  const isGuest = currentUserProfile?.role === "guest";
  const datePickerInputRef = useRef<HTMLInputElement>(null);

  // Danh sách giáo viên (không tính Tổ trưởng) để suy luận mã nhân sự mặc định giống bảng Đánh giá năng lực
  const eligibleTeachers = useMemo(() => {
    return teachersList.filter(
      (t) => t.roleCode !== "leader" && !t.role.toLowerCase().includes("tổ trưởng")
    );
  }, [teachersList]);

  // Thông tin giáo viên đang đăng nhập từ Danh bạ Nhân sự ICT (Phần 1)
  const currentTeacherObj = useMemo(() => {
    return (
      teachersList.find(
        (t) =>
          t.id === currentUserProfile?.id ||
          (Boolean(t.email) &&
            Boolean(currentUserProfile?.email) &&
            t.email.toLowerCase() === currentUserProfile.email.toLowerCase())
      ) || null
    );
  }, [teachersList, currentUserProfile]);

  // Bản đồ Mã nhân sự (staff_code) đồng bộ từ bảng teacher_competency_evaluations
  const [staffCodeMap, setStaffCodeMap] = useState<Record<string, string>>({});

  // Danh sách sự vụ từ bảng public.incident_reports
  const [incidentsList, setIncidentsList] = useState<IncidentReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingNew, setIsSubmittingNew] = useState<boolean>(false);

  // State biểu mẫu 10 mục dành cho Giáo viên báo cáo sự vụ mới
  const [formCategory, setFormCategory] = useState<string>(INCIDENT_CATEGORIES[0]);
  const [formUrgency, setFormUrgency] = useState<"Khẩn cấp" | "Ưu tiên cao" | "Bình thường">("Bình thường");
  const [formIncidentDate, setFormIncidentDate] = useState<string>(getTodayDdMmYyyy());
  const [formImpactScopes, setFormImpactScopes] = useState<string[]>(["Phòng Lab"]);
  const [formDescription, setFormDescription] = useState<string>("");
  const [formProposedSolution, setFormProposedSolution] = useState<string>("");
  const [formEvidenceLink, setFormEvidenceLink] = useState<string>("");
  const [formStatus, setFormStatus] = useState<"Chưa xử lý" | "Đang xử lý" | "Hoàn thành">("Chưa xử lý");

  // State bộ lọc dành cho Bảng theo dõi của Tổ trưởng
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterTeacherCode, setFilterTeacherCode] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDirectionStatus, setFilterDirectionStatus] = useState<string>("all");

  // State cửa sổ xem chi tiết & cho ý kiến chỉ đạo / phản hồi
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [leaderDirectionText, setLeaderDirectionText] = useState<string>("");
  const [isSubmittingDirection, setIsSubmittingDirection] = useState<boolean>(false);

  // State dành cho Giáo viên khi phản hồi lại ý kiến chỉ đạo của Tổ trưởng
  const [feedbackOpenMap, setFeedbackOpenMap] = useState<Record<string, boolean>>({});
  const [feedbackTextMap, setFeedbackTextMap] = useState<Record<string, string>>({});
  const [isSubmittingTeacherActionId, setIsSubmittingTeacherActionId] = useState<string | null>(null);

  // Hàm lấy Mã nhân sự chuẩn (staff_code) cho 1 giáo viên
  const getStaffCodeForTeacher = useCallback(
    (teacher: TeacherProfileItem | null): string => {
      if (!teacher) return "ICT-01";
      if (staffCodeMap[teacher.id]) return staffCodeMap[teacher.id];
      if (teacher.email && staffCodeMap[teacher.email.toLowerCase()]) {
        return staffCodeMap[teacher.email.toLowerCase()];
      }
      const idx = eligibleTeachers.findIndex(
        (t) =>
          t.id === teacher.id ||
          (Boolean(t.email) &&
            Boolean(teacher.email) &&
            t.email.toLowerCase() === teacher.email.toLowerCase())
      );
      if (idx >= 0) {
        return `ICT-0${idx + 1}`;
      }
      return "ICT-01";
    },
    [staffCodeMap, eligibleTeachers]
  );

  // Mã nhân sự & Cơ sở tự động của giáo viên đang đăng nhập
  const currentTeacherStaffCode = useMemo(
    () => getStaffCodeForTeacher(currentTeacherObj),
    [getStaffCodeForTeacher, currentTeacherObj]
  );

  const currentTeacherCampus = useMemo(
    () => currentTeacherObj?.campus || currentUserProfile?.campus || "Sky-Line Riverside",
    [currentTeacherObj, currentUserProfile]
  );

  // Đồng bộ staff_code từ bảng teacher_competency_evaluations
  const loadStaffCodes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("teacher_competency_evaluations")
        .select("teacher_id, teacher_email, staff_code")
        .eq("school_year", selectedSchoolYear);

      const map: Record<string, string> = {};
      eligibleTeachers.forEach((t, index) => {
        const defaultCode = `ICT-0${index + 1}`;
        map[t.id] = defaultCode;
        if (t.email) map[t.email.toLowerCase()] = defaultCode;
      });

      if (!error && Array.isArray(data)) {
        data.forEach((row: any) => {
          if (row.staff_code) {
            if (row.teacher_id) map[row.teacher_id] = row.staff_code;
            if (row.teacher_email) map[row.teacher_email.toLowerCase()] = row.staff_code;
          }
        });
      }
      setStaffCodeMap(map);
    } catch {
      // Bỏ qua lỗi kết nối tạm thời
    }
  }, [supabase, selectedSchoolYear, eligibleTeachers]);

  // Tải danh sách sự vụ từ bảng public.incident_reports
  const loadIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("incident_reports")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const normalized: IncidentReportItem[] = data.map((row: any) => ({
          id: row.id,
          school_year: row.school_year || selectedSchoolYear,
          teacher_id: row.teacher_id || "ICT-01",
          teacher_name: row.teacher_name || "",
          teacher_email: row.teacher_email || "",
          campus: row.campus || "",
          category: row.category || INCIDENT_CATEGORIES[0],
          urgency_level:
            row.urgency_level === "Khẩn cấp" ||
            row.urgency_level === "Ưu tiên cao" ||
            row.urgency_level === "Bình thường"
              ? row.urgency_level
              : "Bình thường",
          incident_date: isoToDdMmYyyy(row.incident_date || getTodayDdMmYyyy()),
          impact_scopes: Array.isArray(row.impact_scopes) ? row.impact_scopes : [],
          description: row.description || "",
          proposed_solution: row.proposed_solution || "",
          evidence_link: row.evidence_link || "",
          status:
            row.status === "Hoàn thành" ||
            row.status === "Đang xử lý" ||
            row.status === "Chưa xử lý"
              ? row.status
              : "Chưa xử lý",
          direction_status:
            row.direction_status === "waiting_teacher" ||
            row.direction_status === "confirmed"
              ? row.direction_status
              : "waiting_leader",
          latest_leader_direction: row.latest_leader_direction || "",
          discussion_logs: Array.isArray(row.discussion_logs) ? row.discussion_logs : [],
          confirmed_at: row.confirmed_at || null,
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
        }));
        setIncidentsList(normalized);
      }
    } catch {
      // Bỏ qua lỗi kết nối tạm thời
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedSchoolYear]);

  useEffect(() => {
    loadStaffCodes();
    loadIncidents();

    const channel = supabase
      .channel(`incident_reports_${selectedSchoolYear}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incident_reports",
        },
        () => {
          loadIncidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedSchoolYear, loadStaffCodes, loadIncidents]);

  // Hàm gửi thông báo lên quả chuông NotificationBell
  const sendNotificationToTargets = async (params: {
    recipientIds: string[];
    actionType: "INSERT" | "UPDATE";
    title: string;
    message: string;
  }) => {
    const uniqueRecipients = Array.from(new Set(params.recipientIds.filter(Boolean)));
    if (uniqueRecipients.length === 0) return;

    try {
      const rows = uniqueRecipients.map((recipientId) => ({
        recipient_id: recipientId,
        actor_id: currentUserProfile?.id || null,
        actor_name: currentUserProfile?.name || "Hệ thống Sự vụ ICT",
        actor_role: isLeader ? "Tổ trưởng chuyên môn" : "Giáo viên",
        action_type: params.actionType,
        category: "incident",
        title: params.title,
        message: params.message,
        target_tab: "tasks",
        is_read: false,
      }));
      await supabase.from("notifications").insert(rows);
    } catch {
      // Không chặn luồng chính nếu bảng thông báo bận
    }
  };

  // Tìm danh sách ID tài khoản của Tổ trưởng để nhận thông báo từ Giáo viên
  const leaderProfileIds = useMemo(() => {
    const ids = teachersList
      .filter((t) => t.roleCode === "leader" || t.role.toLowerCase().includes("tổ trưởng"))
      .map((t) => t.id);
    if (ids.length === 0) {
      return ["a0000001-0000-0000-0000-000000000001"];
    }
    return ids;
  }, [teachersList]);

  // Tìm ID tài khoản (UUID trong profiles) của Giáo viên dựa vào teacher_id (staff_code) hoặc teacher_email
  const findTeacherProfileId = useCallback(
    (incident: IncidentReportItem): string | null => {
      const matched = teachersList.find(
        (t) =>
          (Boolean(t.email) &&
            Boolean(incident.teacher_email) &&
            t.email.toLowerCase() === incident.teacher_email.toLowerCase()) ||
          getStaffCodeForTeacher(t) === incident.teacher_id ||
          t.name.toLowerCase().trim() === incident.teacher_name.toLowerCase().trim()
      );
      return matched?.id || null;
    },
    [teachersList, getStaffCodeForTeacher]
  );

  // Chuyển đổi chọn Checkbox Phạm vi ảnh hưởng (Mục 6)
  const handleToggleImpactScope = (scope: string) => {
    setFormImpactScopes((prev) =>
      prev.includes(scope) ? prev.filter((item) => item !== scope) : [...prev, scope]
    );
  };

  // =========================================================================
  // 1. GIÁO VIÊN XÁC NHẬN GỬI BÁO CÁO SỰ VỤ MỚI (10 MỤC)
  // =========================================================================
  const handleCreateIncidentReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      showToast("Tài khoản khách chỉ có quyền xem!", "warning");
      return;
    }

    if (!formDescription.trim()) {
      showToast("Vui lòng nhập Mô tả chi tiết sự việc (Mục 7)!", "warning");
      return;
    }

    if (formImpactScopes.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 Phạm vi ảnh hưởng (Mục 6)!", "warning");
      return;
    }

    // Đảm bảo ngày xảy ra sự việc lưu chuẩn định dạng Ngày/Tháng/Năm (dd/mm/yyyy)
    const formattedDate = isoToDdMmYyyy(formIncidentDate.trim() || getTodayDdMmYyyy());

    setIsSubmittingNew(true);
    try {
      const newPayload = {
        school_year: selectedSchoolYear,
        teacher_id: currentTeacherStaffCode, // Lưu trực tiếp Mã nhân sự (ICT-01, ICT-02...)
        teacher_name: currentTeacherObj?.name || currentUserProfile.name,
        teacher_email: currentTeacherObj?.email || currentUserProfile.email,
        campus: currentTeacherCampus,
        category: formCategory,
        urgency_level: formUrgency,
        incident_date: formattedDate, // Lưu chuẩn dd/mm/yyyy (ví dụ: 30/10/2026)
        impact_scopes: formImpactScopes,
        description: formDescription.trim(),
        proposed_solution: formProposedSolution.trim(),
        evidence_link: formEvidenceLink.trim(),
        status: formStatus,
        direction_status: "waiting_leader",
        latest_leader_direction: "",
        discussion_logs: [],
      };

      const { data: inserted, error } = await supabase
        .from("incident_reports")
        .insert(newPayload)
        .select()
        .single();

      if (error) throw error;

      // Gửi thông báo tức thời đến tài khoản Tổ trưởng
      await sendNotificationToTargets({
        recipientIds: leaderProfileIds,
        actionType: "INSERT",
        title: `[Báo cáo sự vụ - ${formUrgency}] ${currentTeacherObj?.name || currentUserProfile.name} (${currentTeacherStaffCode})`,
        message: `${currentTeacherObj?.name || currentUserProfile.name} (${currentTeacherCampus}) vừa gửi báo cáo sự vụ "${formCategory}" ngày ${formattedDate}. Mời Tổ trưởng xem và cho ý kiến chỉ đạo!`,
      });

      // Làm mới form về mặc định để sẵn sàng cho báo cáo tiếp theo
      setFormDescription("");
      setFormProposedSolution("");
      setFormEvidenceLink("");
      setFormUrgency("Bình thường");
      setFormStatus("Chưa xử lý");
      setFormImpactScopes(["Phòng Lab"]);
      setFormIncidentDate(getTodayDdMmYyyy());

      await loadIncidents();
      if (inserted?.id) {
        setSelectedIncidentId(inserted.id);
      }

      showToast(
        "Đã xác nhận gửi báo cáo sự vụ thành công! Hệ thống đã gửi thông báo đến Tổ trưởng để xin ý kiến chỉ đạo.",
        "success"
      );
    } catch (err: any) {
      showToast("Không thể gửi báo cáo sự vụ: " + (err?.message || "Lỗi kết nối"), "warning");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // =========================================================================
  // 2. TỔ TRƯỞNG CHO Ý KIẾN CHỈ ĐẠO & BẤM XÁC NHẬN
  // =========================================================================
  const handleLeaderConfirmDirection = async (incident: IncidentReportItem) => {
    if (!isLeader) {
      showToast("Chỉ Tổ trưởng chuyên môn mới có quyền cho ý kiến chỉ đạo!", "warning");
      return;
    }

    const trimmedDirection = leaderDirectionText.trim();
    if (!trimmedDirection) {
      showToast("Vui lòng nhập nội dung Ý kiến chỉ đạo của Tổ trưởng trước khi bấm Xác nhận!", "warning");
      return;
    }

    setIsSubmittingDirection(true);
    try {
      const newLogItem: DiscussionLogItem = {
        id: `dir_${Date.now()}`,
        role: "leader",
        sender_name: currentUserProfile.name || "Tổ trưởng chuyên môn",
        action_type: "leader_direction",
        content: trimmedDirection,
        created_at: new Date().toISOString(),
      };

      const nextLogs = [...(incident.discussion_logs || []), newLogItem];

      const { error } = await supabase
        .from("incident_reports")
        .update({
          latest_leader_direction: trimmedDirection,
          direction_status: "waiting_teacher",
          discussion_logs: nextLogs,
          updated_at: new Date().toISOString(),
        })
        .eq("id", incident.id);

      if (error) throw error;

      // Gửi thông báo đến tài khoản của Giáo viên báo cáo sự vụ đó
      const teacherProfileId = findTeacherProfileId(incident);
      if (teacherProfileId) {
        await sendNotificationToTargets({
          recipientIds: [teacherProfileId],
          actionType: "UPDATE",
          title: `[Ý kiến chỉ đạo từ Tổ trưởng] Sự vụ ngày ${incident.incident_date}`,
          message: `Tổ trưởng ${currentUserProfile.name} đã xác nhận ý kiến chỉ đạo cho sự vụ "${incident.category}": "${trimmedDirection}". Thầy/Cô vui lòng vào Phần 2: Xử lý sự vụ để xác nhận thực hiện hoặc phản hồi!`,
        });
      }

      setLeaderDirectionText("");
      await loadIncidents();
      showToast(
        `Đã xác nhận ý kiến chỉ đạo và gửi thông báo đến ${incident.teacher_name} (${incident.teacher_id})!`,
        "success"
      );
    } catch (err: any) {
      showToast("Lỗi khi lưu ý kiến chỉ đạo: " + (err?.message || "Vui lòng thử lại"), "warning");
    } finally {
      setIsSubmittingDirection(false);
    }
  };

  // =========================================================================
  // 3. GIÁO VIÊN NHẬN Ý KIẾN CHỈ ĐẠO - LUỒNG 1: XÁC NHẬN & THỰC HIỆN CHỈ ĐẠO
  // =========================================================================
  const handleTeacherConfirmExecution = async (incident: IncidentReportItem) => {
    setIsSubmittingTeacherActionId(incident.id);
    try {
      const confirmLog: DiscussionLogItem = {
        id: `conf_${Date.now()}`,
        role: "teacher",
        sender_name: currentTeacherObj?.name || currentUserProfile.name,
        action_type: "teacher_confirm",
        content:
          "Giáo viên đã tiếp nhận, xác nhận đồng thuận và tiến hành thực hiện theo đúng ý kiến chỉ đạo của Tổ trưởng.",
        created_at: new Date().toISOString(),
      };

      const nextLogs = [...(incident.discussion_logs || []), confirmLog];
      const nextStatus = incident.status === "Chưa xử lý" ? "Đang xử lý" : incident.status;

      const { error } = await supabase
        .from("incident_reports")
        .update({
          direction_status: "confirmed",
          status: nextStatus,
          discussion_logs: nextLogs,
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", incident.id);

      if (error) throw error;

      // Gửi thông báo cho Tổ trưởng biết giáo viên đã xác nhận thực hiện chỉ đạo
      await sendNotificationToTargets({
        recipientIds: leaderProfileIds,
        actionType: "UPDATE",
        title: `[Đã xác nhận thực hiện chỉ đạo] ${incident.teacher_name} (${incident.teacher_id})`,
        message: `${incident.teacher_name} đã xác nhận thực hiện theo ý kiến chỉ đạo của Tổ trưởng đối với sự vụ "${incident.category}" (Ngày ${incident.incident_date}).`,
      });

      setFeedbackOpenMap((prev) => ({ ...prev, [incident.id]: false }));
      await loadIncidents();
      showToast(
        "Đã xác nhận thực hiện theo ý kiến chỉ đạo của Tổ trưởng! Luồng trao đổi chỉ đạo đã hoàn tất.",
        "success"
      );
    } catch (err: any) {
      showToast("Không thể xác nhận: " + (err?.message || "Vui lòng thử lại"), "warning");
    } finally {
      setIsSubmittingTeacherActionId(null);
    }
  };

  // =========================================================================
  // 4. GIÁO VIÊN NHẬN Ý KIẾN CHỈ ĐẠO - LUỒNG 2: TIẾP TỤC PHẢN HỒI Ý KIẾN CHỈ ĐẠO
  // =========================================================================
  const handleTeacherSubmitFeedback = async (incident: IncidentReportItem) => {
    const feedbackContent = (feedbackTextMap[incident.id] || "").trim();
    if (!feedbackContent) {
      showToast("Vui lòng nhập nội dung phản hồi gửi tới Tổ trưởng!", "warning");
      return;
    }

    setIsSubmittingTeacherActionId(incident.id);
    try {
      const feedbackLog: DiscussionLogItem = {
        id: `fb_${Date.now()}`,
        role: "teacher",
        sender_name: currentTeacherObj?.name || currentUserProfile.name,
        action_type: "teacher_feedback",
        content: feedbackContent,
        created_at: new Date().toISOString(),
      };

      const nextLogs = [...(incident.discussion_logs || []), feedbackLog];

      const { error } = await supabase
        .from("incident_reports")
        .update({
          direction_status: "waiting_leader",
          discussion_logs: nextLogs,
          updated_at: new Date().toISOString(),
        })
        .eq("id", incident.id);

      if (error) throw error;

      // Gửi thông báo cho Tổ trưởng về ý kiến phản hồi của Giáo viên
      await sendNotificationToTargets({
        recipientIds: leaderProfileIds,
        actionType: "UPDATE",
        title: `[Phản hồi chỉ đạo sự vụ] ${incident.teacher_name} (${incident.teacher_id})`,
        message: `${incident.teacher_name} vừa phản hồi về ý kiến chỉ đạo đối với sự vụ "${incident.category}": "${feedbackContent}". Mời Tổ trưởng xem và cho ý kiến chỉ đạo tiếp theo!`,
      });

      setFeedbackTextMap((prev) => ({ ...prev, [incident.id]: "" }));
      setFeedbackOpenMap((prev) => ({ ...prev, [incident.id]: false }));
      await loadIncidents();
      showToast(
        "Đã gửi phản hồi ý kiến chỉ đạo đến Tổ trưởng! Hệ thống sẽ thông báo ngay khi Tổ trưởng cho ý kiến mới.",
        "success"
      );
    } catch (err: any) {
      showToast("Không thể gửi phản hồi: " + (err?.message || "Vui lòng thử lại"), "warning");
    } finally {
      setIsSubmittingTeacherActionId(null);
    }
  };

  // =========================================================================
  // 5. CẬP NHẬT TÌNH TRẠNG GIẢI QUYẾT SỰ VỤ (HOÀN THÀNH / ĐANG XỬ LÝ / CHƯA XỬ LÝ)
  // =========================================================================
  const handleUpdateIncidentStatus = async (
    incident: IncidentReportItem,
    newStatus: "Chưa xử lý" | "Đang xử lý" | "Hoàn thành"
  ) => {
    if (incident.status === newStatus) return;

    try {
      const { error } = await supabase
        .from("incident_reports")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", incident.id);

      if (error) throw error;

      setIncidentsList((prev) =>
        prev.map((item) => (item.id === incident.id ? { ...item, status: newStatus } : item))
      );

      // Nếu giáo viên cập nhật tình trạng, thông báo cho Tổ trưởng nắm tình hình
      if (!isLeader) {
        await sendNotificationToTargets({
          recipientIds: leaderProfileIds,
          actionType: "UPDATE",
          title: `[Cập nhật tình trạng sự vụ: ${newStatus}] ${incident.teacher_name} (${incident.teacher_id})`,
          message: `${incident.teacher_name} đã cập nhật tình trạng sự vụ "${incident.category}" (Ngày ${incident.incident_date}) sang trạng thái: "${newStatus}".`,
        });
      }

      showToast(`Đã cập nhật tình trạng sự vụ thành "${newStatus}"!`, "success");
    } catch (err: any) {
      showToast("Lỗi khi cập nhật tình trạng: " + (err?.message || "Vui lòng thử lại"), "warning");
    }
  };

  // Danh sách sự vụ thuộc về riêng Giáo viên đang đăng nhập
  const myIncidentsList = useMemo(() => {
    return incidentsList.filter((item) => {
      if (
        Boolean(item.teacher_email) &&
        Boolean(currentUserProfile?.email) &&
        item.teacher_email.toLowerCase() === currentUserProfile.email.toLowerCase()
      ) {
        return true;
      }
      if (item.teacher_id === currentTeacherStaffCode) {
        return true;
      }
      return (
        item.teacher_name.toLowerCase().trim() ===
        (currentTeacherObj?.name || currentUserProfile?.name || "").toLowerCase().trim()
      );
    });
  }, [incidentsList, currentUserProfile, currentTeacherStaffCode, currentTeacherObj]);

  // Danh sách sự vụ đã lọc cho Bảng theo dõi của Tổ trưởng
  const filteredLeaderIncidents = useMemo(() => {
    return incidentsList.filter((item) => {
      if (filterTeacherCode !== "all" && item.teacher_id !== filterTeacherCode) {
        return false;
      }
      if (filterCategory !== "all" && item.category !== filterCategory) {
        return false;
      }
      if (filterUrgency !== "all" && item.urgency_level !== filterUrgency) {
        return false;
      }
      if (filterStatus !== "all" && item.status !== filterStatus) {
        return false;
      }
      if (filterDirectionStatus !== "all" && item.direction_status !== filterDirectionStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const combined = `${item.teacher_id} ${item.teacher_name} ${item.campus} ${item.category} ${item.description} ${item.proposed_solution} ${item.latest_leader_direction}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }
      return true;
    });
  }, [
    incidentsList,
    filterTeacherCode,
    filterCategory,
    filterUrgency,
    filterStatus,
    filterDirectionStatus,
    searchQuery,
  ]);

  // Thống kê nhanh cho Tổ trưởng
  const leaderStats = useMemo(() => {
    const total = incidentsList.length;
    const urgentCount = incidentsList.filter(
      (i) => i.urgency_level === "Khẩn cấp" || i.urgency_level === "Ưu tiên cao"
    ).length;
    const waitingLeaderCount = incidentsList.filter(
      (i) => i.direction_status === "waiting_leader"
    ).length;
    const completedCount = incidentsList.filter((i) => i.status === "Hoàn thành").length;
    return { total, urgentCount, waitingLeaderCount, completedCount };
  }, [incidentsList]);

  // Sự vụ đang được chọn mở trong Modal chi tiết (cho Tổ trưởng)
  const selectedIncident = useMemo(
    () => incidentsList.find((i) => i.id === selectedIncidentId) || null,
    [incidentsList, selectedIncidentId]
  );

  // Định dạng hiển thị thời gian của nhật ký hội thoại
  const formatDateTimeVN = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  // Hiển thị nhãn Mức độ khẩn cấp
  const renderUrgencyBadge = (urgency: IncidentReportItem["urgency_level"]) => {
    const cfg = URGENCY_LEVELS.find((u) => u.value === urgency) || URGENCY_LEVELS[2];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${cfg.badgeClass}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
        {cfg.label}
      </span>
    );
  };

  // Hiển thị nhãn Tình trạng giải quyết sự vụ
  const renderStatusBadge = (status: IncidentReportItem["status"]) => {
    if (status === "Hoàn thành") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          Hoàn thành
        </span>
      );
    }
    if (status === "Đang xử lý") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
          <Clock className="w-3 h-3" />
          Đang xử lý
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
        <AlertTriangle className="w-3 h-3 text-amber-500" />
        Chưa xử lý
      </span>
    );
  };

  // Hiển thị nhãn Trạng thái luồng chỉ đạo
  const renderDirectionStatusBadge = (incident: IncidentReportItem) => {
    const hasTeacherFeedback =
      incident.discussion_logs.length > 0 &&
      incident.discussion_logs[incident.discussion_logs.length - 1]?.action_type ===
        "teacher_feedback";

    if (incident.direction_status === "confirmed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <Check className="w-3.5 h-3.5" />
          GV đã xác nhận thực hiện chỉ đạo
        </span>
      );
    }

    if (incident.direction_status === "waiting_teacher") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          <MessageSquare className="w-3.5 h-3.5" />
          Đã chỉ đạo • Chờ GV xác nhận
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
        <MessageCircleWarning className="w-3.5 h-3.5" />
        {hasTeacherFeedback ? "GV vừa phản hồi • Chờ chỉ đạo tiếp" : "Mới gửi • Chờ Tổ trưởng chỉ đạo"}
      </span>
    );
  };

  // =========================================================================
  // GIAO DIỆN 1: TÀI KHOẢN TỔ TRƯỞNG (BẢNG TỔNG HỢP THEO DÕI & CHỈ ĐẠO SỰ VỤ)
  // =========================================================================
  if (isLeader) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* KHUNG TIÊU ĐỀ & 4 THẺ THỐNG KÊ NHANH CHO TỔ TRƯỞNG */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Phần 2: Quản Trị & Chỉ Đạo Xử Lý Sự Vụ Toàn Tổ ({selectedSchoolYear})
                  </h2>
                  <Badge variant="amber" className="text-[11px] font-bold">
                    👑 Quyền Tổ Trưởng (Giám sát & Cho ý kiến chỉ đạo)
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Theo dõi toàn bộ sự vụ do giáo viên báo cáo, cho ý kiến chỉ đạo trực tiếp và giám sát tình trạng xử lý (Hoàn thành / Đang xử lý / Chưa xử lý).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={loadIncidents}
                disabled={isLoading}
                className="font-bold text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
                Làm mới bảng
              </Button>
            </div>
          </div>

          {/* 4 THẺ CHỈ SỐ NHANH */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tổng Số Sự Vụ</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {leaderStats.total}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  Cần Tổ Trưởng Chỉ Đạo
                </p>
                <p className="text-xl font-black text-amber-800 dark:text-amber-200 mt-0.5">
                  {leaderStats.waitingLeaderCount}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-200/70 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
                <MessageCircleWarning className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                  Khẩn Cấp & Ưu Tiên Cao
                </p>
                <p className="text-xl font-black text-rose-800 dark:text-rose-200 mt-0.5">
                  {leaderStats.urgentCount}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-200/70 dark:bg-rose-900/60 flex items-center justify-center text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  Đã Giải Quyết Hoàn Thành
                </p>
                <p className="text-xl font-black text-emerald-800 dark:text-emerald-200 mt-0.5">
                  {leaderStats.completedCount}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-200/70 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* THANH BỘ LỌC & TÌM KIẾM DÀNH CHO TỔ TRƯỞNG */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-2">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên GV, mã ICT, nội dung sự việc..."
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>

            <select
              aria-label="Lọc theo giáo viên"
              value={filterTeacherCode}
              onChange={(e) => setFilterTeacherCode(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Tất cả Giáo viên</option>
              {eligibleTeachers.map((t) => {
                const code = getStaffCodeForTeacher(t);
                return (
                  <option key={t.id} value={code}>
                    {code} - {t.name}
                  </option>
                );
              })}
            </select>

            <select
              aria-label="Lọc theo mức độ khẩn cấp"
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Mọi mức độ khẩn cấp</option>
              <option value="Khẩn cấp">🔴 Khẩn cấp</option>
              <option value="Ưu tiên cao">🟠 Ưu tiên cao</option>
              <option value="Bình thường">🔵 Bình thường</option>
            </select>

            <select
              aria-label="Lọc theo trạng thái chỉ đạo"
              value={filterDirectionStatus}
              onChange={(e) => setFilterDirectionStatus(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Mọi trạng thái chỉ đạo</option>
              <option value="waiting_leader">⏳ Chờ Tổ trưởng chỉ đạo</option>
              <option value="waiting_teacher">💬 Chờ Giáo viên xác nhận</option>
              <option value="confirmed">✅ GV đã xác nhận thực hiện</option>
            </select>

            <select
              aria-label="Lọc theo tình trạng sự vụ"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Mọi tình trạng xử lý</option>
              <option value="Chưa xử lý">Chưa xử lý</option>
              <option value="Đang xử lý">Đang xử lý</option>
              <option value="Hoàn thành">Hoàn thành</option>
            </select>
          </div>
        </div>

        {/* BẢNG TỔNG HỢP TOÀN BỘ CÁC SỰ VỤ CỦA GIÁO VIÊN TRONG TỔ */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Bảng Theo Dõi Toàn Bộ Sự Vụ Của Giáo Viên ({filteredLeaderIncidents.length} sự vụ)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Bấm vào nút <strong>“Cho ý kiến chỉ đạo / Chi tiết”</strong> ở từng dòng để xem toàn bộ nội dung và gửi chỉ đạo
            </span>
          </div>

          {filteredLeaderIncidents.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Hiện chưa có sự vụ nào trong danh sách theo bộ lọc hiện tại
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Khi giáo viên trong tổ gửi báo cáo sự vụ mới, thông tin sẽ lập tức hiển thị tại bảng này kèm thông báo trên chuông.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-extrabold uppercase text-[11px]">
                    <th className="py-3 px-3.5 whitespace-nowrap">STT / Mã NV</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Giáo viên & Cơ sở</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Thời gian & Mức độ</th>
                    <th className="py-3 px-3.5 min-w-[210px]">Phân loại & Phạm vi</th>
                    <th className="py-3 px-3.5 min-w-[250px]">Mô tả sự việc & Đề xuất của GV</th>
                    <th className="py-3 px-3.5 min-w-[230px]">Trạng thái & Ý kiến chỉ đạo</th>
                    <th className="py-3 px-3.5 whitespace-nowrap text-center">Tình trạng sự vụ</th>
                    <th className="py-3 px-3.5 whitespace-nowrap text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLeaderIncidents.map((incident, idx) => {
                    const isNeedsLeader = incident.direction_status === "waiting_leader";
                    return (
                      <tr
                        key={incident.id}
                        className={`transition-colors ${
                          isNeedsLeader
                            ? "bg-amber-50/40 dark:bg-amber-950/15 hover:bg-amber-50/80 dark:hover:bg-amber-950/30"
                            : "hover:bg-slate-50/90 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        {/* 1. STT & Mã nhân sự */}
                        <td className="py-3.5 px-3.5 align-top whitespace-nowrap">
                          <div className="font-black text-slate-900 dark:text-white">#{idx + 1}</div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-extrabold text-[10px]">
                            {incident.teacher_id}
                          </span>
                        </td>

                        {/* 2. Giáo viên & Cơ sở */}
                        <td className="py-3.5 px-3.5 align-top whitespace-nowrap">
                          <div className="font-extrabold text-slate-900 dark:text-white text-[13px]">
                            {incident.teacher_name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-sky-600 shrink-0" />
                            <span>{incident.campus}</span>
                          </div>
                        </td>

                        {/* 3. Thời gian xảy ra (dd/mm/yyyy) & Mức độ khẩn cấp */}
                        <td className="py-3.5 px-3.5 align-top whitespace-nowrap space-y-1.5">
                          <div className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                            <Calendar className="w-3 h-3 text-sky-600" />
                            <span>{incident.incident_date}</span>
                          </div>
                          <div>{renderUrgencyBadge(incident.urgency_level)}</div>
                        </td>

                        {/* 4. Phân loại & Phạm vi ảnh hưởng */}
                        <td className="py-3.5 px-3.5 align-top">
                          <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                            {incident.category}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {incident.impact_scopes.map((scope) => (
                              <span
                                key={scope}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold"
                              >
                                {scope}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* 5. Mô tả chi tiết & Đề xuất của GV + Link minh chứng */}
                        <td className="py-3.5 px-3.5 align-top space-y-1.5">
                          <p className="text-slate-800 dark:text-slate-200 line-clamp-2 font-medium">
                            <span className="font-extrabold text-slate-900 dark:text-white">Sự việc: </span>
                            {incident.description}
                          </p>
                          {incident.proposed_solution && (
                            <p className="text-slate-600 dark:text-slate-400 line-clamp-2 text-[11px]">
                              <span className="font-bold text-sky-700 dark:text-sky-400">Đề xuất GV: </span>
                              {incident.proposed_solution}
                            </p>
                          )}
                          {incident.evidence_link && (
                            <a
                              href={
                                incident.evidence_link.startsWith("http")
                                  ? incident.evidence_link
                                  : `https://${incident.evidence_link}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Xem minh chứng đính kèm
                            </a>
                          )}
                        </td>

                        {/* 6. Trạng thái chỉ đạo & Nội dung chỉ đạo / phản hồi mới nhất */}
                        <td className="py-3.5 px-3.5 align-top space-y-1.5">
                          <div>{renderDirectionStatusBadge(incident)}</div>
                          {incident.latest_leader_direction ? (
                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2">
                              <span className="font-extrabold text-amber-700 dark:text-amber-400">
                                Chỉ đạo TTCM:{" "}
                              </span>
                              {incident.latest_leader_direction}
                            </div>
                          ) : (
                            <p className="text-[11px] italic text-slate-400">
                              Chưa có ý kiến chỉ đạo
                            </p>
                          )}
                        </td>

                        {/* 7. Tình trạng sự vụ */}
                        <td className="py-3.5 px-3.5 align-top text-center whitespace-nowrap">
                          {renderStatusBadge(incident.status)}
                        </td>

                        {/* 8. Nút thao tác của Tổ trưởng */}
                        <td className="py-3.5 px-3.5 align-top text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedIncidentId(incident.id);
                              setLeaderDirectionText("");
                            }}
                            className={`h-8 text-xs font-extrabold rounded-xl cursor-pointer ${
                              isNeedsLeader
                                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/20"
                                : "bg-sky-600 hover:bg-sky-700 text-white"
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                            {isNeedsLeader ? "Cho ý kiến chỉ đạo" : "Xem & Chỉ đạo"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CỬA SỐ CHI TIẾT SỰ VỤ & CHO Ý KIẾN CHỈ ĐẠO DÀNH CHO TỔ TRƯỞNG */}
        {selectedIncident && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setSelectedIncidentId(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Tiêu đề Modal */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-black text-xs">
                      {selectedIncident.teacher_id}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      Hồ Sơ Sự Vụ – {selectedIncident.teacher_name}
                    </h3>
                    {renderUrgencyBadge(selectedIncident.urgency_level)}
                    {renderStatusBadge(selectedIncident.status)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cơ sở: <strong>{selectedIncident.campus}</strong> • Thời gian xảy ra sự việc:{" "}
                    <strong>{selectedIncident.incident_date}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedIncidentId(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thông tin 10 mục báo cáo của Giáo viên */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">1. Giáo viên báo cáo (Mã NV):</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {selectedIncident.teacher_name} ({selectedIncident.teacher_id})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">2. Cơ sở:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {selectedIncident.campus}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold block">3. Phân loại sự vụ:</span>
                  <span className="font-extrabold text-sky-700 dark:text-sky-300">
                    {selectedIncident.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">5. Thời gian xảy ra sự việc:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {selectedIncident.incident_date}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">6. Phạm vi ảnh hưởng:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedIncident.impact_scopes.map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                  <span className="text-slate-400 font-bold block mb-1">
                    7. Mô tả chi tiết sự việc:
                  </span>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedIncident.description}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold block mb-1">
                    8. Đề xuất hướng xử lý từ giáo viên:
                  </span>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedIncident.proposed_solution || "Giáo viên chưa nhập đề xuất riêng."}
                  </div>
                </div>
                <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 font-bold mr-2">9. Minh chứng từ giáo viên:</span>
                    {selectedIncident.evidence_link ? (
                      <a
                        href={
                          selectedIncident.evidence_link.startsWith("http")
                            ? selectedIncident.evidence_link
                            : `https://${selectedIncident.evidence_link}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-extrabold text-sky-600 hover:text-sky-700 dark:text-sky-400 underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Mở xem tài liệu / hình ảnh minh chứng
                      </a>
                    ) : (
                      <span className="italic text-slate-400">Không đính kèm link</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">10. Tình trạng hiện tại:</span>
                    {renderStatusBadge(selectedIncident.status)}
                  </div>
                </div>
              </div>

              {/* LỊCH SỬ TRAO ĐỔI Ý KIẾN CHỈ ĐẠO & PHẢN HỒI 2 CHIỀU */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    Tiến Trình Ý Kiến Chỉ Đạo Của Tổ Trưởng & Phản Hồi Của Giáo Viên
                  </h4>
                  {renderDirectionStatusBadge(selectedIncident)}
                </div>

                {selectedIncident.discussion_logs.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-dashed border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                    Sự vụ này đang chờ Tổ trưởng cho ý kiến chỉ đạo đầu tiên.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {selectedIncident.discussion_logs.map((log) => {
                      const isLeaderMsg = log.role === "leader";
                      const isConfirmMsg = log.action_type === "teacher_confirm";
                      return (
                        <div
                          key={log.id}
                          className={`p-3.5 rounded-2xl border text-xs ${
                            isConfirmMsg
                              ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                              : isLeaderMsg
                              ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-slate-900 dark:text-slate-100"
                              : "bg-sky-50/90 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-extrabold flex items-center gap-1.5">
                              {isConfirmMsg ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : isLeaderMsg ? (
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <CornerDownRight className="w-3.5 h-3.5 text-sky-600" />
                              )}
                              {isLeaderMsg
                                ? `Chỉ đạo từ Tổ trưởng (${log.sender_name})`
                                : isConfirmMsg
                                ? `Xác nhận thực hiện (${log.sender_name})`
                                : `Phản hồi từ Giáo viên (${log.sender_name})`}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDateTimeVN(log.created_at)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">{log.content}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* KHUNG TỔ TRƯỞNG NHẬP Ý KIẾN CHỈ ĐẠO VÀ BẤM XÁC NHẬN */}
              {selectedIncident.direction_status !== "confirmed" ? (
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/80 space-y-3">
                  <label className="block text-xs font-extrabold text-amber-900 dark:text-amber-300">
                    Nhập Ý Kiến Chỉ Đạo Của Tổ Trưởng Dành Cho {selectedIncident.teacher_name}:
                  </label>
                  <textarea
                    rows={3}
                    value={leaderDirectionText}
                    onChange={(e) => setLeaderDirectionText(e.target.value)}
                    placeholder="Nhập phương án chỉ đạo, hướng dẫn xử lý sự vụ cho giáo viên..."
                    className="w-full rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIncidentId(null)}
                      className="rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Đóng
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSubmittingDirection}
                      onClick={() => handleLeaderConfirmDirection(selectedIncident)}
                      className="rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmittingDirection
                        ? "Đang xác nhận & gửi thông báo..."
                        : "Xác Nhận Ý Kiến Chỉ Đạo"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Giáo viên đã xác nhận thực hiện theo ý kiến chỉ đạo của Tổ trưởng. Chu trình chỉ đạo đã hoàn tất!
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIncidentId(null)}
                    className="rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Đóng
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // GIAO DIỆN 2: TÀI KHOẢN GIÁO VIÊN (FORM 10 MỤC BÁO CÁO & LUỒNG NHẬN CHỈ ĐẠO)
  // =========================================================================
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KHU VỰC A: BIỂU MẪU NHẬP THÔNG TIN XỬ LÝ SỰ VỤ (10 MỤC CHUẨN HÓA) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Phiếu Báo Cáo & Xử Lý Sự Vụ Chuyên Môn ICT
                </h2>
                <Badge variant="secondary" className="text-[11px] font-bold">
                  Mã nhân sự: {currentTeacherStaffCode}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Giáo viên điền đầy đủ thông tin sự vụ phát sinh và bấm <strong>Xác nhận</strong> để gửi báo cáo xin ý kiến chỉ đạo từ Tổ trưởng.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreateIncidentReport} className="space-y-4 text-xs">
          {/* MỤC 1 & MỤC 2: HỌ TÊN GIÁO VIÊN & CƠ SỞ (KHÓA ĐỒNG BỘ TỰ ĐỘNG) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Họ và tên giáo viên */}
            <div>
              <label className="font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  1. Họ và tên giáo viên:
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <Lock className="w-3 h-3" /> Đồng bộ tài khoản ({currentTeacherStaffCode})
                </span>
              </label>
              <Input
                value={`${currentTeacherObj?.name || currentUserProfile.name} (${currentTeacherStaffCode})`}
                readOnly
                disabled
                className="bg-slate-100 dark:bg-slate-800/90 font-extrabold text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>

            {/* 2. Cơ sở */}
            <div>
              <label className="font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  2. Cơ sở:
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <Lock className="w-3 h-3" /> Lấy từ Danh bạ Nhân sự ICT
                </span>
              </label>
              <Input
                value={currentTeacherCampus}
                readOnly
                disabled
                className="bg-slate-100 dark:bg-slate-800/90 font-extrabold text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>
          </div>

          {/* MỤC 3 & MỤC 5: PHÂN LOẠI SỰ VỤ (DROPDOWN) & THỜI GIAN XẢY RA SỰ VIỆC (NGÀY/THÁNG/NĂM) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 3. Phân loại sự vụ */}
            <div className="md:col-span-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
                3. Phân loại sự vụ: <span className="text-rose-500">*</span>
              </label>
              <select
                aria-label="Chọn phân loại sự vụ"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {INCIDENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Thời gian xảy ra sự việc (Chọn Ngày/Tháng/Năm dd/mm/yyyy) */}
            <div>
              <label className="font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
                5. Thời gian xảy ra sự việc (Ngày/Tháng/Năm): <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Input
                  type="text"
                  value={formIncidentDate}
                  onChange={(e) => setFormIncidentDate(e.target.value)}
                  placeholder="dd/mm/yyyy (VD: 30/10/2026)"
                  className="pr-10 font-extrabold text-slate-900 dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    if (datePickerInputRef.current) {
                      if (typeof datePickerInputRef.current.showPicker === "function") {
                        datePickerInputRef.current.showPicker();
                      } else {
                        datePickerInputRef.current.focus();
                      }
                    }
                  }}
                  className="absolute right-2.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 cursor-pointer"
                  title="Bấm để chọn Ngày/Tháng/Năm trên lịch"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <input
                  ref={datePickerInputRef}
                  type="date"
                  aria-label="Chọn ngày tháng năm"
                  value={ddMmYyyyToIso(formIncidentDate)}
                  onChange={(e) => {
                    if (e.target.value) {
                      setFormIncidentDate(isoToDdMmYyyy(e.target.value));
                    }
                  }}
                  className="sr-only"
                />
              </div>
            </div>
          </div>

          {/* MỤC 4: MỨC ĐỘ KHẨN CẤP (RADIO BUTTON 3 MỨC) */}
          <div>
            <label className="font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
              4. Mức độ khẩn cấp: <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {URGENCY_LEVELS.map((level) => {
                const isSelected = formUrgency === level.value;
                return (
                  <label
                    key={level.value}
                    onClick={() => setFormUrgency(level.value)}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? level.activeClass
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency_level"
                      value={level.value}
                      checked={isSelected}
                      onChange={() => setFormUrgency(level.value)}
                      className="mt-0.5 accent-sky-600"
                    />
                    <div>
                      <div className="font-extrabold text-xs">{level.label}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">{level.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* MỤC 6: PHẠM VI ẢNH HƯỞNG (CHECKBOX) */}
          <div>
            <label className="font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
              6. Phạm vi ảnh hưởng (Chọn 1 hoặc nhiều phạm vi): <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {IMPACT_SCOPE_OPTIONS.map((scope) => {
                const isChecked = formImpactScopes.includes(scope);
                return (
                  <label
                    key={scope}
                    onClick={() => handleToggleImpactScope(scope)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-bold cursor-pointer transition-all select-none ${
                      isChecked
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 shadow-2xs"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="accent-sky-600 w-3.5 h-3.5"
                    />
                    <span>{scope}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* MỤC 7 & MỤC 8: MÔ TẢ CHI TIẾT SỰ VIỆC & ĐỀ XUẤT HƯỚNG XỬ LÝ (LONG TEXT) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 7. Mô tả chi tiết sự việc */}
            <div>
              <label className="font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
                7. Mô tả chi tiết sự việc (Bắt buộc nêu rõ sự vụ, sự việc):{" "}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Nêu rõ thời gian, địa điểm, đối tượng liên quan và diễn biến chi tiết của sự vụ..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* 8. Đề xuất hướng xử lý từ giáo viên */}
            <div>
              <label className="font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
                8. Đề xuất hướng xử lý từ giáo viên (Khuyến khích chủ động đưa giải pháp):
              </label>
              <textarea
                rows={4}
                value={formProposedSolution}
                onChange={(e) => setFormProposedSolution(e.target.value)}
                placeholder="Đề xuất phương án xử lý tại chỗ hoặc hướng giải quyết tiếp theo của thầy/cô..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* MỤC 9 & MỤC 10: MINH CHỨNG ĐÍNH KÈM & TÌNH TRẠNG (DROPDOWN) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 9. Minh chứng từ giáo viên */}
            <div className="md:col-span-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1.5">
                <Link2 className="w-3.5 h-3.5 text-sky-600" />
                9. Minh chứng từ giáo viên (Upload link hình ảnh / biên bản / Google Drive / OneDrive):
              </label>
              <Input
                type="text"
                value={formEvidenceLink}
                onChange={(e) => setFormEvidenceLink(e.target.value)}
                placeholder="Dán đường dẫn (link) minh chứng hình ảnh, video hoặc biên bản sự việc..."
              />
            </div>

            {/* 10. Tình trạng */}
            <div>
              <label className="font-extrabold text-slate-700 dark:text-slate-200 block mb-1.5">
                10. Tình trạng: <span className="text-rose-500">*</span>
              </label>
              <select
                aria-label="Chọn tình trạng sự vụ"
                value={formStatus}
                onChange={(e) =>
                  setFormStatus(e.target.value as "Chưa xử lý" | "Đang xử lý" | "Hoàn thành")
                }
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-extrabold focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {INCIDENT_STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* NÚT XÁC NHẬN GỬI BÁO CÁO SỰ VỤ */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              🔔 Ngay sau khi bấm <strong>Xác nhận</strong>, hệ thống sẽ tự động gửi thông báo đến Tổ trưởng để xin ý kiến chỉ đạo.
            </p>
            <Button
              type="submit"
              disabled={isSubmittingNew}
              className="h-10 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-600/20 cursor-pointer flex items-center gap-2 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmittingNew
                  ? "Đang gửi báo cáo sự vụ..."
                  : "Xác Nhận Hoàn Thành & Gửi Báo Cáo Sự Vụ"}
              </span>
            </Button>
          </div>
        </form>
      </div>

      {/* KHU VỰC B: DANH SÁCH SỰ VỤ CỦA GIÁO VIÊN & TIẾP NHẬN Ý KIẾN CHỈ ĐẠO TỪ TỔ TRƯỞNG */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-sky-600" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Danh Sách Sự Vụ Đã Báo Cáo & Ý Kiến Chỉ Đạo Của Tổ Trưởng ({myIncidentsList.length})
            </h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadIncidents}
            className="h-8 text-xs font-bold rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>

        {myIncidentsList.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1.5">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Thầy/Cô chưa có báo cáo sự vụ nào trong năm học {selectedSchoolYear}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Khi phát sinh sự việc cần xử lý hoặc xin ý kiến chỉ đạo, thầy/cô hãy điền biểu mẫu phía trên và bấm Xác nhận.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myIncidentsList.map((incident, index) => {
              const isWaitingTeacherAction = incident.direction_status === "waiting_teacher";
              const isConfirmed = incident.direction_status === "confirmed";
              const isFeedbackOpen = Boolean(feedbackOpenMap[incident.id]);
              const isProcessingThis = isSubmittingTeacherActionId === incident.id;

              return (
                <div
                  key={incident.id}
                  className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all space-y-4 ${
                    isWaitingTeacherAction
                      ? "border-amber-400 dark:border-amber-600 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40"
                      : "border-slate-200/90 dark:border-slate-800 shadow-xs"
                  }`}
                >
                  {/* Dòng tiêu đề thẻ sự vụ */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs">
                          Sự vụ #{myIncidentsList.length - index}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 px-2.5 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800">
                          <Calendar className="w-3.5 h-3.5" />
                          Ngày xảy ra: {incident.incident_date}
                        </span>
                        {renderUrgencyBadge(incident.urgency_level)}
                        {renderDirectionStatusBadge(incident)}
                      </div>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white pt-0.5">
                        {incident.category}
                      </h4>
                    </div>

                    {/* Ô cập nhật Tình trạng (Hoàn thành / Đang xử lý / Chưa xử lý) sau khi giải quyết */}
                    <div className="flex items-center gap-2 shrink-0 bg-slate-50 dark:bg-slate-800/70 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                      <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 pl-1">
                        Tình trạng sự vụ:
                      </span>
                      <select
                        aria-label="Cập nhật tình trạng giải quyết sự vụ"
                        value={incident.status}
                        onChange={(e) =>
                          handleUpdateIncidentStatus(
                            incident,
                            e.target.value as "Chưa xử lý" | "Đang xử lý" | "Hoàn thành"
                          )
                        }
                        className={`h-8 px-2.5 rounded-xl text-xs font-extrabold border cursor-pointer focus:outline-none ${
                          incident.status === "Hoàn thành"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                            : incident.status === "Đang xử lý"
                            ? "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800"
                            : "bg-white text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {INCIDENT_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Nội dung tóm tắt sự việc & đề xuất */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-1">
                      <div className="font-extrabold text-slate-500 dark:text-slate-400">
                        Mô tả sự việc & Phạm vi ({incident.impact_scopes.join(", ")}):
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {incident.description}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-1">
                      <div className="font-extrabold text-slate-500 dark:text-slate-400">
                        Đề xuất hướng xử lý của Giáo viên:
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {incident.proposed_solution || "Chưa ghi đề xuất riêng."}
                      </p>
                      {incident.evidence_link && (
                        <div className="pt-1">
                          <a
                            href={
                              incident.evidence_link.startsWith("http")
                                ? incident.evidence_link
                                : `https://${incident.evidence_link}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Xem link minh chứng đã đính kèm
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KHU VỰC HIỂN THỊ Ý KIẾN CHỈ ĐẠO CỦA TỔ TRƯỞNG & 2 LUỒNG TƯƠNG TÁC CỦA GIÁO VIÊN */}
                  <div className="space-y-3 pt-1">
                    {incident.discussion_logs.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Lịch sử Ý kiến chỉ đạo & Phản hồi:
                        </div>
                        {incident.discussion_logs.map((log) => {
                          const isLeaderMsg = log.role === "leader";
                          const isConfirmMsg = log.action_type === "teacher_confirm";
                          return (
                            <div
                              key={log.id}
                              className={`p-3.5 rounded-2xl border text-xs ${
                                isConfirmMsg
                                  ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                                  : isLeaderMsg
                                  ? "bg-amber-50/95 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-slate-900 dark:text-slate-100"
                                  : "bg-sky-50/90 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-slate-900 dark:text-slate-100"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-extrabold flex items-center gap-1.5">
                                  {isConfirmMsg ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  ) : isLeaderMsg ? (
                                    <Sparkles className="w-4 h-4 text-amber-600" />
                                  ) : (
                                    <CornerDownRight className="w-4 h-4 text-sky-600" />
                                  )}
                                  {isLeaderMsg
                                    ? `Ý kiến chỉ đạo từ Tổ trưởng (${log.sender_name})`
                                    : isConfirmMsg
                                    ? `Xác nhận thực hiện (${log.sender_name})`
                                    : `Phản hồi của Giáo viên (${log.sender_name})`}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {formatDateTimeVN(log.created_at)}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed font-medium">
                                {log.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* KHI CÓ Ý KIẾN CHỈ ĐẠO MỚI TỪ TỔ TRƯỞNG -> HIỂN THỊ 2 LUỒNG CHO GIÁO VIÊN */}
                    {isWaitingTeacherAction && (
                      <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-700 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="text-xs font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                              Tổ trưởng đã cho ý kiến chỉ đạo! Thầy/Cô vui lòng chọn 1 trong 2 hướng xử lý:
                            </div>
                            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                              • Luồng 1: Xác nhận và thực hiện theo chỉ đạo của Tổ trưởng (Kết thúc trao đổi).{" "}
                              <br className="hidden sm:inline" />• Luồng 2: Tiếp tục phản hồi lại ý kiến chỉ đạo của Tổ trưởng nếu cần trao đổi thêm.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* LUỒNG 1: XÁC NHẬN & THỰC HIỆN THEO Ý KIẾN CHỈ ĐẠO */}
                            <Button
                              type="button"
                              size="sm"
                              disabled={isProcessingThis}
                              onClick={() => handleTeacherConfirmExecution(incident)}
                              className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Xác nhận & Thực hiện chỉ đạo</span>
                            </Button>

                            {/* LUỒNG 2: TIẾP TỤC PHẢN HỒI Ý KIẾN CHỈ ĐẠO */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isProcessingThis}
                              onClick={() =>
                                setFeedbackOpenMap((prev) => ({
                                  ...prev,
                                  [incident.id]: !prev[incident.id],
                                }))
                              }
                              className="h-9 px-3.5 rounded-xl border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-extrabold text-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>Tiếp tục phản hồi chỉ đạo</span>
                            </Button>
                          </div>
                        </div>

                        {/* Ô nhập nội dung phản hồi khi Giáo viên chọn Luồng 2 */}
                        {isFeedbackOpen && (
                          <div className="pt-2 border-t border-amber-200 dark:border-amber-800/80 space-y-2.5 animate-in fade-in duration-150">
                            <label className="block text-xs font-extrabold text-amber-900 dark:text-amber-200">
                              Nhập ý kiến phản hồi / vướng mắc thực tế gửi lại Tổ trưởng:
                            </label>
                            <textarea
                              rows={3}
                              value={feedbackTextMap[incident.id] || ""}
                              onChange={(e) =>
                                setFeedbackTextMap((prev) => ({
                                  ...prev,
                                  [incident.id]: e.target.value,
                                }))
                              }
                              placeholder="Trình bày thêm tình hình thực tế hoặc đề xuất điều chỉnh để Tổ trưởng xem xét chỉ đạo tiếp..."
                              className="w-full rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setFeedbackOpenMap((prev) => ({ ...prev, [incident.id]: false }))
                                }
                                className="rounded-xl text-xs font-bold cursor-pointer"
                              >
                                Hủy
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                disabled={isProcessingThis}
                                onClick={() => handleTeacherSubmitFeedback(incident)}
                                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Gửi phản hồi cho Tổ trưởng</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Khi đã xác nhận thực hiện chỉ đạo */}
                    {isConfirmed && (
                      <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          Thầy/Cô đã xác nhận thực hiện theo chỉ đạo của Tổ trưởng. Sau khi giải quyết xong sự vụ, thầy/cô nhớ chọn Tình trạng là “Hoàn thành” ở góc phải trên nhé!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
