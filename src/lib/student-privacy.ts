/**
 * Khiên Bảo Mật Danh Tính Học Sinh (Chuẩn An Toàn Dữ Liệu & AI Có Trách Nhiệm Sky-Line)
 * - Tự động viết tắt / ẩn danh họ tên học sinh khi ở chế độ Khách (Guest) hoặc Chế độ Trình chiếu công khai.
 * - Đảm bảo tuân thủ tuyệt đối quy định bảo vệ dữ liệu cá nhân và thành tích của từng học sinh.
 */
export function maskStudentName(fullName?: string | null, shouldMask?: boolean): string {
  if (!fullName) return "";
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  if (!shouldMask) return trimmed;

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const firstChar = parts[0].charAt(0).toUpperCase();
    return `Học sinh ${firstChar}.***`;
  }

  const initials = parts.map((word) => word.charAt(0).toUpperCase()).join(".");
  return `Học sinh ${initials}`;
}

