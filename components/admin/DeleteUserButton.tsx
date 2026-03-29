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

interface DeleteUserButtonProps {
  userName: string;
  deleteAction: () => Promise<never>;
}

export function DeleteUserButton({ userName, deleteAction }: DeleteUserButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-[#ff6b6c]/30 text-[#ff6b6c] hover:bg-[#ff6b6c]/5 text-sm"
      >
        <Trash2 className="h-4 w-4 mr-1.5" />
        Delete account
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userName}</strong> will be permanently removed and lose all portal access.
              Their email can be reused to create a new account. This cannot be undone.
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
