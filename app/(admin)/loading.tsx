export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="space-y-2 mb-6">
        <div className="h-6 bg-[#e2e0d9] rounded-lg w-48" />
        <div className="h-4 bg-[#f0efe9] rounded-lg w-72" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-[#e2e0d9] rounded-xl p-5 space-y-3">
            <div className="h-3 bg-[#f0efe9] rounded w-20" />
            <div className="h-7 bg-[#e2e0d9] rounded w-16" />
            <div className="h-3 bg-[#f0efe9] rounded w-24" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="bg-white border border-[#e2e0d9] rounded-xl p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-9 h-9 bg-[#f0efe9] rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#f0efe9] rounded w-3/4" />
              <div className="h-3 bg-[#f0efe9] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
