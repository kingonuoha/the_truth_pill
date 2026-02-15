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
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-serif font-bold text-zinc-900">User Management</h1>
                <p className="text-zinc-500 mt-1 uppercase text-[10px] font-black tracking-widest">Manage community, moderators, and permissions.</p>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">User</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">Role</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">Joined</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">Newsletter</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-zinc-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden relative border border-zinc-100">
                                            {user.profileImage ? (
                                                <Image src={user.profileImage} alt="" fill className="object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-zinc-400 bg-zinc-50">
                                                    <User size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-900 leading-tight">{user.name}</p>
                                            <p className="text-xs text-zinc-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user._id, e.target.value as "admin" | "user")}
                                        className={cn(
                                            "text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-full border cursor-pointer outline-none transition-all",
                                            user.role === "admin"
                                                ? "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100"
                                                : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                                        )}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
                                        <Calendar size={14} className="text-zinc-300" />
                                        {format(user.createdAt, "MMM d, yyyy")}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                        user.newsletterSubscribed ? "text-green-600 bg-green-50" : "text-zinc-300 bg-zinc-50"
                                    )}>
                                        {user.newsletterSubscribed ? "Active" : "None"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors">
                                        <MoreVertical size={16} />
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
