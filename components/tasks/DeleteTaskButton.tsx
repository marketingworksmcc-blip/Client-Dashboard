"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteTaskButtonProps {
  taskTitle: string;
  deleteAction: () => Promise<never>;
}

export function DeleteTaskButton({ taskTitle, deleteAction }: DeleteTaskButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full border-[#ff6b6c]/30 text-[#ff6b6c] hover:bg-[#ff6b6c]/5"
      >
        <Trash2 className="h-4 w-4 mr-1.5" />
        Delete Task
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{taskTitle}</strong> and all its notes will be permanently deleted. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={deleteAction}>
              <Button
                type="submit"
                className="bg-[#ff6b6c] hover:bg-[#ff6b6c]/90 text-white w-full"
              >
                Delete permanently
              </Button>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
