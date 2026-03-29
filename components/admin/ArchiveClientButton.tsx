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
import { Archive } from "lucide-react";

interface ArchiveClientButtonProps {
  clientName: string;
  archiveAction: () => Promise<never>;
}

export function ArchiveClientButton({ clientName, archiveAction }: ArchiveClientButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-[#ff6b6c]/30 text-[#ff6b6c] hover:bg-[#ff6b6c]/5 text-sm"
      >
        <Archive className="h-4 w-4 mr-1.5" />
        Archive
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Archive this client?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{clientName}</strong> will be archived and portal users will lose access. You
              can restore it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={archiveAction}>
              <Button
                type="submit"
                className="bg-[#ff6b6c] hover:bg-[#ff6b6c]/90 text-white w-full"
              >
                Archive Client
              </Button>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
