"use client";

import { useState, useTransition } from "react";
import { fetchMetaCreatives, type MetaCreative } from "@/lib/actions/meta";
import { Button } from "@/components/ui/button";
import { Images, RefreshCw, ExternalLink } from "lucide-react";
import Image from "next/image";

interface Props {
  clientId: string;
  enabled: boolean;
}

function CreativeCard({ creative }: { creative: MetaCreative }) {
  const imgSrc = creative.thumbnailUrl ?? creative.imageUrl;

  return (
    <div className="bg-white border border-[#e2e0d9] rounded-xl overflow-hidden shadow-sm flex flex-col">
      {imgSrc ? (
        <div className="relative aspect-video bg-[#f0efe9]">
          <Image
            src={imgSrc}
            alt={creative.title ?? creative.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="aspect-video bg-[#f0efe9] flex items-center justify-center">
          <Images className="h-8 w-8 text-[#c8c5bc]" />
        </div>
      )}
      <div className="p-3 flex flex-col gap-1 flex-1">
        {creative.title && (
          <p className="text-xs font-semibold text-[#1a1a18] line-clamp-1">{creative.title}</p>
        )}
        {creative.body && (
          <p className="text-xs text-[#8a8880] line-clamp-2 leading-relaxed">{creative.body}</p>
        )}
        <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
          {creative.campaignName && (
            <span className="inline-block px-2 py-0.5 rounded-full bg-[#f0efe9] text-[10px] text-[#8a8880] truncate max-w-full">
              {creative.campaignName}
            </span>
          )}
          {creative.callToActionType && (
            <span className="inline-block px-2 py-0.5 rounded-full bg-[#1877f2]/10 text-[10px] text-[#1877f2] font-medium">
              {creative.callToActionType.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function MetaCreativesPreview({ clientId, enabled }: Props) {
  const [creatives, setCreatives] = useState<MetaCreative[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, startFetch] = useTransition();

  function handleFetch() {
    setError(null);
    startFetch(async () => {
      const result = await fetchMetaCreatives(clientId);
      if (result.ok && result.creatives) {
        setCreatives(result.creatives);
      } else {
        setError(result.error ?? "Failed to load creatives.");
      }
    });
  }

  if (!enabled) return null;

  return (
    <div className="space-y-4 pt-2 border-t border-[#f0efe9]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[#464540]">Ad Creative Preview</p>
          <p className="text-xs text-[#8a8880] mt-0.5">Preview active & paused ads from this account</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleFetch}
          disabled={isFetching}
          className="border-[#e2e0d9] h-8 text-xs text-[#464540]"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Loading…" : creatives ? "Refresh" : "Load Creatives"}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-[#ff6b6c] px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </p>
      )}

      {creatives !== null && creatives.length === 0 && (
        <p className="text-xs text-[#8a8880]">No active or paused ads found in this account.</p>
      )}

      {creatives && creatives.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {creatives.map((c) => (
            <CreativeCard key={c.id} creative={c} />
          ))}
        </div>
      )}
    </div>
  );
}
