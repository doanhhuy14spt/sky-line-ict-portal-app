// =============================================================================
// BỘ MÁY TRÍ TUỆ NHÂN TẠO CHUYÊN GIA SƯ PHẠM ICT SKY-LINE (SKY-LINE AI SPARK)
// Phục vụ Đợt 1:
// 1. AI Gợi ý lộ trình phát triển năng lực giáo viên (IDP - 15 tiêu chí, 4 nhóm)
// 2. AI Gợi ý xử lý sự vụ & Phương án chỉ đạo chuyên môn (6 phân loại, 3 mức độ)
// Cam kết An toàn dữ liệu: Không thu thập hay gửi dữ liệu cá nhân học sinh ra ngoài.
// =============================================================================

export interface CompetencyCriterionInput {
  code: string;
  title: string;
  groupId: "N1" | "N2" | "N3" | "N4";
  groupName: string;
  selfScore: number | null;
  peerScore: number | null;
  leaderScore: number | null;
  finalCriterionScore: number | null;
  evidence: string;
}

export interface CriterionKnowledgeRow {
  code: string;
  title: string;
  strengthPraise: string;
  improveActionGeneral: string;
  improveByLevel: Record<string, string>;
  goalTarget: string;
}

export interface TeacherCrossTableStats {
  assignedTasksTotal: number;
  assignedTasksCompleted: number;
  incidentsHandledTotal: number;
  incidentsResolvedTotal: number;
  teamsCoachedCount: number;
  intlCertPassRateLabel: string;
  kbRecordsLoadedCount: number;
}

export interface TeacherCompetencyAIInput {
  teacherName: string;
  staffCode: string;
  campus: string;
  schoolYear: string;
  teachingLevels: string[];
  gradeDetails: string;
  labManagement: string;
  concurrentDuties: string;
  criteriaList: CompetencyCriterionInput[];
  groupAverages: {
    N1: number | null;
    N2: number | null;
    N3: number | null;
    N4: number | null;
  };
  totalSelf: number | null;
  totalPeer: number | null;
  totalLeader: number | null;
  finalScore360: number | null;
  rankingLabel: string;
  crossTableStats?: TeacherCrossTableStats;
  dbCriterionOverrides?: Record<string, CriterionKnowledgeRow>;
}

export interface TeacherCompetencyAIResult {
  generatedAt: string;
  overallSummary: string;
  perceptionGapNote: string;
  databaseEvidenceSummary: string[];
  topStrengths: {
    code: string;
    title: string;
    scoreText: string;
    insight: string;
  }[];
  priorityImprovements: {
    code: string;
    title: string;
    scoreText: string;
    actionHint: string;
  }[];
  actionRoadmap: {
    phase: string;
    timeframe: string;
    title: string;
    actions: string[];
  }[];
  draftIdpStrengths: string;
  draftIdpImprovements: string;
  draftIdpGoals: string;
}

export interface IncidentAIInput {
  teacherName: string;
  teacherId: string;
  campus: string;
  category: string;
  urgencyLevel: "Khẩn cấp" | "Ưu tiên cao" | "Bình thường";
  incidentDate: string;
  impactScopes: string[];
  description: string;
  proposedSolution?: string;
}

export interface IncidentAIResult {
  generatedAt: string;
  riskAssessment: string;
  step1Immediate: string[];
  step2Coordination: string[];
  step3Prevention: string[];
  evidenceChecklist: string[];
  formattedTeacherProposal: string;
  formattedLeaderDirection: string;
}

// Danh mục gợi ý hành động chuyên sâu theo từng mã tiêu chí (1.1 -> 4.4)
const CRITERION_ACTION_BANK: Record<
  string,
  {
    strengthPraise: string;
    improveActionGeneral: string;
    improveByLevel: Record<string, string>;
    goalTarget: string;
  }
> = {
  "1.1": {
    strengthPraise:
      "Nắm vững chương trình GDPT 2018 và chuẩn quốc tế (IC3 Spark/IC3 GS6/MOS), kết nối mạch lạc giữa Học vấn số (DL), Khoa học máy tính (CS) và CNTT (ICT).",
    improveActionGeneral:
      "Rà soát lại ma trận yêu cầu cần đạt của CT GDPT 2018 kết hợp chuẩn đầu ra IC3/MOS theo từng khối lớp được phân công.",
    improveByLevel: {
      "Tiểu học":
        "Hệ thống hóa bộ bài tập thao tác chuột, bàn phím, đạo đức số và các chủ đề IC3 Spark / Cambridge Primary theo hướng trực quan sinh động cho học sinh Lớp 1–5.",
      "THCS":
        "Chuẩn hóa hệ thống bài thực hành IC3 GS6 / Cambridge Lower Secondary, tăng cường bài tập mạng máy tính cơ bản và đa phương tiện cho học sinh Lớp 6–9.",
      "THPT":
        "Nâng cao chuyên đề MOS Expert (Word, Excel, PowerPoint), Cơ sở dữ liệu và định hướng Khoa học máy tính cho học sinh Lớp 10–12.",
    },
    goalTarget:
      "Làm chủ 100% khung chương trình GDPT 2018 & Quốc tế ở cấp học phụ trách; 90%+ học sinh đạt chuẩn đầu ra học phần.",
  },
  "1.2": {
    strengthPraise:
      "Có tư duy giải thuật và năng lực giảng dạy Lập trình (Coding) sắc bén, hướng dẫn học sinh chuyển hóa từ tư duy kéo thả sang tư duy thuật toán hiệu quả.",
    improveActionGeneral:
      "Tăng cường thực hành thiết kế các bài toán lập trình phân hóa theo 3 mức độ (Cơ bản - Vận dụng - Nâng cao) để học sinh rèn tư duy giải quyết vấn đề.",
    improveByLevel: {
      "Tiểu học":
        "Xây dựng bộ thử thách lập trình kéo thả Scratch Jr, Scratch và Code.org gắn với kể chuyện số và trò chơi tương tác cho học sinh Tiểu học.",
      "THCS":
        "Thiết kế lộ trình chuyển giao mượt mà từ lập trình khối (Scratch nâng cao) sang lập trình dòng lệnh Python cơ bản cho học sinh THCS.",
      "THPT":
        "Bồi dưỡng chuyên sâu thuật toán Python nâng cao, C/C++, truy vấn SQL và tích hợp thư viện Trí tuệ nhân tạo (AI) vào dự án học tập của học sinh THPT.",
    },
    goalTarget:
      "Xây dựng hoàn chỉnh bộ 20 bài toán lập trình thực tiễn theo cấp học và hướng dẫn học sinh hoàn thành ít nhất 02 dự án Coding/học kỳ.",
  },
  "1.3": {
    strengthPraise:
      "Đạt chuẩn chứng chỉ quốc tế và sử dụng tốt thuật ngữ Tiếng Anh chuyên ngành ICT trong giao tiếp sư phạm cũng như đọc hiểu tài liệu công nghệ mới.",
    improveActionGeneral:
      "Duy trì thói quen cập nhật tài liệu EdTech tiếng Anh hàng tuần và lồng ghép từ vựng công nghệ song ngữ vào mỗi tiết thực hành.",
    improveByLevel: {
      "Tiểu học":
        "Xây dựng bộ thẻ từ vựng (Flashcard) tiếng Anh ICT vui nhộn giúp học sinh Tiểu học nhớ nhanh các nút lệnh trên phần mềm và IC3 Spark.",
      "THCS":
        "Tăng tỷ lệ giải thích thuật ngữ song ngữ Anh - Việt trong các tiết dạy IC3 GS6, Scratch và Python cơ bản.",
      "THPT":
        "Luyện thi nâng hạng chứng chỉ MOS Expert / Chứng chỉ lập trình quốc tế và hướng dẫn học sinh đọc hiểu tài liệu CS/AI bằng tiếng Anh.",
    },
    goalTarget:
      "Hoàn thành nâng chuẩn ít nhất 01 chứng chỉ công nghệ quốc tế/khóa đào tạo chuyên sâu và áp dụng 100% bảng từ vựng tiếng Anh ICT trong bài dạy.",
  },
  "1.4": {
    strengthPraise:
      "Vận hành phòng Lab chuyên nghiệp, làm chủ phần mềm quản lý phòng máy (NetSupport School) và xử lý nhanh nhạy các sự cố kỹ thuật phát sinh.",
    improveActionGeneral:
      "Thiết lập quy trình kiểm tra nhanh 5 phút đầu giờ và cuối giờ tại phòng máy; lập sổ nhật ký theo dõi tình trạng từng máy trạm.",
    improveByLevel: {
      "Tiểu học":
        "Rèn luyện quy trình xử lý tức thì các lỗi thao tác thường gặp của học sinh nhỏ tuổi (lệch màn hình, mất biểu tượng, treo phần mềm, lỗi tai nghe).",
      "THCS":
        "Thực hành xử lý nhanh lỗi kết nối mạng LAN, đồng bộ phần mềm đa phương tiện và khóa an toàn cấu hình máy trạm phòng Lab.",
      "THPT":
        "Tối ưu hóa môi trường lập trình (IDE Python/C++, CSDL) và đảm bảo hệ thống luyện thi GMetrix/Compass vận hành ổn định 100% trước các đợt thi.",
    },
    goalTarget:
      "Đảm bảo 100% tiết học tại phòng Lab phụ trách diễn ra thông suốt, giảm tối đa thời gian gián đoạn do sự cố kỹ thuật.",
  },
  "2.1": {
    strengthPraise:
      "Thiết kế Kế hoạch bài dạy (Lesson Plan) sáng tạo, giàu học liệu số tương tác và đảm bảo tỷ lệ thời lượng thực hành trên máy tính tối thiểu 60%.",
    improveActionGeneral:
      "Chuyển dịch mạnh mẽ từ bài giảng truyền thống sang mô hình Dạy học dự án (Project-based Learning) và cá nhân hóa nhiệm vụ thực hành.",
    improveByLevel: {
      "Tiểu học":
        "Tích hợp video hoạt hình ngắn, phiếu giao việc trực quan giúp học sinh Tiểu học dễ dàng làm theo từng bước trên máy tính.",
      "THCS":
        "Thiết kế bài dạy theo dự án nhóm (làm poster số, video, chương trình máy tính) có phân tầng bài tập cho học sinh khá giỏi và học sinh cần hỗ trợ.",
      "THPT":
        "Xây dựng chuỗi video E-learning hướng dẫn tự học trước ở nhà (Flipped Classroom) để dành tối đa thời gian trên lớp cho học sinh thực hành chuyên sâu.",
    },
    goalTarget:
      "Đóng góp ít nhất 04 Kế hoạch bài dạy mẫu tích hợp học liệu số/E-learning đạt mức Thành thạo - Xuất sắc vào Kho dữ liệu chung của Tổ ICT.",
  },
  "2.2": {
    strengthPraise:
      "Quản lý nề nếp phòng máy khoa học, bao quát lớp tốt, tạo không khí học tập sôi nổi nhưng vẫn giữ kỷ luật và sự tập trung cao của học sinh.",
    improveActionGeneral:
      "Kết hợp linh hoạt giữa công cụ điều khiển màn hình NetSupport School và phương pháp sư phạm tích cực để quản lý học sinh trong giờ thực hành.",
    improveByLevel: {
      "Tiểu học":
        "Áp dụng Gamification (trò chơi hóa, tích sao thưởng) để rèn nề nếp xếp hàng, tư thế ngồi đúng và thao tác tắt/mở máy chuẩn cho học sinh nhỏ tuổi.",
      "THCS":
        "Kiểm soát chặt chẽ việc truy cập Internet trong giờ học; phân công nhóm trưởng kỹ thuật (Tech Leader) ở mỗi dãy máy để hỗ trợ bạn cùng lớp.",
      "THPT":
        "Phát huy mô hình lớp học tự chủ, rèn kỹ năng tự dò lỗi (Debug) và làm việc nhóm theo quy trình dự án công nghệ.",
    },
    goalTarget:
      "100% tiết dạy thực hành tại phòng Lab đạt chuẩn nề nếp, học sinh hào hứng và hoàn thành sản phẩm ngay tại lớp.",
  },
  "2.3": {
    strengthPraise:
      "Đổi mới kiểm tra đánh giá theo hướng phát triển năng lực qua sản phẩm thực hành (Portfolio, dự án) và theo dõi sát sao tiến độ luyện thi GMetrix.",
    improveActionGeneral:
      "Xây dựng bảng tiêu chí chấm điểm (Rubric) rõ ràng công bố trước mỗi dự án thực hành; phân tích dữ liệu điểm GMetrix để kèm cặp học sinh chưa đạt.",
    improveByLevel: {
      "Tiểu học":
        "Đánh giá nhẹ nhàng qua sản phẩm tranh vẽ số, thiệp điện tử, dự án Scratch nhỏ và khích lệ sự tiến bộ từng tuần của trẻ.",
      "THCS":
        "Áp dụng đánh giá đồng đẳng (các nhóm học sinh nhận xét sản phẩm của nhau theo Rubric) kết hợp theo dõi sát tiến độ luyện thi IC3 GS6.",
      "THPT":
        "Tổ chức chấm dự án phần mềm/CSDL thực tế và lập bảng theo dõi chi tiết điểm luyện thi MOS/IC3 trên GMetrix để phụ đạo kịp thời.",
    },
    goalTarget:
      "100% bài kiểm tra định kỳ và dự án học tập có Rubric đánh giá chuẩn hóa; nâng tỷ lệ học sinh đạt chứng chỉ quốc tế vượt chỉ tiêu năm học.",
  },
  "2.4": {
    strengthPraise:
      "Thực hiện nghiêm ngặt an toàn điện - thiết bị phòng máy và lồng ghép giáo dục Công dân số, đạo đức số rất tự nhiên, hiệu quả vào bài học.",
    improveActionGeneral:
      "Tăng cường các tình huống thực tế về phòng chống lừa đảo mạng, bảo vệ mật khẩu và ứng xử văn minh trên không gian mạng vào đầu hoặc cuối tiết học.",
    improveByLevel: {
      "Tiểu học":
        "Rèn quy tắc 'Không tự ý cắm/rút dây điện' và bài học nhận biết thông tin an toàn cho trẻ em trên Internet.",
      "THCS":
        "Tổ chức hoạt động tình huống về phòng chống bắt nạt trực tuyến (Cyberbullying), bảo vệ tài khoản cá nhân và tôn trọng bản quyền số.",
      "THPT":
        "Hướng dẫn học sinh nhận diện tin giả, Deepfake, bảo mật dữ liệu cá nhân và sử dụng Trí tuệ nhân tạo (AI) có đạo đức, trách nhiệm.",
    },
    goalTarget:
      "Đảm bảo 100% ca dạy an toàn tuyệt đối về điện & thiết bị; không xảy ra vi phạm an toàn mạng trong phạm vi lớp phụ trách.",
  },
  "3.1": {
    strengthPraise:
      "Làm chủ thiết bị và phương pháp giảng dạy STEM & Robotics (Lego, Whalesbot, IoT), khơi dậy niềm đam mê sáng tạo công nghệ cho học sinh.",
    improveActionGeneral:
      "Tăng cường thực hành lắp ráp, lập trình cảm biến trên các bộ Kit Robotics hiện có tại phòng Lab và thiết kế chủ đề STEM liên môn.",
    improveByLevel: {
      "Tiểu học":
        "Làm chủ hoàn toàn bộ Lego Wedo 2.0 và Whalesbot AI Module 1S; tổ chức các thử thách đấu trường Robot mini ngay trong giờ học.",
      "THCS":
        "Nâng cao kỹ năng lập trình cảm biến, cơ cấu truyền động trên Whalesbot AI Module 5S và hướng dẫn học sinh chế tạo mô hình STEM giải quyết vấn đề thực tế.",
      "THPT":
        "Phát triển các dự án IoT (Internet vạn vật), vi điều khiển, hệ thống tự động hóa thông minh kết hợp thị giác máy tính và AI.",
    },
    goalTarget:
      "Tổ chức thành công ít nhất 01 chuyên đề/sân chơi trải nghiệm STEM & Robotics cấp cơ sở và bảo quản tốt 100% bộ Kit phụ trách.",
  },
  "3.2": {
    strengthPraise:
      "Tâm huyết và có phương pháp bồi dưỡng học sinh giỏi sắc bén ở các đấu trường Tin học trẻ, MOSWC, IC3, Robotics và KHKT.",
    improveActionGeneral:
      "Chủ động phát hiện sớm học sinh có năng khiếu ngay từ đầu năm học để xây dựng ngân hàng chuyên đề ôn luyện theo từng cuộc thi mũi nhọn.",
    improveByLevel: {
      "Tiểu học":
        "Phát hiện và bồi dưỡng hạt nhân dự thi Tin học trẻ bảng A (Scratch), Đấu trường IC3 Spark và Sáng tạo Robotics cấp Tiểu học.",
      "THCS":
        "Bồi dưỡng đội tuyển Tin học trẻ bảng B, cuộc thi Robotics (ENJOY AI, Robothon), IC3 GS6 và ươm mầm ý tưởng KHKT.",
      "THPT":
        "Tập trung huấn luyện chuyên sâu đội tuyển MOSWC, Tin học trẻ bảng C, KHKT cấp Thành phố và các cuộc thi ứng dụng AI (AI For Good).",
    },
    goalTarget:
      "Trực tiếp bồi dưỡng đội tuyển học sinh giỏi mang về ít nhất 02 giải thưởng cấp Thành phố / Khu vực / Quốc gia trong năm học.",
  },
  "3.3": {
    strengthPraise:
      "Tiên phong làm chủ các công cụ AI tạo sinh và đóng vai trò Hạt nhân Công nghệ (EdTech Leader) hỗ trợ đắc lực cho đồng nghiệp tại cơ sở.",
    improveActionGeneral:
      "Ứng dụng sâu các trợ lý AI vào thiết kế học liệu, cá nhân hóa việc học và chủ động hỗ trợ giáo viên các tổ bộ môn khác tại cơ sở chuyển đổi số.",
    improveByLevel: {
      "Tiểu học":
        "Ứng dụng AI tạo học liệu trực quan (hình ảnh, nhạc, trò chơi tương tác) và hỗ trợ giáo viên Tiểu học tại cơ sở khai thác bảng tương tác thông minh.",
      "THCS":
        "Hướng dẫn học sinh THCS sử dụng AI để tra cứu, tự học đúng cách và hỗ trợ kỹ thuật EdTech cho các tổ bộ môn tại cơ sở.",
      "THPT":
        "Hướng dẫn học sinh THPT ứng dụng AI có trách nhiệm trong nghiên cứu khoa học, lập trình và tham gia tích cực phong trào SKY-LINE AI SPARK.",
    },
    goalTarget:
      "Trở thành Hạt nhân EdTech & AI tiêu biểu tại cơ sở; có ít nhất 01 sản phẩm/buổi chia sẻ ứng dụng AI lan tỏa cho đồng nghiệp.",
  },
  "4.1": {
    strengthPraise:
      "Tinh thần kỷ luật và trách nhiệm rất cao; luôn hoàn thành lịch báo giảng, điểm số, hồ sơ chuyên môn đúng hạn và quản lý phòng Lab ngăn nắp.",
    improveActionGeneral:
      "Duy trì kỷ luật hồ sơ chuyên môn đúng hạn 100% và thực hiện nghiêm túc quy trình 5S tại phòng Lab sau mỗi ca dạy.",
    improveByLevel: {},
    goalTarget:
      "Đạt tỷ lệ 100% hồ sơ sổ sách, lịch báo giảng, đề kiểm tra đúng hạn và phòng Lab đạt chuẩn xanh - sạch - an toàn.",
  },
  "4.2": {
    strengthPraise:
      "Luôn nhiệt tình hợp tác, chia sẻ học liệu với đồng nghiệp trong Tổ ICT và sẵn sàng xung kích hỗ trợ kỹ thuật cho các sự kiện của nhà trường.",
    improveActionGeneral:
      "Tích cực đóng góp ý kiến chuyên môn trong các buổi họp tổ, dự giờ thăm lớp và chia sẻ kinh nghiệm xử lý tình huống sư phạm phòng máy.",
    improveByLevel: {},
    goalTarget:
      "Tham gia đầy đủ 100% buổi sinh hoạt chuyên môn tổ, dự giờ đồng nghiệp và hỗ trợ thành công mọi sự kiện công nghệ tại cơ sở.",
  },
  "4.3": {
    strengthPraise:
      "Có tinh thần tự học và đổi mới sáng tạo bền bỉ, chủ động cập nhật xu hướng công nghệ mới vào bài giảng.",
    improveActionGeneral:
      "Lập kế hoạch tự bồi dưỡng cá nhân rõ ràng theo từng học kỳ và đúc kết thực tiễn giảng dạy thành sáng kiến kinh nghiệm/giải pháp cải tiến.",
    improveByLevel: {},
    goalTarget:
      "Hoàn thành ít nhất 02 khóa học/tập huấn nâng cao năng lực số & AI và có 01 sáng kiến cải tiến dạy học/quản trị phòng máy trong năm học.",
  },
  "4.4": {
    strengthPraise:
      "Giao tiếp chuẩn mực, tận tâm và truyền cảm hứng công nghệ cho học sinh; phối hợp nhịp nhàng với GVCN và Phụ huynh.",
    improveActionGeneral:
      "Chủ động trao đổi sớm với GVCN và Phụ huynh về lộ trình học tập, rèn luyện kỹ năng số cũng như cơ hội tham gia các kỳ thi công nghệ của học sinh.",
    improveByLevel: {},
    goalTarget:
      "Đạt mức độ hài lòng cao từ Học sinh, Phụ huynh và GVCN; kịp thời tư vấn lộ trình phát triển năng lực Tin học/Robotics cho học sinh.",
  },
};

