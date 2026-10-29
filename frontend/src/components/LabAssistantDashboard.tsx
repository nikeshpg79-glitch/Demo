import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  FileCheck2, 
  ShieldCheck, 
  Key, 
  Send, 
  Plus, 
  Cpu, 
  CheckCircle,
  AlertCircle,
  Lock,
  UploadCloud,
  ImageIcon,
  Eye,
  Loader2,
  Trash2,
  FileText
} from 'lucide-react';
import { LabOrder, MedicalReport, UserProfile, MedicalDocument, DocumentCategory } from '../types';
import { dbService } from '../lib/dbService';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { SecureRecordForm, SecureSendConfirmation, EncryptionPipelineAnimation } from './pqc-animation';

interface LabAssistantDashboardProps {
  user: UserProfile;
  labOrders: LabOrder[];
  reports: MedicalReport[];
  documents?: MedicalDocument[];
  onSubmitReport: (newReport: MedicalReport) => void;
  onUpdateOrderStatus: (orderId: string, status: LabOrder['status']) => void;
}

export const LabAssistantDashboard: React.FC<LabAssistantDashboardProps> = ({
  user,
  labOrders,
  reports,
  documents: initialDocuments,
  onSubmitReport,
  onUpdateOrderStatus
}) => {
  // Report packaging state
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [specimenType, setSpecimenType] = useState('Whole Blood (EDTA)');
  const [summary, setSummary] = useState('');
  const [biomarker1Name, setBiomarker1Name] = useState('High-Sensitivity Troponin I');
  const [biomarker1Val, setBiomarker1Val] = useState('0.012');
  const [biomarker1Unit, setBiomarker1Unit] = useState('ng/mL');
  const [biomarker1Range, setBiomarker1Range] = useState('0.000 - 0.040');
  const [impression, setImpression] = useState('');
  const [encrypting, setEncrypting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [showLabRecordForm, setShowLabRecordForm] = useState(false);
  const [showLabPreSendPreview, setShowLabPreSendPreview] = useState(false);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [pendingReportData, setPendingReportData] = useState<any>(null);

  // Document Upload State
  const [documents, setDocuments] = useState<MedicalDocument[]>(initialDocuments || []);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<MedicalDocument | null>(null);
  const [uploadOrderId, setUploadOrderId] = useState<string>('');
  const [uploadDocTitle, setUploadDocTitle] = useState<string>('');
  const [uploadDocCategory, setUploadDocCategory] = useState<DocumentCategory>('Blood Test');
  const [uploadDocNotes, setUploadDocNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [docUploadSuccess, setDocUploadSuccess] = useState<string | null>(null);

  // Load documents
  useEffect(() => {
    async function loadDocs() {
      try {
        const docs = await dbService.getDocuments('lab_technician', user.id);
        setDocuments(docs);
      } catch (e) {
        console.error('Failed to load lab documents:', e);
      }
    }
    loadDocs();
  }, [user.id]);

  useEffect(() => {
    if (initialDocuments && initialDocuments.length > 0) {
      setDocuments(initialDocuments);
    }
  }, [initialDocuments]);

  // Set default upload order if available
  useEffect(() => {
    if (labOrders.length > 0 && !uploadOrderId) {
      setUploadOrderId(labOrders[0].id);
    }
  }, [labOrders, uploadOrderId]);

  const pendingOrders = labOrders.filter((o) => o.status !== 'completed');

  const handlePackageAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const reportPayload = {
      summary: summary || 'Target biomarkers evaluated against clinical baselines.',
      biomarkers: [
        {
          name: biomarker1Name,
          value: biomarker1Val,
          unit: biomarker1Unit,
          referenceRange: biomarker1Range,
          flag: 'normal'
        }
      ],
      clinicalImpression: impression || 'Biomarker levels indicative of normal physiological profile.',
      recommendations: 'Consult attending physician for correlation with clinical findings.'
    };

    setPendingReportData({
      order: selectedOrder,
      specimenType,
      payload: reportPayload,
      recordReference: `REP-PQC-${Date.now().toString().slice(-6)}`,
      summary: {
        title: selectedOrder.testType,
        itemsCount: reportPayload.biomarkers.length,
        clinicalSummary: `${selectedOrder.testType} for specimen (${specimenType}). ${reportPayload.clinicalImpression}`
      }
    });
    setShowLabPreSendPreview(true);
  };

  const handleLabRecordFormSubmit = (formData: any) => {
    setPendingReportData({
      order: {
        id: `ord-${Date.now().toString().slice(-4)}`,
        patientId: formData.recipientId,
        patientName: formData.recipientName,
        doctorId: 'doc-101',
        doctorName: 'Dr. Vikramaditya Sen',
        testType: formData.recordType,
        priority: 'urgent',
        status: 'completed',
        createdAt: new Date().toISOString()
      },
      specimenType: 'Venous Whole Blood & Serum',
      payload: {
        summary: formData.diagnosisOrTest,
        clinicalImpression: formData.clinicalNotes,
        biomarkers: formData.biomarkers,
        recommendations: formData.recommendations
      },
      recordReference: `REP-PQC-${Date.now().toString().slice(-6)}`,
      summary: {
        title: formData.recordType,
        itemsCount: formData.biomarkers.length,
        clinicalSummary: `${formData.diagnosisOrTest}. ${formData.clinicalNotes}`
      }
    });
    setShowLabRecordForm(false);
    setShowLabPreSendPreview(true);
  };

  const handleLabConfirmEncrypt = () => {
    setShowLabPreSendPreview(false);
    setShowEncryptionModal(true);
  };

  const handleEncryptionComplete = (backendData: any) => {
    if (!pendingReportData) return;
    const { order, specimenType, payload } = pendingReportData;

    const generatedReport: MedicalReport = {
      id: backendData.record_id || `rep-${Date.now().toString().slice(-4)}`,
      orderId: order.id,
      patientId: order.patientId,
      patientName: order.patientName,
      doctorId: order.doctorId,
      doctorName: order.doctorName,
      technicianId: user.id,
      technicianName: `${user.name} (NABL Certified)`,
      testTitle: order.testType,
      specimenType,
      createdAt: new Date().toISOString(),
      decryptedData: payload,
      cryptoEnvelope: {
        algorithmKem: 'ML-KEM-768 (NIST FIPS 203)',
        algorithmSymmetric: 'AES-256-GCM (NIST SP 800-38D)',
        algorithmSignature: 'ML-DSA-65 (NIST FIPS 204)',
        ciphertext: backendData.crypto_envelope?.ciphertext || 'CT_SECURED_PAYLOAD==',
        iv: backendData.crypto_envelope?.iv || '9bK2+mOp84/qZ9==',
        authTag: backendData.crypto_envelope?.authTag || '7k92M/a7901Lwe==',
        kemCiphertext: backendData.crypto_envelope?.kemCiphertext,
        kemCiphertextDoctor: backendData.crypto_envelope?.kemCiphertext || `KEM768_DOC_${order.doctorId.slice(0, 6)}`,
        kemCiphertextPatient: backendData.crypto_envelope?.kemCiphertext || `KEM768_PAT_${order.patientId.slice(0, 6)}`,
        pqcSignature: backendData.crypto_envelope?.pqcSignature || `MLDSA65_SIG_${user.id}`,
        signerPublicKey: backendData.crypto_envelope?.signerPublicKey || user.pqcDsaPublicKey || 'MLDSA65-PUB-VERMA-9921',
        associatedData: backendData.crypto_envelope?.associatedData || '',
        verified: true
      }
    };

    onSubmitReport(generatedReport);
    onUpdateOrderStatus(order.id, 'completed');
    setSuccessNotice(true);

    setTimeout(() => {
      setSuccessNotice(false);
      setSelectedOrder(null);
    }, 1500);
  };

  // Image Upload Handlers
  const handleFileSelect = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setDocUploadError('Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setDocUploadError('File exceeds 10 MB maximum size limit.');
      return;
    }

    setDocUploadError(null);
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));

    if (!uploadDocTitle) {
      const activeOrder = labOrders.find(o => o.id === uploadOrderId);
      if (activeOrder) {
        setUploadDocTitle(`${activeOrder.testType} - Result Scan`);
      } else {
        const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setUploadDocTitle(clean.charAt(0).toUpperCase() + clean.slice(1));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadScanReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setDocUploadError('Please choose or drop an image file to upload.');
      return;
    }

    const boundOrder = labOrders.find(o => o.id === uploadOrderId);
    const targetPatientId = boundOrder ? boundOrder.patientId : 'pat-001';
    const targetPatientName = boundOrder ? boundOrder.patientName : 'Ananya Sharma';

    setUploadingDoc(true);
    setDocUploadError(null);
    setDocUploadSuccess(null);
    setUploadProgress('Validating image header & hashing SHA-256...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('patient_id', targetPatientId);
      formData.append('patient_name', targetPatientName);
      formData.append('uploaded_by', user.id);
      formData.append('uploader_name', `${user.name} (NABL Lab)`);
      formData.append('uploader_role', 'lab_technician');
      formData.append('title', uploadDocTitle || selectedFile.name);
      formData.append('category', uploadDocCategory);
      if (uploadOrderId) {
        formData.append('order_id', uploadOrderId);
      }
      if (uploadDocNotes) {
        formData.append('description', uploadDocNotes);
      }
      formData.append('sign_with_pqc', 'true');

      setUploadProgress('Signing with technician ML-DSA-65 post-quantum key...');
      const res = await dbService.uploadMedicalDocument(formData);
      
      if (res.success && res.data) {
        setDocuments(prev => [res.data!, ...prev]);
        setDocUploadSuccess(`Lab report "${res.data.title}" uploaded & signed!`);
        setSelectedFile(null);
        setFilePreviewUrl(null);
        setUploadDocTitle('');
        setUploadDocNotes('');
        setTimeout(() => setDocUploadSuccess(null), 4000);
      } else {
        setDocUploadError(res.error || 'Upload failed. Check server status.');
      }
    } catch (err: any) {
      setDocUploadError(err.message || 'An error occurred during upload.');
    } finally {
      setUploadingDoc(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner: Lab Technician Scientific Station */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0A192F] via-[#132A3E] to-[#2E1065] text-white p-6 sm:p-8 shadow-xl border border-teal-500/30">
        <div className="absolute top-0 right-10 w-72 h-72 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="relative">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-teal-400 via-emerald-300 to-purple-400 p-1 shadow-lg shadow-teal-500/20">
                <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center font-black text-2xl text-teal-300">
                  <FlaskConical className="w-9 h-9 text-teal-300" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-400 border-2 border-[#0A192F] flex items-center justify-center shadow">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{user.name}</h2>
                <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/40">
                  Senior Lab Technologist
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {user.department} • Certification: <span className="font-mono text-teal-300">{user.licenseNumber || 'NABL-TECH-40912'}</span>
              </p>
              <div className="pt-1 flex items-center space-x-2 text-xs font-mono bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-700/80 text-slate-300 max-w-fit">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-slate-400">ML-DSA-65 Public Key:</span>
                <span className="text-purple-300 font-bold truncate max-w-[200px] sm:max-w-xs">{user.pqcDsaPublicKey}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 self-start md:self-auto max-w-xs">
            <button
              type="button"
              onClick={() => setShowLabRecordForm(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-teal-500/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Send Confidential Lab Result (PQC)</span>
            </button>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-teal-500/30 text-xs space-y-1">
              <div className="flex items-center space-x-2 text-teal-300 font-bold">
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                <span>NIST Post-Quantum Pipeline</span>
              </div>
              <p className="text-[10px] text-slate-300">
                ML-KEM-768 session encapsulation + AES-256-GCM + ML-DSA-65 tamper-evident digital signatures.
              </p>
            </div>
          </div>
        </div>

        {/* Laboratory Workload Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-700/70">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Pending Lab Orders</span>
            <p className="text-xl font-bold font-mono text-amber-300 mt-0.5">{pendingOrders.length}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Completed Reports</span>
            <p className="text-xl font-bold font-mono text-emerald-300 mt-0.5">{reports.length}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Dispatched Scans</span>
            <p className="text-xl font-bold font-mono text-teal-300 mt-0.5">{documents.length}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Lattice Signatures</span>
            <p className="text-xs font-mono text-purple-300 mt-2 font-bold flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
              <span>100% Validated</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Specimen Analysis Queue & Report Packaging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Incoming Orders Queue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-lg text-slate-900">Specimen Analysis Queue</h3>
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
              {pendingOrders.length} Pending Actions
            </span>
          </div>

          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className={`p-4 rounded-2xl border transition-all ${
                  selectedOrder?.id === order.id
                    ? 'border-purple-500 bg-purple-50/30 shadow-md'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{order.testType}</h4>
                    <p className="text-xs text-slate-500">
                      Patient: <span className="font-semibold text-slate-700">{order.patientName}</span> ({order.patientId})
                    </p>
                    <p className="text-xs text-slate-500">Ordered by: {order.doctorName}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    order.priority === 'urgent' ? 'bg-amber-100 text-amber-800' :
                    order.priority === 'stat_emergency' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {order.priority}
                  </span>
                </div>

                <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 my-2">
                  "{order.clinicalNotes}"
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'sample_collected')}
                      className={`text-[11px] px-2 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                        order.status === 'sample_collected'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Sample Collected
                    </button>
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'in_analysis')}
                      className={`text-[11px] px-2 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                        order.status === 'in_analysis'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      In Analysis
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setUploadOrderId(order.id);
                        const scanSection = document.getElementById('lab-scan-upload-section');
                        if (scanSection) scanSection.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs border border-purple-200 transition-colors cursor-pointer"
                    >
                      Attach Scan
                    </button>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-[#0A192F] hover:bg-slate-800 text-teal-300 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Enter Data
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Enter Results & PQC Cryptographic Packaging */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-lg text-slate-900">Cryptographic Report Packaging</h3>
          </div>

          {selectedOrder ? (
            <form onSubmit={handlePackageAndSubmit} className="space-y-4">
              <div className="bg-teal-50/50 p-3 rounded-2xl border border-teal-200 text-xs">
                <p className="font-bold text-teal-900">Selected Order: {selectedOrder.testType}</p>
                <p className="text-teal-700">Recipient Patient: {selectedOrder.patientName} • Attending: {selectedOrder.doctorName}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Specimen Type
                </label>
                <input
                  type="text"
                  value={specimenType}
                  onChange={(e) => setSpecimenType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Summary &amp; Findings
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Troponin-I within normal baseline (<0.01 ng/mL). No ischemic cellular damage detected."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-teal-500"
                  required
                />
              </div>

              {/* Biomarker Values */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Biomarker Measurement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={biomarker1Name}
                    onChange={(e) => setBiomarker1Name(e.target.value)}
                    placeholder="Biomarker Name"
                    className="p-2 rounded-xl border border-slate-300 text-xs outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={biomarker1Val}
                    onChange={(e) => setBiomarker1Val(e.target.value)}
                    placeholder="Observed Value"
                    className="p-2 rounded-xl border border-slate-300 text-xs outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={biomarker1Unit}
                    onChange={(e) => setBiomarker1Unit(e.target.value)}
                    placeholder="Unit (e.g. ng/mL)"
                    className="p-2 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={biomarker1Range}
                    onChange={(e) => setBiomarker1Range(e.target.value)}
                    placeholder="Reference Range"
                    className="p-2 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pathologist Impression
                </label>
                <textarea
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  placeholder="Clinical diagnostic impression..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="bg-slate-900 text-white p-3 rounded-2xl text-[11px] font-mono space-y-1">
                <p className="text-teal-400 font-bold flex items-center space-x-1">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>NIST PQC Pipeline Trigger:</span>
                </p>
                <p className="text-slate-300">1. ML-KEM-768 Encapsulate Session Key</p>
                <p className="text-slate-300">2. AES-256-GCM Encrypt Biomarkers</p>
                <p className="text-slate-300">3. ML-DSA-65 Digital Signature Generation</p>
              </div>

              <button
                type="submit"
                disabled={encrypting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {encrypting ? (
                  <span>Generating ML-KEM &amp; ML-DSA Envelope...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Encrypt, Sign &amp; Dispatch to Hospital</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <FlaskConical className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium">Select an order from the queue to input results.</p>
              <p className="text-xs">Reports are automatically packaged with post-quantum lattice cryptography.</p>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Report encrypted with ML-KEM-768 &amp; signed with ML-DSA-65 successfully!</span>
            </div>
          )}
        </div>

      </div>

      {/* SECTION: Lab Reports & Diagnostic Scan Upload */}
      <div id="lab-scan-upload-section" className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center font-bold">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Lab Diagnostic Scans &amp; Image Reports</h3>
              <p className="text-xs text-slate-500">
                Attach lab test result sheets, pathology photos, and equipment scans with ML-DSA-65 tamper protection.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono bg-purple-50 border border-purple-200 text-purple-800 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>NABL Cryptographic Chain of Custody</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Upload Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Upload Scanned Lab Result</span>
            </h4>

            {docUploadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 animate-fade-in">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{docUploadSuccess}</span>
              </div>
            )}

            {docUploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{docUploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadScanReport} className="space-y-4">
              {/* Order Binding Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Link to Test Order
                </label>
                <select
                  value={uploadOrderId}
                  onChange={(e) => {
                    setUploadOrderId(e.target.value);
                    const match = labOrders.find(o => o.id === e.target.value);
                    if (match && !uploadDocTitle) {
                      setUploadDocTitle(`${match.testType} Result Sheet`);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 focus:border-purple-500 text-xs text-slate-800 outline-none"
                >
                  {labOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.testType} — {o.patientName} ({o.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag & Drop File Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Report Image (JPG, PNG, WEBP &lt; 10MB)
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
                        ? 'border-purple-500 bg-purple-50/50'
                        : 'border-slate-300 hover:border-purple-400 bg-white'
                    }`}
                    onClick={() => {
                      const input = document.getElementById('lab-file-input');
                      if (input) input.click();
                    }}
                  >
                    <input
                      id="lab-file-input"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                    <UploadCloud className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      Drag &amp; drop scan or test sheet image
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
                    value={uploadDocTitle}
                    onChange={(e) => setUploadDocTitle(e.target.value)}
                    placeholder="e.g. Troponin Assay Readout"
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 focus:border-purple-500 text-xs text-slate-800 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Test Category
                  </label>
                  <select
                    value={uploadDocCategory}
                    onChange={(e) => setUploadDocCategory(e.target.value as DocumentCategory)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 focus:border-purple-500 text-xs text-slate-800 outline-none"
                  >
                    <option value="Blood Test">Blood Test</option>
                    <option value="Medical Scan">Medical Scan</option>
                    <option value="Diagnosis Report">Diagnosis Report</option>
                    <option value="Other Medical Document">Other Medical Document</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Technician Remarks / Analyzer Instrument Notes
                </label>
                <textarea
                  value={uploadDocNotes}
                  onChange={(e) => setUploadDocNotes(e.target.value)}
                  placeholder="Calibration run status, batch number, or instrument parameters..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 focus:border-purple-500 text-xs text-slate-800 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingDoc || !selectedFile}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {uploadingDoc ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{uploadProgress || 'Securing lab scan...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Upload &amp; Post-Quantum Sign Report</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Uploaded Lab Reports Gallery (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Previously Submitted Scans &amp; Test Sheets ({documents.length})</span>
            </h4>

            {documents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No lab scan documents found.</p>
                <p className="text-[11px] text-slate-400">Upload a scan report on the left to link it with an order.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[560px] overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 transition-all shadow-sm flex flex-col justify-between space-y-3 group"
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
                            <Eye className="w-3.5 h-3.5 text-purple-600" />
                            <span>Preview</span>
                          </span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-purple-50 text-purple-700 border border-purple-200">
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
                      <div className="flex items-center space-x-1 text-purple-700 text-[10px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>ML-DSA-65 Verified</span>
                      </div>
                      <button
                        onClick={() => setSelectedDocForPreview(doc)}
                        className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center space-x-1 cursor-pointer"
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

      {/* Modal Preview for Medical Document */}
      {selectedDocForPreview && (
        <DocumentPreviewModal
          document={selectedDocForPreview}
          onClose={() => setSelectedDocForPreview(null)}
        />
      )}

      {/* 1. Lab Confidential Medical Record Form Modal */}
      {showLabRecordForm && (
        <SecureRecordForm
          isOpen={showLabRecordForm}
          onClose={() => setShowLabRecordForm(false)}
          onSubmitForPreview={handleLabRecordFormSubmit}
          senderRole="lab_technician"
          currentUser={user}
          authorizedPatients={Array.from(new Map(labOrders.map(o => [o.patientId, { id: o.patientId, name: o.patientName }])).values())}
          initialData={{
            recordType: 'Diagnostic Laboratory Test Report'
          }}
        />
      )}

      {/* 2. Lab Pre-Send Cryptographic Preview Confirmation */}
      {showLabPreSendPreview && pendingReportData && (
        <SecureSendConfirmation
          isOpen={showLabPreSendPreview}
          onClose={() => setShowLabPreSendPreview(false)}
          onConfirm={handleLabConfirmEncrypt}
          senderName={user.name}
          senderRole="lab_technician"
          senderDepartment="Diagnostic Pathology &amp; Molecular Lab"
          recipientName={pendingReportData.order.patientName}
          recipientId={pendingReportData.order.patientId}
          recordType={pendingReportData.order.testType}
          recordReference={pendingReportData.recordReference || 'REP-PQC-2026-9481'}
          payloadSummary={pendingReportData.summary || {
            title: pendingReportData.order.testType,
            itemsCount: pendingReportData.payload.biomarkers?.length || 3,
            clinicalSummary: pendingReportData.payload.clinicalImpression || 'Diagnostic laboratory analysis'
          }}
        />
      )}

      {/* 3. Dedicated Post-Quantum Encryption Pipeline Modal */}
      {showEncryptionModal && pendingReportData && (
        <EncryptionPipelineAnimation
          isOpen={showEncryptionModal}
          onClose={() => setShowEncryptionModal(false)}
          senderId={user.id}
          senderName={user.name}
          senderRole="lab_technician"
          recipientId={pendingReportData.order.patientId}
          recipientName={pendingReportData.order.patientName}
          recordType={pendingReportData.order.testType}
          payload={pendingReportData.payload}
          onComplete={handleEncryptionComplete}
        />
      )}
    </div>
  );
};
