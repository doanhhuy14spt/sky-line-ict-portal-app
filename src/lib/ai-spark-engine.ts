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
}

export interface TeacherCompetencyAIResult {
  generatedAt: string;
  overallSummary: string;
  perceptionGapNote: string;
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

  const top3Strengths = sortedDesc.slice(0, 3).map((c) => {
    const bank = CRITERION_ACTION_BANK[c.code];
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
    const bank = CRITERION_ACTION_BANK[c.code];
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

  const overallSummary = `Qua phân tích dữ liệu đánh giá 360° (15 tiêu chí thuộc 4 nhóm năng lực) của ${input.teacherName} (${input.staffCode}) tại cơ sở ${input.campus} (Cấp dạy: ${levels.join(", ")}), mức điểm tổng kết hiện tại là ${finalScoreText}. Giáo viên thể hiện thế mạnh rõ nét ở [${top3Strengths.map((s) => `${s.code} - ${s.title}`).join(", ")}], đồng thời cần ưu tiên tập trung nguồn lực nâng cao [${bottom3Improvements.map((i) => `${i.code} - ${i.title}`).join(", ")}] để bứt phá lên nấc thang năng lực cao hơn trong năm học ${input.schoolYear}.`;

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
    `1. Về chuyên môn & giảng dạy (${levels.join(", ")}): ${CRITERION_ACTION_BANK[bottom3Improvements[0].code]?.goalTarget || "Nâng điểm tất cả các tiêu chí hiện dưới 3.2 lên mức Thành thạo - Xuất sắc (≥ 3.5/4.0)."}`,
    `2. Về phát triển mũi nhọn STEM/Robotics & EdTech AI: ${CRITERION_ACTION_BANK[bottom3Improvements[1].code]?.goalTarget || "Tích cực bồi dưỡng học sinh giỏi và làm hạt nhân hỗ trợ công nghệ tại cơ sở."}`,
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

