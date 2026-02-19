import React from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle2, ShieldCheck } from 'lucide-react';

const DownloadSection = ({ appUrls }) => {
    return (
        <section id="download" className="py-32 relative z-10 overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 skew-y-3 transform origin-bottom-left" />

            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <h2 className="text-4xl md:text-6xl font-bold leading-tight">
                            Manage your world<br />
                            <span className="text-blue-500">from your pocket.</span>
                        </h2>
                        <p className="text-lg text-slate-300">
                            Download our dedicated mobile apps for a seamless experience. Whether you're a landlord managing properties or a tenant tracking usage, we've got you covered.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 pt-4">
                            {/* Tenant App Button */}
                            <motion.a
                                href={appUrls.tenant}
                                download="AquaVolt_Tenant.apk"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-4 bg-white text-slate-900 px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer"
                            >
                                <Download className="w-8 h-8" />
                                <div className="text-left">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Download For</div>
                                    <div className="text-xl font-bold">Tenants</div>
                                </div>
                            </motion.a>

                            {/* Landlord App Button */}
                            <motion.a
                                href={appUrls.landlord}
                                download="AquaVolt_Landlord.apk"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-4 bg-slate-800 text-white border border-slate-700 px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:bg-slate-700 transition-all cursor-pointer"
                            >
                                <Download className="w-8 h-8" />
                                <div className="text-left">
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Download For</div>
                                    <div className="text-xl font-bold">Landlords</div>
                                </div>
                            </motion.a>
                        </div>

                        <div className="flex items-center justify-center gap-6 pt-8 text-sm text-slate-500 text-center sm:text-left flex-wrap">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> iOS & Android
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free Updates
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-[#1ECF49]" />
                                <span className="text-[#1ECF49] font-semibold">Secure & Verified</span>
                            </div>
                        </div>

                        {/* Security Assurance */}
                        <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Bank-Grade Security</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Our apps are protected with end-to-end encryption and secure authentication.
                                        Your data and payments are always safe with industry-standard security protocols.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* App Screens Visual */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative lg:h-[600px] flex items-center justify-center p-10"
                    >
                        {/* Decorative Circles */}
                        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-[60px]" />

                        {/* Phone Mockup 1 */}
                        <motion.div
                            initial={{ y: 50 }}
                            animate={{ y: [0, -20, 0] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                            className="relative z-20 w-[280px] h-[580px] bg-slate-900 border-[8px] border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl z-20 w-40 mx-auto" />
                            <div className="w-full h-full bg-slate-800 p-4 space-y-4 pt-12">
                                {/* Fake UI */}
                                <div className="flex justify-between items-center">
                                    <div className="w-8 h-8 bg-slate-700 rounded-full" />
                                    <div className="w-20 h-4 bg-slate-700 rounded-full" />
                                </div>
                                <div className="w-full h-40 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl" />
                                <div className="space-y-3">
                                    <div className="w-full h-12 bg-slate-700/50 rounded-xl" />
                                    <div className="w-full h-12 bg-slate-700/50 rounded-xl" />
                                    <div className="w-full h-12 bg-slate-700/50 rounded-xl" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Phone Mockup 2 (Behind) */}
                        <motion.div
                            initial={{ rotate: -10, x: -100 }}
                            className="absolute z-10 w-[260px] h-[540px] bg-slate-900/80 border-[8px] border-slate-800/80 rounded-[3rem] overflow-hidden blur-[1px] -translate-x-32"
                        >
                            <div className="w-full h-full bg-slate-800/80"></div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default DownloadSection;
