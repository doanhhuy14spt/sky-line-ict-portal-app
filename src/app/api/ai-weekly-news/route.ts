import { NextRequest, NextResponse } from "next/server";

export interface VerifiedNewsHeadline {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  domain: string;
  trustTier: "tier1_official" | "tier2_open_search";
  trustScore: number;
  trustBadgeLabel: string;
}

const OFFICIAL_RSS_SOURCES = [
  {
    name: "VnExpress Giáo dục",
    domain: "vnexpress.net",
    url: "https://vnexpress.net/rss/giao-duc.rss",
    tier: "tier1_official" as const,
    score: 98,
  },
  {
    name: "VnExpress Khoa học & Công nghệ",
    domain: "vnexpress.net",
    url: "https://vnexpress.net/rss/khoa-hoc.rss",
    tier: "tier1_official" as const,
    score: 98,
  },
  {
    name: "VnExpress Số hóa & AI",
    domain: "vnexpress.net",
    url: "https://vnexpress.net/rss/so-hoa.rss",
    tier: "tier1_official" as const,
    score: 98,
  },
  {
    name: "Báo Tuổi Trẻ Giáo dục",
    domain: "tuoitre.vn",
    url: "https://tuoitre.vn/rss/giao-duc.rss",
    tier: "tier1_official" as const,
    score: 96,
  },
  {
    name: "Báo Giáo dục & Thời đại (Bộ GD&ĐT)",
    domain: "giaoducthoidai.vn",
    url: "https://giaoducthoidai.vn/rss/giao-duc-24h-15.rss",
    tier: "tier1_official" as const,
    score: 99,
  },
  {
    name: "Google News Tìm kiếm Mở (Giáo dục AI & Tin học)",
    domain: "news.google.com",
    url: "https://news.google.com/rss/search?q=giao+duc+AI+tin+hoc+truong+hoc&hl=vi&gl=VN&ceid=VN:vi",
    tier: "tier2_open_search" as const,
    score: 92,
  },
  {
    name: "Google News Tìm kiếm Mở (STEM & Robotics Học đường)",
    domain: "news.google.com",
    url: "https://news.google.com/rss/search?q=STEM+Robotics+hoc+sinh+lap+trinh&hl=vi&gl=VN&ceid=VN:vi",
    tier: "tier2_open_search" as const,
    score: 92,
  },
];

const TIER1_TRUSTED_DOMAINS = [
  "moet.gov.vn",
  "chinhphu.vn",
  "danang.edu.vn",
  "giaoducthoidai.vn",
  "vnexpress.net",
  "tuoitre.vn",
  "thanhnien.vn",
  "dantri.com.vn",
  "vietnamnet.vn",
  "vtv.vn",
  "nhandan.vn",
  "baochinhphu.vn",
  "iigvietnam.com",
  "tinhoctre.vn",
];

const RELEVANT_KEYWORDS = [
  "giáo dục",
  "học sinh",
  "nhà trường",
  "đào tạo",
  "chương trình",
  "tin học",
  "công nghệ",
  "ai",
  "trí tuệ nhân tạo",
  "robot",
  "stem",
  "steam",
  "lập trình",
  "máy tính",
  "chuyển đổi số",
  "an toàn mạng",
  "dữ liệu",
  "khoa học",
  "thi",
  "olympic",
  "số hóa",
  "kỹ năng số",
];

