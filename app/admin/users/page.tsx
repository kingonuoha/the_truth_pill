"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { User, Calendar, MoreVertical, Loader2, Shield, UserCircle } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function UsersPage() {
    const { data: session } = useSession();
    const [mounted, setMounted] = useState(false);
    const users = useQuery(api.users.listAllUsers, {
        adminEmail: session?.user?.email ?? ""
    });
    const updateRole = useMutation(api.users.updateUserRole);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    const handleRoleChange = async (userId: Id<"users">, newRole: "admin" | "user") => {
        try {
            await updateRole({
                adminEmail: session?.user?.email ?? "",
                id: userId,
                role: newRole
            });
            toast.success(`User updated to ${newRole}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update role. Admin permissions required.");
        }
    };

    if (!mounted || !users) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] transition-colors duration-500">
                <div className="animate-pulse flex flex-col items-center gap-4 text-blue-600 dark:text-blue-500">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="text-gray-500 dark:text-gray-400 font-medium font-sans">Mapping community...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12 font-sans transition-colors duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black tracking-tight text-gray-950 dark:text-white transition-colors italic">Community</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium font-sans">Manage your community, moderators, and permissions.</p>
                </div>
                <div className="px-5 py-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-900/50 flex items-center gap-3 shadow-sm transition-colors">
                    <User size={18} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-black uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">Active Citizens: {users.length}</span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden overflow-x-auto transition-colors duration-500">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-950/50 border-b border-gray-100 dark:border-gray-800">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Identity</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 text-center">Protocol Level</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Arrival Date</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 text-center">Newsletter</th>
                            <th className="px-8 py-5 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-300 group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden relative border border-gray-100 dark:border-gray-800 shrink-0 group-hover:scale-105 transition-transform duration-500">
                                            {user.profileImage ? (
                                                <Image src={user.profileImage} alt="" fill className="object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-900">
                                                    <UserCircle size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-serif font-black text-gray-950 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight italic">{user.name}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center justify-center">
                                        <div className="relative group/role">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user._id, e.target.value as "admin" | "user")}
                                                className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border cursor-pointer outline-none transition-all active:scale-95 shadow-sm appearance-none min-w-[120px] text-center",
                                                    user.role === "admin"
                                                        ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 shadow-blue-100 dark:shadow-none"
                                                        : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-800 hover:text-blue-600 dark:hover:text-blue-400"
                                                )}
                                            >
                                                <option value="user">Citizen</option>
                                                <option value="admin">Architect</option>
                                            </select>
                                            <Shield size={10} className={cn(
                                                "absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none transition-colors",
                                                user.role === "admin" ? "text-blue-200" : "text-gray-300"
                                            )} />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400 text-[13px] font-medium">
                                        <Calendar size={16} className="text-gray-300 dark:text-gray-600" />
                                        {user.createdAt ? format(user.createdAt, "MMM d, yyyy") : "Unknown Initiation"}
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center justify-center">
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg border transition-colors",
                                            user.newsletterSubscribed
                                                ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-900/50"
                                                : "text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800"
                                        )}>
                                            {user.newsletterSubscribed ? "Authorized" : "Dormant"}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="p-3 text-gray-300 dark:text-gray-600 hover:text-gray-950 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 hover:shadow-sm">
                                        <MoreVertical size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
