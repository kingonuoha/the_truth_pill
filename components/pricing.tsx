import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const plans = [
    {
        name: "Acolyte",
        price: "0",
        description: "For casual readers seeking occasional wisdom.",
        features: ["Access to 5 articles/month", "Weekly newsletter", "Public comments"],
        cta: "Start Reading",
        featured: false,
    },
    {
        name: "Truth Seeker",
        price: "12",
        description: "Our most popular tier for dedicated students.",
        features: [
            "Unlimited article access",
            "Member-only research papers",
            "Audio versions of all articles",
            "Priority community support",
        ],
        cta: "Join the Inner Circle",
        featured: true,
    },
    {
        name: "Sage",
        price: "29",
        description: "For those who demand the full unfiltered truth.",
        features: [
            "Everything in Truth Seeker",
            "Quarterly 1-on-1 sessions",
            "Early access to podcasts",
            "Ad-free experience forever",
        ],
        cta: "Become a Sage",
        featured: false,
    },
];

export function Pricing() {
    return (
        <section className="py-24 bg-white dark:bg-gray-950">
            <div className="max-w-7xl mx-auto px-6 md:px-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-4">
                        Membership Plans
                    </h2>
                    <h3 className="text-4xl md:text-5xl font-serif font-black text-gray-900 dark:text-white mb-6">
                        Invest in your <span className="italic">evolution.</span>
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        Choose the path that fits your current stage of discovery.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={cn(
                                "relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-500 border",
                                plan.featured
                                    ? "bg-blue-600 border-blue-500 shadow-2xl shadow-blue-500/30 scale-105 z-10 text-white py-12"
                                    : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white"
                            )}
                        >
                            {plan.featured && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-blue-600 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                    Most Popular
                                </div>
                            )}
                            <div className="mb-8">
                                <h4 className={cn("text-xl font-bold mb-2", plan.featured ? "text-white" : "text-gray-900 dark:text-white")}>
                                    {plan.name}
                                </h4>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-serif font-black leading-none">${plan.price}</span>
                                    <span className={cn("text-xs font-bold uppercase tracking-widest opacity-60", plan.featured ? "text-blue-100" : "text-gray-500 dark:text-gray-400")}>
                                        / Month
                                    </span>
                                </div>
                                <p className={cn("mt-4 text-sm font-medium", plan.featured ? "text-blue-100" : "text-gray-500 dark:text-gray-400")}>
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-10 flex-grow">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex gap-3 items-center text-sm font-semibold">
                                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", plan.featured ? "bg-white/20" : "bg-blue-600/10 text-blue-600")}>
                                            <Check size={12} className={plan.featured ? "text-white" : "text-blue-600"} />
                                        </div>
                                        <span className={plan.featured ? "text-blue-50" : "text-gray-700 dark:text-gray-300"}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/auth/signup"
                                className={cn(
                                    "w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-center",
                                    plan.featured
                                        ? "bg-white text-blue-600 hover:bg-gray-100 shadow-xl"
                                        : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 shadow-lg"
                                )}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
