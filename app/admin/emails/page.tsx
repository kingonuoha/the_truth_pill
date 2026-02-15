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
    AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
        if (!confirm("Are you sure you want to delete this log entry?")) return;
        try {
            await deleteEmail({ id });
            toast.success("Log entry deleted");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete log entry");
        }
    };

    const filteredEmails = emails?.filter((email: Doc<"emailQueue">) =>
        email.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.templateName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!emails) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-zinc-900">Email Monitoring</h1>
                    <p className="text-zinc-500 mt-1 uppercase text-[10px] font-black tracking-widest">Track delivery, troubleshoot failures, and manage your communication queue.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search recipient or subject..."
                            className="pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-[260px] transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Tracked", value: stats.total, icon: Mail, color: "text-zinc-600 bg-zinc-100" },
                    { label: "Delivered", value: stats.sent, icon: CheckCircle2, color: "text-green-600 bg-green-100" },
                    { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-600 bg-red-100" },
                    { label: "Queued", value: stats.pending, icon: Clock, color: "text-blue-600 bg-blue-100" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
                        <div className={cn("p-3 rounded-2xl", stat.color)}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
                            <p className="text-xl font-bold text-zinc-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">Recipient</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">Template / Subject</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">Scheduled/Sent</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {filteredEmails?.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 italic">No matching email logs found.</td>
                            </tr>
                        ) : (
                            filteredEmails?.map((email: Doc<"emailQueue">) => (
                                <tr key={email._id} className="hover:bg-zinc-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-zinc-900 leading-tight">{email.recipient}</span>
                                            <span className="text-[10px] text-zinc-400 uppercase font-black mt-0.5">Retries: {email.retries}/3</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col max-w-[300px]">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 w-fit px-2 rounded mb-1">
                                                {email.templateName}
                                            </span>
                                            <span className="text-xs text-zinc-600 font-medium truncate">{email.subject}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {email.status === "sent" && <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />}
                                            {email.status === "failed" && <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />}
                                            {email.status === "pending" && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
                                            {email.status === "sending" && <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce" />}
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                email.status === "sent" ? "text-green-600" :
                                                    email.status === "failed" ? "text-red-600" :
                                                        "text-zinc-500"
                                            )}>
                                                {email.status}
                                            </span>
                                            {email.error && (
                                                <div className="relative group/error">
                                                    <AlertCircle size={14} className="text-red-400 cursor-help" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/error:opacity-100 group-hover/error:visible transition-all z-10">
                                                        {email.error}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                                            <Clock size={12} className="text-zinc-300" />
                                            {format(email.sentAt || email.scheduledFor, "MMM d, HH:mm")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {email.status === "failed" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl flex items-center justify-center transition-all"
                                                    onClick={() => handleRetry(email._id)}
                                                    title="Retry Send"
                                                >
                                                    <RefreshCcw size={14} />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-center transition-all"
                                                onClick={() => handleDelete(email._id)}
                                                title="Delete Log"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
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
