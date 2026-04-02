"use client";

import { useState, useTransition } from "react";
import { archiveTask } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";

export function ArchiveTaskButton({ taskId }: { taskId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    startTransition(async () => {
      await archiveTask(taskId);
    });
  }

  if (confirm) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-[#8a8880]">
          Archive this task? It will be permanently deleted after 30 days.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={handleArchive}
            disabled={isPending}
            className="flex-1 bg-[#8a8880] hover:bg-[#464540] text-white text-sm"
          >
            {isPending ? "Archiving…" : "Yes, archive"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirm(false)}
            disabled={isPending}
            className="flex-1 border-[#e2e0d9]"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => setConfirm(true)}
      className="w-full border-[#e2e0d9] text-[#8a8880] hover:text-[#464540] hover:bg-[#f0efe9]"
    >
      <Archive className="h-4 w-4 mr-1.5" />
      Archive Task
    </Button>
  );
}