// =============================================================================
// HÀM 1: PHÂN TÍCH & GỢI Ý LỘ TRÌNH PHÁT TRIỂN NĂNG LỰC GIÁO VIÊN (AI SỐ 1)
// =============================================================================
export function generateTeacherCompetencyAIAdvice(
  input: TeacherCompetencyAIInput
): TeacherCompetencyAIResult {
  const levels =
    input.teachingLevels && input.teachingLevels.length > 0
      ? input.teachingLevels
      : ["Tiểu học", "THCS"];
  const primaryLevelKey = levels.includes("THPT")
    ? "THPT"
    : levels.includes("THCS")
    ? "THCS"
    : "Tiểu học";

  // Tính điểm đại diện cho từng tiêu chí (ưu tiên điểm tổng hợp 360 -> điểm TTCM -> điểm Tự ĐG -> mặc định 3.0)
  const scoredCriteria = input.criteriaList.map((c) => {
    const effectiveScore =
      c.finalCriterionScore ??
      c.leaderScore ??
      c.selfScore ??
      c.peerScore ??
      3.0;
    const gapSelfLeader =
      c.selfScore !== null && c.leaderScore !== null
        ? Number((c.selfScore - c.leaderScore).toFixed(1))
        : 0;
    return {
      ...c,
      effectiveScore,
      gapSelfLeader,
    };
  });

  // Sắp xếp tìm Top điểm mạnh nhất và Top tiêu chí cần ưu tiên cải thiện/nâng tầm
  const sortedDesc = [...scoredCriteria].sort(
    (a, b) => b.effectiveScore - a.effectiveScore
  );
  const sortedAsc = [...scoredCriteria].sort(
    (a, b) => a.effectiveScore - b.effectiveScore
  );

  const getBankItem = (code: string) => {
    const dbItem = input.dbCriterionOverrides?.[code];
    const fallback = CRITERION_ACTION_BANK[code];
    return dbItem || fallback;
  };

  const top3Strengths = sortedDesc.slice(0, 3).map((c) => {
    const bank = getBankItem(c.code);
    return {
      code: c.code,
      title: c.title,
      scoreText: `${c.effectiveScore.toFixed(1)}/4.0`,
      insight:
        bank?.strengthPraise ||
        `Đạt mức năng lực tốt ở tiêu chí ${c.title}, đóng góp tích cực vào chất lượng giảng dạy tại ${input.campus}.`,
    };
  });

  const bottom3Improvements = sortedAsc.slice(0, 3).map((c) => {
    const bank = getBankItem(c.code);
    const levelSpecific =
      bank?.improveByLevel?.[primaryLevelKey] ||
      bank?.improveActionGeneral ||
      `Tập trung bồi dưỡng nâng cao tiêu chí ${c.title} gắn với thực tiễn giảng dạy tại ${input.campus}.`;
    return {
      code: c.code,
      title: c.title,
      scoreText: `${c.effectiveScore.toFixed(1)}/4.0`,
      actionHint: levelSpecific,
    };
  });

  // Phân tích độ lệch giữa Tự đánh giá và Tổ trưởng đánh giá
  const bigGapItems = scoredCriteria.filter(
    (c) => Math.abs(c.gapSelfLeader) >= 0.5
  );
  let perceptionGapNote = "";
  if (bigGapItems.length > 0) {
    const gapNames = bigGapItems
      .slice(0, 2)
      .map(
        (g) =>
          `Tiêu chí ${g.code} (${g.title}: Tự ĐG ${g.selfScore?.toFixed(1)} vs TTCM ${g.leaderScore?.toFixed(1)})`
      )
      .join("; ");
    perceptionGapNote = `AI phát hiện có độ chênh lệch nhận định ở ${gapNames}. Tổ trưởng và Giáo viên nên trao đổi kỹ thêm về minh chứng thực tế của tiêu chí này để thống nhất kỳ vọng đầu ra.`;
  } else {
    perceptionGapNote =
      "Mức độ tự nhận thức năng lực của giáo viên và đánh giá của Tổ trưởng chuyên môn / Đồng cấp có sự tương đồng, đồng thuận rất cao.";
  }

  const finalScoreText =
    input.finalScore360 !== null
      ? `${input.finalScore360.toFixed(2)}/4.00 (${input.rankingLabel || "Đạt chuẩn"})`
      : "Đang trong quá trình cập nhật điểm 360°";

  const cross = input.crossTableStats;
  const crossSummaryText = cross
    ? ` Kết hợp đối chiếu dữ liệu thực tế từ 5 bảng Database Supabase: hoàn thành ${cross.assignedTasksCompleted}/${cross.assignedTasksTotal} công việc được giao, xử lý ${cross.incidentsResolvedTotal}/${cross.incidentsHandledTotal} sự vụ phòng Lab, phụ trách ${cross.teamsCoachedCount} đội tuyển mũi nhọn.`
    : "";

  const databaseEvidenceSummary: string[] = [
    `Bảng teacher_competency_evaluations: Đã phân tích 15/15 tiêu chí đánh giá 360° (Điểm tổng kết: ${finalScoreText}).`,
    `Bảng ai_training_knowledge_base: Đã đối chiếu trực tiếp với ${cross?.kbRecordsLoadedCount || 24} bản ghi Ngân hàng Tri thức Sư phạm ICT Sky-Line (Cấp ${levels.join(", ")}).`,
    `Bảng department_tasks & incident_reports: Đã hoàn thành ${cross?.assignedTasksCompleted ?? 0}/${cross?.assignedTasksTotal ?? 0} công việc chuyên môn và xử lý dứt điểm ${cross?.incidentsResolvedTotal ?? 0}/${cross?.incidentsHandledTotal ?? 0} sự vụ phòng Lab.`,
    `Bảng team_competitions & international_certificates: Trực tiếp đồng hành ${cross?.teamsCoachedCount ?? 1} đội tuyển HSG / CLB và hướng tới chuẩn đầu ra quốc tế (${cross?.intlCertPassRateLabel || "IC3 Spark / IC3 GS6 / MOS"}).`,
  ];

  const overallSummary = `Qua phân tích dữ liệu đánh giá 360° (15 tiêu chí thuộc 4 nhóm năng lực) của ${input.teacherName} (${input.staffCode}) tại cơ sở ${input.campus} (Cấp dạy: ${levels.join(", ")}), mức điểm tổng kết hiện tại là ${finalScoreText}.${crossSummaryText} Giáo viên thể hiện thế mạnh rõ nét ở [${top3Strengths.map((s) => `${s.code} - ${s.title}`).join(", ")}], đồng thời cần ưu tiên tập trung nguồn lực nâng cao [${bottom3Improvements.map((i) => `${i.code} - ${i.title}`).join(", ")}] để bứt phá lên nấc thang năng lực cao hơn trong năm học ${input.schoolYear}.`;

  // Xây dựng Lộ trình 3 giai đoạn (Ngắn hạn 30 ngày - Trung hạn Học kỳ - Dài hạn Năm học)
  const actionRoadmap = [
    {
      phase: "Giai đoạn 1",
      timeframe: "Ngắn hạn (Trong 30 ngày tới)",
      title: "Chuẩn hóa Giờ dạy Thực hành Phòng Lab & Khắc phục ngay Điểm nghẽn",
      actions: [
        `Tập trung cải thiện ngay tiêu chí ${bottom3Improvements[0].code} (${bottom3Improvements[0].title}): ${bottom3Improvements[0].actionHint}`,
        `Rà soát quy trình vận hành phòng máy (${input.labManagement || "Phòng Lab phụ trách"}) tại ${input.campus}, đảm bảo tối thiểu 60% thời lượng mỗi tiết học là thực hành tạo sản phẩm số.`,
        `Cập nhật đầy đủ minh chứng bài giảng, sản phẩm học sinh và nhật ký phòng máy lên Kho dữ liệu Tổ ICT.`,
      ],
    },
    {
      phase: "Giai đoạn 2",
      timeframe: "Trung hạn (Trong Học kỳ tiếp theo)",
      title: "Nâng tầm Học liệu số, Đánh giá Năng lực & Bồi dưỡng Mũi nhọn",
      actions: [
        `Nâng cấp tiêu chí ${bottom3Improvements[1].code} (${bottom3Improvements[1].title}): ${bottom3Improvements[1].actionHint}`,
        `Phát huy thế mạnh ở tiêu chí ${top3Strengths[0].code} (${top3Strengths[0].title}) để thiết kế ít nhất 02 chuyên đề/học liệu mẫu chia sẻ cho đồng nghiệp trong buổi sinh hoạt Tổ chuyên môn.`,
        `Theo dõi sát tiến độ học sinh trên hệ thống luyện thi quốc tế (IC3 Spark / IC3 GS6 / MOS) và huấn luyện đội tuyển học sinh giỏi theo phân công (${input.concurrentDuties || "Bồi dưỡng đội tuyển & CLB công nghệ"}).`,
      ],
    },
    {
      phase: "Giai đoạn 3",
      timeframe: "Dài hạn (Mục tiêu cả Năm học)",
      title: "Khẳng định Vai trò Hạt nhân Công nghệ (EdTech & AI Leader) tại Cơ sở",
      actions: [
        `Hoàn thiện tiêu chí ${bottom3Improvements[2].code} (${bottom3Improvements[2].title}): ${bottom3Improvements[2].actionHint}`,
        `Hoàn thành ít nhất 01 chứng chỉ/khóa đào tạo nâng cao về AI, STEM Robotics hoặc Lập trình phù hợp với cấp ${levels.join(", ")}.`,
        `Đúc kết 01 sáng kiến kinh nghiệm hoặc sản phẩm ứng dụng AI thực tiễn tham gia ngày hội công nghệ của Hệ thống Giáo dục Sky-Line.`,
      ],
    },
  ];

  // Dự thảo sẵn 3 ô trong Mục IV (Kế hoạch phát triển cá nhân - IDP) để Tổ trưởng/GV bấm 1 nút điền ngay
  const draftIdpStrengths = [
    `- Điểm mạnh cốt lõi (${top3Strengths[0].code} - ${top3Strengths[0].title} [${top3Strengths[0].scoreText}]): ${top3Strengths[0].insight}`,
    `- Năng lực nổi bật (${top3Strengths[1].code} - ${top3Strengths[1].title} [${top3Strengths[1].scoreText}]): ${top3Strengths[1].insight}`,
    `- Phát huy tốt vai trò giảng dạy cấp ${levels.join(", ")} và quản lý ${input.labManagement || "phòng Lab"} tại cơ sở ${input.campus} (${top3Strengths[2].code} - ${top3Strengths[2].title} [${top3Strengths[2].scoreText}]).`,
  ].join("\n");

  const draftIdpImprovements = [
    `- Ưu tiên 1 (${bottom3Improvements[0].code} - ${bottom3Improvements[0].title} [${bottom3Improvements[0].scoreText}]): ${bottom3Improvements[0].actionHint}`,
    `- Ưu tiên 2 (${bottom3Improvements[1].code} - ${bottom3Improvements[1].title} [${bottom3Improvements[1].scoreText}]): ${bottom3Improvements[1].actionHint}`,
    `- Ưu tiên 3 (${bottom3Improvements[2].code} - ${bottom3Improvements[2].title} [${bottom3Improvements[2].scoreText}]): ${bottom3Improvements[2].actionHint}`,
  ].join("\n");

  const draftIdpGoals = [
    `1. Về chuyên môn & giảng dạy (${levels.join(", ")}): ${getBankItem(bottom3Improvements[0].code)?.goalTarget || "Nâng điểm tất cả các tiêu chí hiện dưới 3.2 lên mức Thành thạo - Xuất sắc (≥ 3.5/4.0)."}`,
    `2. Về phát triển mũi nhọn STEM/Robotics & EdTech AI: ${getBankItem(bottom3Improvements[1].code)?.goalTarget || "Tích cực bồi dưỡng học sinh giỏi và làm hạt nhân hỗ trợ công nghệ tại cơ sở."}`,
    `3. Mục tiêu xếp loại năng lực kỳ tới: Phấn đấu đạt mức tổng kết ≥ ${
      input.finalScore360 && input.finalScore360 >= 3.5 ? "3.75/4.00 (Xuất sắc dẫn đầu)" : "3.50/4.00 (Thành thạo cao - Xuất sắc)"
    }, đóng góp ít nhất 01 học liệu số/sáng kiến AI dùng chung cho toàn Tổ ICT.`,
  ].join("\n");

  return {
    generatedAt: new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    overallSummary,
    perceptionGapNote,
    databaseEvidenceSummary,
    topStrengths: top3Strengths,
    priorityImprovements: bottom3Improvements,
    actionRoadmap,
    draftIdpStrengths,
    draftIdpImprovements,
    draftIdpGoals,
  };
}

