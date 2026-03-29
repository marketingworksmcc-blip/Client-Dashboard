"use client";

import { useTransition } from "react";
import { deleteLineItem } from "@/lib/actions/budget";
import { formatCurrency, formatDate } from "@/lib/utils";
import { X } from "lucide-react";

interface LineItem {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  date: Date | null;
}

export function LineItemRow({ item }: { item: LineItem }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(() => deleteLineItem(item.id));
  }

  return (
    <div className={`flex items-center gap-3 px-5 py-3 transition-opacity ${isPending ? "opacity-40" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#464540]">{item.category}</p>
        {item.description && <p className="text-xs text-[#8a8880]">{item.description}</p>}
      </div>
      {item.date && (
        <span className="text-xs text-[#8a8880] flex-shrink-0">{formatDate(item.date)}</span>
      )}
      <span className="text-sm font-medium text-[#464540] flex-shrink-0 w-20 text-right">
        {formatCurrency(item.amount)}
      </span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-[#8a8880] hover:text-[#ff6b6c] transition-colors flex-shrink-0"
        aria-label="Remove line item"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
