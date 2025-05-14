import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분간 신선한 상태 유지
        gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
      },
    },
  });
}
