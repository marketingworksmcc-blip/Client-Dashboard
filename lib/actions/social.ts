"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageClients } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { SocialPlatform } from "@prisma/client";

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) throw new Error("Unauthorized");
  return session;
}

// ── Config ─────────────────────────────────────────────────────

export interface SocialConfigInput {
  enabled: boolean;
  accessToken: string;
  instagramUserId: string;
  facebookPageId: string;
}

export async function saveSocialConfig(clientId: string, data: SocialConfigInput) {
  await requireAdmin();
  const base = {
    enabled: data.enabled,
    accessToken: data.accessToken.trim(),
    instagramUserId: data.instagramUserId.trim() || null,
    facebookPageId: data.facebookPageId.trim() || null,
  };
  await prisma.socialConfig.upsert({
    where: { clientId },
    create: { clientId, ...base },
    update: base,
  });
  revalidatePath(`/admin/clients/${clientId}/analytics`);
  return { success: true };
}

export async function testSocialConnection(
  accessToken: string,
  instagramUserId?: string,
  facebookPageId?: string
): Promise<{ ok: boolean; igName?: string; pageName?: string; error?: string }> {
  await requireAdmin();

  let igName: string | undefined;
  let pageName: string | undefined;

  if (instagramUserId?.trim()) {
    const url = new URL(`${GRAPH_BASE}/${instagramUserId.trim()}`);
    url.searchParams.set("fields", "name,username");
    url.searchParams.set("access_token", accessToken.trim());
    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = (await res.json()) as { name?: string; username?: string; error?: { message: string } };
    if (!res.ok || json.error) return { ok: false, error: json.error?.message ?? `Instagram: HTTP ${res.status}` };
    igName = json.name ?? json.username;
  }

  if (facebookPageId?.trim()) {
    const url = new URL(`${GRAPH_BASE}/${facebookPageId.trim()}`);
    url.searchParams.set("fields", "name");
    url.searchParams.set("access_token", accessToken.trim());
    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = (await res.json()) as { name?: string; error?: { message: string } };
    if (!res.ok || json.error) return { ok: false, error: json.error?.message ?? `Facebook: HTTP ${res.status}` };
    pageName = json.name;
  }

  return { ok: true, igName, pageName };
}

// ── Sync ───────────────────────────────────────────────────────

export async function syncSocialData(
  clientId: string
): Promise<{ ok: boolean; posts: number; error?: string }> {
  await requireAdmin();

  const config = await prisma.socialConfig.findUnique({ where: { clientId } });
  if (!config?.enabled) return { ok: false, posts: 0, error: "Social not configured or disabled." };

  let totalPosts = 0;
  const errors: string[] = [];

  if (config.instagramUserId) {
    const result = await syncInstagram(config.id, config.instagramUserId, config.accessToken);
    if (result.ok) totalPosts += result.posts;
    else errors.push(`Instagram: ${result.error}`);
  }

  if (config.facebookPageId) {
    const result = await syncFacebook(config.id, config.facebookPageId, config.accessToken);
    if (result.ok) totalPosts += result.posts;
    else errors.push(`Facebook: ${result.error}`);
  }

  await prisma.socialConfig.update({
    where: { clientId },
    data: {
      lastSyncedAt: new Date(),
      lastSyncError: errors.length ? errors.join("; ") : null,
    },
  });

  revalidatePath(`/admin/clients/${clientId}/analytics`);
  revalidatePath("/social");

  if (errors.length && totalPosts === 0) {
    return { ok: false, posts: 0, error: errors.join("; ") };
  }
  return { ok: true, posts: totalPosts };
}

// ── Instagram ──────────────────────────────────────────────────

