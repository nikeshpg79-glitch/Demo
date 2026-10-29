import React, { useState } from 'react';
import { 
  FileText, 
  Stethoscope, 
  FlaskConical, 
  User, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  X, 
  AlertCircle,
  Activity,
  HeartPulse,
  ClipboardList
} from 'lucide-react';
import { UserProfile } from '../../types';

export interface BiomarkerItem {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: 'normal' | 'elevated' | 'critical' | 'low';
}

export interface SecureRecordFormData {
  recipientId: string;
  recipientName: string;
  recordType: string;
  diagnosisOrTest: string;
  clinicalNotes: string;
  biomarkers: BiomarkerItem[];
  recommendations: string;
  category: string;
}

export interface SecureRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitForPreview: (formData: SecureRecordFormData) => void;
  senderRole: 'doctor' | 'lab_technician';
  currentUser: UserProfile;
  authorizedPatients: Array<{ id: string; name: string }>;
  initialData?: Partial<SecureRecordFormData>;
}

export const SecureRecordForm: React.FC<SecureRecordFormProps> = ({
  isOpen,
  onClose,
  onSubmitForPreview,
  senderRole,
  currentUser,
  authorizedPatients,
  initialData
}) => {
  const [recipientId, setRecipientId] = useState<string>(
    initialData?.recipientId || authorizedPatients[0]?.id || 'pat-001'
  );
  const [recordType, setRecordType] = useState<string>(
    initialData?.recordType || (senderRole === 'doctor' ? 'Clinical Prescription & Consultation Summary' : 'Diagnostic Laboratory Test Report')
  );
  const [diagnosisOrTest, setDiagnosisOrTest] = useState<string>(
    initialData?.diagnosisOrTest || (senderRole === 'doctor' ? 'Essential Hypertension & Dyslipidemia' : 'Comprehensive Next-Gen Cardiovascular & Lipid Panel')
  );
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    initialData?.clinicalNotes || (senderRole === 'doctor' 
      ? 'Patient evaluated during routine cardiac follow-up. Blood pressure stabilized with regular medication adherence.' 
      : 'Specimen processed on automated clinical analyzer. All quality control standards verified.')
  );
  const [recommendations, setRecommendations] = useState<string>(
    initialData?.recommendations || (senderRole === 'doctor' 
      ? 'Continue Telmisartan 40mg daily and Atorvastatin 20mg at bedtime. Follow up in 3 months.' 
      : 'Correlate elevated lipid markers with physician clinical assessment.')
  );

  // Biomarkers / Prescription Items
  const [biomarkers, setBiomarkers] = useState<BiomarkerItem[]>(
    initialData?.biomarkers || (
      senderRole === 'doctor' ? [
        { name: 'Target Systolic BP', value: '118', unit: 'mmHg', referenceRange: '< 120', flag: 'normal' },
        { name: 'Lipoprotein(a)', value: '14.2', unit: 'nmol/L', referenceRange: '< 30.0', flag: 'normal' },
        { name: 'HbA1c Glycemic Index', value: '5.6', unit: '%', referenceRange: '< 5.7', flag: 'normal' }
      ] : [
        { name: 'High-Sensitivity Troponin I', value: '0.012', unit: 'ng/mL', referenceRange: '0.000 - 0.040', flag: 'normal' },
        { name: 'N-Terminal Pro-BNP', value: '68.4', unit: 'pg/mL', referenceRange: '< 125.0', flag: 'normal' },
        { name: 'Creatine Kinase-MB', value: '2.1', unit: 'ng/mL', referenceRange: '0.6 - 6.3', flag: 'normal' }
      ]
    )
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddBiomarker = () => {
    setBiomarkers([
      ...biomarkers,
      { name: '', value: '', unit: '', referenceRange: '', flag: 'normal' }
    ]);
  };

  const handleRemoveBiomarker = (index: number) => {
    setBiomarkers(biomarkers.filter((_, i) => i !== index));
  };

  const handleBiomarkerChange = (index: number, field: keyof BiomarkerItem, val: string) => {
    const updated = [...biomarkers];
    updated[index] = { ...updated[index], [field]: val };
    setBiomarkers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!recipientId) {
      setValidationError('Please select an authorized recipient.');
      return;
    }
    if (!diagnosisOrTest.trim()) {
      setValidationError(senderRole === 'doctor' ? 'Please enter a diagnosis or clinical evaluation.' : 'Please enter the test name.');
      return;
    }

    const selectedPatient = authorizedPatients.find(p => p.id === recipientId) || {
      id: recipientId,
      name: 'Ananya Sharma'
    };

    onSubmitForPreview({
      recipientId: selectedPatient.id,
      recipientName: selectedPatient.name,
      recordType,
      diagnosisOrTest,
      clinicalNotes,
      biomarkers: biomarkers.filter(b => b.name.trim() !== ''),
      recommendations,
      category: senderRole === 'doctor' ? 'Prescription' : 'Lab Report'
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="secure-record-form-title"
    >
      <div className="bg-[#0A192F] rounded-3xl max-w-3xl w-full shadow-2xl border border-teal-500/30 relative overflow-hidden flex flex-col text-white my-auto max-h-[92vh]">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#1E293B] flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-lg ${
              senderRole === 'doctor'
                ? 'bg-gradient-to-tr from-sky-400 to-teal-400 shadow-sky-500/20'
                : 'bg-gradient-to-tr from-teal-400 to-emerald-400 shadow-teal-500/20'
            }`}>
              {senderRole === 'doctor' ? (
                <Stethoscope className="w-6 h-6 text-[#0A192F]" />
              ) : (
                <FlaskConical className="w-6 h-6 text-[#0A192F]" />
              )}
            </div>
            <div>
              <h3 id="secure-record-form-title" className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <span>{senderRole === 'doctor' ? 'Create Confidential Clinical Record' : 'Create Confidential Lab Result'}</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-mono font-bold border border-teal-500/30 uppercase">
                  PQC ENCRYPTED
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authored by {currentUser.name} • Sealed with NIST FIPS 203/204 Post-Quantum Security
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto relative z-10">
          
          {validationError && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Target Recipient & Record Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Authorized Patient Recipient *
              </label>
              <div className="relative">
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
                  required
                >
                  {authorizedPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                  {!authorizedPatients.some(p => p.id === 'pat-001') && (
                    <option value="pat-001">Ananya Sharma (pat-001)</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Record Classification *
              </label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
              >
                {senderRole === 'doctor' ? (
                  <>
                    <option value="Clinical Prescription & Consultation Summary">Clinical Prescription &amp; Consultation Summary</option>
                    <option value="Cardiology Diagnostics & Therapeutic Plan">Cardiology Diagnostics &amp; Therapeutic Plan</option>
                    <option value="Genomic Evaluation & Pharmacogenomics">Genomic Evaluation &amp; Pharmacogenomics</option>
                    <option value="Physician Discharge & Follow-Up Order">Physician Discharge &amp; Follow-Up Order</option>
                  </>
                ) : (
                  <>
                    <option value="Diagnostic Laboratory Test Report">Diagnostic Laboratory Test Report</option>
                    <option value="Next-Gen Genomic Sequencing Panel">Next-Gen Genomic Sequencing Panel</option>
                    <option value="Cardiac Biomarker Quantitative Assay">Cardiac Biomarker Quantitative Assay</option>
                    <option value="Pathology Biopsy & Cellular Screen">Pathology Biopsy &amp; Cellular Screen</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Section 2: Clinical Diagnosis or Test Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              {senderRole === 'doctor' ? 'Clinical Diagnosis & Hypotheses *' : 'Laboratory Test Name & Specimen Panel *'}
            </label>
            <input
              type="text"
              value={diagnosisOrTest}
              onChange={(e) => setDiagnosisOrTest(e.target.value)}
              placeholder={senderRole === 'doctor' ? 'e.g., Essential Hypertension, Mild Hypercholesterolemia' : 'e.g., Cardiac Troponin I & NT-proBNP Immunoassay'}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-slate-500"
              required
            />
          </div>

          {/* Section 3: Biomarkers / Prescription Metrics Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>{senderRole === 'doctor' ? 'Prescription Items / Target Biomarkers' : 'Laboratory Biomarker Measurements'}</span>
              </label>
              <button
                type="button"
                onClick={handleAddBiomarker}
                className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {biomarkers.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 items-center text-xs">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Parameter / Drug"
                      value={item.name}
                      onChange={(e) => handleBiomarkerChange(idx, 'name', e.target.value)}
                      className="w-full bg-slate-950 p-1.5 rounded border border-slate-700 text-xs text-white placeholder:text-slate-600 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Value"
                      value={item.value}
                      onChange={(e) => handleBiomarkerChange(idx, 'value', e.target.value)}
                      className="w-full bg-slate-950 p-1.5 rounded border border-slate-700 text-xs text-white placeholder:text-slate-600 outline-none font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Unit"
                      value={item.unit}
                      onChange={(e) => handleBiomarkerChange(idx, 'unit', e.target.value)}
                      className="w-full bg-slate-950 p-1.5 rounded border border-slate-700 text-xs text-white placeholder:text-slate-600 outline-none font-mono"
                    />
                  </div>
                  <div className="col-span-3">
                    <select
                      value={item.flag}
                      onChange={(e) => handleBiomarkerChange(idx, 'flag', e.target.value as any)}
                      className="w-full bg-slate-950 p-1.5 rounded border border-slate-700 text-[11px] text-teal-300 outline-none cursor-pointer"
                    >
                      <option value="normal">Normal</option>
                      <option value="elevated">Elevated</option>
                      <option value="critical">Critical</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveBiomarker(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Clinical Notes & Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              {senderRole === 'doctor' ? 'Clinical Notes & Evaluation Findings' : 'Laboratory Technician Observations'}
            </label>
            <textarea
              rows={2}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Clinical context, observations, or quality assurance notes..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-slate-500"
            />
          </div>

          {/* Section 5: Recommendations */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              {senderRole === 'doctor' ? 'Prescription Regimen & Follow-Up Advice' : 'Pathology Remarks & Next Steps'}
            </label>
            <input
              type="text"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="e.g., Atorvastatin 20mg at bedtime; repeat lipid screen in 12 weeks"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-slate-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 hover:opacity-95 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>Review Cryptographic Preview</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

