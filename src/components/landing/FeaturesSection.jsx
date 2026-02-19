import React from 'react';
import { motion } from 'framer-motion';
import { Zap, BarChart3, ShieldCheck, Smartphone, Building2, Users } from 'lucide-react';

const FeaturesSection = () => {
    return (
        <section id="features" className="py-24 relative z-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for Modern Living</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to manage utilities efficiently, packaged in a beautiful interface.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Zap className="w-8 h-8 text-yellow-400" />,
                            title: "Instant Tokens",
                            desc: "Purchase and receive utility tokens instantly via M-Pesa. No delays, 24/7 availability."
                        },
                        {
                            icon: <BarChart3 className="w-8 h-8 text-blue-400" />,
                            title: "Real-time Analytics",
                            desc: "Track consumption patterns, revenue, and expenses with detailed interactive charts."
                        },
                        {
                            icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
                            title: "Secure Payments",
                            desc: "Bank-grade security for all transactions. Your financial data is protected at all times."
                        },
                        {
                            icon: <Smartphone className="w-8 h-8 text-purple-400" />,
                            title: "Mobile First",
                            desc: "Native applications for both tenants and landlords. Manage everything on the go."
                        },
                        {
                            icon: <Building2 className="w-8 h-8 text-pink-400" />,
                            title: "Multi-Property",
                            desc: "Seamlessly manage multiple properties and units from a single dashboard."
                        },
                        {
                            icon: <Users className="w-8 h-8 text-orange-400" />,
                            title: "Tenant Management",
                            desc: "Digital tenant onboarding, automated invoicing, and communication tools."
                        }
                    ].map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group"
                        >
                            <div className="mb-6 p-4 rounded-2xl bg-slate-900/50 w-fit group-hover:scale-110 transition-transform duration-300 border border-white/5">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
