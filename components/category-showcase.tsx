import Link from "next/link";

const CATEGORIES = [
    {
        name: "Self-Awareness",
        image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=800",
        slug: "self-awareness",
    },
    {
        name: "Relationships",
        image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800",
        slug: "relationships",
    },
    {
        name: "Human Behavior",
        image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800",
        slug: "human-behavior",
    },
    {
        name: "Life Philosophy",
        image: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=800",
        slug: "life-philosophy",
    }
];

export function CategoryShowcase() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 py-10 max-w-7xl mx-auto">
            {CATEGORIES.map((cat) => (
                <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    className="group relative h-64 rounded-2xl overflow-hidden"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url(${cat.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-sky-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute bottom-6 left-6 z-10">
                        <h3 className="text-white font-serif text-2xl font-bold group-hover:translate-x-2 transition-transform duration-300">
                            {cat.name}
                        </h3>
                        <div className="w-0 group-hover:w-full h-0.5 bg-gradient-to-r from-sky-blue to-school-purple transition-all duration-500 mt-2" />
                    </div>
                </Link>
            ))}
        </div>
    );
}
