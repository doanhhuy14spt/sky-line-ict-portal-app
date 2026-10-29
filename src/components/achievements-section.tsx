"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Trophy,
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  X,
  Check,
  Award,
  GraduationCap,
  UserCheck,
  Link2,
  ExternalLink,
  Settings2,
  Sparkles,
  Lock,
  AlertTriangle,
  School,
  Medal,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClassItem } from "@/components/teaching-assignment-section";
import { maskStudentName } from "@/lib/student-privacy";

export interface CompetitionCatalogItem {
  id: string;
  name: string;
  level: string;
  school_year?: string;
  description?: string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AchievementItem {
  id: string;
  competition_id: string | null;
  competition_name: string;
  level: string;
  achievement_of: "Giáo viên đạt giải" | "Học sinh đạt giải";
  student_name: string;
  class_name: string;
  achievement_result: string;
  evidence_link: string;
  teacher_name?: string;
  user_id?: string | null;
  school_year?: string;
  created_at: string;
  updated_at: string;
}

interface TeacherProfileOption {
  id: string;
  name: string;
  email: string;
  campus: string;
  role: string;
}

interface AchievementsSectionProps {
  supabase: SupabaseClient;
  showToast: (text: string, type?: "success" | "warning" | "info") => void;
  currentUserProfile: {
    id: string;
    email: string;
    name: string;
    role: "leader" | "teacher" | "guest";
    campus: string;
  };
  classesList: ClassItem[];
  teachersList: TeacherProfileOption[];
  selectedSchoolYear?: string;
  isStudentPrivacyActive?: boolean;
}

const COMPETITION_LEVELS = [
  "Cấp Trường",
  "Cấp Phường",
  "Cấp Thành phố",
  "Cấp Khu vực",
  "Cấp Quốc gia",
  "Cấp Quốc tế",
];

const SUGGESTED_RESULTS = [
  "Giải Nhất",
  "Giải Nhì",
  "Giải Ba",
  "Giải Khuyến khích",
  "Huy chương Vàng",
  "Huy chương Bạc",
  "Huy chương Đồng",
  "Giáo viên dạy giỏi",
];

export function AchievementsSection({
  supabase,
  showToast,
  currentUserProfile,
  classesList: propClassesList,
  teachersList,
  selectedSchoolYear = "2026-2027",
  isStudentPrivacyActive,
}: AchievementsSectionProps) {
  const router = useRouter();
  const isLeader = currentUserProfile?.role === "leader";
  const isGuest = currentUserProfile?.role === "guest";
  const shouldMaskStudent = Boolean(isStudentPrivacyActive || isGuest);

  // =========================================================================
  // 1. STATE DỮ LIỆU TỪ SUPABASE (THÀNH TÍCH, CUỘC THI, LỚP HỌC)
  // =========================================================================
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionCatalogItem[]>([]);
  const [localClasses, setLocalClasses] = useState<ClassItem[]>(propClassesList || []);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState<boolean>(false);

  // Đồng bộ classesList từ props hoặc tự tải từ bảng classes theo năm học
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
  // 2. STATE BỘ LỌC & TÌM KIẾM TRÊN BẢNG
  // =========================================================================
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [competitionFilter, setCompetitionFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [targetFilter, setTargetFilter] = useState<"all" | "Học sinh đạt giải" | "Giáo viên đạt giải">("all");

  // =========================================================================
  // 3. STATE MODAL THÊM / SỬA THÀNH TÍCH (GIÁO VIÊN & TỔ TRƯỞNG)
  // =========================================================================
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingAchievement, setEditingAchievement] = useState<AchievementItem | null>(null);
  const [isSubmittingAchievement, setIsSubmittingAchievement] = useState<boolean>(false);

  // Bộ lọc phụ giúp tìm lớp nhanh trong Modal (113 lớp từ bảng classes)
  const [classCampusFilter, setClassCampusFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    competition_id: "",
    competition_name: "",
    level: "Cấp Thành phố",
    achievement_of: "Học sinh đạt giải" as "Giáo viên đạt giải" | "Học sinh đạt giải",
    student_name: "",
    class_name: "",
    achievement_result: "",
    evidence_link: "",
    teacher_name: "",
  });

  // Modal xác nhận xóa dòng thành tích
  const [deleteConfirmAchievement, setDeleteConfirmAchievement] = useState<AchievementItem | null>(null);
  const [isDeletingAchievement, setIsDeletingAchievement] = useState<boolean>(false);

  // Modal sửa nhanh Minh chứng 1 chạm
  const [quickEditEvidenceItem, setQuickEditEvidenceItem] = useState<AchievementItem | null>(null);
  const [quickEvidenceValue, setQuickEvidenceValue] = useState<string>("");
  const [isSavingQuickEvidence, setIsSavingQuickEvidence] = useState<boolean>(false);

  // =========================================================================
  // 4. STATE MODAL QUẢN LÝ DANH MỤC CUỘC THI / KÌ THI (DÀNH RIÊNG CHO TỔ TRƯỞNG)
  // =========================================================================
  const [isCompetitionModalOpen, setIsCompetitionModalOpen] = useState<boolean>(false);
  const [newCompName, setNewCompName] = useState<string>("");
  const [newCompLevel, setNewCompLevel] = useState<string>("Cấp Thành phố");
  const [newCompDesc, setNewCompDesc] = useState<string>("");
  const [isSubmittingNewComp, setIsSubmittingNewComp] = useState<boolean>(false);

  // Chỉnh sửa cuộc thi trong danh mục
  const [editingCompItem, setEditingCompItem] = useState<CompetitionCatalogItem | null>(null);
  const [editCompName, setEditCompName] = useState<string>("");
  const [editCompLevel, setEditCompLevel] = useState<string>("Cấp Thành phố");
  const [editCompDesc, setEditCompDesc] = useState<string>("");
  const [isSubmittingEditComp, setIsSubmittingEditComp] = useState<boolean>(false);

  // Xóa cuộc thi khỏi danh mục
  const [deleteConfirmCompItem, setDeleteConfirmCompItem] = useState<CompetitionCatalogItem | null>(null);
  const [isDeletingComp, setIsDeletingComp] = useState<boolean>(false);

