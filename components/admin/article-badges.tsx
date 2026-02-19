import { cn } from "@/lib/utils";
import { Sparkles, Clock, FileEdit, CheckCircle2 } from "lucide-react";

type Status = "draft" | "published" | "scheduled";
type Source = "ai" | "human";

export function ArticleStatusBadge({ status }: { status: Status }) {
    const styles = {
        draft: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
        published: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50",
        scheduled: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50",
    };

    const icons = {
        draft: <FileEdit size={10} />,
        published: <CheckCircle2 size={10} />,
        scheduled: <Clock size={10} />,
    };

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-[0.08em] shadow-sm transition-colors",
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[90%] font-black bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 uppercase tracking-tight shadow-sm transition-colors">
            <Sparkles size={10} className="fill-purple-600 dark:fill-purple-400" />
            <span className="text-[10px] italic tracking-tighter">AI Origin</span>
        </span>
    );
}
