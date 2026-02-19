"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { User, Calendar, MoreVertical, Loader2 } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

export default function UsersPage() {
    const users = useQuery(api.users.listAll);
    const updateRole = useMutation(api.users.updateRole);

    const handleRoleChange = async (userId: Id<"users">, newRole: "admin" | "user") => {
        try {
            await updateRole({ id: userId, role: newRole });
            toast.success(`User updated to ${newRole}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update role. Admin permissions required.");
        }
    };

    if (!users) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse flex flex-col items-center gap-4 text-blue-600">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="text-gray-500 font-medium font-sans">Mapping community...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12 font-sans text-gray-950">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black tracking-tight">Community</h1>
                    <p className="text-gray-500 mt-1 font-medium font-sans">Manage your community, moderators, and permissions.</p>
                </div>
                <div className="px-5 py-2.5 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3 shadow-sm shadow-blue-50">
                    <User size={18} className="text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-[0.15em] text-blue-600">Active Citizens: {users.length}</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Identity</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Protocol Level</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Arrival Date</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Newsletter</th>
                            <th className="px-8 py-5 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-gray-50/50 transition-all duration-300 group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden relative border border-gray-100 shrink-0 group-hover:scale-105 transition-transform duration-500">
                                            {user.profileImage ? (
                                                <Image src={user.profileImage} alt="" fill className="object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-gray-300 bg-gray-50">
                                                    <User size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-serif font-black text-gray-950 leading-tight group-hover:text-blue-600 transition-colors">{user.name}</p>
                                            <p className="text-xs text-gray-400 font-medium mt-0.5">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center justify-center">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user._id, e.target.value as "admin" | "user")}
                                            className={cn(
                                                "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border cursor-pointer outline-none transition-all active:scale-95 shadow-sm",
                                                user.role === "admin"
                                                    ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-purple-100"
                                                    : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                                            )}
                                        >
                                            <option value="user">Citizen</option>
                                            <option value="admin">Architect</option>
                                        </select>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2.5 text-gray-500 text-[13px] font-medium">
                                        <Calendar size={16} className="text-gray-300" />
                                        {format(user.createdAt, "MMM d, yyyy")}
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center justify-center">
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg border",
                                            user.newsletterSubscribed
                                                ? "text-green-600 bg-green-50 border-green-100"
                                                : "text-gray-400 bg-gray-50 border-gray-100"
                                        )}>
                                            {user.newsletterSubscribed ? "Authorized" : "Dormant"}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="p-3 text-gray-300 hover:text-gray-950 hover:bg-white rounded-xl transition-all active:scale-90 border border-transparent hover:border-gray-100 hover:shadow-sm">
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
