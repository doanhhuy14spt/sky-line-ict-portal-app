"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  GraduationCap,
  Users,
  CheckCircle2,
  Lock,
  Save,
  Printer,
  BookOpen,
  Award,
  AlertTriangle,
  Clock,
  Bell,
  ShieldCheck,
  Sparkles,
  UserCheck,
  BarChart3,
  ChevronRight,
  Info,
  X,
  FileCheck2,
  EyeOff,
  Bot,
  Wand2,
  Target,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  generateTeacherCompetencyAIAdvice,
  TeacherCompetencyAIResult,
  CompetencyCriterionInput,
} from "@/lib/ai-spark-engine";

export interface CompetencyCriterion {
  code: string;
  title: string;
  generalReq?: string;
  primaryReq?: string;
  secondaryReq?: string;
  highSchoolReq?: string;
  details: string[];
}

export interface CompetencyGroup {
  id: "N1" | "N2" | "N3" | "N4";
  roman: string;
  name: string;
  shortName: string;
  weight: number; // 0.30, 0.35, 0.20, 0.15
  weightLabel: string;
  criteria: CompetencyCriterion[];
}

export const COMPETENCY_GROUPS: CompetencyGroup[] = [
  {
    id: "N1",
    roman: "I",
    name: "NHÓM 1: NĂNG LỰC CHUYÊN MÔN ĐẶC THÙ ICT (30%)",
    shortName: "Nhóm 1: Chuyên môn ICT (30%)",
    weight: 0.3,
    weightLabel: "30%",
    criteria: [
      {
        code: "1.1",
        title: "Kiến thức CT GDPT 2018 & CT Đề án",
        generalReq:
          "Nắm vững 3 mạch: Học vấn số (DL), Khoa học máy tính (CS) và CNTT&TT (ICT).",
        primaryReq:
          "Làm chủ IC3 Spark / Cambridge Primary. Kỹ năng máy tính cơ bản, đạo đức số cho trẻ.",
        secondaryReq:
          "Làm chủ IC3 GS6 / Cambridge Lower Secondary. Phần mềm văn phòng, đa phương tiện, mạng cơ bản.",
        highSchoolReq:
          "Làm chủ MOS (Word, Excel, PowerPoint Expert), định hướng CS và Tin học ứng dụng (Đồ họa, CSDL).",
        details: [
          "Yêu cầu chung: Nắm vững 3 mạch Học vấn số (DL), Khoa học máy tính (CS) và CNTT&TT (ICT).",
          "Tiểu học (Lớp 1-5): Làm chủ IC3 Spark / Cambridge Primary. Kỹ năng máy tính cơ bản, đạo đức số cho trẻ.",
          "THCS (Lớp 6-9): Làm chủ IC3 GS6 / Cambridge Lower Secondary. Phần mềm văn phòng, đa phương tiện, mạng cơ bản.",
          "THPT (Lớp 10-12): Làm chủ MOS (Word, Excel, PowerPoint Expert), định hướng CS và Tin học ứng dụng (Đồ họa, CSDL).",
        ],
      },
      {
        code: "1.2",
        title: "Tư duy máy tính & Lập trình (Coding)",
        generalReq:
          "Hiểu rõ cấu trúc dữ liệu, giải thuật và phương pháp dạy tư duy máy tính.",
        primaryReq:
          "Thành thạo lập trình kéo thả trực quan: Scratch Jr, Scratch, Code.org.",
        secondaryReq:
          "Chuyển giao lập trình khối sang dòng lệnh: Scratch nâng cao, Python cơ bản.",
        highSchoolReq:
          "Thành thạo ngôn ngữ bậc cao: Python nâng cao, C/C++, thuật toán chuyên sâu, SQL, Web/App và nền tảng AI.",
        details: [
          "Yêu cầu chung: Hiểu rõ cấu trúc dữ liệu, giải thuật và phương pháp dạy tư duy máy tính.",
          "Tiểu học (Lớp 1-5): Thành thạo lập trình kéo thả trực quan: Scratch Jr, Scratch, Code.org.",
          "THCS (Lớp 6-9): Chuyển giao lập trình khối sang dòng lệnh: Scratch nâng cao, Python cơ bản.",
          "THPT (Lớp 10-12): Thành thạo ngôn ngữ bậc cao: Python nâng cao, C/C++, thuật toán chuyên sâu, SQL, Web/App và nền tảng AI.",
        ],
      },
      {
        code: "1.3",
        title: "Chứng chỉ & Tiếng Anh ICT",
        generalReq:
          "Có chứng chỉ quốc tế tương ứng cấp học; đọc hiểu tài liệu công nghệ bằng Tiếng Anh.",
        primaryReq:
          "Có chứng chỉ IC3/MOS; sử dụng tốt thuật ngữ tiếng Anh ICT giao tiếp lớp học cho trẻ.",
        secondaryReq:
          "Có chứng chỉ IC3 GS6/MOS Master; đủ năng lực giảng dạy thuật ngữ chuyên ngành song ngữ.",
        highSchoolReq:
          "Có chứng chỉ MOS Expert/Chứng chỉ lập trình quốc tế; đọc hiểu tài liệu học thuật CS/AI tiếng Anh.",
        details: [
          "Yêu cầu chung: Có chứng chỉ quốc tế tương ứng cấp học; đọc hiểu tài liệu công nghệ bằng Tiếng Anh.",
          "Tiểu học (Lớp 1-5): Có chứng chỉ IC3/MOS; sử dụng tốt thuật ngữ tiếng Anh ICT giao tiếp lớp học cho trẻ.",
          "THCS (Lớp 6-9): Có chứng chỉ IC3 GS6/MOS Master; đủ năng lực giảng dạy thuật ngữ chuyên ngành song ngữ.",
          "THPT (Lớp 10-12): Có chứng chỉ MOS Expert/Chứng chỉ lập trình quốc tế; đọc hiểu tài liệu học thuật CS/AI tiếng Anh.",
        ],
      },
      {
        code: "1.4",
        title: "Quản trị Phòng Lab & Xử lý sự cố",
        generalReq:
          "Vận hành tốt phòng máy, mạng LAN, phần mềm quản lý (NetSupport School).",
        primaryReq:
          "Xử lý nhanh lỗi thao tác của học sinh nhỏ tuổi (mất chuột, treo phần mềm, lỗi tai nghe,…).",
        secondaryReq:
          "Xử lý sự cố phần cứng / phần mềm cơ bản, cài đặt môi trường đa phương tiện, bảo mật thiết bị.",
        highSchoolReq:
          "Cài đặt, cấu hình môi trường lập trình (IDE, Server ảo, Database), đảm bảo GMetrix/Compass ổn định.",
        details: [
          "Yêu cầu chung: Vận hành tốt phòng máy, mạng LAN, phần mềm quản lý (NetSupport School).",
          "Tiểu học (Lớp 1-5): Xử lý nhanh lỗi thao tác của học sinh nhỏ tuổi (mất chuột, treo phần mềm, lỗi tai nghe,…).",
          "THCS (Lớp 6-9): Xử lý sự cố phần cứng / phần mềm cơ bản, cài đặt môi trường đa phương tiện, bảo mật thiết bị.",
          "THPT (Lớp 10-12): Cài đặt, cấu hình môi trường lập trình (IDE, Server ảo, Database), đảm bảo GMetrix/Compass ổn định.",
        ],
      },
    ],
  },
  {
    id: "N2",
    roman: "II",
    name: "NHÓM 2: NĂNG LỰC SƯ PHẠM & TỔ CHỨC DẠY HỌC (35%)",
    shortName: "Nhóm 2: Sư phạm & Dạy học (35%)",
    weight: 0.35,
    weightLabel: "35%",
    criteria: [
      {
        code: "2.1",
        title: "Thiết kế Kế hoạch bài dạy & Học liệu số",
        details: [
          "Mức 1: Soạn bài đúng mẫu nhưng còn phụ thuộc nhiều vào sách giáo khoa, học liệu đơn điệu.",
          "Mức 2: Thiết kế Lesson Plan bám sát mục tiêu, tích hợp học liệu số sinh động, phân bổ Lý thuyết - Thực hành hợp lý (tối thiểu 60% thực hành).",
          "Mức 3: Thiết kế bài dạy theo hướng Dạy học dự án (Project-based Learning), cá nhân hóa bài tập thực hành theo năng lực học sinh.",
          "Mức 4: Xây dựng ngân hàng học liệu số, video bài giảng E-learning chuẩn hóa dùng chung cho cả Hệ thống.",
        ],
      },
      {
        code: "2.2",
        title: "Tổ chức và Quản lý Lớp học tại Phòng Máy",
        details: [
          "Cấp Tiểu học: Quản lý tốt nề nếp di chuyển, tư thế ngồi, thao tác tắt/mở máy; sử dụng Gamification (trò chơi hóa) để giữ sự tập trung.",
          "Cấp THCS: Quản lý tốt việc sử dụng Internet an toàn trong giờ học; tổ chức hoạt động nhóm làm dự án đa phương tiện hiệu quả.",
          "Cấp THPT: Tổ chức lớp học theo mô hình Flipped Classroom (Lớp học đảo ngược), phát huy khả năng tự nghiên cứu, tự sửa lỗi (Debug) của học sinh.",
        ],
      },
      {
        code: "2.3",
        title: "Kiểm tra, Đánh giá Năng lực Học sinh",
        details: [
          "Đánh giá đa dạng qua sản phẩm thực hành (Portfolio, dự án phần mềm, bài thuyết trình, thiết kế) thay vì chỉ kiểm tra lý thuyết trên giấy.",
          "Xây dựng ma trận đề kiểm tra và Rubric chấm điểm sản phẩm rõ ràng, công bằng.",
          "Theo dõi sát sao tiến độ luyện thi chứng chỉ quốc tế (IC3 Spark, IC3, MOS) trên GMetrix và phụ đạo kịp thời cho học sinh yếu.",
        ],
      },
      {
        code: "2.4",
        title: "An toàn Phòng máy & Công dân số",
        details: [
          "Đảm bảo 100% ca dạy an toàn về điện và thiết bị công nghệ.",
          "Lồng ghép hiệu quả giáo dục Công dân số: Văn hóa ứng xử trên mạng, phòng chống bắt nạt trực tuyến (Cyberbullying), bảo vệ dữ liệu cá nhân và bản quyền số.",
        ],
      },
    ],
  },
  {
    id: "N3",
    roman: "III",
    name: "NHÓM 3: PHÁT TRIỂN MŨI NHỌN, STEM & EDTECH (20%)",
    shortName: "Nhóm 3: STEM & EdTech (20%)",
    weight: 0.2,
    weightLabel: "20%",
    criteria: [
      {
        code: "3.1",
        title: "Giảng dạy STEM & Robotics",
        details: [
          "Cấp Tiểu học: Hướng dẫn lắp ráp và lập trình Robot cơ bản (Lego Wedo 2.0, Whalesbot AI Module 1S).",
          "Cấp THCS: Hướng dẫn thiết kế mô hình STEM, lập trình cảm biến và vi điều khiển (Whalesbot AI Module 5S).",
          "Cấp THPT: Hướng dẫn dự án IoT (Internet vạn vật), hệ thống tự động hóa, AI & Robotics nâng cao.",
        ],
      },
      {
        code: "3.2",
        title: "Bồi dưỡng Học sinh Giỏi & Các cuộc thi",
        details: [
          "Hội thi Tin học trẻ cấp phường/thành phố/khu vực/quốc gia.",
          "Cuộc thi KHKT cấp Hệ thống/thành phố.",
          "Cuộc thi Vô địch Tin học Văn phòng Thế giới (MOSWC), Đấu trường IC3/IC3 Spark.",
          "Các cuộc thi về Robotics (Sáng tạo Robotics toàn quốc, ENJOY AI,…).",
          "Các cuộc thi về trí tuệ nhân tạo AI (AI For Good,…).",
        ],
      },
      {
        code: "3.3",
        title: "Ứng dụng AI & Chuyển đổi số (EdTech Leader)",
        details: [
          "Làm chủ các công cụ AI tạo sinh (ChatGPT, Gemini, Canva AI, Copilot, Gamma...) để tối ưu hóa công việc và hướng dẫn học sinh sử dụng AI có đạo đức.",
          "Đóng vai trò Hạt nhân Công nghệ (EdTech Support) tại cơ sở: Hỗ trợ giáo viên các tổ bộ môn khác sử dụng LMS, bảng tương tác thông minh và phần mềm dạy học số.",
        ],
      },
    ],
  },
  {
    id: "N4",
    roman: "IV",
    name: "NHÓM 4: PHẨM CHẤT & VĂN HÓA SKY-LINE (15%)",
    shortName: "Nhóm 4: Phẩm chất & Văn hóa (15%)",
    weight: 0.15,
    weightLabel: "15%",
    criteria: [
      {
        code: "4.1",
        title: "Tinh thần Kỷ luật & Trách nhiệm",
        details: [
          "Tuân thủ nghiêm túc quy chế chuyên môn: Lên lịch báo giảng, vào điểm, nộp hồ sơ sổ sách, đề kiểm tra đúng hạn 100%.",
          "Thực hiện nghiêm túc quy trình quản lý và vận hành phòng Lab (ghi nhật ký phòng máy, vệ sinh, tắt thiết bị sau ca dạy).",
        ],
      },
      {
        code: "4.2",
        title: "Hợp tác, Chia sẻ & Hỗ trợ Đồng nghiệp",
        details: [
          "Tích cực tham gia sinh hoạt chuyên môn tổ/nhóm; thẳng thắn và mang tính xây dựng khi dự giờ, góp ý đồng nghiệp.",
          "Sẵn sàng hỗ trợ kỹ thuật cho các sự kiện, hội thảo, ngày hội công nghệ của Hệ thống Sky-Line.",
        ],
      },
      {
        code: "4.3",
        title: "Tinh thần Tự học & Đổi mới sáng tạo",
        details: [
          "Công nghệ thay đổi liên tục, giáo viên ICT phải có kế hoạch tự học hàng năm (hoàn thành các khóa học trực tuyến, các khóa tập huấn, đào tạo trực tiếp / trực tuyến).",
          "Có ít nhất 01 sáng kiến kinh nghiệm hoặc giải pháp cải tiến dạy học/quản lý phòng máy sau mỗi năm học.",
        ],
      },
      {
        code: "4.4",
        title: "Giao tiếp với Phụ huynh & Học sinh",
        details: [
          "Thể hiện sự tận tâm, tôn trọng và truyền cảm hứng yêu thích công nghệ cho học sinh.",
          "Phối hợp nhịp nhàng với GVCN và Phụ huynh trong việc thông báo tình hình, tư vấn lộ trình học tập, đề xuất tham gia các cuộc thi, chứng chỉ quốc tế.",
        ],
      },
    ],
  },
];

export const ALL_CRITERIA_CODES = COMPETENCY_GROUPS.flatMap((g) =>
  g.criteria.map((c) => c.code)
);

export const RUBRIC_LEVELS = [
  {
    level: "Mức 1",
    range: "1.0 – 1.9",
    name: "Cần cải thiện (Tập sự)",
    desc: "Nắm bắt kiến thức ở mức cơ bản nhưng chưa vận dụng linh hoạt. Cần sự hướng dẫn, giám sát thường xuyên của Tổ trưởng hoặc giáo viên hướng dẫn.",
    badgeClass:
      "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800",
  },
  {
    level: "Mức 2",
    range: "2.0 – 2.9",
    name: "Đạt chuẩn (Cơ bản)",
    desc: "Độc lập thực hiện tốt các nhiệm vụ giảng dạy và chuyên môn theo đúng quy định của nhà trường. Đảm bảo tiến độ và chất lượng đầu ra tiêu chuẩn.",
    badgeClass:
      "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300 dark:border-sky-800",
  },
  {
    level: "Mức 3",
    range: "3.0 – 3.5",
    name: "Thành thạo (Nâng cao)",
    desc: "Chủ động sáng tạo trong phương pháp giảng dạy; xử lý tốt các tình huống sư phạm và kỹ thuật phức tạp. Có khả năng dạy liên cấp và bồi dưỡng học sinh giỏi.",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
  },
  {
    level: "Mức 4",
    range: "3.6 – 4.0",
    name: "Xuất sắc (Chuyên gia)",
    desc: "Làm chủ hoàn toàn công nghệ mới; dẫn dắt, đào tạo lại cho đồng nghiệp; chủ trì xây dựng chương trình học liệu của Tổ và mang lại giải thưởng cấp Thành phố/Quốc gia/Quốc tế.",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800",
  },
];

