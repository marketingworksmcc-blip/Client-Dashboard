import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#f0efe9] flex items-center justify-center mx-auto mb-5">
          <FileQuestion className="h-7 w-7 text-[#8a8880]" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-[#1a1a18] mb-2">Page not found</h1>
        <p className="text-sm text-[#8a8880] mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
