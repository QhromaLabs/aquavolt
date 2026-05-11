import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronLeft,
  Cpu, 
  Users, 
  Activity, 
  Shield, 
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  CreditCard,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../../components/landing/PublicHeader';
import PublicFooter from '../../components/landing/PublicFooter';

const LightningEffect = () => {
    const [bolts, setBolts] = useState([]);
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const id = Math.random();
                const newBolt = {
                    id,
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 50 + '%',
                    scale: 0.5 + Math.random(),
                    rotate: Math.random() * 360
                };
                setBolts(prev => [...prev.slice(-3), newBolt]);
                setTimeout(() => {
                    setBolts(prev => prev.filter(b => b.id !== id));
                }, 150);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <AnimatePresence>
                {bolts.map(bolt => (
                    <motion.div
                        key={bolt.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        className="absolute"
                        style={{
                            left: bolt.left,
                            top: bolt.top,
                            transform: `rotate(${bolt.rotate}deg) scale(${bolt.scale})`
                        }}
                    >
                        <Zap className="text-blue-400 w-12 h-12 blur-[2px]" fill="currentColor" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

const Changelog = () => {
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState(0);

  const updates = [
    {
      date: 'May 11, 2026',
      title: 'Landlord Experience & Tenant Onboarding',
      tag: 'v2.4.0',
      summary: 'Professionalizing the landlord journey with guided tutorials and secure, instant tenant setup.',
      context: 'This update focuses on removing friction for new landlords. We implemented a high-fidelity tutorial system to guide users through the app and moved sensitive tenant creation logic to the backend for maximum security.',
      highlights: [
        {
          icon: <Cpu className="text-blue-400" size={18} />,
          label: 'Interactive Tutorial System',
          description: 'Added a "Punched-Hole" walkthrough system. Landlords are now guided through key features with illuminated highlights that dim the rest of the UI, ensuring they master the platform in minutes.'
        },
        {
          icon: <Users className="text-[#1ECF49]" size={18} />,
          label: 'Revamped Add-Tenant Flow',
          description: 'Reengineered the onboarding form. It now features an automatic password generator with visibility toggles and a optimized field order (Phone -> Email -> Password) for faster entry.'
        },
        {
          icon: <Shield className="text-red-400" size={18} />,
          label: 'Secure Edge Provisioning',
          description: 'Deployed a dedicated Supabase Edge Function to handle tenant creation. This allows landlords to provision accounts securely without exposing administrative keys or losing their own session.'
        },
        {
          icon: <Activity className="text-purple-400" size={18} />,
          label: 'The Tenants Hub Rebrand',
          description: 'Migrated "Properties" into a dedicated "Tenants Hub". This included fixing navigation layering issues and ensuring a smooth transition between management screens.'
        }
      ]
    },
    {
      date: 'May 10, 2026',
      title: 'Financial Intelligence & Dashboard Overhaul',
      tag: 'v2.3.5',
      summary: 'Bringing real-time revenue analytics and automated wallet management to landlords and admins.',
      context: 'This release centers on the financial engine. We redesigned the dashboards to provide immediate clarity on revenue, withdrawals, and unit-level profitability.',
      highlights: [
        {
          icon: <TrendingUp className="text-blue-400" size={18} />,
          label: 'Dynamic Revenue Analytics',
          description: 'The primary dashboard now features time-based revenue filtering (Monthly/Annual) and real-time "Available Balance" tracking for instant withdrawal capability.'
        },
        {
          icon: <LayoutDashboard className="text-[#1ECF49]" size={18} />,
          label: 'Admin Finance Command Center',
          description: 'A complete redesign of the Admin finance view with Recharts integration, providing a granular look at platform-wide revenue trends and landlord activity.'
        },
        {
          icon: <CreditCard className="text-yellow-400" size={18} />,
          label: 'Automated Wallet Ledger',
          description: 'Implemented a robust transaction history system that automatically calculates account balances by subtracting approved withdrawals from total revenue.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-x-hidden selection:bg-[#1ECF49]/20">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] opacity-30" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] opacity-30" />
          <LightningEffect />
      </div>

      <PublicHeader contactInfo={{ phone: '', email: 'support@aquavolt.com' }} />

      <main className="relative z-10 pt-40 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb Navigation */}
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 hover:border-[#1ECF49]/30 transition-all duration-300 mb-12 group backdrop-blur-md shadow-lg"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform text-[#1ECF49]" />
            <span className="text-sm font-semibold tracking-tight">Return to Home</span>
          </motion.button>
          
          {/* Main Title */}
          <div className="mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-[#1ECF49]/10 border border-[#1ECF49]/20 text-[#1ECF49] text-[10px] font-black uppercase tracking-[0.3em] mb-8"
            >
              <Clock size={14} className="mr-2" />
              System Progress
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tighter"
            >
              What's New in <span className="text-[#1ECF49]">Aquavolt.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-xl leading-relaxed max-w-2xl font-light"
            >
              Tracking the evolution of Africa's smartest utility management ecosystem. Detailed logs on security, analytics, and user experience.
            </motion.p>
          </div>

          {/* Updates List */}
          <div className="space-y-8">
            {updates.map((update, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 + 0.3 }}
              >
                <div 
                  className={`rounded-[32px] border transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden ${
                    expandedIndex === idx 
                    ? 'bg-slate-800/60 border-white/20 shadow-2xl scale-[1.01]' 
                    : 'bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60'
                  }`}
                >
                  <div 
                    onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                    className="p-10 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase">
                          {update.date}
                        </span>
                        <div className="h-px w-8 bg-white/10" />
                        <span className="px-2 py-0.5 bg-blue-500 text-white rounded-[4px] text-[10px] font-black uppercase tracking-tighter shadow-lg">
                          {update.tag}
                        </span>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">
                        {update.title}
                      </h3>
                      <p className="text-[#1ECF49] text-sm font-medium tracking-wide">
                        {update.summary}
                      </p>
                    </div>
                    <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-700 ${expandedIndex === idx ? 'bg-[#1ECF49] text-slate-900 rotate-180' : 'bg-white/5 text-slate-500'}`}>
                      <ChevronDown size={24} strokeWidth={2.5} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedIndex === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="px-10 pb-12 border-t border-white/5 pt-10">
                          {/* Context Block */}
                          <div className="mb-10 text-slate-400 text-base leading-relaxed italic border-l-2 border-blue-500/50 pl-6 py-2">
                            {update.context}
                          </div>

                          {/* Highlights List - SIMPLE LIST LAYOUT */}
                          <div className="space-y-8">
                            {update.highlights.map((item, i) => (
                              <div key={i} className="flex gap-6 items-start group">
                                <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center group-hover:border-[#1ECF49]/40 transition-colors">
                                  {item.icon}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-white text-lg mb-1 tracking-tight">{item.label}</h4>
                                  <p className="text-base text-slate-400 leading-relaxed font-light">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <PublicFooter contactInfo={{ phone: '', email: 'support@aquavolt.com' }} />
    </div>
  );
};

export default Changelog;
