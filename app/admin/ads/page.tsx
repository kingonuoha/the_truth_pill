"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Megaphone, Save, Loader2, Code2, Layout, Settings2, Eye, ShieldCheck, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdsManagementPage() {
    const settings = useQuery(api.ads.getAdsSettings);
    const updateSettings = useMutation(api.ads.updateAdsSettings);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        adsEnabled: false,
        adsenseScriptCode: "",
        adsenseAdUnitCode: "",
        showAdTopOfArticle: false,
        showAdMiddleOfArticle: false,
        showAdBottomOfArticle: false,
        showAdSidebar: false,
    });

    useEffect(() => {
        if (settings) {
            setFormData({
                adsEnabled: settings.adsEnabled,
                adsenseScriptCode: settings.adsenseScriptCode,
                adsenseAdUnitCode: settings.adsenseAdUnitCode,
                showAdTopOfArticle: settings.showAdTopOfArticle,
                showAdMiddleOfArticle: settings.showAdMiddleOfArticle,
                showAdBottomOfArticle: settings.showAdBottomOfArticle,
                showAdSidebar: settings.showAdSidebar,
            });
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateSettings(formData);
            toast.success("Ad settings saved");
        } catch (error) {
            toast.error("Failed to save settings: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!settings && settings !== null) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse flex flex-col items-center gap-4 text-blue-600">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="text-gray-500 font-medium font-sans">Syncing ad network...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-10 pb-20 font-sans text-gray-950">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black tracking-tight">Monetization</h1>
                    <p className="text-gray-500 mt-1 font-medium font-sans">Monetize your content while maintaining user trust.</p>
                </div>
                <button
                    form="ads-config-form"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95 shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Synchronize
                </button>
            </div>

            <form id="ads-config-form" onSubmit={handleSubmit} className="grid gap-8">
                {/* Global Status */}
                <section className="bg-white p-8 md:p-10 rounded-xl border border-gray-200 shadow-sm space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 pointer-events-none" />

                    <div className="flex items-center gap-4 border-b border-gray-50 pb-8 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                            <Settings2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-950">Broadcast Matrix</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Master switch for all advertisements</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-gray-100 relative z-10">
                        <div className="flex gap-4 items-center">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                                formData.adsEnabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'
                            )}>
                                <Megaphone size={24} className={cn(formData.adsEnabled && "animate-pulse")} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-black text-gray-950 leading-tight">Enable Ads Network</span>
                                <span className="text-[10px] text-gray-400 font-black uppercase mt-1 tracking-widest">System is {formData.adsEnabled ? 'Active' : 'Offline'}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, adsEnabled: !prev.adsEnabled }))}
                            className={cn(
                                "w-14 h-7 rounded-full transition-all relative border-2",
                                formData.adsEnabled ? 'bg-blue-600 border-blue-600 shadow-inner' : 'bg-gray-200 border-gray-200'
                            )}
                        >
                            <div className={cn(
                                "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-md flex items-center justify-center",
                                formData.adsEnabled ? 'left-7.5' : 'left-0.5'
                            )}>
                                <div className={cn("w-1.5 h-1.5 rounded-full", formData.adsEnabled ? "bg-blue-600" : "bg-gray-300")} />
                            </div>
                        </button>
                    </div>

                    {!formData.adsEnabled && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 italic text-[11px] font-medium relative z-10">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <p>Ads are currently disabled. No scripts or ad units will be synchronized with the frontend matrix.</p>
                        </div>
                    )}
                </section>

                {/* Ad Code */}
                <section className="bg-white p-8 md:p-10 rounded-xl border border-gray-200 shadow-sm space-y-10">
                    <div className="flex items-center gap-4 border-b border-gray-50 pb-8">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                            <Code2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-950">Integration Snippets</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Inject your Google AdSense infrastructure</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Main Script Bundle</label>
                                <span className="text-[9px] text-blue-600 font-black uppercase italic tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">Header Injection</span>
                            </div>
                            <textarea
                                value={formData.adsenseScriptCode}
                                onChange={e => setFormData(prev => ({ ...prev, adsenseScriptCode: e.target.value }))}
                                rows={4}
                                placeholder="<script async src='https://pagead2.googlesyndication.com...'></script>"
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-5 font-mono text-[12px] text-gray-600 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-gray-300"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Primary Ad Unit Unit</label>
                                <span className="text-[9px] text-purple-600 font-black uppercase italic tracking-widest bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">Reusable Component</span>
                            </div>
                            <textarea
                                value={formData.adsenseAdUnitCode}
                                onChange={e => setFormData(prev => ({ ...prev, adsenseAdUnitCode: e.target.value }))}
                                rows={6}
                                placeholder="<ins class='adsbygoogle' style='display:block' data-ad-client='ca-pub-...'></ins>"
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-5 font-mono text-[12px] text-gray-600 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                        <ShieldCheck size={16} className="text-gray-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Restricted: System-level sensitive integration fields.</span>
                    </div>
                </section>

                {/* Placement Controls */}
                <section className="bg-white p-8 md:p-10 rounded-xl border border-gray-200 shadow-sm space-y-10">
                    <div className="flex items-center gap-4 border-b border-gray-50 pb-8">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                            <Layout size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-950">Spatial Toggles</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Configure visual placement across the story canvas</p>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 pb-2">
                        {[
                            { id: 'showAdTopOfArticle', label: 'Top Canvas', desc: 'Directly below title' },
                            { id: 'showAdMiddleOfArticle', label: 'Mid Canvas', desc: 'Embedded post-intro' },
                            { id: 'showAdBottomOfArticle', label: 'Base Canvas', desc: 'Post-content anchor' },
                            { id: 'showAdSidebar', label: 'Peripheral', desc: 'Sidebar container' },
                        ].map((placement) => (
                            <div
                                key={placement.id}
                                className={cn(
                                    "p-6 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-6 group",
                                    formData[placement.id as keyof typeof formData]
                                        ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100 scale-[1.02]"
                                        : "bg-gray-50/50 text-gray-950 border-gray-100 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-gray-100"
                                )}
                                onClick={() => setFormData(prev => ({
                                    ...prev,
                                    [placement.id]: !prev[placement.id as keyof typeof formData]
                                }))}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn(
                                            "p-1.5 rounded-lg transition-colors duration-300",
                                            formData[placement.id as keyof typeof formData] ? "bg-blue-500 text-white" : "bg-white text-gray-400 border border-gray-100"
                                        )}>
                                            <Eye size={14} />
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-tight">{placement.label}</h4>
                                    </div>
                                    <p className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest",
                                        formData[placement.id as keyof typeof formData] ? "text-blue-100" : "text-gray-400"
                                    )}>
                                        {placement.desc}
                                    </p>
                                </div>
                                <div className={cn(
                                    "w-10 h-5 rounded-full transition-all relative border-2 shrink-0",
                                    formData[placement.id as keyof typeof formData] ? 'bg-white border-white shadow-inner' : 'bg-gray-200 border-gray-200'
                                )}>
                                    <div className={cn(
                                        "absolute top-0.5 w-3 h-3 rounded-full transition-all flex items-center justify-center",
                                        formData[placement.id as keyof typeof formData] ? 'left-6 bg-blue-600' : 'left-0.5 bg-white shadow-sm'
                                    )}>
                                        {formData[placement.id as keyof typeof formData] && <div className="w-1 h-1 bg-white rounded-full" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </form>
        </div>
    );
}
