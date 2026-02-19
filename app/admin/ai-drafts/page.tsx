"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sparkles, Edit2, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

export default function AIDraftsPage() {
    const drafts = useQuery(api.ai.listAIDrafts, {});

    if (!drafts) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
                    <p className="text-gray-500 font-medium font-sans">Synthesizing drafts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-gray-950 tracking-tight">Refiner</h1>
                    <p className="text-gray-500 mt-1 font-medium font-sans">Review and polish autonomous content generations.</p>
                </div>
                <div className="px-5 py-2.5 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-3 shadow-sm shadow-purple-50">
                    <Sparkles size={18} className="text-purple-600" />
                    <span className="text-xs font-black uppercase tracking-[0.15em] text-purple-600">Active Pipeline: {drafts.length}</span>
                </div>
            </div>

            {drafts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {drafts.map((draft) => (
                        <div key={draft._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group hover:border-purple-300 hover:shadow-xl hover:shadow-purple-50 transition-all duration-500 flex flex-col">
                            <div className="aspect-[16/10] relative overflow-hidden">
                                <Image
                                    src={draft.coverImage || "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80"}
                                    alt={draft.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute top-4 left-4 z-10">
                                    <div className="bg-purple-600/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
                                        <Sparkles size={10} className="fill-white" />
                                        AI Generated
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4 flex-1 flex flex-col bg-white">
                                <div className="flex-1">
                                    <h3 className="font-serif font-black text-xl text-gray-950 line-clamp-2 tracking-tight group-hover:text-purple-600 transition-colors duration-300 min-h-[56px]">
                                        {draft.title}
                                    </h3>
                                    <p className="text-[13px] text-gray-500 line-clamp-2 mt-3 leading-relaxed font-medium">
                                        {draft.excerpt}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-5 border-t border-gray-50 mt-2">
                                    <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-[0.1em]">
                                        <Calendar size={14} className="text-gray-300" />
                                        {format(draft.createdAt, "MMM d, yyyy")}
                                    </div>
                                    <Link
                                        href={`/admin/articles/${draft._id}/edit`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 active:scale-90 shadow-sm shadow-purple-100"
                                        title="Refine & Review"
                                    >
                                        <Edit2 size={14} />
                                        Draft
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-40 bg-white rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                        <Image
                            src="/illustrations/Idea.svg"
                            alt=""
                            fill
                            className="object-contain"
                        />
                    </div>
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                            <Sparkles size={40} className="text-gray-200" />
                        </div>
                        <p className="text-gray-500 font-black uppercase text-xs tracking-[0.2em]">Zero artifacts in pipeline</p>
                        <p className="text-gray-400 text-[11px] mt-2 font-medium">Your digital scribe is currently dormant</p>
                        <Link
                            href="/admin/settings/ai"
                            className="inline-flex items-center gap-2 mt-8 text-purple-600 font-black uppercase text-[10px] tracking-[0.15em] hover:bg-purple-50 px-6 py-3 rounded-xl border border-purple-100 transition-all shadow-sm"
                        >
                            <Edit2 size={12} />
                            Configure Scribe
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