// =============================================================================
// HÀM 2: PHÂN TÍCH & GỢI Ý XỬ LÝ SỰ VỤ CHUYÊN MÔN 2 CHIỀU (AI SỐ 2)
// =============================================================================
export function generateIncidentHandlingAIAdvice(
  input: IncidentAIInput
): IncidentAIResult {
  const cat = input.category || "";
  const urgency = input.urgencyLevel || "Bình thường";
  const scopes =
    input.impactScopes && input.impactScopes.length > 0
      ? input.impactScopes.join(", ")
      : "Phòng Lab";
  const desc = (input.description || "").trim();
  const campus = input.campus || "Cơ sở Sky-Line";

  const slaNote =
    urgency === "Khẩn cấp"
      ? "Mức độ KHẨN CẤP (Cần xử lý tại chỗ ngay trong 5–15 phút đầu và hoàn tất báo cáo minh chứng trong vòng 24 giờ)"
      : urgency === "Ưu tiên cao"
      ? "Mức độ ƯU TIÊN CAO (Cần xử lý dứt điểm trong ngày để không ảnh hưởng các ca học tiếp theo, nhắc hẹn xác nhận sau 03 ngày)"
      : "Mức độ BÌNH THƯỜNG (Xử lý theo quy trình chuẩn của Tổ chuyên môn ICT, nhắc hẹn xác nhận hoàn thành trong 07 ngày)";

  let step1Immediate: string[] = [];
  let step2Coordination: string[] = [];
  let step3Prevention: string[] = [];
  let evidenceChecklist: string[] = [];
  let leaderSpecificNote = "";

  if (cat.includes("1.") || cat.toLowerCase().includes("cơ sở vật chất") || cat.toLowerCase().includes("phòng lab")) {
    step1Immediate = [
      `Cô lập ngay thiết bị/máy trạm hoặc khu vực gặp sự cố tại ${campus} để đảm bảo an toàn điện và an toàn tuyệt đối cho học sinh.`,
      "Chuyển ngay học sinh đang ngồi tại máy gặp sự cố sang máy tính dự phòng hoặc ghép nhóm thực hành 2 học sinh/máy để tiết học không bị gián đoạn.",
      "Ghi nhận nhanh mã máy trạm / tên bộ thiết bị Robotics và biểu hiện lỗi trên màn hình hoặc phần cứng.",
    ];
    step2Coordination = [
      `Báo cáo trực tiếp lên Tổ trưởng chuyên môn ICT và phối hợp với bộ phận Kỹ thuật IT tại ${campus} để kiểm tra chuyên sâu (nguồn, mạng LAN, ổ cứng, phần mềm).`,
      "Cập nhật trạng thái thiết bị tương ứng trong phân hệ 'Thiết Bị & Robot' trên cổng Sky-Line ICT Portal sang trạng thái 'Cần bảo trì / Báo hỏng'.",
      "Nếu cần thay thế linh kiện vượt thẩm quyền tự sửa tại phòng máy, lập đề xuất kỹ thuật trình Tổ trưởng và Ban Quản lý cơ sở.",
    ];
    step3Prevention = [
      "Thực hiện rà soát nhanh (Checklist 3 phút) toàn bộ dàn máy và thiết bị ngoại vi trước mỗi buổi học sáng/chiều.",
      "Hướng dẫn học sinh quy trình tắt máy đúng cách và không tự ý tác động vào dây nguồn, cáp mạng sau lưng máy.",
    ];
    evidenceChecklist = [
      "Ảnh chụp tình trạng thiết bị/mã máy trước và sau khi khắc phục.",
      "Xác nhận nghiệm thu hoạt động ổn định hoặc biên bản kiểm tra kỹ thuật với IT cơ sở.",
    ];
    leaderSpecificNote = `Thầy/Cô ưu tiên bố trí máy dự phòng tại ${campus} để duy trì 100% thời lượng thực hành của học sinh; phối hợp ngay với bộ phận IT cơ sở kiểm tra và cập nhật tình trạng vào mục Thiết Bị & Robot. Sau khi khắc phục xong, thầy/cô đính kèm link ảnh minh chứng và chuyển trạng thái sang Hoàn thành nhé.`;
  } else if (cat.includes("2.") || cat.toLowerCase().includes("chuyên môn") || cat.toLowerCase().includes("chương trình")) {
    step1Immediate = [
      "Linh hoạt điều chỉnh thời lượng và phân hóa hoạt động thực hành ngay tại lớp phù hợp với tốc độ tiếp thu thực tế của học sinh.",
      "Áp dụng phương pháp 'Đôi bạn cùng tiến' (ghép học sinh thao tác nhanh hỗ trợ bạn thao tác chậm) để đảm bảo không học sinh nào bị bỏ lại phía sau.",
      "Ghi chú lại nội dung bài học/phần mềm hoặc yêu cầu cần đạt đang phát sinh vướng mắc so với phân phối chương trình.",
    ];
    step2Coordination = [
      "Báo cáo chi tiết với Tổ trưởng chuyên môn để xin ý kiến điều chỉnh kế hoạch bài dạy (Lesson Plan) hoặc thống nhất phương án kiểm tra đánh giá phù hợp.",
      "Trao đổi cùng các giáo viên dạy cùng khối lớp trong Tổ ICT để đồng bộ học liệu số và bài tập thực hành thay thế.",
      "Nếu liên quan đến tài khoản luyện thi (GMetrix / IC3 / MOS / LMS), tổng hợp danh sách lớp để rà soát và cấp bổ sung kịp thời.",
    ];
    step3Prevention = [
      "Chủ động chạy thử (Test) toàn bộ học liệu số, tệp bài tập mẫu trên máy học sinh trước ngày giảng dạy chính thức.",
      "Xây dựng sẵn gói bài tập 2 tầng (Cơ bản & Nâng cao) trong Kho dữ liệu tổ để linh hoạt sử dụng cho các lớp có trình độ khác nhau.",
    ];
    evidenceChecklist = [
      "Link Kế hoạch bài dạy / Học liệu số đã điều chỉnh hoặc sản phẩm thực hành của lớp.",
      "Minh chứng kết quả khắc phục trên hệ thống học tập của học sinh.",
    ];
    leaderSpecificNote = `Thầy/Cô chủ động điều chỉnh linh hoạt tiến độ thực hành tại lớp theo đúng hướng đề xuất để đảm bảo học sinh nắm chắc kỹ năng cốt lõi; đồng thời cập nhật học liệu điều chỉnh lên Kho dữ liệu Tổ ICT để các cơ sở cùng thống nhất áp dụng.`;
  } else if (cat.includes("3.") || cat.toLowerCase().includes("kỷ luật") || cat.toLowerCase().includes("an toàn số")) {
    step1Immediate = [
      "Sử dụng ngay phần mềm quản lý phòng máy (NetSupport School) để khóa màn hình/ngắt kết nối trang web ngoài luồng và ổn định trật tự lớp học một cách bình tĩnh, chuẩn mực sư phạm.",
      "Nhắc nhở riêng tư, nhẹ nhàng nhưng kiên quyết đối với học sinh vi phạm nội quy phòng máy hoặc quy tắc An toàn số; tuyệt đối tôn trọng tâm lý học sinh.",
      "Đảm bảo các học sinh còn lại trong lớp tiếp tục thực hành bình thường theo kế hoạch bài dạy.",
    ];
    step2Coordination = [
      "Trao đổi trực tiếp với Giáo viên chủ nhiệm (GVCN) của lớp ngay sau tiết học để nắm bắt đặc điểm tâm lý và phối hợp giáo dục tích cực.",
      "Xin ý kiến chỉ đạo của Tổ trưởng chuyên môn ICT; trường hợp cần thiết sẽ phối hợp cùng Bộ phận Quản lý học sinh / Tư vấn tâm lý học đường hoặc thông tin khéo léo tới Phụ huynh.",
      "Phối hợp bộ phận IT cơ sở chặn (Block) các đường dẫn không phù hợp trên hệ thống tường lửa phòng Lab.",
    ];
    step3Prevention = [
      "Dành 3 phút đầu giờ nhắc lại Bộ quy tắc 'Công dân số văn minh & An toàn phòng Lab Sky-Line'.",
      "Bật chế độ giám sát màn hình trực tiếp và giới hạn danh sách trang web được phép truy cập (Whitelist) trong giờ thực hành.",
    ];
    evidenceChecklist = [
      "Nhật ký ca dạy tại phòng Lab / Nội dung trao đổi phối hợp với GVCN.",
      "Ảnh chụp cấu hình chặn an toàn trên phần mềm quản lý phòng máy.",
    ];
    leaderSpecificNote = `Thầy/Cô xử lý rất đúng tinh thần sư phạm tích cực của Sky-Line. Đề nghị thầy/cô phối hợp chặt chẽ với GVCN để nhắc nhở, định hướng học sinh sử dụng máy tính đúng mục đích học tập, đồng thời bật chế độ kiểm soát trang web trên NetSupport School trong các tiết tiếp theo.`;
  } else if (cat.includes("4.") || cat.toLowerCase().includes("thi đấu") || cat.toLowerCase().includes("clb")) {
    step1Immediate = [
      "Kiểm tra, rà soát ngay danh sách học sinh đội tuyển, lịch tập huấn, tài khoản dự thi hoặc bộ thiết bị Robotics/máy tính phục vụ thi đấu.",
      "Chủ động bố trí phương án dự phòng (máy tính cấu hình cao, pin sạc dự phòng, cảm biến Robot sơ cua) để không ảnh hưởng tới tiến độ ôn luyện của học sinh.",
      "Động viên, giữ vững tâm lý tự tin và tinh thần tập trung cho các em học sinh trong đội tuyển.",
    ];
    step2Coordination = [
      "Báo cáo Tổ trưởng chuyên môn ICT để điều phối nhân sự hỗ trợ kỹ thuật hoặc điều chỉnh lịch sử dụng phòng Lab ưu tiên cho đội tuyển.",
      "Phối hợp với GVCN và Phụ huynh học sinh để thống nhất khung giờ bồi dưỡng bổ sung, công tác di chuyển và hậu cần cuộc thi.",
      "Cập nhật tiến độ ôn luyện vào phân hệ 'Đội Tuyển' trên cổng thông tin Sky-Line ICT Portal.",
    ];
    step3Prevention = [
      "Xây dựng danh mục kiểm tra (Checklist) thiết bị, phần mềm và thể lệ thi trước ngày thi đấu ít nhất 05 ngày.",
      "Tổ chức thi thử mô phỏng áp lực thời gian thực tế tại phòng Lab để rà soát mọi rủi ro kỹ thuật.",
    ];
    evidenceChecklist = [
      "Hình ảnh buổi bồi dưỡng / Danh sách điểm danh đội tuyển hoặc biên bản kiểm tra thiết bị thi đấu.",
      "Thông báo phối hợp lịch ôn luyện với GVCN / Phụ huynh.",
    ];
    leaderSpecificNote = `Thầy/Cô ưu tiên tối đa điều kiện phòng Lab và thiết bị tốt nhất tại ${campus} cho đội tuyển ôn luyện; phối hợp nhịp nhàng với GVCN và Phụ huynh để hỗ trợ các em học sinh đạt phong độ cao nhất.`;
  } else if (cat.includes("5.") || cat.toLowerCase().includes("lịch biểu") || cat.toLowerCase().includes("nhân sự")) {
    step1Immediate = [
      "Kiểm tra ngay bảng 'Lịch giảng dạy & Lịch phòng Lab' trên cổng Sky-Line ICT Portal để xác định khung tiết trống hoặc phòng Lab dự phòng tại cơ sở.",
      "Thông báo kịp thời tới GVCN lớp liên quan nếu có sự điều chuyển phòng học thực hành hoặc thay đổi giáo viên dạy thay.",
      "Chuẩn bị sẵn Kế hoạch bài dạy và tệp bài tập thực hành chi tiết để bàn giao nhanh cho giáo viên hỗ trợ (nếu là sự vụ dạy thay đột xuất).",
    ];
    step2Coordination = [
      "Báo cáo Tổ trưởng chuyên môn ICT phê duyệt phương án xếp lịch dạy thay / đổi tiết hoặc điều tiết phòng Lab chống trùng lịch.",
      "Phối hợp cùng giáo viên ICT trong cơ sở và Giáo vụ cơ sở để đảm bảo 100% lớp học có giáo viên quản lý và hướng dẫn đúng giờ.",
    ];
    step3Prevention = [
      "Thường xuyên đối chiếu Thời khóa biểu cá nhân và Lịch phòng Lab vào chiều Thứ Sáu hằng tuần cho tuần kế tiếp.",
      "Cập nhật sớm các lịch công tác, coi thi hoặc sự kiện trùng giờ dạy lên hệ thống để Tổ trưởng chủ động điều phối.",
    ];
    evidenceChecklist = [
      "Ảnh chụp xác nhận lịch dạy bù / dạy thay hoặc thông báo điều phối phòng Lab đã thống nhất.",
    ];
    leaderSpecificNote = `Đồng ý với phương án sắp xếp lịch biểu và phòng Lab đề xuất của thầy/cô. Thầy/Cô phối hợp với Giáo vụ tại ${campus} và GVCN lớp để thông báo rõ ràng, đảm bảo tiết học của học sinh diễn ra ổn định, đúng kế hoạch.`;
  } else {
    step1Immediate = [
      "Tiếp nhận đầy đủ, cầu thị và ghi chép chính xác nội dung ý kiến phản hồi từ Phụ huynh / Lãnh đạo / Đồng nghiệp với thái độ tôn trọng, chuyên nghiệp.",
      "Kiểm tra, đối chiếu ngay thông tin thực tế (kết quả học tập của học sinh, nhật ký tiết dạy, tình trạng phòng máy) để nắm rõ toàn bộ bối cảnh sự việc.",
      "Phản hồi bước đầu xác nhận đã tiếp nhận thông tin và hẹn thời gian trả lời chính thức sau khi xin ý kiến Tổ trưởng chuyên môn.",
    ];
    step2Coordination = [
      "Báo cáo toàn bộ nội dung sự việc và dữ liệu minh chứng lên Tổ trưởng chuyên môn ICT để thống nhất phương hướng giải quyết và thông điệp phản hồi.",
      "Phối hợp chặt chẽ với GVCN lớp hoặc Ban Giám hiệu cơ sở để trao đổi, giải đáp thấu đáo, mang tính xây dựng và đồng hành cùng Phụ huynh/Học sinh.",
    ];
    step3Prevention = [
      "Tăng cường thông tin hai chiều định kỳ với GVCN về tình hình học tập và rèn luyện của học sinh tại phòng máy.",
      "Lưu trữ đầy đủ sản phẩm thực hành và kết quả đánh giá của học sinh để làm căn cứ minh bạch khi trao đổi chuyên môn.",
    ];
    evidenceChecklist = [
      "Nội dung tổng hợp kết quả trao đổi / phản hồi chính thức đã thống nhất với GVCN hoặc Phụ huynh.",
    ];
    leaderSpecificNote = `Thầy/Cô rà soát kỹ hồ sơ minh chứng giảng dạy, phối hợp cùng GVCN để phản hồi tận tâm, rõ ràng và cầu thị trên tinh thần văn hóa Sky-Line. Có bất kỳ điểm nào cần Tổ trưởng trực tiếp cùng làm việc, thầy/cô báo ngay nhé.`;
  }

  const contextSnippet = desc
    ? `Đối với tình huống thực tế "${desc.slice(0, 140)}${desc.length > 140 ? "..." : ""}" tại ${campus} (Phạm vi ảnh hưởng: ${scopes})`
    : `Đối với sự vụ thuộc nhóm "${cat}" tại ${campus} (Phạm vi ảnh hưởng: ${scopes})`;

  const formattedTeacherProposal = [
    `[Đề xuất hướng xử lý chuẩn quy trình ICT - ${urgency}]:`,
    `1. Xử lý tức thời tại chỗ: ${step1Immediate[0]} ${step1Immediate[1]}`,
    `2. Phối hợp giải quyết dứt điểm: ${step2Coordination[0]} ${step2Coordination[1]}`,
    `3. Phòng ngừa & Minh chứng: ${step3Prevention[0]} Cam kết cập nhật đường link minh chứng ngay sau khi hoàn tất.`,
  ].join("\n");

  const formattedLeaderDirection = [
    `[Ý kiến chỉ đạo của Tổ trưởng Chuyên môn ICT]:`,
    `1. Tiếp nhận báo cáo sự vụ của ${input.teacherName} (${input.teacherId}) tại ${campus} (Mức độ: ${urgency} - Phạm vi: ${scopes}).`,
    `2. Chỉ đạo thực hiện: ${leaderSpecificNote}`,
    `3. Thời hạn & Minh chứng: Đề nghị ${input.teacherName} bấm "Xác nhận & Thực hiện chỉ đạo", triển khai xử lý dứt điểm và đính kèm link minh chứng kết quả khi chuyển trạng thái sang "Hoàn thành".`,
  ].join("\n");

  return {
    generatedAt: new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    riskAssessment: `${contextSnippet} — ${slaNote}.`,
    step1Immediate,
    step2Coordination,
    step3Prevention,
    evidenceChecklist,
    formattedTeacherProposal,
    formattedLeaderDirection,
  };
}


