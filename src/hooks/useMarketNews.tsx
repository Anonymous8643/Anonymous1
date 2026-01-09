import { useQuery } from "@tanstack/react-query";
import { api, MarketNews } from "@/lib/api";

export type { MarketNews };

export const useMarketNews = () => {
  return useQuery({
    queryKey: ["market_news"],
    queryFn: async () => {
      const { news } = await api.public.marketNews();
      return news;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
