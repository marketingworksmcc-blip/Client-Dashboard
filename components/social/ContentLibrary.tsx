"use client";

import { useState } from "react";
import { Eye, Heart, MessageCircle, ExternalLink, Camera, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type SortMode = "recent" | "top-views" | "top-engagement";

interface Post {
  id: string;
  platform: "INSTAGRAM" | "FACEBOOK";
  thumbnailUrl: string | null;
  caption: string | null;
  permalink: string | null;
  mediaType: string | null;
  publishedAt: string;
  impressions: number;
  engagement: number;
  likes: number;
  comments: number;
}

interface ContentLibraryProps {
  posts: Post[];
  platformFilter: "all" | "instagram" | "facebook";
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "top-views", label: "Top Views" },
  { value: "top-engagement", label: "Top Engagement" },
];

function PlatformBadge({ platform }: { platform: "INSTAGRAM" | "FACEBOOK" }) {
  if (platform === "INSTAGRAM") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <Camera className="h-2.5 w-2.5" />
        instagram
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#1877f2] text-white">
      <Globe className="h-2.5 w-2.5" />
      facebook
    </span>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function ContentLibrary({ posts, platformFilter }: ContentLibraryProps) {
  const [sort, setSort] = useState<SortMode>("recent");

  const visible = posts
    .filter((p) => {
      if (platformFilter === "instagram") return p.platform === "INSTAGRAM";
      if (platformFilter === "facebook") return p.platform === "FACEBOOK";
      return true;
    })
    .sort((a, b) => {
      if (sort === "recent") return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (sort === "top-views") return b.impressions - a.impressions;
      return b.engagement - a.engagement;
    });

  return (
    <div>
      {/* Header + sort controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-[#1a1a18]">
          Content Library{" "}
          <span className="text-xs font-normal text-[#8a8880]">({visible.length})</span>
        </h3>
        <div className="flex items-center gap-1 bg-[#f0efe9] rounded-lg p-0.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                sort === opt.value
                  ? "bg-white text-[#1a1a18] shadow-sm"
                  : "text-[#8a8880] hover:text-[#464540]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-[#8a8880] text-sm bg-[#faf9f6] rounded-xl border border-[#e2e0d9]">
          No posts to show — sync to populate.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {visible.map((post) => (
            <div
              key={post.id}
              className="group bg-white border border-[#e2e0d9] rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square bg-[#f0efe9]">
                {post.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.thumbnailUrl}
                    alt={post.caption ?? "Post"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {post.platform === "INSTAGRAM" ? (
                      <Camera className="h-8 w-8 text-[#cad1cc]" />
                    ) : (
                      <Globe className="h-8 w-8 text-[#cad1cc]" />
                    )}
                  </div>
                )}

                {/* Platform badge */}
                <div className="absolute top-1.5 left-1.5">
                  <PlatformBadge platform={post.platform} />
                </div>

                {/* External link on hover */}
                {post.permalink && (
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-black/50 rounded-md"
                  >
                    <ExternalLink className="h-3 w-3 text-white" />
                  </a>
                )}
              </div>

              {/* Info */}
              <div className="px-2.5 py-2 space-y-1.5">
                {post.caption && (
                  <p className="text-xs text-[#464540] leading-tight line-clamp-2">{post.caption}</p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-[#8a8880]">
                  <span className="flex items-center gap-0.5">
                    <Eye className="h-2.5 w-2.5" />
                    {fmt(post.impressions)}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Heart className="h-2.5 w-2.5" />
                    {fmt(post.likes)}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MessageCircle className="h-2.5 w-2.5" />
                    {fmt(post.comments)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
