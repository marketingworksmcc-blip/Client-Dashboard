"use client";

import { useState, useMemo } from "react";
import { Camera, Globe, LayoutGrid } from "lucide-react";
import { StatCard } from "@/components/analytics/StatCard";
import { SocialChartCard } from "@/components/social/SocialChartCard";
import { ContentLibrary } from "@/components/social/ContentLibrary";
import { cn } from "@/lib/utils";

type Platform = "all" | "instagram" | "facebook";

interface SocialPost {
  id: string;
  platform: "INSTAGRAM" | "FACEBOOK";
  thumbnailUrl: string | null;
  mediaUrl: string | null;
  caption: string | null;
  permalink: string | null;
  mediaType: string | null;
  publishedAt: string;
  impressions: number;
  reach: number;
  engagement: number;
  videoViews3s: number;
  likes: number;
  comments: number;
  saves: number;
}

interface SocialDailyStat {
  platform: "INSTAGRAM" | "FACEBOOK";
  date: string; // YYYY-MM-DD
  impressions: number;
  reach: number;
  engagement: number;
  videoViews: number;
}

interface SocialDashboardProps {
  posts: SocialPost[];
  dailyStats: SocialDailyStat[];
  hasInstagram: boolean;
  hasFacebook: boolean;
}

const TABS: { value: Platform; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "instagram", label: "Instagram", icon: Camera },
  { value: "facebook", label: "Facebook", icon: Globe },
];

function computeStat(values: number[]) {
  const now = new Date();
  const cutoff30 = new Date(now);
  cutoff30.setDate(now.getDate() - 30);
  const cutoff60 = new Date(now);
  cutoff60.setDate(now.getDate() - 60);

  // For posts-based stats, we don't have date info here — just use total
  return values.reduce((s, v) => s + v, 0);
}