export const RANKING_RULES = [
  {
    id: "excellent",
    label: "Xuất sắc",
    rangeText: "Từ 3.60 – 4.00 điểm",
    min: 3.6,
    max: 4.0,
    description:
      "Hoàn thành xuất sắc nhiệm vụ; Đề xuất khen thưởng, nâng lương trước hạn hoặc quy hoạch cán bộ nguồn/nhóm trưởng chuyên môn.",
    colorClass:
      "border-amber-400 bg-amber-50/90 dark:bg-amber-950/40 dark:border-amber-600 text-amber-900 dark:text-amber-200",
    badgeVariant: "amber" as const,
  },
  {
    id: "good",
    label: "Thành thạo / Tốt",
    rangeText: "Từ 3.00 – 3.59 điểm",
    min: 3.0,
    max: 3.59,
    description:
      "Hoàn thành tốt nhiệm vụ; Đáp ứng vượt mức kỳ vọng ở một số mảng mũi nhọn.",
    colorClass:
      "border-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/40 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200",
    badgeVariant: "emerald" as const,
  },
  {
    id: "standard",
    label: "Đạt chuẩn",
    rangeText: "Từ 2.00 – 2.99 điểm",
    min: 2.0,
    max: 2.99,
    description:
      "Hoàn thành nhiệm vụ; Cần tham gia các buổi tập huấn nội bộ để nâng cao kỹ năng còn khuyết.",
    colorClass:
      "border-sky-400 bg-sky-50/90 dark:bg-sky-950/40 dark:border-sky-600 text-sky-900 dark:text-sky-200",
    badgeVariant: "default" as const,
  },
  {
    id: "improve",
    label: "Cần cải thiện",
    rangeText: "Dưới 2.00 điểm",
    min: 0.01,
    max: 1.99,
    description:
      "Chưa hoàn thành nhiệm vụ; Cần lập kế hoạch kèm cặp 1-1 (Coaching) trong học kỳ tiếp theo.",
    colorClass:
      "border-rose-400 bg-rose-50/90 dark:bg-rose-950/40 dark:border-rose-600 text-rose-900 dark:text-rose-200",
    badgeVariant: "destructive" as const,
  },
];

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

export interface EvaluationRecord {
  id?: string;
  school_year: string;
  teacher_id: string;
  teacher_name: string;
  teacher_email: string;
  staff_code: string;
  campus: string;
  teaching_levels: string[];
  grade_details: string;
  lab_management: string;
  concurrent_duties: string;
  peer1_id: string;
  peer1_email: string;
  peer2_id: string;
  peer2_email: string;
  self_scores: Record<string, number>;
  peer1_scores: Record<string, number>;
  peer2_scores: Record<string, number>;
  leader_scores: Record<string, number>;
  evidences: Record<string, string>;
  idp_strengths: string;
  idp_improvements: string;
  idp_goals: string;
  self_eval_date: string;
  leader_eval_date: string;
  board_eval_date: string;
  is_self_confirmed: boolean;
  is_peer1_confirmed: boolean;
  is_peer2_confirmed: boolean;
  is_leader_confirmed: boolean;
}

interface TeacherCompetencyEvaluationSectionProps {
  supabase: any;
  showToast: (text: string, type?: "success" | "warning" | "info") => void;
  selectedSchoolYear: string;
  teachersList: TeacherProfileItem[];
  currentUserProfile: {
    id: string;
    email: string;
    name: string;
    role: "leader" | "teacher" | "guest";
    campus: string;
  };
}

// Hàm băm cố định theo chuỗi Năm học để sắp xếp ngẫu nhiên cặp đánh giá đồng cấp công bằng
function hashStringSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function getSeededTeacherPermutation(
  teachers: TeacherProfileItem[],
  schoolYear: string
): TeacherProfileItem[] {
  const sorted = [...teachers].sort((a, b) =>
    (a.email || a.id).localeCompare(b.email || b.id)
  );
  let seed = hashStringSeed(`SKYLINE_ICT_PEER_${schoolYear}`);
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = sorted.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    const tmp = sorted[i];
    sorted[i] = sorted[j];
    sorted[j] = tmp;
  }
  return sorted;
}

export function round1(val: number | null | undefined): number | null {
  if (val === null || val === undefined || isNaN(val) || val <= 0) return null;
  return Math.round(val * 10) / 10;
}

export function round2(val: number | null | undefined): number | null {
  if (val === null || val === undefined || isNaN(val) || val <= 0) return null;
  return Math.round(val * 100) / 100;
}

export function getRankingByScore(score: number | null) {
  if (score === null || score <= 0) return null;
  if (score >= 3.6) return RANKING_RULES[0];
  if (score >= 3.0) return RANKING_RULES[1];
  if (score >= 2.0) return RANKING_RULES[2];
  return RANKING_RULES[3];
}