function formatViDate(rawPubDate: string): string {
  if (!rawPubDate) return new Date().toLocaleDateString("vi-VN");
  const parsed = new Date(rawPubDate);
  if (isNaN(parsed.getTime())) return rawPubDate.slice(0, 16);
  return parsed.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function extractItemsFromXml(
  xml: string,
  defaultSourceName: string,
  defaultDomain: string,
  defaultTier: "tier1_official" | "tier2_open_search",
  defaultScore: number,
  skipKeywordFilter = false
): VerifiedNewsHeadline[] {
  const results: VerifiedNewsHeadline[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ||
      block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch =
      block.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i) ||
      block.match(/<link>([\s\S]*?)<\/link>/i);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const sourceTagMatch = block.match(
      /<source(?:\s+url=["']([^"']+)["'])?>([\s\S]*?)<\/source>/i
    );

    const rawTitle = (titleMatch?.[1] || "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
    const rawLink = (linkMatch?.[1] || "").trim();
    const rawPubDate = (pubDateMatch?.[1] || "").trim();

    if (!rawTitle || !rawLink || !rawLink.startsWith("http")) continue;

    const lowerTitle = rawTitle.toLowerCase();
    const isRelevant =
      skipKeywordFilter ||
      RELEVANT_KEYWORDS.some((kw) => lowerTitle.includes(kw));

    if (!isRelevant) continue;

    // Xác định tòa soạn gốc nếu quét từ kênh Tìm kiếm Mở Google News
    const extractedPublisherUrl = (sourceTagMatch?.[1] || "").trim();
    const extractedPublisherName = (sourceTagMatch?.[2] || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/i, "$1")
      .trim();

    let finalSource = extractedPublisherName || defaultSourceName;
    let finalDomain = defaultDomain;
    if (extractedPublisherUrl) {
      try {
        finalDomain = new URL(extractedPublisherUrl).hostname.replace(/^www\./, "");
      } catch {
        // Giữ domain mặc định
      }
    } else {
      try {
        finalDomain = new URL(rawLink).hostname.replace(/^www\./, "");
      } catch {
        // Giữ domain mặc định
      }
    }

    const isTier1Domain =
      defaultTier === "tier1_official" ||
      TIER1_TRUSTED_DOMAINS.some((d) => finalDomain.includes(d)) ||
      finalDomain.endsWith(".gov.vn") ||
      finalDomain.endsWith(".edu.vn");

    const finalTier: "tier1_official" | "tier2_open_search" = isTier1Domain
      ? "tier1_official"
      : "tier2_open_search";

    const finalScore = isTier1Domain ? Math.max(defaultScore, 96) : 92;
    const badgeLabel = isTier1Domain
      ? `Chính thống Cấp 1 (${finalDomain} • Độ tin cậy ${finalScore}%)`
      : `Tìm kiếm Mở Toàn mạng (${finalSource} • Độ tin cậy ${finalScore}%)`;

    results.push({
      title: rawTitle,
      link: rawLink,
      pubDate: formatViDate(rawPubDate),
      source: finalSource,
      domain: finalDomain,
      trustTier: finalTier,
      trustScore: finalScore,
      trustBadgeLabel: badgeLabel,
    });
  }

  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customQuery = (searchParams.get("q") || "").trim();

  const collected: VerifiedNewsHeadline[] = [];
  const sourcesToScan = [...OFFICIAL_RSS_SOURCES];

  // Nếu Tổ trưởng nhập từ khóa tìm kiếm mở bất kỳ -> Đưa lên ưu tiên số 1 quét toàn mạng báo chí
  if (customQuery) {
    const encoded = encodeURIComponent(`${customQuery} giáo dục công nghệ`);
    sourcesToScan.unshift({
      name: `Tìm kiếm Mở theo chủ đề "${customQuery}"`,
      domain: "news.google.com",
      url: `https://news.google.com/rss/search?q=${encoded}&hl=vi&gl=VN&ceid=VN:vi`,
      tier: "tier2_open_search",
      score: 94,
    });
  }

  try {
    await Promise.all(
      sourcesToScan.map(async (src, index) => {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3800);
          const res = await fetch(src.url, {
            signal: controller.signal,
            headers: {
              "User-Agent": "SkyLineICTPortal-AISpark/2.0",
            },
            cache: "no-store",
          });
          clearTimeout(timer);
          if (!res.ok) return;
          const xml = await res.text();
          const isCustomQueryFeed = Boolean(customQuery && index === 0);
          const items = extractItemsFromXml(
            xml,
            src.name,
            src.domain,
            src.tier,
            src.score,
            isCustomQueryFeed
          );
          collected.push(...items.slice(0, isCustomQueryFeed ? 3 : 2));
        } catch {
          // Bỏ qua nguồn nếu mạng tạm thời chậm
        }
      })
    );
  } catch {
    // Luôn trả về mảng an toàn
  }

  // Khử trùng lặp theo tiêu đề
  const uniqueMap = new Map<string, VerifiedNewsHeadline>();
  for (const item of collected) {
    const key = item.title.toLowerCase().slice(0, 60);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }

  return NextResponse.json({
    ok: true,
    scannedAt: new Date().toISOString(),
    customQuery: customQuery || null,
    headlines: Array.from(uniqueMap.values()).slice(0, 6),
  });
}