async function syncInstagram(
  configId: string,
  userId: string,
  token: string
): Promise<{ ok: boolean; posts: number; error?: string }> {
  try {
    // 1. Fetch media list
    const mediaUrl = new URL(`${GRAPH_BASE}/${userId}/media`);
    mediaUrl.searchParams.set(
      "fields",
      "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count"
    );
    mediaUrl.searchParams.set("limit", "50");
    mediaUrl.searchParams.set("access_token", token);

    const mediaRes = await fetch(mediaUrl.toString(), { cache: "no-store" });
    const mediaJson = (await mediaRes.json()) as {
      data?: {
        id: string;
        caption?: string;
        media_type: string;
        media_url?: string;
        thumbnail_url?: string;
        permalink?: string;
        timestamp: string;
        like_count?: number;
        comments_count?: number;
      }[];
      error?: { message: string };
    };

    if (!mediaRes.ok || mediaJson.error) {
      return { ok: false, posts: 0, error: mediaJson.error?.message ?? `HTTP ${mediaRes.status}` };
    }

    const posts = mediaJson.data ?? [];
    let synced = 0;

    // 2. Sync each post with insights
    for (const post of posts) {
      const metricList = ["impressions", "reach", "saved", "engagement"];
      if (post.media_type === "VIDEO") metricList.push("video_views");

      let impressions = 0, reach = 0, engagement = 0, saves = 0, videoViews3s = 0;

      try {
        const insUrl = new URL(`${GRAPH_BASE}/${post.id}/insights`);
        insUrl.searchParams.set("metric", metricList.join(","));
        insUrl.searchParams.set("access_token", token);

        const insRes = await fetch(insUrl.toString(), { cache: "no-store" });
        const insJson = (await insRes.json()) as {
          data?: { name: string; values: { value: number }[] }[];
        };

        if (insRes.ok && insJson.data) {
          for (const item of insJson.data) {
            const val = item.values?.[0]?.value ?? 0;
            if (item.name === "impressions") impressions = val;
            else if (item.name === "reach") reach = val;
            else if (item.name === "engagement") engagement = val;
            else if (item.name === "saved") saves = val;
            else if (item.name === "video_views") videoViews3s = val;
          }
        }
      } catch {
        engagement = (post.like_count ?? 0) + (post.comments_count ?? 0);
      }

      await prisma.socialPost.upsert({
        where: { configId_postId: { configId, postId: post.id } },
        create: {
          configId,
          platform: SocialPlatform.INSTAGRAM,
          postId: post.id,
          thumbnailUrl: post.thumbnail_url ?? post.media_url,
          mediaUrl: post.media_url,
          caption: post.caption,
          permalink: post.permalink,
          mediaType: post.media_type,
          publishedAt: new Date(post.timestamp),
          impressions,
          reach,
          engagement,
          videoViews3s,
          likes: post.like_count ?? 0,
          comments: post.comments_count ?? 0,
          saves,
        },
        update: {
          impressions,
          reach,
          engagement,
          videoViews3s,
          likes: post.like_count ?? 0,
          comments: post.comments_count ?? 0,
          saves,
          thumbnailUrl: post.thumbnail_url ?? post.media_url,
          mediaUrl: post.media_url,
          caption: post.caption,
        },
      });
      synced++;
    }

    // 3. Sync account-level daily stats (last 90 days)
    const since = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60;
    const until = Math.floor(Date.now() / 1000);
    const dailyUrl = new URL(`${GRAPH_BASE}/${userId}/insights`);
    dailyUrl.searchParams.set("metric", "impressions,reach");
    dailyUrl.searchParams.set("period", "day");
    dailyUrl.searchParams.set("since", since.toString());
    dailyUrl.searchParams.set("until", until.toString());
    dailyUrl.searchParams.set("access_token", token);

    try {
      const dailyRes = await fetch(dailyUrl.toString(), { cache: "no-store" });
      const dailyJson = (await dailyRes.json()) as {
        data?: { name: string; values: { value: number; end_time: string }[] }[];
      };

      if (dailyRes.ok && dailyJson.data) {
        const byDate: Record<string, { impressions: number; reach: number }> = {};

        for (const metric of dailyJson.data) {
          for (const point of metric.values) {
            const d = point.end_time.split("T")[0];
            if (!byDate[d]) byDate[d] = { impressions: 0, reach: 0 };
            if (metric.name === "impressions") byDate[d].impressions = point.value;
            else if (metric.name === "reach") byDate[d].reach = point.value;
          }
        }

        // Also aggregate engagement from posts per day
        const engByDate: Record<string, { engagement: number; videoViews: number }> = {};
        for (const post of posts) {
          const d = new Date(post.timestamp).toISOString().split("T")[0];
          if (!engByDate[d]) engByDate[d] = { engagement: 0, videoViews: 0 };
        }

        for (const [dateStr, vals] of Object.entries(byDate)) {
          const date = new Date(`${dateStr}T00:00:00.000Z`);
          await prisma.socialDailyStats.upsert({
            where: { configId_platform_date: { configId, platform: SocialPlatform.INSTAGRAM, date } },
            create: {
              configId,
              platform: SocialPlatform.INSTAGRAM,
              date,
              impressions: vals.impressions,
              reach: vals.reach,
              engagement: 0,
              videoViews: 0,
            },
            update: { impressions: vals.impressions, reach: vals.reach },
          });
        }
      }
    } catch {
      // Daily stats failed — non-critical, posts still synced
    }

    return { ok: true, posts: synced };
  } catch (err) {
    return { ok: false, posts: 0, error: err instanceof Error ? err.message : "Instagram sync failed" };
  }
}

