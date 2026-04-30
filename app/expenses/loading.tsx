export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F6F6F6] px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl h-12 shimmer border border-[#E5E5E5]" />
        <div className="space-y-3">
          <div className="bg-white rounded-2xl h-20 shimmer border border-[#E5E5E5]" />
          <div className="bg-white rounded-2xl h-20 shimmer border border-[#E5E5E5]" />
          <div className="bg-white rounded-2xl h-20 shimmer border border-[#E5E5E5]" />
          <div className="bg-white rounded-2xl h-20 shimmer border border-[#E5E5E5]" />
        </div>
      </div>
    </div>
  );
}