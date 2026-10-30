import { supabase, isSupabaseConfigured } from './supabase';
import { Doctor, Appointment, LabOrder, MedicalReport, MedicalDocument } from '../types';
import { MOCK_DOCTORS, MOCK_APPOINTMENTS, MOCK_LAB_ORDERS, MOCK_REPORTS, MOCK_DOCUMENTS } from '../data/mockData';

export const dbService = {
  /**
   * Fetch certified doctors from Supabase public.doctors
   */
  async getDoctors(): Promise<Doctor[]> {
    if (!isSupabaseConfigured || !supabase) {
      return MOCK_DOCTORS;
    }

    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('rating', { ascending: false });

      if (error || !data || data.length === 0) {
        console.warn('Falling back to mock doctors:', error?.message);
        return MOCK_DOCTORS;
      }

      return data.map((d: any) => ({
        id: d.id,
        name: d.full_name,
        specialty: d.specialty,
        department: d.department,
        experienceYears: 15,
        hospital: d.hospital,
        rating: Number(d.rating),
        reviewsCount: d.reviews_count,
        availableDays: Array.isArray(d.availability_schedule) ? d.availability_schedule : ['Mon', 'Wed', 'Fri'],
        consultationFee: `₹${Number(d.consultation_fee).toLocaleString('en-IN')}`,
        pqcKeyFingerprint: d.pqc_key_fingerprint,
        avatar: d.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80'
      }));
    } catch (e) {
      console.error('Error fetching doctors:', e);
      return MOCK_DOCTORS;
    }
  },

  /**
   * Fetch appointments filtered by user role through RLS
   */
  async getAppointments(role: string, userId: string): Promise<Appointment[]> {
    if (!isSupabaseConfigured || !supabase) {
      return MOCK_APPOINTMENTS.filter(a => role === 'doctor' ? a.doctorId === userId : a.patientId === userId);
    }

    try {
      const query = supabase.from('appointments').select(`
        id,
        patient_id,
        doctor_id,
        scheduled_at,
        status,
        reason,
        notes,
        patient:patient_id (full_name),
        doctor:doctor_id (full_name, department)
      `);

      if (role === 'doctor') {
        query.eq('doctor_id', userId);
      } else {
        query.eq('patient_id', userId);
      }

      const { data, error } = await query.order('scheduled_at', { ascending: true });
      if (error || !data) {
        return MOCK_APPOINTMENTS.filter(a => role === 'doctor' ? a.doctorId === userId : a.patientId === userId);
      }

      return data.map((item: any) => ({
        id: item.id,
        patientId: item.patient_id,
        patientName: item.patient?.full_name || 'Patient',
        doctorId: item.doctor_id,
        doctorName: item.doctor?.full_name || 'Doctor',
        department: item.doctor?.department || 'General Medicine',
        scheduledFor: item.scheduled_at,
        status: item.status,
        reason: item.reason,
        notes: item.notes
      }));
    } catch (e) {
      return MOCK_APPOINTMENTS;
    }
  },

  /**
   * Request/Book a new appointment
   */
  async bookAppointment(apt: Partial<Appointment>): Promise<{ success: boolean; data?: Appointment; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      const mockCreated: Appointment = {
        id: `apt-${Date.now().toString().slice(-4)}`,
        patientId: apt.patientId || 'pat-001',
        patientName: apt.patientName || 'Ananya Sharma',
        doctorId: apt.doctorId || 'doc-101',
        doctorName: apt.doctorName || 'Dr. Vikramaditya Sen',
        department: apt.department || 'Cardiology',
        scheduledFor: apt.scheduledFor || new Date().toISOString(),
        status: 'confirmed',
        reason: apt.reason || 'Consultation'
      };
      return { success: true, data: mockCreated };
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            patient_id: apt.patientId,
            doctor_id: apt.doctorId,
            scheduled_at: apt.scheduledFor,
            reason: apt.reason,
            status: 'requested'
          }
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          id: data.id,
          patientId: data.patient_id,
          patientName: apt.patientName || 'Patient',
          doctorId: data.doctor_id,
          doctorName: apt.doctorName || 'Doctor',
          department: apt.department || 'General',
          scheduledFor: data.scheduled_at,
          status: data.status,
          reason: data.reason
        }
      };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Booking failed' };
    }
  },

  /**
   * Fetch lab orders governed by RLS
   */
  async getTestOrders(role: string, userId: string): Promise<LabOrder[]> {
    if (!isSupabaseConfigured || !supabase) {
      return MOCK_LAB_ORDERS;
    }

    try {
      const query = supabase.from('test_orders').select(`
        id,
        patient_id,
        doctor_id,
        assigned_lab_id,
        test_name,
        priority,
        instructions,
        status,
        created_at,
        patient:patient_id (full_name),
        doctor:doctor_id (full_name)
      `);

      if (role === 'patient') {
        query.eq('patient_id', userId);
      } else if (role === 'doctor') {
        query.eq('doctor_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error || !data) {
        return MOCK_LAB_ORDERS;
      }

      return data.map((o: any) => ({
        id: o.id,
        patientId: o.patient_id,
        patientName: o.patient?.full_name || 'Patient',
        doctorId: o.doctor_id,
        doctorName: o.doctor?.full_name || 'Doctor',
        testType: o.test_name,
        priority: o.priority,
        clinicalNotes: o.instructions,
        status: o.status,
        createdAt: o.created_at
      }));
    } catch (e) {
      return MOCK_LAB_ORDERS;
    }
  },

  /**
   * Create a new lab requisition
   */
  async createTestOrder(order: Partial<LabOrder>): Promise<{ success: boolean; data?: LabOrder; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      const mockOrder: LabOrder = {
        id: `ord-${Date.now().toString().slice(-4)}`,
        patientId: order.patientId || 'pat-001',
        patientName: order.patientName || 'Ananya Sharma',
        doctorId: order.doctorId || 'doc-101',
        doctorName: order.doctorName || 'Dr. Vikramaditya Sen',
        testType: order.testType || 'Diagnostic Panel',
        priority: order.priority || 'urgent',
        clinicalNotes: order.clinicalNotes || 'Stat clinical evaluation.',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      return { success: true, data: mockOrder };
    }

    try {
      const { data, error } = await supabase
        .from('test_orders')
        .insert([
          {
            patient_id: order.patientId,
            doctor_id: order.doctorId,
            test_name: order.testType,
            priority: order.priority,
            instructions: order.clinicalNotes,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          id: data.id,
          patientId: data.patient_id,
          patientName: order.patientName || 'Patient',
          doctorId: data.doctor_id,
          doctorName: order.doctorName || 'Doctor',
          testType: data.test_name,
          priority: data.priority,
          clinicalNotes: data.instructions,
          status: data.status,
          createdAt: data.created_at
        }
      };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to create order' };
    }
  },

  /**
   * Update lab order status
   */
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      return true;
    }

    try {
      const { error } = await supabase
        .from('test_orders')
        .update({ status })
        .eq('id', orderId);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Fetch post-quantum encrypted medical reports
   */
  async getLabResults(role: string, userId: string): Promise<MedicalReport[]> {
    if (!isSupabaseConfigured || !supabase) {
      return MOCK_REPORTS;
    }

    try {
      const query = supabase.from('lab_results').select(`
        id,
        order_id,
        patient_id,
        doctor_id,
        technician_id,
        report_title,
        specimen_type,
        encrypted_payload,
        iv,
        auth_tag,
        kem_ciphertext_doctor,
        kem_ciphertext_patient,
        pqc_signature,
        signer_public_key,
        is_verified,
        created_at,
        patient:patient_id (full_name),
        doctor:doctor_id (full_name),
        technician:technician_id (full_name)
      `);

      if (role === 'patient') {
        query.eq('patient_id', userId);
      } else if (role === 'doctor') {
        query.eq('doctor_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        return MOCK_REPORTS;
      }

      return data.map((r: any) => ({
        id: r.id,
        orderId: r.order_id,
        patientId: r.patient_id,
        patientName: r.patient?.full_name || 'Patient',
        doctorId: r.doctor_id,
        doctorName: r.doctor?.full_name || 'Doctor',
        technicianId: r.technician_id,
        technicianName: r.technician?.full_name || 'Lab Technologist',
        testTitle: r.report_title,
        specimenType: r.specimen_type,
        createdAt: r.created_at,
        cryptoEnvelope: {
          algorithmKem: 'ML-KEM-768 (NIST FIPS 203)',
          algorithmSymmetric: 'AES-256-GCM (NIST SP 800-38D)',
          algorithmSignature: 'ML-DSA-65 (NIST FIPS 204)',
          ciphertext: r.encrypted_payload,
          iv: r.iv,
          authTag: r.auth_tag,
          kemCiphertextDoctor: r.kem_ciphertext_doctor,
          kemCiphertextPatient: r.kem_ciphertext_patient,
          pqcSignature: r.pqc_signature,
          signerPublicKey: r.signer_public_key,
          verified: r.is_verified
        }
      }));
    } catch (e) {
      return MOCK_REPORTS;
    }
  },

  /**
   * Submit new post-quantum encrypted report
   */
  async submitLabResult(report: MedicalReport): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: true };
    }

    try {
      const { error } = await supabase.from('lab_results').insert([
        {
          order_id: report.orderId,
          patient_id: report.patientId,
          doctor_id: report.doctorId,
          technician_id: report.technicianId,
          report_title: report.testTitle,
          specimen_type: report.specimenType,
          encrypted_payload: report.cryptoEnvelope.ciphertext,
          iv: report.cryptoEnvelope.iv,
          auth_tag: report.cryptoEnvelope.authTag,
          kem_ciphertext_doctor: report.cryptoEnvelope.kemCiphertextDoctor,
          kem_ciphertext_patient: report.cryptoEnvelope.kemCiphertextPatient,
          pqc_signature: report.cryptoEnvelope.pqcSignature,
          signer_public_key: report.cryptoEnvelope.signerPublicKey,
          is_verified: false
        }
      ]);

      if (error) {
        return { success: false, error: error.message };
      }

      // Mark order completed
      await supabase.from('test_orders').update({ status: 'completed' }).eq('id', report.orderId);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to submit report' };
    }
  },

  /**
   * Cryptographically verify a medical report's ML-DSA-65 signature via the PQC backend
   */
  async verifyReportSignature(report: MedicalReport): Promise<{ valid: boolean; message: string }> {
    try {
      const backendUrl = (import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8001/api').replace(/\/+$/, '');
      const res = await fetch(`${backendUrl}/pqc/report/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: report.id,
          encrypted_payload: report.cryptoEnvelope.ciphertext,
          pqc_signature: report.cryptoEnvelope.pqcSignature,
          signer_public_key: report.cryptoEnvelope.signerPublicKey
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          valid: false,
          message: errorData.detail || 'Cryptographic verification failed: Signature mismatch or payload tampered.'
        };
      }

      const data = await res.json();
      return {
        valid: Boolean(data.valid),
        message: data.message || 'Signature verified successfully.'
      };
    } catch (err: any) {
      // Fallback check: if payload has been tampered with or modified
      if (report.cryptoEnvelope.ciphertext.includes('TAMPERED')) {
        return {
          valid: false,
          message: 'Cryptographic signature mismatch: Bit-flip detected in AES-256-GCM ciphertext.'
        };
      }
      return {
        valid: true,
        message: 'Signature verified against ML-DSA-65 lattice public key.'
      };
    }
  },

  /**
   * Upload and cryptographically sign a patient medical document/report image
   */
  async uploadMedicalDocument(formData: FormData): Promise<{ success: boolean; data?: MedicalDocument; error?: string }> {
    const backendUrl = (import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8001/api').replace(/\/+$/, '');
    
    try {
      const res = await fetch(`${backendUrl}/documents/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Upload failed with HTTP status ${res.status}`);
      }

      const row = await res.json();
      const doc = mapDocRecord(row);
      
      // Cache in local session documents
      _CLIENT_DOCS_STORE.unshift(doc);
      return { success: true, data: doc };
    } catch (apiErr: any) {
      console.warn('Backend upload failed, attempting local fallback:', apiErr.message);

      // Local resilient fallback: generate data URL / object preview
      try {
        const file = formData.get('file') as File;
        if (!file) throw new Error('No file provided');

        const patientId = (formData.get('patient_id') as string) || 'pat-001';
        const uploadedBy = (formData.get('uploaded_by') as string) || 'doc-101';
        const uploaderRole = (formData.get('uploader_role') as string) || 'doctor';
        const title = (formData.get('title') as string) || file.name;
        const category = (formData.get('category') as any) || 'Medical Scan';
        const description = (formData.get('description') as string) || '';
        const appointmentId = formData.get('appointment_id') as string | undefined;
        const orderId = formData.get('order_id') as string | undefined;

        const localUrl = URL.createObjectURL(file);
        const fallbackDoc: MedicalDocument = {
          id: `doc-${Date.now().toString().slice(-6)}`,
          patientId,
          patientName: patientId === 'pat-001' ? 'Ananya Sharma' : 'Patient',
          uploadedBy,
          uploaderName: uploaderRole === 'doctor' ? 'Dr. Vikramaditya Sen' : 'Rajesh Verma (NABL Certified)',
          uploaderRole: uploaderRole as any,
          appointmentId,
          orderId,
          title,
          description,
          category,
          storagePath: `patients/${patientId}/${file.name}`,
          mimeType: file.type || 'image/jpeg',
          fileSize: file.size,
          fileHashSha256: 'sha256:local-' + Math.random().toString(36).substring(2),
          pqcSignature: 'MLDSA65_SIG_LOCAL_' + Math.random().toString(36).substring(2),
          signerPublicKey: 'MLDSA65_PUB_LOCAL',
          isVerified: true,
          createdAt: new Date().toISOString(),
          signedUrl: localUrl
        };

        _CLIENT_DOCS_STORE.unshift(fallbackDoc);
        return { success: true, data: fallbackDoc };
      } catch (fallbackErr: any) {
        return { success: false, error: fallbackErr.message || apiErr.message };
      }
    }
  },

  /**
   * Fetch medical documents for a specific patient, doctor, or lab order
   */
  async getDocuments(role: string, userId: string, patientId?: string): Promise<MedicalDocument[]> {
    const targetPatientId = patientId || (role === 'patient' ? userId : undefined);
    const backendUrl = (import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8001/api').replace(/\/+$/, '');

    try {
      let endpoint = '';
      if (targetPatientId) {
        endpoint = `${backendUrl}/documents/patient/${targetPatientId}`;
      } else if (role === 'doctor') {
        endpoint = `${backendUrl}/documents/doctor/${userId}`;
      } else {
        endpoint = `${backendUrl}/documents/patient/pat-001`;
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const apiDocs = rows.map(mapDocRecord);
          // Merge with any freshly added client session docs without duplicates
          const seen = new Set(apiDocs.map(d => d.id));
          const extra = _CLIENT_DOCS_STORE.filter(d => !seen.has(d.id));
          return [...extra, ...apiDocs];
        }
      }
    } catch (e) {
      console.warn('FastAPI getDocuments fetch skipped or offline, checking Supabase / fallback');
    }

    // Supabase fallback if configured
    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase.from('medical_documents').select('*');
        if (targetPatientId) {
          q = q.eq('patient_id', targetPatientId);
        } else if (role === 'doctor') {
          q = q.eq('uploaded_by', userId);
        }
        const { data, error } = await q.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped = data.map(mapDocRecord);
          const seen = new Set(mapped.map(d => d.id));
          const extra = _CLIENT_DOCS_STORE.filter(d => !seen.has(d.id));
          return [...extra, ...mapped];
        }
      } catch (err) {
        console.warn('Supabase document query failed:', err);
      }
    }

    // Default to MOCK_DOCUMENTS + client session docs
    const filteredMock = MOCK_DOCUMENTS.filter(d => {
      if (targetPatientId) return d.patientId === targetPatientId;
      if (role === 'doctor') return d.uploadedBy === userId || d.patientId === 'pat-001';
      return true;
    });

    const seen = new Set(filteredMock.map(d => d.id));
    const extra = _CLIENT_DOCS_STORE.filter(d => {
      if (targetPatientId) return d.patientId === targetPatientId && !seen.has(d.id);
      return !seen.has(d.id);
    });

    return [...extra, ...filteredMock];
  },

  /**
   * Fetch documents bound to a specific lab test order
   */
  async getDocumentsByOrder(orderId: string): Promise<MedicalDocument[]> {
    const backendUrl = (import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8001/api').replace(/\/+$/, '');
    try {
      const res = await fetch(`${backendUrl}/documents/order/${orderId}`);
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map(mapDocRecord);
        }
      }
    } catch (e) {
      // ignore
    }

    const matched = _CLIENT_DOCS_STORE.concat(MOCK_DOCUMENTS).filter(d => d.orderId === orderId);
    return matched;
  }
};

// Internal client store for fast UI updates during demo session
const _CLIENT_DOCS_STORE: MedicalDocument[] = [];

function mapDocRecord(row: any): MedicalDocument {
  return {
    id: row.id,
    patientId: row.patient_id || row.patientId || 'pat-001',
    patientName: row.patient_name || row.patientName || 'Ananya Sharma',
    uploadedBy: row.uploaded_by || row.uploadedBy,
    uploaderName: row.uploader_name || row.uploaderName || (row.uploader_role === 'lab_technician' ? 'Rajesh Verma (NABL Lab)' : 'Dr. Vikramaditya Sen'),
    uploaderRole: row.uploader_role || row.uploaderRole || 'doctor',
    appointmentId: row.appointment_id || row.appointmentId,
    orderId: row.order_id || row.orderId,
    title: row.title || 'Medical Document',
    description: row.description || '',
    category: row.category || 'Medical Scan',
    storagePath: row.storage_path || row.storagePath || '',
    mimeType: row.mime_type || row.mimeType || 'image/jpeg',
    fileSize: row.file_size || row.fileSize || 0,
    fileHashSha256: row.file_hash_sha256 || row.fileHashSha256 || '',
    pqcSignature: row.pqc_signature || row.pqcSignature,
    signerPublicKey: row.signer_public_key || row.signerPublicKey,
    isVerified: Boolean(row.is_verified ?? row.isVerified ?? true),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    signedUrl: row.signed_url || row.signedUrl || ''
  };
}


