import { Navbar } from "@/components/navbar";

export const metadata = {
    title: "Privacy Policy | The Truth Pill",
    description: "Our commitment to protecting your data and privacy."
};

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-white pb-20">
            <Navbar />

            <div className="max-w-3xl mx-auto px-6 pt-32 pb-12">
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-zinc-900 mb-8">Privacy Policy</h1>

                <div className="prose prose-zinc prose-lg max-w-none font-serif leading-[1.8] text-zinc-600">
                    <p className="text-xl text-zinc-900 font-bold mb-8">
                        Last updated: February 19, 2026
                    </p>

                    <section className="mt-12">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-4">1. Information We Collect</h2>
                        <p>
                            We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or leave a comment. This may include your name, email address, and profile picture.
                        </p>
                    </section>

                    <section className="mt-12">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-4">2. AdSense and Cookies</h2>
                        <p>
                            We use Google AdSense to serve advertisements. Google, as a third-party vendor, uses cookies to serve ads on our site. Google&apos;s use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.
                        </p>
                        <p>
                            Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="text-sky-blue hover:underline">Google Ad Settings</a>.
                        </p>
                    </section>

                    <section className="mt-12">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-4">3. Data Security</h2>
                        <p>
                            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
                        </p>
                    </section>

                    <section className="mt-12">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-4">4. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at privacy@thetruthpill.org.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
