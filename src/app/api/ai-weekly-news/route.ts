import { NextResponse } from "next/server";

interface RawHeadline {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

const OFFICIAL_RSS_SOURCES = [
  {
    name: "VnExpress Giáo dục",
    url: "https://vnexpress.net/rss/giao-duc.rss",
  },
  {
    name: "VnExpress Khoa học & Công nghệ",
    url: "https://vnexpress.net/rss/khoa-hoc.rss",
  },
  {
    name: "VnExpress Số hóa",
    url: "https://vnexpress.net/rss/so-hoa.rss",
  },
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
];

function extractItemsFromXml(xml: string, sourceName: string): RawHeadline[] {
  const results: RawHeadline[] = [];
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

    const rawTitle = (titleMatch?.[1] || "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    const rawLink = (linkMatch?.[1] || "").trim();
    const rawPubDate = (pubDateMatch?.[1] || "").trim();

    if (!rawTitle || !rawLink) continue;

    const lowerTitle = rawTitle.toLowerCase();
    const isRelevant = RELEVANT_KEYWORDS.some((kw) => lowerTitle.includes(kw));
    if (isRelevant) {
      results.push({
        title: rawTitle,
        link: rawLink,
        pubDate: rawPubDate,
        source: sourceName,
      });
    }
  }

  return results;
}

export async function GET() {
  const collected: RawHeadline[] = [];

  try {
    await Promise.all(
      OFFICIAL_RSS_SOURCES.map(async (src) => {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3500);
          const res = await fetch(src.url, {
            signal: controller.signal,
            headers: {
              "User-Agent": "SkyLineICTPortal-AISpark/1.0",
            },
            cache: "no-store",
          });
          clearTimeout(timer);
          if (!res.ok) return;
          const xml = await res.text();
          const items = extractItemsFromXml(xml, src.name);
          collected.push(...items.slice(0, 2));
        } catch {
          // Bỏ qua nguồn nếu mạng tạm thời chậm
        }
      })
    );
  } catch {
    // Luôn trả về mảng an toàn
  }

  return NextResponse.json({
    ok: true,
    scannedAt: new Date().toISOString(),
    headlines: collected.slice(0, 4),
  });
}

