import { format } from "date-fns";
import { ko } from "date-fns/locale";

export function getDisplayTime(dateString: string) {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffMs = now.getTime() - postDate.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    // 하루 이내면 "n시간 전", "n분 전" 등 상대시간
    if (diffMinutes < 1) return "방금 전";
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    return `${diffHours}시간 전`;
  } else if (now.getFullYear() === postDate.getFullYear()) {
    return format(postDate, "M월 d일 a h:mm", { locale: ko });
  } else {
    return format(postDate, "yyyy년 M월 d일 a h:mm", { locale: ko });
  }
}
