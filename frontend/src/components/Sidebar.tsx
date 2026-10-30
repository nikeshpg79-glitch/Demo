import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  ShieldCheck,
  Activity, 
  Stethoscope, 
  FileText, 
  Lock, 
  LogIn, 
  LogOut, 
  Database,
  User,
  Radio,
  ShieldAlert,
  Globe,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Server,
  Layers,
  Sparkles,
  FlaskConical,
  UserCheck,
  CheckCircle2,
  KeyRound,
  LucideIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { UserRole } from '../types';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge: string | null;
  color: string;
  description?: string;
  special?: boolean;
}

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  backendOnline: boolean;
  onOpenPortalAuth?: (role?: UserRole) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  backendOnline,
  onOpenPortalAuth
}) => {
  const { t, i18n } = useTranslation();
  const { user, profile, currentRole, signOut, dbConnected, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTargetPortal, setAuthModalTargetPortal] = useState<UserRole>('patient');
  
  // Mobile drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Tablet/Desktop collapsible toggle state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine dynamic backend label (Render deployment or local port)
  const backendLabel = React.useMemo(() => {
    const raw = import.meta.env.VITE_BACKEND_API_URL || '';
    if (raw.includes('onrender.com')) return 'FastAPI (Render)';
    const portMatch = raw.match(/:(\d+)/);
    if (portMatch) return `FastAPI :${portMatch[1]}`;
    return 'FastAPI :8001';
  }, []);

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const openAuthWithPortal = (portal: UserRole) => {
    setAuthModalTargetPortal(portal);
    setAuthModalOpen(true);
  };

  // Dynamic Navigation Items based on the authenticated role
  const getNavItems = (): SidebarNavItem[] => {
    const items: SidebarNavItem[] = [
      {
        id: 'landing',
        label: t('nav.overview'),
        icon: Layers,
        badge: null,
        color: 'text-teal-400'
      },
      {
        id: 'doctors',
        label: t('nav.doctors'),
        icon: Stethoscope,
        badge: null,
        color: 'text-sky-400'
      }
    ];

    // Primary Workspace Tab based on Authoritative Role
    if (currentRole === 'patient') {
      items.push({
        id: 'dashboard',
        label: 'My Patient Portal',
        icon: Activity,
        badge: 'PAT',
        color: 'text-teal-400'
      });
      items.push({
        id: 'reports',
        label: t('nav.reports'),
        icon: FileText,
        badge: 'PQC',
        color: 'text-emerald-400'
      });
    } else if (currentRole === 'doctor') {
      items.push({
        id: 'dashboard',
        label: 'Doctor Workspace',
        icon: Stethoscope,
        badge: 'MD',
        color: 'text-sky-400'
      });
    } else if (currentRole === 'lab_technician') {
      items.push({
        id: 'dashboard',
        label: 'Laboratory Pipeline',
        icon: FlaskConical,
        badge: 'LAB',
        color: 'text-purple-400'
      });
    } else if (currentRole === 'admin') {
      items.push({
        id: 'dashboard',
        label: 'CISO Security Console',
        icon: ShieldAlert,
        badge: 'CISO',
        color: 'text-rose-400'
      });
    } else {
      // Unauthenticated
      items.push({
        id: 'dashboard',
        label: 'Select Portal',
        icon: KeyRound,
        badge: 'LOGIN',
        color: 'text-amber-400'
      });
    }

    // Common Monitoring & Security Consoles
    items.push({
      id: 'visualizer',
      label: t('nav.visualizer'),
      icon: Radio,
      badge: 'NIST',
      color: 'text-cyan-400',
      description: 'Cryptographic Transmission Path Visualizer'
    });

    items.push({
      id: 'security',
      label: t('nav.security'),
      icon: Lock,
      badge: 'PQC',
      color: 'text-teal-400'
    });

    // Admin Console only visible to Administrators
    if (currentRole === 'admin') {
      items.push({
        id: 'admin',
        label: t('nav.admin'),
        icon: ShieldAlert,
        badge: 'INTEL',
        color: 'text-rose-400',
        special: true
      });
    }

    return items;
  };

  const navItems = getNavItems();

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileOpen(false);
  };

  // Content of the sidebar
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0A192F] text-white border-r border-[#1E293B] select-none">
      
      {/* 1. Header & Brand */}
      <div className="p-4 border-b border-[#1E293B] shrink-0">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer group min-w-0"
            onClick={() => handleNavClick('landing')}
            title="PQC-HEALTH Overview"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Shield className="w-6 h-6 text-[#0A192F]" />
            </div>
            
            {(!isCollapsed || mobileOpen) && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white block truncate">
                    {t('nav.title')}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    PQC
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium tracking-wide truncate">
                  {t('nav.subtitle')}
                </p>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors md:hidden"
              aria-label="Close navigation sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Desktop/Tablet Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Security Standard Pill */}
        {(!isCollapsed || mobileOpen) && (
          <div className="mt-3 px-2 py-1 rounded-md bg-slate-900/80 border border-teal-500/20 flex items-center justify-between text-[10px] font-mono text-teal-300">
            <span className="flex items-center space-x-1 truncate">
              <Sparkles className="w-3 h-3 text-teal-400 shrink-0" />
              <span>NIST FIPS 203/204</span>
            </span>
            <span className="text-[9px] px-1 rounded bg-teal-500/20 text-teal-300 font-semibold uppercase">
              Quantum-Safe
            </span>
          </div>
        )}
      </div>

      {/* 2. Navigation Items (Scrollable) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={item.description || item.label}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center rounded-xl transition-all relative text-left group cursor-pointer ${
                isCollapsed && !mobileOpen ? 'justify-center p-2.5' : 'px-3 py-2.5 space-x-3'
              } ${
                item.special
                  ? isActive
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/50 shadow-sm'
                    : 'text-rose-300/80 hover:text-rose-100 hover:bg-rose-950/40'
                  : isActive
                  ? 'bg-teal-500/15 text-teal-200 border border-teal-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {/* Active Indicator Bar on left edge */}
              {isActive && (
                <span 
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full ${
                    item.special ? 'bg-rose-400' : 'bg-teal-400'
                  }`} 
                />
              )}

              <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                isActive ? (item.special ? 'text-rose-300' : 'text-teal-300') : item.color
              }`} />

              {(!isCollapsed || mobileOpen) && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <span className={`text-sm tracking-tight truncate ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                      item.special
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Bottom Controls Area (Security Clearance Badge, Language, DB Status, User Auth) */}
      <div className="p-3 border-t border-[#1E293B] space-y-2.5 shrink-0 bg-[#071324]">

        {/* Read-Only Verified Security Clearance Card (Replaces the old arbitrary dropdown) */}
        {(!isCollapsed || mobileOpen) ? (
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Security Clearance</span>
              </span>
              <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                currentRole === 'doctor'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : currentRole === 'lab_technician'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : currentRole === 'admin'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              }`}>
                {currentRole.replace('_', ' ')}
              </span>
            </div>

            <div className="px-1 text-xs">
              <p className="font-bold text-white truncate">
                {profile?.name || 'Unauthenticated Guest'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {profile?.department || profile?.email || 'Select portal to log in'}
              </p>
            </div>

            <div className="pt-1 border-t border-slate-800 text-[9px] font-mono text-teal-400/90 flex items-center justify-between px-1">
              <span>Status:</span>
              <span className="flex items-center space-x-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                <span>NIST PQC Armed</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={`Clearance: ${currentRole.toUpperCase()}`}>
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Language Selector */}
        {(!isCollapsed || mobileOpen) ? (
          <div className="flex items-center bg-slate-900/90 px-2 py-1.5 rounded-xl border border-slate-800">
            <Globe className="w-4 h-4 text-teal-400 mr-2 shrink-0" />
            <select
              aria-label="Language selector"
              value={i18n.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full bg-[#0A192F] text-xs text-teal-300 font-semibold py-1 px-2 rounded-lg border border-teal-500/40 focus:outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        ) : (
          <div className="flex justify-center" title={`Language: ${i18n.language}`}>
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-teal-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Database Live Status Indicator */}
        <div 
          onClick={() => setAuthModalOpen(true)}
          className={`flex items-center rounded-xl text-xs font-mono border cursor-pointer hover:border-teal-500/50 transition-all ${
            isCollapsed && !mobileOpen
              ? 'justify-center p-2 bg-slate-900 border-slate-800'
              : 'px-2.5 py-1.5 justify-between bg-slate-900/90 border-slate-800'
          }`}
          title={dbConnected ? "PostgreSQL & RLS Active" : "Click to view database connection status"}
        >
          <div className="flex items-center space-x-2 min-w-0">
            <Database className={`w-3.5 h-3.5 shrink-0 ${dbConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
            {(!isCollapsed || mobileOpen) && (
              <span className="text-slate-300 text-[11px] truncate">
                {dbConnected ? t('nav.dbConnected') : t('nav.dbPending')}
              </span>
            )}
          </div>
          {(!isCollapsed || mobileOpen) && (
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              dbConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
            }`} />
          )}
        </div>

        {/* Backend API Service Status */}
        {(!isCollapsed || mobileOpen) && (
          <div className="px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center space-x-1.5 truncate">
              <Server className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{backendLabel}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-rose-400'
              }`} />
              <span className={backendOnline ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {backendOnline ? 'LIVE' : 'OFFLINE'}
              </span>
            </span>
          </div>
        )}

        {/* User Authentication Status / Sign In / Sign Out */}
        <div className="pt-1">
          {isAuthenticated && profile ? (
            <div className={`flex items-center ${isCollapsed && !mobileOpen ? 'justify-center' : 'justify-between space-x-2'}`}>
              {(!isCollapsed || mobileOpen) && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white font-semibold truncate">
                    {profile.name}
                  </p>
                  <p className="text-[10px] text-teal-400 truncate">
                    {profile.email}
                  </p>
                </div>
              )}
              <button
                onClick={() => signOut()}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 transition-colors cursor-pointer shrink-0"
                title="Sign Out of Session"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthWithPortal('patient')}
              className={`w-full rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center cursor-pointer ${
                isCollapsed && !mobileOpen ? 'p-2.5' : 'py-2 px-3 space-x-1.5'
              }`}
              title="Sign In to Portal"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {(!isCollapsed || mobileOpen) && <span>Sign In to Portal</span>}
            </button>
          )}
        </div>

      </div>

    </div>
  );

  return (
    <>
      {/* 1. MOBILE TOP HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0A192F] text-white border-b border-[#1E293B] z-30 px-4 flex items-center justify-between shadow-md">
        <div 
          className="flex items-center space-x-2.5 cursor-pointer"
          onClick={() => handleNavClick('landing')}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-teal-300 flex items-center justify-center text-slate-950 font-black shadow-md">
            <Shield className="w-5 h-5 text-[#0A192F]" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block">
              {t('nav.title')}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick role badge */}
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
            {currentRole}
          </span>
          
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. MOBILE SLIDE-OVER DRAWER & BACKDROP */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-[280px] max-w-[85vw] h-full shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* 3. DESKTOP & TABLET FIXED SIDEBAR */}
      <aside 
        className={`hidden md:block fixed top-0 left-0 bottom-0 z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-[268px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Spacer to push main content right */}
      <div 
        className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-[268px]'
        }`} 
        aria-hidden="true"
      />

      {/* Portal Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialPortal={authModalTargetPortal}
        onSuccessRedirect={(role) => {
          onTabChange('dashboard');
        }}
      />
    </>
  );
};
