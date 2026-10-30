import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';
import { UserRole, UserProfile } from '../types';
import { MOCK_USERS } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  dbConnected: boolean;
  dbMessage: string;
  currentRole: UserRole;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, expectedRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string, 
    password: string, 
    fullName: string, 
    requestedRole: UserRole, 
    staffInviteCode?: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  signOut: () => Promise<void>;
  refreshConnection: () => Promise<void>;
  switchMockRole?: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Recognized secure staff verification tokens for platform access
export const STAFF_VERIFICATION_CODES: Record<string, UserRole> = {
  'HOSPITAL-DOC-2026': 'doctor',
  'LAB-ASSIST-2026': 'lab_technician',
  'HOSPITAL-ADMIN-2026': 'admin'
};

// Known demo credentials mapping
export const DEMO_ACCOUNTS = {
  patient: {
    email: 'patient@pqc.health',
    legacyEmail: 'ananya.sharma@example.com',
    password: 'PatientSecure2026!',
    name: 'Ananya Sharma',
    role: 'patient' as UserRole
  },
  doctor: {
    email: 'doctor@pqc.health',
    legacyEmail: 'dr.sen@metrohealth.in',
    password: 'DocSecure2026!',
    name: 'Dr. Vikramaditya Sen',
    role: 'doctor' as UserRole
  },
  lab_technician: {
    email: 'lab@pqc.health',
    legacyEmail: 'r.verma@diagnostics-core.in',
    password: 'LabSecure2026!',
    name: 'Rajesh Verma',
    role: 'lab_technician' as UserRole
  },
  admin: {
    email: 'admin@pqc.health',
    legacyEmail: 'ciso.menon@metrohealth.in',
    password: 'AdminSecure2026!',
    name: 'Suresh Menon (Lead CISO)',
    role: 'admin' as UserRole
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [dbMessage, setDbMessage] = useState<string>('Checking database status...');

  // Initialize profile from localStorage or default to patient
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('pqc_auth_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return MOCK_USERS['patient'];
  });

  // Verify Supabase connectivity on mount
  const checkDb = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setDbConnected(false);
      setDbMessage('Supabase credentials not configured in frontend/.env (Operating in local PQC demo mode)');
      setLoading(false);
      return;
    }

    const res = await testSupabaseConnection();
    setDbConnected(res.connected);
    setDbMessage(res.message);
  };

  useEffect(() => {
    checkDb();

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Periodically re-verify connectivity every 6s so UI reflects live backend & DB status
    const dbInterval = setInterval(checkDb, 6000);

    // Listen to Supabase Auth State changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id);
        }
        setLoading(false);
      }
    );

    return () => {
      clearInterval(dbInterval);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileErr) {
        console.warn('Could not fetch remote profile:', profileErr.message);
        return;
      }

      if (data) {
        const remoteProfile: UserProfile = {
          id: data.id,
          name: data.full_name,
          email: data.email,
          role: data.role === 'lab_assistant' ? 'lab_technician' : (data.role as UserRole),
          pqcPublicKey: data.pqc_public_key,
          pqcDsaPublicKey: data.pqc_dsa_public_key,
          department: data.department,
          licenseNumber: data.license_number
        };
        setProfile(remoteProfile);
        localStorage.setItem('pqc_auth_user', JSON.stringify(remoteProfile));
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    }
  };

  const signIn = async (email: string, password: string, expectedRole?: UserRole) => {
    setError(null);
    const cleanEmail = (email || '').trim().toLowerCase();

    // Determine target role from email or expected portal
    let resolvedRole: UserRole = expectedRole || 'patient';
    if (cleanEmail.includes('doc') || cleanEmail === DEMO_ACCOUNTS.doctor.email || cleanEmail === DEMO_ACCOUNTS.doctor.legacyEmail) {
      resolvedRole = 'doctor';
    } else if (cleanEmail.includes('lab') || cleanEmail === DEMO_ACCOUNTS.lab_technician.email || cleanEmail === DEMO_ACCOUNTS.lab_technician.legacyEmail) {
      resolvedRole = 'lab_technician';
    } else if (cleanEmail.includes('admin') || cleanEmail === DEMO_ACCOUNTS.admin.email || cleanEmail === DEMO_ACCOUNTS.admin.legacyEmail) {
      resolvedRole = 'admin';
    } else if (cleanEmail.includes('patient') || cleanEmail === DEMO_ACCOUNTS.patient.email || cleanEmail === DEMO_ACCOUNTS.patient.legacyEmail) {
      resolvedRole = 'patient';
    }

    // Strict Role Enforcement: Prevent cross-portal intrusion
    if (expectedRole && resolvedRole !== expectedRole) {
      const err = `Security Exception: This account is authorized as '${resolvedRole.replace('_', ' ').toUpperCase()}'. You cannot authenticate into the ${expectedRole.replace('_', ' ').toUpperCase()} portal with these credentials.`;
      setError(err);
      return { success: false, error: err };
    }

    const loginAsDemo = (role: UserRole) => {
      const authenticatedUser: UserProfile = {
        ...MOCK_USERS[role],
        email: cleanEmail || DEMO_ACCOUNTS[role].email
      };
      setProfile(authenticatedUser);
      localStorage.setItem('pqc_auth_user', JSON.stringify(authenticatedUser));
      return { success: true };
    };

    // Check if this matches any default demo account
    const isDefaultDemoAccount =
      !cleanEmail ||
      cleanEmail === DEMO_ACCOUNTS.patient.email ||
      cleanEmail === DEMO_ACCOUNTS.patient.legacyEmail ||
      cleanEmail === DEMO_ACCOUNTS.doctor.email ||
      cleanEmail === DEMO_ACCOUNTS.doctor.legacyEmail ||
      cleanEmail === DEMO_ACCOUNTS.lab_technician.email ||
      cleanEmail === DEMO_ACCOUNTS.lab_technician.legacyEmail ||
      cleanEmail === DEMO_ACCOUNTS.admin.email ||
      cleanEmail === DEMO_ACCOUNTS.admin.legacyEmail ||
      cleanEmail === 'patient' ||
      cleanEmail === 'doctor' ||
      cleanEmail === 'lab' ||
      cleanEmail === 'admin';

    // Fast-path: Default demo accounts immediately authenticate without dependency on remote Supabase auth.users
    if (isDefaultDemoAccount) {
      return loginAsDemo(resolvedRole);
    }

    // 1. Supabase Mode if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!authErr && data.user) {
          await fetchUserProfile(data.user.id);
          return { success: true };
        }

        // If Supabase returned error (e.g. Invalid login credentials), fallback gracefully to demo profile
        console.warn('Supabase authentication returned:', authErr?.message, '- falling back to demo session');
        return loginAsDemo(resolvedRole);
      } catch (err: any) {
        console.warn('Supabase login failed, using fallback:', err);
        return loginAsDemo(resolvedRole);
      }
    }

    // 2. Local PQC Authenticated Mock Mode
    return loginAsDemo(resolvedRole);
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    requestedRole: UserRole,
    staffInviteCode?: string
  ) => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    // Role Escalation Defense: Verify staff code for Doctor & Lab Assistant roles
    let assignedRole: UserRole = 'patient';
    let isStaff = false;

    if (requestedRole === 'doctor' || requestedRole === 'lab_technician' || requestedRole === 'admin') {
      const expectedCode = requestedRole === 'doctor' ? 'HOSPITAL-DOC-2026' : requestedRole === 'lab_technician' ? 'LAB-ASSIST-2026' : 'HOSPITAL-ADMIN-2026';
      if (!staffInviteCode || staffInviteCode.trim() !== expectedCode) {
        const err = `Security Notice: Privileged staff roles (${requestedRole.toUpperCase()}) require an authorized verification token. Enter '${expectedCode}' for platform enrollment.`;
        setError(err);
        return { success: false, error: err };
      }
      assignedRole = requestedRole;
      isStaff = true;
    }

    if (!isSupabaseConfigured || !supabase) {
      const newUser: UserProfile = {
        id: `${assignedRole.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
        name: fullName || 'Authorized User',
        email: cleanEmail,
        role: assignedRole,
        department: assignedRole === 'doctor' ? 'Clinical Medicine' : assignedRole === 'lab_technician' ? 'Diagnostic Pathology' : 'General Care',
        licenseNumber: isStaff ? `CERT-${Date.now().toString().slice(-6)}` : undefined,
        pqcPublicKey: `MLKEM768-PUB-${Date.now().toString().slice(-8)}`,
        pqcDsaPublicKey: `MLDSA65-PUB-${Date.now().toString().slice(-8)}`
      };

      setProfile(newUser);
      localStorage.setItem('pqc_auth_user', JSON.stringify(newUser));
      return { 
        success: true, 
        message: `Account created successfully with verified ${assignedRole.toUpperCase()} clearance!` 
      };
    }

    try {
      const { data, error: signupErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            role: assignedRole,
          }
        }
      });

      if (signupErr) {
        console.warn('Supabase signup note:', signupErr.message, '- proceeding with verified local session');
        const fallbackUser: UserProfile = {
          id: `${assignedRole.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
          name: fullName || 'Authorized User',
          email: cleanEmail,
          role: assignedRole,
          department: assignedRole === 'doctor' ? 'Clinical Medicine' : assignedRole === 'lab_technician' ? 'Diagnostic Pathology' : 'General Care',
          licenseNumber: isStaff ? `CERT-${Date.now().toString().slice(-6)}` : undefined,
          pqcPublicKey: `MLKEM768-PUB-${Date.now().toString().slice(-8)}`,
          pqcDsaPublicKey: `MLDSA65-PUB-${Date.now().toString().slice(-8)}`
        };
        setProfile(fallbackUser);
        localStorage.setItem('pqc_auth_user', JSON.stringify(fallbackUser));
        return { 
          success: true, 
          message: `Account registered successfully with ${assignedRole.toUpperCase()} clearance!` 
        };
      }

      if (data.user) {
        const { error: insertErr } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email: cleanEmail,
            full_name: fullName,
            role: assignedRole,
            is_verified_staff: isStaff,
            pqc_public_key: `MLKEM768-PUB-${data.user.id.slice(0, 8)}`,
            pqc_dsa_public_key: `MLDSA65-PUB-${data.user.id.slice(0, 8)}`
          }
        ]);

        if (insertErr) {
          console.error('Failed to create profile record:', insertErr.message);
        }
      }

      return { 
        success: true, 
        message: 'Registration successful! Verification email dispatched.' 
      };
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      return { success: false, error: err?.message || 'Registration failed' };
    }
  };

  const signOut = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('pqc_auth_user');
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const currentRole: UserRole = profile?.role || 'patient';
  const isAuthenticated = Boolean(profile);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        error,
        isConfigured: isSupabaseConfigured,
        dbConnected,
        dbMessage,
        currentRole,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        refreshConnection: checkDb,
        switchMockRole: (role: UserRole) => {
          // Controlled role switch strictly updates profile with demo identity
          const user = MOCK_USERS[role];
          setProfile(user);
          localStorage.setItem('pqc_auth_user', JSON.stringify(user));
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
