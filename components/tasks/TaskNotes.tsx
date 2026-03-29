"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { addTaskNote } from "@/lib/actions/tasks";
import { formatRelativeTime } from "@/lib/utils";

type State = { error?: string; success?: boolean } | null;

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  user: { name: string };
}

interface TaskNotesProps {
  taskId: string;
  notes: Note[];
}

export function TaskNotes({ taskId, notes }: TaskNotesProps) {
  const boundAction = addTaskNote.bind(null, taskId);
  const [state, formAction] = useActionState<State, FormData>(
    boundAction as unknown as (state: State, formData: FormData) => Promise<State>,
    null
  );

  return (
    <div className="space-y-4">
      {notes.length === 0 && (
        <p className="text-sm text-[#8a8880]">No notes yet.</p>
      )}
      {notes.map((note) => (
        <div key={note.id} className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-[#f0efe9] flex items-center justify-center flex-shrink-0 text-xs font-medium text-[#8a8880]">
            {note.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium text-[#464540]">{note.user.name}</span>
              <span className="text-xs text-[#8a8880]">{formatRelativeTime(note.createdAt)}</span>
            </div>
            <p className="text-sm text-[#464540] whitespace-pre-wrap">{note.content}</p>
          </div>
        </div>
      ))}

      <form action={formAction} key={state?.success ? Date.now() : "note"} className="pt-2">
        {state?.error && <p className="text-xs text-[#ff6b6c] mb-2">{state.error}</p>}
        <textarea
          name="content"
          rows={3}
          placeholder="Add a note…"
          className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c] resize-none mb-2"
        />
        <div className="flex justify-end">
          <SubmitButton label="Add Note" loadingLabel="Saving…"
            className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-xs h-8 px-3" />
        </div>
      </form>
    </div>
  );
}
