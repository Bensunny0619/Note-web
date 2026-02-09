import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors mb-8"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-8">
                    <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-6">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
                            <p className="text-gray-500 dark:text-gray-400">Last updated: February 9, 2026</p>
                        </div>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Information We Collect</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            Homa collects minimal information to provide you with a seamless note-taking experience. This includes:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                            <li>Account information (name, email) for authentication.</li>
                            <li>The contents of your notes, including text, checklists, and attachments.</li>
                            <li>Local storage data to enable offline access and synchronization.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. How We Use Your Data</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            Your data is used exclusively to:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                            <li>Sync your notes across your devices.</li>
                            <li>Provide reminder notifications as per your settings.</li>
                            <li>Improve application performance and resolve bugs.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Data Security</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            We take data security seriously. Homa uses industry-standard encryption to protect your data during transit and at rest. Your notes are stored securely on our servers and locally on your device.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Your Rights</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            You have the right to access, edit, or delete your data at any time. Deleting a note in Homa will remove it from our servers after it is cleared from the Trash.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Contact Us</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us at support@homanotes.com.
                        </p>
                    </section>

                    <div className="pt-8 text-center border-t border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-400 italic">© 2026 Homa. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
