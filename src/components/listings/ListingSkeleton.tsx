export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded-full w-1/2" />
        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
        <div className="h-4 bg-gray-200 rounded-full w-1/2" />
        <div className="h-5 bg-gray-200 rounded-full w-2/5" />
        <div className="flex gap-3">
          <div className="h-3 bg-gray-200 rounded-full w-12" />
          <div className="h-3 bg-gray-200 rounded-full w-8" />
          <div className="h-3 bg-gray-200 rounded-full w-8" />
        </div>
      </div>
    </div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[16/9] bg-gray-200 w-full" />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="h-4 bg-gray-200 rounded-full w-1/3" />
        <div className="h-8 bg-gray-200 rounded-full w-3/4" />
        <div className="h-10 bg-gray-200 rounded-full w-1/3" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded-full" />
          <div className="h-4 bg-gray-200 rounded-full w-5/6" />
          <div className="h-4 bg-gray-200 rounded-full w-4/6" />
        </div>
      </div>
    </div>
  );
}
