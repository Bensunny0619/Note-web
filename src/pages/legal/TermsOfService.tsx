import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';

const TermsOfService: React.FC = () => {
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
                            <FileText className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
                            <p className="text-gray-500 dark:text-gray-400">Last updated: February 9, 2026</p>
                        </div>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            By accessing or using Homa, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. Use of Service</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            Homa is designed for personal note-taking. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your devices.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. User Content</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            You retain all rights to the documentation and notes you create within Homa. We do not claim ownership of your content. However, by using the sync feature, you grant us permission to store and transmit your content as necessary to provide the service.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Prohibited Conduct</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            You agree not to use the service for any illegal purposes or to post or transmit any content that is infringing, libelous, or otherwise harmful.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Modifications to Service</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            We reserve the right to modify or discontinue the service at any time with or without notice. We shall not be liable to you or any third party should we exercise such right.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Termination</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever.
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

export default TermsOfService;