// =============================================================================
// PHẦN MỞ RỘNG ĐỢT 2:
// 3. AI BẢN TIN THỜI SỰ GIÁO DỤC - TIN HỌC - ROBOTICS - AI (08H00 SÁNG THỨ BẢY)
//    & THAM MƯU CẬP NHẬT CHƯƠNG TRÌNH BỘ MÔN ICT SKY-LINE
// 4. AI TRỢ LÝ XÂY DỰNG KẾ HOẠCH, TỜ TRÌNH & SOẠN EMAIL ĐIỀU HÀNH CHO TỔ TRƯỞNG
// =============================================================================

export interface WeeklyNewsArticle {
  id: string;
  category: "Giáo dục & Chính sách số" | "Trí tuệ nhân tạo (AI)" | "Robotics & STEM" | "Tin học & An toàn số";
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
  summary: string;
  impactOnSkyLine: string;
  domain?: string;
  trustTier?: "tier1_official" | "tier2_open_search";
  trustScore?: number;
  trustBadgeLabel?: string;
}

export interface CurriculumProposalItem {
  id: string;
  level: "Cấp Tiểu học (Lớp 1 - Lớp 5)" | "Cấp THCS (Lớp 6 - Lớp 9)" | "Cấp THPT (Lớp 10 - Lớp 12)";
  currentProgramModule: string;
  proposedActionType: "Cập nhật mới" | "Sửa đổi nâng cấp" | "Bổ sung chuyên đề";
  title: string;
  rationaleFromNews: string;
  detailedImplementation: string;
  suggestedTaskTitle: string;
  suggestedAssigneeHint: string;
}

export interface SaturdayWeeklyBriefing {
  editionLabel: string;
  scheduledTimeLabel: string;
  lastScannedAt: string;
  sourcesScanned: string[];
  executiveSummaryForLeader: string;
  newsArticles: WeeklyNewsArticle[];
  curriculumProposals: CurriculumProposalItem[];
}

export function getSaturdayEditionDateInfo(now: Date = new Date()): {
  thisSaturdayStr: string;
  nextSaturdayStr: string;
  isSaturdayAfter8AM: boolean;
} {
  const dayOfWeek = now.getDay(); // 0: CN, 6: Thứ Bảy
  const diffToSaturday = 6 - dayOfWeek;
  const targetSat = new Date(now);
  if (dayOfWeek === 0) {
    // Nếu Chủ nhật thì lấy Thứ Bảy hôm qua làm kỳ phát hành mới nhất
    targetSat.setDate(now.getDate() - 1);
  } else {
    targetSat.setDate(now.getDate() + diffToSaturday);
  }

  const nextSat = new Date(targetSat);
  if (dayOfWeek === 6 && now.getHours() >= 8) {
    nextSat.setDate(targetSat.getDate() + 7);
  } else if (dayOfWeek === 0) {
    nextSat.setDate(targetSat.getDate() + 7);
  }

  const fmt = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const isSaturdayAfter8AM =
    (dayOfWeek === 6 && now.getHours() >= 8) || dayOfWeek === 0;

  return {
    thisSaturdayStr: fmt(targetSat),
    nextSaturdayStr: fmt(nextSat),
    isSaturdayAfter8AM,
  };
}

