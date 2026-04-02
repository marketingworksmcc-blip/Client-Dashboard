"use client";

import { useTransition } from "react";
import { restoreTask } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function RestoreTaskButton({ taskId }: { taskId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleRestore() {
    startTransition(async () => {
      await restoreTask(taskId);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleRestore}
      disabled={isPending}
      className="w-full border-[#e2e0d9] text-[#8a8880] hover:text-[#464540] hover:bg-[#f0efe9]"
    >
      <RotateCcw className="h-4 w-4 mr-1.5" />
      {isPending ? "Restoring…" : "Restore Task"}
    </Button>
  );
}
