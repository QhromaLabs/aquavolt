import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone, Mail } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const PublicHeader = ({ contactInfo = { phone: '', email: 'support@aquavolt.com' } }) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuVariants = {
        closed: {
            x: "100%",
            transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
        },
        open: {
            x: 0,
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
        }
    };

    const navLinks = [
        { name: 'Features', href: '/#features' },
        { name: 'Hardware', href: '/#marketplace' },
        { name: 'Apps', href: '/apps' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/#contact' }
    ];

    return (
        <motion.nav
            className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b border-white/10"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/logowhite.png" alt="AquaVolt" className="h-10 w-auto" />
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            {navLinks.map((item) => (
                                item.href.startsWith('/#') ? (
                                    <a key={item.name} href={item.href} className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300 no-underline">
                                        {item.name}
                                    </a>
                                ) : (
                                    <Link key={item.name} to={item.href} className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300 no-underline">
                                        {item.name}
                                    </Link>
                                )
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-[#1ECF49] hover:bg-[#1ab540] text-white px-10 py-3 rounded-full font-bold transition-all duration-300 shadow-lg shadow-[#1ECF49]/20 hover:shadow-[#1ECF49]/40 text-lg no-underline"
                        >
                            Sign In
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="text-[#1ECF49] hover:text-[#1ECF49]/80 transition-colors"
                            style={{ background: 'none', border: 'none', padding: 0 }}
                        >
                            <Menu size={32} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Full Screen Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={menuVariants}
                        className="fixed inset-0 z-[60] flex flex-col md:hidden bg-[#1e3a8a]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 h-20 border-b border-white/10">
                            <img src="/logowhite.png" alt="AquaVolt" className="h-8 w-auto" />
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={24} className="text-white" />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 flex flex-col justify-center items-center space-y-8 px-6">
                            {navLinks.map((item) => (
                                <motion.div key={item.name} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                    {item.href.startsWith('/#') ? (
                                        <a
                                            href={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-3xl font-bold text-white hover:text-[#1ECF49] transition-colors no-underline"
                                        >
                                            {item.name}
                                        </a>
                                    ) : (
                                        <Link
                                            to={item.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-3xl font-bold text-white hover:text-[#1ECF49] transition-colors no-underline"
                                        >
                                            {item.name}
                                        </Link>
                                    )}
                                </motion.div>
                            ))}
                            <button
                                onClick={() => {
                                    navigate('/login');
                                    setIsMenuOpen(false);
                                }}
                                className="mt-8 bg-[#1ECF49] text-white px-10 py-4 rounded-full text-lg font-bold w-full max-w-xs shadow-lg shadow-[#1ECF49]/20 hover:bg-[#1ab540] transition-all no-underline"
                            >
                                Sign In
                            </button>
                        </div>

                        {/* Footer / Contact Info */}
                        <div className="p-8 pb-12 bg-black/20">
                            <div className="flex flex-col items-center space-y-4 text-center">
                                <img src="/logowhite.png" alt="AquaVolt" className="h-8 opacity-70 mb-2" />
                                <div className="flex items-center justify-center space-x-6 w-full">
                                    {contactInfo.phone && (
                                        <a href={`tel:${contactInfo.phone}`} className="flex flex-col items-center gap-2 text-slate-400 hover:text-[#1ECF49] transition-colors no-underline">
                                            <div className="p-3 bg-white/5 rounded-full"><Phone size={20} /></div>
                                            <span className="text-xs">Call Us</span>
                                        </a>
                                    )}
                                    <a href={`mailto:${contactInfo.email}`} className="flex flex-col items-center gap-2 text-slate-400 hover:text-[#1ECF49] transition-colors no-underline">
                                        <div className="p-3 bg-white/5 rounded-full"><Mail size={20} /></div>
                                        <span className="text-xs">Email</span>
                                    </a>
                                </div>
                                <div className="pt-4 text-xs text-slate-600 border-t border-white/5 w-full text-center mt-2">
                                    © 2026 AquaVolt Platform
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default PublicHeader;
