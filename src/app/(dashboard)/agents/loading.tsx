export default function AgentsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="h-14 w-full animate-pulse rounded-xl bg-gray-200" />
      <div className="h-72 animate-pulse rounded-xl bg-gray-200" />
    </div>
  );
}
