"use client";

import { useState, useTransition, useActionState } from "react";
import { updateTaskStatus, addTaskNote } from "@/lib/actions/tasks";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { ChevronDown, ChevronUp, Calendar, MessageSquare } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  user: { name: string };
}

interface TaskChecklistItemProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    allowClientUpdate: boolean;
  };
  notes: Note[];
  canCheck: boolean; // allowClientUpdate
}

const PRIORITY_DOT: Record<string, string> = {
  LOW: "bg-[#e2e0d9]",
  MEDIUM: "bg-blue-300",
  HIGH: "bg-amber-400",
  URGENT: "bg-red-500",
};

export function TaskChecklistItem({ task, notes, canCheck }: TaskChecklistItemProps) {
  const isComplete = task.status === "COMPLETED";
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const boundAction = addTaskNote.bind(null, task.id);
  const [noteState, noteFormAction] = useActionState<State, FormData>(
    boundAction as unknown as (state: State, formData: FormData) => Promise<State>,
    null
  );

  function handleCheck() {
    if (!canCheck) return;
    startTransition(() => {
      updateTaskStatus(task.id, isComplete ? "IN_PROGRESS" : "COMPLETED");
    });
  }

  return (
    <div className={`border-b border-[#f0efe9] last:border-0 transition-colors ${isComplete ? "bg-[#faf9f6]" : "bg-white"}`}>
      <div className="flex items-start gap-3 px-5 py-3.5">
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleCheck}
          disabled={!canCheck || isPending}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            ${isComplete
              ? "bg-[#263a2e] border-[#263a2e]"
              : "border-[#d0cec8] hover:border-[#263a2e]"}
            ${!canCheck ? "cursor-default opacity-60" : "cursor-pointer"}`}
          aria-label={isComplete ? "Mark incomplete" : "Mark complete"}
        >
          {isComplete && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority] ?? "bg-[#e2e0d9]"}`} />
            <p className={`text-sm font-medium leading-snug ${isComplete ? "line-through text-[#8a8880]" : "text-[#464540]"}`}>
              {task.title}
            </p>
          </div>
          {task.dueDate && (
            <p className="flex items-center gap-1 text-xs text-[#8a8880] mt-0.5 ml-4">
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </p>
          )}
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-[#8a8880] hover:text-[#464540] transition-colors flex-shrink-0 mt-0.5"
        >
          {notes.length > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              {notes.length}
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded: description + notes */}
      {expanded && (
        <div className="px-5 pb-4 ml-8 space-y-4">
          {task.description && (
            <p className="text-sm text-[#8a8880] whitespace-pre-wrap">{task.description}</p>
          )}

          {/* Existing notes */}
          {notes.length > 0 && (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#f0efe9] flex items-center justify-center flex-shrink-0 text-xs font-medium text-[#8a8880]">
                    {note.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-[#464540]">{note.user.name}</span>
                      <span className="text-xs text-[#8a8880]">{formatRelativeTime(note.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[#464540]">{note.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add note */}
          <form action={noteFormAction} key={noteState?.success ? Date.now() : "note"} className="flex gap-2">
            {noteState?.error && <p className="text-xs text-[#ff6b6c]">{noteState.error}</p>}
            <input
              name="content"
              placeholder="Add a comment…"
              className="flex-1 rounded-lg border border-[#e2e0d9] bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c]"
            />
            <SubmitButton
              label="Send"
              loadingLabel="…"
              className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-xs h-8 px-3"
            />
          </form>
        </div>
      )}
    </div>
  );
}
