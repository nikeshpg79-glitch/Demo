import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  FlaskConical, 
  Users, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Key, 
  FileText,
  ShieldCheck, 
  Send,
  UploadCloud,
  ImageIcon,
  Eye,
  Loader2,
  Trash2,
  Download,
  Filter
} from 'lucide-react';
import { Appointment, LabOrder, MedicalReport, UserProfile, MedicalDocument, DocumentCategory } from '../types';
import { dbService } from '../lib/dbService';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { SecureRecordForm, SecureSendConfirmation, EncryptionPipelineAnimation } from './pqc-animation';

interface DoctorDashboardProps {
  user: UserProfile;
  appointments: Appointment[];
  labOrders: LabOrder[];
  reports: MedicalReport[];
  documents?: MedicalDocument[];
  onCreateLabOrder: (order: Partial<LabOrder>) => void;
  onViewReport: (report: MedicalReport) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  user,
  appointments,
  labOrders,
  reports,
  documents: initialDocuments,
  onCreateLabOrder,
  onViewReport
}) => {
  // Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // Confidential PQC Record Modal States
  const [showDoctorRecordForm, setShowDoctorRecordForm] = useState(false);
  const [showDoctorPreSendPreview, setShowDoctorPreSendPreview] = useState(false);
  const [showDoctorEncryptionModal, setShowDoctorEncryptionModal] = useState(false);
  const [doctorRecordToEncrypt, setDoctorRecordToEncrypt] = useState<any>(null);
  const [targetPatientForRecord, setTargetPatientForRecord] = useState<{ id: string; name: string }>({ id: 'pat-001', name: 'Ananya Sharma' });

  const handleLaunchConfidentialRecordSender = (targetPatientId?: string) => {
    const targetPatient = authorizedPatients.find(p => p.id === (targetPatientId || selectedPatientId)) || { id: 'pat-001', name: 'Ananya Sharma' };
    setTargetPatientForRecord(targetPatient);
    setShowDoctorRecordForm(true);
  };

  const handleDoctorRecordFormSubmit = (formData: any) => {
    setDoctorRecordToEncrypt({
      recipientId: formData.recipientId,
      recipientName: formData.recipientName,
      recordType: formData.recordType,
      recordReference: `REC-PQC-${Date.now().toString().slice(-6)}`,
      payload: {
        summary: formData.diagnosisOrTest,
        clinicalImpression: formData.clinicalNotes,
        biomarkers: formData.biomarkers,
        recommendations: formData.recommendations
      },
      summary: {
        title: formData.recordType,
        itemsCount: formData.biomarkers.length,
        clinicalSummary: `${formData.diagnosisOrTest}. ${formData.clinicalNotes}`
      }
    });
    setShowDoctorRecordForm(false);
    setShowDoctorPreSendPreview(true);
  };

  const handleDoctorConfirmEncrypt = () => {
    setShowDoctorPreSendPreview(false);
    setShowDoctorEncryptionModal(true);
  };

  const handleDoctorEncryptionComplete = (backendData: any) => {
    setUploadSuccess('Confidential record securely encrypted with ML-KEM-768 & transmitted to patient inbox!');
    setTimeout(() => setUploadSuccess(null), 4500);

    if (doctorRecordToEncrypt) {
      const newDoc: MedicalDocument = {
        id: backendData?.record_id || `doc-pqc-${Date.now().toString().slice(-4)}`,
        patientId: doctorRecordToEncrypt.recipientId,
        patientName: doctorRecordToEncrypt.recipientName,
        uploadedBy: user.id,
        uploaderName: user.name,
        uploaderRole: 'doctor',
        category: 'Prescription',
        title: doctorRecordToEncrypt.recordType,
        description: doctorRecordToEncrypt.payload.summary || 'Confidential clinical prescription',
        storagePath: `local/pqc-records/${backendData?.record_id || 'rec'}.enc`,
        fileSize: 4096,
        mimeType: 'application/octet-stream',
        fileHashSha256: backendData?.crypto_envelope?.authTag || 'SHA256_AUTHENTICATED',
        createdAt: new Date().toISOString(),
        isVerified: true,
        signedUrl: '#',
        pqcSignature: backendData?.crypto_envelope?.pqcSignature || 'MLDSA65_VERIFIED',
      };
      setDocuments(prev => [newDoc, ...prev]);
    }
  };
  const [selectedPatientId, setSelectedPatientId] = useState('pat-001');
  const [selectedPatientName, setSelectedPatientName] = useState('Ananya Sharma');
  const [testType, setTestType] = useState('Next-Generation Genomic Sequencing & Oncology Panel');
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'stat_emergency'>('urgent');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [orderCreatedSuccess, setOrderCreatedSuccess] = useState(false);

  // Medical Documents State
  const [documents, setDocuments] = useState<MedicalDocument[]>(initialDocuments || []);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<MedicalDocument | null>(null);
  const [uploadPatientId, setUploadPatientId] = useState<string>('pat-001');
  const [docTitle, setDocTitle] = useState<string>('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('Prescription');
  const [docDescription, setDocDescription] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Load documents
  useEffect(() => {
    async function loadDocs() {
      try {
        const docs = await dbService.getDocuments('doctor', user.id);
        setDocuments(docs);
      } catch (e) {
        console.error('Failed to load documents:', e);
      }
    }
    loadDocs();
  }, [user.id]);

  // Sync if initialDocuments change
  useEffect(() => {
    if (initialDocuments && initialDocuments.length > 0) {
      setDocuments(initialDocuments);
    }
  }, [initialDocuments]);

  // Authorized patients from appointments
  const authorizedPatients = Array.from(
    new Map(
      appointments.map((a) => [a.patientId, { id: a.patientId, name: a.patientName }])
    ).values()
  );
  if (authorizedPatients.length === 0) {
    authorizedPatients.push({ id: 'pat-001', name: 'Ananya Sharma' });
  }

  const testTypes = [
    'Next-Generation Genomic Sequencing & Oncology Panel',
    'Cardiac Troponin I & High-Sensitivity CRP Panel',
    'Comprehensive Metabolic & Renal Profile',
    'Viral Load & Post-Quantum Antigen Marker Screen',
    'Full Coagulation & Hematologic Matrix'
  ];

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateLabOrder({
      patientId: selectedPatientId,
      patientName: selectedPatientName,
      doctorId: user.id,
      doctorName: user.name,
      testType,
      priority,
      clinicalNotes: clinicalNotes || 'Standard clinical diagnostic evaluation with PQC envelope delivery.'
    });
    setOrderCreatedSuccess(true);
    setTimeout(() => {
      setOrderCreatedSuccess(false);
      setShowOrderModal(false);
      setClinicalNotes('');
    }, 1200);
  };

  // File Handling
  const handleFileSelect = (file: File) => {
    // Validate format
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Invalid format. Only JPG, JPEG, PNG, and WEBP image files are supported.');
      return;
    }
    // Validate size (10 MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds the 10 MB maximum size limit.');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);

    if (!docTitle) {
      // Auto-populate clean title from file name
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setDocTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select or drag an image file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress('Validating image header & generating SHA-256 digest...');

    try {
      const targetPatient = authorizedPatients.find(p => p.id === uploadPatientId) || { id: uploadPatientId, name: 'Ananya Sharma' };
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('patient_id', uploadPatientId);
      formData.append('patient_name', targetPatient.name);
      formData.append('uploaded_by', user.id);
      formData.append('uploader_name', user.name);
      formData.append('uploader_role', 'doctor');
      formData.append('title', docTitle || selectedFile.name);
      formData.append('category', docCategory);
      if (docDescription) {
        formData.append('description', docDescription);
      }
      formData.append('sign_with_pqc', 'true');

      setUploadProgress('Computing ML-DSA-65 post-quantum signature (NIST FIPS 204)...');
      
      const res = await dbService.uploadMedicalDocument(formData);
      if (res.success && res.data) {
        setDocuments(prev => [res.data!, ...prev]);
        setUploadSuccess(`Medical document "${res.data.title}" secured and signed!`);
        setSelectedFile(null);
        setFilePreviewUrl(null);
        setDocTitle('');
        setDocDescription('');
        setTimeout(() => setUploadSuccess(null), 4000);
      } else {
        setUploadError(res.error || 'Upload failed. Please check backend connection.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'An unexpected error occurred during upload.');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const filteredDocuments = documents.filter((d) => {
    if (filterCategory === 'All') return true;
    return d.category === filterCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Doctor Header Banner with Clinical Healthcare Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0A192F] via-[#0E345A] to-[#1E293B] text-white p-6 sm:p-8 shadow-xl border border-sky-500/30">
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="relative">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-400 via-teal-300 to-indigo-400 p-1 shadow-lg shadow-sky-500/20">
                <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center font-black text-2xl text-sky-300">
                  <Stethoscope className="w-9 h-9 text-teal-300" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-400 border-2 border-[#0A192F] flex items-center justify-center shadow">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{user.name}</h2>
                <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/40">
                  Attending Physician
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {user.department} • MCI License: <span className="font-mono text-teal-300">{user.licenseNumber || 'MCI-CARDIO-88421'}</span>
              </p>
              <div className="pt-1 flex items-center space-x-2 text-xs font-mono bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-700/80 text-slate-300 max-w-fit">
                <Key className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-slate-400">Doctor ML-KEM-768:</span>
                <span className="text-teal-300 font-bold truncate max-w-[200px] sm:max-w-xs">{user.pqcPublicKey}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => handleLaunchConfidentialRecordSender()}
              className="px-4 py-3 rounded-2xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-400/40 font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer shadow-md shadow-teal-500/10"
            >
              <Send className="w-4 h-4 text-teal-300" />
              <span>Send Confidential Record (PQC)</span>
            </button>
            <button
              onClick={() => setShowOrderModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 hover:from-sky-300 hover:to-emerald-300 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Lab Order</span>
            </button>
          </div>
        </div>

        {/* Clinical Activity Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-700/70">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Assigned Consultations</span>
            <p className="text-xl font-bold font-mono text-sky-300 mt-0.5">{appointments.length}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Dispatched Lab Orders</span>
            <p className="text-xl font-bold font-mono text-purple-300 mt-0.5">{labOrders.length}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Signed Medical Files</span>
            <p className="text-xl font-bold font-mono text-teal-300 mt-0.5">{documents.length}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">PQC Signature Health</span>
            <p className="text-xs font-mono text-emerald-300 mt-2 font-bold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ML-DSA-65 Active</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Consultations & Laboratory Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Authorized Patient Appointments */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-lg text-slate-900">Assigned Patient Consultations</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">{appointments.length} Active</span>
          </div>

          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 transition-all flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{apt.patientName}</span>
                    <span className="text-xs font-mono text-slate-400">({apt.patientId})</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug font-medium">"{apt.reason}"</p>
                  <p className="text-[11px] text-slate-400">
                    Scheduled: {new Date(apt.scheduledFor).toLocaleDateString()} at 10:30 AM
                  </p>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Confirmed
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleLaunchConfidentialRecordSender(apt.patientId)}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center space-x-1 cursor-pointer"
                      title="Send confidential encrypted prescription/clinical note"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Send Record</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPatientId(apt.patientId);
                        setSelectedPatientName(apt.patientName);
                        setShowOrderModal(true);
                      }}
                      className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Order Test</span>
                    </button>
                    <button
                      onClick={() => {
                        setUploadPatientId(apt.patientId);
                        const uploadElem = document.getElementById('doctor-doc-upload-section');
                        if (uploadElem) uploadElem.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Add File</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Lab Orders Created by this Doctor */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-lg text-slate-900">Hospital Lab Pipeline</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">{labOrders.length} Orders</span>
          </div>

          <div className="space-y-3">
            {labOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 transition-all flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{order.testType}</h4>
                    <p className="text-xs text-slate-500">Patient: {order.patientName} • Priority: <span className="font-semibold uppercase text-purple-700">{order.priority}</span></p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                    order.status === 'in_analysis' ? 'bg-blue-100 text-blue-800 animate-pulse' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                  {order.clinicalNotes}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECTION: Medical Documents & Upload Records */}
      <div id="doctor-doc-upload-section" className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 border border-teal-500/20 flex items-center justify-center font-bold">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Medical Documents &amp; Scans</h3>
              <p className="text-xs text-slate-500">
                Upload prescriptions, imaging, and lab scans with SHA-256 integrity and ML-DSA-65 post-quantum signing.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>NIST FIPS 204 Lattice Signing Active</span>
          </div>
        </div>

        {/* Upload Form and Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Upload Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-teal-600" />
              <span>Upload Patient File</span>
            </h4>

            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 animate-fade-in">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadDocument} className="space-y-4">
              {/* Patient Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Patient
                </label>
                <select
                  value={uploadPatientId}
                  onChange={(e) => setUploadPatientId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 focus:border-teal-500 text-xs text-slate-800 outline-none"
                >
                  {authorizedPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag & Drop File Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Medical Image File (JPG, PNG, WEBP &lt; 10MB)
                </label>

                {!filePreviewUrl ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                      isDragOver
                        ? 'border-teal-500 bg-teal-50/50'
                        : 'border-slate-300 hover:border-teal-400 bg-white'
                    }`}
                    onClick={() => {
                      const input = document.getElementById('doctor-file-input');
                      if (input) input.click();
                    }}
                  >
                    <input
                      id="doctor-file-input"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                    <UploadCloud className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      Drag &amp; drop medical scan or prescription
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">or click to browse local files</p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white p-2">
                    <div className="relative group">
                      <img
                        src={filePreviewUrl}
                        alt="Preview"
                        className="w-full h-40 object-contain rounded-xl bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreviewUrl(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md transition-all cursor-pointer"
                        title="Remove selected file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 px-1 flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold truncate max-w-[200px]">{selectedFile?.name}</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {selectedFile ? (selectedFile.size / 1024).toFixed(0) + ' KB' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. Echo Cardiogram Scan"
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 focus:border-teal-500 text-xs text-slate-800 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 focus:border-teal-500 text-xs text-slate-800 outline-none"
                  >
                    <option value="Prescription">Prescription</option>
                    <option value="Medical Scan">Medical Scan</option>
                    <option value="Blood Test">Blood Test</option>
                    <option value="Diagnosis Report">Diagnosis Report</option>
                    <option value="Referral">Referral</option>
                    <option value="Other Medical Document">Other Medical Document</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Remarks (Optional)
                </label>
                <textarea
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  placeholder="Clinical notes, dosage instructions, or scan impressions..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 focus:border-teal-500 text-xs text-slate-800 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{uploadProgress || 'Securing document...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Upload &amp; Post-Quantum Sign Record</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Uploaded Documents List & Viewer (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Authorized Patient Records ({filteredDocuments.length})</span>
              </h4>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1 overflow-x-auto text-xs">
                {['All', 'Prescription', 'Medical Scan', 'Blood Test'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
                      filterCategory === cat
                        ? 'bg-[#0A192F] text-teal-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No medical documents in this view.</p>
                <p className="text-[11px] text-slate-400">Upload a scan or prescription on the left to secure it.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[560px] overflow-y-auto pr-1">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 transition-all shadow-sm flex flex-col justify-between space-y-3 group"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div 
                        onClick={() => setSelectedDocForPreview(doc)}
                        className="w-full h-32 rounded-xl bg-slate-950 overflow-hidden relative cursor-pointer group-hover:opacity-95 transition-opacity"
                      >
                        {doc.signedUrl ? (
                          <img
                            src={doc.signedUrl}
                            alt={doc.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-500">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-900 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span>Preview</span>
                          </span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-teal-50 text-teal-700 border border-teal-200">
                            {doc.category}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-900 text-sm line-clamp-1 mt-1">
                          {doc.title}
                        </h5>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          Patient: <span className="font-semibold text-slate-700">{doc.patientName || doc.patientId}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-emerald-600 text-[10px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>ML-DSA-65 Signed</span>
                      </div>
                      <button
                        onClick={() => setSelectedDocForPreview(doc)}
                        className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Completed PQC Medical Reports Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-lg text-slate-900">Completed Diagnostic Reports (PQC Envelopes)</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/20 border border-teal-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{rep.testTitle}</h4>
                  <p className="text-xs text-slate-500">Patient: {rep.patientName} • Signed by: {rep.technicianName}</p>
                </div>
                <div className="flex items-center space-x-1 text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full text-xs font-bold border border-teal-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Verified</span>
                </div>
              </div>

              {rep.decryptedData && (
                <div className="text-xs bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-slate-800 font-medium">{rep.decryptedData.summary}</p>
                  <p className="text-slate-500 text-[11px]">Impression: {rep.decryptedData.clinicalImpression}</p>
                </div>
              )}

              <button
                onClick={() => onViewReport(rep)}
                className="w-full py-2 rounded-xl bg-[#0A192F] hover:bg-slate-800 text-teal-300 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <span>Inspect Post-Quantum Envelope</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Preview for Medical Document */}
      {selectedDocForPreview && (
        <DocumentPreviewModal
          document={selectedDocForPreview}
          onClose={() => setSelectedDocForPreview(null)}
        />
      )}

      {/* 1. Doctor Confidential Medical Record Form Modal */}
      {showDoctorRecordForm && (
        <SecureRecordForm
          isOpen={showDoctorRecordForm}
          onClose={() => setShowDoctorRecordForm(false)}
          onSubmitForPreview={handleDoctorRecordFormSubmit}
          senderRole="doctor"
          currentUser={user}
          authorizedPatients={authorizedPatients.length > 0 ? authorizedPatients : [{ id: 'pat-001', name: 'Ananya Sharma' }]}
          initialData={{
            recipientId: targetPatientForRecord.id,
            recipientName: targetPatientForRecord.name
          }}
        />
      )}

      {/* 2. Doctor Pre-Send Cryptographic Preview Confirmation */}
      {showDoctorPreSendPreview && doctorRecordToEncrypt && (
        <SecureSendConfirmation
          isOpen={showDoctorPreSendPreview}
          onClose={() => setShowDoctorPreSendPreview(false)}
          onConfirm={handleDoctorConfirmEncrypt}
          senderName={user.name}
          senderRole="doctor"
          senderDepartment="Physician Clinical Medicine"
          recipientName={doctorRecordToEncrypt.recipientName}
          recipientId={doctorRecordToEncrypt.recipientId}
          recordType={doctorRecordToEncrypt.recordType}
          recordReference={doctorRecordToEncrypt.recordReference}
          payloadSummary={doctorRecordToEncrypt.summary}
        />
      )}

      {/* 3. Live Post-Quantum Encryption Pipeline Modal */}
      {showDoctorEncryptionModal && doctorRecordToEncrypt && (
        <EncryptionPipelineAnimation
          isOpen={showDoctorEncryptionModal}
          onClose={() => setShowDoctorEncryptionModal(false)}
          senderId={user.id}
          senderName={user.name}
          senderRole="doctor"
          recipientId={doctorRecordToEncrypt.recipientId}
          recipientName={doctorRecordToEncrypt.recipientName}
          recordType={doctorRecordToEncrypt.recordType}
          payload={doctorRecordToEncrypt.payload}
          onComplete={handleDoctorEncryptionComplete}
        />
      )}

      {/* Create Lab Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100">
            {orderCreatedSuccess ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-bold text-slate-900">Lab Order Dispatched!</h3>
                <p className="text-xs text-slate-600">The test request is now queued at the laboratory with cryptographic integrity markers.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateOrder} className="space-y-5">
                <div>
                  <div className="flex items-center space-x-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
                    <FlaskConical className="w-4 h-4" />
                    <span>Hospital Requisition</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#0A192F]">Issue Diagnostic Lab Order</h3>
                  <p className="text-xs text-slate-500">Patient: <strong>{selectedPatientName}</strong> ({selectedPatientId})</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Diagnostic Test Panel
                  </label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-500 text-xs text-slate-800 outline-none"
                  >
                    {testTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Clinical Priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['routine', 'urgent', 'stat_emergency'] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`py-2 text-xs font-semibold rounded-xl border capitalize transition-all cursor-pointer ${
                          priority === p
                            ? 'bg-[#0A192F] text-teal-300 border-[#0A192F]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {p.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Clinical Instructions &amp; Diagnostic Hypotheses
                  </label>
                  <textarea
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Specify target biomarkers, patient fasting status, or differential diagnoses..."
                    rows={3}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-500 text-xs text-slate-800 outline-none"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    Send to Lab
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