// ── Facebook ───────────────────────────────────────────────────

async function syncFacebook(
  configId: string,
  pageId: string,
  token: string
): Promise<{ ok: boolean; posts: number; error?: string }> {
  try {
    // 1. Fetch page posts
    const postsUrl = new URL(`${GRAPH_BASE}/${pageId}/posts`);
    postsUrl.searchParams.set(
      "fields",
      "id,message,created_time,full_picture,permalink_url,shares,likes.summary(true),comments.summary(true)"
    );
    postsUrl.searchParams.set("limit", "50");
    postsUrl.searchParams.set("access_token", token);

    const postsRes = await fetch(postsUrl.toString(), { cache: "no-store" });
    const postsJson = (await postsRes.json()) as {
      data?: {
        id: string;
        message?: string;
        created_time: string;
        full_picture?: string;
        permalink_url?: string;
        shares?: { count: number };
        likes?: { summary: { total_count: number } };
        comments?: { summary: { total_count: number } };
      }[];
      error?: { message: string };
    };

    if (!postsRes.ok || postsJson.error) {
      return { ok: false, posts: 0, error: postsJson.error?.message ?? `HTTP ${postsRes.status}` };
    }

    const fbPosts = postsJson.data ?? [];

    // 2. Delete existing Facebook daily stats so we re-aggregate cleanly
    await prisma.socialDailyStats.deleteMany({
      where: { configId, platform: SocialPlatform.FACEBOOK },
    });

    let synced = 0;
    const dailyAgg: Record<string, { impressions: number; reach: number; engagement: number; videoViews: number }> = {};

    for (const post of fbPosts) {
      const likes = post.likes?.summary?.total_count ?? 0;
      const comments = post.comments?.summary?.total_count ?? 0;
      const shares = post.shares?.count ?? 0;
      let impressions = 0, reach = 0, engagement = likes + comments + shares, videoViews3s = 0;

      try {
        const insUrl = new URL(`${GRAPH_BASE}/${post.id}/insights`);
        insUrl.searchParams.set("metric", "post_impressions,post_impressions_unique,post_engaged_users,post_video_views");
        insUrl.searchParams.set("access_token", token);

        const insRes = await fetch(insUrl.toString(), { cache: "no-store" });
        const insJson = (await insRes.json()) as {
          data?: { name: string; values: { value: number }[] }[];
        };

        if (insRes.ok && insJson.data) {
          for (const item of insJson.data) {
            const val = item.values?.[0]?.value ?? 0;
            if (item.name === "post_impressions") impressions = val;
            else if (item.name === "post_impressions_unique") reach = val;
            else if (item.name === "post_engaged_users") engagement = val;
            else if (item.name === "post_video_views") videoViews3s = val;
          }
        }
      } catch {
        // keep fallback values
      }

      await prisma.socialPost.upsert({
        where: { configId_postId: { configId, postId: post.id } },
        create: {
          configId,
          platform: SocialPlatform.FACEBOOK,
          postId: post.id,
          thumbnailUrl: post.full_picture,
          mediaUrl: post.full_picture,
          caption: post.message,
          permalink: post.permalink_url,
          mediaType: "IMAGE",
          publishedAt: new Date(post.created_time),
          impressions,
          reach,
          engagement,
          videoViews3s,
          likes,
          comments,
          saves: 0,
        },
        update: {
          impressions,
          reach,
          engagement,
          videoViews3s,
          likes,
          comments,
          thumbnailUrl: post.full_picture,
          caption: post.message,
        },
      });

      // Aggregate daily stats from post data
      const dateStr = new Date(post.created_time).toISOString().split("T")[0];
      if (!dailyAgg[dateStr]) dailyAgg[dateStr] = { impressions: 0, reach: 0, engagement: 0, videoViews: 0 };
      dailyAgg[dateStr].impressions += impressions;
      dailyAgg[dateStr].reach += reach;
      dailyAgg[dateStr].engagement += engagement;
      dailyAgg[dateStr].videoViews += videoViews3s;

      synced++;
    }

    // 3. Save aggregated daily stats
    for (const [dateStr, vals] of Object.entries(dailyAgg)) {
      const date = new Date(`${dateStr}T00:00:00.000Z`);
      await prisma.socialDailyStats.create({
        data: { configId, platform: SocialPlatform.FACEBOOK, date, ...vals },
      });
    }

    return { ok: true, posts: synced };
  } catch (err) {
    return { ok: false, posts: 0, error: err instanceof Error ? err.message : "Facebook sync failed" };
  }
}
