interface FormErrorProps {
  message?: string | null;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <div className="rounded-md bg-[#ff6b6c]/10 border border-[#ff6b6c]/20 px-3 py-2">
      <p className="text-sm text-[#ff6b6c]">{message}</p>
    </div>
  );
}
