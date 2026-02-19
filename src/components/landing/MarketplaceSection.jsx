import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, MessageSquare, PhoneCall, CheckCircle2 } from 'lucide-react';

const MarketplaceSection = () => {
    return (
        <section id="marketplace" className="py-24 relative z-10 bg-gradient-to-b from-transparent to-blue-900/10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center px-4 py-2 rounded-full bg-[#1ECF49]/10 border border-[#1ECF49]/20 text-[#1ECF49] text-sm font-medium mb-4"
                    >
                        <ShoppingCart size={16} className="mr-2" />
                        Official Hardware Shop
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Get Your Prepaid Submeter</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        High-quality, reliable hardware for your property. Ready for instant integration with the aquaVOLT platform.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row"
                    >
                        <div className="md:w-1/2 relative bg-white/5 flex items-center justify-center p-8">
                            <motion.img
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.5 }}
                                src="/submeter.jpg"
                                alt="FUTURISE DPM16 Prepaid Submeter"
                                className="w-full h-auto object-contain rounded-2xl shadow-lg"
                            />
                            <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Best Seller
                            </div>
                        </div>

                        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">FUTURISE DPM16</h3>
                                    <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-4">Single Phase Prepaid Energy Meter</p>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-4xl font-bold text-white">KSh 6,600</span>
                                        <span className="text-slate-500 text-sm line-through">KSh 7,500</span>
                                    </div>
                                    <div className="inline-flex items-center text-[#1ECF49] text-sm font-semibold bg-[#1ECF49]/10 px-3 py-1 rounded-md">
                                        <Zap size={14} className="mr-1" />
                                        Installation fee: KSh 400
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        The FUTURISE DPM16 is a high-precision single-phase prepaid meter designed for modern property management.
                                        Features include anti-tamper security, easy installation, and full compatibility with the aquaVOLT token system.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <CheckCircle2 size={14} className="text-[#1ECF49]" />
                                            STS Compliant
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <CheckCircle2 size={14} className="text-[#1ECF49]" />
                                            Easy Installation
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <CheckCircle2 size={14} className="text-[#1ECF49]" />
                                            Tamper Detection
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <CheckCircle2 size={14} className="text-[#1ECF49]" />
                                            Reliable & Durable
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                    <a
                                        href="https://wa.me/254725016527?text=Hello%20AquaVolt,%20I'm%20interested%20in%20purchasing%20the%20FUTURISE%20DPM16%20Prepaid%20Submeter."
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 bg-[#1ECF49] hover:bg-[#1ab540] text-white px-6 py-4 rounded-2xl font-bold text-center transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1ECF49]/20 no-underline"
                                    >
                                        <MessageSquare size={20} />
                                        WhatsApp Us
                                    </a>
                                    <a
                                        href="tel:+254725016527"
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-4 rounded-2xl font-bold text-center transition-all flex items-center justify-center gap-2 no-underline"
                                    >
                                        <PhoneCall size={20} />
                                        Call Support
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default MarketplaceSection;