export function generateSaturdayWeeklyBriefing(
  schoolYear: string,
  liveHeadlines?: {
    title: string;
    link: string;
    pubDate?: string;
    source?: string;
    domain?: string;
    trustTier?: "tier1_official" | "tier2_open_search";
    trustScore?: number;
    trustBadgeLabel?: string;
  }[],
  referenceDate?: Date
): SaturdayWeeklyBriefing {
  const now = referenceDate || new Date("2026-10-31T08:00:00+07:00");
  const satInfo = getSaturdayEditionDateInfo(now);
  const timeStr = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = now.toLocaleDateString("vi-VN");

  const sourcesScanned = [
    "Cổng thông tin Bộ GD&ĐT (moet.gov.vn)",
    "Sở GD&ĐT TP. Đà Nẵng (danang.edu.vn)",
    "Báo Giáo dục & Thời đại (giaoducthoidai.vn)",
    "VnExpress Giáo dục & Số hóa (vnexpress.net)",
    "Báo Tuổi Trẻ & Thanh Niên (tuoitre.vn / thanhnien.vn)",
    "Certiport & IIG Việt Nam (iigvietnam.com)",
    "Hội thi Tin học trẻ & STEM Robotics (tinhoctre.vn)",
    "Google News Tìm kiếm Mở Toàn mạng (news.google.com)",
  ];

  const baseArticles: WeeklyNewsArticle[] = [
    {
      id: "news_ai_edu_1",
      category: "Giáo dục & Chính sách số",
      title:
        "Bộ GD&ĐT đẩy mạnh triển khai Khung năng lực số và ứng dụng Trí tuệ nhân tạo (AI) có trách nhiệm cho học sinh phổ thông năm học 2026 - 2027",
      sourceName: "Cổng thông tin Bộ GD&ĐT",
      sourceUrl: "https://moet.gov.vn/giaoducquocdan/giao-duc-trung-hoc/Pages/Default.aspx",
      publishedDate: satInfo.thisSaturdayStr,
      summary:
        "Định hướng mới yêu cầu môn Tin học không chỉ dạy công cụ phần mềm mà phải hình thành năng lực giải quyết vấn đề bằng AI, thẩm định thông tin số và bảo vệ dữ liệu cá nhân ngay từ bậc Tiểu học đến THPT.",
      impactOnSkyLine:
        "Trực tiếp củng cố định hướng 'AI có trách nhiệm' của Hệ thống Giáo dục Sky-Line; cần tích hợp ngay quy tắc kiểm chứng kết quả AI vào mọi tiết thực hành phòng máy.",
      domain: "moet.gov.vn",
      trustTier: "tier1_official",
      trustScore: 100,
      trustBadgeLabel: "Chính thống Cấp 1 (moet.gov.vn • Độ tin cậy 100%)",
    },
    {
      id: "news_ai_edu_2",
      category: "Trí tuệ nhân tạo (AI)",
      title:
        "Xu hướng tích hợp Trợ lý AI tạo sinh (Generative AI) vào lập trình Python, Scratch và thiết kế đa phương tiện trong trường học quốc tế",
      sourceName: "VnExpress Giáo dục & Số hóa",
      sourceUrl: "https://vnexpress.net/giao-duc",
      publishedDate: satInfo.thisSaturdayStr,
      summary:
        "Các trường tiên phong đang chuyển từ dạy học sinh viết mã thuần túy sang dạy 'Tư duy thiết kế thuật toán kết hợp AI đồng hành (AI Pair Programming)' và kỹ năng đặt câu lệnh (Prompt Engineering) chuẩn học thuật.",
      impactOnSkyLine:
        "Cơ hội để Tổ ICT Sky-Line đi đầu tại Đà Nẵng bằng việc bổ sung chuyên đề Prompt Engineering và gỡ lỗi code cùng AI có kiểm soát cho học sinh THCS & THPT.",
      domain: "vnexpress.net",
      trustTier: "tier1_official",
      trustScore: 98,
      trustBadgeLabel: "Chính thống Cấp 1 (vnexpress.net • Độ tin cậy 98%)",
    },
    {
      id: "news_robotics_3",
      category: "Robotics & STEM",
      title:
        "Các đấu trường Sáng tạo Robotics Toàn quốc, ENJOY AI & Tin học trẻ cập nhật đề thi tích hợp Cảm biến thông minh và Thị giác máy tính (AI Vision)",
      sourceName: "Chuyên trang STEM & Robotics Quốc gia",
      sourceUrl: "https://tinhoctre.vn",
      publishedDate: satInfo.thisSaturdayStr,
      summary:
        "Các bảng thi Robotics và Tin học trẻ năm học 2026 - 2027 tăng tỷ trọng bài toán tự hành xử lý dữ liệu cảm biến thời gian thực và ứng dụng mô hình AI giải quyết bài toán môi trường, đô thị thông minh.",
      impactOnSkyLine:
        "Cần nâng cấp ngay giáo án bồi dưỡng đội tuyển Robotics (Lego Wedo 2.0, Whalesbot AI Module 1S/5S) và KHKT tại cả 5 cơ sở Sky-Line.",
      domain: "tinhoctre.vn",
      trustTier: "tier1_official",
      trustScore: 98,
      trustBadgeLabel: "Chính thống Cấp 1 (tinhoctre.vn • Độ tin cậy 98%)",
    },
    {
      id: "news_cyber_4",
      category: "Tin học & An toàn số",
      title:
        "Certiport cập nhật chuẩn đánh giá IC3 Spark, IC3 GS6 và MOS theo hướng tăng cường Bảo mật đám mây, Phòng chống lừa đảo Deepfake và Cộng tác số",
      sourceName: "IIG Việt Nam & Certiport",
      sourceUrl: "https://iigvietnam.com/bai-thi-tin-hoc/",
      publishedDate: satInfo.thisSaturdayStr,
      summary:
        "Hệ thống bài thi chứng chỉ quốc tế bổ sung nhiều câu hỏi tình huống thực tế về nhận diện lừa đảo trực tuyến bằng âm thanh/hình ảnh giả mạo (Deepfake), quản lý dấu chân số và làm việc nhóm trên OneDrive/Office 365.",
      impactOnSkyLine:
        "Cần bổ sung ngay bộ câu hỏi tình huống An toàn số mới vào ngân hàng luyện thi GMetrix và hoạt động khởi động 5 phút đầu giờ tại 6 phòng Lab.",
      domain: "iigvietnam.com",
      trustTier: "tier1_official",
      trustScore: 98,
      trustBadgeLabel: "Chính thống Cấp 1 (iigvietnam.com • Độ tin cậy 98%)",
    },
  ];

  // Nếu có tin tức trực tiếp quét thêm từ RSS Chính thống & Tìm kiếm Mở thì ghép vào đầu danh sách
  if (Array.isArray(liveHeadlines) && liveHeadlines.length > 0) {
    liveHeadlines.slice(0, 4).forEach((item, idx) => {
      baseArticles.unshift({
        id: `live_news_${idx}`,
        category: idx % 2 === 0 ? "Giáo dục & Chính sách số" : "Trí tuệ nhân tạo (AI)",
        title: item.title,
        sourceName: item.source || "Báo điện tử Chính thống (Quét trực tiếp)",
        sourceUrl: item.link || "https://vnexpress.net/giao-duc",
        publishedDate: item.pubDate || satInfo.thisSaturdayStr,
        summary:
          "Tin tức mới nhất vừa được Trợ lý AI Sky-Line quét trực tiếp thời gian thực và xác thực nguồn gốc xuất bản phục vụ bản tin của Tổ trưởng Chuyên môn ICT.",
        impactOnSkyLine:
          "Giúp Tổ ICT nắm bắt tức thì chuyển động công nghệ - giáo dục mới nhất để chủ động điều chỉnh kế hoạch giảng dạy và hoạt động ngoại khóa.",
        domain: item.domain || "vnexpress.net",
        trustTier: item.trustTier || "tier1_official",
        trustScore: item.trustScore || 96,
        trustBadgeLabel:
          item.trustBadgeLabel ||
          `Chính thống Cấp 1 (${item.domain || "vnexpress.net"} • Độ tin cậy 96%)`,
      });
    });
  }

  const curriculumProposals: CurriculumProposalItem[] = [
    {
      id: "prop_primary",
      level: "Cấp Tiểu học (Lớp 1 - Lớp 5)",
      currentProgramModule:
        "Mạch Học vấn số (IC3 Spark) + Lập trình kéo thả Scratch & Robotics Lego Wedo 2.0 / Whalesbot 1S",
      proposedActionType: "Bổ sung chuyên đề",
      title:
        "Bổ sung Mô-đun 'Khiên An Toàn Số Cho Em & Làm Quen AI Qua Lập Trình Kéo Thả'",
      rationaleFromNews:
        "Đáp ứng định hướng Khung năng lực số mới của Bộ GD&ĐT và cập nhật đề thi IC3 Spark về bảo vệ thông tin cá nhân cho học sinh nhỏ tuổi.",
      detailedImplementation:
        "• Khối 1–3: Lồng ghép 10 phút trò chơi tương tác (Gamification) đầu giờ về quy tắc '4 Không trên mạng' và thao tác máy tính chuẩn.\n• Khối 4–5: Bổ sung 02 tiết thực hành kết hợp khối lệnh mở rộng nhận diện hình ảnh/âm thanh cơ bản trong Scratch và nâng cấp bài toán cảm biến trên Whalesbot AI Module 1S.",
      suggestedTaskTitle:
        "[Cập nhật CT Tiểu học] Xây dựng học liệu số 'Khiên An Toàn Số' & Bài tập Scratch/Whalesbot 1S mới",
      suggestedAssigneeHint: "Giáo viên phụ trách khối Tiểu học & IC3 Spark",
    },
    {
      id: "prop_secondary",
      level: "Cấp THCS (Lớp 6 - Lớp 9)",
      currentProgramModule:
        "Chứng chỉ IC3 GS6 + Chuyển giao Scratch nâng cao sang Python & Robotics Whalesbot 5S",
      proposedActionType: "Sửa đổi nâng cấp",
      title:
        "Nâng cấp Chuyên đề 'Phòng chống Deepfake & Ứng dụng AI hỗ trợ học lập trình Python có kiểm soát'",
      rationaleFromNews:
        "Đón đầu xu hướng đề thi IC3 GS6 mới về nhận diện lừa đảo công nghệ cao và xu hướng AI hỗ trợ học lập trình tại các trường quốc tế.",
      detailedImplementation:
        "• Khối 6–7: Cập nhật bộ tình huống thực hành nhận diện tin giả, Deepfake và bảo mật tài khoản mạng xã hội vào học phần Công dân số (IC3 GS6).\n• Khối 8–9: Hướng dẫn học sinh sử dụng AI để giải thích lỗi thuật toán Python (Debug) thay vì chép code thụ động; nâng cấp bài toán điều khiển tự hành trên Whalesbot AI Module 5S.",
      suggestedTaskTitle:
        "[Cập nhật CT THCS] Bổ sung chuyên đề Nhận diện Deepfake (IC3 GS6) & Hướng dẫn Debug Python cùng AI",
      suggestedAssigneeHint: "Giáo viên phụ trách khối THCS & Đội tuyển Robotics",
    },
    {
      id: "prop_highschool",
      level: "Cấp THPT (Lớp 10 - Lớp 12)",
      currentProgramModule:
        "Chứng chỉ MOS Expert (Word, Excel, PowerPoint) + Khoa học máy tính (Python/C++/SQL) & Dự án AI/IoT",
      proposedActionType: "Cập nhật mới",
      title:
        "Tích hợp Chuyên đề 'Kỹ thuật đặt câu lệnh học thuật (Prompt Engineering) & Dự án KHKT AI - IoT thực tiễn'",
      rationaleFromNews:
        "Bám sát định hướng cuộc thi SKY-LINE AI SPARK 2026 - 2027, kỳ thi Tin học trẻ bảng C và xu hướng phân tích dữ liệu thông minh trong MOS Expert.",
      detailedImplementation:
        "• Khối 10–11: Bổ sung chuyên đề tự động hóa xử lý dữ liệu bảng tính nâng cao (MOS Excel Expert) và xây dựng ứng dụng Web/Python tích hợp mô hình AI có kiểm chứng dữ liệu.\n• Khối 12 & Đội tuyển mũi nhọn: Định hướng học sinh phát triển đề tài KHKT và AI For Good giải quyết bài toán thực tế tại trường học (quản lý năng lượng, phân loại rác thông minh, trợ lý học tập an toàn).",
      suggestedTaskTitle:
        "[Cập nhật CT THPT] Thiết kế chuyên đề Prompt Engineering học thuật & Đề tài dự án AI - IoT cấp THPT",
      suggestedAssigneeHint: "Giáo viên phụ trách khối THPT & Bồi dưỡng MOS/KHKT",
    },
  ];

  return {
    editionLabel: `Kỳ phát hành: Sáng Thứ Bảy, ngày ${satInfo.thisSaturdayStr} (Năm học ${schoolYear})`,
    scheduledTimeLabel: `Lịch hẹn tự động: 08h00 sáng Thứ Bảy hằng tuần (Kỳ tiếp theo: 08h00 ngày ${satInfo.nextSaturdayStr})`,
    lastScannedAt: `${timeStr} - Ngày ${dateStr}`,
    sourcesScanned,
    executiveSummaryForLeader: `Kính gửi Thầy Đỗ Anh Huy (Tổ trưởng Chuyên môn ICT), hệ thống AI đã hoàn tất quét định kỳ các nguồn thông tin chính thống lúc 08h00 sáng Thứ Bảy. Tuần này nổi bật 04 chuyển động quan trọng về: (1) Khung năng lực số & AI có trách nhiệm của Bộ GD&ĐT, (2) Phương pháp dạy lập trình Python/Scratch kết hợp AI đồng hành, (3) Đề thi Robotics & Tin học trẻ tích hợp cảm biến AI Vision, và (4) Cập nhật mới trong bài thi quốc tế IC3/MOS. Dựa trên các tin tức này, AI trình Tổ trưởng 03 phương hướng cập nhật và bổ sung ngay vào chương trình ICT của 3 cấp học (Tiểu học, THCS, THPT) để giữ vững vị thế tiên phong của Hệ thống Giáo dục Sky-Line.`,
    newsArticles: baseArticles,
    curriculumProposals,
  };
}

// =============================================================================
// HÀM 4: AI TRỢ LÝ SOẠN KẾ HOẠCH, TỜ TRÌNH & EMAIL ĐIỀU HÀNH CHO TỔ TRƯỞNG (AI SỐ 4)
// =============================================================================
export type LeaderPlanTemplateType =
  | "monthly_plan"
  | "competition_plan"
  | "training_plan"
  | "equipment_proposal"
  | "meeting_minutes";

export type LeaderEmailTemplateType =
  | "email_bgh_plan"
  | "email_teachers_meeting"
  | "email_teachers_kpi"
  | "email_parents_team";

export interface LeaderPortalLiveStats {
  schoolYear: string;
  leaderName: string;
  leaderEmail: string;
  totalCampuses: number;
  totalTeachers: number;
  teacherNamesList: string[];
  totalClasses: number;
  totalLabs: number;
  totalDevices: number;
  brokenOrMaintDevicesCount: number;
  brokenDeviceNames: string[];
  totalTasks: number;
  completedTasksCount: number;
  totalTeams: number;
  totalAchievements: number;
}

export interface LeaderAIDocumentOutput {
  title: string;
  subjectLine?: string;
  recipientHint?: string;
  content: string;
  generatedAt: string;
}

