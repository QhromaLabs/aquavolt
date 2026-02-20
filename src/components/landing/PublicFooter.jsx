import React from 'react';
import { Globe, Phone, Mail, ArrowRight, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicFooter = ({ contactInfo = { phone: '', email: 'support@aquavolt.com' } }) => {
    return (
        <footer id="contact" className="relative z-10 bg-gradient-to-b from-[#0F172A] to-[#020617] border-t border-white/5 overflow-hidden">
            {/* Gradient Orb Background */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

            <div className="relative max-w-7xl mx-auto px-6 py-16">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <img src="/logowhite.png" alt="AquaVolt" className="h-10 w-auto" />
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Next-generation property utility management. Automated readings, instant payments, and real-time analytics.
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1ECF49] hover:border-[#1ECF49] transition-all group no-underline">
                                <Globe className="w-4 h-4 text-slate-400 group-hover:text-white" />
                            </a>
                            <a href={`https://wa.me/${contactInfo.phone?.replace('+', '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1ECF49] hover:border-[#1ECF49] transition-all group no-underline">
                                <Phone className="w-4 h-4 text-slate-400 group-hover:text-white" />
                            </a>
                            <a href={`mailto:${contactInfo.email}`} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1ECF49] hover:border-[#1ECF49] transition-all group no-underline">
                                <Mail className="w-4 h-4 text-slate-400 group-hover:text-white" />
                            </a>
                        </div>
                    </div>

                    {/* Product Column */}
                    <div className="space-y-4">
                        <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Product</h3>
                        <ul className="space-y-3">
                            <li><a href="/#features" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group no-underline">
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                Features
                            </a></li>
                            <li><Link to="/apps" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group no-underline">
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                Mobile Apps
                            </Link></li>
                            <li><a href="/#marketplace" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group no-underline">
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                Hardware
                            </a></li>
                            <li><Link to="/demo/landlord" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group no-underline">
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                Live Demo
                            </Link></li>
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div className="space-y-4">
                        <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Company</h3>
                        <ul className="space-y-3">
                            <li><Link to="/about" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group no-underline">
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                About Us
                            </Link></li>
                            <li><a href={`https://wa.me/${contactInfo.phone?.replace('+', '')}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group no-underline">
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                Contact
                            </a></li>
                            <li><Link to="/apps" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group no-underline">
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                Downloads
                            </Link></li>
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div className="space-y-4">
                        <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Support</h3>
                        <ul className="space-y-3">
                            <li><Link to="/help" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group no-underline">
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                Help Center
                            </Link></li>
                            <li><Link to="/privacy" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group no-underline">
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                Privacy Policy
                            </Link></li>
                            <li><Link to="/terms" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group no-underline">
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                Terms of Service
                            </Link></li>
                            <li><a href={`https://wa.me/${contactInfo.phone?.replace('+', '')}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group no-underline">
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                WhatsApp Support
                            </a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        {/* Copyright & Developer Credit */}
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-sm text-slate-500">
                            <span>© 2026 AquaVolt Platform. All rights reserved.</span>
                            <span className="hidden md:block text-slate-700">•</span>
                            <div className="flex items-center gap-2">
                                <span>Built by</span>
                                <a href="https://qhroma.co.ke" target="_blank" rel="noreferrer" className="text-[#1ECF49] font-semibold hover:text-[#1ab540] transition-colors no-underline">Qhroma Labs</a>
                                <span className="text-slate-700">•</span>
                                <span>Nairobi, Kenya</span>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Secure</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                                <span>Fast</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                                <span>Trusted</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default PublicFooter;
