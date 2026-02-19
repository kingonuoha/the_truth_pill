"use client";

import { useTheme } from "next-themes";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import {
    Moon,
    Sun,
    Globe,
    Mail,
    Phone,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Github,
    Linkedin,
    Save,
    Loader2,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TikTokIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const settings = useQuery(api.site_settings.getSiteSettings);
    const updateSettings = useMutation(api.site_settings.updateSiteSettings);

    // Form state
    const [form, setForm] = useState({
        siteName: "",
        siteDescription: "",
        email: "",
        phone: "",
        socials: {
            facebook: "",
            twitter: "",
            instagram: "",
            youtube: "",
            tiktok: "",
            linkedin: "",
            github: ""
        },
        footerText: ""
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (settings) {
            setForm({
                siteName: settings.siteName || "",
                siteDescription: settings.siteDescription || "",
                email: settings.email || "",
                phone: settings.phone || "",
                socials: {
                    facebook: settings.socials?.facebook || "",
                    twitter: settings.socials?.twitter || "",
                    instagram: settings.socials?.instagram || "",
                    youtube: settings.socials?.youtube || "",
                    tiktok: settings.socials?.tiktok || "",
                    linkedin: settings.socials?.linkedin || "",
                    github: settings.socials?.github || ""
                },
                footerText: settings.footerText || ""
            });
        }
    }, [settings]);

    if (!mounted) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateSettings(form);
            toast.success("Settings updated successfully", {
                description: "Changes are now live across the platform."
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    const inputClasses = "w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all dark:text-gray-100";
    const labelClasses = "block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 dark:text-gray-400";

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-serif font-black text-gray-950 dark:text-white mb-2 tracking-tight">System Configuration</h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your platform&apos;s digital identity and presence.</p>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: General & Appearance */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Dark Mode Card */}
                    <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-serif font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    <Sun className="text-blue-600 dark:text-blue-400" size={24} />
                                    Appearance
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize how the platform looks for you.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-1.5 bg-gray-50 dark:bg-gray-900 rounded-2xl w-fit">
                            <button
                                type="button"
                                onClick={() => setTheme("light")}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    theme === "light"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Sun size={14} /> Light
                            </button>
                            <button
                                type="button"
                                onClick={() => setTheme("dark")}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    theme === "dark"
                                        ? "bg-gray-800 text-white shadow-sm"
                                        : "text-gray-400 hover:text-gray-500"
                                )}
                            >
                                <Moon size={14} /> Dark
                            </button>
                        </div>
                    </div>

                    {/* Site Identity Card */}
                    <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-2xl p-8 shadow-sm">
                        <h2 className="text-xl font-serif font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                            <Globe className="text-blue-600" size={24} />
                            Site Identity
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className={labelClasses}>Site Name</label>
                                <input
                                    type="text"
                                    value={form.siteName}
                                    onChange={e => setForm({ ...form, siteName: e.target.value })}
                                    placeholder="Enter site name"
                                    className={inputClasses}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Site Description</label>
                                <textarea
                                    rows={3}
                                    value={form.siteDescription}
                                    onChange={e => setForm({ ...form, siteDescription: e.target.value })}
                                    placeholder="Briefly describe the platform"
                                    className={cn(inputClasses, "resize-none")}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Footer Tagline</label>
                                <input
                                    type="text"
                                    value={form.footerText}
                                    onChange={e => setForm({ ...form, footerText: e.target.value })}
                                    placeholder="Evolution is mandatory."
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-2xl p-8 shadow-sm">
                        <h2 className="text-xl font-serif font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                            <Mail className="text-blue-600" size={24} />
                            Contact Presence
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClasses}>Public Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        className={cn(inputClasses, "pl-12")}
                                        placeholder="admin@thetruthpill.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Public Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        className={cn(inputClasses, "pl-12")}
                                        placeholder="+234 000 000 0000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Social Links & Actions */}
                <div className="space-y-8">
                    {/* Social Links Card */}
                    <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-2xl p-8 shadow-sm h-fit">
                        <h2 className="text-xl font-serif font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                            <Shield className="text-blue-600" size={24} />
                            Social Signal
                        </h2>

                        <div className="space-y-6">
                            {[
                                { id: "facebook", icon: Facebook, color: "text-blue-600" },
                                { id: "twitter", icon: Twitter, color: "text-sky-500" },
                                { id: "instagram", icon: Instagram, color: "text-pink-600" },
                                { id: "youtube", icon: Youtube, color: "text-red-600" },
                                { id: "tiktok", icon: TikTokIcon, color: "text-gray-950 dark:text-white" },
                                { id: "linkedin", icon: Linkedin, color: "text-blue-700" },
                                { id: "github", icon: Github, color: "text-gray-900 dark:text-white" },
                            ].map((social) => (
                                <div key={social.id}>
                                    <label className={labelClasses}>{social.id}</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <social.icon size={16} className={cn("transition-transform group-focus-within:scale-110", social.color)} />
                                        </div>
                                        <input
                                            type="url"
                                            value={form.socials[social.id as keyof typeof form.socials]}
                                            onChange={e => setForm({
                                                ...form,
                                                socials: { ...form.socials, [social.id]: e.target.value }
                                            })}
                                            className={cn(inputClasses, "pl-12")}
                                            placeholder={`https://${social.id}.com/...`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Card */}
                    <div className="sticky top-24">
                        <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-2xl p-6 shadow-xl shadow-blue-900/5">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 text-white px-8 py-5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-blue-600/20 transition-all active:scale-95 group"
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        <Save size={18} className="group-hover:rotate-12 transition-transform" />
                                        Propagate Changes
                                    </>
                                )}
                            </button>
                            <p className="text-[10px] text-gray-400 text-center mt-4 font-bold uppercase tracking-widest">
                                Updates reflect immediately
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
