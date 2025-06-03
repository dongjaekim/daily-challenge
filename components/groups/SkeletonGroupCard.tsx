export function SkeletonGroupCard() {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm animate-pulse">
      <div className="p-6 space-y-3">
        <div className="h-6 bg-muted rounded w-3/4"></div> {/* 제목 영역 */}
        <div className="space-y-1.5">
          {" "}
          {/* 설명 영역 */}
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
        <div className="h-5 bg-muted rounded w-1/3 pt-2"></div>{" "}
        {/* 멤버 수 영역 */}
      </div>
      <div className="p-6 pt-0 border-t mt-4 h-[58px]">
        {" "}
        {/* 하단 영역 (버튼 등)*/}
      </div>
    </div>
  );
}