  // =========================================================================
  // 5. TẢI DỮ LIỆU TỪ SUPABASE & ĐĂNG KÝ REALTIME (ĐỒNG BỘ THEO NĂM HỌC)
  // =========================================================================
  const loadCompetitions = useCallback(async () => {
    setIsLoadingCompetitions(true);
    try {
      const { data, error } = await supabase
        .from("competition_catalog")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCompetitions(data || []);
    } catch (err: any) {
      console.error("Lỗi tải danh sách cuộc thi:", err);
    } finally {
      setIsLoadingCompetitions(false);
    }
  }, [supabase, selectedSchoolYear]);

  const loadAchievements = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("school_year", selectedSchoolYear)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAchievements((data as AchievementItem[]) || []);
    } catch (err: any) {
      console.error("Lỗi tải bảng thành tích:", err);
      showToast("Không thể tải dữ liệu bảng thành tích!", "warning");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, showToast, selectedSchoolYear]);

  useEffect(() => {
    loadCompetitions();
    loadAchievements();

    const compChannel = supabase
      .channel("realtime_competition_catalog")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "competition_catalog" },
        () => {
          loadCompetitions();
        }
      )
      .subscribe();

    const achChannel = supabase
      .channel("realtime_achievements_table")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "achievements" },
        () => {
          loadAchievements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(compChannel);
      supabase.removeChannel(achChannel);
    };
  }, [loadCompetitions, loadAchievements, supabase]);

  // =========================================================================
  // 6. CÁC HÀM QUẢN LÝ CUỘC THI / KÌ THI (DÀNH RIÊNG CHO TỔ TRƯỞNG CHUYÊN MÔN)
  // =========================================================================
  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader) {
      showToast("Chỉ Tổ trưởng chuyên môn mới có quyền thêm cuộc thi / kì thi!", "warning");
      return;
    }

    const trimmedName = newCompName.trim();
    if (!trimmedName) {
      showToast("Vui lòng nhập tên cuộc thi / kì thi!", "warning");
      return;
    }

    setIsSubmittingNewComp(true);
    try {
      const { error } = await supabase.from("competition_catalog").insert({
        name: trimmedName,
        level: newCompLevel,
        school_year: selectedSchoolYear,
        description: newCompDesc.trim(),
        created_by: currentUserProfile.id,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error(`Cuộc thi "${trimmedName}" đã tồn tại trong danh mục!`);
        }
        throw error;
      }

      showToast(`Đã tạo cuộc thi / kì thi "${trimmedName}" (${newCompLevel})!`, "success");
      setNewCompName("");
      setNewCompDesc("");
      await loadCompetitions();
      router.refresh();
    } catch (err: any) {
      console.error("Lỗi tạo cuộc thi mới:", err);
      showToast(err.message || "Không thể thêm cuộc thi mới!", "warning");
    } finally {
      setIsSubmittingNewComp(false);
    }
  };

  const handleOpenEditCompetition = (comp: CompetitionCatalogItem) => {
    if (!isLeader) return;
    setEditingCompItem(comp);
    setEditCompName(comp.name);
    setEditCompLevel(comp.level || "Cấp Thành phố");
    setEditCompDesc(comp.description || "");
  };

  const handleSaveEditCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader || !editingCompItem) return;

    const trimmedName = editCompName.trim();
    if (!trimmedName) {
      showToast("Tên cuộc thi / kì thi không được để trống!", "warning");
      return;
    }

    setIsSubmittingEditComp(true);
    try {
      const { error } = await supabase
        .from("competition_catalog")
        .update({
          name: trimmedName,
          level: editCompLevel,
          description: editCompDesc.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingCompItem.id);

      if (error) {
        if (error.code === "23505") {
          throw new Error(`Tên cuộc thi "${trimmedName}" bị trùng với cuộc thi khác!`);
        }
        throw error;
      }

      // Đồng bộ cập nhật tên cuộc thi và cấp cho tất cả thành tích gắn với cuộc thi này
      await supabase
        .from("achievements")
        .update({
          competition_name: trimmedName,
          level: editCompLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("competition_id", editingCompItem.id);

      showToast(`Đã cập nhật cuộc thi "${trimmedName}" và đồng bộ bảng thành tích!`, "success");
      setEditingCompItem(null);
      await Promise.all([loadCompetitions(), loadAchievements()]);
      router.refresh();
    } catch (err: any) {
      console.error("Lỗi sửa cuộc thi:", err);
      showToast(err.message || "Không thể cập nhật cuộc thi!", "warning");
    } finally {
      setIsSubmittingEditComp(false);
    }
  };

  const handleDeleteCompetition = async () => {
    if (!isLeader || !deleteConfirmCompItem) return;

    setIsDeletingComp(true);
    try {
      // Xóa các bản ghi thành tích thuộc cuộc thi này trước
      await supabase
        .from("achievements")
        .delete()
        .eq("competition_id", deleteConfirmCompItem.id);

      const { error } = await supabase
        .from("competition_catalog")
        .delete()
        .eq("id", deleteConfirmCompItem.id);

      if (error) throw error;

      showToast(`Đã xóa cuộc thi "${deleteConfirmCompItem.name}" khỏi danh mục!`, "success");
      setDeleteConfirmCompItem(null);
      await Promise.all([loadCompetitions(), loadAchievements()]);
      router.refresh();
    } catch (err: any) {
      console.error("Lỗi xóa cuộc thi:", err);
      showToast(err.message || "Không thể xóa cuộc thi!", "warning");
    } finally {
      setIsDeletingComp(false);
    }
  };

  // =========================================================================
  // 7. CÁC HÀM THÊM / SỬA / XÓA THÀNH TÍCH (CHO GIÁO VIÊN & TỔ TRƯỞNG)
  // =========================================================================
  const handleSelectCompetitionInForm = (compId: string) => {
    const matched = competitions.find((c) => c.id === compId);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        competition_id: matched.id,
        competition_name: matched.name,
        level: matched.level || "Cấp Thành phố",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        competition_id: "",
        competition_name: "",
      }));
    }
  };

  const handleOpenAddAchievement = () => {
    if (competitions.length === 0) {
      if (isLeader) {
        showToast("Chưa có cuộc thi nào! Vui lòng thêm cuộc thi / kì thi trước.", "info");
        setIsCompetitionModalOpen(true);
      } else {
        showToast("Hiện Tổ trưởng chuyên môn chưa tạo danh sách cuộc thi / kì thi nào!", "warning");
      }
      return;
    }

    const firstComp = competitions[0];
    const defaultClass = localClasses.length > 0 ? localClasses[0].name : "";

    setModalMode("add");
    setEditingAchievement(null);
    setClassCampusFilter("all");
    setFormData({
      competition_id: firstComp.id,
      competition_name: firstComp.name,
      level: firstComp.level || "Cấp Thành phố",
      achievement_of: "Học sinh đạt giải",
      student_name: "",
      class_name: defaultClass,
      achievement_result: "",
      evidence_link: "",
      teacher_name: currentUserProfile.name || "Giáo viên ICT",
    });
    setIsAchievementModalOpen(true);
  };

  const handleOpenEditAchievement = (item: AchievementItem) => {
    const matchedComp =
      competitions.find((c) => c.id === item.competition_id) ||
      competitions.find((c) => c.name.trim().toLowerCase() === item.competition_name.trim().toLowerCase());

    const isTeacherAward = item.achievement_of === "Giáo viên đạt giải";
    setModalMode("edit");
    setEditingAchievement(item);
    setClassCampusFilter("all");
    setFormData({
      competition_id: matchedComp ? matchedComp.id : item.competition_id || "",
      competition_name: matchedComp ? matchedComp.name : item.competition_name,
      level: matchedComp ? matchedComp.level : item.level || "Cấp Thành phố",
      achievement_of: item.achievement_of || "Học sinh đạt giải",
      student_name: isTeacherAward ? "" : item.student_name || "",
      class_name: isTeacherAward ? "" : item.class_name || "",
      achievement_result: item.achievement_result || "",
      evidence_link: item.evidence_link || "",
      teacher_name: item.teacher_name || currentUserProfile.name || "",
    });
    setIsAchievementModalOpen(true);
  };

  const handleSubmitAchievement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.competition_id || !formData.competition_name.trim()) {
      showToast("Vui lòng chọn Cuộc thi / Kì thi từ danh sách do Tổ trưởng tạo!", "warning");
      return;
    }

    if (formData.achievement_of === "Học sinh đạt giải" && !formData.student_name.trim()) {
      showToast("Vui lòng nhập Họ và tên học sinh đạt giải!", "warning");
      return;
    }

    if (formData.achievement_of === "Học sinh đạt giải" && !formData.class_name.trim()) {
      showToast("Vui lòng chọn Lớp từ danh sách lớp!", "warning");
      return;
    }

    if (!formData.achievement_result.trim()) {
      showToast("Vui lòng nhập Thành tích đạt được (ví dụ: Giải Nhất, Huy chương Vàng...)!", "warning");
      return;
    }

    setIsSubmittingAchievement(true);
    try {
      const selectedComp = competitions.find((c) => c.id === formData.competition_id);
      const finalCompName = selectedComp ? selectedComp.name : formData.competition_name.trim();
      const finalLevel = selectedComp ? selectedComp.level : formData.level;
      const isTeacherAward = formData.achievement_of === "Giáo viên đạt giải";
      const finalStudentName = isTeacherAward ? "" : formData.student_name.trim();
      const finalClassName = isTeacherAward ? "" : formData.class_name.trim();

      if (modalMode === "add") {
        const { error } = await supabase.from("achievements").insert({
          competition_id: formData.competition_id,
          competition_name: finalCompName,
          level: finalLevel,
          achievement_of: formData.achievement_of,
          student_name: finalStudentName,
          class_name: finalClassName,
          achievement_result: formData.achievement_result.trim(),
          evidence_link: formData.evidence_link.trim(),
          teacher_name: formData.teacher_name.trim() || currentUserProfile.name,
          school_year: selectedSchoolYear,
        });

        if (error) throw error;
        showToast("Đã thêm thông tin thành tích mới thành công!", "success");
      } else {
        if (!editingAchievement) return;
        const { error } = await supabase
          .from("achievements")
          .update({
            competition_id: formData.competition_id,
            competition_name: finalCompName,
            level: finalLevel,
            achievement_of: formData.achievement_of,
            student_name: finalStudentName,
            class_name: finalClassName,
            achievement_result: formData.achievement_result.trim(),
            evidence_link: formData.evidence_link.trim(),
            teacher_name: formData.teacher_name.trim() || currentUserProfile.name,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingAchievement.id);

        if (error) throw error;
        showToast("Đã cập nhật thông tin thành tích thành công!", "success");
      }

      setIsAchievementModalOpen(false);
      await loadAchievements();
      router.refresh();
    } catch (err: any) {
      console.error("Lỗi lưu thành tích:", err);
      showToast(err.message || "Không thể lưu thông tin thành tích!", "warning");
    } finally {
      setIsSubmittingAchievement(false);
    }
  };

  const handleDeleteAchievement = async () => {
    if (!deleteConfirmAchievement) return;

    setIsDeletingAchievement(true);
    try {
      const { error } = await supabase
        .from("achievements")
        .delete()
        .eq("id", deleteConfirmAchievement.id);

      if (error) throw error;

      showToast("Đã xóa bản ghi thành tích khỏi hệ thống!", "success");
      setDeleteConfirmAchievement(null);
      await loadAchievements();
      router.refresh();
    } catch (err: any) {
      console.error("Lỗi xóa thành tích:", err);
      showToast(err.message || "Không thể xóa bản ghi thành tích!", "warning");
    } finally {
      setIsDeletingAchievement(false);
    }
  };

  // Lưu nhanh link minh chứng 1 chạm
  const handleSaveQuickEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditEvidenceItem) return;

    setIsSavingQuickEvidence(true);
    try {
      const { error } = await supabase
        .from("achievements")
        .update({
          evidence_link: quickEvidenceValue.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", quickEditEvidenceItem.id);

      if (error) throw error;

      showToast("Đã cập nhật link minh chứng quyết định / giấy khen!", "success");
      setQuickEditEvidenceItem(null);
      await loadAchievements();
      router.refresh();
    } catch (err: any) {
      console.error("Lỗi cập nhật minh chứng:", err);
      showToast(err.message || "Không thể cập nhật link minh chứng!", "warning");
    } finally {
      setIsSavingQuickEvidence(false);
    }
  };

  // =========================================================================
  // 8. LỌC DỮ LIỆU & THỐNG KÊ NHANH
  // =========================================================================
  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const displayedStudentName = maskStudentName(item.student_name, shouldMaskStudent);
      const matchSearch =
        !q ||
        item.competition_name?.toLowerCase().includes(q) ||
        item.level?.toLowerCase().includes(q) ||
        displayedStudentName?.toLowerCase().includes(q) ||
        item.class_name?.toLowerCase().includes(q) ||
        item.achievement_result?.toLowerCase().includes(q) ||
        item.teacher_name?.toLowerCase().includes(q);

      const matchComp =
        competitionFilter === "all" ||
        item.competition_id === competitionFilter ||
        item.competition_name === competitionFilter;

      const matchLevel = levelFilter === "all" || item.level === levelFilter;
      const matchTarget = targetFilter === "all" || item.achievement_of === targetFilter;

      return matchSearch && matchComp && matchLevel && matchTarget;
    });
  }, [achievements, searchTerm, competitionFilter, levelFilter, targetFilter, shouldMaskStudent]);

  const stats = useMemo(() => {
    const total = achievements.length;
    const studentCount = achievements.filter((a) => a.achievement_of === "Học sinh đạt giải").length;
    const teacherCount = achievements.filter((a) => a.achievement_of === "Giáo viên đạt giải").length;
    const totalCompetitions = competitions.length;
    return { total, studentCount, teacherCount, totalCompetitions };
  }, [achievements, competitions]);

  // Danh sách lớp học lọc theo cơ sở trong Modal
  const filteredClassesForSelect = useMemo(() => {
    if (classCampusFilter === "all") return localClasses;
    return localClasses.filter((c) => c.campus === classCampusFilter);
  }, [localClasses, classCampusFilter]);

  // Nhóm lớp học theo tên cơ sở để hiển thị gọn gàng trong <select>
  const groupedClassesByCampus = useMemo(() => {
    const groups: Record<string, ClassItem[]> = {};
    filteredClassesForSelect.forEach((cls) => {
      const groupName = cls.campus_name || `Cơ sở ${cls.campus}`;
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(cls);
    });
    return groups;
  }, [filteredClassesForSelect]);

  // Hàm hiển thị màu sắc cho Cấp thi
  const renderLevelBadge = (level: string) => {
    const lv = (level || "").toLowerCase();
    if (lv.includes("quốc tế")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300/80 dark:border-purple-800">
          🌍 {level}
        </span>
      );
    }
    if (lv.includes("quốc gia")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800">
          🇻🇳 {level}
        </span>
      );
    }
    if (lv.includes("thành phố") || lv.includes("tỉnh") || lv.includes("khu vực")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800">
          🏙️ {level}
        </span>
      );
    }
    if (lv.includes("phường") || lv.includes("quận") || lv.includes("huyện")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300/80 dark:border-sky-800">
          🏛️ {level}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800">
        🏫 {level}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. KHUNG TIÊU ĐỀ & CÁC NÚT THAO TÁC CHÍNH                                  */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Quản Lý Thành Tích Cuộc Thi & Kì Thi Chuyên Môn ICT
                </h2>
                <Badge
                  variant={isLeader ? "amber" : isGuest ? "outline" : "default"}
                  className="text-[11px] font-bold"
                >
                  {isLeader
                    ? "👑 Quyền Tổ Trưởng (Quản lý Cuộc thi & Thành tích)"
                    : isGuest
                    ? "👁️ Quyền Khách (Chế độ Chỉ Xem)"
                    : "👩‍🏫 Quyền Giáo Viên (Khai báo & Cập nhật Thành tích)"}
                </Badge>
                {shouldMaskStudent && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Đã ẩn danh danh tính học sinh
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isLeader
                  ? "Tổ trưởng chuyên môn có quyền thêm, sửa, xóa danh mục các cuộc thi / kì thi và quản lý toàn bộ thành tích của Giáo viên & Học sinh."
                  : isGuest
                  ? "Tài khoản Khách được phép xem và lọc toàn bộ bảng vàng thành tích của Giáo viên & Học sinh Tổ ICT theo năm học."
                  : "Giáo viên chọn cuộc thi / kì thi từ danh sách của Tổ trưởng và có toàn quyền thêm, sửa, xóa các thông tin từ cột 'Thành tích của' về sau."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* NÚT DÀNH RIÊNG CHO TỔ TRƯỞNG: THÊM / SỬA / XÓA CÁC CUỘC THI, KÌ THI */}
            {isLeader && (
              <Button
                size="sm"
                onClick={() => setIsCompetitionModalOpen(true)}
                className="font-bold text-xs h-9 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs cursor-pointer"
                title="Dành riêng cho Tổ trưởng: Thêm, sửa, xóa danh mục các cuộc thi, kì thi"
              >
                <Settings2 className="w-4 h-4 mr-1.5" />
                Quản Lý Cuộc Thi / Kì Thi ({competitions.length})
              </Button>
            )}

            {/* NÚT THÊM THÀNH TÍCH MỚI (CHO CẢ GIÁO VIÊN VÀ TỔ TRƯỞNG, ẨN VỚI KHÁCH) */}
            {!isGuest && (
              <Button
                size="sm"
                onClick={handleOpenAddAchievement}
                className="font-bold text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md shadow-amber-600/20 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                + Thêm Thành Tích Mới
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                loadCompetitions();
                loadAchievements();
                showToast("Đã đồng bộ dữ liệu thành tích mới nhất!", "info");
              }}
              className="font-bold text-xs h-9 rounded-xl cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading || isLoadingCompetitions ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* 4 THẺ CHỈ SỐ THỐNG KÊ NHANH */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div
            onClick={() => setTargetFilter("all")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              targetFilter === "all"
                ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-2xs"
                : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100/70"
            }`}
          >
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tổng Số Giải Thưởng</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => setTargetFilter("Học sinh đạt giải")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              targetFilter === "Học sinh đạt giải"
                ? "bg-sky-50/90 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 shadow-2xs"
                : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100/70"
            }`}
          >
            <div>
              <div className="text-[11px] font-bold text-sky-700 dark:text-sky-400">Học Sinh Đạt Giải</div>
              <div className="text-2xl font-black text-sky-700 dark:text-sky-300 mt-0.5">{stats.studentCount}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => setTargetFilter("Giáo viên đạt giải")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              targetFilter === "Giáo viên đạt giải"
                ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-2xs"
                : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100/70"
            }`}
          >
            <div>
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Giáo Viên Đạt Giải</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{stats.teacherCount}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => {
              if (isLeader) setIsCompetitionModalOpen(true);
            }}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 ${
              isLeader ? "cursor-pointer hover:border-sky-300" : ""
            }`}
          >
            <div>
              <div className="text-[11px] font-bold text-purple-700 dark:text-purple-400">Danh Mục Cuộc Thi / Kì Thi</div>
              <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-0.5">{stats.totalCompetitions}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* THANH TÌM KIẾM & BỘ LỌC */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo cuộc thi, tên học sinh, lớp, giải thưởng..."
              className="pl-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Các bộ lọc nhanh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Lọc theo Cuộc thi / Kì thi */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <select
                aria-label="Lọc theo cuộc thi"
                value={competitionFilter}
                onChange={(e) => setCompetitionFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                <option value="all" className="dark:bg-slate-900">Tất cả cuộc thi ({competitions.length})</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-slate-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo Cấp */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <select
                aria-label="Lọc theo cấp cuộc thi"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="dark:bg-slate-900">Tất cả các cấp</option>
                {COMPETITION_LEVELS.map((lv) => (
                  <option key={lv} value={lv} className="dark:bg-slate-900">
                    {lv}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo Đối tượng đạt giải */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <select
                aria-label="Lọc theo đối tượng đạt giải"
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value as any)}
                className="bg-transparent font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="dark:bg-slate-900">Mọi đối tượng</option>
                <option value="Học sinh đạt giải" className="dark:bg-slate-900">🎓 Học sinh đạt giải</option>
                <option value="Giáo viên đạt giải" className="dark:bg-slate-900">👩‍🏫 Giáo viên đạt giải</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BẢNG DANH SÁCH THÀNH TÍCH (RỘNG 100% MÀN HÌNH, KHÔNG CUỘN NGANG)       */}
      {/* ========================================================================= */}
      <div className="w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <table className="w-full table-fixed text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-2 text-center w-[4%]">STT</th>
              <th className="py-3.5 px-3 w-[18%]">Cuộc Thi / Kì Thi</th>
              <th className="py-3.5 px-2 text-center w-[11%]">Cấp</th>
              <th className="py-3.5 px-2.5 w-[14%]">Thành Tích Của</th>
              <th className="py-3.5 px-2.5 w-[13%]">Họ Và Tên Học Sinh</th>
              <th className="py-3.5 px-2 text-center w-[8%]">Lớp</th>
              <th className="py-3.5 px-2.5 w-[13%]">Thành Tích Đạt Được</th>
              <th className="py-3.5 px-2.5 w-[12%]">Minh Chứng</th>
              <th className="py-3.5 px-2 text-center w-[7%]">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="p-3 text-center"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                  <td className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/5" /></td>
                  <td className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 mx-auto" /></td>
                  <td className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" /></td>
                  <td className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" /></td>
                  <td className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12 mx-auto" /></td>
                  <td className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" /></td>
                  <td className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" /></td>
                  <td className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-10 mx-auto" /></td>
                </tr>
              ))
            ) : filteredAchievements.length > 0 ? (
              filteredAchievements.map((item, index) => {
                const isStudent = item.achievement_of === "Học sinh đạt giải";
                const rawLink = (item.evidence_link || "").trim();
                const hrefLink =
                  rawLink && (rawLink.startsWith("http://") || rawLink.startsWith("https://"))
                    ? rawLink
                    : rawLink
                    ? `https://${rawLink}`
                    : "";

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* CỘT 1: STT */}
                    <td className="py-3.5 px-2 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>

                    {/* CỘT 2: CUỘC THI / KÌ THI */}
                    <td className="py-3.5 px-3">
                      <div className="font-extrabold text-slate-900 dark:text-slate-100 leading-snug break-words flex items-start gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item.competition_name}</span>
                      </div>
                    </td>

                    {/* CỘT 3: CẤP */}
                    <td className="py-3.5 px-2 text-center">
                      {renderLevelBadge(item.level)}
                    </td>

                    {/* CỘT 4: THÀNH TÍCH CỦA */}
                    <td className="py-3.5 px-2.5">
                      {isStudent ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
                            <GraduationCap className="w-3 h-3 shrink-0" />
                            Học sinh đạt giải
                          </span>
                          {item.teacher_name && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              GVHD: <strong className="text-slate-700 dark:text-slate-300">{item.teacher_name}</strong>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                            <UserCheck className="w-3 h-3 shrink-0" />
                            Giáo viên đạt giải
                          </span>
                          {item.teacher_name && (
                            <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 break-words">
                              {item.teacher_name}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* CỘT 5: HỌ VÀ TÊN HỌC SINH */}
                    <td className="py-3.5 px-2.5">
                      {isStudent && item.student_name ? (
                        <span className="font-bold text-slate-800 dark:text-slate-200 break-words inline-flex items-center gap-1.5">
                          {shouldMaskStudent && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                          <span>{maskStudentName(item.student_name, shouldMaskStudent)}</span>
                        </span>
                      ) : null}
                    </td>

                    {/* CỘT 6: LỚP (TỪ BẢNG CLASSES) */}
                    <td className="py-3.5 px-2 text-center">
                      {isStudent && item.class_name ? (
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-[11px] border border-slate-200/80 dark:border-slate-700">
                          {item.class_name}
                        </span>
                      ) : null}
                    </td>

                    {/* CỘT 7: THÀNH TÍCH ĐẠT ĐƯỢC */}
                    <td className="py-3.5 px-2.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/80 font-extrabold text-[11px] break-words max-w-full">
                        <Medal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="break-words">{item.achievement_result}</span>
                      </span>
                    </td>

                    {/* CỘT 8: MINH CHỨNG (LINK QUYẾT ĐỊNH, GIẤY KHEN) */}
                    <td className="py-3.5 px-2.5">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          {rawLink && isStudent && shouldMaskStudent ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 font-bold text-[10px] max-w-full"
                              title="Minh chứng cá nhân của học sinh được bảo mật trong chế độ công khai"
                            >
                              <ShieldCheck className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span className="truncate">Bảo mật minh chứng HS</span>
                            </span>
                          ) : rawLink ? (
                            <a
                              href={hrefLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/80 hover:bg-sky-100 dark:hover:bg-sky-900/70 font-bold text-[11px] transition-all max-w-full"
                              title={rawLink}
                            >
                              <Link2 className="w-3 h-3 shrink-0 text-sky-600 dark:text-sky-400" />
                              <span className="truncate">Xem minh chứng</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-75" />
                            </a>
                          ) : !isGuest ? (
                            <button
                              onClick={() => {
                                setQuickEditEvidenceItem(item);
                                setQuickEvidenceValue(item.evidence_link || "");
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-[11px] font-semibold transition-all cursor-pointer max-w-full truncate"
                            >
                              <Link2 className="w-3 h-3 shrink-0" />
                              <span className="truncate">+ Đính kèm link</span>
                            </button>
                          ) : (
                            <span className="text-[11px] italic text-slate-400">Chưa cập nhật</span>
                          )}
                        </div>
                        {!isGuest && (
                          <button
                            onClick={() => {
                              setQuickEditEvidenceItem(item);
                              setQuickEvidenceValue(item.evidence_link || "");
                            }}
                            className="p-1 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/60 text-slate-400 hover:text-sky-600 transition-all shrink-0 cursor-pointer"
                            title="Cập nhật link quyết định / giấy khen"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* CỘT 9: THAO TÁC (SỬA / XÓA) */}
                    <td className="py-3.5 px-2 text-center">
                      {!isGuest ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditAchievement(item)}
                            className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/60 text-sky-600 dark:text-sky-400 transition-all cursor-pointer"
                            title="Chỉnh sửa thông tin thành tích"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmAchievement(item)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                            title="Xóa thành tích này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold">
                          Chỉ xem
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="p-12 text-center">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                        {searchTerm || competitionFilter !== "all" || levelFilter !== "all" || targetFilter !== "all"
                          ? "Không tìm thấy thành tích phù hợp"
                          : "Chưa có dữ liệu thành tích nào"}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchTerm || competitionFilter !== "all" || levelFilter !== "all" || targetFilter !== "all"
                          ? "Thầy/Cô hãy thử thay đổi từ khóa hoặc bộ lọc để hiển thị kết quả."
                          : "Thầy/Cô hãy bấm '+ Thêm Thành Tích Mới' để ghi nhận giải thưởng của Giáo viên & Học sinh."}
                      </p>
                    </div>
                    {!isGuest && !searchTerm && competitionFilter === "all" && levelFilter === "all" && targetFilter === "all" && (
                      <Button
                        size="sm"
                        onClick={handleOpenAddAchievement}
                        className="font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4 mr-1.5" /> + Thêm Thành Tích Đầu Tiên
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
      {/* MODAL 1: THÊM / CHỈNH SỬA THÀNH TÍCH (GIÁO VIÊN CHỈ CHỌN CUỘC THI TỪ DS)   */}
      {/* ========================================================================= */}
      {isAchievementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 px-5 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {modalMode === "add" ? "Khai Báo Thành Tích Mới" : "Chỉnh Sửa Thông Tin Thành Tích"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chọn cuộc thi do Tổ trưởng tạo và cập nhật từ mục &ldquo;Thành tích của&rdquo; về sau
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAchievementModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSubmitAchievement} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                {/* PHẦN A: CHỌN CUỘC THI / KÌ THI & CẤP (DO TỔ TRƯỞNG TẠO) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Thông Tin Cuộc Thi / Kì Thi (Danh mục của Tổ trưởng)
                    </span>
                    {isLeader && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAchievementModalOpen(false);
                          setIsCompetitionModalOpen(true);
                        }}
                        className="text-[11px] font-bold text-sky-600 hover:underline cursor-pointer"
                      >
                        + Quản lý cuộc thi
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* CỘT 1: CUỘC THI / KÌ THI (CHỈ ĐƯỢC LỰA CHỌN TỪ DANH SÁCH TỔ TRƯỞNG TẠO) */}
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Cuộc Thi / Kì Thi: <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        aria-label="Chọn cuộc thi hoặc kì thi"
                        value={formData.competition_id}
                        onChange={(e) => handleSelectCompetitionInForm(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                      >
                        {competitions.map((comp) => (
                          <option key={comp.id} value={comp.id} className="dark:bg-slate-900">
                            {comp.name} ({comp.level})
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Chỉ lựa chọn từ danh sách cuộc thi do Tổ trưởng chuyên môn tạo ra
                      </span>
                    </div>

                    {/* CỘT 2: CẤP (ĐỒNG BỘ THEO CUỘC THI ĐÃ CHỌN) */}
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Cấp Tổ Chức:
                      </label>
                      <div className="relative">
                        <Input
                          readOnly
                          tabIndex={-1}
                          value={formData.level}
                          className="h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 pl-8 cursor-not-allowed select-none"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Tự động theo cuộc thi
                      </span>
                    </div>
                  </div>
                </div>

                {/* PHẦN B: THÔNG TIN TỪ CỘT "THÀNH TÍCH CỦA" VỀ SAU (GIÁO VIÊN TOÀN QUYỀN THÊM/SỬA/XÓA) */}
                <div className="space-y-3.5">
                  {/* CỘT 3: THÀNH TÍCH CỦA (GIÁO VIÊN ĐẠT GIẢI HAY HỌC SINH ĐẠT GIẢI) */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Thành Tích Của: <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                          formData.achievement_of === "Học sinh đạt giải"
                            ? "bg-sky-50 dark:bg-sky-950/50 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="achievement_of"
                          value="Học sinh đạt giải"
                          checked={formData.achievement_of === "Học sinh đạt giải"}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              achievement_of: "Học sinh đạt giải",
                              class_name:
                                formData.class_name ||
                                (localClasses.length > 0 ? localClasses[0].name : ""),
                            })
                          }
                          className="accent-sky-600"
                        />
                        <div>
                          <div className="font-extrabold text-xs flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-sky-600" /> Học sinh đạt giải
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Cá nhân hoặc đội tuyển học sinh
                          </div>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                          formData.achievement_of === "Giáo viên đạt giải"
                            ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-2xs"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="achievement_of"
                          value="Giáo viên đạt giải"
                          checked={formData.achievement_of === "Giáo viên đạt giải"}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              achievement_of: "Giáo viên đạt giải",
                              student_name: "",
                              class_name: "",
                            })
                          }
                          className="accent-emerald-600"
                        />
                        <div>
                          <div className="font-extrabold text-xs flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-emerald-600" /> Giáo viên đạt giải
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Thành tích chuyên môn của thầy cô
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Chọn Giáo viên đạt giải / Giáo viên bồi dưỡng */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {formData.achievement_of === "Giáo viên đạt giải"
                        ? "Họ Và Tên Giáo Viên Đạt Giải:"
                        : "Giáo Viên Hướng Dẫn / Phụ Trách:"}
                    </label>
                    <select
                      aria-label="Chọn giáo viên"
                      value={formData.teacher_name}
                      onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    >
                      {teachersList.map((t) => (
                        <option key={t.id} value={t.name} className="dark:bg-slate-900">
                          {t.name} ({t.campus})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CỘT 4 & CỘT 5: HỌ VÀ TÊN HỌC SINH + LỚP (KHÓA & ĐỂ TRỐNG KHI LÀ GIÁO VIÊN ĐẠT GIẢI) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Họ Và Tên Học Sinh:{" "}
                        {formData.achievement_of === "Học sinh đạt giải" && (
                          <span className="text-rose-500">*</span>
                        )}
                      </label>
                      {formData.achievement_of === "Giáo viên đạt giải" ? (
                        <div className="relative">
                          <Input
                            disabled
                            readOnly
                            tabIndex={-1}
                            value=""
                            placeholder=""
                            className="h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 pl-8 cursor-not-allowed select-none"
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                      ) : (
                        <Input
                          required
                          value={formData.student_name}
                          onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                          placeholder="Ví dụ: Nguyễn Văn An..."
                          className="h-9 rounded-xl border-slate-200 dark:border-slate-700 font-semibold text-xs"
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          Lớp (Từ danh sách lớp):{" "}
                          {formData.achievement_of === "Học sinh đạt giải" && (
                            <span className="text-rose-500">*</span>
                          )}
                        </label>
                        {/* Lọc nhanh theo cơ sở chỉ hiển thị khi là Học sinh đạt giải */}
                        {formData.achievement_of === "Học sinh đạt giải" && (
                          <select
                            aria-label="Lọc lớp theo cơ sở"
                            value={classCampusFilter}
                            onChange={(e) => setClassCampusFilter(e.target.value)}
                            className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-transparent focus:outline-none cursor-pointer"
                          >
                            <option value="all" className="dark:bg-slate-900">Tất cả 5 CS ({localClasses.length} lớp)</option>
                            <option value="1" className="dark:bg-slate-900">CS1 - Riverside</option>
                            <option value="2" className="dark:bg-slate-900">CS2 - Central</option>
                            <option value="3" className="dark:bg-slate-900">CS3 - Global</option>
                            <option value="4" className="dark:bg-slate-900">CS4 - Hill</option>
                            <option value="5" className="dark:bg-slate-900">CS5 - Beach</option>
                          </select>
                        )}
                      </div>

                      {formData.achievement_of === "Giáo viên đạt giải" ? (
                        <div className="relative">
                          <Input
                            disabled
                            readOnly
                            tabIndex={-1}
                            value=""
                            placeholder=""
                            className="h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 pl-8 cursor-not-allowed select-none"
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                      ) : (
                        <select
                          required
                          aria-label="Chọn lớp học từ bảng classes"
                          value={formData.class_name}
                          onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                        >
                          <option value="" className="dark:bg-slate-900">
                            -- Chọn lớp học ({filteredClassesForSelect.length} lớp) --
                          </option>
                          {Object.entries(groupedClassesByCampus).map(([campusLabel, clsItems]) => (
                            <optgroup key={campusLabel} label={campusLabel} className="dark:bg-slate-900">
                              {clsItems.map((cls) => (
                                <option key={cls.id} value={cls.name} className="dark:bg-slate-900">
                                  {cls.name} (Khối {cls.grade})
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* CỘT 6: THÀNH TÍCH ĐẠT ĐƯỢC */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Thành Tích Đạt Được: <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      value={formData.achievement_result}
                      onChange={(e) => setFormData({ ...formData, achievement_result: e.target.value })}
                      placeholder="Ví dụ: Giải Nhất, Giải Nhì, Huy chương Vàng..."
                      className="h-9 rounded-xl border-slate-200 dark:border-slate-700 font-bold text-xs"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-slate-400 font-medium">Chọn nhanh:</span>
                      {SUGGESTED_RESULTS.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setFormData({ ...formData, achievement_result: sug })}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                            formData.achievement_result === sug
                              ? "bg-amber-500 text-white border-amber-500 font-bold"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400"
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CỘT 7: MINH CHỨNG (LINK ĐÍNH KÈM QUYẾT ĐỊNH, GIẤY KHEN) */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-sky-600" />
                      Minh Chứng (Link đính kèm quyết định, giấy khen):
                    </label>
                    <Input
                      value={formData.evidence_link}
                      onChange={(e) => setFormData({ ...formData, evidence_link: e.target.value })}
                      placeholder="Dán đường dẫn Google Drive, OneDrive chứa ảnh giấy khen / quyết định..."
                      className="h-9 rounded-xl border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="p-3.5 px-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/90 dark:bg-slate-900/90 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAchievementModalOpen(false)}
                  className="rounded-xl font-bold text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmittingAchievement}
                  className="rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  {modalMode === "add" ? "Lưu Thành Tích" : "Cập Nhật Thay Đổi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SỬA NHANH LINK MINH CHỨNG 1 CHẠM                                 */}
      {/* ========================================================================= */}
      {quickEditEvidenceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Cập Nhật Link Minh Chứng
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
                    {quickEditEvidenceItem.competition_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickEditEvidenceItem(null)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEvidence} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Đường dẫn (Link) quyết định, giấy khen:
                </label>
                <Input
                  autoFocus
                  value={quickEvidenceValue}
                  onChange={(e) => setQuickEvidenceValue(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="rounded-xl border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuickEditEvidenceItem(null)}
                  className="rounded-xl font-bold text-xs"
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSavingQuickEvidence}
                  className="rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1.5" /> Lưu Minh Chứng
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: XÁC NHẬN XÓA BẢN GHI THÀNH TÍCH                                  */}
      {/* ========================================================================= */}
      {deleteConfirmAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Xác Nhận Xóa Thành Tích?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Thầy/Cô có chắc chắn muốn xóa thành tích{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  &ldquo;{deleteConfirmAchievement.achievement_result}&rdquo;
                </strong>{" "}
                tại cuộc thi{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {deleteConfirmAchievement.competition_name}
                </strong>
                ?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmAchievement(null)}
                className="rounded-xl font-bold"
              >
                Hủy Bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={isDeletingAchievement}
                onClick={handleDeleteAchievement}
                className="rounded-xl font-bold"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Xác Nhận Xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: QUẢN LÝ CUỘC THI / KÌ THI (DÀNH RIÊNG CHO TỔ TRƯỞNG CHUYÊN MÔN)  */}
      {/* ========================================================================= */}
      {isLeader && isCompetitionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  <Settings2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Quản Lý Danh Mục Cuộc Thi & Kì Thi
                    <Badge variant="default" className="text-[10px] font-bold bg-sky-600">
                      Tổ Trưởng Chuyên Môn
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Thêm, sửa, xóa các cuộc thi / kì thi để giáo viên trong tổ lựa chọn khi khai báo thành tích.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCompetitionModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* KHỐI 1: BIỂU MẪU THÊM CUỘC THI / KÌ THI MỚI */}
            <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/60 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h4 className="font-extrabold text-xs text-sky-900 dark:text-sky-200 uppercase tracking-wider">
                  + Thêm Cuộc Thi / Kì Thi Mới
                </h4>
              </div>

              <form onSubmit={handleCreateCompetition} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                      Tên Cuộc Thi / Kì Thi: <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      value={newCompName}
                      onChange={(e) => setNewCompName(e.target.value)}
                      placeholder="Ví dụ: Hội thi Tin học trẻ, Robothon Quốc tế, KHKT..."
                      className="rounded-xl border-slate-200 dark:border-slate-800 font-semibold text-xs h-9 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                      Cấp Tổ Chức: <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newCompLevel}
                      onChange={(e) => setNewCompLevel(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-xs text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                    >
                      {COMPETITION_LEVELS.map((lv) => (
                        <option key={lv} value={lv} className="dark:bg-slate-900">
                          {lv}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isSubmittingNewComp}
                    className="font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4 mr-1.5" /> Thêm Cuộc Thi / Kì Thi
                  </Button>
                </div>
              </form>
            </div>

            {/* KHỐI 2: DANH SÁCH CUỘC THI HIỆN CÓ */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Danh Sách Các Cuộc Thi / Kì Thi Hiện Có ({competitions.length}):
                </h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Đồng bộ trực tiếp vào hộp chọn của Giáo viên
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 font-bold">
                      <th className="p-2.5 text-center w-12">STT</th>
                      <th className="p-2.5">Tên Cuộc Thi / Kì Thi</th>
                      <th className="p-2.5 text-center w-36">Cấp Tổ Chức</th>
                      <th className="p-2.5 text-right w-24">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {competitions.length > 0 ? (
                      competitions.map((comp, idx) => (
                        <tr
                          key={comp.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="p-2.5 text-center text-slate-400 font-semibold">{idx + 1}</td>
                          <td className="p-2.5 font-extrabold text-slate-900 dark:text-white">
                            {comp.name}
                          </td>
                          <td className="p-2.5 text-center">
                            {renderLevelBadge(comp.level)}
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEditCompetition(comp)}
                                className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/60 text-sky-600 dark:text-sky-400 transition-all cursor-pointer"
                                title="Sửa cuộc thi / kì thi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmCompItem(comp)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                                title="Xóa cuộc thi / kì thi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                          Chưa có cuộc thi / kì thi nào trong danh mục.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCompetitionModalOpen(false)}
                className="font-bold text-xs rounded-xl"
              >
                Đóng Lại
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CON: CHỈNH SỬA CUỘC THI / KÌ THI (DÀNH RIÊNG CHO TỔ TRƯỞNG)         */}
      {/* ========================================================================= */}
      {isLeader && editingCompItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-600" /> Sửa Thông Tin Cuộc Thi / Kì Thi
              </h3>
              <button
                onClick={() => setEditingCompItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCompetition} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tên Cuộc Thi / Kì Thi: <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={editCompName}
                  onChange={(e) => setEditCompName(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 font-semibold text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Cấp Tổ Chức: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editCompLevel}
                  onChange={(e) => setEditCompLevel(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-xs text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                >
                  {COMPETITION_LEVELS.map((lv) => (
                    <option key={lv} value={lv} className="dark:bg-slate-900">
                      {lv}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingCompItem(null)}
                  className="rounded-xl font-bold"
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmittingEditComp}
                  className="rounded-xl font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
                >
                  <Check className="w-4 h-4 mr-1.5" /> Lưu Thay Đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CON: XÁC NHẬN XÓA CUỘC THI / KÌ THI (DÀNH RIÊNG CHO TỔ TRƯỞNG)      */}
      {/* ========================================================================= */}
      {isLeader && deleteConfirmCompItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Xác Nhận Xóa Cuộc Thi / Kì Thi?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Thầy có chắc chắn muốn xóa cuộc thi{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  &ldquo;{deleteConfirmCompItem.name}&rdquo;
                </strong>{" "}
                khỏi danh mục?
              </p>
              <div className="mt-3 p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-700 dark:text-rose-300 font-semibold text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>
                  Lưu ý: Các bản ghi thành tích thuộc cuộc thi này cũng sẽ được xóa đồng bộ khỏi bảng.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmCompItem(null)}
                className="rounded-xl font-bold"
              >
                Hủy Bỏ
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={isDeletingComp}
                onClick={handleDeleteCompetition}
                className="rounded-xl font-bold"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Xác Nhận Xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

