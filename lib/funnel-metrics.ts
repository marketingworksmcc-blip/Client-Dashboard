export const FUNNEL_METRICS = [
  { value: "cost", label: "Spend" },
  { value: "impressions", label: "Impressions" },
  { value: "clicks", label: "Clicks" },
  { value: "conversions", label: "Conversions" },
  { value: "revenue", label: "Revenue" },
  { value: "roas", label: "ROAS" },
  { value: "cpc", label: "CPC" },
  { value: "cpm", label: "CPM" },
  { value: "ctr", label: "CTR" },
  { value: "cpa", label: "CPA" },
  { value: "reach", label: "Reach" },
  { value: "video_views", label: "Video Views" },
] as const;

export type FunnelMetricValue = (typeof FUNNEL_METRICS)[number]["value"];
