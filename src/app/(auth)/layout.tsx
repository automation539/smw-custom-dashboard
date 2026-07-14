import { LayoutGrid } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <LayoutGrid className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <span className="text-lg font-semibold text-gray-900">SMW Dashboard</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
