import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { AccessDeniedView } from './components/AccessDeniedView';
import { AuthModal } from './components/AuthModal';
import { KeyRound } from 'lucide-react';
import { DoctorDirectory } from './components/DoctorDirectory';
import { AppointmentModal } from './components/AppointmentModal';
import { PatientDashboard } from './components/PatientDashboard';
import { DoctorDashboard } from './components/DoctorDashboard';
import { LabAssistantDashboard } from './components/LabAssistantDashboard';
import { MedicalReportsView } from './components/MedicalReportsView';
import { QuantumSecurityDashboard } from './components/QuantumSecurityDashboard';
import { SecureTransmissionVisualizer } from './components/SecureTransmissionVisualizer';
import { AdministratorDashboard } from './components/AdministratorDashboard';

import { Doctor, Appointment, LabOrder, MedicalReport, MedicalDocument, UserRole } from './types';
import { dbService } from './lib/dbService';

function MainApp() {
  const { currentRole, profile, isAuthenticated, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  
  // Dedicated Portal Authentication State
  const [authModalTargetPortal, setAuthModalTargetPortal] = useState<UserRole>('patient');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const handleOpenPortalAuth = (portalRole: UserRole = 'patient') => {
    const target = portalRole || 'patient';
    if (isAuthenticated && profile?.role === target) {
      setActiveTab('dashboard');
    } else {
      setAuthModalTargetPortal(target);
      setShowAuthModal(true);
    }
  };

  // Application Data States
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [docs, apts, orders, reps, medDocs] = await Promise.all([
        dbService.getDoctors(),
        dbService.getAppointments(currentRole, profile?.id || 'pat-001'),
        dbService.getTestOrders(currentRole, profile?.id || 'pat-001'),
        dbService.getLabResults(currentRole, profile?.id || 'pat-001'),
        dbService.getDocuments(currentRole, profile?.id || 'pat-001')
      ]);

      setDoctors(docs);
      setAppointments(apts);
      setLabOrders(orders);
      setReports(reps);
      setDocuments(medDocs);
      setLoading(false);
    }
    loadData();
  }, [currentRole, profile?.id]);

  // Periodic health check for Python backend
  useEffect(() => {
    let mounted = true;
    const checkBackend = async () => {
      const candidates = [
        import.meta.env.VITE_BACKEND_API_URL ? `${import.meta.env.VITE_BACKEND_API_URL}/health` : null,
        'http://127.0.0.1:8001/api/health',
        'http://localhost:8001/api/health'
      ].filter(Boolean) as string[];

      for (const url of candidates) {
        try {
          const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(3000) });
          if (res.ok || res.status === 429) {
            if (mounted) setBackendOnline(true);
            return;
          }
        } catch {
          // try next candidate
        }
      }
      if (mounted) setBackendOnline(false);
    };

    checkBackend();
    const interval = setInterval(checkBackend, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Handlers
  const handleBookDoctor = (doc: Doctor) => {
    setSelectedDoctorForBooking(doc);
  };

  const handleConfirmAppointment = async (aptData: Partial<Appointment>) => {
    const result = await dbService.bookAppointment({
      ...aptData,
      patientId: profile?.id || 'pat-001',
      patientName: profile?.name || 'Ananya Sharma'
    });

    if (result.success && result.data) {
      setAppointments([result.data, ...appointments]);
    }
    setActiveTab('dashboard');
  };

  const handleCreateLabOrder = async (orderData: Partial<LabOrder>) => {
    const result = await dbService.createTestOrder({
      ...orderData,
      doctorId: profile?.id || 'doc-101',
      doctorName: profile?.name || 'Dr. Vikramaditya Sen'
    });

    if (result.success && result.data) {
      setLabOrders([result.data, ...labOrders]);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: LabOrder['status']) => {
    await dbService.updateOrderStatus(orderId, status);
    setLabOrders(
      labOrders.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const handleSubmitReport = async (newReport: MedicalReport) => {
    await dbService.submitLabResult(newReport);
    setReports([newReport, ...reports]);
  };

  const currentUser = profile || {
    id: 'pat-001',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@example.com',
    role: currentRole
  };

  return (
    <div className="min-h-screen animated-gradient-mesh flex flex-col md:flex-row font-sans text-slate-900 relative overflow-x-hidden">
      
      {/* Decorative Ambient Background Orbs */}
      <div className="fixed top-12 left-10 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none animate-float" />
      <div className="fixed top-1/3 right-10 w-[28rem] h-[28rem] rounded-full bg-purple-400/15 blur-3xl pointer-events-none animate-float-reverse" />
      <div className="fixed bottom-10 left-1/4 w-80 h-80 rounded-full bg-teal-400/15 blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-rose-400/10 blur-3xl pointer-events-none animate-float-reverse" />

      {/* Vertical Sidebar Navigation (Left Edge) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        backendOnline={backendOnline}
        onOpenPortalAuth={handleOpenPortalAuth}
      />

      {/* Main Page Area (To the right of sidebar) */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen pt-14 md:pt-0">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Landing Page */}
        {activeTab === 'landing' && (
          <LandingPage
            onOpenPortalAuth={handleOpenPortalAuth}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {/* Doctor Directory */}
        {activeTab === 'doctors' && (
          <DoctorDirectory
            doctors={doctors}
            onBookDoctor={handleBookDoctor}
          />
        )}

        {/* Role-Specific Dashboards with Strict RBAC */}
        {activeTab === 'dashboard' && (
          <>
            {!isAuthenticated && (
              <div className="bg-[#0A192F] text-white p-8 rounded-3xl border border-teal-500/30 text-center max-w-xl mx-auto space-y-4 my-10 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center mx-auto text-teal-300">
                  <KeyRound className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold">Portal Authentication Required</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                  Select your authorized healthcare portal to authenticate with zero-trust post-quantum security credentials.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <button
                    onClick={() => handleOpenPortalAuth('patient')}
                    className="p-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                  >
                    Patient Portal
                  </button>
                  <button
                    onClick={() => handleOpenPortalAuth('doctor')}
                    className="p-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                  >
                    Doctor Portal
                  </button>
                  <button
                    onClick={() => handleOpenPortalAuth('lab_technician')}
                    className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                  >
                    Lab Portal
                  </button>
                </div>
              </div>
            )}

            {isAuthenticated && currentRole === 'patient' && (
              <PatientDashboard
                user={currentUser}
                appointments={appointments.filter((a) => a.patientId === currentUser.id)}
                labOrders={labOrders.filter((o) => o.patientId === currentUser.id)}
                reports={reports.filter((r) => r.patientId === currentUser.id)}
                documents={documents.filter((d) => d.patientId === currentUser.id)}
                onBookAppointment={() => setActiveTab('doctors')}
                onViewReport={() => setActiveTab('reports')}
              />
            )}

            {isAuthenticated && currentRole === 'doctor' && (
              <DoctorDashboard
                user={currentUser}
                appointments={appointments.filter((a) => a.doctorId === currentUser.id)}
                labOrders={labOrders.filter((o) => o.doctorId === currentUser.id)}
                reports={reports.filter((r) => r.doctorId === currentUser.id)}
                documents={documents}
                onCreateLabOrder={handleCreateLabOrder}
                onViewReport={() => setActiveTab('reports')}
              />
            )}

            {isAuthenticated && currentRole === 'lab_technician' && (
              <LabAssistantDashboard
                user={currentUser}
                labOrders={labOrders}
                reports={reports}
                documents={documents}
                onSubmitReport={handleSubmitReport}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            )}

            {isAuthenticated && currentRole === 'admin' && (
              <AdministratorDashboard />
            )}
          </>
        )}

        {/* PQC Reports View (Guarded to Patients & Doctors) */}
        {activeTab === 'reports' && (
          currentRole === 'patient' || currentRole === 'doctor' ? (
            <MedicalReportsView reports={reports} />
          ) : (
            <AccessDeniedView
              currentRole={currentRole}
              requiredRole="Patient or Attending Physician"
              onNavigateHome={() => setActiveTab('dashboard')}
              onSignOut={async () => {
                await signOut();
                handleOpenPortalAuth('patient');
              }}
            />
          )
        )}

        {/* Secure Transmission Path Visualizer */}
        {activeTab === 'visualizer' && (
          <SecureTransmissionVisualizer
            currentRole={currentRole}
            patientId={currentUser.id}
          />
        )}

        {/* Quantum Security Dashboard */}
        {activeTab === 'security' && (
          <QuantumSecurityDashboard backendOnline={backendOnline} />
        )}

        {/* Administrator Defensive Security Intel Console (Guarded to Admins Only) */}
        {activeTab === 'admin' && (
          currentRole === 'admin' ? (
            <AdministratorDashboard />
          ) : (
            <AccessDeniedView
              currentRole={currentRole}
              requiredRole="Security Administrator"
              onNavigateHome={() => setActiveTab('dashboard')}
              onSignOut={async () => {
                await signOut();
                handleOpenPortalAuth('admin');
              }}
            />
          )
        )}

      </main>

      {/* Appointment Booking Modal */}
      {selectedDoctorForBooking && (
        <AppointmentModal
          doctor={selectedDoctorForBooking}
          onClose={() => setSelectedDoctorForBooking(null)}
          onConfirm={handleConfirmAppointment}
        />
      )}

      {/* Three Separate Authenticated Portals Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialPortal={authModalTargetPortal}
        onSuccessRedirect={(role) => {
          setActiveTab('dashboard');
        }}
      />

        {/* Footer */}
        <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 PQC-HEALTH • Quantum-Secure Hospital-to-Laboratory Data Exchange</p>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="text-teal-700 font-bold">NIST FIPS 203 (ML-KEM-768)</span>
              <span>•</span>
              <span className="text-teal-700 font-bold">NIST FIPS 204 (ML-DSA-65)</span>
              <span>•</span>
              <span className="text-slate-600 font-semibold">QpiAI SDK v0.7.5</span>
            </div>
          </div>
        </footer>
      </div>

    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
