"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Mail,
    Clock,
    CheckCircle2,
    XCircle,
    RefreshCcw,
    Trash2,
    Search,
    Loader2,
    AlertCircle,
    Send,
    Zap
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { useState } from "react";

export default function EmailLogsPage() {
    const emails = useQuery(api.emails.getEmailLogs, { limit: 100 });
    const retryEmail = useMutation(api.emails.retryEmail);
    const deleteEmail = useMutation(api.emails.deleteEmail);
    const [searchQuery, setSearchQuery] = useState("");

    const handleRetry = async (id: Id<"emailQueue">) => {
        try {
            await retryEmail({ id });
            toast.success("Email queued for retry");
        } catch (err) {
            console.error(err);
            toast.error("Failed to retry email");
        }
    };

    const handleDelete = async (id: Id<"emailQueue">) => {
        toast("Expunge this transmission log?", {
            action: {
                label: "Confirm",
                onClick: async () => {
                    try {
                        await deleteEmail({ id });
                        toast.success("Log entry deleted");
                    } catch (err) {
                        console.error(err);
                        toast.error("Failed to delete log entry");
                    }
                }
            }
        });
    };

    const filteredEmails = emails?.filter((email: Doc<"emailQueue">) =>
        email.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.templateName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!emails) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse flex flex-col items-center gap-4 text-blue-600">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="text-gray-500 font-medium font-sans">Syncing communications...</p>
                </div>
            </div>
        );
    }

    const stats = {
        total: emails.length,
        sent: emails.filter((e: Doc<"emailQueue">) => e.status === "sent").length,
        failed: emails.filter((e: Doc<"emailQueue">) => e.status === "failed").length,
        pending: emails.filter((e: Doc<"emailQueue">) => e.status === "pending" || e.status === "sending").length,
    };

    return (
        <div className="space-y-10 pb-12 font-sans text-gray-950">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black tracking-tight">Transmissions</h1>
                    <p className="text-gray-500 mt-1 font-medium font-sans">Track delivery, troubleshoot failures, and manage your communication queue.</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search recipient or subject..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium text-sm text-gray-950 placeholder:text-gray-400 shadow-sm"
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Tracked", value: stats.total, icon: Mail, color: "blue" },
                    { label: "Delivered", value: stats.sent, icon: CheckCircle2, color: "green" },
                    { label: "Failed", value: stats.failed, icon: XCircle, color: "red" },
                    { label: "Queued", value: stats.pending, icon: Clock, color: "purple" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5 group hover:border-blue-200 transition-all">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                            stat.color === "blue" ? "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" :
                                stat.color === "green" ? "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white" :
                                    stat.color === "red" ? "bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white" :
                                        "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                        )}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 leading-none mb-1.5">{stat.label}</p>
                            <p className="text-2xl font-serif font-black text-gray-950 leading-none">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Identity</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Protocol</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Pulse Date</th>
                            <th className="px-8 py-5 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredEmails?.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200">
                                            <Zap size={32} />
                                        </div>
                                        <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Zero transmissions matched your query</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredEmails?.map((email: Doc<"emailQueue">) => (
                                <tr key={email._id} className="hover:bg-gray-50/50 transition-all duration-300 group">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-serif font-black text-gray-950 leading-tight group-hover:text-blue-600 transition-colors">{email.recipient}</span>
                                            <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest mt-1">Retry Count: {email.retries}/3</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col max-w-[300px]">
                                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-lg border border-blue-100 mb-1.5">
                                                {email.templateName}
                                            </span>
                                            <span className="text-sm text-gray-600 font-medium truncate italic">&ldquo;{email.subject}&rdquo;</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full",
                                                email.status === "sent" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" :
                                                    email.status === "failed" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" :
                                                        email.status === "pending" || email.status === "sending" ? "bg-blue-500 animate-pulse" :
                                                            "bg-gray-300"
                                            )} />
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.2em]",
                                                email.status === "sent" ? "text-green-600" :
                                                    email.status === "failed" ? "text-red-600" :
                                                        "text-gray-500"
                                            )}>
                                                {email.status}
                                            </span>
                                            {email.error && (
                                                <div className="relative group/error">
                                                    <AlertCircle size={14} className="text-red-400 cursor-help" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-gray-950 text-white text-[10px] rounded-xl opacity-0 invisible group-hover/error:opacity-100 group-hover/error:visible transition-all z-20 shadow-2xl border border-gray-800 pointer-events-none">
                                                        <div className="flex items-center gap-2 mb-2 text-red-400">
                                                            <AlertCircle size={12} />
                                                            <span className="font-black uppercase tracking-widest">Protocol Failure</span>
                                                        </div>
                                                        <p className="font-medium leading-relaxed italic">{email.error}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
                                            <Clock size={16} className="text-gray-300" />
                                            {format(email.sentAt || email.scheduledFor, "MMM d, HH:mm")}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            {email.status === "failed" && (
                                                <button
                                                    className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-100 shadow-sm active:scale-90"
                                                    onClick={() => handleRetry(email._id)}
                                                    title="Retry"
                                                >
                                                    <RefreshCcw size={16} />
                                                </button>
                                            )}
                                            <button
                                                className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-300 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-gray-100 shadow-sm active:scale-90"
                                                onClick={() => handleDelete(email._id)}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
