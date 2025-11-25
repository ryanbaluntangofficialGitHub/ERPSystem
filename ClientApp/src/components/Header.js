import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserName, getUserRole } from '../utils/auth';
import i18n, { t, setLanguage, getLanguage } from '../utils/i18n';

export default function Header({ onLogout, onMenuClick }) {
    const navigate = useNavigate();
    const token = localStorage.getItem('erp_token');
    const username = getUserName(token) || 'User';
    const role = getUserRole(token);

    const [open, setOpen] = useState(false);
    const [showPrefs, setShowPrefs] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('erp_theme') || 'light');
    const [lang, setLang] = useState(getLanguage());
    const ref = useRef(null);

    useEffect(() => {
        const onDocClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('erp_theme', theme);
    }, [theme]);

    const handleLogout = () => {
        setOpen(false);
        if (onLogout) onLogout();
    };

    const initials = username.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();

    const changeLang = (l) => {
        setLang(l);
        setLanguage(l);
        window.location.reload();
    };

    return (
        <header className="w-full bg-white border-b p-3 flex items-center justify-between lg:justify-end gap-4">
            {/* Mobile menu button */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* User info and dropdown */}
            <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                    <div className="text-sm text-gray-600">{username}</div>
                    <div className="text-xs text-gray-500">{role}</div>
                </div>

                <div className="relative" ref={ref}>
                    <button
                        onClick={() => setOpen(o => !o)}
                        aria-haspopup="true"
                        aria-expanded={open}
                        className="flex items-center gap-2 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                    >
                        <div className="w-8 h-8 bg-blue-500 rounded-full text-white flex items-center justify-center font-semibold text-sm">{initials}</div>
                        <span className="hidden sm:inline text-sm">{t('account')}</span>
                        <svg className={`w-4 h-4 transition-transform ${open ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-md z-50 animate-fade-in">
                            <button onClick={() => { setOpen(false); navigate('/profile'); }} className="w-full text-left px-4 py-2 hover:bg-gray-100">{t('profile')}</button>
                            <button onClick={() => { setOpen(false); navigate('/profile'); }} className="w-full text-left px-4 py-2 hover:bg-gray-100">{t('changePassword')}</button>
                            <button onClick={() => { setOpen(false); setShowPrefs(true); }} className="w-full text-left px-4 py-2 hover:bg-gray-100">{t('preferences')}</button>
                            <div className="border-t" />
                            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">{t('logout')}</button>
                        </div>
                    )}
                </div>
            </div>

            {showPrefs && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded shadow-lg w-full max-w-md p-4">
                        <h3 className="font-semibold mb-2">{t('preferences')}</h3>
                        <div className="grid gap-2">
                            <div>
                                <label className="block text-sm">{t('theme')}</label>
                                <select value={theme} onChange={e => setTheme(e.target.value)} className="w-full border p-2 rounded">
                                    <option value="light">{t('light')}</option>
                                    <option value="dark">{t('dark')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm">{t('language')}</label>
                                <select value={lang} onChange={e => changeLang(e.target.value)} className="w-full border p-2 rounded">
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end mt-2">
                                <button onClick={() => setShowPrefs(false)} className="px-3 py-1 rounded border">{t('cancel')}</button>
                                <button onClick={() => setShowPrefs(false)} className="px-3 py-1 rounded bg-blue-600 text-white">{t('save')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
