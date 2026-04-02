export const GOOGLE_ADS_METRICS = [
  { value: "metrics.impressions",             label: "Impressions",               field: "impressions" },
  { value: "metrics.clicks",                  label: "Clicks",                    field: "clicks" },
  { value: "metrics.cost_micros",             label: "Spend ($)",                 field: "costMicros" },
  { value: "metrics.conversions",             label: "Conversions",               field: "conversions" },
  { value: "metrics.ctr",                     label: "CTR (%)",                   field: "ctr" },
  { value: "metrics.average_cpc",             label: "Avg. CPC ($)",              field: "averageCpc" },
  { value: "metrics.average_cpm",             label: "Avg. CPM ($)",              field: "averageCpm" },
  { value: "metrics.search_impression_share", label: "Search Impression Share",   field: "searchImpressionShare" },
  { value: "metrics.video_views",             label: "Video Views",               field: "videoViews" },
  { value: "metrics.all_conversions",         label: "All Conversions",           field: "allConversions" },
  { value: "metrics.engagements",             label: "Engagements",               field: "engagements" },
] as const;

export type GoogleAdsMetricValue = typeof GOOGLE_ADS_METRICS[number]["value"];

// Fields that are stored in micros and need dividing by 1,000,000
export const MICRO_FIELDS = new Set(["metrics.cost_micros", "metrics.average_cpc", "metrics.average_cpm"]);
