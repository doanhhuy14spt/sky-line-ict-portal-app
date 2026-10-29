"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  ClipboardList,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  X,
  Check,
  Edit3,
  CalendarDays,
  UserCheck,
  Link2,
  ExternalLink,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface DepartmentTaskItem {
  id: string;
  task_content: string;
  assignee_id: string | null;
  assignee_ids?: string[] | null;
  assignee_name: string;
  assignee_email?: string | null;
  deadline: string; // Định dạng YYYY-MM-DD
  status: "Đang thực hiện" | "Hoàn thành" | "Trễ tiến độ";
  evidence?: string | null; // Cột Minh chứng (chèn link / văn bản)
  notes: string;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AssignedTasksSectionProps {
  supabase: SupabaseClient;
  showToast: (message: string, type: "success" | "warning" | "info") => void;
  currentUserProfile: any;
  teachersList: any[];
  selectedSchoolYear?: string;
}

export const TASK_STATUSES: Array<"Đang thực hiện" | "Hoàn thành" | "Trễ tiến độ"> = [
  "Đang thực hiện",
  "Hoàn thành",
  "Trễ tiến độ",
];

export function AssignedTasksSection({
  supabase,
  showToast,
  currentUserProfile,
  teachersList,
  selectedSchoolYear = "2026-2027",
}: AssignedTasksSectionProps) {
  const [tasksList, setTasksList] = useState<DepartmentTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [onlyMyTasks, setOnlyMyTasks] = useState<boolean>(false);

  const currentMonthNumber = new Date().getMonth() + 1;
  const currentYearNumber = new Date().getFullYear();

  // Hàm bóc tách tháng & năm từ chuỗi deadline (YYYY-MM-DD hoặc DD/MM/YYYY)
  const parseDeadlineMonthYear = useCallback(
    (deadlineStr: string): { month: number; year: number } | null => {
      if (!deadlineStr) return null;
      const trimmed = deadlineStr.trim();
      if (trimmed.includes("-")) {
        const parts = trimmed.split("-");
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) };
          }
          return { year: parseInt(parts[2], 10), month: parseInt(parts[1], 10) };
        }
      }
      if (trimmed.includes("/")) {
        const parts = trimmed.split("/");
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            return { year: parseInt(parts[2], 10), month: parseInt(parts[1], 10) };
          }
          return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) };
        }
      }
      return null;
    },
    []
  );

  // Kiểm tra công việc có deadline thuộc tháng hiện tại hay không
  const isDeadlineInCurrentMonth = useCallback(
    (deadlineStr: string): boolean => {
      const parsed = parseDeadlineMonthYear(deadlineStr);
      if (!parsed) return false;
      return parsed.month === currentMonthNumber && parsed.year === currentYearNumber;
    },
    [parseDeadlineMonthYear, currentMonthNumber, currentYearNumber]
  );

  // Phân quyền
  const isLeader = currentUserProfile?.role === "leader";
  const isGuest = currentUserProfile?.role === "guest";

  // Modal Thêm công việc mới (Chỉ dành riêng cho Tổ trưởng)
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState<boolean>(false);
  const [addFormData, setAddFormData] = useState({
    task_content: "",
    selectedTeacherIds: [] as string[],
    deadline: "",
    status: "Đang thực hiện" as "Đang thực hiện" | "Hoàn thành" | "Trễ tiến độ",
    evidence: "",
    notes: "",
  });

  // Modal Sửa công việc (Chỉ dành riêng cho Tổ trưởng)
  const [editingTask, setEditingTask] = useState<DepartmentTaskItem | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    task_content: "",
    selectedTeacherIds: [] as string[],
    deadline: "",
    status: "Đang thực hiện" as "Đang thực hiện" | "Hoàn thành" | "Trễ tiến độ",
    evidence: "",
    notes: "",
  });

  // Modal Xác nhận Xóa công việc (Chỉ dành riêng cho Tổ trưởng)
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<DepartmentTaskItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Modal Cập nhật Minh chứng (Dành cho Giáo viên được phân công & Tổ trưởng)
  const [evidenceModalTask, setEvidenceModalTask] = useState<DepartmentTaskItem | null>(null);
  const [evidenceText, setEvidenceText] = useState<string>("");
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState<boolean>(false);

  // Modal Cập nhật Ghi chú (Dành cho Giáo viên được phân công & Tổ trưởng)
  const [noteModalTask, setNoteModalTask] = useState<DepartmentTaskItem | null>(null);
  const [noteText, setNoteText] = useState<string>("");
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

  // =========================================================================
  // KIỂM TRA MỘT CÔNG VIỆC CÓ ĐƯỢC PHÂN CÔNG CHO GIÁO VIÊN ĐANG ĐĂNG NHẬP
  // =========================================================================
  const isMyAssignedTask = useCallback(
    (task: DepartmentTaskItem): boolean => {
      if (!currentUserProfile || isGuest) return false;
      if (isLeader) return true; // Tổ trưởng có toàn quyền kiểm soát

      if (task.assignee_id && task.assignee_id === currentUserProfile.id) return true;
      if (
        Array.isArray(task.assignee_ids) &&
        task.assignee_ids.includes(currentUserProfile.id)
      )
        return true;

      if (task.assignee_email && currentUserProfile.email) {
        const emails = task.assignee_email
          .split(",")
          .map((e) => e.trim().toLowerCase());
        if (emails.includes(currentUserProfile.email.toLowerCase())) return true;
      }

      if (task.assignee_name && currentUserProfile.name) {
        const currentName = currentUserProfile.name.trim().toLowerCase();
        const names = task.assignee_name
          .split(",")
          .map((n) => n.trim().toLowerCase());
        if (
          names.some(
            (n) => n === currentName || n.includes(currentName) || currentName.includes(n)
          )
        )
          return true;
      }
      return false;
    },
    [currentUserProfile, isLeader, isGuest]
  );

  // =========================================================================
  // TẢI DỮ LIỆU TỪ SUPABASE (ĐỒNG BỘ THEO NĂM HỌC ĐANG CHỌN)
  // =========================================================================
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("department_tasks")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasksList(data || []);
    } catch (err: any) {
      console.error("Lỗi tải danh sách công việc:", err);
      showToast(err.message || "Không thể tải danh sách công việc!", "warning");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, showToast, selectedSchoolYear]);

  useEffect(() => {
    loadTasks();

    // Lắng nghe Realtime trên bảng department_tasks
    const taskChannel = supabase
      .channel("realtime_department_tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "department_tasks" },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
    };
  }, [loadTasks, supabase]);

  // =========================================================================
  // LỌC CÔNG VIỆC THEO TỪ KHÓA, TÌNH TRẠNG, GIÁO VIÊN & "CỦA TÔI"
  // =========================================================================
  const filteredTasks = useMemo(() => {
    return tasksList.filter((task) => {
      // 1. Lọc theo từ khóa tìm kiếm
      const matchSearch =
        task.task_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.evidence && task.evidence.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.notes && task.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Lọc theo tình trạng
      const matchStatus = statusFilter === "all" || task.status === statusFilter;

      // 2.5. Lọc theo tháng deadline
      const matchMonth = (() => {
        if (monthFilter === "all") return true;
        const parsed = parseDeadlineMonthYear(task.deadline);
        if (!parsed) return false;
        if (monthFilter === "current") {
          return parsed.month === currentMonthNumber && parsed.year === currentYearNumber;
        }
        return parsed.month === parseInt(monthFilter, 10);
      })();

      // 3. Lọc theo giáo viên
      const matchTeacher =
        teacherFilter === "all" ||
        task.assignee_id === teacherFilter ||
        (Array.isArray(task.assignee_ids) && task.assignee_ids.includes(teacherFilter)) ||
        task.assignee_name.toLowerCase().includes(teacherFilter.toLowerCase());

      // 4. Lọc "Chỉ xem việc của tôi"
      const matchMyTask = !onlyMyTasks || isMyAssignedTask(task);

      return matchSearch && matchStatus && matchMonth && matchTeacher && matchMyTask;
    });
  }, [
    tasksList,
    searchTerm,
    statusFilter,
    monthFilter,
    teacherFilter,
    onlyMyTasks,
    isMyAssignedTask,
    parseDeadlineMonthYear,
    currentMonthNumber,
    currentYearNumber,
  ]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = tasksList.length;
    const inProgress = tasksList.filter((t) => t.status === "Đang thực hiện").length;
    const completed = tasksList.filter((t) => t.status === "Hoàn thành").length;
    const overdue = tasksList.filter((t) => t.status === "Trễ tiến độ").length;
    return { total, inProgress, completed, overdue };
  }, [tasksList]);

  // =========================================================================
  // 1. TỔ TRƯỞNG GIAO VIỆC MỚI (CHỌN NHIỀU GIÁO VIÊN)
  // =========================================================================
  const handleOpenAddModal = () => {
    if (!isLeader) {
      showToast("Chức năng chỉ dành cho Tổ trưởng chuyên môn!", "warning");
      return;
    }
    setAddFormData({
      task_content: "",
      selectedTeacherIds: [],
      deadline: "",
      status: "Đang thực hiện",
      evidence: "",
      notes: "",
    });
    setIsAddModalOpen(true);
  };

  const toggleAddTeacherSelection = (teacherId: string) => {
    setAddFormData((prev) => {
      const exists = prev.selectedTeacherIds.includes(teacherId);
      const nextIds = exists
        ? prev.selectedTeacherIds.filter((id) => id !== teacherId)
        : [...prev.selectedTeacherIds, teacherId];
      return { ...prev, selectedTeacherIds: nextIds };
    });
  };

  const handleSelectAllAddTeachers = () => {
    setAddFormData((prev) => {
      const allIds = teachersList.map((t) => t.id);
      const isAllSelected = prev.selectedTeacherIds.length === allIds.length;
      return {
        ...prev,
        selectedTeacherIds: isAllSelected ? [] : allIds,
      };
    });
  };

  const handleSubmitAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader) {
      showToast("Chỉ Tổ trưởng mới có quyền giao công việc mới!", "warning");
      return;
    }

    if (!addFormData.task_content.trim()) {
      showToast("Vui lòng nhập nội dung công việc!", "warning");
      return;
    }

    if (addFormData.selectedTeacherIds.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 giáo viên phụ trách!", "warning");
      return;
    }

    if (!addFormData.deadline) {
      showToast("Vui lòng chọn hạn chót (Deadline) hoàn thành!", "warning");
      return;
    }

    const selectedTeachers = teachersList.filter((t) =>
      addFormData.selectedTeacherIds.includes(t.id)
    );
    const combinedNames = selectedTeachers.map((t) => t.name).join(", ");
    const combinedEmails = selectedTeachers
      .map((t) => t.email)
      .filter(Boolean)
      .join(", ");

    setIsSubmittingAdd(true);
    try {
      const newRecord = {
        task_content: addFormData.task_content.trim(),
        assignee_id: selectedTeachers[0]?.id || null,
        assignee_ids: addFormData.selectedTeacherIds,
        assignee_name: combinedNames,
        assignee_email: combinedEmails || null,
        deadline: addFormData.deadline,
        status: addFormData.status,
        evidence: addFormData.evidence.trim(),
        notes: addFormData.notes.trim(),
        created_by: currentUserProfile?.id || null,
        created_by_name: currentUserProfile?.name || "Tổ Trưởng Chuyên Môn",
        school_year: selectedSchoolYear,
      };

      const { error } = await supabase.from("department_tasks").insert(newRecord);
      if (error) throw error;

      showToast(
        `Đã giao nhiệm vụ mới thành công cho ${selectedTeachers.length} giáo viên (${combinedNames})!`,
        "success"
      );
      setIsAddModalOpen(false);
      await loadTasks();
    } catch (err: any) {
      console.error("Lỗi giao việc:", err);
      showToast(err.message || "Lỗi khi giao nhiệm vụ mới!", "warning");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // =========================================================================
  // 2. TỔ TRƯỞNG CHỈNH SỬA CÔNG VIỆC (CHỌN NHIỀU GIÁO VIÊN)
  // =========================================================================
  const handleOpenEditModal = (task: DepartmentTaskItem) => {
    if (!isLeader) {
      showToast("Chỉ Tổ trưởng mới có quyền chỉnh sửa công việc!", "warning");
      return;
    }

    // Khôi phục danh sách ID giáo viên đã được phân công
    let initialSelectedIds: string[] = [];
    if (Array.isArray(task.assignee_ids) && task.assignee_ids.length > 0) {
      initialSelectedIds = task.assignee_ids;
    } else {
      const names = (task.assignee_name || "")
        .split(",")
        .map((n) => n.trim().toLowerCase())
        .filter(Boolean);
      initialSelectedIds = teachersList
        .filter(
          (t) =>
            t.id === task.assignee_id ||
            names.includes(t.name.trim().toLowerCase())
        )
        .map((t) => t.id);
    }

    setEditingTask(task);
    setEditFormData({
      task_content: task.task_content,
      selectedTeacherIds: initialSelectedIds,
      deadline: task.deadline,
      status: task.status,
      evidence: task.evidence || "",
      notes: task.notes || "",
    });
  };

  const toggleEditTeacherSelection = (teacherId: string) => {
    setEditFormData((prev) => {
      const exists = prev.selectedTeacherIds.includes(teacherId);
      const nextIds = exists
        ? prev.selectedTeacherIds.filter((id) => id !== teacherId)
        : [...prev.selectedTeacherIds, teacherId];
      return { ...prev, selectedTeacherIds: nextIds };
    });
  };

  const handleSelectAllEditTeachers = () => {
    setEditFormData((prev) => {
      const allIds = teachersList.map((t) => t.id);
      const isAllSelected = prev.selectedTeacherIds.length === allIds.length;
      return {
        ...prev,
        selectedTeacherIds: isAllSelected ? [] : allIds,
      };
    });
  };

  const handleSubmitEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader || !editingTask) return;

    if (!editFormData.task_content.trim()) {
      showToast("Vui lòng nhập nội dung công việc!", "warning");
      return;
    }

    if (editFormData.selectedTeacherIds.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 giáo viên phụ trách!", "warning");
      return;
    }

    if (!editFormData.deadline) {
      showToast("Vui lòng chọn hạn chót (Deadline)!", "warning");
      return;
    }

    const selectedTeachers = teachersList.filter((t) =>
      editFormData.selectedTeacherIds.includes(t.id)
    );
    const combinedNames = selectedTeachers.map((t) => t.name).join(", ");
    const combinedEmails = selectedTeachers
      .map((t) => t.email)
      .filter(Boolean)
      .join(", ");

    setIsSubmittingEdit(true);
    try {
      const updateData = {
        task_content: editFormData.task_content.trim(),
        assignee_id: selectedTeachers[0]?.id || null,
        assignee_ids: editFormData.selectedTeacherIds,
        assignee_name: combinedNames,
        assignee_email: combinedEmails || null,
        deadline: editFormData.deadline,
        status: editFormData.status,
        evidence: editFormData.evidence.trim(),
        notes: editFormData.notes.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("department_tasks")
        .update(updateData)
        .eq("id", editingTask.id);

      if (error) throw error;

      showToast("Đã cập nhật công việc thành công!", "success");
      setEditingTask(null);
      await loadTasks();
    } catch (err: any) {
      console.error("Lỗi cập nhật công việc:", err);
      showToast(err.message || "Lỗi cập nhật công việc!", "warning");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // =========================================================================
  // 3. TỔ TRƯỞNG XÓA CÔNG VIỆC (DELETE)
  // =========================================================================
  const handleDeleteTask = async () => {
    if (!isLeader || !deleteConfirmTask) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("department_tasks")
        .delete()
        .eq("id", deleteConfirmTask.id);

      if (error) throw error;

      showToast("Đã xóa công việc khỏi danh sách!", "success");
      setDeleteConfirmTask(null);
      await loadTasks();
    } catch (err: any) {
      console.error("Lỗi xóa công việc:", err);
      showToast(err.message || "Lỗi khi xóa công việc!", "warning");
    } finally {
      setIsDeleting(false);
    }
  };

  // =========================================================================
  // 4. GIÁO VIÊN CẬP NHẬT TIẾN ĐỘ Ở CỘT TÌNH TRẠNG (CHỈ ÁP DỤNG VIỆC ĐƯỢC PHÂN CÔNG)
  // =========================================================================
  const handleUpdateStatus = async (
    task: DepartmentTaskItem,
    newStatus: "Đang thực hiện" | "Hoàn thành" | "Trễ tiến độ"
  ) => {
    if (!isMyAssignedTask(task)) {
      showToast("Thầy/Cô không được phân công công việc này nên không thể cập nhật tiến độ!", "warning");
      return;
    }

    try {
      setTasksList((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );

      const { error } = await supabase
        .from("department_tasks")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;

      showToast(`Đã cập nhật tiến độ sang "${newStatus}"!`, "success");
    } catch (err: any) {
      console.error("Lỗi cập nhật tình trạng:", err);
      showToast(err.message || "Lỗi khi cập nhật tình trạng công việc!", "warning");
      await loadTasks();
    }
  };

  // =========================================================================
  // 5. CẬP NHẬT MINH CHỨNG (LINK / VĂN BẢN) Ở CỘT MINH CHỨNG
  // =========================================================================
  const handleOpenEvidenceModal = (task: DepartmentTaskItem) => {
    if (!isMyAssignedTask(task)) {
      showToast("Thầy/Cô không được phân công công việc này nên không thể cập nhật minh chứng!", "warning");
      return;
    }
    setEvidenceModalTask(task);
    setEvidenceText(task.evidence || "");
  };

  const handleSaveEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceModalTask) return;
    if (!isMyAssignedTask(evidenceModalTask)) {
      showToast("Thao tác bị từ chối: Thầy/Cô không được phân công công việc này!", "warning");
      return;
    }

    setIsSubmittingEvidence(true);
    try {
      const trimmedEvidence = evidenceText.trim();
      const { error } = await supabase
        .from("department_tasks")
        .update({
          evidence: trimmedEvidence,
          updated_at: new Date().toISOString(),
        })
        .eq("id", evidenceModalTask.id);

      if (error) throw error;

      setTasksList((prev) =>
        prev.map((t) =>
          t.id === evidenceModalTask.id ? { ...t, evidence: trimmedEvidence } : t
        )
      );

      showToast("Đã lưu minh chứng công việc thành công!", "success");
      setEvidenceModalTask(null);
    } catch (err: any) {
      console.error("Lỗi lưu minh chứng:", err);
      showToast(err.message || "Lỗi khi lưu minh chứng!", "warning");
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  // =========================================================================
  // 6. GIÁO VIÊN ĐIỀN/SỬA GHI CHÚ TIẾN ĐỘ (CHỈ ÁP DỤNG VIỆC ĐƯỢC PHÂN CÔNG)
  // =========================================================================
  const handleOpenNoteModal = (task: DepartmentTaskItem) => {
    if (!isMyAssignedTask(task)) {
      showToast("Thầy/Cô không được phân công công việc này nên không thể sửa ghi chú!", "warning");
      return;
    }
    setNoteModalTask(task);
    setNoteText(task.notes || "");
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteModalTask) return;
    if (!isMyAssignedTask(noteModalTask)) {
      showToast("Thao tác bị từ chối: Thầy/Cô không được phân công công việc này!", "warning");
      return;
    }

    setIsSubmittingNote(true);
    try {
      const trimmedNote = noteText.trim();
      const { error } = await supabase
        .from("department_tasks")
        .update({
          notes: trimmedNote,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteModalTask.id);

      if (error) throw error;

      setTasksList((prev) =>
        prev.map((t) => (t.id === noteModalTask.id ? { ...t, notes: trimmedNote } : t))
      );

      showToast("Đã lưu ghi chú tiến độ thành công!", "success");
      setNoteModalTask(null);
    } catch (err: any) {
      console.error("Lỗi lưu ghi chú:", err);
      showToast(err.message || "Lỗi khi lưu ghi chú!", "warning");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Hàm định dạng ngày hiển thị dd/mm/yyyy
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Chưa đặt";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Hàm kiểm tra và chuẩn hóa đường link minh chứng
  const extractUrl = (text: string): string | null => {
    if (!text) return null;
    const trimmed = text.trim();
    const urlMatch = trimmed.match(/(https?:\/\/[^\s]+|www\.[^\s]+|drive\.google\.com[^\s]+|docs\.google\.com[^\s]+)/i);
    if (urlMatch) {
      const rawUrl = urlMatch[0];
      return rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KHUNG TIÊU ĐỀ & THANH ĐIỀU HƯỚNG TỔNG QUAN */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <ClipboardList className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  Phân Công Công Việc & Nhiệm Vụ Chuyên Môn
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-bold ${
                      isLeader
                        ? "border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60"
                        : isGuest
                        ? "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
                        : "border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60"
                    }`}
                  >
                    {isLeader
                      ? "Tổ Trưởng (Toàn Quyền)"
                      : isGuest
                      ? "Khách (Chế Độ Chỉ Xem)"
                      : "Giáo Viên (Cập Nhật Việc Được Giao)"}
                  </Badge>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tổ trưởng phân công cho một hoặc nhiều giáo viên; Giáo viên cập nhật tình trạng, chèn link minh chứng và ghi chú.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* NÚT THÊM CÔNG VIỆC (CHỈ HIỂN THỊ VỚI TỔ TRƯỞNG) */}
            {isLeader && (
              <Button
                size="sm"
                onClick={handleOpenAddModal}
                className="font-bold text-xs h-9 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md shadow-sky-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Giao Việc Mới</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={loadTasks}
              disabled={isLoading}
              className="font-bold text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
              title="Làm mới danh sách công việc"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
          </div>
        </div>

        {/* THẺ THỐNG KÊ NHANH 4 CHỈ SỐ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tổng Công Việc</div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total}</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300">Đang Thực Hiện</div>
              <div className="text-xl font-black text-sky-800 dark:text-sky-200 mt-0.5">{stats.inProgress}</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Hoàn Thành</div>
              <div className="text-xl font-black text-emerald-800 dark:text-emerald-200 mt-0.5">{stats.completed}</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Trễ Tiến Độ</div>
              <div className="text-xl font-black text-rose-800 dark:text-rose-200 mt-0.5">{stats.overdue}</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* BỘ LỌC VÀ THANH TÌM KIẾM CÔNG VIỆC */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nội dung công việc, giáo viên, minh chứng, ghi chú..."
              className="pl-9 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Lọc theo Tình trạng */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 hidden md:inline">Tình trạng:</span>
              <select
                aria-label="Lọc theo tình trạng công việc"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả tình trạng</option>
                <option value="Đang thực hiện">Đang thực hiện</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Trễ tiến độ">Trễ tiến độ</option>
              </select>
            </div>

            {/* Lọc theo Deadline (Theo tháng) */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 hidden md:inline">Deadline:</span>
              <select
                aria-label="Lọc theo tháng deadline"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className={`h-9 px-3 rounded-xl border text-xs font-semibold focus:outline-none cursor-pointer transition-colors ${
                  monthFilter !== "all"
                    ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                }`}
              >
                <option value="all">Tất cả các tháng</option>
                <option value="current">⭐ Tháng hiện tại (Tháng {currentMonthNumber})</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={String(m)}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo Giáo viên */}
            <select
              aria-label="Lọc theo giáo viên phụ trách"
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer max-w-[170px]"
            >
              <option value="all">Tất cả giáo viên</option>
              {teachersList.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Nút lọc nhanh: Việc của tôi (Ẩn với Khách) */}
            {!isGuest && (
              <Button
                size="sm"
                variant={onlyMyTasks ? "default" : "outline"}
                onClick={() => setOnlyMyTasks(!onlyMyTasks)}
                className={`font-bold text-xs h-9 rounded-xl cursor-pointer ${
                  onlyMyTasks
                    ? "bg-sky-600 text-white"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                Việc của tôi
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH CÔNG VIỆC CHUYÊN MÔN (RỘNG 100%, KHÔNG CÓ THANH CUỘN NGANG) */}
      <div className="w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <table className="w-full table-fixed text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-2 text-center w-[4%]">STT</th>
              <th className="py-3.5 px-3 w-[22%]">Nội Dung Công Việc</th>
              <th className="py-3.5 px-3 w-[18%]">Giáo Viên Phụ Trách</th>
              <th className="py-3.5 px-2 w-[11%] text-center">Deadline</th>
              <th className="py-3.5 px-2 w-[13%] text-center">Tình Trạng</th>
              <th className="py-3.5 px-3 w-[14%]">Minh Chứng</th>
              <th className={`py-3.5 px-3 ${isLeader ? "w-[11%]" : "w-[18%]"}`}>Ghi Chú</th>
              {isLeader && <th className="py-3.5 px-2 text-center w-[7%]">Thao Tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-3 text-center">
                    <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-1/2" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  </td>
                  <td className="p-3 text-center">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 mx-auto" />
                  </td>
                  <td className="p-3 text-center">
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-24 mx-auto" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  </td>
                  {isLeader && (
                    <td className="p-3 text-center">
                      <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-xl w-12 mx-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => {
                const isAssignedToCurrent = isMyAssignedTask(task);
                const isCurrentMonthDeadline = isDeadlineInCurrentMonth(task.deadline);
                const teacherNamesList = (task.assignee_name || "")
                  .split(",")
                  .map((n) => n.trim())
                  .filter(Boolean);
                const evidenceLink = extractUrl(task.evidence || "");

                return (
                  <tr
                    key={task.id}
                    className={`transition-colors ${
                      isCurrentMonthDeadline
                        ? "bg-amber-100/90 hover:bg-amber-200/80 dark:bg-amber-900/35 dark:hover:bg-amber-900/50"
                        : isAssignedToCurrent && !isLeader
                        ? "bg-sky-50/30 dark:bg-sky-950/20 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                        : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* 1. STT */}
                    <td className="py-3.5 px-2 text-center font-bold text-slate-500 dark:text-slate-400 text-xs">
                      {index + 1}
                    </td>

                    {/* 2. NỘI DUNG CÔNG VIỆC */}
                    <td className="py-3.5 px-3 break-words">
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug">
                        {task.task_content}
                      </div>
                      {task.created_by_name && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Giao bởi: <span className="font-semibold text-slate-600 dark:text-slate-300">{task.created_by_name}</span>
                        </div>
                      )}
                    </td>

                    {/* 3. GIÁO VIÊN PHỤ TRÁCH (HIỂN THỊ 1 HOẶC NHIỀU GIÁO VIÊN) */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {teacherNamesList.map((tName, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 shadow-2xs max-w-full"
                          >
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-sky-500 to-sky-700 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                              {tName.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-tight break-words">
                              {tName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* 4. DEADLINE */}
                    <td className="py-3.5 px-2 text-center">
                      <div
                        className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-xl font-bold text-[11px] whitespace-nowrap ${
                          isCurrentMonthDeadline
                            ? "bg-amber-200/90 dark:bg-amber-800/70 text-amber-950 dark:text-amber-100 border border-amber-400/70 dark:border-amber-700"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                        title={
                          isCurrentMonthDeadline
                            ? `Deadline thuộc tháng hiện tại (Tháng ${currentMonthNumber})`
                            : undefined
                        }
                      >
                        <CalendarDays
                          className={`w-3 h-3 shrink-0 ${
                            isCurrentMonthDeadline
                              ? "text-amber-700 dark:text-amber-300"
                              : "text-slate-400"
                          }`}
                        />
                        <span>{formatDisplayDate(task.deadline)}</span>
                      </div>
                    </td>

                    {/* 5. TÌNH TRẠNG (HOÀN THÀNH, ĐANG THỰC HIỆN, TRỄ TIẾN ĐỘ) */}
                    <td className="py-3.5 px-2 text-center">
                      {isAssignedToCurrent ? (
                        <div className="inline-block relative max-w-full">
                          <select
                            aria-label="Cập nhật tình trạng công việc"
                            value={task.status}
                            onChange={(e) =>
                              handleUpdateStatus(
                                task,
                                e.target.value as "Đang thực hiện" | "Hoàn thành" | "Trễ tiến độ"
                              )
                            }
                            className={`h-7 px-2 pr-5 rounded-full text-[11px] font-black border transition-all cursor-pointer focus:outline-none appearance-none max-w-full truncate ${
                              task.status === "Hoàn thành"
                                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                                : task.status === "Trễ tiến độ"
                                ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 shadow-2xs"
                                : "bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 shadow-2xs"
                            }`}
                            title="Bấm để cập nhật tiến độ công việc"
                          >
                            <option value="Đang thực hiện">⏳ Đang thực hiện</option>
                            <option value="Hoàn thành">✅ Hoàn thành</option>
                            <option value="Trễ tiến độ">⚠️ Trễ tiến độ</option>
                          </select>
                          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">
                            ▼
                          </span>
                        </div>
                      ) : (
                        <Badge
                          variant={
                            task.status === "Hoàn thành"
                              ? "emerald"
                              : task.status === "Trễ tiến độ"
                              ? "destructive"
                              : "default"
                          }
                          className="font-bold text-[11px] px-2 py-0.5 whitespace-nowrap"
                        >
                          {task.status === "Hoàn thành" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {task.status === "Đang thực hiện" && <Clock className="w-3 h-3 mr-1" />}
                          {task.status === "Trễ tiến độ" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {task.status}
                        </Badge>
                      )}
                    </td>

                    {/* 6. MINH CHỨNG (PHÍA SAU TÌNH TRẠNG, PHÍA TRƯỚC GHI CHÚ) */}
                    <td className="py-3.5 px-3 overflow-hidden">
                      <div className="flex items-center justify-between gap-1 group min-w-0">
                        <div className="flex-1 min-w-0 text-xs leading-relaxed">
                          {task.evidence ? (
                            evidenceLink ? (
                              <a
                                href={evidenceLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold hover:underline bg-sky-50 dark:bg-sky-950/50 px-2 py-1 rounded-xl border border-sky-200/70 dark:border-sky-800/70 max-w-full overflow-hidden"
                                title={task.evidence}
                              >
                                <Link2 className="w-3 h-3 shrink-0" />
                                <span className="truncate">{task.evidence}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-75" />
                              </a>
                            ) : (
                              <span className="text-slate-700 dark:text-slate-200 font-medium break-words">
                                {task.evidence}
                              </span>
                            )
                          ) : isAssignedToCurrent ? (
                            <button
                              onClick={() => handleOpenEvidenceModal(task)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 bg-sky-50/70 dark:bg-sky-950/30 hover:bg-sky-100/70 px-2 py-1 rounded-xl border border-dashed border-sky-300 dark:border-sky-800 transition-all cursor-pointer max-w-full"
                            >
                              <Link2 className="w-3 h-3 shrink-0" />
                              <span className="truncate">+ Chèn link minh chứng</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Chưa có minh chứng</span>
                          )}
                        </div>

                        {isAssignedToCurrent && task.evidence && (
                          <button
                            onClick={() => handleOpenEvidenceModal(task)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-sky-600 transition-all cursor-pointer shrink-0 opacity-75 group-hover:opacity-100"
                            title="Cập nhật minh chứng"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 7. GHI CHÚ */}
                    <td className="py-3.5 px-3 break-words">
                      <div className="flex items-start justify-between gap-1 group min-w-0">
                        <div className="flex-1 min-w-0 text-slate-700 dark:text-slate-300 text-xs leading-relaxed break-words">
                          {task.notes ? (
                            <span>{task.notes}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Chưa có ghi chú</span>
                          )}
                        </div>

                        {isAssignedToCurrent && (
                          <button
                            onClick={() => handleOpenNoteModal(task)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-sky-600 transition-all cursor-pointer shrink-0 opacity-75 group-hover:opacity-100"
                            title="Điền/Sửa ghi chú tiến độ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 8. THAO TÁC (CHỈ DÀNH RIÊNG CHO TỔ TRƯỞNG: SỬA, XÓA) */}
                    {isLeader && (
                      <td className="py-3.5 px-1.5 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => handleOpenEditModal(task)}
                            className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/60 text-sky-600 dark:text-sky-400 transition-all cursor-pointer"
                            title="Chỉnh sửa toàn bộ công việc"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmTask(task)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                            title="Xóa công việc này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
              ) : (
                <tr>
                  <td colSpan={isLeader ? 8 : 7} className="p-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                          {searchTerm ||
                          statusFilter !== "all" ||
                          monthFilter !== "all" ||
                          teacherFilter !== "all" ||
                          onlyMyTasks
                            ? "Không tìm thấy công việc phù hợp"
                            : "Chưa có công việc nào được giao"}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {searchTerm ||
                          statusFilter !== "all" ||
                          monthFilter !== "all" ||
                          teacherFilter !== "all" ||
                          onlyMyTasks
                            ? "Thầy/Cô hãy thử thay đổi từ khóa hoặc bộ lọc để hiển thị kết quả."
                            : isLeader
                            ? "Thầy hãy bấm '+ Giao Việc Mới' để bắt đầu phân công nhiệm vụ cho các thầy cô trong tổ."
                            : "Hiện tại Tổ trưởng chưa phân công công việc nào."}
                        </p>
                      </div>
                      {isLeader && !searchTerm && statusFilter === "all" && monthFilter === "all" && (
                        <Button
                          size="sm"
                          onClick={handleOpenAddModal}
                          className="font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs"
                        >
                          <PlusCircle className="w-4 h-4 mr-1.5" /> + Giao Việc Đầu Tiên
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TỔ TRƯỞNG GIAO VIỆC MỚI (CHỌN NHIỀU GIÁO VIÊN)                   */}
      {/* ========================================================================= */}
      {isLeader && isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 px-5 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  <PlusCircle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Giao Nhiệm Vụ Chuyên Môn Mới
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Có thể chọn một hoặc nhiều giáo viên trong tổ ICT cùng thực hiện
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body cuộn độc lập */}
            <form onSubmit={handleSubmitAddTask} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                {/* 1. NỘI DUNG CÔNG VIỆC */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nội Dung Công Việc: <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={addFormData.task_content}
                    onChange={(e) => setAddFormData({ ...addFormData, task_content: e.target.value })}
                    placeholder="Ví dụ: Soạn đề cương kiểm tra giữa kỳ 1 Khối 5, Kiểm tra dàn máy tính Lab Central..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* 2. GIÁO VIÊN PHỤ TRÁCH (MULTI-SELECT CHECKBOX HỢP LÝ, CHỌN NHIỀU NGƯỜI) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      <span>Giáo Viên Phụ Trách: <span className="text-rose-500">*</span></span>
                      <Badge variant="secondary" className="text-[10px] font-extrabold px-2 py-0">
                        Đã chọn {addFormData.selectedTeacherIds.length}/{teachersList.length}
                      </Badge>
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllAddTeachers}
                      className="text-[11px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      {addFormData.selectedTeacherIds.length === teachersList.length
                        ? "Bỏ chọn tất cả"
                        : "Chọn tất cả giáo viên"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    {teachersList.map((teacher) => {
                      const isChecked = addFormData.selectedTeacherIds.includes(teacher.id);
                      return (
                        <label
                          key={teacher.id}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all select-none ${
                            isChecked
                              ? "bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-700 text-sky-900 dark:text-sky-100 shadow-2xs"
                              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAddTeacherSelection(teacher.id)}
                            className="w-4 h-4 rounded accent-sky-600 cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs truncate">{teacher.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {teacher.campus || teacher.email}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 3. DEADLINE & TÌNH TRẠNG */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Hạn Chót (Deadline): <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      type="date"
                      value={addFormData.deadline}
                      onChange={(e) => setAddFormData({ ...addFormData, deadline: e.target.value })}
                      className="rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Tình Trạng Khởi Tạo:
                    </label>
                    <select
                      aria-label="Tình trạng khởi tạo của công việc"
                      value={addFormData.status}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          status: e.target.value as "Đang thực hiện" | "Hoàn thành" | "Trễ tiến độ",
                        })
                      }
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="Đang thực hiện">⏳ Đang thực hiện</option>
                      <option value="Hoàn thành">✅ Hoàn thành</option>
                      <option value="Trễ tiến độ">⚠️ Trễ tiến độ</option>
                    </select>
                  </div>
                </div>

                {/* 4. MINH CHỨNG (TÙY CHỌN) */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Minh Chứng (Chèn link hoặc văn bản):
                  </label>
                  <Input
                    value={addFormData.evidence}
                    onChange={(e) => setAddFormData({ ...addFormData, evidence: e.target.value })}
                    placeholder="Dán đường dẫn Google Drive, Docs, hoặc văn bản minh chứng (nếu có)..."
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-9"
                  />
                </div>

                {/* 5. GHI CHÚ */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Ghi Chú Chi Tiết:
                  </label>
                  <textarea
                    rows={2}
                    value={addFormData.notes}
                    onChange={(e) => setAddFormData({ ...addFormData, notes: e.target.value })}
                    placeholder="Lưu ý về tài liệu đính kèm, đường dẫn nộp bài, hoặc chỉ đạo thêm..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Footer cố định */}
              <div className="p-3.5 px-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/90 dark:bg-slate-900/90 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl font-bold text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmittingAdd}
                  className="rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 cursor-pointer"
                >
                  <Check className="w-4 h-4 mr-1.5" /> Giao Việc Ngay
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TỔ TRƯỞNG SỬA CÔNG VIỆC (CHỌN NHIỀU GIÁO VIÊN)                   */}
      {/* ========================================================================= */}
      {isLeader && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 px-5 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  <Edit2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Chỉnh Sửa Công Việc Chuyên Môn
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cập nhật nội dung, danh sách giáo viên phụ trách, deadline, minh chứng hoặc ghi chú
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body cuộn độc lập */}
            <form onSubmit={handleSubmitEditTask} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                {/* 1. NỘI DUNG CÔNG VIỆC */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nội Dung Công Việc: <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={editFormData.task_content}
                    onChange={(e) => setEditFormData({ ...editFormData, task_content: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* 2. GIÁO VIÊN PHỤ TRÁCH (MULTI-SELECT CHECKBOX) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      <span>Giáo Viên Phụ Trách: <span className="text-rose-500">*</span></span>
                      <Badge variant="secondary" className="text-[10px] font-extrabold px-2 py-0">
                        Đã chọn {editFormData.selectedTeacherIds.length}/{teachersList.length}
                      </Badge>
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllEditTeachers}
                      className="text-[11px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      {editFormData.selectedTeacherIds.length === teachersList.length
                        ? "Bỏ chọn tất cả"
                        : "Chọn tất cả giáo viên"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    {teachersList.map((teacher) => {
                      const isChecked = editFormData.selectedTeacherIds.includes(teacher.id);
                      return (
                        <label
                          key={teacher.id}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all select-none ${
                            isChecked
                              ? "bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-700 text-sky-900 dark:text-sky-100 shadow-2xs"
                              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleEditTeacherSelection(teacher.id)}
                            className="w-4 h-4 rounded accent-sky-600 cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs truncate">{teacher.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {teacher.campus || teacher.email}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 3. DEADLINE & TÌNH TRẠNG */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Hạn Chót (Deadline): <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      type="date"
                      value={editFormData.deadline}
                      onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                      className="rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Tình Trạng:
                    </label>
                    <select
                      aria-label="Cập nhật tình trạng của công việc"
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          status: e.target.value as "Đang thực hiện" | "Hoàn thành" | "Trễ tiến độ",
                        })
                      }
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="Đang thực hiện">⏳ Đang thực hiện</option>
                      <option value="Hoàn thành">✅ Hoàn thành</option>
                      <option value="Trễ tiến độ">⚠️ Trễ tiến độ</option>
                    </select>
                  </div>
                </div>

                {/* 4. MINH CHỨNG */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Minh Chứng (Link hoặc văn bản):
                  </label>
                  <Input
                    value={editFormData.evidence}
                    onChange={(e) => setEditFormData({ ...editFormData, evidence: e.target.value })}
                    placeholder="Dán đường dẫn Google Drive, Docs, hoặc văn bản minh chứng..."
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-9"
                  />
                </div>

                {/* 5. GHI CHÚ */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Ghi Chú:
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-3.5 px-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/90 dark:bg-slate-900/90 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTask(null)}
                  className="rounded-xl font-bold text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmittingEdit}
                  className="rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 cursor-pointer"
                >
                  <Check className="w-4 h-4 mr-1.5" /> Lưu Thay Đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: XÁC NHẬN XÓA CÔNG VIỆC (CHỈ DÀNH CHO TỔ TRƯỞNG)                  */}
      {/* ========================================================================= */}
      {isLeader && deleteConfirmTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Xác Nhận Xóa Công Việc?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Thầy có chắc chắn muốn xóa công việc:
              </p>
              <div className="mt-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 font-bold text-xs text-slate-800 dark:text-slate-200 text-left line-clamp-2">
                "{deleteConfirmTask.task_content}"
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Phụ trách: <strong>{deleteConfirmTask.assignee_name}</strong>
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmTask(null)}
                className="rounded-xl font-bold text-xs cursor-pointer"
              >
                Hủy Bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteTask}
                className="rounded-xl font-bold text-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Xác Nhận Xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: GIÁO VIÊN CẬP NHẬT MINH CHỨNG (CHÈN LINK / VĂN BẢN)              */}
      {/* ========================================================================= */}
      {evidenceModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  <Link2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Cập Nhật Minh Chứng Công Việc
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Chèn đường dẫn (link) tài liệu hoặc nhập văn bản minh chứng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEvidenceModalTask(null)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500">Công việc: </span>
              <strong className="text-slate-800 dark:text-slate-200">{evidenceModalTask.task_content}</strong>
            </div>

            <form onSubmit={handleSaveEvidence} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Đường Dẫn (Link) Hoặc Văn Bản Minh Chứng:
                </label>
                <textarea
                  rows={3}
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  placeholder="Dán link Google Drive, Google Docs, OneDrive hoặc nhập nội dung minh chứng..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEvidenceModalTask(null)}
                  className="rounded-xl font-bold text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmittingEvidence}
                  className="rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4 mr-1.5" /> Lưu Minh Chứng
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: GIÁO VIÊN ĐIỀN / SỬA GHI CHÚ TIẾN ĐỘ CÔNG VIỆC CỦA MÌNH           */}
      {/* ========================================================================= */}
      {noteModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Cập Nhật Ghi Chú Tiến Độ
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Báo cáo tiến trình hoặc ghi chú của Thầy/Cô
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNoteModalTask(null)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500">Công việc: </span>
              <strong className="text-slate-800 dark:text-slate-200">{noteModalTask.task_content}</strong>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nội Dung Ghi Chú / Báo Cáo Tiến Độ:
                </label>
                <textarea
                  rows={4}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Nhập tiến độ thực hiện thực tế, vị trí tài liệu, vướng mắc cần hỗ trợ..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNoteModalTask(null)}
                  className="rounded-xl font-bold text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmittingNote}
                  className="rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4 mr-1.5" /> Lưu Ghi Chú
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