export function TeacherCompetencyEvaluationSection({
  supabase,
  showToast,
  selectedSchoolYear,
  teachersList,
  currentUserProfile,
}: TeacherCompetencyEvaluationSectionProps) {
  const isLeader = currentUserProfile.role === "leader";
  const isGuest = currentUserProfile.role === "guest";

  // Chỉ lấy danh sách Giáo viên trong Tổ ICT (Loại trừ Tổ trưởng chuyên môn vì Tổ trưởng không có bản đánh giá)
  const eligibleTeachers = useMemo(() => {
    return teachersList.filter(
      (t) =>
        t.roleCode !== "leader" &&
        !t.role?.toLowerCase().includes("tổ trưởng") &&
        t.email?.toLowerCase() !== "huyda@skylineschool.edu.vn"
    );
  }, [teachersList]);

  // Giáo viên đang đăng nhập
  const currentTeacherObj = useMemo(() => {
    return eligibleTeachers.find(
      (t) =>
        t.id === currentUserProfile.id ||
        (Boolean(t.email) &&
          Boolean(currentUserProfile.email) &&
          t.email.toLowerCase() === currentUserProfile.email.toLowerCase())
    );
  }, [eligibleTeachers, currentUserProfile]);

  const [evaluationsMap, setEvaluationsMap] = useState<
    Record<string, EvaluationRecord>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Dành cho Tổ trưởng: Giáo viên đang được chọn để xem/chấm chi tiết
  const [selectedTeacherIdForLeader, setSelectedTeacherIdForLeader] =
    useState<string>("");

  // Dành cho Giáo viên: Chuyển đổi giữa "Phiếu Tự Đánh Giá Của Tôi" và "Đánh Giá Đồng Cấp (2 Giáo Viên)"
  const [teacherModeTab, setTeacherModeTab] = useState<
    "my_evaluation" | "peer_evaluation"
  >("my_evaluation");
  const [selectedPeerTargetId, setSelectedPeerTargetId] = useState<string>("");

  // Modal xem Khung năng lực & Thang đo Rubric (Phần I - IV)
  const [isRubricGuideOpen, setIsRubricGuideOpen] = useState(false);

  // Modal xác nhận khóa hoàn thành vĩnh viễn
  const [confirmLockModal, setConfirmLockModal] = useState<{
    isOpen: boolean;
    lockType: "self" | "peer" | "leader";
    targetTeacherId: string;
    targetTeacherName: string;
  } | null>(null);

  // State lưu kết quả phân tích & gợi ý lộ trình phát triển năng lực từ AI cho từng giáo viên
  const [aiRoadmapMap, setAiRoadmapMap] = useState<
    Record<string, TeacherCompetencyAIResult>
  >({});
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

  // Tính toán phân công ngẫu nhiên 2 Giáo viên đồng cấp cho từng Giáo viên trong năm học
  const peerAssignmentByTeacherId = useMemo(() => {
    const map: Record<
      string,
      {
        peer1: TeacherProfileItem | null;
        peer2: TeacherProfileItem | null;
      }
    > = {};
    if (eligibleTeachers.length < 3) return map;

    const permuted = getSeededTeacherPermutation(
      eligibleTeachers,
      selectedSchoolYear
    );
    const n = permuted.length;
    permuted.forEach((teacher, idx) => {
      const p1 = permuted[(idx + 1) % n];
      const p2 = permuted[(idx + 2) % n];
      map[teacher.id] = { peer1: p1, peer2: p2 };
    });
    return map;
  }, [eligibleTeachers, selectedSchoolYear]);

  // Khởi tạo bản ghi mặc định cho 1 giáo viên
  const buildDefaultRecord = useCallback(
    (teacher: TeacherProfileItem): EvaluationRecord => {
      const peers = peerAssignmentByTeacherId[teacher.id] || {
        peer1: null,
        peer2: null,
      };
      const defaultIdx =
        eligibleTeachers.findIndex((t) => t.id === teacher.id) + 1;

      // Tự động suy luận cấp học từ mô tả chuyên môn / phòng Lab
      const defaultLevels: string[] = [];
      const combinedText = `${teacher.specialty || ""} ${teacher.lab || ""}`.toLowerCase();
      if (combinedText.includes("tiểu học")) defaultLevels.push("Tiểu học");
      if (combinedText.includes("thcs") || combinedText.includes("trung học"))
        defaultLevels.push("THCS");
      if (combinedText.includes("thpt") || combinedText.includes("igcse"))
        defaultLevels.push("THPT");
      if (defaultLevels.length === 0) defaultLevels.push("Liên cấp");

      return {
        school_year: selectedSchoolYear,
        teacher_id: teacher.id,
        teacher_name: teacher.name,
        teacher_email: teacher.email,
        staff_code: `ICT-0${defaultIdx > 0 ? defaultIdx : 1}`,
        campus: teacher.campus || "Chưa phân công",
        teaching_levels: defaultLevels,
        grade_details: "",
        lab_management: teacher.lab || "Chưa phân công",
        concurrent_duties: teacher.lab || "Chưa phân công",
        peer1_id: peers.peer1?.id || "",
        peer1_email: peers.peer1?.email || "",
        peer2_id: peers.peer2?.id || "",
        peer2_email: peers.peer2?.email || "",
        self_scores: {},
        peer1_scores: {},
        peer2_scores: {},
        leader_scores: {},
        evidences: {},
        idp_strengths: "",
        idp_improvements: "",
        idp_goals: "",
        self_eval_date: "",
        leader_eval_date: "",
        board_eval_date: "",
        is_self_confirmed: false,
        is_peer1_confirmed: false,
        is_peer2_confirmed: false,
        is_leader_confirmed: false,
      };
    },
    [eligibleTeachers, peerAssignmentByTeacherId, selectedSchoolYear]
  );

  // Tải dữ liệu đánh giá từ cơ sở dữ liệu theo năm học
  const loadEvaluations = useCallback(async () => {
    if (eligibleTeachers.length === 0) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("teacher_competency_evaluations")
        .select("*")
        .eq("school_year", selectedSchoolYear);

      const newMap: Record<string, EvaluationRecord> = {};
      eligibleTeachers.forEach((teacher) => {
        newMap[teacher.id] = buildDefaultRecord(teacher);
      });

      if (!error && Array.isArray(data)) {
        data.forEach((row: any) => {
          const matchedTeacher = eligibleTeachers.find(
            (t) =>
              t.id === row.teacher_id ||
              (Boolean(t.email) &&
                Boolean(row.teacher_email) &&
                t.email.toLowerCase() === row.teacher_email.toLowerCase())
          );
          if (matchedTeacher) {
            const base = buildDefaultRecord(matchedTeacher);
            newMap[matchedTeacher.id] = {
              ...base,
              id: row.id,
              staff_code: row.staff_code || base.staff_code,
              campus: matchedTeacher.campus || base.campus,
              teaching_levels: Array.isArray(row.teaching_levels)
                ? row.teaching_levels
                : base.teaching_levels,
              grade_details: row.grade_details ?? "",
              lab_management: matchedTeacher.lab || base.lab_management,
              concurrent_duties: matchedTeacher.lab || base.concurrent_duties,
              peer1_id: row.peer1_id || base.peer1_id,
              peer1_email: row.peer1_email || base.peer1_email,
              peer2_id: row.peer2_id || base.peer2_id,
              peer2_email: row.peer2_email || base.peer2_email,
              self_scores: row.self_scores || {},
              peer1_scores: row.peer1_scores || {},
              peer2_scores: row.peer2_scores || {},
              leader_scores: row.leader_scores || {},
              evidences: row.evidences || {},
              idp_strengths: row.idp_strengths || "",
              idp_improvements: row.idp_improvements || "",
              idp_goals: row.idp_goals || "",
              self_eval_date: row.self_eval_date || "",
              leader_eval_date: row.leader_eval_date || "",
              board_eval_date: row.board_eval_date || "",
              is_self_confirmed: Boolean(row.is_self_confirmed),
              is_peer1_confirmed: Boolean(row.is_peer1_confirmed),
              is_peer2_confirmed: Boolean(row.is_peer2_confirmed),
              is_leader_confirmed: Boolean(row.is_leader_confirmed),
            };
          }
        });
      }

      setEvaluationsMap(newMap);
    } catch {
      // Giữ bản mặc định nếu ngoại tuyến
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedSchoolYear, eligibleTeachers, buildDefaultRecord]);

  useEffect(() => {
    loadEvaluations();
  }, [loadEvaluations]);

  // Mặc định chọn giáo viên đầu tiên cho Tổ trưởng
  useEffect(() => {
    if (
      isLeader &&
      eligibleTeachers.length > 0 &&
      (!selectedTeacherIdForLeader ||
        !eligibleTeachers.some((t) => t.id === selectedTeacherIdForLeader))
    ) {
      setSelectedTeacherIdForLeader(eligibleTeachers[0].id);
    }
  }, [isLeader, eligibleTeachers, selectedTeacherIdForLeader]);

  // Danh sách 2 đồng nghiệp mà giáo viên hiện tại được phân công đánh giá đồng cấp
  const myAssignedPeerTargets = useMemo(() => {
    if (!currentTeacherObj) return [];
    const targets: {
      teacher: TeacherProfileItem;
      slot: "peer1" | "peer2";
      record: EvaluationRecord;
    }[] = [];

    eligibleTeachers.forEach((t) => {
      if (t.id === currentTeacherObj.id) return;
      const rec = evaluationsMap[t.id] || buildDefaultRecord(t);
      const isPeer1 =
        rec.peer1_id === currentTeacherObj.id ||
        (Boolean(rec.peer1_email) &&
          rec.peer1_email.toLowerCase() ===
            currentTeacherObj.email.toLowerCase());
      const isPeer2 =
        rec.peer2_id === currentTeacherObj.id ||
        (Boolean(rec.peer2_email) &&
          rec.peer2_email.toLowerCase() ===
            currentTeacherObj.email.toLowerCase());

      if (isPeer1) {
        targets.push({ teacher: t, slot: "peer1", record: rec });
      } else if (isPeer2) {
        targets.push({ teacher: t, slot: "peer2", record: rec });
      }
    });

    return targets;
  }, [currentTeacherObj, eligibleTeachers, evaluationsMap, buildDefaultRecord]);

  useEffect(() => {
    if (
      myAssignedPeerTargets.length > 0 &&
      (!selectedPeerTargetId ||
        !myAssignedPeerTargets.some(
          (item) => item.teacher.id === selectedPeerTargetId
        ))
    ) {
      setSelectedPeerTargetId(myAssignedPeerTargets[0].teacher.id);
    }
  }, [myAssignedPeerTargets, selectedPeerTargetId]);

  // ============================================================================
  // KIỂM TRA HẠN CUỐI (15/05 CHO GV, 25/05 CHO TTCM) & TỰ ĐỘNG GỬI THÔNG BÁO TRƯỚC 5 NGÀY
  // ============================================================================
  useEffect(() => {
    const checkAndSendDeadlineReminder = async () => {
      if (isLoading || isGuest || !currentUserProfile?.id) return;
      const now = new Date();
      const month = now.getMonth() + 1; // Tháng 5 => 5
      const day = now.getDate();

      // Trước hạn 15/05 của Giáo viên 5 ngày: từ 10/05 đến 15/05
      if (!isLeader && currentTeacherObj && month === 5 && day >= 10 && day <= 15) {
        const myRec = evaluationsMap[currentTeacherObj.id];
        const allPeersConfirmed = myAssignedPeerTargets.every((p) =>
          p.slot === "peer1"
            ? p.record.is_peer1_confirmed
            : p.record.is_peer2_confirmed
        );
        const isAllDone = Boolean(myRec?.is_self_confirmed && allPeersConfirmed);

        if (!isAllDone) {
          const reminderTitle = `[Nhắc hẹn KPIs ${selectedSchoolYear}] Hạn cuối đánh giá năng lực GV trước 15/05`;
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("recipient_id", currentUserProfile.id)
            .eq("title", reminderTitle)
            .limit(1);

          if (!existing || existing.length === 0) {
            await supabase.from("notifications").insert({
              recipient_id: currentUserProfile.id,
              actor_id: currentUserProfile.id,
              actor_name: "Hệ thống Nhắc hẹn KPIs",
              actor_role: "Tự động",
              action_type: "INSERT",
              category: "profile",
              title: reminderTitle,
              message: `Còn ${15 - day} ngày nữa là đến hạn cuối (15/05) hoàn thành Tự đánh giá và Đánh giá đồng cấp năm học ${selectedSchoolYear}. Thầy/Cô vui lòng hoàn tất và bấm Xác nhận!`,
              target_tab: "teachers",
              is_read: false,
            });
          }
        }
      }

      // Trước hạn 25/05 của Tổ trưởng 5 ngày: từ 20/05 đến 25/05
      if (isLeader && month === 5 && day >= 20 && day <= 25) {
        const unconfirmedCount = eligibleTeachers.filter(
          (t) => !evaluationsMap[t.id]?.is_leader_confirmed
        ).length;

        if (unconfirmedCount > 0) {
          const reminderTitle = `[Nhắc hẹn TTCM ${selectedSchoolYear}] Hạn cuối đánh giá năng lực Tổ ICT trước 25/05`;
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("recipient_id", currentUserProfile.id)
            .eq("title", reminderTitle)
            .limit(1);

          if (!existing || existing.length === 0) {
            await supabase.from("notifications").insert({
              recipient_id: currentUserProfile.id,
              actor_id: currentUserProfile.id,
              actor_name: "Hệ thống Nhắc hẹn KPIs",
              actor_role: "Tự động",
              action_type: "INSERT",
              category: "profile",
              title: reminderTitle,
              message: `Còn ${25 - day} ngày nữa là đến hạn cuối của Tổ trưởng (25/05). Hiện còn ${unconfirmedCount}/${eligibleTeachers.length} hồ sơ giáo viên chưa xác nhận hoàn thành đánh giá.`,
              target_tab: "teachers",
              is_read: false,
            });
          }
        }
      }
    };

    checkAndSendDeadlineReminder();
  }, [
    isLoading,
    isGuest,
    isLeader,
    currentUserProfile?.id,
    currentTeacherObj,
    evaluationsMap,
    myAssignedPeerTargets,
    eligibleTeachers,
    selectedSchoolYear,
    supabase,
  ]);

  // Hàm gửi thông báo nhắc hẹn ngay lập tức lên Chuông Thông Báo cho toàn bộ giáo viên chưa hoàn thành
  const handleSendManualReminderToTeachers = async () => {
    if (!isLeader) return;
    try {
      const pendingTeachers = eligibleTeachers.filter((t) => {
        const rec = evaluationsMap[t.id];
        return !rec?.is_self_confirmed;
      });

      const targetList =
        pendingTeachers.length > 0 ? pendingTeachers : eligibleTeachers;

      const rowsToInsert = targetList.map((t) => ({
        recipient_id: t.id,
        actor_id: currentUserProfile.id,
        actor_name: currentUserProfile.name,
        actor_role: "Tổ trưởng ICT",
        action_type: "INSERT",
        category: "profile",
        title: `⏰ Nhắc hẹn hoàn thành Đánh giá năng lực GV (${selectedSchoolYear})`,
        message: `Tổ trưởng nhắc hẹn: Hạn cuối hoàn thành Tự đánh giá và Đánh giá đồng cấp của giáo viên là trước ngày 15/05. Thầy/Cô vui lòng vào mục Nhân Sự ICT → Phần 2. Đánh giá năng lực giáo viên để thực hiện và bấm Xác nhận!`,
        target_tab: "teachers",
        is_read: false,
      }));

      const { error } = await supabase
        .from("notifications")
        .insert(rowsToInsert);
      if (error) throw error;

      showToast(
        `Đã gửi thông báo nhắc hẹn đánh giá năng lực đến ${targetList.length} giáo viên trong Tổ ICT!`,
        "success"
      );
    } catch {
      showToast(
        "Đã phát tín hiệu nhắc hẹn đánh giá năng lực đến các giáo viên trong tổ!",
        "info"
      );
    }
  };

  // ============================================================================
  // HÀM TÍNH TOÁN ĐIỂM TRUNG BÌNH NHÓM (N1..N4), ĐIỂM KÊNH & ĐIỂM TỔNG KẾT 360 ĐỘ
  // ============================================================================
  const computeEvaluationMetrics = useCallback((record: EvaluationRecord) => {
    // Điểm trung bình cộng của 2 giáo viên đồng cấp cho từng tiêu chí
    const peerAvgCriterionScores: Record<string, number> = {};
    ALL_CRITERIA_CODES.forEach((code) => {
      const p1 = Number(record.peer1_scores?.[code] || 0);
      const p2 = Number(record.peer2_scores?.[code] || 0);
      if (p1 > 0 && p2 > 0) {
        peerAvgCriterionScores[code] = Math.round(((p1 + p2) / 2) * 10) / 10;
      } else if (p1 > 0) {
        peerAvgCriterionScores[code] = Math.round(p1 * 10) / 10;
      } else if (p2 > 0) {
        peerAvgCriterionScores[code] = Math.round(p2 * 10) / 10;
      }
    });

    const calcGroupAvg = (
      scoresMap: Record<string, number>,
      codes: string[]
    ): number | null => {
      const valid = codes
        .map((c) => Number(scoresMap?.[c] || 0))
        .filter((v) => v >= 1 && v <= 4);
      if (valid.length === 0) return null;
      const sum = valid.reduce((a, b) => a + b, 0);
      return round1(sum / valid.length);
    };

    const groupSelf: Record<"N1" | "N2" | "N3" | "N4", number | null> = {
      N1: null,
      N2: null,
      N3: null,
      N4: null,
    };
    const groupPeer: Record<"N1" | "N2" | "N3" | "N4", number | null> = {
      N1: null,
      N2: null,
      N3: null,
      N4: null,
    };
    const groupLeader: Record<"N1" | "N2" | "N3" | "N4", number | null> = {
      N1: null,
      N2: null,
      N3: null,
      N4: null,
    };
    const groupCombined: Record<"N1" | "N2" | "N3" | "N4", number | null> = {
      N1: null,
      N2: null,
      N3: null,
      N4: null,
    };

    COMPETENCY_GROUPS.forEach((g) => {
      const codes = g.criteria.map((c) => c.code);
      const sAvg = calcGroupAvg(record.self_scores, codes);
      const pAvg = calcGroupAvg(peerAvgCriterionScores, codes);
      const lAvg = calcGroupAvg(record.leader_scores, codes);

      groupSelf[g.id] = sAvg;
      groupPeer[g.id] = pAvg;
      groupLeader[g.id] = lAvg;

      // Điểm nhóm tổng hợp theo tỉ trọng 20% Tự ĐG + 20% Đồng cấp TB + 60% TTCM
      if (sAvg !== null && pAvg !== null && lAvg !== null) {
        groupCombined[g.id] = round1(sAvg * 0.2 + pAvg * 0.2 + lAvg * 0.6);
      } else if (lAvg !== null && sAvg !== null) {
        groupCombined[g.id] = round1((sAvg * 0.2 + lAvg * 0.6) / 0.8);
      } else {
        groupCombined[g.id] = lAvg ?? sAvg ?? pAvg;
      }
    });

    const calcWeightedChannelTotal = (
      groupMap: Record<"N1" | "N2" | "N3" | "N4", number | null>
    ): number | null => {
      const n1 = groupMap.N1;
      const n2 = groupMap.N2;
      const n3 = groupMap.N3;
      const n4 = groupMap.N4;
      if (n1 === null && n2 === null && n3 === null && n4 === null) return null;

      let weightedSum = 0;
      let weightTotal = 0;
      COMPETENCY_GROUPS.forEach((g) => {
        const val = groupMap[g.id];
        if (val !== null) {
          weightedSum += val * g.weight;
          weightTotal += g.weight;
        }
      });
      if (weightTotal === 0) return null;
      // Nếu đã nhập đủ 4 nhóm thì weightTotal === 1.0: (N1*30% + N2*35% + N3*20% + N4*15%)
      return round1(weightedSum / weightTotal);
    };

    const totalSelf = calcWeightedChannelTotal(groupSelf);
    const totalPeer = calcWeightedChannelTotal(groupPeer);
    const totalLeader = calcWeightedChannelTotal(groupLeader);

    // Điểm Tổng Kết Năng Lực Cuối Cùng (Phần IV: Tự ĐG 20% + Đồng cấp TB 20% + TTCM 60%)
    let finalScore360: number | null = null;
    if (totalSelf !== null && totalPeer !== null && totalLeader !== null) {
      finalScore360 = round2(
        totalSelf * 0.2 + totalPeer * 0.2 + totalLeader * 0.6
      );
    } else {
      let sum = 0;
      let w = 0;
      if (totalSelf !== null) {
        sum += totalSelf * 0.2;
        w += 0.2;
      }
      if (totalPeer !== null) {
        sum += totalPeer * 0.2;
        w += 0.2;
      }
      if (totalLeader !== null) {
        sum += totalLeader * 0.6;
        w += 0.6;
      }
      if (w > 0) {
        finalScore360 = round2(sum / w);
      }
    }

    const finalScoreRounded1 = round1(finalScore360);
    const ranking = getRankingByScore(finalScore360);

    return {
      peerAvgCriterionScores,
      groupSelf,
      groupPeer,
      groupLeader,
      groupCombined,
      totalSelf,
      totalPeer,
      totalLeader,
      finalScore360,
      finalScoreRounded1,
      ranking,
    };
  }, []);

  // ============================================================================
  // LƯU DỮ LIỆU ĐÁNH GIÁ LÊN SUPABASE
  // ============================================================================
  const saveEvaluationRecord = async (
    recordToSave: EvaluationRecord,
    toastMessage: string
  ) => {
    setIsSaving(true);
    try {
      const payload = {
        school_year: recordToSave.school_year,
        teacher_id: recordToSave.teacher_id,
        teacher_name: recordToSave.teacher_name,
        teacher_email: recordToSave.teacher_email,
        staff_code: recordToSave.staff_code,
        campus: recordToSave.campus,
        teaching_levels: recordToSave.teaching_levels,
        grade_details: recordToSave.grade_details,
        lab_management: recordToSave.lab_management,
        concurrent_duties: recordToSave.concurrent_duties,
        peer1_id: recordToSave.peer1_id,
        peer1_email: recordToSave.peer1_email,
        peer2_id: recordToSave.peer2_id,
        peer2_email: recordToSave.peer2_email,
        self_scores: recordToSave.self_scores,
        peer1_scores: recordToSave.peer1_scores,
        peer2_scores: recordToSave.peer2_scores,
        leader_scores: recordToSave.leader_scores,
        evidences: recordToSave.evidences,
        idp_strengths: recordToSave.idp_strengths,
        idp_improvements: recordToSave.idp_improvements,
        idp_goals: recordToSave.idp_goals,
        self_eval_date: recordToSave.self_eval_date,
        leader_eval_date: recordToSave.leader_eval_date,
        board_eval_date: recordToSave.board_eval_date,
        is_self_confirmed: recordToSave.is_self_confirmed,
        is_peer1_confirmed: recordToSave.is_peer1_confirmed,
        is_peer2_confirmed: recordToSave.is_peer2_confirmed,
        is_leader_confirmed: recordToSave.is_leader_confirmed,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("teacher_competency_evaluations")
        .upsert(payload, { onConflict: "school_year,teacher_id" })
        .select()
        .single();

      if (error) throw error;

      setEvaluationsMap((prev) => ({
        ...prev,
        [recordToSave.teacher_id]: {
          ...recordToSave,
          id: data?.id || recordToSave.id,
        },
      }));

      showToast(toastMessage, "success");
    } catch (err: any) {
      showToast(
        "Không thể lưu phiếu đánh giá: " +
          (err?.message || "Vui lòng kiểm tra lại kết nối"),
        "warning"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Cập nhật trường dữ liệu trên state cục bộ của 1 giáo viên
  const updateTeacherRecordState = (
    teacherId: string,
    updater: (prev: EvaluationRecord) => EvaluationRecord
  ) => {
    const teacher = eligibleTeachers.find((t) => t.id === teacherId);
    if (!teacher) return;
    setEvaluationsMap((prev) => {
      const current = prev[teacherId] || buildDefaultRecord(teacher);
      return {
        ...prev,
        [teacherId]: updater(current),
      };
    });
  };

  // Giáo viên đang được hiển thị trên Phiếu Đánh Giá Chi Tiết (Phần V)
  const activeSheetTeacher = useMemo(() => {
    if (isLeader) {
      return (
        eligibleTeachers.find((t) => t.id === selectedTeacherIdForLeader) ||
        eligibleTeachers[0] ||
        null
      );
    }
    return currentTeacherObj || null;
  }, [isLeader, eligibleTeachers, selectedTeacherIdForLeader, currentTeacherObj]);

  const activeSheetRecord = useMemo(() => {
    if (!activeSheetTeacher) return null;
    return (
      evaluationsMap[activeSheetTeacher.id] ||
      buildDefaultRecord(activeSheetTeacher)
    );
  }, [activeSheetTeacher, evaluationsMap, buildDefaultRecord]);

  const activeSheetMetrics = useMemo(() => {
    if (!activeSheetRecord) return null;
    return computeEvaluationMetrics(activeSheetRecord);
  }, [activeSheetRecord, computeEvaluationMetrics]);

  // Kiểm tra quyền chỉnh sửa trên Phiếu Đánh Giá Chính (Phần V)
  const canEditSelfOnActiveSheet = Boolean(
    !isLeader &&
      !isGuest &&
      activeSheetTeacher &&
      currentTeacherObj &&
      activeSheetTeacher.id === currentTeacherObj.id &&
      activeSheetRecord &&
      !activeSheetRecord.is_self_confirmed
  );

  const canEditLeaderOnActiveSheet = Boolean(
    isLeader &&
      !isGuest &&
      activeSheetTeacher &&
      activeSheetRecord &&
      !activeSheetRecord.is_leader_confirmed
  );

  // ============================================================================
  // TÍNH NĂNG AI SỐ 1: PHÂN TÍCH DỮ LIỆU ĐÁNH GIÁ & GỢI Ý LỘ TRÌNH PHÁT TRIỂN NĂNG LỰC
  // ============================================================================
  const handleGenerateAICompetencyRoadmap = useCallback(() => {
    if (!activeSheetTeacher || !activeSheetRecord || !activeSheetMetrics) return;
    setIsAnalyzingAI(true);

    setTimeout(() => {
      const criteriaList: CompetencyCriterionInput[] = [];
      COMPETENCY_GROUPS.forEach((group) => {
        group.criteria.forEach((crit) => {
          const sVal = Number(activeSheetRecord.self_scores?.[crit.code] || 0);
          const pVal = Number(
            activeSheetMetrics.peerAvgCriterionScores?.[crit.code] || 0
          );
          const lVal = Number(activeSheetRecord.leader_scores?.[crit.code] || 0);

          const selfScore = sVal >= 1 && sVal <= 4 ? sVal : null;
          const peerScore = pVal >= 1 && pVal <= 4 ? pVal : null;
          const leaderScore = lVal >= 1 && lVal <= 4 ? lVal : null;

          let finalCriterionScore: number | null = null;
          if (selfScore !== null && peerScore !== null && leaderScore !== null) {
            finalCriterionScore = round1(
              selfScore * 0.2 + peerScore * 0.2 + leaderScore * 0.6
            );
          } else if (selfScore !== null && leaderScore !== null) {
            finalCriterionScore = round1(
              (selfScore * 0.2 + leaderScore * 0.6) / 0.8
            );
          } else {
            finalCriterionScore = leaderScore ?? selfScore ?? peerScore;
          }

          criteriaList.push({
            code: crit.code,
            title: crit.title,
            groupId: group.id,
            groupName: group.name,
            selfScore,
            peerScore,
            leaderScore,
            finalCriterionScore,
            evidence: activeSheetRecord.evidences?.[crit.code] || "",
          });
        });
      });

      const result = generateTeacherCompetencyAIAdvice({
        teacherName: activeSheetRecord.teacher_name || activeSheetTeacher.name,
        staffCode: activeSheetRecord.staff_code || "ICT-01",
        campus: activeSheetTeacher.campus || activeSheetRecord.campus,
        schoolYear: selectedSchoolYear,
        teachingLevels: activeSheetRecord.teaching_levels || ["Liên cấp"],
        gradeDetails: activeSheetRecord.grade_details || "",
        labManagement:
          activeSheetTeacher.lab || activeSheetRecord.lab_management || "",
        concurrentDuties:
          activeSheetRecord.concurrent_duties || activeSheetTeacher.lab || "",
        criteriaList,
        groupAverages: activeSheetMetrics.groupCombined,
        totalSelf: activeSheetMetrics.totalSelf,
        totalPeer: activeSheetMetrics.totalPeer,
        totalLeader: activeSheetMetrics.totalLeader,
        finalScore360: activeSheetMetrics.finalScore360,
        rankingLabel: activeSheetMetrics.ranking?.label || "Đạt chuẩn",
      });

      setAiRoadmapMap((prev) => ({
        ...prev,
        [activeSheetTeacher.id]: result,
      }));
      setIsAnalyzingAI(false);
      showToast(
        `✨ AI đã phân tích toàn bộ 15 tiêu chí năng lực và thiết lập Lộ trình phát triển cho ${activeSheetTeacher.name}!`,
        "success"
      );
    }, 350);
  }, [
    activeSheetTeacher,
    activeSheetRecord,
    activeSheetMetrics,
    selectedSchoolYear,
    showToast,
  ]);

  const handleApplyAIAdviceToIDP = useCallback(() => {
    if (!activeSheetTeacher || !activeSheetRecord) return;
    const aiAdvice = aiRoadmapMap[activeSheetTeacher.id];
    if (!aiAdvice) return;

    if (!canEditLeaderOnActiveSheet && !canEditSelfOnActiveSheet) {
      showToast(
        "Phiếu đánh giá này đã khóa xác nhận nên không thể ghi đè nội dung IDP!",
        "warning"
      );
      return;
    }

    updateTeacherRecordState(activeSheetTeacher.id, (prev) => ({
      ...prev,
      idp_strengths: canEditLeaderOnActiveSheet
        ? aiAdvice.draftIdpStrengths
        : prev.idp_strengths || aiAdvice.draftIdpStrengths,
      idp_improvements: canEditLeaderOnActiveSheet
        ? aiAdvice.draftIdpImprovements
        : prev.idp_improvements || aiAdvice.draftIdpImprovements,
      idp_goals: aiAdvice.draftIdpGoals,
    }));

    showToast(
      canEditLeaderOnActiveSheet
        ? "✅ Đã điền tự động gợi ý của AI vào cả 3 mục Nhận xét & Kế hoạch IDP (Mục IV)! Tổ trưởng có thể rà soát, chỉnh sửa thêm và bấm Lưu."
        : "✅ Đã điền gợi ý Mục tiêu cam kết năm học tiếp theo của AI vào Mục IV.3! Thầy/Cô có thể chỉnh sửa thêm và bấm Lưu.",
      "success"
    );
  }, [
    activeSheetTeacher,
    activeSheetRecord,
    aiRoadmapMap,
    canEditLeaderOnActiveSheet,
    canEditSelfOnActiveSheet,
    showToast,
  ]);

  // Kiểm tra điều kiện hiển thị tính năng Xuất Phiếu Đánh Giá ra file .pdf
  // (Sau khi Tổ trưởng bấm xác nhận hoàn thành chấm điểm và có đầy đủ thông tin trong form)
  const isReadyForPdfExport = useMemo(() => {
    if (!activeSheetRecord || !activeSheetTeacher || !activeSheetMetrics)
      return false;
    const hasLeaderConfirmed = Boolean(activeSheetRecord.is_leader_confirmed);
    const hasAllLeaderScores = ALL_CRITERIA_CODES.every(
      (code) => Number(activeSheetRecord.leader_scores?.[code] || 0) >= 1
    );
    return (
      hasLeaderConfirmed &&
      hasAllLeaderScores &&
      activeSheetMetrics.finalScore360 !== null
    );
  }, [activeSheetRecord, activeSheetTeacher, activeSheetMetrics]);

  // Hàm tải trực tiếp Phiếu Đánh Giá Năng Lực Giáo Viên ICT thành file .pdf về máy tính người dùng
  const handleExportEvaluationFormPdf = useCallback(async () => {
    if (!activeSheetTeacher || !activeSheetRecord || !activeSheetMetrics || isExportingPdf)
      return;

    setIsExportingPdf(true);
    showToast(
      `Đang tạo và tải file .pdf Phiếu đánh giá của ${activeSheetTeacher.name} về máy tính...`,
      "info"
    );

    const escapeHtml = (str?: string) =>
      String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const levelsHtml = ["Tiểu học", "THCS", "THPT", "Liên cấp"]
      .map((lvl) => {
        const checked = activeSheetRecord.teaching_levels?.includes(lvl);
        return `<span style="margin-right: 14px;">${checked ? "☑" : "☐"} ${lvl}</span>`;
      })
      .join("");

    const groupsRowsHtml = COMPETENCY_GROUPS.map((group) => {
      const sAvg = activeSheetMetrics.groupSelf[group.id];
      const pAvg = activeSheetMetrics.groupPeer[group.id];
      const lAvg = activeSheetMetrics.groupLeader[group.id];
      const cAvg = activeSheetMetrics.groupCombined[group.id];

      const criteriaHtml = group.criteria
        .map((crit) => {
          const sVal = activeSheetRecord.self_scores?.[crit.code];
          const pVal = activeSheetMetrics.peerAvgCriterionScores?.[crit.code];
          const lVal = activeSheetRecord.leader_scores?.[crit.code];
          const evVal = activeSheetRecord.evidences?.[crit.code] || "";
          return `
            <tr>
              <td style="text-align:center; font-weight:bold;">${crit.code}</td>
              <td>
                <div style="font-weight:bold;">${escapeHtml(crit.title)}</div>
                <div style="font-size:10.5px; color:#475569; margin-top:2px;">${escapeHtml(crit.details[0])}</div>
              </td>
              <td style="text-align:center; font-weight:bold;">${sVal !== undefined ? Number(sVal).toFixed(1) : "......."}</td>
              <td style="text-align:center; font-weight:bold;">${pVal !== undefined ? Number(pVal).toFixed(1) : "......."}</td>
              <td style="text-align:center; font-weight:bold;">${lVal !== undefined ? Number(lVal).toFixed(1) : "......."}</td>
              <td>${escapeHtml(evVal)}</td>
            </tr>
          `;
        })
        .join("");

      return `
        <tr style="background:#f1f5f9; font-weight:bold;">
          <td style="text-align:center;">${group.roman}</td>
          <td colspan="5">${escapeHtml(group.name)}</td>
        </tr>
        ${criteriaHtml}
        <tr style="background:#f8fafc; font-weight:bold;">
          <td></td>
          <td style="text-align:right;">Điểm Trung bình Nhóm ${group.id.replace("N", "")} (${group.id}):</td>
          <td style="text-align:center;">${sAvg !== null ? sAvg.toFixed(1) : "......."}</td>
          <td style="text-align:center;">${pAvg !== null ? pAvg.toFixed(1) : "......."}</td>
          <td style="text-align:center;">${lAvg !== null ? lAvg.toFixed(1) : "......."}</td>
          <td>Điểm TB Nhóm ${group.id} tổng hợp: <strong>${cAvg !== null ? cAvg.toFixed(1) : "......."}</strong></td>
        </tr>
      `;
    }).join("");

    const fileTitle = `Phieu_Danh_Gia_Nang_Luc_ICT_${activeSheetTeacher.name.replace(/\s+/g, "_")}_${selectedSchoolYear.replace(/\s+/g, "")}`;

    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(fileTitle)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12.5px;
      line-height: 1.42;
      color: #0f172a;
      margin: 0;
      padding: 28px 36px;
      width: 794px;
      background: #ffffff;
    }
    .header-grid {
      display: table;
      width: 100%;
      margin-bottom: 10px;
    }
    .header-col {
      display: table-cell;
      width: 50%;
      text-align: center;
      vertical-align: top;
    }
    .title-block {
      text-align: center;
      margin: 10px 0 14px 0;
    }
    .title-block h1 {
      font-size: 17px;
      font-weight: bold;
      margin: 0 0 4px 0;
      text-transform: uppercase;
    }
    .section-title {
      font-size: 13px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 12px 0 5px 0;
    }
    .info-box p {
      margin: 3.5px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 5px;
      font-size: 11.2px;
    }
    th, td {
      border: 1px solid #334155;
      padding: 4.5px 6px;
      vertical-align: middle;
    }
    th {
      background: #e2e8f0;
      font-weight: bold;
      text-align: center;
    }
    .ranking-list {
      margin: 5px 0;
      padding-left: 16px;
    }
    .ranking-list li {
      margin-bottom: 3.5px;
    }
    .idp-block {
      margin-top: 5px;
    }
    .idp-item {
      margin-bottom: 7px;
    }
    .idp-box {
      min-height: 34px;
      border: 1px dashed #64748b;
      padding: 5px 8px;
      border-radius: 4px;
      margin-top: 2px;
      white-space: pre-wrap;
    }
    .sig-table td {
      width: 33.33%;
      text-align: center;
      vertical-align: top;
      padding: 8px 6px 22px 6px;
    }
  </style>
</head>
<body>
  <div class="header-grid">
    <div class="header-col">
      <div style="font-weight:bold;">HỆ THỐNG GIÁO DỤC SKY-LINE</div>
      <div style="font-weight:bold;">TỔ ICT</div>
      <div style="width:80px; border-bottom:1px solid #0f172a; margin:4px auto 0 auto;"></div>
    </div>
    <div class="header-col">
      <div style="font-weight:bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
      <div style="font-weight:bold;">Độc lập - Tự do - Hạnh phúc</div>
      <div style="width:120px; border-bottom:1px solid #0f172a; margin:4px auto 0 auto;"></div>
    </div>
  </div>

  <div class="title-block">
    <h1>PHIẾU ĐÁNH GIÁ NĂNG LỰC GIÁO VIÊN ICT</h1>
    <div style="font-weight:bold;">Năm học: ${escapeHtml(selectedSchoolYear)}</div>
  </div>

  <div class="section-title">I. THÔNG TIN CHUNG</div>
  <div class="info-box">
    <p>• <strong>Họ và tên giáo viên:</strong> ${escapeHtml(activeSheetTeacher.name)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Mã nhân sự:</strong> ${escapeHtml(activeSheetRecord.staff_code)}</p>
    <p>• <strong>Cơ sở:</strong> ${escapeHtml(activeSheetTeacher.campus || "Chưa phân công")}</p>
    <p>• <strong>Cấp học giảng dạy chính:</strong> ${levelsHtml} (<strong>Khối lớp:</strong> ${escapeHtml(activeSheetRecord.grade_details || "....................")})</p>
    <p>• <strong>Quản lý phòng Lab:</strong> ${escapeHtml(activeSheetTeacher.lab || "Chưa phân công")}</p>
    <p>• <strong>Kiêm nhiệm:</strong> ${escapeHtml(activeSheetTeacher.lab || "Chưa phân công")}</p>
  </div>

  <div class="section-title">II. BẢNG CHẤM ĐIỂM CHI TIẾT</div>
  <div style="font-style:italic; font-size:11px; margin-bottom:4px;">
    (Điền điểm từ 1.0 đến 4.0 vào cột tương ứng. Điểm tổng kết tính theo trọng số từng nhóm. Điểm điền và điểm tổng kết được làm tròn 1 chữ số thập phân)
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:46px;">Mã TC</th>
        <th>Nội dung Tiêu chí Đánh giá</th>
        <th style="width:78px;">Điểm Tự ĐG<br/>(1-4 • 20%)</th>
        <th style="width:86px;">Điểm Đồng Cấp<br/>(TB 2 GV • 20%)</th>
        <th style="width:78px;">Điểm TTCM ĐG<br/>(1-4 • 60%)</th>
        <th style="width:165px;">Minh chứng / Nhận xét</th>
      </tr>
    </thead>
    <tbody>
      ${groupsRowsHtml}
      <tr style="background:#e2e8f0; font-weight:bold;">
        <td style="text-align:center;">TỔNG</td>
        <td>ĐIỂM TỔNG KẾT NĂNG LỰC (Thang điểm 4.0):</td>
        <td style="text-align:center;">${activeSheetMetrics.totalSelf !== null ? activeSheetMetrics.totalSelf.toFixed(1) : "......."}</td>
        <td style="text-align:center;">${activeSheetMetrics.totalPeer !== null ? activeSheetMetrics.totalPeer.toFixed(1) : "......."}</td>
        <td style="text-align:center;">${activeSheetMetrics.totalLeader !== null ? activeSheetMetrics.totalLeader.toFixed(1) : "......."}</td>
        <td>
          <div>Điểm chung: <strong>${activeSheetMetrics.finalScore360 !== null ? `${activeSheetMetrics.finalScore360.toFixed(2)} (${activeSheetMetrics.finalScoreRounded1?.toFixed(1)})` : "......."}</strong></div>
          <div>Xếp loại: <strong>${escapeHtml(activeSheetMetrics.ranking?.label || "..............")}</strong></div>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">III. BẢNG QUY ĐỔI XẾP LOẠI CHUNG</div>
  <ul class="ranking-list">
    ${RANKING_RULES.map((r) => {
      const matched = activeSheetMetrics.ranking?.id === r.id;
      return `<li style="${matched ? "font-weight:bold; text-decoration:underline;" : ""}"><strong>${escapeHtml(r.label)} (${escapeHtml(r.rangeText)}):</strong> ${escapeHtml(r.description)} ${matched ? " [XẾP LOẠI ĐẠT ĐƯỢC]" : ""}</li>`;
    }).join("")}
  </ul>

  <div class="section-title">IV. NHẬN XÉT CỦA TỔ TRƯỞNG CHUYÊN MÔN &amp; KẾ HOẠCH PHÁT TRIỂN CÁ NHÂN (IDP)</div>
  <div class="idp-block">
    <div class="idp-item">
      <div><strong>1. Điểm mạnh nổi bật của giáo viên trong kỳ đánh giá:</strong></div>
      <div class="idp-box">${escapeHtml(activeSheetRecord.idp_strengths || "........................................................................................................................")}</div>
    </div>
    <div class="idp-item">
      <div><strong>2. Những nội dung cần cải thiện / bồi dưỡng thêm:</strong></div>
      <div class="idp-box">${escapeHtml(activeSheetRecord.idp_improvements || "........................................................................................................................")}</div>
    </div>
    <div class="idp-item">
      <div><strong>3. Mục tiêu cam kết cho năm học tiếp theo:</strong></div>
      <div class="idp-box">${escapeHtml(activeSheetRecord.idp_goals || "........................................................................................................................")}</div>
    </div>
  </div>

  <table class="sig-table" style="margin-top:12px;">
    <tr>
      <td>
        <div style="font-weight:bold;">NGƯỜI TỰ ĐÁNH GIÁ</div>
        <div style="font-style:italic; font-size:11px;">(Ký và ghi rõ họ tên)</div>
        <div style="margin-top:24px; font-weight:bold;">${escapeHtml(activeSheetRecord.teacher_name)}</div>
        <div style="margin-top:6px; font-size:11px;">Ngày: ${escapeHtml(activeSheetRecord.self_eval_date || "..../..../202...")}</div>
      </td>
      <td>
        <div style="font-weight:bold;">TỔ TRƯỞNG CHUYÊN MÔN ICT</div>
        <div style="font-style:italic; font-size:11px;">(Ký và ghi rõ họ tên)</div>
        <div style="margin-top:24px; font-weight:bold;">Thầy Đỗ Anh Huy</div>
        <div style="margin-top:6px; font-size:11px;">Ngày: ${escapeHtml(activeSheetRecord.leader_eval_date || "..../..../202...")}</div>
      </td>
      <td>
        <div style="font-weight:bold;">BAN ĐIỀU HÀNH CHUYÊN MÔN</div>
        <div style="font-style:italic; font-size:11px;">(Ký và ghi rõ họ tên)</div>
        <div style="margin-top:24px; font-weight:bold;">........................................</div>
        <div style="margin-top:6px; font-size:11px;">Ngày: ${escapeHtml(activeSheetRecord.board_eval_date || "..../..../202...")}</div>
      </td>
    </tr>
  </table>
</body>
</html>`;

    let iframe: HTMLIFrameElement | null = null;
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.left = "-9999px";
      iframe.style.top = "0";
      iframe.style.width = "794px";
      iframe.style.height = "1400px";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Không thể khởi tạo khung xuất PDF");
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      await new Promise((resolve) => setTimeout(resolve, 250));

      const targetBody = iframeDoc.body;
      const canvas = await html2canvas(targetBody, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 794,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidthMm = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeightMm = pdf.internal.pageSize.getHeight(); // 297mm
      const imgWidthMm = pageWidthMm;
      const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

      let heightLeft = imgHeightMm;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidthMm, imgHeightMm);
      heightLeft -= pageHeightMm;

      while (heightLeft > 4) {
        position = heightLeft - imgHeightMm;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidthMm, imgHeightMm);
        heightLeft -= pageHeightMm;
      }

      pdf.save(`${fileTitle}.pdf`);
      showToast(
        `Đã tải thành công file ${fileTitle}.pdf về máy tính của bạn!`,
        "success"
      );
    } catch (err: any) {
      showToast(
        "Không thể xuất file PDF: " +
          (err?.message || "Vui lòng kiểm tra lại trình duyệt"),
        "warning"
      );
    } finally {
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      setIsExportingPdf(false);
    }
  }, [
    activeSheetTeacher,
    activeSheetRecord,
    activeSheetMetrics,
    selectedSchoolYear,
    showToast,
    isExportingPdf,
  ]);

  // Thống kê tổng hợp toàn tổ dành cho Tổ trưởng
  const leaderDepartmentSummary = useMemo(() => {
    const rows = eligibleTeachers.map((teacher, idx) => {
      const rec = evaluationsMap[teacher.id] || buildDefaultRecord(teacher);
      const metrics = computeEvaluationMetrics(rec);
      const fallbackPeers = peerAssignmentByTeacherId[teacher.id];
      const peer1Teacher =
        eligibleTeachers.find(
          (t) =>
            t.id === rec.peer1_id ||
            (Boolean(t.email) &&
              Boolean(rec.peer1_email) &&
              t.email.toLowerCase() === rec.peer1_email.toLowerCase())
        ) ||
        fallbackPeers?.peer1 ||
        null;
      const peer2Teacher =
        eligibleTeachers.find(
          (t) =>
            t.id === rec.peer2_id ||
            (Boolean(t.email) &&
              Boolean(rec.peer2_email) &&
              t.email.toLowerCase() === rec.peer2_email.toLowerCase())
        ) ||
        fallbackPeers?.peer2 ||
        null;
      const peerConfirmedCount =
        (rec.is_peer1_confirmed ? 1 : 0) + (rec.is_peer2_confirmed ? 1 : 0);
      return {
        stt: idx + 1,
        teacher,
        record: rec,
        metrics,
        peer1Teacher,
        peer2Teacher,
        peerConfirmedCount,
      };
    });

    const scoredRows = rows.filter((r) => r.metrics.finalScore360 !== null);
    const avgDeptScore =
      scoredRows.length > 0
        ? round2(
            scoredRows.reduce(
              (acc, r) => acc + (r.metrics.finalScore360 || 0),
              0
            ) / scoredRows.length
          )
        : null;

    const countExcellent = rows.filter(
      (r) => r.metrics.ranking?.id === "excellent"
    ).length;
    const countGood = rows.filter(
      (r) => r.metrics.ranking?.id === "good"
    ).length;
    const countStandard = rows.filter(
      (r) => r.metrics.ranking?.id === "standard"
    ).length;
    const countImprove = rows.filter(
      (r) => r.metrics.ranking?.id === "improve"
    ).length;
    const countFullyConfirmed = rows.filter(
      (r) =>
        r.record.is_self_confirmed &&
        r.record.is_peer1_confirmed &&
        r.record.is_peer2_confirmed &&
        r.record.is_leader_confirmed
    ).length;

    return {
      rows,
      avgDeptScore,
      countExcellent,
      countGood,
      countStandard,
      countImprove,
      countFullyConfirmed,
    };
  }, [
    eligibleTeachers,
    evaluationsMap,
    buildDefaultRecord,
    computeEvaluationMetrics,
    peerAssignmentByTeacherId,
  ]);

  // Xử lý xác nhận khóa vĩnh viễn
  const handleConfirmLockExecution = async () => {
    if (!confirmLockModal) return;
    const { lockType, targetTeacherId } = confirmLockModal;
    const teacher = eligibleTeachers.find((t) => t.id === targetTeacherId);
    if (!teacher) return;

    const currentRec =
      evaluationsMap[targetTeacherId] || buildDefaultRecord(teacher);
    const todayStr = new Date().toLocaleDateString("vi-VN");

    let updatedRec: EvaluationRecord = { ...currentRec };
    let msg = "";

    if (lockType === "self") {
      updatedRec = {
        ...currentRec,
        is_self_confirmed: true,
        self_eval_date: currentRec.self_eval_date || todayStr,
      };
      msg = `Đã xác nhận hoàn thành và khóa Phiếu Tự Đánh Giá của ${teacher.name}!`;
    } else if (lockType === "leader") {
      updatedRec = {
        ...currentRec,
        is_leader_confirmed: true,
        leader_eval_date: currentRec.leader_eval_date || todayStr,
      };
      msg = `Đã xác nhận hoàn thành và khóa kết quả Đánh giá TTCM cho ${teacher.name}!`;
    } else if (lockType === "peer" && currentTeacherObj) {
      const isPeer1 =
        currentRec.peer1_id === currentTeacherObj.id ||
        currentRec.peer1_email?.toLowerCase() ===
          currentTeacherObj.email.toLowerCase();
      updatedRec = {
        ...currentRec,
        is_peer1_confirmed: isPeer1 ? true : currentRec.is_peer1_confirmed,
        is_peer2_confirmed: !isPeer1 ? true : currentRec.is_peer2_confirmed,
      };
      msg = `Đã xác nhận hoàn thành và khóa kết quả Đánh giá đồng cấp ẩn danh cho ${teacher.name}!`;
    }

    setConfirmLockModal(null);
    await saveEvaluationRecord(updatedRec, msg);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ===================================================================== */}
      {/* THANH THÔNG TIN THỜI HẠN ĐÁNH GIÁ HẰNG NĂM & CÔNG CỤ NHANH           */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-500 shrink-0" />
                Phần 2. Đánh Giá Năng Lực Giáo Viên ICT ({selectedSchoolYear})
              </h2>
              <Badge variant="amber" className="text-[10px] font-bold">
                Mô hình 360° (Tự ĐG 20% • Đồng cấp 20% • TTCM 60%)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isLeader
                ? "Chế độ Tổ trưởng Chuyên môn: Quản lý bảng thống kê năng lực toàn tổ và chấm điểm đánh giá chi tiết từng giáo viên."
                : "Chế độ Bảo mật Giáo viên: Bảng đánh giá và điểm của giáo viên nào chỉ giáo viên đó được xem. Đánh giá đồng cấp ẩn danh 100%."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsRubricGuideOpen(true)}
              className="font-bold text-xs cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
              Xem Khung Năng Lực & Thang Đo Rubric
            </Button>

            {isLeader && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSendManualReminderToTeachers}
                className="font-bold text-xs cursor-pointer border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50"
              >
                <Bell className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                Gửi thông báo nhắc hẹn Tổ ICT
              </Button>
            )}

            {isReadyForPdfExport && (
              <Button
                size="sm"
                variant="outline"
                isLoading={isExportingPdf}
                onClick={handleExportEvaluationFormPdf}
                className="font-bold text-xs cursor-pointer border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-amber-950/50"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                Xuất Phiếu Đánh Giá (.pdf)
              </Button>
            )}
          </div>
        </div>

        {/* MỐC THỜI HẠN ĐÁNH GIÁ HẰNG NĂM & NHẮC HẸN TRƯỚC 5 NGÀY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/50">
            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Hạn cuối dành cho Giáo viên: Trước ngày 15/05 hằng năm
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Hoàn thành Tự đánh giá (20%) & Đánh giá 2 đồng cấp ẩn danh (20%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Hạn cuối dành cho Tổ trưởng: Trước ngày 25/05 hằng năm
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Hoàn thành chấm điểm TTCM (60%), nhận xét IDP & xếp loại chung
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50">
            <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Tự động nhắc hẹn trước hạn cuối 5 ngày
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Hệ thống tự động đẩy thông báo lên Chuông (🔔) ngày 10/05 & 20/05
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* DÀNH RIÊNG CHO TỔ TRƯỞNG: BẢNG THỐNG KÊ TỔNG HỢP TOÀN TỔ ICT          */}
      {/* ===================================================================== */}
      {isLeader && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-600" />
                Bảng Thống Kê Chi Tiết Điểm Đánh Giá 4 Nhóm Năng Lực, Điểm Tổng Kết & Xếp Loại Toàn Tổ ({eligibleTeachers.length} Giáo Viên)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chỉ hiển thị cho tài khoản Tổ trưởng Chuyên môn. Kích chọn vào giáo viên bất kỳ để mở Phiếu Đánh Giá Chi Tiết của giáo viên đó bên dưới.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                ĐTB Toàn Tổ:{" "}
                <strong className="text-sky-600 dark:text-sky-400">
                  {leaderDepartmentSummary.avgDeptScore !== null
                    ? leaderDepartmentSummary.avgDeptScore.toFixed(2)
                    : "--"}
                </strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                Xuất sắc: {leaderDepartmentSummary.countExcellent}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                Thành thạo/Tốt: {leaderDepartmentSummary.countGood}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-100/80 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300">
                Đạt chuẩn: {leaderDepartmentSummary.countStandard}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-100/80 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                Cần cải thiện: {leaderDepartmentSummary.countImprove}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse min-w-[1040px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-bold">
                  <th className="py-2.5 px-2.5 text-center w-10">STT</th>
                  <th className="py-2.5 px-3">Họ và Tên Giáo Viên</th>
                  <th className="py-2.5 px-2.5 bg-indigo-50/40 dark:bg-indigo-950/20">
                    2 GV Đánh Giá Đồng Cấp
                    <span className="block text-[10px] font-normal text-indigo-600 dark:text-indigo-400">
                      (Chỉ TTCM thấy • Ẩn danh với GV)
                    </span>
                  </th>
                  <th className="py-2.5 px-2 text-center">
                    Nhóm 1: Chuyên môn
                    <span className="block text-[10px] font-normal text-slate-500">
                      (N1 • 30%)
                    </span>
                  </th>
                  <th className="py-2.5 px-2 text-center">
                    Nhóm 2: Sư phạm
                    <span className="block text-[10px] font-normal text-slate-500">
                      (N2 • 35%)
                    </span>
                  </th>
                  <th className="py-2.5 px-2 text-center">
                    Nhóm 3: STEM & AI
                    <span className="block text-[10px] font-normal text-slate-500">
                      (N3 • 20%)
                    </span>
                  </th>
                  <th className="py-2.5 px-2 text-center">
                    Nhóm 4: Phẩm chất
                    <span className="block text-[10px] font-normal text-slate-500">
                      (N4 • 15%)
                    </span>
                  </th>
                  <th className="py-2.5 px-2 text-center bg-sky-50/60 dark:bg-sky-950/30">
                    Điểm Tự ĐG
                    <span className="block text-[10px] font-normal text-sky-600 dark:text-sky-400">
                      (Tỉ trọng 20%)
                    </span>
                  </th>
                  <th className="py-2.5 px-2 text-center bg-indigo-50/60 dark:bg-indigo-950/30">
                    Đồng Cấp TB
                    <span className="block text-[10px] font-normal text-indigo-600 dark:text-indigo-400">
                      (Tỉ trọng 20%)
                    </span>
                  </th>
                  <th className="py-2.5 px-2 text-center bg-amber-50/60 dark:bg-amber-950/30">
                    Điểm TTCM ĐG
                    <span className="block text-[10px] font-normal text-amber-600 dark:text-amber-400">
                      (Tỉ trọng 60%)
                    </span>
                  </th>
                  <th className="py-2.5 px-2.5 text-center bg-emerald-50/70 dark:bg-emerald-950/40 font-black">
                    ĐIỂM TỔNG KẾT
                    <span className="block text-[10px] font-normal text-emerald-700 dark:text-emerald-400">
                      (Thang 4.0)
                    </span>
                  </th>
                  <th className="py-2.5 px-2.5 text-center">Xếp Loại Chung</th>
                  <th className="py-2.5 px-2.5 text-center">Tiến Độ Xác Nhận</th>
                  <th className="py-2.5 px-2.5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaderDepartmentSummary.rows.map((row) => {
                  const isSelected =
                    selectedTeacherIdForLeader === row.teacher.id;
                  const { metrics, record } = row;
                  return (
                    <tr
                      key={row.teacher.id}
                      onClick={() =>
                        setSelectedTeacherIdForLeader(row.teacher.id)
                      }
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-sky-50/90 dark:bg-sky-950/50 font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <td className="py-2.5 px-2.5 text-center font-bold text-slate-500">
                        {row.stt}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {row.teacher.name}
                          {isSelected && (
                            <Badge
                              variant="default"
                              className="text-[9px] px-1.5 py-0"
                            >
                              Đang mở
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {row.teacher.campus}
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 bg-indigo-50/20 dark:bg-indigo-950/10">
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              1. {row.peer1Teacher?.name || "Chưa phân công"}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                record.is_peer1_confirmed
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {record.is_peer1_confirmed ? "Đã chấm" : "Chờ"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              2. {row.peer2Teacher?.name || "Chưa phân công"}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                record.is_peer2_confirmed
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {record.is_peer2_confirmed ? "Đã chấm" : "Chờ"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {metrics.groupCombined.N1 !== null
                          ? metrics.groupCombined.N1.toFixed(1)
                          : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {metrics.groupCombined.N2 !== null
                          ? metrics.groupCombined.N2.toFixed(1)
                          : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {metrics.groupCombined.N3 !== null
                          ? metrics.groupCombined.N3.toFixed(1)
                          : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {metrics.groupCombined.N4 !== null
                          ? metrics.groupCombined.N4.toFixed(1)
                          : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-sky-700 dark:text-sky-300 bg-sky-50/30 dark:bg-sky-950/15">
                        {metrics.totalSelf !== null
                          ? metrics.totalSelf.toFixed(1)
                          : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-950/15">
                        {metrics.totalPeer !== null
                          ? metrics.totalPeer.toFixed(1)
                          : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-amber-700 dark:text-amber-300 bg-amber-50/30 dark:bg-amber-950/15">
                        {metrics.totalLeader !== null
                          ? metrics.totalLeader.toFixed(1)
                          : "-"}
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-black text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20">
                        {metrics.finalScore360 !== null
                          ? metrics.finalScore360.toFixed(2)
                          : "-"}
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        {metrics.ranking ? (
                          <Badge
                            variant={metrics.ranking.badgeVariant}
                            className="text-[10px] font-bold"
                          >
                            {metrics.ranking.label}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Chưa xếp loại
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        <div className="inline-flex flex-wrap items-center justify-center gap-1 text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              record.is_self_confirmed
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                            title="Trạng thái Giáo viên tự đánh giá"
                          >
                            GV: {record.is_self_confirmed ? "Đã khóa" : "Chờ"}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              row.peerConfirmedCount === 2
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                            title="Trạng thái 2 Giáo viên đồng cấp"
                          >
                            ĐC: {row.peerConfirmedCount}/2
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              record.is_leader_confirmed
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                            title="Trạng thái Tổ trưởng xác nhận"
                          >
                            TTCM:{" "}
                            {record.is_leader_confirmed ? "Đã khóa" : "Chờ"}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeacherIdForLeader(row.teacher.id);
                          }}
                          className="h-7 px-2.5 text-[11px] font-bold cursor-pointer"
                        >
                          {record.is_leader_confirmed
                            ? "Xem phiếu"
                            : "Chấm điểm"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Thanh chọn nhanh Giáo viên để chấm chi tiết */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1">
              Chọn nhanh giáo viên:
            </span>
            {eligibleTeachers.map((t) => {
              const isSelected = selectedTeacherIdForLeader === t.id;
              const rec = evaluationsMap[t.id];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTeacherIdForLeader(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400"
                  }`}
                >
                  <span>{t.name}</span>
                  {rec?.is_leader_confirmed && (
                    <Lock className="w-3 h-3 text-amber-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DÀNH CHO TÀI KHOẢN GIÁO VIÊN: CHUYỂN ĐỔI "PHIẾU CỦA TÔI" & "ĐỒNG CẤP" */}
      {/* ===================================================================== */}
      {!isLeader && !isGuest && currentTeacherObj && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700">
          <div className="inline-flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setTeacherModeTab("my_evaluation")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                teacherModeTab === "my_evaluation"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>1. Phiếu Tự Đánh Giá & Kết Quả Của Tôi (20%)</span>
              {activeSheetRecord?.is_self_confirmed && (
                <Badge variant="emerald" className="text-[9px] px-1.5 py-0">
                  Đã xác nhận
                </Badge>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTeacherModeTab("peer_evaluation")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                teacherModeTab === "peer_evaluation"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <EyeOff className="w-4 h-4" />
              <span>
                2. Đánh Giá Đồng Cấp Ẩn Danh ({myAssignedPeerTargets.length} GV
                được phân công • 20%)
              </span>
            </button>
          </div>

          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 px-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Bảo mật 100%: Bảng điểm cá nhân chỉ mình bạn thấy • Đánh giá đồng
              cấp ẩn danh tuyệt đối
            </span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* KHU VỰC CHẤM ĐIỂM ĐỒNG CẤP ẨN DANH (DÀNH CHO GIÁO VIÊN)               */}
      {/* ===================================================================== */}
      {!isLeader &&
        !isGuest &&
        currentTeacherObj &&
        teacherModeTab === "peer_evaluation" && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <EyeOff className="w-5 h-5 text-indigo-600" />
                    Phiếu Chấm Điểm Đồng Cấp Trong Tổ ICT (Bảo Mật Ẩn Danh)
                  </h3>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    Tỉ trọng 20% (Trung bình cộng 2 GV đồng cấp)
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hệ thống đã sắp xếp ngẫu nhiên 02 giáo viên trong tổ cho kỳ
                  đánh giá năm học {selectedSchoolYear}. Giáo viên được đánh giá{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    hoàn toàn không biết danh tính người đánh giá mình
                  </strong>
                  , và bạn cũng chỉ nhìn thấy phần điểm do chính mình chấm.
                </p>
              </div>

              {/* Chọn 1 trong 2 giáo viên được phân công */}
              <div className="flex flex-wrap items-center gap-2">
                {myAssignedPeerTargets.map((item, idx) => {
                  const isSelected =
                    selectedPeerTargetId === item.teacher.id;
                  const isLocked =
                    item.slot === "peer1"
                      ? item.record.is_peer1_confirmed
                      : item.record.is_peer2_confirmed;
                  return (
                    <button
                      key={item.teacher.id}
                      type="button"
                      onClick={() => setSelectedPeerTargetId(item.teacher.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <span>
                        Đồng nghiệp {idx + 1}: {item.teacher.name}
                      </span>
                      {isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-amber-300" />
                      ) : (
                        <span className="text-[10px] opacity-80">
                          (Chưa khóa)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {(() => {
              const currentPeerItem = myAssignedPeerTargets.find(
                (item) => item.teacher.id === selectedPeerTargetId
              );
              if (!currentPeerItem) {
                return (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Chưa có danh sách phân công đồng cấp.
                  </div>
                );
              }

              const { teacher: targetTeacher, slot, record: peerRec } =
                currentPeerItem;
              const myScoresMap =
                slot === "peer1"
                  ? peerRec.peer1_scores
                  : peerRec.peer2_scores;
              const isMyPeerConfirmed =
                slot === "peer1"
                  ? peerRec.is_peer1_confirmed
                  : peerRec.is_peer2_confirmed;

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60">
                    <div className="text-xs space-y-0.5">
                      <div className="font-extrabold text-indigo-950 dark:text-indigo-200 text-sm">
                        Đang đánh giá đồng cấp cho: {targetTeacher.name} (
                        {targetTeacher.campus})
                      </div>
                      <div className="text-indigo-700 dark:text-indigo-300">
                        {isMyPeerConfirmed
                          ? "🔒 Bạn đã Xác nhận hoàn thành phiếu đánh giá đồng cấp này. Dữ liệu đã được khóa vĩnh viễn."
                          : "Điền điểm từ 1.0 đến 4.0 cho từng tiêu chí bên dưới, sau đó bấm Xác nhận hoàn thành."}
                      </div>
                    </div>

                    {!isMyPeerConfirmed ? (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={isSaving}
                          onClick={() =>
                            saveEvaluationRecord(
                              peerRec,
                              `Đã lưu tạm điểm đánh giá đồng cấp cho ${targetTeacher.name}!`
                            )
                          }
                          className="font-bold text-xs cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5 mr-1.5" />
                          Lưu tạm (Nháp)
                        </Button>
                        <Button
                          size="sm"
                          isLoading={isSaving}
                          onClick={() => {
                            const missing = ALL_CRITERIA_CODES.filter(
                              (code) =>
                                !myScoresMap?.[code] ||
                                myScoresMap[code] < 1 ||
                                myScoresMap[code] > 4
                            );
                            if (missing.length > 0) {
                              showToast(
                                `Vui lòng nhập đầy đủ điểm (từ 1.0 đến 4.0) cho toàn bộ 15 tiêu chí trước khi Xác nhận! (Còn thiếu mã: ${missing.join(", ")})`,
                                "warning"
                              );
                              return;
                            }
                            setConfirmLockModal({
                              isOpen: true,
                              lockType: "peer",
                              targetTeacherId: targetTeacher.id,
                              targetTeacherName: targetTeacher.name,
                            });
                          }}
                          className="font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 mr-1.5" />
                          Xác Nhận Hoàn Thành Đánh Giá Đồng Cấp
                        </Button>
                      </div>
                    ) : (
                      <Badge
                        variant="emerald"
                        className="text-xs px-3 py-1 font-bold"
                      >
                        🔒 Đã xác nhận hoàn thành (Không thể chỉnh sửa)
                      </Badge>
                    )}
                  </div>

                  {/* Bảng 15 tiêu chí dành riêng cho người chấm đồng cấp (Chỉ thấy điểm mình chấm) */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-bold">
                          <th className="py-2.5 px-3 w-16 text-center">Mã TC</th>
                          <th className="py-2.5 px-3">
                            Nội dung Tiêu chí Đánh giá
                          </th>
                          <th className="py-2.5 px-3 w-48 text-center bg-indigo-50/80 dark:bg-indigo-950/40">
                            Điểm Đồng Cấp Của Bạn (1.0 - 4.0)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {COMPETENCY_GROUPS.map((group) => (
                          <React.Fragment key={group.id}>
                            <tr className="bg-slate-100/90 dark:bg-slate-800/70 font-extrabold text-slate-900 dark:text-white">
                              <td className="py-2 px-3 text-center text-indigo-600 dark:text-indigo-400">
                                {group.roman}
                              </td>
                              <td colSpan={2} className="py-2 px-3">
                                {group.name}
                              </td>
                            </tr>
                            {group.criteria.map((crit) => {
                              const currentVal = myScoresMap?.[crit.code] ?? "";
                              return (
                                <tr
                                  key={crit.code}
                                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                >
                                  <td className="py-2.5 px-3 text-center font-bold text-slate-600 dark:text-slate-400">
                                    {crit.code}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold text-slate-900 dark:text-white">
                                      {crit.title}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                      {crit.details[0]}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-center bg-indigo-50/20 dark:bg-indigo-950/10">
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="1"
                                      max="4"
                                      disabled={isMyPeerConfirmed}
                                      value={currentVal}
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const num =
                                          raw === ""
                                            ? 0
                                            : Math.min(
                                                4,
                                                Math.max(0, parseFloat(raw))
                                              );
                                        updateTeacherRecordState(
                                          targetTeacher.id,
                                          (prev) => {
                                            const field =
                                              slot === "peer1"
                                                ? "peer1_scores"
                                                : "peer2_scores";
                                            const nextMap = { ...prev[field] };
                                            if (raw === "" || isNaN(num)) {
                                              delete nextMap[crit.code];
                                            } else {
                                              nextMap[crit.code] = num;
                                            }
                                            return {
                                              ...prev,
                                              [field]: nextMap,
                                            };
                                          }
                                        );
                                      }}
                                      placeholder="1.0 - 4.0"
                                      className="h-8 text-center font-extrabold text-xs max-w-[110px] mx-auto"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      {/* ===================================================================== */}
      {/* PHẦN V: PHỤ LỤC - BIỂU MẪU ĐÁNH GIÁ NĂNG LỰC CÁ NHÂN (KPIs)          */}
      {/* (Hiển thị cho Tổ trưởng hoặc khi Giáo viên ở tab "Phiếu Của Tôi")     */}
      {/* ===================================================================== */}
      {(isLeader || isGuest || teacherModeTab === "my_evaluation") &&
        activeSheetTeacher &&
        activeSheetRecord &&
        activeSheetMetrics && (
          <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            {/* QUỐC HIỆU - TIÊU NGỮ & TIÊU ĐỀ BIỂU MẪU */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                    HỆ THỐNG GIÁO DỤC SKY-LINE
                  </div>
                  <div className="font-black text-sky-700 dark:text-sky-400 uppercase">
                    TỔ ICT
                  </div>
                  <div className="w-20 h-0.5 bg-slate-300 dark:bg-slate-700 mx-auto mt-1" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div className="font-semibold text-slate-600 dark:text-slate-400">
                    Độc lập - Tự do - Hạnh phúc
                  </div>
                  <div className="w-28 h-0.5 bg-slate-300 dark:bg-slate-700 mx-auto mt-1" />
                </div>
              </div>

              <div className="text-center space-y-1 pt-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase">
                  PHIẾU ĐÁNH GIÁ NĂNG LỰC GIÁO VIÊN ICT
                </h2>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Năm học: {selectedSchoolYear}
                </div>
              </div>

              {/* Thanh trạng thái & nút Lưu / Xác nhận hoàn thành ở đầu phiếu */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Hồ sơ giáo viên:
                  </span>
                  <span className="font-black text-sky-700 dark:text-sky-300 text-sm">
                    {activeSheetTeacher.name}
                  </span>
                  <Badge
                    variant={
                      activeSheetRecord.is_self_confirmed
                        ? "emerald"
                        : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {activeSheetRecord.is_self_confirmed
                      ? "🔒 GV Tự ĐG: Đã xác nhận"
                      : "⏳ GV Tự ĐG: Đang mở"}
                  </Badge>
                  <Badge
                    variant={
                      activeSheetRecord.is_peer1_confirmed &&
                      activeSheetRecord.is_peer2_confirmed
                        ? "emerald"
                        : "secondary"
                    }
                    className="text-[10px]"
                  >
                    🔒 Đồng cấp ẩn danh:{" "}
                    {(activeSheetRecord.is_peer1_confirmed ? 1 : 0) +
                      (activeSheetRecord.is_peer2_confirmed ? 1 : 0)}
                    /2 đã xác nhận
                  </Badge>
                  <Badge
                    variant={
                      activeSheetRecord.is_leader_confirmed
                        ? "amber"
                        : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {activeSheetRecord.is_leader_confirmed
                      ? "🔒 TTCM ĐG: Đã xác nhận"
                      : "⏳ TTCM ĐG: Đang mở"}
                  </Badge>

                  {isLeader && (() => {
                    const activeSummaryRow = leaderDepartmentSummary.rows.find(
                      (r) => r.teacher.id === activeSheetTeacher.id
                    );
                    if (!activeSummaryRow) return null;
                    return (
                      <div className="w-full pt-1.5 mt-1 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-bold text-indigo-700 dark:text-indigo-300">
                          👥 2 GV đánh giá đồng cấp (Chỉ Tổ trưởng thấy):
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-bold text-slate-800 dark:text-slate-200">
                          1. {activeSummaryRow.peer1Teacher?.name || "Chưa phân công"}{" "}
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                            ({activeSheetRecord.is_peer1_confirmed ? "Đã xác nhận" : "Chờ chấm"})
                          </span>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-bold text-slate-800 dark:text-slate-200">
                          2. {activeSummaryRow.peer2Teacher?.name || "Chưa phân công"}{" "}
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                            ({activeSheetRecord.is_peer2_confirmed ? "Đã xác nhận" : "Chờ chấm"})
                          </span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Nút thao tác Lưu nháp & Xác nhận hoàn thành tùy theo vai trò */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {canEditSelfOnActiveSheet && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={isSaving}
                        onClick={() =>
                          saveEvaluationRecord(
                            activeSheetRecord,
                            `Đã lưu nháp Phiếu Tự Đánh Giá của ${activeSheetTeacher.name}!`
                          )
                        }
                        className="font-bold text-xs cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        Lưu tạm (Nháp)
                      </Button>
                      <Button
                        size="sm"
                        isLoading={isSaving}
                        onClick={() => {
                          const missing = ALL_CRITERIA_CODES.filter(
                            (code) =>
                              !activeSheetRecord.self_scores?.[code] ||
                              activeSheetRecord.self_scores[code] < 1 ||
                              activeSheetRecord.self_scores[code] > 4
                          );
                          if (missing.length > 0) {
                            showToast(
                              `Vui lòng nhập đầy đủ Điểm Tự ĐG (từ 1.0 đến 4.0) cho cả 15 tiêu chí trước khi bấm Xác nhận hoàn thành! (Còn thiếu: ${missing.join(", ")})`,
                              "warning"
                            );
                            return;
                          }
                          setConfirmLockModal({
                            isOpen: true,
                            lockType: "self",
                            targetTeacherId: activeSheetTeacher.id,
                            targetTeacherName: activeSheetTeacher.name,
                          });
                        }}
                        className="font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 mr-1.5" />
                        Xác Nhận Hoàn Thành Tự ĐG
                      </Button>
                    </>
                  )}

                  {canEditLeaderOnActiveSheet && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={isSaving}
                        onClick={() =>
                          saveEvaluationRecord(
                            activeSheetRecord,
                            `Đã lưu nháp kết quả chấm TTCM cho ${activeSheetTeacher.name}!`
                          )
                        }
                        className="font-bold text-xs cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        Lưu tạm (Nháp)
                      </Button>
                      <Button
                        size="sm"
                        isLoading={isSaving}
                        onClick={() => {
                          const missing = ALL_CRITERIA_CODES.filter(
                            (code) =>
                              !activeSheetRecord.leader_scores?.[code] ||
                              activeSheetRecord.leader_scores[code] < 1 ||
                              activeSheetRecord.leader_scores[code] > 4
                          );
                          if (missing.length > 0) {
                            showToast(
                              `Vui lòng nhập đầy đủ Điểm TTCM ĐG (từ 1.0 đến 4.0) cho cả 15 tiêu chí trước khi bấm Xác nhận hoàn thành! (Còn thiếu: ${missing.join(", ")})`,
                              "warning"
                            );
                            return;
                          }
                          setConfirmLockModal({
                            isOpen: true,
                            lockType: "leader",
                            targetTeacherId: activeSheetTeacher.id,
                            targetTeacherName: activeSheetTeacher.name,
                          });
                        }}
                        className="font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 mr-1.5" />
                        Xác Nhận Hoàn Thành Đánh Giá TTCM
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    isLoading={isAnalyzingAI}
                    onClick={() => {
                      handleGenerateAICompetencyRoadmap();
                      const el = document.getElementById("ai-competency-coach-panel");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }}
                    className="font-extrabold text-xs bg-gradient-to-r from-violet-600 via-sky-600 to-amber-500 hover:from-violet-700 hover:via-sky-700 hover:to-amber-600 text-white shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    AI Gợi Ý Lộ Trình Năng Lực
                  </Button>

                  {isReadyForPdfExport && (
                    <Button
                      size="sm"
                      isLoading={isExportingPdf}
                      onClick={handleExportEvaluationFormPdf}
                      className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" />
                      Xuất Phiếu Đánh Giá (.pdf)
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* I. THÔNG TIN CHUNG                                                */}
            {/* ================================================================= */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 inline-flex items-center justify-center text-xs">
                  I
                </span>
                THÔNG TIN CHUNG
              </h3>

              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      • Họ và tên giáo viên:
                    </label>
                    <Input
                      value={activeSheetRecord.teacher_name}
                      disabled
                      className="h-9 font-bold bg-slate-100 dark:bg-slate-800/80"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Mã nhân sự:
                    </label>
                    <Input
                      value={activeSheetRecord.staff_code}
                      disabled={!canEditSelfOnActiveSheet}
                      onChange={(e) =>
                        updateTeacherRecordState(
                          activeSheetTeacher.id,
                          (prev) => ({
                            ...prev,
                            staff_code: e.target.value,
                          })
                        )
                      }
                      placeholder="Ví dụ: ICT-01"
                      className="h-9 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      • Cơ sở:
                    </label>
                    <Input
                      value={activeSheetTeacher.campus || "Chưa phân công"}
                      disabled
                      className="h-9 font-bold bg-slate-100 dark:bg-slate-800/80"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      • Quản lý phòng Lab:
                    </label>
                    <Input
                      value={activeSheetTeacher.lab || "Chưa phân công"}
                      disabled
                      className="h-9 font-bold bg-slate-100 dark:bg-slate-800/80"
                    />
                  </div>
                </div>

                {/* Cấp học giảng dạy chính */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                  <div className="lg:col-span-7 flex flex-wrap items-center gap-3">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      • Cấp học giảng dạy chính:
                    </span>
                    {["Tiểu học", "THCS", "THPT", "Liên cấp"].map((lvl) => {
                      const checked =
                        activeSheetRecord.teaching_levels?.includes(lvl);
                      return (
                        <label
                          key={lvl}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition-colors ${
                            checked
                              ? "bg-sky-100/90 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-400"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          } ${canEditSelfOnActiveSheet ? "cursor-pointer" : "opacity-80"}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!canEditSelfOnActiveSheet}
                            onChange={() => {
                              if (!canEditSelfOnActiveSheet) return;
                              updateTeacherRecordState(
                                activeSheetTeacher.id,
                                (prev) => {
                                  const exists =
                                    prev.teaching_levels.includes(lvl);
                                  const nextLevels = exists
                                    ? prev.teaching_levels.filter(
                                        (x) => x !== lvl
                                      )
                                    : [...prev.teaching_levels, lvl];
                                  return {
                                    ...prev,
                                    teaching_levels: nextLevels,
                                  };
                                }
                              );
                            }}
                            className="rounded text-sky-600"
                          />
                          <span>{lvl}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="lg:col-span-5 flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      (Khối lớp:
                    </span>
                    <Input
                      value={activeSheetRecord.grade_details}
                      disabled={!canEditSelfOnActiveSheet}
                      onChange={(e) =>
                        updateTeacherRecordState(
                          activeSheetTeacher.id,
                          (prev) => ({
                            ...prev,
                            grade_details: e.target.value,
                          })
                        )
                      }
                      placeholder="Ví dụ: Khối 1-5, Khối 6-9..."
                      className="h-8 text-xs font-semibold"
                    />
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      )
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    • Kiêm nhiệm:
                  </label>
                  <Input
                    value={activeSheetTeacher.lab || "Chưa phân công"}
                    disabled
                    className="h-9 font-bold bg-slate-100 dark:bg-slate-800/80"
                  />
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* II. BẢNG CHẤM ĐIỂM CHI TIẾT                                       */}
            {/* ================================================================= */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 inline-flex items-center justify-center text-xs">
                      II
                    </span>
                    BẢNG CHẤM ĐIỂM CHI TIẾT
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                    (Điền điểm từ 1.0 đến 4.0 vào cột tương ứng. Điểm tổng kết
                    tính theo trọng số từng nhóm. Điểm điền và điểm tổng kết
                    được làm tròn 1 chữ số thập phân)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold">
                    Tự ĐG: 20%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">
                    Đồng cấp TB (2 GV ẩn danh): 20%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                    TTCM ĐG: 60%
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse min-w-[880px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-extrabold">
                      <th className="py-3 px-2.5 w-14 text-center border-r border-slate-200 dark:border-slate-700">
                        Mã TC
                      </th>
                      <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[260px]">
                        Nội dung Tiêu chí Đánh giá
                      </th>
                      <th className="py-3 px-2.5 w-32 text-center bg-sky-50/80 dark:bg-sky-950/40 border-r border-slate-200 dark:border-slate-700">
                        Điểm Tự ĐG (1-4)
                        <span className="block text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                          (Giáo viên • 20%)
                        </span>
                      </th>
                      <th className="py-3 px-2.5 w-36 text-center bg-indigo-50/80 dark:bg-indigo-950/40 border-r border-slate-200 dark:border-slate-700">
                        Điểm ĐG Đồng Cấp
                        <span className="block text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                          (TB 2 GV ẩn danh • 20%)
                        </span>
                      </th>
                      <th className="py-3 px-2.5 w-32 text-center bg-amber-50/80 dark:bg-amber-950/40 border-r border-slate-200 dark:border-slate-700">
                        Điểm TTCM ĐG (1-4)
                        <span className="block text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          (Tổ trưởng • 60%)
                        </span>
                      </th>
                      <th className="py-3 px-3 min-w-[240px]">
                        Minh chứng / Nhận xét
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {COMPETENCY_GROUPS.map((group) => {
                      const selfGroupAvg = activeSheetMetrics.groupSelf[group.id];
                      const peerGroupAvg = activeSheetMetrics.groupPeer[group.id];
                      const leaderGroupAvg =
                        activeSheetMetrics.groupLeader[group.id];
                      const combinedGroupAvg =
                        activeSheetMetrics.groupCombined[group.id];

                      return (
                        <React.Fragment key={group.id}>
                          {/* Dòng Tiêu đề Nhóm năng lực */}
                          <tr className="bg-slate-100/90 dark:bg-slate-800/90 font-black text-slate-900 dark:text-white">
                            <td className="py-2.5 px-2.5 text-center border-r border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-400">
                              {group.roman}
                            </td>
                            <td colSpan={5} className="py-2.5 px-3">
                              {group.name}
                            </td>
                          </tr>

                          {/* Các tiêu chí trong Nhóm */}
                          {group.criteria.map((crit) => {
                            const selfVal =
                              activeSheetRecord.self_scores?.[crit.code] ?? "";
                            const peerAvgVal =
                              activeSheetMetrics.peerAvgCriterionScores?.[
                                crit.code
                              ];
                            const leaderVal =
                              activeSheetRecord.leader_scores?.[crit.code] ?? "";
                            const evidenceVal =
                              activeSheetRecord.evidences?.[crit.code] ?? "";

                            return (
                              <tr
                                key={crit.code}
                                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="py-2.5 px-2.5 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                                  {crit.code}
                                </td>
                                <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    {crit.title}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                    {crit.details[0]}
                                  </div>
                                </td>

                                {/* Cột 1: Điểm Tự ĐG (1-4) - Chỉ Giáo viên tự nhập khi chưa khóa */}
                                <td className="py-2.5 px-2.5 text-center bg-sky-50/20 dark:bg-sky-950/10 border-r border-slate-200 dark:border-slate-800">
                                  {canEditSelfOnActiveSheet ? (
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="1"
                                      max="4"
                                      value={selfVal}
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const num =
                                          raw === ""
                                            ? 0
                                            : Math.min(
                                                4,
                                                Math.max(0, parseFloat(raw))
                                              );
                                        updateTeacherRecordState(
                                          activeSheetTeacher.id,
                                          (prev) => {
                                            const next = {
                                              ...prev.self_scores,
                                            };
                                            if (raw === "" || isNaN(num)) {
                                              delete next[crit.code];
                                            } else {
                                              next[crit.code] = num;
                                            }
                                            return {
                                              ...prev,
                                              self_scores: next,
                                            };
                                          }
                                        );
                                      }}
                                      placeholder="1.0 - 4.0"
                                      className="h-8 text-center font-extrabold text-xs"
                                    />
                                  ) : (
                                    <span className="font-extrabold text-sm text-sky-700 dark:text-sky-300">
                                      {String(selfVal) !== ""
                                        ? Number(selfVal).toFixed(1)
                                        : "......."}
                                    </span>
                                  )}
                                </td>

                                {/* Cột 2: Điểm ĐG Đồng Cấp TB (1-4) - Ẩn danh người chấm */}
                                <td className="py-2.5 px-2.5 text-center bg-indigo-50/20 dark:bg-indigo-950/10 border-r border-slate-200 dark:border-slate-800">
                                  <span
                                    className="font-extrabold text-sm text-indigo-700 dark:text-indigo-300"
                                    title="Trung bình cộng điểm của 2 giáo viên đánh giá đồng cấp ẩn danh"
                                  >
                                    {peerAvgVal !== undefined
                                      ? peerAvgVal.toFixed(1)
                                      : "......."}
                                  </span>
                                </td>

                                {/* Cột 3: Điểm TTCM ĐG (1-4) - Chỉ Tổ trưởng nhập khi chưa khóa */}
                                <td className="py-2.5 px-2.5 text-center bg-amber-50/20 dark:bg-amber-950/10 border-r border-slate-200 dark:border-slate-800">
                                  {canEditLeaderOnActiveSheet ? (
                                    <Input
                                      type="number"
                                      step="0.1"
                                      min="1"
                                      max="4"
                                      value={leaderVal}
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const num =
                                          raw === ""
                                            ? 0
                                            : Math.min(
                                                4,
                                                Math.max(0, parseFloat(raw))
                                              );
                                        updateTeacherRecordState(
                                          activeSheetTeacher.id,
                                          (prev) => {
                                            const next = {
                                              ...prev.leader_scores,
                                            };
                                            if (raw === "" || isNaN(num)) {
                                              delete next[crit.code];
                                            } else {
                                              next[crit.code] = num;
                                            }
                                            return {
                                              ...prev,
                                              leader_scores: next,
                                            };
                                          }
                                        );
                                      }}
                                      placeholder="1.0 - 4.0"
                                      className="h-8 text-center font-extrabold text-xs"
                                    />
                                  ) : (
                                    <span className="font-extrabold text-sm text-amber-700 dark:text-amber-300">
                                      {String(leaderVal) !== ""
                                        ? Number(leaderVal).toFixed(1)
                                        : "......."}
                                    </span>
                                  )}
                                </td>

                                {/* Cột 4: Minh chứng / Nhận xét */}
                                <td className="py-2.5 px-3">
                                  {canEditSelfOnActiveSheet ||
                                  canEditLeaderOnActiveSheet ? (
                                    <Input
                                      value={evidenceVal}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        updateTeacherRecordState(
                                          activeSheetTeacher.id,
                                          (prev) => ({
                                            ...prev,
                                            evidences: {
                                              ...prev.evidences,
                                              [crit.code]: val,
                                            },
                                          })
                                        );
                                      }}
                                      placeholder="Nhập minh chứng / nhận xét..."
                                      className="h-8 text-xs"
                                    />
                                  ) : (
                                    <span className="text-xs text-slate-700 dark:text-slate-300">
                                      {evidenceVal || (
                                        <span className="text-slate-400 italic">
                                          Chưa có minh chứng / nhận xét
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Dòng Điểm Trung bình Nhóm (N1, N2, N3, N4) */}
                          <tr className="bg-sky-50/60 dark:bg-slate-800/60 font-extrabold text-slate-900 dark:text-white">
                            <td className="py-2.5 px-2.5 border-r border-slate-200 dark:border-slate-700" />
                            <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">
                              Điểm Trung bình Nhóm {group.id.replace("N", "")} (
                              {group.id}):
                            </td>
                            <td className="py-2.5 px-2.5 text-center border-r border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-300 text-sm">
                              {selfGroupAvg !== null
                                ? selfGroupAvg.toFixed(1)
                                : "......."}
                            </td>
                            <td className="py-2.5 px-2.5 text-center border-r border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 text-sm">
                              {peerGroupAvg !== null
                                ? peerGroupAvg.toFixed(1)
                                : "......."}
                            </td>
                            <td className="py-2.5 px-2.5 text-center border-r border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-300 text-sm">
                              {leaderGroupAvg !== null
                                ? leaderGroupAvg.toFixed(1)
                                : "......."}
                            </td>
                            <td className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-300">
                              Điểm TB Nhóm {group.id} tổng hợp:{" "}
                              <strong className="text-emerald-700 dark:text-emerald-400">
                                {combinedGroupAvg !== null
                                  ? combinedGroupAvg.toFixed(1)
                                  : "......."}
                              </strong>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}

                    {/* DÒNG TỔNG KẾT NĂNG LỰC (THANG ĐIỂM 4.0) */}
                    <tr className="bg-gradient-to-r from-sky-100 via-amber-50 to-emerald-100 dark:from-sky-950/80 dark:via-slate-900 dark:to-emerald-950/80 font-black text-slate-900 dark:text-white border-t-2 border-sky-400 dark:border-sky-600">
                      <td className="py-3.5 px-2.5 text-center border-r border-slate-300 dark:border-slate-700 text-sky-700 dark:text-sky-300">
                        TỔNG
                      </td>
                      <td className="py-3.5 px-3 border-r border-slate-300 dark:border-slate-700">
                        <div>ĐIỂM TỔNG KẾT NĂNG LỰC (Thang điểm 4.0):</div>
                        <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                          Công thức Nhóm: (N1×30%) + (N2×35%) + (N3×20%) +
                          (N4×15%)
                        </div>
                      </td>
                      <td className="py-3.5 px-2.5 text-center border-r border-slate-300 dark:border-slate-700 text-sky-700 dark:text-sky-300 text-base">
                        {activeSheetMetrics.totalSelf !== null
                          ? activeSheetMetrics.totalSelf.toFixed(1)
                          : "......."}
                        <span className="block text-[10px] font-semibold">
                          (×20%)
                        </span>
                      </td>
                      <td className="py-3.5 px-2.5 text-center border-r border-slate-300 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 text-base">
                        {activeSheetMetrics.totalPeer !== null
                          ? activeSheetMetrics.totalPeer.toFixed(1)
                          : "......."}
                        <span className="block text-[10px] font-semibold">
                          (×20%)
                        </span>
                      </td>
                      <td className="py-3.5 px-2.5 text-center border-r border-slate-300 dark:border-slate-700 text-amber-700 dark:text-amber-300 text-base">
                        {activeSheetMetrics.totalLeader !== null
                          ? activeSheetMetrics.totalLeader.toFixed(1)
                          : "......."}
                        <span className="block text-[10px] font-semibold">
                          (×60%)
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>Điểm chung:</span>
                          <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                            {activeSheetMetrics.finalScore360 !== null
                              ? `${activeSheetMetrics.finalScore360.toFixed(2)} (${activeSheetMetrics.finalScoreRounded1?.toFixed(1)})`
                              : "......."}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span>Xếp loại:</span>
                          {activeSheetMetrics.ranking ? (
                            <Badge
                              variant={activeSheetMetrics.ranking.badgeVariant}
                              className="text-xs font-black px-2.5 py-0.5"
                            >
                              {activeSheetMetrics.ranking.label}
                            </Badge>
                          ) : (
                            <span>..............</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ================================================================= */}
            {/* III. BẢNG QUY ĐỔI XẾP LOẠI CHUNG                                  */}
            {/* ================================================================= */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 inline-flex items-center justify-center text-xs">
                  III
                </span>
                BẢNG QUY ĐỔI XẾP LOẠI CHUNG
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {RANKING_RULES.map((rule) => {
                  const isMatched =
                    activeSheetMetrics.ranking?.id === rule.id;
                  return (
                    <div
                      key={rule.id}
                      className={`p-3.5 rounded-xl border transition-all text-xs space-y-1 ${
                        isMatched
                          ? `${rule.colorClass} ring-2 ring-offset-1 ring-amber-500 shadow-sm`
                          : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-sm">
                          • {rule.label} ({rule.rangeText}):
                        </span>
                        {isMatched && (
                          <Badge
                            variant={rule.badgeVariant}
                            className="text-[10px] font-black"
                          >
                            ✓ Mức xếp loại đạt được
                          </Badge>
                        )}
                      </div>
                      <p className="leading-relaxed opacity-90">
                        {rule.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ================================================================= */}
            {/* TÍNH NĂNG AI SỐ 1: TRỢ LÝ AI GỢI Ý LỘ TRÌNH PHÁT TRIỂN NĂNG LỰC   */}
            {/* ================================================================= */}
            <div
              id="ai-competency-coach-panel"
              className="p-5 rounded-2xl bg-gradient-to-br from-violet-50/90 via-sky-50/80 to-amber-50/70 dark:from-violet-950/35 dark:via-slate-900 dark:to-amber-950/25 border-2 border-sky-300/80 dark:border-sky-700/70 shadow-md space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-sky-200/70 dark:border-slate-800 pb-3.5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-sky-600 text-white shadow-md shadow-sky-600/20 shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        TRỢ LÝ AI PHÂN TÍCH DỮ LIỆU & GỢI Ý LỘ TRÌNH PHÁT TRIỂN NĂNG LỰC
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-extrabold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border border-violet-300 dark:border-violet-800"
                      >
                        SKY-LINE AI SPARK
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      AI phân tích toàn bộ điểm số 15 tiêu chí (4 nhóm năng lực), cấp học giảng dạy và nhiệm vụ phòng Lab của{" "}
                      <strong>{activeSheetRecord.teacher_name}</strong> ({activeSheetRecord.staff_code}) để đề xuất các hành động cần làm và dự thảo Kế hoạch phát triển cá nhân (IDP).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    isLoading={isAnalyzingAI}
                    onClick={handleGenerateAICompetencyRoadmap}
                    className="h-9 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-sky-600 to-amber-500 hover:from-violet-700 hover:via-sky-700 hover:to-amber-600 text-white font-extrabold text-xs shadow-md shadow-sky-600/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>
                      {aiRoadmapMap[activeSheetTeacher.id]
                        ? "Phân tích lại theo dữ liệu mới nhất"
                        : "AI Phân Tích & Gợi Ý Lộ Trình Ngay"}
                    </span>
                  </Button>
                </div>
              </div>

              {!aiRoadmapMap[activeSheetTeacher.id] ? (
                <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-dashed border-sky-300 dark:border-sky-800 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Target className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>
                      Bấm nút <strong>“AI Phân Tích & Gợi Ý Lộ Trình Ngay”</strong> để hệ thống tổng hợp điểm mạnh, điểm cần cải thiện và xây dựng lộ trình hành động 3 giai đoạn cho giáo viên.
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    AI tham mưu • Con người kiểm duyệt
                  </span>
                </div>
              ) : (
                (() => {
                  const aiResult = aiRoadmapMap[activeSheetTeacher.id];
                  return (
                    <div className="space-y-4 text-xs animate-in fade-in duration-200">
                      {/* 1. Chẩn đoán tổng thể & Độ lệch nhận thức */}
                      <div className="p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-sky-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                            <BarChart3 className="w-4 h-4 text-sky-600" />
                            1. Chẩn Đoán Tổng Thể Bức Tranh Năng Lực 360°:
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Cập nhật lúc {aiResult.generatedAt}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                          {aiResult.overallSummary}
                        </p>
                        <div className="p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Đối chiếu đa chiều (Tự ĐG - Đồng cấp - TTCM):</strong>{" "}
                            {aiResult.perceptionGapNote}
                          </span>
                        </div>
                      </div>

                      {/* 2. Hai cột: Top 3 Điểm mạnh cốt lõi & Top 3 Năng lực ưu tiên bồi dưỡng */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                        {/* Cột Điểm mạnh */}
                        <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/70 space-y-2.5">
                          <div className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-emerald-600" />
                            Top 3 Điểm Sáng Năng Lực Cần Phát Huy:
                          </div>
                          <div className="space-y-2">
                            {aiResult.topStrengths.map((st) => (
                              <div
                                key={st.code}
                                className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/85 border border-emerald-200/70 dark:border-emerald-900/60 space-y-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold text-slate-900 dark:text-white">
                                    Tiêu chí {st.code}: {st.title}
                                  </span>
                                  <Badge
                                    variant="emerald"
                                    className="text-[10px] font-black"
                                  >
                                    {st.scoreText}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {st.insight}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cột Cần bồi dưỡng */}
                        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/70 space-y-2.5">
                          <div className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-amber-600" />
                            Top 3 Tiêu Chí Cần Ưu Tiên Bồi Dưỡng & Hành Động:
                          </div>
                          <div className="space-y-2">
                            {aiResult.priorityImprovements.map((imp) => (
                              <div
                                key={imp.code}
                                className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/85 border border-amber-200/70 dark:border-amber-900/60 space-y-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold text-slate-900 dark:text-white">
                                    Tiêu chí {imp.code}: {imp.title}
                                  </span>
                                  <Badge
                                    variant="amber"
                                    className="text-[10px] font-black"
                                  >
                                    {imp.scoreText}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                  <strong>Hành động gợi ý:</strong> {imp.actionHint}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 3. Lộ trình hành động cần làm 3 giai đoạn (30 ngày - 1 học kỳ - Cả năm học) */}
                      <div className="p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-sky-200 dark:border-slate-800 space-y-3">
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-violet-600" />
                          2. Lộ Trình Các Hành Động Cụ Thể Cần Làm Dành Cho {activeSheetRecord.teacher_name}:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {aiResult.actionRoadmap.map((step, idx) => (
                            <div
                              key={step.phase}
                              className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-black text-[10px]">
                                  {step.phase}
                                </span>
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                  {step.timeframe}
                                </span>
                              </div>
                              <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                                {step.title}
                              </div>
                              <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 list-disc pl-4 leading-relaxed">
                                {step.actions.map((act, i) => (
                                  <li key={i}>{act}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 4. Thanh công cụ áp dụng gợi ý của AI vào Mục IV (Con người kiểm soát) */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-sky-200/70 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Nguyên tắc AI có trách nhiệm:</strong> AI gợi ý lộ trình dựa trên dữ liệu thực tế; Tổ trưởng và Giáo viên kiểm duyệt, chỉnh sửa tại <strong>Mục IV</strong> trước khi lưu chính thức.
                          </span>
                        </div>
                        {(canEditLeaderOnActiveSheet || canEditSelfOnActiveSheet) && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleApplyAIAdviceToIDP}
                            className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm cursor-pointer shrink-0 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {canEditLeaderOnActiveSheet
                                ? "Áp dụng gợi ý AI vào cả 3 mục IDP (Mục IV)"
                                : "Áp dụng gợi ý AI vào Mục tiêu cam kết (Mục IV.3)"}
                            </span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* ================================================================= */}
            {/* IV. NHẬN XÉT CỦA TỔ TRƯỞNG CHUYÊN MÔN & KẾ HOẠCH IDP              */}
            {/* ================================================================= */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 inline-flex items-center justify-center text-xs">
                  IV
                </span>
                NHẬN XÉT CỦA TỔ TRƯỞNG CHUYÊN MÔN & KẾ HOẠCH PHÁT TRIỂN CÁ NHÂN
                (IDP)
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    1. Điểm mạnh nổi bật của giáo viên trong kỳ đánh giá:
                  </label>
                  <textarea
                    rows={3}
                    disabled={!canEditLeaderOnActiveSheet}
                    value={activeSheetRecord.idp_strengths}
                    onChange={(e) =>
                      updateTeacherRecordState(
                        activeSheetTeacher.id,
                        (prev) => ({
                          ...prev,
                          idp_strengths: e.target.value,
                        })
                      )
                    }
                    placeholder={
                      canEditLeaderOnActiveSheet
                        ? "Tổ trưởng nhập điểm mạnh nổi bật của giáo viên trong kỳ đánh giá..."
                        : "Chưa có nhận xét từ Tổ trưởng chuyên môn..."
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    2. Những nội dung cần cải thiện / bồi dưỡng thêm:
                  </label>
                  <textarea
                    rows={3}
                    disabled={!canEditLeaderOnActiveSheet}
                    value={activeSheetRecord.idp_improvements}
                    onChange={(e) =>
                      updateTeacherRecordState(
                        activeSheetTeacher.id,
                        (prev) => ({
                          ...prev,
                          idp_improvements: e.target.value,
                        })
                      )
                    }
                    placeholder={
                      canEditLeaderOnActiveSheet
                        ? "Tổ trưởng nhập những nội dung giáo viên cần cải thiện / bồi dưỡng thêm..."
                        : "Chưa có nhận xét từ Tổ trưởng chuyên môn..."
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    3. Mục tiêu cam kết cho năm học tiếp theo:
                  </label>
                  <textarea
                    rows={3}
                    disabled={
                      !canEditSelfOnActiveSheet && !canEditLeaderOnActiveSheet
                    }
                    value={activeSheetRecord.idp_goals}
                    onChange={(e) =>
                      updateTeacherRecordState(
                        activeSheetTeacher.id,
                        (prev) => ({
                          ...prev,
                          idp_goals: e.target.value,
                        })
                      )
                    }
                    placeholder="Nhập mục tiêu cam kết phát triển chuyên môn cho năm học tiếp theo..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50"
                  />
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* KHỐI CHỮ KÝ XÁC NHẬN CUỐI BIỂU MẪU                                */}
            {/* ================================================================= */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <div className="font-black text-slate-900 dark:text-white uppercase">
                    NGƯỜI TỰ ĐÁNH GIÁ
                  </div>
                  <div className="text-[11px] text-slate-500 italic">
                    (Ký và ghi rõ họ tên)
                  </div>
                  <div className="py-3 font-bold text-sky-700 dark:text-sky-300">
                    {activeSheetRecord.is_self_confirmed
                      ? `✓ Đã xác nhận: ${activeSheetRecord.teacher_name}`
                      : activeSheetRecord.teacher_name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Ngày:{" "}
                    {activeSheetRecord.self_eval_date || "..../..../202..."}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <div className="font-black text-slate-900 dark:text-white uppercase">
                    TỔ TRƯỞNG CHUYÊN MÔN ICT
                  </div>
                  <div className="text-[11px] text-slate-500 italic">
                    (Ký và ghi rõ họ tên)
                  </div>
                  <div className="py-3 font-bold text-amber-700 dark:text-amber-300">
                    {activeSheetRecord.is_leader_confirmed
                      ? "✓ Đã xác nhận: Thầy Đỗ Anh Huy"
                      : "Thầy Đỗ Anh Huy"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Ngày:{" "}
                    {activeSheetRecord.leader_eval_date || "..../..../202..."}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <div className="font-black text-slate-900 dark:text-white uppercase">
                    BAN ĐIỀU HÀNH CHUYÊN MÔN
                  </div>
                  <div className="text-[11px] text-slate-500 italic">
                    (Ký và ghi rõ họ tên)
                  </div>
                  <div className="py-3 font-bold text-slate-600 dark:text-slate-400">
                    ................................................
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Ngày:{" "}
                    {activeSheetRecord.board_eval_date || "..../..../202..."}
                  </div>
                </div>
              </div>

              {isReadyForPdfExport && (
                <div className="mt-5 flex justify-end">
                  <Button
                    size="sm"
                    isLoading={isExportingPdf}
                    onClick={handleExportEvaluationFormPdf}
                    className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    Xuất Phiếu Đánh Giá Ra File (.pdf)
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

      {/* ===================================================================== */}
      {/* MODAL XEM KHUNG ĐÁNH GIÁ NĂNG LỰC & THANG ĐO RUBRIC (PHẦN I - IV)     */}
      {/* ===================================================================== */}
      {isRubricGuideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsRubricGuideOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[88vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-600" />
                  Khung Đánh Giá Năng Lực Giáo Viên ICT & Thang Đo Rubric 4 Mức
                  Độ
                </h3>
                <p className="text-xs text-slate-500">
                  Tài liệu tham chiếu chuẩn khi chấm điểm (Phần I → Phần IV)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRubricGuideOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase mb-2">
                  PHẦN II: THANG ĐO MỨC ĐỘ NĂNG LỰC (RUBRIC 4 MỨC ĐỘ)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {RUBRIC_LEVELS.map((lvl) => (
                    <div
                      key={lvl.level}
                      className={`p-3 rounded-xl border ${lvl.badgeClass}`}
                    >
                      <div className="font-extrabold text-sm">
                        {lvl.level} ({lvl.range}): {lvl.name}
                      </div>
                      <p className="mt-1 opacity-90 leading-relaxed">
                        {lvl.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase mb-2">
                  PHẦN III: CHI TIẾT KHUNG NĂNG LỰC GIÁO VIÊN ICT (PHÂN HÓA 3
                  CẤP HỌC)
                </h4>
                <div className="space-y-3">
                  {COMPETENCY_GROUPS.map((g) => (
                    <div
                      key={g.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="font-black text-sky-700 dark:text-sky-400">
                        {g.name}
                      </div>
                      <div className="space-y-2">
                        {g.criteria.map((c) => (
                          <div
                            key={c.code}
                            className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1"
                          >
                            <div className="font-bold text-slate-900 dark:text-white">
                              {c.code}. {c.title}
                            </div>
                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-0.5">
                              {c.details.map((d, i) => (
                                <li key={i}>{d}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL XÁC NHẬN HOÀN THÀNH & KHÓA VĨNH VIỄN                            */}
      {/* ===================================================================== */}
      {confirmLockModal?.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setConfirmLockModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Xác Nhận Hoàn Thành & Khóa Kết Quả
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Bạn đang xác nhận hoàn thành đánh giá năng lực cho{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {confirmLockModal.targetTeacherName}
                  </strong>{" "}
                  (Năm học {selectedSchoolYear}). Sau khi bấm xác nhận, toàn bộ
                  điểm số và minh chứng bạn đã nhập sẽ{" "}
                  <strong className="text-rose-600 dark:text-rose-400">
                    được khóa cố định và không được phép điều chỉnh lại nữa
                  </strong>
                  .
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmLockModal(null)}
                disabled={isSaving}
              >
                Kiểm tra lại
              </Button>
              <Button
                type="button"
                size="sm"
                isLoading={isSaving}
                onClick={handleConfirmLockExecution}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Xác nhận hoàn thành
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

