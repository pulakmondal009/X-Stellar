export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F6F6F6] px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-3xl h-32 shimmer border border-[#E5E5E5]" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl h-24 shimmer border border-[#E5E5E5]" />
          <div className="bg-white rounded-2xl h-24 shimmer border border-[#E5E5E5]" />
          <div className="bg-white rounded-2xl h-24 shimmer border border-[#E5E5E5]" />
          <div className="bg-white rounded-2xl h-24 shimmer border border-[#E5E5E5]" />
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E5E5E5] space-y-3">
          <div className="h-14 rounded-xl shimmer bg-[#F6F6F6]" />
          <div className="h-14 rounded-xl shimmer bg-[#F6F6F6]" />
          <div className="h-14 rounded-xl shimmer bg-[#F6F6F6]" />
          <div className="h-14 rounded-xl shimmer bg-[#F6F6F6]" />
          <div className="h-14 rounded-xl shimmer bg-[#F6F6F6]" />
        </div>
      </div>
    </div>
  );
}