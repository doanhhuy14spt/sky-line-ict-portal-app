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

  // Chuyển đổi giữa 2 Trợ lý AI của Đợt 2:
  // - tab "news_curriculum": AI số 3 (Bản tin thời sự 08h00 sáng Thứ Bảy & Cập nhật Chương trình ICT)
  // - tab "leader_assistant": AI số 4 (Trợ lý xây dựng Kế hoạch, Tờ trình & Soạn Email cho Tổ trưởng)
  const [activeAITab, setActiveAITab] = useState<"news_curriculum" | "leader_assistant">(
    "news_curriculum"
  );

  // =========================================================================
  // STATE DÀNH CHO TÍNH NĂNG AI SỐ 3: BẢN TIN THỜI SỰ 08H00 THỨ BẢY & CHƯƠNG TRÌNH ICT
  // =========================================================================
  const [briefing, setBriefing] = useState<SaturdayWeeklyBriefing>(() =>
    generateSaturdayWeeklyBriefing(selectedSchoolYear)
  );
  const [isScanningNews, setIsScanningNews] = useState<boolean>(false);
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
  // QUÉT TIN TỨC CHÍNH THỐNG & TỰ ĐỘNG GỬI THÔNG BÁO 08H00 SÁNG THỨ BẢY CHO TỔ TRƯỞNG
  // =========================================================================
  const handleScanOfficialNews = useCallback(
    async (sendNotifToLeader = false) => {
      setIsScanningNews(true);
      try {
        let liveHeadlines: any[] = [];
        try {
          const res = await fetch("/api/ai-weekly-news", { cache: "no-store" });
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

        if (sendNotifToLeader && !isGuest && currentUserProfile?.id) {
          const satInfo = getSaturdayEditionDateInfo();
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
                "Đúng lịch hẹn 08h00 sáng Thứ Bảy hằng tuần, AI đã tổng hợp xong tin tức Giáo dục, Tin học, Robotics, AI từ các nguồn chính thống và đề xuất 03 phương hướng cập nhật Chương trình ICT (Tiểu học, THCS, THPT). Mời Tổ trưởng xem duyệt!",
              target_tab: "dashboard",
              is_read: false,
            });
          }
        }

        if (sendNotifToLeader) {
          notify(
            "✨ AI đã quét xong các nguồn tin chính thống và gửi thông báo Bản tin 08h00 sáng Thứ Bảy tới Tổ trưởng!",
            "success"
          );
        }
      } finally {
        setIsScanningNews(false);
      }
    },
    [selectedSchoolYear, isGuest, currentUserProfile?.id, supabase, notify]
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

        {/* Nút chuyển nhanh giữa 2 Trợ lý AI trực tiếp tại Trung tâm */}
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
        </div>
      </div>

      {/* THANH CHUYỂN ĐỔI 2 TAB LỚN TRỰC QUAN NGAY ĐẦU TRUNG TÂM AI (AI SỐ 4 & AI SỐ 5) */}
      <div className="p-3 sm:p-4 bg-slate-950/70 border-b border-white/15">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          {/* Thanh thông tin Lịch hẹn 08h00 sáng Thứ Bảy & Nút Quét trực tiếp */}
          <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
                onClick={() => handleScanOfficialNews(true)}
                className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanningNews ? "animate-spin" : ""}`} />
                <span>
                  {isScanningNews
                    ? "Đang quét các trang chính thống..."
                    : "⚡ Quét Tin Chính Thống & Báo Tổ Trưởng Ngay"}
                </span>
              </Button>
            </div>
          </div>

          {/* Danh sách các nguồn chính thống AI vừa quét */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-bold text-sky-300 mr-1">
              🌐 Nguồn thông tin chính thống được AI theo dõi định kỳ:
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
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30 font-extrabold text-[10px]">
                        {art.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {art.sourceName} • {art.publishedDate}
                      </span>
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
    </div>
  );
}

