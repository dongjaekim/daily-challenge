/**
 * 날짜 관련 유틸리티 함수 모음
 */

/**
 * UTC 날짜를 KST 날짜로 변환합니다 (UTC+9)
 */
export function convertToKST(date: Date | string): Date {
  const utcDate = typeof date === "string" ? new Date(date) : date;

  // UTC 날짜에 9시간 추가
  const kstDate = new Date(utcDate);
  kstDate.setUTCHours(kstDate.getUTCHours() + 9);

  return kstDate;
}

/**
 * KST 날짜를 UTC 날짜로 변환합니다 (UTC+9)
 */
export function convertToUTC(date: Date | string): Date {
  const kstDate = typeof date === "string" ? new Date(date) : date;

  // KST 날짜에서 9시간 빼기
  const utcDate = new Date(kstDate);
  utcDate.setUTCHours(utcDate.getUTCHours() - 9);

  return utcDate;
}

/**
 * 두 날짜가 같은 날짜인지 확인합니다 (시간은 무시)
 */
export function isSameDate(
  date1: Date | string,
  date2: Date | string
): boolean {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * 날짜의 시작 시간 (00:00:00.000)을 반환합니다
 */
export function startOfDay(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 날짜의 마지막 시간 (23:59:59.999)을 반환합니다
 */
export function endOfDay(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  d.setHours(23, 59, 59, 999);
  return d;
}
