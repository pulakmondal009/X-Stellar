import Spinner from "@/components/ui/Spinner";
import { StellarStarLogo } from "@/components/ui/Logo";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F6F6] px-6">
      <div className="flex flex-col items-center gap-5">
        <StellarStarLogo size="lg" />
        <Spinner size={36} className="text-[#2DD4BF]" />
      </div>
    </div>
  );
}