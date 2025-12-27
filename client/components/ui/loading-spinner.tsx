import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
    text?: string;
}

const sizeMap = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
};

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
    return (
        <div className="flex items-center justify-center">
            <Loader2 className={cn("animate-spin text-green-600", sizeMap[size], className)} />
            {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
        </div>
    );
}

// Full page loading component
export function PageLoader({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="h-screen bg-slate-50 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4 font-medium">{text}</p>
        </div>
    );
}

// Inline button loading
export function ButtonLoader({ size = "sm" }: { size?: "xs" | "sm" }) {
    return <Loader2 className={cn("animate-spin", sizeMap[size])} />;
}
