
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "simple";
}

const Logo = ({ className, variant = "default" }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Leaf className="w-6 h-6 text-crop-primary animate-pulse-light" />
      {variant === "default" && (
        <span className="font-semibold text-xl">CropAdvisor</span>
      )}
    </div>
  );
};

export default Logo;
