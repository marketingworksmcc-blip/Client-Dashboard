"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { FormError } from "@/components/shared/FormError";
import { addComment } from "@/lib/actions/proofs";
import { formatRelativeTime } from "@/lib/utils";

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  user: { name: string };
};

type State = { error?: string; success?: boolean } | null;

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function CommentThread({ proofId, comments }: { proofId: string; comments: Comment[] }) {
  const boundAction = addComment.bind(null, proofId);
  const [state, formAction, isPending] = useActionState<State, FormData>(
    boundAction as unknown as (state: State, formData: FormData) => Promise<State>,
    null
  );

  return (
    <div className="space-y-5">
      {/* Existing comments */}
      {comments.length > 0 ? (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[#263a2e] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#d3de2c] text-xs font-semibold">{getInitials(comment.user.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-[#464540]">{comment.user.name}</span>
                  <span className="text-xs text-[#8a8880]">{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-[#464540] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#8a8880] py-2">No comments yet.</p>
      )}

      {/* Add comment */}
      <form action={formAction} className="space-y-3 pt-2 border-t border-[#f0efe9]">
        <FormError message={state?.error} />
        <textarea
          name="content"
          rows={3}
          placeholder="Add a comment…"
          key={state?.success ? Date.now() : "comment"}
          className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c] resize-none"
        />
        <div className="flex justify-end">
          <SubmitButton
            label="Post Comment"
            loadingLabel="Posting…"
            className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]"
          />
        </div>
      </form>
    </div>
  );
}