export function SocialDashboard({ posts, dailyStats, hasInstagram, hasFacebook }: SocialDashboardProps) {
  const [platform, setPlatform] = useState<Platform>("all");

  const visibleTabs = TABS.filter((t) => {
    if (t.value === "all") return true;
    if (t.value === "instagram") return hasInstagram;
    if (t.value === "facebook") return hasFacebook;
    return false;
  });

  // Filter posts and stats by selected platform
  const filteredPosts = useMemo(() => {
    if (platform === "all") return posts;
    return posts.filter((p) => p.platform.toLowerCase() === platform);
  }, [posts, platform]);

  const filteredStats = useMemo(() => {
    if (platform === "all") return dailyStats;
    return dailyStats.filter((s) => s.platform.toLowerCase() === platform);
  }, [dailyStats, platform]);

  // Build merged daily stats (combine IG + FB by date for "all")
  const mergedDailyByDate = useMemo(() => {
    const byDate: Record<string, { date: string; impressions: number; reach: number; engagement: number; videoViews: number }> = {};
    for (const stat of filteredStats) {
      if (!byDate[stat.date]) byDate[stat.date] = { date: stat.date, impressions: 0, reach: 0, engagement: 0, videoViews: 0 };
      byDate[stat.date].impressions += stat.impressions;
      byDate[stat.date].reach += stat.reach;
      byDate[stat.date].engagement += stat.engagement;
      byDate[stat.date].videoViews += stat.videoViews;
    }
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredStats]);

  // If we have daily stats, use them for charts; otherwise derive from posts
  const hasDailyStats = mergedDailyByDate.length > 0;

  const chartData = useMemo(() => {
    if (hasDailyStats) {
      return {
        views: mergedDailyByDate.map((d) => ({ date: d.date, value: d.impressions })),
        reach: mergedDailyByDate.map((d) => ({ date: d.date, value: d.reach })),
        engagement: mergedDailyByDate.map((d) => ({ date: d.date, value: d.engagement })),
        videoViews: mergedDailyByDate.map((d) => ({ date: d.date, value: d.videoViews })),
      };
    }
    // Derive from posts if no daily stats
    const byDate: Record<string, { views: number; reach: number; engagement: number; videoViews: number }> = {};
    for (const post of filteredPosts) {
      const date = post.publishedAt.split("T")[0];
      if (!byDate[date]) byDate[date] = { views: 0, reach: 0, engagement: 0, videoViews: 0 };
      byDate[date].views += post.impressions;
      byDate[date].reach += post.reach;
      byDate[date].engagement += post.engagement;
      byDate[date].videoViews += post.videoViews3s;
    }
    const dates = Object.keys(byDate).sort();
    return {
      views: dates.map((d) => ({ date: d, value: byDate[d].views })),
      reach: dates.map((d) => ({ date: d, value: byDate[d].reach })),
      engagement: dates.map((d) => ({ date: d, value: byDate[d].engagement })),
      videoViews: dates.map((d) => ({ date: d, value: byDate[d].videoViews })),
    };
  }, [hasDailyStats, mergedDailyByDate, filteredPosts]);

  // Stat card totals (30-day window)
  const now = new Date();
  const cutoff30 = new Date(now);
  cutoff30.setDate(now.getDate() - 30);
  const cutoff60 = new Date(now);
  cutoff60.setDate(now.getDate() - 60);

  const statTotals = useMemo(() => {
    if (hasDailyStats) {
      const current = mergedDailyByDate.filter((d) => new Date(`${d.date}T00:00:00Z`) >= cutoff30);
      const previous = mergedDailyByDate.filter((d) => {
        const dt = new Date(`${d.date}T00:00:00Z`);
        return dt >= cutoff60 && dt < cutoff30;
      });
      const sum = (arr: typeof mergedDailyByDate, key: keyof (typeof mergedDailyByDate)[0]) =>
        arr.reduce((s, d) => s + (d[key] as number), 0);
      const change = (curr: number, prev: number) =>
        prev === 0 ? null : ((curr - prev) / prev) * 100;

      const cViews = sum(current, "impressions");
      const pViews = sum(previous, "impressions");
      const cReach = sum(current, "reach");
      const pReach = sum(previous, "reach");
      const cEng = sum(current, "engagement");
      const pEng = sum(previous, "engagement");
      const cVid = sum(current, "videoViews");
      const pVid = sum(previous, "videoViews");

      return {
        views: { value: cViews, change: change(cViews, pViews) },
        reach: { value: cReach, change: change(cReach, pReach) },
        engagement: { value: cEng, change: change(cEng, pEng) },
        videoViews: { value: cVid, change: change(cVid, pVid) },
      };
    }

    // From posts
    const current = filteredPosts.filter((p) => new Date(p.publishedAt) >= cutoff30);
    const previous = filteredPosts.filter((p) => {
      const dt = new Date(p.publishedAt);
      return dt >= cutoff60 && dt < cutoff30;
    });
    const sumKey = (arr: SocialPost[], key: keyof SocialPost) =>
      arr.reduce((s, p) => s + (p[key] as number), 0);
    const change = (curr: number, prev: number) =>
      prev === 0 ? null : ((curr - prev) / prev) * 100;

    const cViews = sumKey(current, "impressions");
    const pViews = sumKey(previous, "impressions");
    const cReach = sumKey(current, "reach");
    const pReach = sumKey(previous, "reach");
    const cEng = sumKey(current, "engagement");
    const pEng = sumKey(previous, "engagement");
    const cVid = sumKey(current, "videoViews3s");
    const pVid = sumKey(previous, "videoViews3s");

    return {
      views: { value: cViews, change: change(cViews, pViews) },
      reach: { value: cReach, change: change(cReach, pReach) },
      engagement: { value: cEng, change: change(cEng, pEng) },
      videoViews: { value: cVid, change: change(cVid, pVid) },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDailyStats, mergedDailyByDate, filteredPosts]);

  return (
    <div className="space-y-6">
      {/* Platform tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#f0efe9] rounded-xl w-fit">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = platform === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setPlatform(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-white text-[#263a2e] shadow-sm"
                  : "text-[#8a8880] hover:text-[#464540]"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Views"
          value={statTotals.views.value.toLocaleString()}
          change={statTotals.views.change}
          changeLabel="vs last 30d"
        />
        <StatCard
          label="Engagement"
          value={statTotals.engagement.value.toLocaleString()}
          change={statTotals.engagement.change}
          changeLabel="vs last 30d"
        />
        <StatCard
          label="Reach"
          value={statTotals.reach.value.toLocaleString()}
          change={statTotals.reach.change}
          changeLabel="vs last 30d"
        />
        <StatCard
          label="3-Sec Video Views"
          value={statTotals.videoViews.value.toLocaleString()}
          change={statTotals.videoViews.change}
          changeLabel="vs last 30d"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SocialChartCard title="Views Over Time" data={chartData.views} color="#263a2e" />
        <SocialChartCard title="Engagement Over Time" data={chartData.engagement} color="#d3de2c" />
        <SocialChartCard title="Reach Over Time" data={chartData.reach} color="#8b5cf6" />
        <SocialChartCard title="3-Sec Video Views" data={chartData.videoViews} color="#ff6b6c" />
      </div>

      {/* Content Library */}
      <ContentLibrary posts={filteredPosts} platformFilter={platform} />
    </div>
  );
}
