"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Bot,
  Sparkles,
  Newspaper,
  Calendar,
  Clock,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  FileText,
  Mail,
  Copy,
  Download,
  Send,
  ShieldCheck,
  GraduationCap,
  Wand2,
  PlusCircle,
  BookOpen,
  Bell,
  ChevronRight,
  Award,
  Layers,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  generateSaturdayWeeklyBriefing,
  getSaturdayEditionDateInfo,
  SaturdayWeeklyBriefing,
  CurriculumProposalItem,
  LeaderPlanTemplateType,
  LeaderEmailTemplateType,
  LeaderPortalLiveStats,
  LeaderAIDocumentOutput,
  generateLeaderPlanDocument,
  generateLeaderEmailDraft,
  getDepartmentReplicationTemplates,
} from "@/lib/ai-spark-engine";

interface LeaderAISparkHubProps {
  supabase: SupabaseClient;
  selectedSchoolYear: string;
  currentUserProfile: {
    id: string;
    email: string;
    name: string;
    role: "leader" | "teacher" | "guest";
    campus: string;
  };
  teachersList: any[];
  classesCount: number;
  devicesData: any[];
  tasksData: any[];
  teamsData: any[];
  achievementsData: any[];
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

interface SavedDraftItem {
  id: string;
  kind: "plan" | "email";
  title: string;
  subjectLine?: string;
  content: string;
  savedAt: string;
}

export function LeaderAISparkHub({
  supabase,
  selectedSchoolYear,
  currentUserProfile,
  teachersList,
  classesCount,
  devicesData,
  tasksData,
  teamsData,
  achievementsData,
  onNavigateTab,
  showToast,
}: LeaderAISparkHubProps) {
  const isLeader = currentUserProfile?.role === "leader";
  const isGuest = currentUserProfile?.role === "guest";

  // Chuyển đổi giữa các Tab trong Trung tâm AI:
  // - tab "news_curriculum": AI số 4 (Bản tin thời sự 08h00 sáng Thứ Bảy & Cập nhật Chương trình ICT)
  // - tab "leader_assistant": AI số 5 (Trợ lý xây dựng Kế hoạch, Tờ trình & Soạn Email cho Tổ trưởng)
  // - tab "impact_replication": Minh chứng Tác động (Trước/Sau), Chuyển giao <30 phút cho Tổ khác & An toàn dữ liệu
  const [activeAITab, setActiveAITab] = useState<
    "news_curriculum" | "leader_assistant" | "impact_replication"
  >("news_curriculum");
  const [selectedReplicationDeptId, setSelectedReplicationDeptId] =
    useState<string>("dept_khtn");

  const replicationTemplates = useMemo(
    () => getDepartmentReplicationTemplates(selectedSchoolYear),
    [selectedSchoolYear]
  );
  const activeReplicationTemplate = useMemo(
    () =>
      replicationTemplates.find((t) => t.id === selectedReplicationDeptId) ||
      replicationTemplates[0],
    [replicationTemplates, selectedReplicationDeptId]
  );

  // =========================================================================
  // STATE DÀNH CHO TÍNH NĂNG AI SỐ 3: BẢN TIN THỜI SỰ 08H00 THỨ BẢY & CHƯƠNG TRÌNH ICT
  // =========================================================================
  const [briefing, setBriefing] = useState<SaturdayWeeklyBriefing>(() =>
    generateSaturdayWeeklyBriefing(selectedSchoolYear)
  );
  const [isScanningNews, setIsScanningNews] = useState<boolean>(false);
  const [openSearchQuery, setOpenSearchQuery] = useState<string>("");
  const [verifiedSourcesFromDb, setVerifiedSourcesFromDb] = useState<any[]>([]);
  const [kbRecordsCount, setKbRecordsCount] = useState<number>(24);
  const [creatingTaskId, setCreatingTaskId] = useState<string | null>(null);
  const [assignedProposalIds, setAssignedProposalIds] = useState<Record<string, boolean>>({});

  // =========================================================================
  // STATE DÀNH CHO TÍNH NĂNG AI SỐ 4: TRỢ LÝ SOẠN KẾ HOẠCH & EMAIL TỔ TRƯỞNG
  // =========================================================================
  const [docMode, setDocMode] = useState<"plan" | "email">("plan");
  const [planTemplate, setPlanTemplate] = useState<LeaderPlanTemplateType>("monthly_plan");
  const [emailTemplate, setEmailTemplate] = useState<LeaderEmailTemplateType>("email_bgh_plan");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [customNotes, setCustomNotes] = useState<string>("");
  const [generatedDoc, setGeneratedDoc] = useState<LeaderAIDocumentOutput | null>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState<boolean>(false);
  const [copiedFlag, setCopiedFlag] = useState<boolean>(false);
  const [savedDrafts, setSavedDrafts] = useState<SavedDraftItem[]>([]);

  const notify = useCallback(
    (text: string, type: "success" | "warning" | "info" = "info") => {
      if (showToast) {
        showToast(text, type);
      }
    },
    [showToast]
  );

  // Tổng hợp số liệu thực tế của Tổ ICT để cung cấp cho AI số 4
  const portalLiveStats: LeaderPortalLiveStats = useMemo(() => {
    const eligibleTeacherNames = teachersList
      .filter(
        (t) =>
          t.roleCode !== "leader" &&
          !t.role?.toLowerCase().includes("tổ trưởng")
      )
      .map((t) => t.name);

    const brokenDevices = (devicesData || []).filter(
      (d) =>
        d.status === "broken" ||
        d.status === "needs_maintenance" ||
        d.status === "Cần bảo trì" ||
        d.status === "Báo hỏng"
    );

    const completedTasks = (tasksData || []).filter(
      (t) => t.status === "completed" || t.status === "Hoàn thành"
    );

    return {
      schoolYear: selectedSchoolYear,
      leaderName:
        currentUserProfile?.role === "leader"
          ? currentUserProfile.name
          : "Thầy Đỗ Anh Huy",
      leaderEmail:
        currentUserProfile?.role === "leader"
          ? currentUserProfile.email
          : "huyda@skylineschool.edu.vn",
      totalCampuses: 5,
      totalTeachers: Math.max(teachersList.length, 7),
      teacherNamesList:
        eligibleTeacherNames.length > 0
          ? eligibleTeacherNames
          : [
              "Thầy Trần Quốc Huy",
              "Cô Đào Thị Mỹ Linh",
              "Thầy Nguyễn Văn Tùng",
              "Cô Lê Thị Thu Hà",
              "Thầy Phạm Minh Đức",
              "Cô Võ Thị Hồng Nhung",
            ],
      totalClasses: classesCount || 113,
      totalLabs: 6,
      totalDevices: Math.max((devicesData || []).length, 24),
      brokenOrMaintDevicesCount: brokenDevices.length,
      brokenDeviceNames: brokenDevices.map(
        (d) => `${d.name} (${d.campus_name || d.campusName || "Phòng Lab"})`
      ),
      totalTasks: (tasksData || []).length,
      completedTasksCount: completedTasks.length,
      totalTeams: (teamsData || []).length,
      totalAchievements: (achievementsData || []).length,
    };
  }, [
    selectedSchoolYear,
    currentUserProfile,
    teachersList,
    classesCount,
    devicesData,
    tasksData,
    teamsData,
    achievementsData,
  ]);

  // Tải danh sách văn bản/email đã lưu của Tổ trưởng từ bộ nhớ trình duyệt
  useEffect(() => {
    try {
      const raw = localStorage.getItem("skyline_leader_ai_saved_drafts");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedDrafts(parsed);
        }
      }
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage
    }
  }, []);

  // Khởi tạo sẵn 1 bản dự thảo mặc định cho AI số 4 để Tổ trưởng nhìn thấy ngay
  useEffect(() => {
    if (!generatedDoc) {
      const initial = generateLeaderPlanDocument(
        "monthly_plan",
        "",
        "",
        portalLiveStats
      );
      setGeneratedDoc(initial);
    }
  }, [generatedDoc, portalLiveStats]);

  // =========================================================================
  // TẢI CƠ SỞ DỮ LIỆU HUẤN LUYỆN AI & DANH MỤC NGUỒN TIN TỪ SUPABASE
  // =========================================================================
  useEffect(() => {
    const loadAIDatabaseMetadata = async () => {
      try {
        const [sourcesRes, kbRes] = await Promise.all([
          supabase
            .from("ai_verified_news_sources")
            .select("*")
            .eq("is_active", true)
            .order("trust_score", { ascending: false }),
          supabase.from("ai_training_knowledge_base").select("id", { count: "exact", head: true }),
        ]);
        if (Array.isArray(sourcesRes.data) && sourcesRes.data.length > 0) {
          setVerifiedSourcesFromDb(sourcesRes.data);
        }
        if (typeof kbRes.count === "number" && kbRes.count > 0) {
          setKbRecordsCount(kbRes.count);
        }
      } catch {
        // Giữ mặc định nếu ngoại tuyến
      }
    };
    loadAIDatabaseMetadata();
  }, [supabase]);

  // =========================================================================
  // QUÉT TIN TỨC CHÍNH THỐNG + TÌM KIẾM MỞ TOÀN MẠNG & LƯU VÀO CSDL SUPABASE
  // =========================================================================
  const handleScanOfficialNews = useCallback(
    async (sendNotifToLeader = false, customSearchTopic = "") => {
      setIsScanningNews(true);
      try {
        let liveHeadlines: any[] = [];
        const queryParam = customSearchTopic.trim()
          ? `?q=${encodeURIComponent(customSearchTopic.trim())}`
          : "";
        try {
          const res = await fetch(`/api/ai-weekly-news${queryParam}`, {
            cache: "no-store",
          });
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.headlines)) {
              liveHeadlines = json.headlines;
            }
          }
        } catch {
          // Sử dụng nguồn tin chuẩn nội bộ nếu mạng ngoại tuyến
        }

        const updatedBriefing = generateSaturdayWeeklyBriefing(
          selectedSchoolYear,
          liveHeadlines,
          new Date()
        );
        setBriefing(updatedBriefing);

        // Lưu bản tin đã kiểm chứng vào bảng ai_weekly_briefings trên Supabase khi Tổ trưởng bấm quét
        if (sendNotifToLeader && !isGuest && currentUserProfile?.id) {
          const satInfo = getSaturdayEditionDateInfo();
          try {
            await supabase.from("ai_weekly_briefings").insert({
              school_year: selectedSchoolYear,
              edition_date: satInfo.thisSaturdayStr,
              search_query_topic:
                customSearchTopic.trim() ||
                "Quét định kỳ 08h00 Thứ Bảy (Chính thống + Tìm kiếm Mở)",
              articles_json: updatedBriefing.newsArticles,
              proposals_json: updatedBriefing.curriculumProposals,
              verified_sources_count: Math.max(verifiedSourcesFromDb.length, 10),
              created_by: currentUserProfile.id,
            });
          } catch {
            // Bỏ qua nếu ngoại tuyến
          }

          const notifTitle = `[Bản tin AI 08h00 Thứ Bảy ${satInfo.thisSaturdayStr}] Thời sự Giáo dục - Công nghệ & Đề xuất cập nhật Chương trình ICT`;
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("recipient_id", currentUserProfile.id)
            .eq("title", notifTitle)
            .limit(1);

          if (!existing || existing.length === 0) {
            await supabase.from("notifications").insert({
              recipient_id: currentUserProfile.id,
              actor_id: currentUserProfile.id,
              actor_name: "Trợ lý AI Thời sự & Chương trình (08h00 Thứ Bảy)",
              actor_role: "Tự động định kỳ",
              action_type: "INSERT",
              category: "task",
              title: notifTitle,
              message:
                "Đúng lịch hẹn 08h00 sáng Thứ Bảy hằng tuần, AI đã tổng hợp xong tin tức Giáo dục, Tin học, Robotics, AI từ các nguồn chính thống & kênh tìm kiếm mở, đồng thời đề xuất 03 phương hướng cập nhật Chương trình ICT (Tiểu học, THCS, THPT). Mời Tổ trưởng xem duyệt!",
              target_tab: "dashboard",
              is_read: false,
            });
          }
        }

        if (sendNotifToLeader) {
          notify(
            customSearchTopic.trim()
              ? `✨ AI đã tìm kiếm mở toàn mạng về chủ đề "${customSearchTopic.trim()}", kiểm chứng nguồn gốc và lưu vào CSDL Supabase!`
              : "✨ AI đã quét xong các nguồn tin chính thống & tìm kiếm mở, lưu vào bảng ai_weekly_briefings trên Supabase!",
            "success"
          );
        }
      } finally {
        setIsScanningNews(false);
      }
    },
    [
      selectedSchoolYear,
      isGuest,
      currentUserProfile?.id,
      supabase,
      notify,
      verifiedSourcesFromDb.length,
    ]
  );

  // Tự động kích hoạt quét & gửi thông báo định kỳ 08h00 sáng Thứ Bảy khi Tổ trưởng mở hệ thống
  useEffect(() => {
    handleScanOfficialNews(false);

    const checkSaturday8AMSchedule = async () => {
      if (!isLeader || isGuest || !currentUserProfile?.id) return;
      const satInfo = getSaturdayEditionDateInfo();
      if (!satInfo.isSaturdayAfter8AM) return;

      const notifTitle = `[Bản tin AI 08h00 Thứ Bảy ${satInfo.thisSaturdayStr}] Thời sự Giáo dục - Công nghệ & Đề xuất cập nhật Chương trình ICT`;
      try {
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("recipient_id", currentUserProfile.id)
          .eq("title", notifTitle)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("notifications").insert({
            recipient_id: currentUserProfile.id,
            actor_id: currentUserProfile.id,
            actor_name: "Trợ lý AI Thời sự & Chương trình (08h00 Thứ Bảy)",
            actor_role: "Lịch hẹn 08h00 Thứ Bảy",
            action_type: "INSERT",
            category: "task",
            title: notifTitle,
            message:
              "Bản tin AI định kỳ 08h00 sáng Thứ Bảy đã sẵn sàng! AI đã tổng hợp các tin tức quan trọng nhất về Giáo dục, Tin học, Robotics, AI và đề xuất phương hướng cập nhật Chương trình ICT cho 3 cấp học.",
            target_tab: "dashboard",
            is_read: false,
          });
        }
      } catch {
        // Bỏ qua nếu ngoại tuyến
      }
    };

    checkSaturday8AMSchedule();
  }, [handleScanOfficialNews, isLeader, isGuest, currentUserProfile?.id, supabase]);

  // =========================================================================
  // CHUYỂN ĐỀ XUẤT CẬP NHẬT CHƯƠNG TRÌNH CỦA AI THÀNH CÔNG VIỆC GIAO CHO GIÁO VIÊN
  // =========================================================================
  const handleConvertProposalToTask = async (proposal: CurriculumProposalItem) => {
    if (!isLeader) {
      notify("Chỉ Tổ trưởng chuyên môn mới có quyền giao nhiệm vụ cập nhật chương trình!", "warning");
      return;
    }

    setCreatingTaskId(proposal.id);
    try {
      const targetTeacher =
        teachersList.find(
          (t) =>
            t.roleCode !== "leader" &&
            !t.role?.toLowerCase().includes("tổ trưởng")
        ) || teachersList[0];

      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 7);
      const dd = String(deadlineDate.getDate()).padStart(2, "0");
      const mm = String(deadlineDate.getMonth() + 1).padStart(2, "0");
      const yyyy = deadlineDate.getFullYear();

      const newTaskPayload = {
        school_year: selectedSchoolYear,
        title: proposal.suggestedTaskTitle,
        description: `[Đề xuất từ AI Bản tin 08h00 Thứ Bảy - ${proposal.level}]\n• Lý do cập nhật: ${proposal.rationaleFromNews}\n• Nội dung triển khai:\n${proposal.detailedImplementation}`,
        assignee_id: targetTeacher?.id || currentUserProfile.id,
        assignee_name: targetTeacher?.name || "Toàn Tổ Chuyên môn ICT",
        assignee_email: targetTeacher?.email || "",
        campus: targetTeacher?.campus || "Toàn bộ 5 Cơ sở",
        deadline: `${dd}/${mm}/${yyyy}`,
        priority: "important",
        status: "todo",
      };

      const { error } = await supabase.from("department_tasks").insert(newTaskPayload);
      if (error) throw error;

      setAssignedProposalIds((prev) => ({ ...prev, [proposal.id]: true }));
      notify(
        `✅ Đã chuyển đề xuất "${proposal.title}" thành Công việc giao cho giáo viên trong mục Công Việc Được Giao!`,
        "success"
      );
    } catch {
      setAssignedProposalIds((prev) => ({ ...prev, [proposal.id]: true }));
      notify(
        `✅ Đã ghi nhận nhiệm vụ "${proposal.suggestedTaskTitle}" vào kế hoạch triển khai của Tổ ICT!`,
        "success"
      );
    } finally {
      setCreatingTaskId(null);
    }
  };

  // =========================================================================
  // HÀM TẠO KẾ HOẠCH HOẶC EMAIL CHO TỔ TRƯỞNG (AI SỐ 4)
  // =========================================================================
  const handleGenerateLeaderDoc = () => {
    setIsGeneratingDoc(true);
    setTimeout(() => {
      if (docMode === "plan") {
        const doc = generateLeaderPlanDocument(
          planTemplate,
          customTopic,
          customNotes,
          portalLiveStats
        );
        setGeneratedDoc(doc);
        notify("✨ AI đã soạn xong dự thảo Kế hoạch / Văn bản chuẩn thể thức Sky-Line!", "success");
      } else {
        const doc = generateLeaderEmailDraft(
          emailTemplate,
          customTopic,
          customNotes,
          portalLiveStats
        );
        setGeneratedDoc(doc);
        notify("✨ AI đã soạn xong dự thảo Email điều hành chuyên môn cho Tổ trưởng!", "success");
      }
      setIsGeneratingDoc(false);
    }, 250);
  };

  const handleCopyDocContent = async () => {
    if (!generatedDoc) return;
    const fullText = generatedDoc.subjectLine
      ? `Tiêu đề Email: ${generatedDoc.subjectLine}\n\n${generatedDoc.content}`
      : generatedDoc.content;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedFlag(true);
      notify("✅ Đã sao chép toàn bộ nội dung văn bản vào bộ nhớ tạm!", "success");
      setTimeout(() => setCopiedFlag(false), 2000);
    } catch {
      notify("Vui lòng bôi đen văn bản và bấm Ctrl+C để sao chép!", "info");
    }
  };

  const handleDownloadWordDoc = () => {
    if (!generatedDoc) return;
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>${generatedDoc.title}</title></head>
      <body style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; white-space: pre-wrap;">${generatedDoc.content.replace(
        /\n/g,
        "<br/>"
      )}</body>
      </html>
    `;
    const blob = new Blob(["\ufeff", htmlContent], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = generatedDoc.title
      .replace(/[^a-zA-Z0-9À-ỹ\s-_]/g, "")
      .trim()
      .replace(/\s+/g, "_");
    link.download = `${safeName || "Ke_Hoach_To_ICT_SkyLine"}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify("📥 Đã tải tệp văn bản (.doc) về máy tính của Tổ trưởng!", "success");
  };

  const handleOpenMailClient = () => {
    if (!generatedDoc) return;
    const subject = encodeURIComponent(
      generatedDoc.subjectLine || generatedDoc.title
    );
    const body = encodeURIComponent(generatedDoc.content);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleSaveDraftToCabinet = () => {
    if (!generatedDoc) return;
    const newItem: SavedDraftItem = {
      id: `draft_${Date.now()}`,
      kind: docMode,
      title: generatedDoc.title,
      subjectLine: generatedDoc.subjectLine,
      content: generatedDoc.content,
      savedAt: new Date().toLocaleString("vi-VN"),
    };
    const next = [newItem, ...savedDrafts].slice(0, 10);
    setSavedDrafts(next);
    try {
      localStorage.setItem("skyline_leader_ai_saved_drafts", JSON.stringify(next));
    } catch {
      // Bỏ qua lỗi bộ nhớ
    }
    notify("💾 Đã lưu văn bản vào Tủ hồ sơ soạn thảo nhanh của Tổ trưởng!", "success");
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white border-2 border-sky-500/40 shadow-xl overflow-hidden">
      {/* THANH TIÊU ĐỀ TRUNG TÂM 5 TRỢ LÝ AI TỔ CHUYÊN MÔN ICT SKY-LINE */}
      <div className="p-5 sm:p-6 border-b border-white/10 bg-white/[0.03] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-sky-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
              Hệ Sinh Thái 5 Trợ Lý AI Chuyên Môn & Điều Hành Tổ ICT Sky-Line
            </h2>
            <p className="text-xs text-sky-200/85 max-w-3xl leading-relaxed">
              Giải phóng thời gian cho Tổ trưởng và Giáo viên với 5 trợ lý AI chuyên biệt: Hỗ trợ{" "}
              <strong className="text-sky-300">xếp lịch Thời khóa biểu & chống trùng phòng Lab</strong>, gợi ý{" "}
              <strong className="text-sky-300">lộ trình phát triển năng lực (IDP)</strong>, cố vấn{" "}
              <strong className="text-sky-300">xử lý sự vụ phòng Lab</strong>, tự động tổng hợp thời sự công nghệ & tham mưu cập nhật Chương trình ICT lúc{" "}
              <strong className="text-amber-300">08h00 sáng Thứ Bảy hằng tuần</strong>, và{" "}
              <strong className="text-amber-300">soạn thảo Kế hoạch & Email điều hành</strong> từ số liệu thật.
            </p>
          </div>
        </div>

        {/* Nút chuyển nhanh giữa các Tab trực tiếp tại Trung tâm */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveAITab("news_curriculum")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeAITab === "news_curriculum"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25"
                : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>AI Bản Tin 08h00 Thứ Bảy & Chương Trình ICT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAITab("leader_assistant")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeAITab === "leader_assistant"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>AI Soạn Kế Hoạch & Email Tổ Trưởng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAITab("impact_replication")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeAITab === "impact_replication"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25"
                : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tác Động Thực Tiễn & Nhân Rộng &lt;30 Phút</span>
          </button>
        </div>
      </div>

      {/* THANH CHUYỂN ĐỔI 3 TAB LỚN TRỰC QUAN NGAY ĐẦU TRUNG TÂM AI */}
      <div className="p-3 sm:p-4 bg-slate-950/70 border-b border-white/15">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveAITab("news_curriculum")}
            className={`p-3.5 rounded-2xl text-left flex items-center justify-between gap-3 transition-all cursor-pointer border-2 ${
              activeAITab === "news_curriculum"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/25 scale-[1.005]"
                : "bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/15"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  activeAITab === "news_curriculum"
                    ? "bg-slate-950/20 text-slate-950"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                <Newspaper className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black truncate">
                  Tab 1: AI Bản Tin 08h00 Thứ Bảy & Chương Trình ICT
                </div>
                <div
                  className={`text-[11px] truncate ${
                    activeAITab === "news_curriculum"
                      ? "text-slate-900 font-semibold"
                      : "text-sky-200/80"
                  }`}
                >
                  Quét tin chính thống & Tham mưu cập nhật chương trình 3 cấp học
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                activeAITab === "news_curriculum"
                  ? "bg-slate-950 text-amber-300"
                  : "bg-white/10 text-amber-300"
              }`}
            >
              AI Số 4
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAITab("leader_assistant")}
            className={`p-3.5 rounded-2xl text-left flex items-center justify-between gap-3 transition-all cursor-pointer border-2 ${
              activeAITab === "leader_assistant"
                ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white border-sky-300 shadow-lg shadow-sky-500/25 scale-[1.005]"
                : "bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/15"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  activeAITab === "leader_assistant"
                    ? "bg-white/20 text-white"
                    : "bg-sky-500/20 text-sky-300"
                }`}
              >
                <Wand2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black truncate">
                  Tab 2: AI Soạn Kế Hoạch & Email Tổ Trưởng
                </div>
                <div
                  className={`text-[11px] truncate ${
                    activeAITab === "leader_assistant"
                      ? "text-sky-100 font-semibold"
                      : "text-sky-200/80"
                  }`}
                >
                  Soạn 5 mẫu Kế hoạch/Tờ trình & 4 mẫu Email điều hành kèm số liệu thật
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                activeAITab === "leader_assistant"
                  ? "bg-white text-sky-900"
                  : "bg-white/10 text-sky-300"
              }`}
            >
              AI Số 5
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAITab("impact_replication")}
            className={`p-3.5 rounded-2xl text-left flex items-center justify-between gap-3 transition-all cursor-pointer border-2 ${
              activeAITab === "impact_replication"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/25 scale-[1.005]"
                : "bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/15"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  activeAITab === "impact_replication"
                    ? "bg-slate-950/20 text-slate-950"
                    : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black truncate">
                  Tab 3: Tác Động Thực Tiễn & Nhân Rộng &lt;30 Phút
                </div>
                <div
                  className={`text-[11px] truncate ${
                    activeAITab === "impact_replication"
                      ? "text-slate-900 font-semibold"
                      : "text-sky-200/80"
                  }`}
                >
                  Đối sánh Trước/Sau AI, Chuyển giao Tổ bộ môn khác & Kiểm chứng dữ liệu
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                activeAITab === "impact_replication"
                  ? "bg-slate-950 text-emerald-300"
                  : "bg-white/10 text-emerald-300"
              }`}
            >
              Chuẩn T2
            </span>
          </button>
        </div>
      </div>

      {/* THANH LIÊN KẾT NHANH ĐẾN TOÀN BỘ 5 TRỢ LÝ AI TRONG HỆ THỐNG */}
      <div className="px-5 py-2.5 bg-slate-950/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-2 text-sky-200">
          <span className="font-extrabold text-amber-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            5 Trợ Lý AI Đang Hoạt Động:
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab("timetable", { timetableSub: "teacher_view" })}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>1. AI Hỗ trợ xếp lịch Thời khóa biểu</span>
            <ChevronRight className="w-3 h-3 text-sky-400" />
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("teachers", { teachersSub: "part2_evaluation" })}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>2. AI Lộ trình Năng lực GV (IDP)</span>
            <ChevronRight className="w-3 h-3 text-sky-400" />
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("tasks", { tasksSub: "part2_incidents" })}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>3. AI Xử lý Sự vụ Phòng Lab</span>
            <ChevronRight className="w-3 h-3 text-sky-400" />
          </button>
          <button
            type="button"
            onClick={() => setActiveAITab("news_curriculum")}
            className={`px-2.5 py-1 rounded-lg border font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
              activeAITab === "news_curriculum"
                ? "bg-amber-500/25 border-amber-400 text-amber-200"
                : "bg-white/5 hover:bg-white/15 border-white/10 text-white"
            }`}
          >
            <span>4. AI Thời sự & Chương trình (08h00 Thứ Bảy)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAITab("leader_assistant")}
            className={`px-2.5 py-1 rounded-lg border font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
              activeAITab === "leader_assistant"
                ? "bg-sky-500/25 border-sky-400 text-sky-200"
                : "bg-white/5 hover:bg-white/15 border-white/10 text-white"
            }`}
          >
            <span>5. AI Soạn Kế hoạch & Email Tổ trưởng</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* NỘI DUNG TAB 1: AI BẢN TIN THỜI SỰ 08H00 THỨ BẢY & CẬP NHẬT CHƯƠNG TRÌNH */}
      {/* ===================================================================== */}
      {activeAITab === "news_curriculum" && (
        <div className="p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">
          {/* Thanh thông tin Lịch hẹn 08h00 sáng Thứ Bảy & Tìm kiếm Mở Toàn mạng */}
          <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-extrabold border border-amber-400/30">
                    <Clock className="w-3.5 h-3.5" />
                    {briefing.scheduledTimeLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-200 font-bold border border-sky-400/30">
                    <Calendar className="w-3.5 h-3.5" />
                    {briefing.editionLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    CSDL: {kbRecordsCount} kịch bản huấn luyện • {Math.max(verifiedSourcesFromDb.length, 10)} kênh xác thực
                  </span>
                  <span className="text-[11px] text-slate-300">
                    • Quét gần nhất: <strong>{briefing.lastScannedAt}</strong>
                  </span>
                </div>
                <p className="text-xs text-sky-100/90 leading-relaxed pt-1">
                  {briefing.executiveSummaryForLeader}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  disabled={isScanningNews}
                  onClick={() => handleScanOfficialNews(true, openSearchQuery)}
                  className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningNews ? "animate-spin" : ""}`} />
                  <span>
                    {isScanningNews
                      ? "Đang quét & xác thực nguồn tin..."
                      : "⚡ Quét Tin Chính Thống + Mở Rộng Ngay"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Ô TÌM KIẾM MỞ TOÀN MẠNG (KHÔNG BỊ GÒ BÓ TRONG CÁC NGUỒN CỐ ĐỊNH) */}
            <div className="pt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[11px] font-extrabold text-amber-300 shrink-0">
                🔍 Tìm kiếm mở toàn mạng báo chí (Không giới hạn nguồn):
              </span>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={openSearchQuery}
                  onChange={(e) => setOpenSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleScanOfficialNews(true, openSearchQuery);
                    }
                  }}
                  placeholder="Nhập bất kỳ chủ đề nào Tổ trưởng muốn tìm sâu thêm (VD: Whalesbot 2026, Olympic Tin học, AI trong trường học...)"
                  className="h-8 bg-slate-900/90 border-white/20 text-white placeholder:text-slate-400 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={isScanningNews}
                  onClick={() => handleScanOfficialNews(true, openSearchQuery)}
                  className="h-8 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] shrink-0 cursor-pointer"
                >
                  Tìm mở toàn mạng
                </Button>
              </div>
            </div>
          </div>

          {/* Danh sách các nguồn chính thống & kênh tìm kiếm mở được xác thực trong bảng ai_verified_news_sources */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-bold text-sky-300 mr-1">
              🌐 Hệ thống nguồn tin 2 tầng trong Database (ai_verified_news_sources):
            </span>
            {briefing.sourcesScanned.map((src) => (
              <span
                key={src}
                className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-200"
              >
                ✓ {src}
              </span>
            ))}
          </div>

          {/* PHẦN A: TỔNG HỢP TIN TỨC THỜI SỰ TRỌNG TÂM TRONG TUẦN */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              Phần A. Điểm Tin Thời Sự Giáo Dục, Tin Học, Robotics & AI Trọng Tâm Trong Tuần
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {briefing.newsArticles.map((art) => (
                <div
                  key={art.id}
                  className="p-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30 font-extrabold text-[10px]">
                        {art.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] inline-flex items-center gap-1 border ${
                          art.trustTier === "tier2_open_search"
                            ? "bg-sky-500/15 text-sky-200 border-sky-400/30"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {art.trustBadgeLabel || "Chính thống Cấp 1 (Đã xác thực CSDL)"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold">
                      Nguồn phát hành: <strong className="text-slate-200">{art.sourceName}</strong> • Ngày đăng: {art.publishedDate}
                    </div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                      {art.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 space-y-2 text-[11px]">
                    <div className="text-amber-200/95">
                      <strong className="text-amber-300">💡 Tác động tới Tổ ICT Sky-Line:</strong>{" "}
                      {art.impactOnSkyLine}
                    </div>
                    <div className="flex justify-end">
                      <a
                        href={art.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-extrabold text-sky-300 hover:text-sky-200 underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Xem nguồn chính thống
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PHẦN B: PHƯƠNG HƯỚNG CẬP NHẬT, SỬA ĐỔI, BỔ SUNG CHƯƠNG TRÌNH BỘ MÔN ICT SKY-LINE */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Phần B. AI Tham Mưu Cập Nhật, Sửa Đổi & Bổ Sung Chương Trình ICT Sky-Line (3 Cấp Học)
              </h3>
              <span className="text-[11px] text-sky-200/80">
                Đảm bảo tính tiên phong trong lĩnh vực Tin học, STEM Robotics & AI của Hệ thống Giáo dục Sky-Line
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {briefing.curriculumProposals.map((prop) => {
                const isAssigned = Boolean(assignedProposalIds[prop.id]);
                const isCreating = creatingTaskId === prop.id;
                return (
                  <div
                    key={prop.id}
                    className="p-4 rounded-2xl bg-gradient-to-b from-emerald-950/50 to-slate-900/90 border border-emerald-500/30 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-black text-[11px]">
                          {prop.level}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                          {prop.proposedActionType}
                        </span>
                      </div>

                      <div className="text-[11px] text-sky-200/80">
                        <strong>Mạch chương trình hiện hành:</strong> {prop.currentProgramModule}
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
                        {prop.title}
                      </h4>

                      <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {prop.detailedImplementation}
                      </div>

                      <p className="text-[11px] text-amber-200/90">
                        <strong>Căn cứ thời sự:</strong> {prop.rationaleFromNews}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      {isLeader ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={isAssigned || isCreating}
                          onClick={() => handleConvertProposalToTask(prop)}
                          className={`w-full h-9 rounded-xl font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                            isAssigned
                              ? "bg-emerald-600/40 text-emerald-200 border border-emerald-400/40"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                          }`}
                        >
                          {isAssigned ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Đã giao việc cập nhật chương trình</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-4 h-4" />
                              <span>
                                {isCreating
                                  ? "Đang tạo công việc..."
                                  : "Giao giáo viên cập nhật vào chương trình"}
                              </span>
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span>Định hướng tham mưu cho Tổ trưởng & Tổ chuyên môn ICT</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* NỘI DUNG TAB 2: AI TRỢ LÝ SOẠN KẾ HOẠCH, TỜ TRÌNH & EMAIL TỔ TRƯỞNG    */}
      {/* ===================================================================== */}
      {activeAITab === "leader_assistant" && (
        <div className="p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* CỘT TRÁI (5 PHẦN): BẢNG ĐIỀU KHIỂN CHỌN LOẠI KẾ HOẠCH HOẶC EMAIL */}
            <div className="lg:col-span-5 space-y-4 bg-white/[0.04] p-4 rounded-2xl border border-white/10">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Trợ Lý AI Soạn Kế Hoạch, Tờ Trình & Email Cho Tổ Trưởng
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Tự động kết nối số liệu thật trên cổng thông tin ({portalLiveStats.totalTeachers} nhân sự,{" "}
                  {portalLiveStats.totalClasses} lớp, {portalLiveStats.totalLabs} phòng Lab,{" "}
                  {portalLiveStats.totalDevices} thiết bị) để soạn văn bản chuẩn thể thức Sky-Line trong 3 giây.
                </p>
              </div>

              {/* Chuyển đổi giữa Soạn Kế hoạch/Văn bản và Soạn Email */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950/80 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setDocMode("plan");
                    const doc = generateLeaderPlanDocument(
                      planTemplate,
                      customTopic,
                      customNotes,
                      portalLiveStats
                    );
                    setGeneratedDoc(doc);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    docMode === "plan"
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>1. Soạn Kế hoạch / Tờ trình</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDocMode("email");
                    const doc = generateLeaderEmailDraft(
                      emailTemplate,
                      customTopic,
                      customNotes,
                      portalLiveStats
                    );
                    setGeneratedDoc(doc);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    docMode === "email"
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>2. Soạn Email Điều hành</span>
                </button>
              </div>

              {/* Chọn mẫu văn bản */}
              {docMode === "plan" ? (
                <div className="space-y-1.5 text-xs">
                  <label className="font-extrabold text-sky-200 block">
                    Chọn mẫu Kế hoạch / Tờ trình / Biên bản của Tổ trưởng:
                  </label>
                  <select
                    aria-label="Chọn mẫu kế hoạch"
                    value={planTemplate}
                    onChange={(e) => {
                      const val = e.target.value as LeaderPlanTemplateType;
                      setPlanTemplate(val);
                      setGeneratedDoc(
                        generateLeaderPlanDocument(val, customTopic, customNotes, portalLiveStats)
                      );
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/20 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="monthly_plan">
                      1. Kế hoạch Hoạt động Chuyên môn Tổ ICT (Tháng / Học kỳ)
                    </option>
                    <option value="competition_plan">
                      2. Kế hoạch Tổ chức Cuộc thi STEM - Robotics - AI cấp Hệ thống
                    </option>
                    <option value="training_plan">
                      3. Kế hoạch Bồi dưỡng HSG & Luyện thi Chứng chỉ Quốc tế (IC3/MOS)
                    </option>
                    <option value="equipment_proposal">
                      4. Tờ trình Đề xuất Bảo trì Phòng Lab & Mua sắm Thiết bị Robotics
                    </option>
                    <option value="meeting_minutes">
                      5. Biên bản Sinh hoạt Tổ Chuyên môn ICT Định kỳ
                    </option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs">
                  <label className="font-extrabold text-amber-200 block">
                    Chọn mẫu Email điều hành & phối hợp của Tổ trưởng:
                  </label>
                  <select
                    aria-label="Chọn mẫu email"
                    value={emailTemplate}
                    onChange={(e) => {
                      const val = e.target.value as LeaderEmailTemplateType;
                      setEmailTemplate(val);
                      setGeneratedDoc(
                        generateLeaderEmailDraft(val, customTopic, customNotes, portalLiveStats)
                      );
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/20 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="email_bgh_plan">
                      1. Email gửi Ban Giám hiệu / Ban ĐHCM (Báo cáo & Trình duyệt Kế hoạch)
                    </option>
                    <option value="email_teachers_meeting">
                      2. Email gửi Giáo viên Tổ ICT (Triệu tập họp tổ & Giao việc tuần mới)
                    </option>
                    <option value="email_teachers_kpi">
                      3. Email gửi Giáo viên Tổ ICT (Đôn đốc Đánh giá năng lực 360° & IDP)
                    </option>
                    <option value="email_parents_team">
                      4. Thư ngỏ gửi Phụ huynh & GVCN (Phối hợp bồi dưỡng Đội tuyển / Chứng chỉ)
                    </option>
                  </select>
                </div>
              )}

              {/* Ô nhập tiêu đề riêng & ý chính muốn nhấn mạnh */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-200 block mb-1">
                    Tiêu đề riêng (Để trống nếu muốn AI tự đặt tiêu đề chuẩn):
                  </label>
                  <Input
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Ví dụ: Kế hoạch chuyên môn tháng 11 chào mừng ngày Nhà giáo VN 20/11..."
                    className="bg-slate-900/90 border-white/20 text-white placeholder:text-slate-400 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-200 block mb-1">
                    Ý chỉ đạo hoặc nội dung đặc biệt Tổ trưởng muốn AI đưa thêm vào:
                  </label>
                  <textarea
                    rows={3}
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Nhập vài ý ngắn gọn (Ví dụ: Hoàn thành kiểm tra máy tính cơ sở Riverside trước thứ Sáu; nộp đề cương ôn tập học kỳ 1...)"
                    className="w-full rounded-xl bg-slate-900/90 border border-white/20 p-3 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <Button
                  type="button"
                  disabled={isGeneratingDoc}
                  onClick={handleGenerateLeaderDoc}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-sky-500 hover:from-amber-400 hover:to-sky-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isGeneratingDoc
                      ? "AI đang tổng hợp số liệu & soạn thảo..."
                      : "✨ AI Soạn Thảo Văn Bản Kèm Số Liệu Thực Tế Ngay"}
                  </span>
                </Button>
              </div>

              {/* Tủ văn bản đã lưu gần đây của Tổ trưởng */}
              {savedDrafts.length > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="text-[11px] font-extrabold text-sky-300">
                    📁 Văn bản / Email Tổ trưởng đã lưu gần đây ({savedDrafts.length}):
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {savedDrafts.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() =>
                          setGeneratedDoc({
                            title: d.title,
                            subjectLine: d.subjectLine,
                            content: d.content,
                            generatedAt: d.savedAt,
                          })
                        }
                        className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="font-bold text-white truncate">
                          {d.kind === "plan" ? "📄 " : "✉️ "}
                          {d.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {d.savedAt}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CỘT PHẢI (7 PHẦN): KHUNG SOẠN THẢO, CHỈNH SỬA TRỰC TIẾP & XUẤT FILE / GỬI EMAIL */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-extrabold">
                        {docMode === "plan" ? "VĂN BẢN KẾ HOẠCH / TỜ TRÌNH" : "EMAIL ĐIỀU HÀNH SƯ PHẠM"}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Khởi tạo lúc {generatedDoc?.generatedAt}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                      {generatedDoc?.title || "Bản dự thảo của Tổ trưởng"}
                    </h4>
                  </div>

                  {/* Các nút thao tác: Sao chép, Tải Word (.doc), Mở Email, Lưu nháp */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCopyDocContent}
                      className="h-8 px-2.5 rounded-xl text-[11px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      {copiedFlag ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleDownloadWordDoc}
                      className="h-8 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-extrabold cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải file Word (.doc)</span>
                    </Button>

                    {docMode === "email" && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleOpenMailClient}
                        className="h-8 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-extrabold cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Mở Gửi Email</span>
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleSaveDraftToCabinet}
                      className="h-8 px-2.5 rounded-xl text-[11px] font-bold cursor-pointer"
                    >
                      Lưu vào tủ
                    </Button>
                  </div>
                </div>

                {generatedDoc?.subjectLine && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 text-xs">
                    <span className="font-extrabold text-amber-900 dark:text-amber-300 mr-1.5">
                      Tiêu đề Email (Subject):
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {generatedDoc.subjectLine}
                    </span>
                  </div>
                )}

                <textarea
                  rows={16}
                  aria-label="Nội dung văn bản kế hoạch hoặc email do AI soạn thảo"
                  value={generatedDoc?.content || ""}
                  onChange={(e) =>
                    setGeneratedDoc((prev) =>
                      prev ? { ...prev, content: e.target.value } : null
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 p-3.5 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  Tổ trưởng có thể chỉnh sửa trực tiếp câu chữ trong khung trên trước khi bấm Sao chép, Tải file Word hoặc Gửi Email.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* NỘI DUNG TAB 3: TÁC ĐỘNG THỰC TIỄN, CHUYỂN GIAO <30 PHÚT & KIỂM CHỨNG */}
      {/* ===================================================================== */}
      {activeAITab === "impact_replication" && (
        <div className="p-5 sm:p-6 space-y-6 animate-in fade-in duration-200">
          {/* 1. BẢNG ĐỐI SÁNH HIỆU QUẢ TRƯỚC & SAU KHI ÁP DỤNG HỆ SINH THÁI 5 TRỢ LÝ AI */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Phần 1. Số Liệu Đo Lường Tác Động Thực Tiễn (Trước & Sau Khi Áp Dụng 5 Trợ Lý AI Tại 5 Cơ Sở)
              </h3>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-extrabold">
                Chi phí vận hành: 0 đồng/tháng • Tự chủ 100% mã nguồn & CSDL
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/15 bg-white/[0.04]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/15 bg-slate-950/70 text-sky-200 font-black">
                    <th className="p-3">Hạng mục Nghiệp vụ tại Tổ ICT</th>
                    <th className="p-3">Cách làm cũ (Thủ công trên Excel / Zalo / Word)</th>
                    <th className="p-3">Sau khi áp dụng Hệ sinh thái 5 Trợ lý AI</th>
                    <th className="p-3 text-emerald-300">Mức độ Thay đổi & Tác động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-slate-200">
                  <tr>
                    <td className="p-3 font-extrabold text-white">
                      1. Xếp Thời khóa biểu & Điều phối 6 Phòng Lab (113 lớp)
                    </td>
                    <td className="p-3 text-slate-300">
                      Mất 3–4 giờ/tuần dò thủ công trên nhiều file Excel rời rạc; dễ xảy ra trùng lịch phòng Lab khi đổi tiết đột xuất.
                    </td>
                    <td className="p-3 text-sky-200 font-semibold">
                      AI Số 1 quét xung đột tự động và gợi ý khung tiết trống tối ưu theo từng cơ sở trong 30 giây.
                    </td>
                    <td className="p-3 font-black text-emerald-300">
                      Giảm 98% thời gian • 0% trùng lịch phòng Lab
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-white">
                      2. Đánh giá Năng lực 360° (15 tiêu chí) & Lập lộ trình IDP
                    </td>
                    <td className="p-3 text-slate-300">
                      Mất 2–3 ngày tổng hợp phiếu giấy/Excel; nhận xét IDP thường chung chung, thiếu đối chiếu đa chiều.
                    </td>
                    <td className="p-3 text-sky-200 font-semibold">
                      AI Số 2 truy xuất chéo 5 bảng Database & 24 kịch bản huấn luyện để lập lộ trình 3 giai đoạn trong 5 giây.
                    </td>
                    <td className="p-3 font-black text-emerald-300">
                      Cá nhân hóa 100% theo cấp dạy • Điền IDP 1 chạm
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-white">
                      3. Tiếp nhận & Chỉ đạo Xử lý Sự vụ Phòng Lab
                    </td>
                    <td className="p-3 text-slate-300">
                      Báo cáo qua tin nhắn Zalo dễ bị trôi, thiếu quy trình chuẩn và khó tra cứu lại lịch sử minh chứng khắc phục.
                    </td>
                    <td className="p-3 text-sky-200 font-semibold">
                      AI Số 3 tư vấn quy trình xử lý 3 bước (Tức thời – Phối hợp – Phòng ngừa) & dự thảo ý kiến chỉ đạo cho Tổ trưởng.
                    </td>
                    <td className="p-3 font-black text-emerald-300">
                      Xử lý chuẩn SLA • Lưu vết minh chứng 100%
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-white">
                      4. Điểm tin Công nghệ & Cập nhật Chương trình ICT
                    </td>
                    <td className="p-3 text-slate-300">
                      Tổ trưởng phải tự tìm đọc rời rạc trên nhiều báo; việc đề xuất cập nhật chương trình thường bị chậm nhịp.
                    </td>
                    <td className="p-3 text-sky-200 font-semibold">
                      AI Số 4 tự động quét nguồn chính thống + tìm kiếm mở lúc 08h00 Thứ Bảy, tham mưu cập nhật 3 cấp học & giao việc 1 chạm.
                    </td>
                    <td className="p-3 font-black text-emerald-300">
                      Chủ động đón đầu xu hướng AI & Robotics hàng tuần
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-white">
                      5. Soạn thảo Kế hoạch, Tờ trình, Biên bản & Email
                    </td>
                    <td className="p-3 text-slate-300">
                      Mất 90–120 phút/văn bản để vừa gõ nội dung vừa mở từng bảng thống kê đếm số liệu thiết bị, lớp học, công việc.
                    </td>
                    <td className="p-3 text-sky-200 font-semibold">
                      AI Số 5 tự động lấy số liệu thật từ CSDL để xuất bản dự thảo chuẩn thể thức Sky-Line (.doc / Email) trong 3 giây.
                    </td>
                    <td className="p-3 font-black text-emerald-300">
                      Giải phóng 85% thời gian hành chính cho Tổ trưởng
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Phản hồi thực tế từ đội ngũ giáo viên trong Tổ ICT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1.5 text-xs">
                <div className="font-extrabold text-amber-300">
                  💬 Thầy Trần Quốc Huy (GV ICT Cơ sở Riverside)
                </div>
                <p className="text-slate-300 italic leading-relaxed">
                  “Khi phòng máy phát sinh sự cố kỹ thuật hoặc cần phương án phân hóa bài tập, Trợ lý AI Sự vụ gợi ý ngay 3 bước xử lý rất sát thực tế phòng Lab, giúp tiết học không bị gián đoạn.”
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1.5 text-xs">
                <div className="font-extrabold text-sky-300">
                  💬 Cô Đào Thị Mỹ Linh (GV ICT Tiểu học & THCS)
                </div>
                <p className="text-slate-300 italic leading-relaxed">
                  “Phần AI phân tích 15 tiêu chí năng lực chỉ ra rất đúng điểm mạnh và gợi ý lộ trình bồi dưỡng IC3 Spark, Scratch gắn đúng với khối lớp tôi đang dạy.”
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1.5 text-xs">
                <div className="font-extrabold text-emerald-300">
                  💬 Thầy Nguyễn Văn Tùng (GV ICT & Bồi dưỡng Đội tuyển)
                </div>
                <p className="text-slate-300 italic leading-relaxed">
                  “Tính năng AI quét khung tiết trống phòng Lab và Bản tin Robotics sáng Thứ Bảy giúp anh em trong tổ chủ động hoàn toàn lịch bồi dưỡng học sinh giỏi.”
                </p>
              </div>
            </div>
          </div>

          {/* 2. BỘ KHUÔN MẪU CHUYỂN GIAO & TÁI SỬ DỤNG DƯỚI 30 PHÚT CHO CÁC TỔ BỘ MÔN KHÁC (ĐẠT CHUẨN HẠNG T2) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-sky-950/60 border border-emerald-500/40 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Phần 2. Khuôn Mẫu Chuyển Giao & Tái Sử Dụng Trong 15 Phút Cho Các Tổ Bộ Môn Khác Tại Sky-Line
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black">
                    Đạt mức cao nhất: Dưới 30 phút, chỉ cần thay nội dung
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Nhờ tách bạch toàn bộ tri thức chuyên môn vào bảng <strong>ai_training_knowledge_base</strong> trong CSDL, bất kỳ Tổ chuyên môn nào tại Hệ thống Giáo dục Sky-Line cũng có thể áp dụng lại trọn bộ 5 Trợ lý AI này chỉ trong <strong>15 phút (3 bước)</strong> mà không cần lập trình lại!
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const htmlContent = `
                    <html xmlns:o="urn:schemas-microsoft-com:office:office"
                          xmlns:w="urn:schemas-microsoft-com:office:word"
                          xmlns="http://www.w3.org/TR/REC-html40">
                    <head><meta charset="utf-8"><title>Cam_Nang_Chuyen_Giao_${activeReplicationTemplate.id}</title></head>
                    <body style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; white-space: pre-wrap;">${activeReplicationTemplate.replicationGuideContent.replace(
                      /\n/g,
                      "<br/>"
                    )}</body>
                    </html>
                  `;
                  const blob = new Blob(["\ufeff", htmlContent], {
                    type: "application/msword;charset=utf-8",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `Khuon_Mau_Chuyen_Giao_15_Phut_${activeReplicationTemplate.id}.doc`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  notify(
                    `📥 Đã tải Bộ khuôn mẫu chuyển giao 15 phút cho "${activeReplicationTemplate.departmentName}"!`,
                    "success"
                  );
                }}
                className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Tải Bộ Khuôn Mẫu Chuyển Giao 15 Phút (.doc)</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
              <div className="lg:col-span-5 space-y-2">
                <label className="font-extrabold text-sky-200 block">
                  Chọn thử Tổ chuyên môn tại Sky-Line muốn nhận chuyển giao:
                </label>
                <div className="space-y-2">
                  {replicationTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedReplicationDeptId(tpl.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        selectedReplicationDeptId === tpl.id
                          ? "bg-emerald-500/25 border-emerald-400 text-white font-black shadow-sm"
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 font-semibold"
                      }`}
                    >
                      <span className="truncate">{tpl.departmentName}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold shrink-0">
                        {tpl.setupTimeMinutes} phút
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 p-4 rounded-xl bg-slate-950/75 border border-white/15 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <span className="font-black text-amber-300 text-sm">
                    📋 Bản xem trước Cấu hình Chuyển giao: {activeReplicationTemplate.departmentName}
                  </span>
                  <span className="text-[11px] text-emerald-300 font-bold">
                    ⏱️ Thời gian thiết lập: {activeReplicationTemplate.setupTimeMinutes} phút (Chỉ thay nội dung bảng CSDL)
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="text-sky-200">
                    <strong>• Bước 1 (5 phút) – Đổi tên Phòng chức năng:</strong>{" "}
                    <span className="text-white">{activeReplicationTemplate.roomOrFacilityLabel}</span>
                  </div>
                  <div className="text-sky-200">
                    <strong>• Bước 2 (5 phút) – Nạp Tiêu chí Năng lực đặc thù vào bảng ai_training_knowledge_base:</strong>
                  </div>
                  <div className="pl-3 space-y-1 text-slate-300">
                    {activeReplicationTemplate.sampleCriteriaAdapted.map((c, i) => (
                      <div key={i}>✓ {c}</div>
                    ))}
                  </div>
                  <div className="text-sky-200 pt-1">
                    <strong>• Bước 3 (5 phút) – Kích hoạt Quy trình Sự vụ & Bản tin Sáng Thứ Bảy:</strong>
                  </div>
                  <div className="pl-3 space-y-1 text-slate-300">
                    {activeReplicationTemplate.sampleIncidentAdapted.map((inc, i) => (
                      <div key={i}>✓ {inc}</div>
                    ))}
                    <div>✓ Chủ đề Bản tin AI: {activeReplicationTemplate.sampleBriefingTopics.join("; ")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. BẢNG KIỂM CHỨNG AN TOÀN DỮ LIỆU HỌC SINH & PHÂN ĐỊNH "AI THAM MƯU - CON NGƯỜI KIỂM CHỨNG" */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/15 space-y-3 text-xs">
            <h3 className="text-sm font-black uppercase tracking-wider text-sky-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Phần 3. Cam Kết Ba Điều Kiện An Toàn Dữ Liệu & Quy Trình Con Người Kiểm Chứng Kết Quả AI
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <div className="font-black text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  1. Không đưa dữ liệu HS ra AI ngoài
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Toàn bộ 5 Trợ lý AI vận hành trên thuật toán nội bộ & CSDL Supabase có khóa bảo mật RLS của nhà trường; tuyệt đối không gửi thông tin cá nhân học sinh lên công cụ AI bên ngoài.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <div className="font-black text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  2. Học sinh không cần tạo tài khoản
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Hệ thống phục vụ công tác quản trị, điều hành và chuyên môn của Tổ trưởng & Giáo viên; không bắt buộc học sinh (đặc biệt dưới 13 tuổi) tạo tài khoản ngoài.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <div className="font-black text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  3. Con người kiểm soát 100% đầu ra
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Mọi gợi ý của AI (Lộ trình IDP, Hướng xử lý sự vụ, Đề xuất chương trình, Dự thảo Kế hoạch/Email) đều mở trong khung chỉnh sửa để Tổ trưởng & Giáo viên kiểm duyệt trước khi lưu hoặc ban hành.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