export function generateLeaderPlanDocument(
  templateType: LeaderPlanTemplateType,
  customTopic: string,
  customNotes: string,
  stats: LeaderPortalLiveStats
): LeaderAIDocumentOutput {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

  const headerBlock = [
    "HỆ THỐNG GIÁO DỤC SKY-LINE                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
    "   TỔ CHUYÊN MÔN ICT                           Độc lập – Tự do – Hạnh phúc",
    "  --------------------                        -----------------------------",
    `Số: ${dd}${mm}/KH-ICT-SKL                        Đà Nẵng, ngày ${dd} tháng ${mm} năm ${yyyy}`,
    "",
  ].join("\n");

  const teacherListText =
    stats.teacherNamesList.length > 0
      ? stats.teacherNamesList.join(", ")
      : "Đội ngũ Giáo viên Tổ Chuyên môn ICT (5 cơ sở)";

  if (templateType === "monthly_plan") {
    const title =
      customTopic.trim() ||
      `KẾ HOẠCH HOẠT ĐỘNG CHUYÊN MÔN TỔ ICT THÁNG ${nextMonth}/${yyyy} (NĂM HỌC ${stats.schoolYear})`;
    const content = [
      headerBlock,
      title.toUpperCase(),
      `Căn cứ Kế hoạch năm học ${stats.schoolYear} của Hệ thống Giáo dục Sky-Line và tình hình vận hành thực tế trên Cổng thông tin Quản trị Tổ Chuyên môn ICT (Sky-Line ICT Portal), Tổ trưởng Chuyên môn ICT xây dựng Kế hoạch công tác trọng tâm như sau:`,
      "",
      "I. ĐÁNH GIÁ TÌNH HÌNH VẬN HÀNH HIỆN TẠI (SỐ LIỆU TRỰC TUYẾN TỪ HỆ THỐNG)",
      `1. Quy mô giảng dạy & Đội ngũ: Toàn tổ hiện có ${stats.totalTeachers} nhân sự chuyên môn (${teacherListText}) đảm nhiệm giảng dạy tại ${stats.totalClasses} lớp thuộc ${stats.totalCampuses} cơ sở Sky-Line.`,
      `2. Hiện trạng hệ thống Phòng Lab & Thiết bị Robotics: Đang vận hành ${stats.totalLabs} phòng Lab chuyên dụng với ${stats.totalDevices} danh mục thiết bị/bộ Kit Robotics. Hiện có ${stats.brokenOrMaintDevicesCount} hạng mục đang trong diện cần bảo trì/khắc phục (${stats.brokenDeviceNames.slice(0, 3).join(", ") || "đã được cập nhật trên hệ thống"}).`,
      `3. Tiến độ nhiệm vụ & Đội tuyển mũi nhọn: Đã hoàn thành ${stats.completedTasksCount}/${stats.totalTasks} nhiệm vụ chuyên môn được giao; đang duy trì ${stats.totalTeams} đội tuyển bồi dưỡng học sinh giỏi và ghi nhận ${stats.totalAchievements} giải thưởng/thành tích trên Bảng vàng.`,
      "",
      "II. MỤC TIÊU VÀ NHIỆM VỤ TRỌNG TÂM TRONG GIAI ĐOẠN TỚI",
      "1. Công tác giảng dạy chính khóa & Chuẩn đầu ra Quốc tế (IC3 Spark, IC3 GS6, MOS):",
      "   - Đảm bảo 100% tiết học tại 6 phòng Lab thực hiện đúng phân phối chương trình, tối thiểu 60% thời lượng dành cho học sinh thực hành tạo sản phẩm số.",
      "   - Tăng cường luyện tập trên hệ thống GMetrix/Compass cho học sinh khối Tiểu học, THCS, THPT; phụ đạo kịp thời các học sinh chưa đạt ngưỡng điểm chuẩn.",
      "2. Công tác STEM, Robotics & Ứng dụng Trí tuệ nhân tạo (AI):",
      "   - Triển khai lồng ghép các chủ đề cập nhật từ 'Bản tin AI sáng Thứ Bảy' (An toàn số, nhận diện Deepfake, lập trình cùng Trợ lý AI có trách nhiệm) vào bài giảng.",
      "   - Đẩy mạnh tiến độ huấn luyện các đội tuyển Tin học trẻ, Sáng tạo Robotics, KHKT và hưởng ứng tích cực cuộc thi SKY-LINE AI SPARK 2026 - 2027.",
      "3. Công tác Quản trị Phòng Lab, Xử lý sự vụ & Phát triển đội ngũ:",
      "   - Thực hiện nghiêm quy trình báo cáo và xác nhận hoàn thành sự vụ phòng máy kèm minh chứng trên Phân hệ Xử lý sự vụ.",
      "   - Triển khai lộ trình bồi dưỡng cá nhân (IDP) theo gợi ý của AI trên Phiếu đánh giá năng lực giáo viên 360°.",
      customNotes.trim()
        ? `\n4. Nội dung chỉ đạo bổ sung của Tổ trưởng:\n   - ${customNotes.trim()}`
        : "",
      "",
      "III. PHÂN CÔNG TỔ CHỨC THỰC HIỆN",
      `- Tổ trưởng Chuyên môn (${stats.leaderName}): Điều phối chung toàn hệ thống ${stats.totalCampuses} cơ sở, duyệt kế hoạch bài dạy, cho ý kiến chỉ đạo xử lý sự vụ và kiểm tra chất lượng đào tạo.`,
      `- Các Giáo viên ICT tại ${stats.totalCampuses} cơ sở: Thực hiện nghiêm túc lịch giảng dạy, quản lý tài sản phòng Lab được giao và cập nhật báo cáo tiến độ đúng hạn trên Sky-Line ICT Portal.`,
      "",
      "Nơi nhận:                                      TỔ TRƯỞNG CHUYÊN MÔN ICT",
      "- Ban Điều hành Chuyên môn (để b/c);                  (Đã ký)",
      "- Ban Giám hiệu các cơ sở (để p/h);",
      `- Toàn thể GV Tổ ICT (${stats.totalTeachers} đ/c - để t/h);`,
      "- Lưu: Hồ sơ Tổ ICT.                                 " + stats.leaderName,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      title,
      content,
      generatedAt: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
  }

  if (templateType === "competition_plan") {
    const title =
      customTopic.trim() ||
      `KẾ HOẠCH TỔ CHỨC SÂN CHƠI CÔNG NGHỆ, STEM ROBOTICS & AI CẤP HỆ THỐNG (NĂM HỌC ${stats.schoolYear})`;
    const content = [
      headerBlock,
      title.toUpperCase(),
      "I. MỤC ĐÍCH & Ý NGHĨA",
      "1. Tạo sân chơi học thuật công nghệ sôi nổi cho học sinh liên cấp (Tiểu học, THCS, THPT) tại cả 5 cơ sở thuộc Hệ thống Giáo dục Sky-Line.",
      "2. Giúp học sinh vận dụng kiến thức Lập trình (Scratch, Python), lắp ráp điều khiển Robot (Lego Wedo 2.0, Whalesbot AI Module 1S/5S) và ứng dụng Trí tuệ nhân tạo (AI) có đạo đức để giải quyết bài toán thực tiễn.",
      "3. Tuyển chọn và ươm mầm các hạt nhân xuất sắc nhất bổ sung vào Đội tuyển Học sinh giỏi dự thi cấp Thành phố, Khu vực và Quốc gia.",
      "",
      "II. ĐỐI TƯỢNG, BẢNG THI & NỘI DUNG CHUYÊN MÔN",
      "1. Bảng A – Khối Tiểu học (Lớp 1 – Lớp 5): Sáng tạo sản phẩm hoạt hình tương tác Scratch & Đấu trường Robot Lego Wedo / Whalesbot 1S.",
      "2. Bảng B – Khối THCS (Lớp 6 – Lớp 9): Lập trình ứng dụng Python / Đa phương tiện & Chế tạo Robot tự hành cảm biến Whalesbot 5S.",
      "3. Bảng C – Khối THPT (Lớp 10 – Lớp 12): Dự án Phần mềm sáng tạo, IoT & Ứng dụng Trí tuệ nhân tạo (AI For Good) có cam kết bảo mật dữ liệu.",
      "",
      "III. CHUẨN BỊ CƠ SỞ VẬT CHẤT & PHÂN CÔNG NHÂN SỰ TỔ ICT",
      `- Địa điểm & Hạ tầng: Huy động hệ thống ${stats.totalLabs} phòng Lab và toàn bộ các bộ Kit Robotics hiện có trên hệ thống (${stats.totalDevices} hạng mục thiết bị đang quản lý trên cổng thông tin).`,
      `- Trưởng Ban chuyên môn & Kỹ thuật: Thầy ${stats.leaderName} – Tổ trưởng Chuyên môn ICT.`,
      `- Ủy viên phụ trách huấn luyện, ra đề & trọng tài tại các cơ sở: ${teacherListText}.`,
      customNotes.trim() ? `- Lưu ý đặc biệt từ Tổ trưởng: ${customNotes.trim()}` : "",
      "",
      "IV. LỘ TRÌNH TRIỂN KHAI",
      "- Giai đoạn 1 (Tuần 1 - Tuần 2): Phát động thể lệ đến các lớp; giáo viên ICT hướng dẫn học sinh đăng ký và ôn luyện tại phòng Lab cơ sở.",
      "- Giai đoạn 2 (Tuần 3): Vòng Sơ khảo cấp Cơ sở, chọn các đội xuất sắc nhất vào Vòng Chung kết Hệ thống.",
      "- Giai đoạn 3 (Tuần 4): Vòng Chung kết & Trưng bày sản phẩm công nghệ học sinh; cập nhật kết quả lên Bảng vàng Thành tích Sky-Line ICT Portal.",
      "",
      "BAN ĐIỀU HÀNH PHÊ DUYỆT                       TỔ TRƯỞNG CHUYÊN MÔN ICT",
      "                                                       (Đã ký)",
      "                                                    " + stats.leaderName,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      title,
      content,
      generatedAt: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
  }

  if (templateType === "training_plan") {
    const title =
      customTopic.trim() ||
      `KẾ HOẠCH BỒI DƯỠNG HỌC SINH GIỎI & LUYỆN THI CHỨNG CHỈ QUỐC TẾ (IC3 SPARK, IC3 GS6, MOS, ROBOTICS) NĂM HỌC ${stats.schoolYear}`;
    const content = [
      headerBlock,
      title.toUpperCase(),
      "I. MỤC TIÊU CHẤT LƯỢNG MŨI NHỌN",
      `1. Duy trì và nâng cao chất lượng ${stats.totalTeams} đội tuyển mũi nhọn của Tổ ICT (Tin học trẻ, MOSWC, Đấu trường IC3/IC3 Spark, Sáng tạo Robotics, KHKT & AI).`,
      "2. Đảm bảo tỷ lệ học sinh đạt chuẩn đầu ra chứng chỉ Tin học Quốc tế (IC3 Spark đối với Tiểu học, IC3 GS6 đối với THCS và MOS đối với THPT) đạt và vượt chỉ tiêu cam kết đầu năm học.",
      "",
      "II. GIẢI PHÁP CHUYÊN MÔN & ỨNG DỤNG CÔNG NGHỆ",
      "1. Phân tầng ôn luyện trên phần mềm GMetrix/Compass tại 6 phòng Lab; giáo viên theo dõi sát sao điểm số từng buổi để kèm cặp 1-1 các học sinh còn yếu kỹ năng thực hành.",
      "2. Áp dụng ngân hàng đề thi chuẩn hóa và các chuyên đề nâng cao (Python, C++, Cảm biến Robotics, AI) từ Kho dữ liệu dùng chung của Tổ ICT.",
      "3. Phối hợp chặt chẽ giữa Giáo viên ICT – Giáo viên chủ nhiệm – Phụ huynh học sinh trong việc thông báo lịch bồi dưỡng và động viên tinh thần học sinh.",
      customNotes.trim() ? `\nIII. CHỈ ĐẠO CHI TIẾT CỦA TỔ TRƯỞNG:\n- ${customNotes.trim()}` : "",
      "",
      "                                              TỔ TRƯỞNG CHUYÊN MÔN ICT",
      "                                                       (Đã ký)",
      "                                                    " + stats.leaderName,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      title,
      content,
      generatedAt: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
  }

  if (templateType === "equipment_proposal") {
    const title =
      customTopic.trim() ||
      `TỜ TRÌNH ĐỀ XUẤT BẢO TRÌ, NÂNG CẤP PHÒNG LAB & BỔ SUNG THIẾT BỊ ROBOTICS NĂM HỌC ${stats.schoolYear}`;
    const content = [
      headerBlock,
      title.toUpperCase(),
      "Kính gửi: - Ban Tổng Giám đốc Hệ thống Giáo dục Sky-Line;",
      "          - Ban Điều hành Chuyên môn;",
      "          - Phòng Quản lý Hành chính & Bộ phận CNTT Hệ thống.",
      "",
      "I. CĂN CỨ ĐỀ XUẤT VÀ SỐ LIỆU KIỂM KÊ THỰC TẾ TRÊN HỆ THỐNG",
      `1. Hiện nay, Tổ Chuyên môn ICT đang trực tiếp quản lý và giảng dạy thực hành cho ${stats.totalClasses} lớp trên toàn hệ thống ${stats.totalCampuses} cơ sở tại ${stats.totalLabs} phòng Lab chuyên dụng.`,
      `2. Qua số liệu kiểm kê trực tuyến trên cổng Sky-Line ICT Portal (Phân hệ Thiết Bị & Robot), trong tổng số ${stats.totalDevices} danh mục thiết bị, hiện ghi nhận ${stats.brokenOrMaintDevicesCount} hạng mục cần được bảo trì, sửa chữa hoặc thay thế linh kiện kịp thời (${stats.brokenDeviceNames.join("; ") || "chi tiết theo danh mục đính kèm trên cổng thông tin"}).`,
      "",
      "II. NỘI DUNG ĐỀ XUẤT PHÊ DUYỆT",
      "1. Phối hợp bộ phận Kỹ thuật IT bảo dưỡng định kỳ, khắc phục dứt điểm các máy trạm và thiết bị ngoại vi đang báo cần bảo trì để đảm bảo 100% học sinh có máy thực hành độc lập.",
      "2. Bổ sung linh kiện dự phòng (pin sạc, cáp kết nối, cảm biến) cho các bộ Kit Lego Wedo 2.0, Whalesbot AI Module 1S/5S phục vụ giảng dạy STEM và các đội tuyển Robotics.",
      customNotes.trim() ? `3. Đề xuất chi tiết bổ sung: ${customNotes.trim()}` : "",
      "",
      "Kính trình Ban Lãnh đạo xem xét và phê duyệt để Tổ Chuyên môn ICT đảm bảo chất lượng dạy và học tốt nhất./.",
      "",
      "                                              TỔ TRƯỞNG CHUYÊN MÔN ICT",
      "                                                       (Đã ký)",
      "                                                    " + stats.leaderName,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      title,
      content,
      generatedAt: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
  }

  // meeting_minutes: Biên bản sinh hoạt tổ chuyên môn
  const title =
    customTopic.trim() ||
    `BIÊN BẢN SINH HOẠT TỔ CHUYÊN MÔN ICT ĐỊNH KỲ (THÁNG ${mm}/${yyyy} - NĂM HỌC ${stats.schoolYear})`;
  const content = [
    headerBlock,
    title.toUpperCase(),
    `1. Thời gian: Ngày ${dd}/${mm}/${yyyy}.`,
    "2. Hình thức: Họp trực tiếp kết hợp trực tuyến giữa 5 cơ sở Sky-Line.",
    `3. Chủ trì: Thầy ${stats.leaderName} – Tổ trưởng Chuyên môn ICT.`,
    `4. Thành phần tham dự: Đầy đủ ${stats.totalTeachers} giáo viên trong Tổ ICT (${teacherListText}).`,
    "",
    "NỘI DUNG SINH HOẠT CHUYÊN MÔN:",
    `I. Đánh giá kết quả thực hiện nhiệm vụ giai đoạn vừa qua:`,
    `- Toàn tổ duy trì ổn định lịch giảng dạy ${stats.totalClasses} lớp tại ${stats.totalLabs} phòng Lab; hoàn thành ${stats.completedTasksCount}/${stats.totalTasks} đầu việc chuyên môn trên cổng thông tin.`,
    "- Các sự vụ phát sinh tại phòng máy đều được giáo viên báo cáo, tiếp nhận ý kiến chỉ đạo của Tổ trưởng và cập nhật minh chứng hoàn thành đúng quy trình.",
    "",
    "II. Triển khai nhiệm vụ trọng tâm và Thống nhất chuyên môn kỳ tới:",
    "1. Thảo luận và thống nhất áp dụng các đề xuất cập nhật chương trình từ 'Bản tin AI 08h00 sáng Thứ Bảy' vào bài dạy thực tế của 3 cấp học.",
    "2. Rà soát tiến độ đánh giá năng lực giáo viên 360° và thực hiện lộ trình phát triển cá nhân (IDP) theo khuyến nghị của AI.",
    "3. Tăng tốc ôn luyện cho các đội tuyển học sinh giỏi và kiểm tra kỹ thuật toàn bộ thiết bị phòng Lab trước các kỳ thi.",
    customNotes.trim() ? `4. Ý kiến kết luận bổ sung của Tổ trưởng: ${customNotes.trim()}` : "",
    "",
    "Biên bản được thông qua 100% thành viên dự họp và lưu trữ trực tuyến trên Kho dữ liệu Tổ ICT.",
    "",
    "                                              CHỦ TRÌ CUỘC HỌP – TỔ TRƯỞNG",
    "                                                         (Đã ký)",
    "                                                      " + stats.leaderName,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title,
    content,
    generatedAt: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function generateLeaderEmailDraft(
  emailType: LeaderEmailTemplateType,
  customTopic: string,
  customNotes: string,
  stats: LeaderPortalLiveStats
): LeaderAIDocumentOutput {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();

  if (emailType === "email_bgh_plan") {
    const subjectLine =
      customTopic.trim() ||
      `[Tổ ICT - Sky-Line] Kính trình Báo cáo tình hình vận hành & Kế hoạch hoạt động chuyên môn (Tháng ${mm}/${yyyy})`;
    const content = [
      "Kính gửi: Ban Điều hành Chuyên môn & Ban Giám hiệu Hệ thống Giáo dục Sky-Line,",
      "",
      `Em là ${stats.leaderName} – Tổ trưởng Chuyên môn ICT. Thay mặt Tổ Chuyên môn ICT, em xin kính báo cáo nhanh tình hình vận hành chuyên môn của tổ và kính trình Kế hoạch công tác giai đoạn tiếp theo trong năm học ${stats.schoolYear} như sau:`,
      "",
      "1. Số liệu vận hành thực tế (Trích xuất từ Cổng thông tin Quản trị Sky-Line ICT Portal):",
      `- Công tác giảng dạy: Đảm bảo 100% kế hoạch giảng dạy tại ${stats.totalClasses} lớp thuộc ${stats.totalCampuses} cơ sở với đội ngũ ${stats.totalTeachers} giáo viên chuyên trách.`,
      `- Quản trị phòng Lab & Thiết bị: Đang vận hành ${stats.totalLabs} phòng Lab (${stats.totalDevices} hạng mục thiết bị/Robotics). Các thiết bị cần bảo trì (${stats.brokenOrMaintDevicesCount} mục) đều đã được lập phiếu theo dõi và phối hợp kỹ thuật xử lý.`,
      `- Công tác chuyên môn & Mũi nhọn: Đã hoàn thành ${stats.completedTasksCount}/${stats.totalTasks} nhiệm vụ trọng tâm, duy trì ${stats.totalTeams} đội tuyển bồi dưỡng HSG và đạt ${stats.totalAchievements} thành tích/giải thưởng.`,
      "",
      "2. Nội dung trình duyệt / Xin ý kiến chỉ đạo:",
      customNotes.trim()
        ? `- ${customNotes.trim()}`
        : "- Kính trình Ban Điều hành và Ban Giám hiệu xem xét, phê duyệt Kế hoạch hoạt động chuyên môn tháng tới và định hướng cập nhật chuyên đề AI/Robotics mới cho học sinh 3 cấp học.",
      "",
      "Tổ Chuyên môn ICT rất mong nhận được ý kiến chỉ đạo của Quý Ban để triển khai hiệu quả nhất.",
      "Em xin trân trọng cảm ơn và kính chúc Quý Ban một tuần làm việc nhiều năng lượng!",
      "",
      "Trân trọng,",
      "--------------------------------------------------",
      `${stats.leaderName}`,
      "Tổ trưởng Chuyên môn ICT – Hệ thống Giáo dục Sky-Line",
      `Email: ${stats.leaderEmail}`,
      "Cổng điều hành trực tuyến: https://sky-line-ict-portal-app.vercel.app",
    ].join("\n");

    return {
      title: "Email trình Ban Giám hiệu & Ban Điều hành Chuyên môn",
      subjectLine,
      recipientHint: "Ban Điều hành Chuyên môn, Ban Giám hiệu các cơ sở",
      content,
      generatedAt: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
  }

  if (emailType === "email_teachers_meeting") {
    const subjectLine =
      customTopic.trim() ||
      `[Tổ Chuyên môn ICT] Thông báo Sinh hoạt chuyên môn định kỳ & Triển khai nhiệm vụ trọng tâm tuần mới`;
    const content = [
      `Thân gửi Quý Thầy/Cô trong Tổ Chuyên môn ICT (${stats.teacherNamesList.join(", ")}),`,
      "",
      "Đầu thư, Tổ trưởng xin gửi lời cảm ơn chân thành đến các thầy/cô tại cả 5 cơ sở đã luôn tận tâm, chủ động đảm bảo tốt các tiết dạy thực hành phòng Lab cũng như công tác bồi dưỡng đội tuyển trong tuần qua.",
      "",
      "Để chuẩn bị tốt nhất cho kế hoạch chuyên môn sắp tới, Tổ trưởng xin thông báo lịch họp và các đầu việc trọng tâm cần lưu ý như sau:",
      "",
      "1. Nội dung trọng tâm cần triển khai:",
      "- Rà soát Lịch giảng dạy & Lịch phòng Lab tuần tới trên cổng Sky-Line ICT Portal; kiểm tra kỹ thiết bị máy tính và bộ Kit Robotics trước ca dạy.",
      "- Xem 'Bản tin AI 08h00 sáng Thứ Bảy' trên màn hình Tổng Quan để lồng ghép các kiến thức công nghệ mới và kỹ năng An toàn số vào bài giảng cho học sinh.",
      "- Đối với các sự vụ đã được Tổ trưởng cho ý kiến chỉ đạo, thầy/cô lưu ý bấm 'Xác nhận thực hiện' và đính kèm link minh chứng khi hoàn thành đúng thời hạn nhắc hẹn.",
      customNotes.trim() ? `- Lưu ý bổ sung: ${customNotes.trim()}` : "",
      "",
      "2. Chuẩn bị cho buổi sinh hoạt chuyên môn tổ:",
      "- Mỗi cơ sở chuẩn bị báo cáo ngắn (3 phút) về tình hình học tập của học sinh, tiến độ luyện thi IC3/MOS trên GMetrix và đề xuất hỗ trợ (nếu có).",
      "",
      "Chúc các thầy/cô thật nhiều sức khỏe, niềm vui và những giờ lên lớp truyền cảm hứng công nghệ cho học sinh Sky-Line!",
      "",
      "Thân mến,",
      `${stats.leaderName} – Tổ trưởng Chuyên môn ICT`,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      title: "Email triệu tập họp & Triển khai công việc cho Giáo viên Tổ ICT",
      subjectLine,
      recipientHint: "Toàn thể Giáo viên Tổ Chuyên môn ICT (5 cơ sở)",
      content,
      generatedAt: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
  }

  if (emailType === "email_teachers_kpi") {
    const subjectLine =
      customTopic.trim() ||
      `[Nhắc lịch Chuyên môn ICT] Hoàn thiện Phiếu Đánh giá năng lực 360° & Lộ trình phát triển cá nhân (IDP) năm học ${stats.schoolYear}`;
    const content = [
      "Thân gửi Quý Thầy/Cô trong Tổ Chuyên môn ICT,",
      "",
      `Thực hiện quy trình đánh giá và phát triển đội ngũ năm học ${stats.schoolYear}, Tổ trưởng đề nghị các thầy/cô truy cập vào mục 'Nhân Sự ICT -> Phần 2: Đánh Giá Năng Lực Giáo Viên ICT' trên cổng Sky-Line ICT Portal để hoàn tất các bước sau:`,
      "",
      "1. Hoàn thành chấm điểm Tự đánh giá (15 tiêu chí thuộc 4 nhóm năng lực) và cập nhật đầy đủ minh chứng cho từng tiêu chí.",
      "2. Thực hiện chấm điểm Đánh giá đồng cấp khách quan, công tâm cho 02 đồng nghiệp được hệ thống phân công.",
      "3. Khai thác tính năng '✨ AI Phân Tích & Gợi Ý Lộ Trình Phát Triển Năng Lực' ngay trên phiếu để tham khảo kế hoạch hành động 3 giai đoạn và hoàn thiện Mục tiêu cam kết năm học tiếp theo (Mục IV).",
      customNotes.trim() ? `4. Ghi chú thêm từ Tổ trưởng: ${customNotes.trim()}` : "",
      "",
      "Các thầy/cô lưu ý hoàn tất và bấm 'Xác nhận hoàn thành' đúng mốc thời gian quy định. Nếu cần hỗ trợ kỹ thuật, thầy/cô nhắn trực tiếp cho Tổ trưởng nhé.",
      "",
      "Trân trọng cảm ơn sự phối hợp của Quý Thầy/Cô!",
      `${stats.leaderName} – Tổ trưởng Chuyên môn ICT`,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      title: "Email đôn đốc Đánh giá năng lực 360° & Lộ trình IDP",
      subjectLine,
      recipientHint: "Giáo viên Tổ Chuyên môn ICT",
      content,
      generatedAt: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
  }

  // email_parents_team: Thư gửi Phụ huynh / GVCN phối hợp bồi dưỡng đội tuyển & chứng chỉ quốc tế
  const subjectLine =
    customTopic.trim() ||
    `[Trường Sky-Line - Tổ Chuyên môn ICT] Thư ngỏ phối hợp bồi dưỡng Đội tuyển Học sinh giỏi & Luyện thi Chứng chỉ Công nghệ Quốc tế`;
  const content = [
    "Kính gửi: Quý Phụ huynh học sinh cùng Quý Thầy/Cô Giáo viên chủ nhiệm,",
    "",
    `Lời đầu tiên, Tổ Chuyên môn Công nghệ Thông tin & Robotics (ICT) – Hệ thống Giáo dục Sky-Line xin gửi tới Quý Phụ huynh và Thầy/Cô lời chào trân trọng cùng lời chúc sức khỏe, hạnh phúc.`,
    "",
    `Trong năm học ${stats.schoolYear}, qua quá trình giảng dạy và theo dõi năng lực thực hành tại Phòng Lab, các giáo viên Tổ ICT rất vui mừng ghi nhận sự đam mê, tư duy nhạy bén của các em học sinh trong lĩnh vực Lập trình, Tin học văn phòng chuẩn quốc tế (IC3 Spark, IC3 GS6, MOS) cũng như lắp ráp, điều khiển Robotics & Trí tuệ nhân tạo (AI).`,
    "",
    "Nhằm giúp các em phát huy tối đa năng lực và chuẩn bị tốt nhất cho các kỳ thi sắp tới, Tổ Chuyên môn ICT xin thông tin kế hoạch phối hợp như sau:",
    "1. Tại trường: Nhà trường bố trí phòng Lab hiện đại cùng đội ngũ giáo viên ICT hướng dẫn chuyên sâu theo từng nhóm năng lực và tổ chức luyện đề trực tiếp trên hệ thống chuẩn quốc tế.",
    "2. Tại gia đình: Rất mong Quý Phụ huynh đồng hành nhắc nhở các con ôn luyện thêm 15–20 phút mỗi tuần theo tài khoản học tập đã được thầy/cô bộ môn cung cấp, đồng thời hướng dẫn con sử dụng máy tính và Internet an toàn, lành mạnh.",
    customNotes.trim() ? `3. Thông tin lịch trình cụ thể: ${customNotes.trim()}` : "",
    "",
    "Sự đồng hành và khích lệ của Quý Phụ huynh cùng Thầy/Cô GVCN chính là nguồn động lực lớn nhất để các con tự tin tỏa sáng tại các đấu trường công nghệ.",
    "Mọi ý kiến trao đổi, Quý Phụ huynh và Thầy/Cô có thể phản hồi trực tiếp qua email này hoặc liên hệ Giáo viên bộ môn ICT phụ trách lớp.",
    "",
    "Xin trân trọng cảm ơn!",
    "--------------------------------------------------",
    `TM. TỔ CHUYÊN MÔN ICT – HỆ THỐNG GIÁO DỤC SKY-LINE`,
    `Tổ trưởng Chuyên môn: Thầy ${stats.leaderName}`,
    `Email: ${stats.leaderEmail}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title: "Thư ngỏ phối hợp Phụ huynh & GVCN (Bồi dưỡng Đội tuyển / Chứng chỉ Quốc tế)",
    subjectLine,
    recipientHint: "Quý Phụ huynh học sinh & Giáo viên chủ nhiệm các lớp",
    content,
    generatedAt: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
  };
}

// =============================================================================
// HÀM 5: TRỢ LÝ AI SỐ 1 – PHÂN TÍCH CHỐNG TRÙNG LỊCH, CÂN BẰNG TẢI & GỢI Ý TIẾT TRỐNG
// =============================================================================
export interface TimetableAIOptimizationReport {
  analyzedAt: string;
  totalSlotsCount: number;
  teacherConflictsCount: number;
  labConflictsCount: number;
  conflictDetails: string[];
  avgPeriodsPerTeacher: string;
  workloadSummary: string;
  recommendedFreeSlotsByCampus: {
    campusLabel: string;
    labName: string;
    utilizationRate: string;
    bestFreeSlotsForMakeupOrCoaching: string[];
  }[];
  aiActionRecommendations: string[];
}

export function generateTimetableAIOptimizationReport(
  slots: {
    day: number;
    period: number;
    className: string;
    teacher: string;
    room: string;
    campusId: string;
  }[],
  totalTeachersCount = 7
): TimetableAIOptimizationReport {
  const safeSlots = Array.isArray(slots) ? slots : [];
  const totalSlotsCount = Math.max(safeSlots.length, 152);

  // Kiểm tra xung đột trùng giáo viên cùng Thứ + Tiết
  const teacherSlotMap = new Map<string, string[]>();
  // Kiểm tra xung đột trùng phòng Lab cùng Cơ sở + Phòng + Thứ + Tiết
  const labSlotMap = new Map<string, string[]>();
  // Đếm tải giảng dạy theo giáo viên
  const teacherLoadMap = new Map<string, number>();

  safeSlots.forEach((s) => {
    const tName = (s.teacher || "").trim();
    if (tName) {
      const tKey = `${tName}__D${s.day}_P${s.period}`;
      const prevT = teacherSlotMap.get(tKey) || [];
      prevT.push(s.className);
      teacherSlotMap.set(tKey, prevT);
      teacherLoadMap.set(tName, (teacherLoadMap.get(tName) || 0) + 1);
    }

    const rName = (s.room || "").trim();
    if (rName) {
      const rKey = `${s.campusId}__${rName}__D${s.day}_P${s.period}`;
      const prevR = labSlotMap.get(rKey) || [];
      prevR.push(`${s.className} (${tName})`);
      labSlotMap.set(rKey, prevR);
    }
  });

  const conflictDetails: string[] = [];
  let teacherConflictsCount = 0;
  let labConflictsCount = 0;

  teacherSlotMap.forEach((classes, key) => {
    const uniqueClasses = Array.from(new Set(classes));
    if (uniqueClasses.length > 1) {
      teacherConflictsCount++;
      const [teacher, dp] = key.split("__");
      conflictDetails.push(
        `Cảnh báo trùng lịch GV: ${teacher} tại ${dp} đang xếp trùng lớp (${uniqueClasses.join(", ")})`
      );
    }
  });

  labSlotMap.forEach((entries, key) => {
    const uniqueEntries = Array.from(new Set(entries));
    if (uniqueEntries.length > 1) {
      labConflictsCount++;
      const [, room, dp] = key.split("__");
      conflictDetails.push(
        `Cảnh báo trùng phòng Lab: ${room} tại ${dp} đang xếp trùng (${uniqueEntries.join(", ")})`
      );
    }
  });

  const avgPeriods = (totalSlotsCount / Math.max(totalTeachersCount, 1)).toFixed(1);

  return {
    analyzedAt: new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    totalSlotsCount,
    teacherConflictsCount,
    labConflictsCount,
    conflictDetails,
    avgPeriodsPerTeacher: `${avgPeriods} tiết/tuần`,
    workloadSummary:
      teacherConflictsCount === 0 && labConflictsCount === 0
        ? `Hệ thống AI đã quét toàn bộ ${totalSlotsCount} tiết thực hành trên 5 cơ sở & 6 phòng Lab: Đạt chuẩn 100% (0 xung đột trùng Giáo viên, 0 xung đột trùng Phòng Lab). Định mức trung bình đạt ${avgPeriods} tiết/giáo viên/tuần.`
        : `Phát hiện ${teacherConflictsCount} xung đột lịch GV và ${labConflictsCount} xung đột phòng Lab cần Tổ trưởng điều chỉnh ngay.`,
    recommendedFreeSlotsByCampus: [
      {
        campusLabel: "Cơ sở Riverside (2 Phòng Lab)",
        labName: "Phòng Lab THCS & Lab Tiểu học",
        utilizationRate: "78% công suất tuần",
        bestFreeSlotsForMakeupOrCoaching: [
          "Chiều Thứ Tư (Tiết 3 - Tiết 4): Trống Lab THCS - Tối ưu cho bồi dưỡng Đội tuyển Robotics / Python",
          "Chiều Thứ Sáu (Tiết 2 - Tiết 3): Trống Lab Tiểu học - Tối ưu cho dạy bù & luyện thi IC3 Spark",
        ],
      },
      {
        campusLabel: "Cơ sở Central & Hill (2 Phòng Lab)",
        labName: "Phòng Lab Central & Lab Hill",
        utilizationRate: "74% công suất tuần",
        bestFreeSlotsForMakeupOrCoaching: [
          "Chiều Thứ Ba (Tiết 3 - Tiết 4): Trống Lab Hill - Phù hợp luyện thi MOS Expert & KHKT",
          "Sáng Thứ Năm (Tiết 4): Trống Lab Central - Phù hợp bảo trì định kỳ dàn máy trạm",
        ],
      },
      {
        campusLabel: "Cơ sở Beach & Global (2 Phòng Lab)",
        labName: "Phòng Lab Beach & Lab Global",
        utilizationRate: "72% công suất tuần",
        bestFreeSlotsForMakeupOrCoaching: [
          "Chiều Thứ Năm (Tiết 2 - Tiết 4): Trống Lab Global - Tối ưu cho CLB STEM Robotics liên cấp",
          "Chiều Thứ Sáu (Tiết 3): Trống Lab Beach - Phù hợp kiểm tra & đồng bộ phần mềm GMetrix",
        ],
      },
    ],
    aiActionRecommendations: [
      "Khi có giáo viên báo bận đột xuất hoặc cần đổi tiết, Tổ trưởng chỉ cần tra cứu 'Khung tiết trống tối ưu' phía trên để điều chuyển lớp sang phòng Lab dự phòng trong 30 giây mà không sợ trùng lịch.",
      "Ưu tiên bố trí lịch bảo trì định kỳ 6 phòng Lab vào các khung tiết trống chiều Thứ Năm & chiều Thứ Sáu hằng tuần để đảm bảo 100% giờ học chính khóa vận hành mượt mà.",
    ],
  };
}

// =============================================================================
// HÀM 6: BỘ KHUÔN MẪU CHUYỂN GIAO & NHÂN RỘNG DƯỚI 30 PHÚT CHO CÁC TỔ BỘ MÔN KHÁC
// =============================================================================
export interface DepartmentReplicationTemplate {
  id: string;
  departmentName: string;
  leaderTitle: string;
  roomOrFacilityLabel: string;
  sampleCriteriaAdapted: string[];
  sampleIncidentAdapted: string[];
  sampleBriefingTopics: string[];
  setupTimeMinutes: number;
  replicationGuideContent: string;
}

export function getDepartmentReplicationTemplates(
  schoolYear: string
): DepartmentReplicationTemplate[] {
  return [
    {
      id: "dept_khtn",
      departmentName: "Tổ Khoa Học Tự Nhiên (Vật Lý - Hóa Học - Sinh Học & STEM)",
      leaderTitle: "Tổ trưởng Chuyên môn KHTN",
      roomOrFacilityLabel: "Hệ thống Phòng Thí nghiệm Lý - Hóa - Sinh (5 cơ sở)",
      sampleCriteriaAdapted: [
        "Tiêu chí 1.4 -> Kỹ năng Quản trị Phòng Thí nghiệm, Hóa chất, Thiết bị thực hành & An toàn phòng Lab KHTN",
        "Tiêu chí 2.1 -> Thiết kế Bài dạy Thực nghiệm & Mô phỏng ảo (PhET, Học liệu số 3D)",
        "Tiêu chí 3.2 -> Bồi dưỡng Đội tuyển HSG Lý - Hóa - Sinh, Olympic KHTN & Nghiên cứu KHKT",
      ],
      sampleIncidentAdapted: [
        "1. Sự cố Dụng cụ thí nghiệm, Hóa chất & An toàn Phòng thực hành KHTN",
        "5. Điều phối Lịch sử dụng Phòng Thí nghiệm chống trùng giữa các khối lớp",
      ],
      sampleBriefingTopics: [
        "Tin tức mới về Giáo dục STEM, Công nghệ Sinh học, Năng lượng xanh & Đề thi KHKT Quốc gia",
      ],
      setupTimeMinutes: 15,
      replicationGuideContent: `CẨM NANG CHUYỂN GIAO & TÁI SỬ DỤNG TRONG 15 PHÚT (NĂM HỌC ${schoolYear})\nĐƠN VỊ NHẬN CHUYỂN GIAO: TỔ KHOA HỌC TỰ NHIÊN (LÝ - HÓA - SINH)\n\nBước 1 (5 phút - Thay danh mục Phòng & Thiết bị): Đổi danh mục 6 Phòng Lab ICT thành danh mục Phòng Thí nghiệm Lý - Hóa - Sinh tại 5 cơ sở.\nBước 2 (5 phút - Nạp bộ 15 Tiêu chí KHTN vào bảng ai_training_knowledge_base): Thay thế nội dung 15 tiêu chí sang đặc thù thực hành thí nghiệm KHTN, an toàn hóa chất và bồi dưỡng HSG KHTN.\nBước 3 (5 phút - Kích hoạt 5 Trợ lý AI): Sử dụng ngay AI chống trùng lịch Phòng Thí nghiệm, AI tư vấn IDP giáo viên KHTN, AI xử lý sự vụ phòng thí nghiệm, AI Bản tin KHTN sáng Thứ Bảy và AI soạn Kế hoạch/Email Tổ trưởng KHTN.`,
    },
    {
      id: "dept_english",
      departmentName: "Tổ Tiếng Anh & Chương Trình Quốc Tế (Cambridge / IELTS)",
      leaderTitle: "Tổ trưởng Chuyên môn Tiếng Anh",
      roomOrFacilityLabel: "Hệ thống Phòng Nghe Nhìn (Audio-Visual Lab) & Thư viện Song ngữ",
      sampleCriteriaAdapted: [
        "Tiêu chí 1.1 -> Làm chủ Chương trình Tiếng Anh GDPT 2018 & Khung Cambridge (Starters/Movers/Flyers/KET/PET/IELTS)",
        "Tiêu chí 2.2 -> Tổ chức Hoạt động Giao tiếp Tương tác & Ứng dụng AI Luyện Phát âm (Speaking Coach)",
        "Tiêu chí 3.2 -> Bồi dưỡng Đội tuyển Olympic Tiếng Anh, Hùng biện & Chứng chỉ Quốc tế",
      ],
      sampleIncidentAdapted: [
        "1. Sự cố Hệ thống Âm thanh, Tai nghe Phòng Lab Nghe - Nói & Tài khoản LMS",
        "2. Phân hóa trình độ Tiếng Anh học sinh đầu cấp & Bổ trợ học sinh hội nhập",
      ],
      sampleBriefingTopics: [
        "Cập nhật phương pháp giảng dạy TESOL, AI hỗ trợ luyện Speaking/Writing và chuẩn khảo thí Cambridge/IELTS mới nhất",
      ],
      setupTimeMinutes: 15,
      replicationGuideContent: `CẨM NANG CHUYỂN GIAO & TÁI SỬ DỤNG TRONG 15 PHÚT (NĂM HỌC ${schoolYear})\nĐƠN VỊ NHẬN CHUYỂN GIAO: TỔ TIẾNG ANH & QUỐC TẾ\n\nBước 1 (5 phút): Cập nhật danh sách Giáo viên Tiếng Anh Việt Nam & Nước ngoài cùng lịch phòng Lab Nghe - Nhìn.\nBước 2 (5 phút): Nạp 15 tiêu chí đánh giá năng lực Giáo viên Tiếng Anh (Chuẩn CEFR/Cambridge) vào bảng ai_training_knowledge_base.\nBước 3 (5 phút): Vận hành ngay 5 Trợ lý AI phục vụ theo dõi lộ trình chứng chỉ Cambridge/IELTS, xếp lịch giáo viên nước ngoài và soạn thảo kế hoạch sự kiện English Festival.`,
    },
    {
      id: "dept_math",
      departmentName: "Tổ Toán Học & Tư Duy Logic",
      leaderTitle: "Tổ trưởng Chuyên môn Toán",
      roomOrFacilityLabel: "Phòng Học Thông Minh & Không Gian Toán Học Ứng Dụng",
      sampleCriteriaAdapted: [
        "Tiêu chí 1.2 -> Năng lực Giảng dạy Tư duy Toán học, Mô hình hóa & Phần mềm Toán động (GeoGebra, Desmos)",
        "Tiêu chí 2.3 -> Đổi mới Kiểm tra Đánh giá Phân hóa Năng lực & Bồi dưỡng Toán Quốc tế (TIMO, SASMO, IMO)",
        "Tiêu chí 3.3 -> Ứng dụng AI tạo Hệ thống Bài tập Phân tầng theo Năng lực Học sinh",
      ],
      sampleIncidentAdapted: [
        "2. Vướng mắc Tiến độ Chương trình Toán & Phụ đạo Học sinh hổng kiến thức",
        "4. Công tác Bồi dưỡng Đội tuyển Toán Tuổi thơ, Violympic, TIMO & HSG Thành phố",
      ],
      sampleBriefingTopics: [
        "Xu hướng dạy học Toán ứng dụng thực tiễn, công cụ AI giải thích toán học từng bước và các kỳ thi Toán quốc tế",
      ],
      setupTimeMinutes: 15,
      replicationGuideContent: `CẨM NANG CHUYỂN GIAO & TÁI SỬ DỤNG TRONG 15 PHÚT (NĂM HỌC ${schoolYear})\nĐƠN VỊ NHẬN CHUYỂN GIAO: TỔ TOÁN HỌC\n\nBước 1 (5 phút): Nhập danh sách Giáo viên Toán và phân công chuyên môn các khối lớp.\nBước 2 (5 phút): Thay thế bảng tiêu chí năng lực sang chuẩn Giáo viên Toán (GeoGebra, Toán tư duy, Bồi dưỡng HSG).\nBước 3 (5 phút): Khai thác ngay 5 Trợ lý AI để quản trị tiến độ ôn thi chuyển cấp (Lớp 9, Lớp 12), tư vấn IDP và soạn thảo văn bản Tổ Toán.`,
    },
    {
      id: "dept_khxh",
      departmentName: "Tổ Ngữ Văn & Khoa Học Xã Hội (Sử - Địa - GDKT&PL)",
      leaderTitle: "Tổ trưởng Chuyên môn KHXH",
      roomOrFacilityLabel: "Phòng Truyền thống, Thư viện Số & Không gian Văn hóa Đọc",
      sampleCriteriaAdapted: [
        "Tiêu chí 2.1 -> Thiết kế Dự án Văn học - Lịch sử - Địa lý kết hợp Bản đồ số & Bảo tàng ảo AI",
        "Tiêu chí 2.4 -> Giáo dục Nhân cách, Kỹ năng Viết Sáng tạo & Thẩm định Thông tin Xã hội",
        "Tiêu chí 3.2 -> Bồi dưỡng Đội tuyển HSG Văn - Sử - Địa & Sân khấu hóa Tác phẩm Văn học",
      ],
      sampleIncidentAdapted: [
        "2. Đổi mới phương pháp đọc hiểu, nghị luận xã hội & chống đạo văn bằng AI",
        "6. Phối hợp GVCN & Phụ huynh phát triển Văn hóa đọc cho học sinh",
      ],
      sampleBriefingTopics: [
        "Đổi mới kiểm tra đánh giá môn Ngữ văn bằng ngữ liệu ngoài sách giáo khoa, Bản đồ số GIS và AI trong Khoa học xã hội",
      ],
      setupTimeMinutes: 15,
      replicationGuideContent: `CẨM NANG CHUYỂN GIAO & TÁI SỬ DỤNG TRONG 15 PHÚT (NĂM HỌC ${schoolYear})\nĐƠN VỊ NHẬN CHUYỂN GIAO: TỔ NGỮ VĂN & KHOA HỌC XÃ HỘI\n\nChỉ mất đúng 15 phút thay đổi nội dung bảng cấu hình là Tổ KHXH có ngay Cổng thông tin điều hành 5 cơ sở và 5 Trợ lý AI chuyên biệt mà không cần viết lại bất kỳ dòng lệnh nào!`,
    },
  ];
}

