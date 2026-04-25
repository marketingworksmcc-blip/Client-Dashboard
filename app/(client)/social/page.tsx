import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { SocialDashboard } from "@/components/social/SocialDashboard";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrendingUp } from "lucide-react";

export default async function ClientSocialPage() {
  const session = await auth();
  const clientId = session!.user.clientIds?.[0];

  const socialConfig = clientId
    ? await prisma.socialConfig.findUnique({
        where: { clientId },
        include: {
          posts: {
            orderBy: { publishedAt: "desc" },
            take: 100,
          },
          dailyStats: {
            orderBy: { date: "asc" },
          },
        },
      })
    : null;

  const posts = (socialConfig?.posts ?? []).map((p) => ({
    id: p.id,
    platform: p.platform as "INSTAGRAM" | "FACEBOOK",
    thumbnailUrl: p.thumbnailUrl,
    mediaUrl: p.mediaUrl,
    caption: p.caption,
    permalink: p.permalink,
    mediaType: p.mediaType,
    publishedAt: p.publishedAt.toISOString(),
    impressions: p.impressions,
    reach: p.reach,
    engagement: p.engagement,
    videoViews3s: p.videoViews3s,
    likes: p.likes,
    comments: p.comments,
    saves: p.saves,
  }));

  const dailyStats = (socialConfig?.dailyStats ?? []).map((s) => ({
    platform: s.platform as "INSTAGRAM" | "FACEBOOK",
    date: s.date.toISOString().split("T")[0],
    impressions: s.impressions,
    reach: s.reach,
    engagement: s.engagement,
    videoViews: s.videoViews,
  }));

  const hasInstagram = !!socialConfig?.instagramUserId;
  const hasFacebook = !!socialConfig?.facebookPageId;
  const isEmpty = !socialConfig?.enabled || posts.length === 0;

  return (
    <div>
      <PageHeader
        title="Social Media"
        subtitle="Organic content performance across Instagram and Facebook."
      />

      {isEmpty ? (
        <EmptyState
          icon={TrendingUp}
          title="No social data yet"
          description="Your Revel team will connect your social accounts and sync your content here."
        />
      ) : (
        <SocialDashboard
          posts={posts}
          dailyStats={dailyStats}
          hasInstagram={hasInstagram}
          hasFacebook={hasFacebook}
        />
      )}
    </div>
  );
}
