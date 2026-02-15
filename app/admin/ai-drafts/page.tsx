"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sparkles, Edit2, Calendar, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ArticleStatusBadge } from "@/components/admin/article-badges";

export default function AIDraftsPage() {
    const drafts = useQuery(api.ai.listAIDrafts, {});

    if (!drafts) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-zinc-900">AI Drafts</h1>
                    <p className="text-zinc-500 mt-1 uppercase text-[10px] font-black tracking-widest">Review and polish autonomous content generations.</p>
                </div>
                <div className="px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">Total Drafts: {drafts.length}</span>
                </div>
            </div>

            {drafts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {drafts.map((draft) => (
                        <div key={draft._id} className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden group hover:border-purple-200 hover:shadow-md transition-all">
                            <div className="aspect-video relative overflow-hidden">
                                <Image
                                    src={draft.coverImage || "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80"}
                                    alt={draft.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 left-4">
                                    <ArticleStatusBadge status="draft" />
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="font-serif font-bold text-xl text-zinc-900 line-clamp-2 min-h-[56px] group-hover:text-primary transition-colors">
                                        {draft.title}
                                    </h3>
                                    <p className="text-sm text-zinc-500 line-clamp-2 mt-2 leading-relaxed">
                                        {draft.excerpt}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                                    <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                                        <Calendar size={14} />
                                        Generated {format(draft.createdAt, "MMM d, yyyy")}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/admin/articles/${draft._id}/edit`}
                                            className="p-2.5 bg-zinc-50 text-zinc-400 hover:bg-purple-50 hover:text-purple-600 rounded-xl border border-zinc-100 transition-all"
                                            title="Refine & Review"
                                        >
                                            <Edit2 size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 bg-zinc-50 rounded-[40px] border-2 border-dashed border-zinc-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-zinc-100">
                        <Sparkles size={32} className="text-zinc-200" />
                    </div>
                    <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">No AI drafts generated yet</p>
                    <Link
                        href="/admin/settings/ai"
                        className="inline-flex items-center gap-2 mt-6 text-primary font-black uppercase text-[10px] tracking-widest hover:underline"
                    >
                        Configure automation
                        <Edit2 size={12} />
                    </Link>
                </div>
            )}
        </div>
    );
}
