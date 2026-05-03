export function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="h-3 bg-white/10 rounded w-1/3 mb-3" />
      <div className="h-6 bg-white/10 rounded w-1/2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl animate-pulse">
      <div className="w-10 h-10 bg-white/10 rounded-full shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-white/10 rounded w-1/3 mb-2" />
        <div className="h-3 bg-white/10 rounded w-1/4" />
      </div>
      <div className="h-6 bg-white/10 rounded w-16" />
    </div>
  );
}

export function SkeletonSubmission() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 bg-white/10 rounded w-24" />
        <div className="h-6 bg-white/10 rounded-full w-20" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/5 rounded-lg p-3">
            <div className="h-2 bg-white/10 rounded w-1/2 mb-2" />
            <div className="h-4 bg-white/10 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}