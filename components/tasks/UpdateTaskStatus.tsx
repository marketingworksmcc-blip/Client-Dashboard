"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "@/lib/actions/tasks";

const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "NEEDS_INPUT", label: "Needs Your Input" },
  { value: "COMPLETED", label: "Completed" },
];

interface UpdateTaskStatusProps {
  taskId: string;
  currentStatus: string;
}

export function UpdateTaskStatus({ taskId, currentStatus }: UpdateTaskStatusProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    startTransition(() => {
      updateTaskStatus(taskId, newStatus);
    });
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c] disabled:opacity-60"
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
