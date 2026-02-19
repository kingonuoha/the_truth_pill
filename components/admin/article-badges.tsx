import { cn } from "@/lib/utils";
import { Sparkles, Clock, FileEdit, CheckCircle2 } from "lucide-react";

type Status = "draft" | "published" | "scheduled";
type Source = "ai" | "human";

export function ArticleStatusBadge({ status }: { status: Status }) {
    const styles = {
        draft: "bg-gray-100 text-gray-500 border-gray-200",
        published: "bg-green-50 text-green-600 border-green-100",
        scheduled: "bg-blue-50 text-blue-600 border-blue-100",
    };

    const icons = {
        draft: <FileEdit size={10} />,
        published: <CheckCircle2 size={10} />,
        scheduled: <Clock size={10} />,
    };

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-[0.08em] shadow-sm",
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[90%] font-black bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-tight shadow-sm">
            <Sparkles size={10} className="fill-purple-600" />
            <span className="text-[10px] italic tracking-tighter">AI Origin</span>
        </span>
    );
}
