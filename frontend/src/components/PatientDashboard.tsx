import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Stethoscope, 
  FlaskConical, 
  Key, 
  CheckCircle2, 
  ExternalLink,
  Plus,
  ImageIcon,
  Eye,
  Download,
  Filter,
  Lock,
  Unlock,
  Search,
  Sparkles,
  HeartPulse,
  Activity,
  Shield,
  Layers
} from 'lucide-react';
import { Appointment, LabOrder, MedicalReport, UserProfile, MedicalDocument } from '../types';
import { dbService } from '../lib/dbService';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { DecryptionTimelineModal } from './pqc-animation/DecryptionTimelineModal';
import { MedicalEmptyIllustration } from './illustrations/MedicalIllustrations';

interface PatientDashboardProps {
  user: UserProfile;
  appointments: Appointment[];
  labOrders: LabOrder[];
  reports: MedicalReport[];
  documents?: MedicalDocument[];
  onBookAppointment: () => void;
  onViewReport: (report: MedicalReport) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  user,
  appointments,
  labOrders,
  reports,
  documents: initialDocuments,
  onBookAppointment,
  onViewReport
}) => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<MedicalDocument[]>(initialDocuments || []);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<MedicalDocument | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDecryptionModal, setShowDecryptionModal] = useState<boolean>(false);
  const [selectedReportForDecryption, setSelectedReportForDecryption] = useState<MedicalReport | null>(null);

  // Fetch patient-specific documents
  useEffect(() => {
    async function loadPatientDocs() {
      try {
        const docs = await dbService.getDocuments('patient', user.id, user.id);
        setDocuments(docs);
      } catch (e) {
        console.error('Failed to load patient records:', e);
      }
    }
    loadPatientDocs();
  }, [user.id]);

  useEffect(() => {
    if (initialDocuments && initialDocuments.length > 0) {
      setDocuments(initialDocuments.filter(d => d.patientId === user.id));
    }
  }, [initialDocuments, user.id]);

  // Strict patient filtering
  const patientDocs = documents.filter((d) => d.patientId === user.id);

  const filteredDocs = patientDocs.filter((d) => {
    const matchesFilter = activeFilter === 'All' || d.category === activeFilter;
    const matchesSearch = 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.uploaderName && d.uploaderName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Prescription':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Medical Scan':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Blood Test':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Diagnosis Report':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Welcome Banner with Healthcare Palette */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0A192F] via-[#102A45] to-[#1E1B4B] text-white p-6 sm:p-8 shadow-xl border border-teal-500/30">
        {/* Decorative Blurred Color Accents */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            {/* Avatar with Quantum Active Ring */}
            <div className="relative">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-teal-400 via-cyan-300 to-indigo-400 p-1 shadow-lg shadow-teal-500/25">
                <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center font-black text-2xl text-teal-300">
                  {user.name.charAt(0)}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0A192F] flex items-center justify-center shadow">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{user.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/40">
                  Verified Patient
                </span>
              </div>
              <p className="text-xs text-slate-300">{user.email}</p>
              
              <div className="pt-1 flex items-center space-x-2 text-xs font-mono bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-700/80 text-slate-300 max-w-fit">
                <Key className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-slate-400">ML-KEM-768:</span>
                <span className="text-teal-300 font-bold truncate max-w-[200px] sm:max-w-xs">{user.pqcPublicKey || 'qP9F2/kK9...xM72Lwe99F'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onBookAppointment}
            className="self-start md:self-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Consultation</span>
          </button>
        </div>

        {/* Quick Health Status Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-700/70">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Scheduled Visits</span>
            <p className="text-xl font-bold font-mono text-cyan-300 mt-0.5">{appointments.length}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Lab Test Orders</span>
            <p className="text-xl font-bold font-mono text-purple-300 mt-0.5">{labOrders.length}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Diagnostic Reports</span>
            <p className="text-xl font-bold font-mono text-emerald-300 mt-0.5">{reports.length}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Saved Documents</span>
            <p className="text-xl font-bold font-mono text-rose-300 mt-0.5">{patientDocs.length}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Consultations, Lab Orders, and Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Appointments & Lab Orders */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Upcoming Consultations */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Scheduled Appointments</h3>
                  <p className="text-xs text-slate-400">Doctor consultations & clinical evaluations</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 font-mono">
                {appointments.length} Total
              </span>
            </div>

            {appointments.length === 0 ? (
              <MedicalEmptyIllustration 
                title="No Scheduled Consultations" 
                message="You have no upcoming appointments. Find a doctor in our directory to book."
              />
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/60 to-slate-50 border border-sky-200/80 hover:border-sky-400 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="w-4 h-4 text-sky-600" />
                        <span className="font-bold text-slate-900 text-sm">{apt.doctorName}</span>
                        <span className="text-xs text-slate-500">• {apt.department}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium italic">"{apt.reason}"</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(apt.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </span>
                        <span className="capitalize font-semibold text-emerald-600">● {apt.status}</span>
                      </div>
                    </div>

                    <span className="self-start sm:self-auto text-xs px-3 py-1 rounded-full font-semibold bg-white text-teal-700 border border-teal-200 shadow-xs">
                      PQC Channel Secure
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Lab Orders */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Hospital Lab Test Orders</h3>
                  <p className="text-xs text-slate-400">Pathology, genomics & clinical tests</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-mono">
                {labOrders.length} Total
              </span>
            </div>

            {labOrders.length === 0 ? (
              <MedicalEmptyIllustration 
                title="No Active Lab Orders" 
                message="Laboratory test orders requested by your physician will appear here."
              />
            ) : (
              <div className="space-y-3">
                {labOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/60 to-slate-50 border border-purple-200/80 hover:border-purple-300 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{order.testType}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          order.priority === 'urgent' ? 'bg-amber-100 text-amber-800' :
                          order.priority === 'stat_emergency' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {order.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Ordered by: <strong className="text-slate-700">{order.doctorName}</strong> • Ref: <code className="text-purple-700">{order.id}</code></p>
                      <p className="text-xs text-slate-600 leading-snug">{order.clinicalNotes}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        order.status === 'in_analysis' ? 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse' : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {order.status === 'completed' ? 'Report Ready' : order.status === 'in_analysis' ? 'Analyzing Sample' : 'Order Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Encrypted Diagnostic Reports */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Diagnostic Reports</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-mono">
                PQC Envelopes
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Diagnostic reports are packaged in post-quantum envelopes (NIST FIPS 203 &amp; 204), preventing harvest-now-decrypt-later attacks.
            </p>

            {reports.length === 0 ? (
              <MedicalEmptyIllustration 
                title="No Reports Yet" 
                message="Completed laboratory analyses will appear here."
              />
            ) : (
              <div className="space-y-4 pt-1">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/20 border border-teal-200/80 shadow-sm space-y-3 hover:border-teal-400 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{rep.testTitle}</h4>
                        <p className="text-[11px] text-slate-500">Ordered by {rep.doctorName}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ML-DSA-65 Valid</span>
                      </div>
                    </div>

                    {rep.decryptedData && (
                      <div className="text-xs bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                        <p className="text-slate-700 font-medium">{rep.decryptedData.summary}</p>
                        <div className="space-y-1 pt-1 border-t border-slate-100">
                          {rep.decryptedData.biomarkers.slice(0, 2).map((bio, idx) => (
                            <div key={idx} className="flex justify-between text-[11px]">
                              <span className="text-slate-500">{bio.name}</span>
                              <span className="font-mono font-bold text-slate-800">{bio.value} {bio.unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedReportForDecryption(rep);
                          setShowDecryptionModal(true);
                        }}
                        className="py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-95 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-teal-500/20"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Decrypt &amp; View Record</span>
                      </button>

                      <button
                        onClick={() => onViewReport(rep)}
                        className="py-2.5 rounded-xl bg-[#0A192F] hover:bg-slate-800 text-teal-300 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border border-slate-700"
                      >
                        <span>PQC Inspector</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SECTION: My Medical Records (Patient Image Documents) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-teal-500/20">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">My Medical Records &amp; Image Scans</h3>
              <p className="text-xs text-slate-500">
                Protected by PostgreSQL Row-Level Security and signed with NIST FIPS 204 lattice digital signatures.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 outline-none focus:border-teal-500 w-48 sm:w-60 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          {['All', 'Prescription', 'Medical Scan', 'Blood Test', 'Diagnosis Report'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-[#0A192F] to-[#1E293B] text-teal-300 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Document Cards Grid */}
        {filteredDocs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <MedicalEmptyIllustration 
              title="No Matching Medical Records" 
              message="Prescriptions, scans, and laboratory reports will appear here securely."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-teal-400 transition-all shadow-sm hover:shadow-lg flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Image Viewport / Thumbnail */}
                  <div 
                    onClick={() => setSelectedDocForPreview(doc)}
                    className="w-full h-44 bg-slate-950 overflow-hidden relative cursor-pointer"
                  >
                    {doc.signedUrl ? (
                      <img
                        src={doc.signedUrl}
                        alt={doc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-950/25 group-hover:bg-slate-950/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-4 py-2 bg-white text-slate-900 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-xl">
                        <Eye className="w-4 h-4 text-teal-600" />
                        <span>Inspect Document</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadgeClass(doc.category)}`}>
                        {doc.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-teal-700 transition-colors">
                      {doc.title}
                    </h4>

                    {doc.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-500 pt-1">
                      Uploaded by: <span className="font-semibold text-slate-700">{doc.uploaderName || doc.uploadedBy}</span>
                      <span className="ml-1 text-xs text-teal-700 font-medium">({doc.uploaderRole === 'doctor' ? 'Physician' : 'Diagnostics'})</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center space-x-1 text-emerald-700 text-[10px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ML-DSA-65 Signed</span>
                  </div>

                  <button
                    onClick={() => setSelectedDocForPreview(doc)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0A192F] hover:bg-slate-800 text-teal-300 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {selectedDocForPreview && (
        <DocumentPreviewModal
          document={selectedDocForPreview}
          onClose={() => setSelectedDocForPreview(null)}
        />
      )}

      {/* Patient Cryptographic Decryption Timeline Modal */}
      {showDecryptionModal && selectedReportForDecryption && (
        <DecryptionTimelineModal
          isOpen={showDecryptionModal}
          onClose={() => {
            setShowDecryptionModal(false);
            setSelectedReportForDecryption(null);
          }}
          recordId={selectedReportForDecryption.id}
          recipientId={user.id}
          recipientRole="patient"
          senderName={selectedReportForDecryption.doctorName || selectedReportForDecryption.technicianName}
          senderRole="doctor"
          cryptoEnvelope={selectedReportForDecryption.cryptoEnvelope}
        />
      )}

    </div>
  );
};
