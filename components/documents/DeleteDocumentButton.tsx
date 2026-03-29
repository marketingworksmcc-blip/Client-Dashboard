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

interface DeleteDocumentButtonProps {
  documentTitle: string;
  deleteAction: () => Promise<never>;
}

export function DeleteDocumentButton({ documentTitle, deleteAction }: DeleteDocumentButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-[#ff6b6c] hover:bg-[#ff6b6c]/5 hover:text-[#ff6b6c]"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{documentTitle}</strong> will be permanently deleted. If a file was uploaded,
              it will also be removed from the server. This cannot be undone.
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
