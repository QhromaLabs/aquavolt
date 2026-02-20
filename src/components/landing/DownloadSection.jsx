import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, ArrowRight, User, MapPin, Hash, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const DownloadSection = ({ appUrls }) => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        units: '',
        phone: '',
        submeters: ''
    });

    const handleInquirySubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('landlord_inquiries')
                .insert([{
                    name: formData.name,
                    location: formData.location,
                    units: parseInt(formData.units),
                    phone: formData.phone,
                    submeters: parseInt(formData.submeters)
                }]);

            if (error) throw error;

            // Redirect to the new download page (renamed to /apps)
            navigate('/apps');
        } catch (error) {
            console.error('Error submitting inquiry:', error);
            alert('Failed to submit inquiry. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnitsChange = (e) => {
        const val = e.target.value;
        setFormData(prev => ({
            ...prev,
            units: val,
            submeters: prev.submeters === prev.units || prev.submeters === '' ? val : prev.submeters // Sync if it was matching or empty
        }));
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <section id="download" className="py-24 relative z-10 overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/5 skew-y-1 transform origin-bottom-left" />

            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } }
                        }}
                        className="space-y-8"
                    >
                        <motion.div variants={fadeInUp} className="space-y-6">
                            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
                                Access the <br />
                                <span className="text-[#1ECF49]">AquaVolt Experience.</span>
                            </h2>
                            <p className="text-lg text-slate-400">
                                Fill out the form to register your interest and access the official AquaVolt installation files for your property management needs.
                            </p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] shadow-2xl space-y-8"
                            >
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-bold text-white">Landlord Inquiry</h3>
                                    <p className="text-slate-500 text-base">Get started by sharing your property details with us.</p>
                                </div>

                                <form onSubmit={handleInquirySubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                                <User size={14} className="text-blue-500" /> Full Name
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-medium"
                                                placeholder="Enter your name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                                <Phone size={14} className="text-blue-500" /> Call-back Number
                                            </label>
                                            <input
                                                required
                                                type="tel"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-medium"
                                                placeholder="e.g. 0712345678"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                            <MapPin size={14} className="text-blue-500" /> Property Location
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-medium"
                                            placeholder="e.g. Syokimau, Nairobi"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                                <Hash size={14} className="text-[#1ECF49]" /> Number of Units
                                            </label>
                                            <input
                                                required
                                                type="number"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-[#1ECF49] focus:bg-white/10 transition-all font-medium"
                                                placeholder="0"
                                                value={formData.units}
                                                onChange={handleUnitsChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                                <Hash size={14} className="text-[#1ECF49]" /> Submeters Needed
                                            </label>
                                            <input
                                                required
                                                type="number"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-[#1ECF49] focus:bg-white/10 transition-all font-medium"
                                                placeholder="0"
                                                value={formData.submeters}
                                                onChange={(e) => setFormData({ ...formData, submeters: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            disabled={isSubmitting}
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-blue-600 to-[#1ECF49] disabled:from-slate-700 disabled:to-slate-800 text-white px-8 py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-blue-500/20 disabled:shadow-none"
                                        >
                                            {isSubmitting ? 'Processing Lead...' : 'Submit & Access Downloads'} <ArrowRight size={24} />
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-12">
                            <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Multi-Platform
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Lifetime Updates
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500 font-medium col-span-2 md:col-span-1">
                                <ShieldCheck className="w-6 h-6 text-[#1ECF49]" /> Secure & Verified
                            </div>
                        </div>
                    </motion.div>

                    {/* App Screens Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative lg:h-[700px] flex items-center justify-center"
                    >
                        <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-blue-500/10 to-[#1ECF49]/10 rounded-full blur-[100px]" />
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                            className="relative z-20 w-[320px] h-[640px] bg-slate-900 border-[12px] border-slate-800/80 rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
                        >
                            <div className="absolute top-0 inset-x-0 h-6 bg-slate-800/80 rounded-b-xl z-20 w-40 mx-auto" />
                            <div className="w-full h-full bg-slate-900 p-6 space-y-6 pt-16">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="w-10 h-10 bg-slate-800 rounded-2xl" />
                                    <div className="w-24 h-5 bg-slate-800 rounded-full" />
                                </div>
                                <div className="w-full h-48 bg-gradient-to-br from-blue-600 to-[#1ECF49] rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 rounded-full blur-xl" />
                                </div>
                                <div className="space-y-4">
                                    <div className="w-full h-14 bg-white/5 rounded-2xl border border-white/5" />
                                    <div className="w-full h-14 bg-white/5 rounded-2xl border border-white/5" />
                                    <div className="w-full h-14 bg-white/5 rounded-2xl border border-white/5" />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default DownloadSection;
