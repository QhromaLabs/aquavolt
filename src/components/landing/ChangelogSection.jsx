import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Users, 
  Activity, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';

const ChangelogSection = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const updates = [
    {
      date: 'May 11, 2026',
      title: 'Landlord Experience & Tenant Onboarding Overhaul',
      tag: 'v2.4.0',
      summary: 'A massive leap in user experience with interactive tutorials, smarter onboarding, and atomic infrastructure.',
      highlights: [
        {
          icon: <Cpu className="text-blue-400" />,
          label: 'Interactive Guided Tutorials',
          description: 'Launched a high-fidelity "Punched-Hole" tutorial system. Landlords are now guided through key workflows with immersive, focused highlights that dim the screen to show exactly where to click.'
        },
        {
          icon: <Users className="text-[#1ECF49]" />,
          label: 'Frictionless Tenant Onboarding',
          description: 'Revamped the "Add Tenant" flow. Landlords can now set up full tenant accounts including passwords and phone numbers. Added an intelligent password auto-generator to speed up registration.'
        },
        {
          icon: <Activity className="text-purple-400" />,
          label: 'The Tenants Hub',
          description: 'Rebranded "Properties" to "Tenants Hub". This centralized dashboard now features improved navigation, direct access to tenant settings, and a more intuitive management interface.'
        },
        {
          icon: <Shield className="text-red-400" />,
          label: 'Atomic Edge Infrastructure',
          description: 'Deployed a new Supabase Edge Function to handle tenant creation. This ensures that user auth, profile creation, and unit assignments happen in a single, secure, atomic transaction.'
        }
      ],
      technicalNotes: [
        'Implemented TutorialProvider for global walkthrough state management.',
        'Added dynamic RenderBox tracking for pixel-perfect UI highlighting.',
        'Updated unit status database constraints to support "active" and "vacant" states.',
        'Restructured Landlord Mobile navigation for better z-index layering and branch switching.'
      ]
    }
  ];

  return (
    <section id="changelog" className="relative z-10 py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-[#1ECF49]/10 border border-[#1ECF49]/20 text-[#1ECF49] text-sm font-medium mb-6"
          >
            <Clock size={16} className="mr-2" />
            Product Evolution
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400"
          >
            System <span className="text-[#1ECF49]">Changelog</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-2xl mx-auto text-lg"
          >
            Stay updated with the latest improvements, security patches, and feature rollouts from the Aquavolt engineering team.
          </motion.p>
        </div>

        {/* Updates List */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {updates.map((update, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <div 
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                className={`cursor-pointer rounded-3xl border transition-all duration-500 overflow-hidden ${
                  expandedIndex === idx 
                  ? 'bg-slate-800/80 border-[#1ECF49]/30 shadow-[0_0_50px_-12px_rgba(30,207,73,0.2)]' 
                  : 'bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-800/40'
                }`}
              >
                {/* Collapsed View / Header */}
                <div className="p-8 flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">{update.date}</span>
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-black uppercase border border-blue-500/20">
                        {update.tag}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#1ECF49] transition-colors">
                      {update.title}
                    </h3>
                    <p className="text-slate-400 text-sm italic">
                      {update.summary}
                    </p>
                  </div>
                  <div className={`p-4 rounded-full transition-transform duration-500 ${expandedIndex === idx ? 'bg-[#1ECF49] text-white rotate-180' : 'bg-white/5 text-slate-400'}`}>
                    <ChevronDown size={20} />
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedIndex === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-8 pb-10 border-t border-white/5 pt-8">
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                          {update.highlights.map((item, i) => (
                            <div key={i} className="bg-slate-900/60 p-6 rounded-2xl border border-white/5 hover:border-[#1ECF49]/20 transition-colors">
                              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-4 text-xl shadow-inner border border-white/5">
                                {item.icon}
                              </div>
                              <h4 className="font-bold mb-2 text-white">{item.label}</h4>
                              <p className="text-sm text-slate-400 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Technical Specs */}
                        <div className="bg-black/40 rounded-2xl p-8 border border-white/5">
                          <div className="flex items-center gap-2 mb-6 text-[#1ECF49] font-bold text-xs uppercase tracking-widest">
                            <CheckCircle2 size={16} />
                            Technical Implementation
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                            {update.technicalNotes.map((note, i) => (
                              <div key={i} className="flex items-start gap-3 text-sm group">
                                <ArrowRight size={14} className="mt-1 text-slate-600 group-hover:text-[#1ECF49] transition-colors shrink-0" />
                                <span className="text-slate-300">{note}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-slate-500 text-sm">
            Interested in the technical nitty-gritty? <span className="text-[#1ECF49] cursor-pointer hover:underline">Check our API docs</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ChangelogSection;
