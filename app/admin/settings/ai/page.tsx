"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bot, Save, Loader2, Key, Cpu, Sparkles, Clock, Calendar, Plus, Trash2, RefreshCw, CheckCircle2, Tag } from "lucide-react";
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
        <div className="max-w-4xl space-y-12 pb-20 px-4 md:px-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-zinc-900">AI Operations</h1>
                    <p className="text-zinc-500 mt-1 uppercase text-[10px] font-black tracking-widest hidden md:block">
                        Master your digital ghostwriters & autonomous rhythms.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {settings?.isWriting && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg border border-sky-100 shadow-sm overflow-hidden min-w-[140px]">
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
                        className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl border border-zinc-200 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isRunningJobs ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Run Full Check
                    </button>
                    <button
                        form="ai-config-form"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        Save Config
                    </button>
                </div>
            </div>

            <div className="grid gap-12">
                <form id="ai-config-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 border-b border-zinc-50 pb-6">
                            <div className="p-2.5 bg-zinc-900 text-white rounded-2xl">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Ghostwriter Engine</h3>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase">Configure LLM providers and credentials</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">AI Provider</label>
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
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-bold text-sm outline-none appearance-none cursor-pointer hover:bg-zinc-100 transition-colors"
                                    >
                                        <option value="openai">OpenAI (ChatGPT)</option>
                                        <option value="gemini">Google (Gemini)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">API Secret Key</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                                        <input
                                            type="password"
                                            value={formData.apiKey}
                                            onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                                            placeholder="sk-..."
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-12 pr-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">Preferred Model</label>
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
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-12 pr-4 py-3 font-medium text-sm outline-none appearance-none cursor-pointer hover:bg-zinc-100 transition-colors"
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
                                    className="w-full py-3 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isTestingConnection ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                    Test API Connection
                                </button>

                                <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <div className="flex gap-3 items-center">
                                        <div className={cn("p-2 rounded-xl transition-colors", formData.isActive ? 'bg-green-100 text-green-600' : 'bg-zinc-200 text-zinc-500')}>
                                            <Sparkles size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-zinc-900 leading-tight">Master Switch</span>
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase">System is {formData.isActive ? 'Live' : 'Paused'}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                        className={cn("w-12 h-6 rounded-full transition-all relative", formData.isActive ? 'bg-primary' : 'bg-zinc-300')}
                                    >
                                        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", formData.isActive ? 'left-7' : 'left-1')} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-zinc-50">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">Author&apos;s Digital Twin DNA</label>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase italic">AI learns from your last 3 posts to stay in your voice.</p>
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
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-6 font-serif text-zinc-600 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all hover:bg-zinc-100/50"
                            />
                        </div>
                    </div>
                </form>

                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-serif font-bold text-zinc-900">Strategic Content Lab</h2>
                                <p className="text-[10px] text-zinc-400 mt-1 uppercase font-black tracking-widest">Pending topics for AI Deep-Dives</p>
                            </div>
                            <button
                                onClick={() => handleShuffleTopics(true)}
                                disabled={isShuffling || !formData.apiKey}
                                className="p-2 text-zinc-400 hover:text-sky-500 transition-all hover:rotate-180 duration-500 disabled:opacity-50"
                                title="Full Refresh: Clear and generate new strategic topics"
                            >
                                {isShuffling ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-zinc-50 space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newResearchTopic}
                                        onChange={e => setNewResearchTopic(e.target.value)}
                                        placeholder="Add custom research..."
                                        className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/10"
                                    />
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
                                        className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Tag size={12} className="text-zinc-400" />
                                    <select
                                        value={selectedCategoryId}
                                        onChange={e => setSelectedCategoryId(e.target.value)}
                                        className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none"
                                    >
                                        <option value="">No Category</option>
                                        {categories?.map((c: Doc<"categories">) => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="divide-y divide-zinc-50 max-h-[400px] overflow-y-auto">
                                {researchTopics?.map((topic: Doc<"researchTopics">) => (
                                    <div key={topic._id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
                                        <div className="flex-1 pr-4">
                                            <p className="text-sm font-bold text-zinc-700 leading-tight">{topic.topic}</p>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <div className={cn(
                                                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                                                    topic.status === "processed" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-400"
                                                )}>
                                                    {topic.status === "processed" ? "Written" : "Strategic"}
                                                </div>
                                                {topic.categoryId && categories && (
                                                    <p className="text-[9px] text-primary font-black uppercase tracking-tighter">
                                                        {categories.find((c: Doc<"categories">) => c._id === topic.categoryId)?.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleRunResearch(topic.topic)}
                                                className="p-1.5 text-zinc-400 hover:text-green-600 transition-colors"
                                            >
                                                <Sparkles size={14} />
                                            </button>
                                            <button
                                                onClick={() => deleteResearchTopic({ id: topic._id })}
                                                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-serif font-bold text-zinc-900">Autonomous Rhythms</h2>
                                <p className="text-[10px] text-zinc-400 mt-1 uppercase font-black tracking-widest">Global content pulses & heartbeats</p>
                            </div>
                            <button
                                onClick={() => setIsAddingSchedule(true)}
                                className="p-2 bg-zinc-50 text-zinc-400 rounded-lg hover:text-primary transition-colors border border-zinc-100"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence>
                                {isAddingSchedule && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-white p-6 rounded-3xl border-2 border-primary/20 shadow-xl space-y-6 mb-4">
                                            <div className="space-y-4">
                                                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-400">Target Days</label>
                                                <div className="flex flex-wrap gap-2">
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
                                                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border",
                                                                scheduleFormData.daysOfWeek.includes(i)
                                                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                                                    : 'bg-zinc-50 text-zinc-400 border-zinc-100 hover:bg-zinc-100'
                                                            )}
                                                        >
                                                            {day}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Time</label>
                                                    <input
                                                        type="time"
                                                        value={scheduleFormData.time}
                                                        onChange={e => setScheduleFormData(prev => ({ ...prev, time: e.target.value }))}
                                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Timezone</label>
                                                    <select
                                                        value={scheduleFormData.timezone}
                                                        onChange={e => setScheduleFormData(prev => ({ ...prev, timezone: e.target.value }))}
                                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                                    >
                                                        {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setIsAddingSchedule(false);
                                                        setEditingScheduleId(null);
                                                        setScheduleFormData({ daysOfWeek: [1], time: "09:00", timezone: "GMT+1", isActive: true, topicsToResearch: [] });
                                                    }}
                                                    className="flex-1 py-2 text-[10px] font-black uppercase text-zinc-400 hover:bg-zinc-50 rounded-xl transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveSchedule}
                                                    className="flex-1 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-xl shadow-lg"
                                                >
                                                    {editingScheduleId ? "Update Pulse" : "Activate Pulse"}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-3">
                                {schedule?.map((item: Doc<"aiSchedule">) => (
                                    <div key={item._id} className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                                                item.isActive ? "bg-purple-50 text-purple-600" : "bg-zinc-50 text-zinc-400"
                                            )}>
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-zinc-900 text-sm">
                                                    {(item.daysOfWeek || []).map((d: number) => days[d]).join(", ")}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{item.time}</span>
                                                    <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                                                    <span className="text-[9px] font-bold text-zinc-300 uppercase">{item.timezone || 'GMT+1'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleDeleteSchedule(item._id)}
                                                className="p-2 text-zinc-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
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
                                                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                                                    item.isActive ? "bg-zinc-900 text-white shadow-md" : "bg-zinc-100 text-zinc-400"
                                                )}
                                            >
                                                {item.isActive ? <Clock size={16} /> : <div className="w-2 h-2 bg-zinc-300 rounded-full" />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
