import { cn } from "@/lib/utils";
import { Sparkles, Clock, FileEdit, CheckCircle2 } from "lucide-react";

type Status = "draft" | "published" | "scheduled";
type Source = "ai" | "human";

export function ArticleStatusBadge({ status }: { status: Status }) {
    const styles = {
        draft: "bg-zinc-100 text-zinc-600 border-zinc-200",
        published: "bg-green-50 text-green-700 border-green-200",
        scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    };

    const icons = {
        draft: <FileEdit size={12} />,
        published: <CheckCircle2 size={12} />,
        scheduled: <Clock size={12} />,
    };

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wider",
            styles[status]
        )}>
            {icons[status]}
            {status}
        </span>
    );
}

export function ArticleSourceBadge({ source }: { source: Source }) {
    if (source === "human") return null;

    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-black italic bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-tighter shadow-sm">
            <Sparkles size={12} className="fill-purple-700" />
            AI Insight
        </span>
    );
}
