"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bot, Save, Loader2, Key, Cpu, Sparkles, Clock, Calendar, Plus, Trash2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AISettingsPage() {
    const settings = useQuery(api.ai.getSettings);
    const schedule = useQuery(api.ai.getSchedule);
    const researchTopics = useQuery(api.ai.getResearchTopics);
    const categories = useQuery(api.categories.listAll);

    const updateSettings = useMutation(api.ai.updateSettings);
    const updateSchedule = useMutation(api.ai.updateScheduleV2);
    const deleteSchedule = useMutation(api.ai.deleteSchedule);
    const addResearchTopic = useMutation(api.ai.addResearchTopic);
    const deleteResearchTopic = useMutation(api.ai.deleteResearchTopic);
    const clearAllTopics = useMutation(api.ai.clearAllPendingTopics);

    const processScheduleAction = useAction(api.ai.processScheduleCheck);
    const fetchModelsAction = useAction(api.ai_actions.fetchModels);
    const testConnectionAction = useAction(api.ai_actions.testConnection);
    const learnStyleAction = useAction(api.ai_actions.learnAuthorStyle);
    const shuffleTopicsAction = useAction(api.ai_actions.shuffleTopics);
    const runResearchAction = useAction(api.ai.runSingleResearch);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRunningJobs, setIsRunningJobs] = useState(false);
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [isLearningStyle, setIsLearningStyle] = useState(false);
    const [isShuffling, setIsShuffling] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [writingPulseText, setWritingPulseText] = useState("Researching");

    const [formData, setFormData] = useState({
        provider: "openai",
        apiKey: "",
        model: "gpt-4-turbo",
        promptTemplate: "",
        isActive: false
    });

    const [isAddingSchedule, setIsAddingSchedule] = useState(false);
    const [editingScheduleId, setEditingScheduleId] = useState<Id<"aiSchedule"> | null>(null);
    const [scheduleFormData, setScheduleFormData] = useState({
        daysOfWeek: [1] as number[],
        time: "09:00",
        timezone: "GMT+1",
        isActive: true,
        topicsToResearch: [] as string[]
    });

    const [newResearchTopic, setNewResearchTopic] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

    useEffect(() => {
        if (settings?.isWriting) {
            const words = ["Researching", "Cross-referencing", "Synthesizing", "Deep-diving", "Ghostwriting"];
            let i = 0;
            const timer = setInterval(() => {
                setWritingPulseText(words[i % words.length]);
                i++;
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [settings?.isWriting]);

    useEffect(() => {
        if (settings) {
            setFormData({
                provider: settings.provider,
                apiKey: settings.apiKey || "",
                model: settings.model,
                promptTemplate: settings.promptTemplate || "",
                isActive: settings.isActive
            });
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateSettings(formData);
            toast.success("AI Configuration saved");
        } catch {
            toast.error("Failed to save settings");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLearnStyle = async () => {
        if (!formData.apiKey) {
            toast.error("API Key required to analyze style");
            return;
        }
        setIsLearningStyle(true);
        try {
            const style = await learnStyleAction({
                provider: formData.provider,
                apiKey: formData.apiKey,
                model: formData.model
            });
            setFormData(prev => ({ ...prev, promptTemplate: style }));
            toast.success("AI learned your writing style from recent posts!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to analyze style");
        } finally {
            setIsLearningStyle(false);
        }
    };

    const handleShuffleTopics = async (clearFirst = false) => {
        if (!formData.apiKey) {
            toast.error("API Key required to shuffle topics");
            return;
        }
        setIsShuffling(true);
        try {
            if (clearFirst) {
                await clearAllTopics();
            }
            const suggestions = await shuffleTopicsAction({
                provider: formData.provider,
                apiKey: formData.apiKey,
                model: formData.model
            });
            for (const s of suggestions) {
                const cat = categories?.find((c: Doc<"categories">) => c.name === s.categoryName);
                await addResearchTopic({
                    topic: s.topic,
                    categoryId: cat?._id
                });
            }
            toast.success(clearFirst ? "Strategy refreshed with new topics!" : "Added new research topics!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to shuffle topics");
        } finally {
            setIsShuffling(false);
        }
    };

    const handleRunResearch = async (topic: string) => {
        toast.promise(runResearchAction({ topic }), {
            loading: `AI is deep-diving into "${topic}"...`,
            success: "Article draft generated successfully!",
            error: (err) => err instanceof Error ? err.message : "Failed to generate article"
        });
    };

    const handleDeleteSchedule = (id: Id<"aiSchedule">) => {
        toast("Delete this schedule?", {
            action: {
                label: "Confirm",
                onClick: async () => {
                    try {
                        await deleteSchedule({ id });
                        toast.success("Schedule deleted");
                    } catch {
                        toast.error("Failed to delete schedule");
                    }
                }
            }
        });
    };

    const handleSaveSchedule = async () => {
        try {
            await updateSchedule({
                ...scheduleFormData,
                id: editingScheduleId || undefined
            });
            toast.success(editingScheduleId ? "Schedule updated" : "Schedule created");
            setIsAddingSchedule(false);
            setEditingScheduleId(null);
            setScheduleFormData({ daysOfWeek: [1], time: "09:00", timezone: "GMT+1", isActive: true, topicsToResearch: [] });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save schedule");
        }
    };

    if (!settings && settings !== null) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const timezones = ["UTC", "GMT+1", "EST", "PST", "CET", "IST"];

    return (
        <div className="max-w-5xl space-y-16 pb-20 px-4 md:px-0 dark:text-gray-100 font-sans">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-gray-100 dark:border-gray-800/50">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-1 h-px bg-zinc-900 dark:bg-zinc-400 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Autonomous Intelligence</span>
                    </div>
                    <h1 className="text-5xl font-serif font-black tracking-tight text-zinc-900 dark:text-white leading-none">AI Operations</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-lg">Master your digital ghostwriters & define the autonomous rhythms that generate truth.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {settings?.isWriting && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-lg border border-sky-100 dark:border-sky-900 shadow-sm overflow-hidden min-w-[140px]">
                            <motion.div
                                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-2 h-2 rounded-full bg-sky-500 shrink-0"
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest truncate">
                                {writingPulseText}...
                            </span>
                        </div>
                    )}
                    <button
                        onClick={async () => {
                            setIsRunningJobs(true);
                            try {
                                await processScheduleAction();
                                toast.success("Schedule check completed");
                            } catch {
                                toast.error("Failed to run schedule check");
                            } finally {
                                setIsRunningJobs(false);
                            }
                        }}
                        disabled={isRunningJobs || !!settings?.isWriting}
                        className="px-4 py-2 bg-zinc-100 dark:bg-background-800 text-zinc-600 dark:text-zinc-400 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isRunningJobs ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Run Full Check
                    </button>
                    <button
                        form="ai-config-form"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        Save Config
                    </button>
                </div>
            </div>

            <div className="grid gap-12">
                <form id="ai-config-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white dark:bg-cardp-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 border-b border-zinc-50 dark:border-zinc-800 pb-6">
                            <div className="p-2.5 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-2xl">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Ghostwriter Engine</h3>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">Configure LLM providers and credentials</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">AI Provider</label>
                                    <select
                                        value={formData.provider}
                                        onChange={e => {
                                            const newProvider = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                provider: newProvider,
                                                model: newProvider === "openai" ? "gpt-4-turbo" : "gemini-1.5-pro"
                                            }));
                                            setAvailableModels([]);
                                        }}
                                        className="w-full bg-zinc-50 dark:bg-background-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold text-sm outline-none appearance-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        <option value="openai">OpenAI (ChatGPT)</option>
                                        <option value="gemini">Google (Gemini)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">API Secret Key</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                        <input
                                            type="password"
                                            value={formData.apiKey}
                                            onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                                            placeholder="sk-..."
                                            className="w-full bg-zinc-50 dark:bg-background-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-gray-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Preferred Model</label>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!formData.apiKey) {
                                                    toast.error("Please enter an API key first");
                                                    return;
                                                }
                                                setIsFetchingModels(true);
                                                try {
                                                    const models = await fetchModelsAction({
                                                        provider: formData.provider,
                                                        apiKey: formData.apiKey
                                                    });
                                                    setAvailableModels(models);
                                                    toast.success(`Fetched ${models.length} models`);
                                                } catch (err) {
                                                    toast.error(err instanceof Error ? err.message : "Failed to fetch models");
                                                } finally {
                                                    setIsFetchingModels(false);
                                                }
                                            }}
                                            disabled={isFetchingModels || !formData.apiKey}
                                            className="text-[9px] font-black uppercase text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {isFetchingModels ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                                            Fetch Models
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                        <select
                                            value={formData.model}
                                            onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                                            className="w-full bg-zinc-50 dark:bg-background-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 font-medium text-sm outline-none appearance-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            {availableModels.length > 0 ? (
                                                availableModels.map(m => <option key={m} value={m}>{m}</option>)
                                            ) : (
                                                <>
                                                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                                                    <option value="gpt-4">gpt-4</option>
                                                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                                                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                                                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!formData.apiKey || !formData.model) {
                                            toast.error("API Key and Model are required to test");
                                            return;
                                        }
                                        setIsTestingConnection(true);
                                        try {
                                            const result = await testConnectionAction({
                                                provider: formData.provider,
                                                apiKey: formData.apiKey,
                                                model: formData.model
                                            });
                                            if (result.success) {
                                                toast.success(result.message);
                                            } else {
                                                toast.error(result.message);
                                            }
                                        } catch (err) {
                                            toast.error(err instanceof Error ? err.message : "Connection test failed");
                                        } finally {
                                            setIsTestingConnection(false);
                                        }
                                    }}
                                    disabled={isTestingConnection || !formData.apiKey || !formData.model}
                                    className="w-full py-3 px-4 bg-zinc-50 dark:bg-background-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isTestingConnection ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                    Test API Connection
                                </button>

                                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-background-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                                    <div className="flex gap-3 items-center">
                                        <div className={cn("p-2 rounded-xl transition-colors", formData.isActive ? 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400' : 'bg-zinc-200 dark:bg-background-700 text-zinc-500 dark:text-zinc-400')}>
                                            <Sparkles size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-zinc-900 dark:text-white leading-tight">Master Switch</span>
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">System is {formData.isActive ? 'Live' : 'Paused'}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                        className={cn("w-12 h-6 rounded-full transition-all relative", formData.isActive ? 'bg-primary' : 'bg-zinc-300 dark:bg-background-700')}
                                    >
                                        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", formData.isActive ? 'left-7' : 'left-1')} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-zinc-50 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Author&apos;s Digital Twin DNA</label>
                                    <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase italic">AI learns from your last 3 posts to stay in your voice.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleLearnStyle}
                                    disabled={isLearningStyle || !formData.apiKey}
                                    className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLearningStyle ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                    Sync Writing DNA
                                </button>
                            </div>
                            <textarea
                                value={formData.promptTemplate}
                                onChange={e => setFormData(prev => ({ ...prev, promptTemplate: e.target.value }))}
                                rows={8}
                                placeholder="The AI's persona is defined here. You can manually tweak it or use the 'Refresh' button above to automatically sync it with your recent writing style..."
                                className="w-full bg-zinc-50 dark:bg-background-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 font-serif text-zinc-600 dark:text-gray-300 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all hover:bg-zinc-100/50 dark:hover:bg-zinc-800/80"
                            />
                        </div>
                    </div>
                </form>

                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-serif font-black text-zinc-900 dark:text-white tracking-tight">Strategic Content Lab</h2>
                                <p className="text-[10px] text-zinc-400 mt-1 uppercase font-black tracking-[0.2em] italic">Queue of curated intelligence for processing</p>
                            </div>
                            <button
                                onClick={() => handleShuffleTopics(true)}
                                disabled={isShuffling || !formData.apiKey}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 disabled:opacity-50"
                                title="Full Refresh: Clear and generate new strategic topics"
                            >
                                {isShuffling ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            </button>
                        </div>

                        <div className="bg-white/50 dark:bg-gray-950/40 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-gray-800/50 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-gray-50 dark:border-gray-900 space-y-6">
                                <div className="flex gap-3">
                                    <div className="flex-1 relative group/input">
                                        <input
                                            type="text"
                                            value={newResearchTopic}
                                            onChange={e => setNewResearchTopic(e.target.value)}
                                            placeholder="Specify intelligence to gather..."
                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-serif italic"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (newResearchTopic.trim()) {
                                                addResearchTopic({
                                                    topic: newResearchTopic.trim(),
                                                    categoryId: (selectedCategoryId as Id<"categories">) || undefined
                                                });
                                                setNewResearchTopic("");
                                            }
                                        }}
                                        className="w-12 h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Target Taxonomy</span>
                                    <select
                                        value={selectedCategoryId}
                                        onChange={e => setSelectedCategoryId(e.target.value)}
                                        className="bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none dark:text-gray-400 appearance-none cursor-pointer hover:bg-white dark:hover:bg-gray-900 transition-colors"
                                    >
                                        <option value="">UNCATEGORIZED</option>
                                        {categories?.map((c: Doc<"categories">) => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-50 dark:divide-gray-900 max-h-[450px] overflow-y-auto custom-scrollbar">
                                {researchTopics?.map((topic: Doc<"researchTopics">) => (
                                    <motion.div
                                        layout
                                        key={topic._id}
                                        className="p-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-all group"
                                    >
                                        <div className="flex-1 pr-6 space-y-2">
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-200 leading-snug font-serif tracking-tight group-hover:translate-x-1 transition-transform">{topic.topic}</p>
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                                    topic.status === "processed"
                                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                                                        : "bg-zinc-100/50 text-zinc-400 dark:bg-gray-900 dark:text-zinc-600"
                                                )}>
                                                    {topic.status === "processed" ? "ARCHIVED" : "QUEUED"}
                                                </div>
                                                {topic.categoryId && categories && (
                                                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400/60 uppercase tracking-[0.1em]">
                                                        {categories.find((c: Doc<"categories">) => c._id === topic.categoryId)?.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                            <button
                                                onClick={() => handleRunResearch(topic.topic)}
                                                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 text-zinc-400 hover:text-emerald-500 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:scale-110"
                                                title="Process Immediate"
                                            >
                                                <Sparkles size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteResearchTopic({ id: topic._id })}
                                                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 text-zinc-400 hover:text-red-500 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:scale-110"
                                                title="Remove Signal"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                                {researchTopics?.length === 0 && (
                                    <div className="p-12 text-center text-zinc-400 space-y-2">
                                        <Bot className="mx-auto opacity-20" size={32} />
                                        <p className="text-[10px] uppercase font-black tracking-widest">No Intelligence Queued</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-serif font-black text-zinc-900 dark:text-white tracking-tight italic">Autonomous Rhythms</h2>
                                <p className="text-[10px] text-zinc-400 uppercase font-black tracking-[0.2em]">Global content pulses & heartbeats</p>
                            </div>
                            <button
                                onClick={() => setIsAddingSchedule(true)}
                                className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-zinc-950/10 dark:shadow-white/5 group"
                            >
                                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence>
                                {isAddingSchedule && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="relative group/modal overflow-hidden p-[1px] rounded-[2rem] bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 shadow-2xl"
                                    >
                                        <div className="bg-white dark:bg-gray-950 p-8 rounded-[1.95rem] space-y-8">
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 leading-none">Temporal Window</label>
                                                    <div className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900 text-[10px] font-bold text-zinc-500">Weekly Cycle</div>
                                                </div>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {days.map((day, i) => (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = scheduleFormData.daysOfWeek;
                                                                if (current.includes(i)) {
                                                                    setScheduleFormData(prev => ({ ...prev, daysOfWeek: current.filter(d => d !== i) }));
                                                                } else {
                                                                    setScheduleFormData(prev => ({ ...prev, daysOfWeek: [...current, i].sort() }));
                                                                }
                                                            }}
                                                            className={cn(
                                                                "relative w-12 h-12 rounded-xl text-[11px] font-black uppercase transition-all border overflow-hidden",
                                                                scheduleFormData.daysOfWeek.includes(i)
                                                                    ? 'bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white border-zinc-900 shadow-lg scale-105'
                                                                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                                            )}
                                                        >
                                                            {day.charAt(0)}
                                                            {scheduleFormData.daysOfWeek.includes(i) && (
                                                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-current rounded-full" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-zinc-50 dark:border-zinc-900">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Trigger Time</label>
                                                    <input
                                                        type="time"
                                                        value={scheduleFormData.time}
                                                        onChange={e => setScheduleFormData(prev => ({ ...prev, time: e.target.value }))}
                                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3 font-serif font-black text-xl outline-none focus:ring-2 focus:ring-zinc-900/5 dark:text-white"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Zone</label>
                                                    <select
                                                        value={scheduleFormData.timezone}
                                                        onChange={e => setScheduleFormData(prev => ({ ...prev, timezone: e.target.value }))}
                                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-[1.125rem] text-xs font-black uppercase outline-none dark:text-white appearance-none cursor-pointer"
                                                    >
                                                        {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    onClick={() => {
                                                        setIsAddingSchedule(false);
                                                        setEditingScheduleId(null);
                                                        setScheduleFormData({ daysOfWeek: [1], time: "09:00", timezone: "GMT+1", isActive: true, topicsToResearch: [] });
                                                    }}
                                                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-2xl transition-all"
                                                >
                                                    Abort
                                                </button>
                                                <button
                                                    onClick={handleSaveSchedule}
                                                    className="flex-[2] py-4 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl transition-transform hover:scale-[1.02] active:scale-95"
                                                >
                                                    {editingScheduleId ? "Sync Pulse" : "Initialize Pulse"}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid gap-6">
                                {schedule?.map((item: Doc<"aiSchedule">) => (
                                    <motion.div
                                        layout
                                        key={item._id}
                                        className="bg-white/50 dark:bg-gray-950/40 backdrop-blur-xl p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800/50 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-500"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "w-16 h-16 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 border",
                                                item.isActive
                                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-gray-950 border-transparent shadow-lg shadow-zinc-950/20 dark:shadow-white/10"
                                                    : "bg-gray-50 dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-800"
                                            )}>
                                                <Calendar size={28} strokeWidth={1.5} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-black text-gray-950 dark:text-white text-base tracking-tight italic">
                                                    {(item.daysOfWeek || []).map((d: number) => days[d]).join(" • ")}
                                                </h4>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={12} className="text-zinc-400" />
                                                        <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-400 uppercase tracking-widest">{item.time}</span>
                                                    </div>
                                                    <div className="w-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                                    <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest italic">{item.timezone || 'GMT+1'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleDeleteSchedule(item._id)}
                                                className="p-3 text-zinc-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-90"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingScheduleId(item._id);
                                                    setScheduleFormData({
                                                        daysOfWeek: item.daysOfWeek || [],
                                                        time: item.time,
                                                        timezone: item.timezone || "GMT+1",
                                                        isActive: item.isActive,
                                                        topicsToResearch: item.topicsToResearch || []
                                                    });
                                                    setIsAddingSchedule(true);
                                                }}
                                                className={cn(
                                                    "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    item.isActive
                                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50"
                                                        : "bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-600 border border-gray-100 dark:border-gray-800"
                                                )}
                                            >
                                                {item.isActive ? "Live Pulse" : "Paused"}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
