import React from "react";

const logos = [
    { name: "Psychology Today", icon: "PT" },
    { name: "Scientific American", icon: "SA" },
    { name: "Nature", icon: "NA" },
    { name: "Harvard Review", icon: "HR" },
    { name: "Mindful", icon: "MI" },
];

export function LogoStrip() {
    return (
        <section className="py-12 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <p className="text-center text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-8">
                    Insights trusted by experts at
                </p>
                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    {logos.map((logo) => (
                        <div key={logo.name} className="flex items-center gap-2">
                            <span className="text-2xl font-black text-gray-400 dark:text-gray-600 font-serif">
                                {logo.icon}
                            </span>
                            <span className="text-sm font-semibold text-gray-400 dark:text-gray-600 hidden sm:block">
                                {logo.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
