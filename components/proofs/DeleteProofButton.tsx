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

interface DeleteProofButtonProps {
  proofTitle: string;
  deleteAction: () => Promise<never>;
}

export function DeleteProofButton({ proofTitle, deleteAction }: DeleteProofButtonProps) {
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
        Delete Proof
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Delete this proof?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{proofTitle}</strong> and all its versions, comments, and approvals will be
              permanently deleted. Uploaded files will also be removed from the server. This cannot
              be undone.
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
