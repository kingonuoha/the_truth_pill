"use client";

import { useEffect, useState } from "react";

interface TOCItem {
    id: string;
    text: string;
    level: number;
}

export function TableOfContents() {
    const [items, setItems] = useState<TOCItem[]>([]);
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        const headings = Array.from(document.querySelectorAll("h2, h3"));
        const tocItems = headings.map((heading, index) => {
            const id = heading.id || `heading-${index}`;
            heading.id = id;
            return {
                id,
                text: heading.textContent || "",
                level: heading.tagName === "H2" ? 2 : 3
            };
        });
        // Defer to avoid cascading render warning
        const timer = setTimeout(() => {
            setItems(tocItems);
        }, 0);

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

    if (items.length === 0) return null;

    return (
        <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                On this page
            </h4>
            <nav className="flex flex-col gap-3">
                {items.map((item) => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`text-sm transition-all duration-300 hover:text-sky-blue ${activeId === item.id
                            ? "text-sky-blue font-bold translate-x-2"
                            : "text-zinc-500 font-medium"
                            } ${item.level === 3 ? "ml-4 text-xs" : ""}`}
                    >
                        {item.text}
                    </a>
                ))}
            </nav>
            <div className="mt-8 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Pro Tip</p>
                <p className="text-xs text-zinc-600 leading-relaxed font-light">
                    Use <kbd className="bg-white px-1.5 py-0.5 rounded border border-zinc-200 shadow-sm text-[10px]">J</kbd> and <kbd className="bg-white px-1.5 py-0.5 rounded border border-zinc-200 shadow-sm text-[10px]">K</kbd> to navigate through the Truth Pills.
                </p>
            </div>
        </div>
    );
}
