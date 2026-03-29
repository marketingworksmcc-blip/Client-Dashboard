import { ExternalLink, Download, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils";

interface ProofViewerProps {
  fileUrl?: string | null;
  externalUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  versionNum: number;
}

export function ProofViewer({ fileUrl, externalUrl, fileName, fileSize, mimeType, versionNum }: ProofViewerProps) {
  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf";
  const url = fileUrl ?? externalUrl;

  if (!url) {
    return (
      <div className="flex items-center justify-center h-48 bg-[#f0efe9] rounded-xl border border-[#e2e0d9]">
        <p className="text-sm text-[#8a8880]">No file attached to version {versionNum}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Preview area */}
      {isImage && fileUrl ? (
        <div className="rounded-xl overflow-hidden border border-[#e2e0d9] bg-[#f0efe9]">
          <img src={fileUrl} alt={fileName ?? `Version ${versionNum}`} className="w-full max-h-[560px] object-contain" />
        </div>
      ) : isPdf && fileUrl ? (
        <div className="rounded-xl overflow-hidden border border-[#e2e0d9]">
          <iframe src={fileUrl} className="w-full h-[560px]" title={fileName ?? `Version ${versionNum}`} />
        </div>
      ) : externalUrl ? (
        <div className="flex items-center gap-4 p-5 rounded-xl border border-[#e2e0d9] bg-[#f0efe9]">
          <ExternalLink className="h-8 w-8 text-[#8a8880] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#464540] truncate">{externalUrl}</p>
            <p className="text-xs text-[#8a8880] mt-0.5">External link — opens in a new tab</p>
          </div>
          <Button asChild variant="outline" className="border-[#e2e0d9] flex-shrink-0">
            <a href={externalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Open
            </a>
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-5 rounded-xl border border-[#e2e0d9] bg-[#f0efe9]">
          <FileIcon className="h-8 w-8 text-[#8a8880] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#464540] truncate">{fileName ?? "File"}</p>
            {fileSize && <p className="text-xs text-[#8a8880] mt-0.5">{formatFileSize(fileSize)}</p>}
          </div>
        </div>
      )}

      {/* File meta + download */}
      <div className="flex items-center justify-between text-xs text-[#8a8880]">
        <span>
          {fileName && <span className="font-medium text-[#464540]">{fileName}</span>}
          {fileName && fileSize && " · "}
          {fileSize && formatFileSize(fileSize)}
        </span>
        {fileUrl && (
          <Button asChild variant="outline" size="sm" className="border-[#e2e0d9] text-xs h-7">
            <a href={fileUrl} download={fileName ?? true}>
              <Download className="h-3 w-3 mr-1" />
              Download
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
