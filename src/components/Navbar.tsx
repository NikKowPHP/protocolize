'use client';

import React, { useState } from 'react';
import Link from "next/link";
import { AuthLinks } from '@/components/AuthLinks';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    const closeMenu = () => setIsOpen(false);

    return (
        <header className="bg-gray-800 text-white p-4 sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-lg font-bold" onClick={closeMenu}>Protocolize</Link>
                
                {/* Desktop Menu */}
                <div className="hidden md:flex space-x-4 items-center">
                    <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                    <Link href="/journal" className="hover:underline">Journal</Link>
                    <Link href="/study" className="hover:underline">Study</Link>
                    <Link href="/analytics" className="hover:underline">Analytics</Link>
                    <Link href="/pricing" className="hover:underline">Pricing</Link>
                    <AuthLinks />
                </div>
                
                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu" className="p-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden pt-4">
                    <div className="flex flex-col space-y-4">
                        <Link href="/dashboard" className="hover:underline block px-2 py-1" onClick={closeMenu}>Dashboard</Link>
                        <Link href="/journal" className="hover:underline block px-2 py-1" onClick={closeMenu}>Journal</Link>
                        <Link href="/study" className="hover:underline block px-2 py-1" onClick={closeMenu}>Study</Link>
                        <Link href="/analytics" className="hover:underline block px-2 py-1" onClick={closeMenu}>Analytics</Link>
                        <Link href="/pricing" className="hover:underline block px-2 py-1" onClick={closeMenu}>Pricing</Link>
                        <div className="border-t border-gray-700 my-2"></div>
                        <div className="px-2 py-1 flex flex-col space-y-4 items-start">
                            <AuthLinks />
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;