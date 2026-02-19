import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Zap } from "lucide-react";

interface TOCItem {
    id: string;
    text: string;
    level: number;
}

export function TableOfContents() {
    const [items, setItems] = useState<TOCItem[]>([]);
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        const headings = Array.from(document.querySelectorAll("article h2, article h3"));
        const tocItems = headings.map((heading, index) => {
            const id = heading.id || `heading-${index}`;
            heading.id = id;
            return {
                id,
                text: heading.textContent || "",
                level: heading.tagName === "H2" ? 2 : 3
            };
        });

        const timer = setTimeout(() => {
            setItems(tocItems);
        }, 100);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: "-100px 0px -66%" }
        );

        headings.forEach((heading) => observer.observe(heading));
        return () => {
            observer.disconnect();
            clearTimeout(timer);
        };
    }, []);

    const scrollToComments = () => {
        document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900">
                        On this page
                    </h4>
                </div>

                <nav className="flex flex-col gap-3">
                    {items.map((item) => (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            className={cn(
                                "text-[13px] transition-all duration-300 relative pl-4 border-l border-zinc-100",
                                activeId === item.id
                                    ? "text-primary font-bold border-primary"
                                    : "text-zinc-500 font-medium hover:text-zinc-800 hover:border-zinc-300",
                                item.level === 3 && "ml-4 text-[12px]"
                            )}
                        >
                            {item.text}
                        </a>
                    ))}
                    <button
                        onClick={scrollToComments}
                        className="text-[13px] text-zinc-500 font-medium hover:text-primary transition-all duration-300 pl-4 border-l border-zinc-100 mt-2 flex items-center gap-2 group"
                    >
                        <MessageSquare size={14} className="group-hover:scale-110 transition-transform" />
                        Collective Reflections
                    </button>
                </nav>
            </div>

            <div className="p-6 bg-primary rounded-[32px] border border-primary/10 shadow-xl shadow-primary/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <Zap size={60} fill="white" className="text-white" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap size={14} className="text-white fill-white" />
                        <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">Truth Seeker Pro Tip</p>
                    </div>
                    <p className="text-xs text-white leading-relaxed font-serif italic mb-4">
                        Navigate the pill faster.
                    </p>
                    <div className="flex gap-2">
                        <kbd className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 text-[10px] text-white font-bold shadow-sm">J</kbd>
                        <kbd className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 text-[10px] text-white font-bold shadow-sm">K</kbd>
                    </div>
                </div>
            </div>
        </div>
    );
}
