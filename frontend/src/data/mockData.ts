import { Doctor, Appointment, LabOrder, MedicalReport, UserProfile, MedicalDocument } from '../types';

export const MOCK_USERS: Record<string, UserProfile> = {
  patient: {
    id: 'pat-001',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@example.com',
    role: 'patient',
    pqcPublicKey: 'XHEATMm9q3yZMcczu7oFfhzPxbg8uUwGvGY8LeKd2jDAFFKzJhxvMhZgzLeDZphYiYEJPzeC8HCYbeQ+JqcU22UkWVwfefNxWaQ8YfiCUVyR/2GwUJyMg5sVILNV72SeRvYX2lvMQ4VJr4CoTINX1ule6xY30NW80nC1LqyfKhFoFIcZtIuaLrR6WjuDtzPC0YaWakWYRAer0fM2ZESSXeku0FwQh6pfZmBwU2MobFPPEXAV3yS6vbcQ1BGcdDAXf5GjoqQojiVBDne1v0jJs5xXk0AGd7MgB0ZsgMpchMiLq4Kv90ihWQDB7PaUWOty3UMBpXy/tuNNr0qKaCBcSpbK/etqjlrCOHAfEbBIMCAht9GfY4AA2fmrFUFLS/WlmfOASobMZ8KIr4QL9DlqYjZNiCabd5BCdNgjxci0wokGmdISwhhyNHAtDKhPzbaV3BpyVJwtCZBJr6EZFtu1ngrIHApVsAMtGrCKfEREi/WaxOA13wU5mqob3oNjyzRhzFUJ3Xsp6GUv+cvIs6SGO7d9cWjDcMhuR3JlTURM8uowdOBt9zIJZ3zDerxcQii5DfNf2abJ3qFPxMXD/ZdjFPtpjSB/4Za/67BkADS0fydbO2ArxyQ7QgsRyxG36wdydmpfTgXAwXDJtzd53sg7PBKvboiWQXp/YEpNbDG/5LYCyRSrDPevd8KmqUQLdMUo7hiTHxEn46RqmLcGpgJR4MNuPnOg9VSZESOYacxGluMfwTwVbcZfsWE+5PLPhdi2vSEzSCEz46uCNuhjoUY4X/ynlFaulVRalfGQCfCacmtaZrLEmvx3Gqahw4IN8kEqx7KIRcmBn6gBFVwchLfERxA+klw8hyp2oESBC2ABVkCwexmwy7JFmDWAVkTPulzPOcM1NvBSBGmvz6IebcECdwHDd3yyjbq9qrRZDVB/u6ui1sFC9yUZhluXbWsTpDdvfwcedlq4w7y4y0oUGihGwYbPDWukqtJGgCNDWcVKFuVLg3nKKHOFYhbIPJcCJyzOOVAiWQOz2EtCKDiw50gSFmh1vMxn8fN8lxkjnrPKfms9EaNqwxx0N1AokAIgePEwgMcnClhnlgWKs6EBt+w9f2q4eLUwB5dHLiGrcaMrPcm1NNIHoMgSwFbGcBZOQ0giwtALyUg+CHMiFIwNnZDB3+IVoSxfijoNB3YWQDCDAjOYxwwWOXMXZnDEvTkCkitSEtsAICtc9RRXNrXM8QCVA/o+z4rJF/eNQjiuTKsy2/EF5/ydDOFui+EQUiynXAd/GhPI2TJR+7V/NlkAuHrCzCAF4rxpd+EzerU4gBJSfEeV7HlvyxhECZXBrZJDNZRZ4qaD+4yWDSk7KQGJZKCLqBqJjmXAxmAs5iMTiJMuL5MOoNqujtEnhnsHzai/JvHIxECvzYsYmGS0tIC5SclDrGhVeqN52xlrAE1euQGKGKGVnYzKPVZMOAaJ1fV4ziF3dToqZCQbhMd6FaOHiiVet2EUFgOiHykJnusZizE3jkq4ryp9YwqrekVjiCp//qmGHXgj34DFkU5FvIyOiFgFBxeV5kexQBahZbORFyIXvJo=',
    pqcDsaPublicKey: '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'
  },
  doctor: {
    id: 'doc-101',
    name: 'Dr. Vikramaditya Sen',
    email: 'dr.sen@metrohealth.in',
    role: 'doctor',
    department: 'Cardiology & Internal Medicine',
    licenseNumber: 'MCI-CARDIO-88421',
    pqcPublicKey: 'T1olsrcbk8QCaTOYPcUIU3CPaCGM5okHbeFNVjp8FmJMPmy8ZDgm4iRVEcuX95kK9fePk9gJYdwZgdJ9afyADSOP6LVLettc8ZWctdbHBfBKsyoB7JY5V3kKC8lFQUZgXLxpFTUJTuPJdvwUqUHFZWVgDhIRAKxcm1JRlXwpnVMBzQSPivNsCFrJsJZgXZGwm2MFz7ReLie1JRbGw2dlDPaAjAYE5EOJluqO/Yt0WBVs8kbNSpkJ/uebOGmyRBNRHzAVkJeyOvpTYgG9OkC2HQiET/k47jw5/pNP3OnNmKBA49hEDVtDB6xVzCAgLQSzDQOF81xdItQ90mVQ8va9b/GJoxpa/OV++3Ob7GBS9WIu2TEj5yUo1vY8UmS500oZKAGrzZYPJhoqHRZKNaKXU+c1BiiU9KMz0prHaIoP9gJK0qaYOdGTQ2iF8+Ba1McBmsPEIIxhg6Jlq2wrnlNuKMG2WyuqIWJUWoIzYPhtnTqfQAKC21qwReQr5Tx/K7fMOLp0jVUcxpevoJwcEiQtE5ZI5cm3KdpX7ClUzwU/uIRBgQqp+1fF1zpBqroHoDQWkkJxaKlB+1GScLtqltCep3cUEUe3wyNFmba8eCIAECIuLgh+b+lFc3Sz3PVKZ1AiaUgnNLF1a9Ia9ChnongolVIDvUGOFQO9tfGt6pB5+8YOIEw3CJIWAvwM8rUC9MpUbVGBJXRNc8IrwUjNbfu9+FtstBXMCJTCOpUAhtU3pUEiMHSkGbqdbcBBlByBHsYRFAeFXTg6r2IcFkzODQugiIx0cqOPUIrJaLxIZweAFKMxYRwylGPN9XCmiOxyAAMSN3bKkAeQcSaoHVCLTNdHpxq+KpoYyrtdpnVE3YuquvttnNhknHKIEFodKPqkH6s5anfApzlRG3TGv3peMfaDoYkDDAaUS9RvBfdMXnkoeKldxTc5B1YuP6BtfjWN1zJyPKprwCkUg0ugKNh2BLaTFPosrcimeJkbwJi6zxK6TeyD16s8d2MOY3ptCdCkbHHKsCCV0jOlk1wwaloWYHGKETJV9wQqvWaFDpRVbsFnGFFdkKzNfBGsnYJhznRc45wu0cmp2AXObYejiOuvYFWHRFY5BnIxUxE0PNVMbRFpdShm8tVu/mZuf6FAIPpG7TWdDMCUovmPzwoi1ze72WWr3yXOpKhU5Sp3CNAsWDFkQVlxfCdRyvUzCrBIunGvWDyzDdhjJxaDKNAD+bY5iUWEUooeHhxuXLFZNFpiA/aaY2FABpEifCYDVqx6r0AqfUzAa7OeO+QiNrSgDnOcuuwhFCZ7h2NyE2CcPdsmlNGsZgF88+o4IZVEqNJYfid9n2wD5luTaFo8qAhNsGFsgvyFofg7CTIqkeCXUIgaC+oGF+IOzuctFlplyQSTultDRLygQIFf7/ZtxRF+uWsuRPdU7vApcrk9LNisgTxlq/yxbnqCKaZUU0EQAzMIHferm3USsfaivWnPMYMgETIU8AM0YtNjtGirMATE7RzL52O3ysgtbAXDeyzOWhaebJvAm3tvE/2y56UORkL1SDP6XBZ3Hc1Z81qQuTtHxNBCIyRF70c=',
    pqcDsaPublicKey: '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'
  },
  lab_technician: {
    id: 'lab-301',
    name: 'Rajesh Verma',
    email: 'r.verma@diagnostics-core.in',
    role: 'lab_technician',
    department: 'Molecular Diagnostics & Pathology',
    licenseNumber: 'NABL-TECH-40912',
    pqcPublicKey: 's9nFySY+BMicdJV7ORcahnCJGcIN+LFR5aODnqMAIOqgbVysUXALQ7iwRqRKjLCOdhjHotco4ew6hvaHT8kvsQB9V2WkMetU6LMkoNfH+2K+x1S2Glq42wiCcEWhBpRZmhW8T1YsxNmIlYo7PFgOhetDaaiAtGggU1tIxBUHW8k+R6qxAWEQpgIPNvGd2cmCCtpDo2w/8/s4TTecWlMhSpwF3xszNEB4uRfOZYuprnfL2jipbEnB7wmLdIRAtEJY34oMcLFqmLDNOftp5DrPDnlOCWOqy3sjrayH8Tgd2vRSOXxe7mmi5mZsgnDOe5koTJUyWHUXcbN4PON2kckVd9BvaTt9EPCptVO2f+iucaa9h0gp/TWpFWkB4bhWmsdlNZiIuDtvnJqov/cJnoJ4wHVlWkeD0OC5zshXX4wgCThOcEls8JVZ+ya64Xo2FkshCFFevhYvXfEFtnM8W0Wo8MNP7vyg72RgvzQVsYkE6ko9Y8VNjqM4RkmCdOCbPtBufaI7vReHkaHOsZqVCAZrvsag2QxEG3s5hOEiuGMznLKYEaSkfLtiZSOhLzQ8ZXBdpXeSmvC5UMQKyspmd/rAh4NCytIwjYkbzwiFGKVeaxKMhPOUBPFDznWS2YRdQlcRyzGkBlci5VkwH7WUnoFaExw7CpeSekIGBZiOv8eZSBkAkuDOr8KB8iIttzpzHXGoN7i2hCTCKaI5yAlv0fhk1cIemqONVMx4cKVbSWeVDfqF+DqvjFqU04JoNckczYc4s/F0EmlrjXwOoibN5cs0DzREYKSJ3ysWQql7Gpc6UMWLTWWoX2nHSbtOyuJXWLJBf4Em5ZepAomT4QDFKUKQ3hZeBXuiLSxUULFDnXxvLzICN6kKTelbQ2yhZaNi4GZBWjIuG/BHjEGYZbVtkQM98Ayc0JlJs8qC0MuUzJIpr8BXjeBCJSSyKCAhP0qcfMuS52S6mEQvrCBOxdqHFpePhpS4+DBbastSVdS1w5IWu6YcJZC10xcqhxvNNQGO7QWS0+G63XgBBlAKama0LuR1AEfHCeSyRbx3SvxWAqPF6oEZb3Ub5fEKFbKOfUEkrnC5iJGqSElt+xoIlLcHbkKD/CiQNzSMuhsbWUpSAIqbO6oMn3oSX+jF8KciP1NJ3cc77/S8jtmWiuoF5SGnQkJVu+RMgcuYRJFB9TEQq1ATtFilhpdXvSRWtyUxdbCwfwSc/HnNqHnHkPfLvSV9+wJgrsCG1rtf3bV0S3PMeypxF7knqlgmIOO1WgXPgYokC9AbzEWMVaYHUEQemEvGI5p9RZAczjEunFqI+qZkaDKWSdRCWDqgWfy5Y+cYQepHY6kRDtTNVBjDMIijPusq6gEAwxSTMSWEkBJWrABgh3wlJ+grvXRFGwRh6FYft3IljwedxBbCOrgqIUVnUHZdA1EL3FlcVZpuIDlkgad3uUKJkxlU4jSIn0w5uXQ1BqetVWUAZvEEdMQaQRFqopnBK3tnI9F878lnHydqLoiWY0SOLBzAL/DMcAMIvoHB0CS5xMd6fAqbWUw1d+dcSkPvWmi8NY3W2TI3JIlyOrHOOyPR4H0=',
    pqcDsaPublicKey: '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'
  },
  admin: {
    id: 'adm-001',
    name: 'Suresh Menon (Lead CISO)',
    email: 'ciso.menon@metrohealth.in',
    role: 'admin',
    department: 'Hospital Information Security & Quantum Assurance',
    licenseNumber: 'CISSP-CISO-99014',
    pqcPublicKey: '/mCE47eKm7gmm5K+l3kmspGD7ZyvMsowq+VN6hpMtMIdOKGJopiy0kAgKMAmSVCLaPvBIiO54TGgPMJF3SOUatACenQRjsLDf1oyxMC3c5QOs/so9CyDrOKGq0t0W/llqXDOHrCN5pYlwwW32Wep4Il4bWE0hHJfulxJZPIj67oqXkdunNV5Z2tmGnwmtXBbMSjPUWmYDPYG3RfFW3oTUnPC46Wl56uTuLvNdLbEpbCD2ctHmTKe40KIGasECndUrpN2MWmZldSGh+E5hVdMw2kYfrgVI3mzpTOph1hsGCWsUPgEbBFevVHFSUakWmUXGFBwMzyxeMQn/fN7yJpC8SEVSVMcxLODZVXCq3WSQPdh2XkTlOO2t1tLPwtv7uCwmmdXFvOvCIUZBcaRYwVRiCshs7xI4QvIMlQixxdbOBJ3wltVkTGUalDOY3LAW1OIIAYp2ddUFMfHrTAIh8kOIoqBirkntBd6QPoG3jw/e7B8r2KdBgGGN/F8rVvNCDG2B1M4+YJZ4BsFfHgBzrSGrWYOEzam5ox6eskcq8h24WVgfJZUGGo7mvszg7Jvy0Nyc1zMiUPH5wOU85GeAezMNjmvw1nOysEcsSIoafq3jeS+UKbBaslWdzVdTBCx27N+e8ug1tIieoZ4ZNytJNwwcmBDtCgB9eimfwuk4xIlbcp1MRGtSKADZAd4x0sOccxADIxkROsxcNaXFoNSmsNT2pmzpOh5SfkIKhlsiMsYnBAxdqhWV3iWlGMrXHWHDZFK8HmGQcE1QFYZAeR+sJtEJkkgCuCjknVpeYaJwFgbZegNycLFAyAp7hgbDtirPHMAPaeOimos+bYumoR+pxBzfwGC8/MlSyzIAHDLnoOp1FFbo9qYIpq2ngkQ1LPJC/VF2BmB8iFMCJM0eWie4WpMVsd7F4BqO9EoJEVnnalhL+yvnobIPaaU5AYW0rFs07HCQ9uxRvwLQbkkholl+kB30klROuSrleXM+7TE0xeW+tx61tUSlmI9YVUmy0F/4xSCTuwF2MQedZJjAHmKiRGd83ZfX8UNbKjC5lRz4fmv34prESikhaQif3A5VYjB6PsgsrtOzig8LFczXTM1uCsvuqFLnIIJQFYhJ9Csgck6DWSrbaCqV+QXPdEDlUujy1gFVfR/mvudL5jPCSiYQYBF47Q5qdyQ/PsFcxRRzhKyuieXHcVW5IeVWEVtT9UXsciwokDDy2eRbjJGQFTEFsJU3Xgq++GBOxnNBFxV8jR5jTBl0GcwrJSzZneilrJicbyO2QUioPypgyezB4EB0NCPMRIoSesBAzFLE+Q6A1sTBXwVgJsCSNRwZsgtlKgiK4g4nafOJZFFtdmSvepT6qTJBfCi39eRAWUyAZyHy6QGmTZAl4HCIfmGU9JbGQknuSUF/Ta3YBITWkJku9emFmZOAAYJOJW88AIc/YapxobNr/qQXJd/ZpiHhfGswuor79hBRaGymxwL2QxBCxMIVelqzgS1jGE5rHF1D2lVL8i5nPukY4Z5M+LEjLyca/TFoMQgcuzMh5uL7P0Z/evAlp975aIP85+124fZONmChW3Rj6Q=',
    pqcDsaPublicKey: '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'
  }
};

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'doc-101',
    name: 'Dr. Vikramaditya Sen, MD, DM',
    specialty: 'Senior Cardiologist & Interventionalist',
    department: 'Cardiology',
    experienceYears: 18,
    hospital: 'Apex Quantum Multi-Specialty Hospital',
    rating: 4.9,
    reviewsCount: 342,
    availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
    consultationFee: '₹1,200',
    pqcKeyFingerprint: 'SHA256:7f4a...9c1e (ML-KEM-768)',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'doc-102',
    name: 'Dr. Priya Nambiar, MD, DNB',
    specialty: 'Endocrinology & Metabolic Disorders',
    department: 'Endocrinology',
    experienceYears: 14,
    hospital: 'National Institute of Medical Sciences',
    rating: 4.8,
    reviewsCount: 289,
    availableDays: ['Tue', 'Thu', 'Sat'],
    consultationFee: '₹1,000',
    pqcKeyFingerprint: 'SHA256:1a82...3f80 (ML-KEM-768)',
    avatar: 'https://images.unsplash.com/photo-1594824813511-55ff358e0a29?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'doc-103',
    name: 'Dr. Arvind Swaminathan, MD, FRCP',
    specialty: 'Clinical Hematology & Oncology',
    department: 'Oncology',
    experienceYears: 22,
    hospital: 'Metro Advanced Research Hospital',
    rating: 5.0,
    reviewsCount: 415,
    availableDays: ['Mon', 'Tue', 'Thu', 'Fri'],
    consultationFee: '₹1,800',
    pqcKeyFingerprint: 'SHA256:d891...44bc (ML-KEM-768)',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'doc-104',
    name: 'Dr. Sunita Kulkarni, MS, MCh',
    specialty: 'Nephrology & Renal Transplantation',
    department: 'Nephrology',
    experienceYears: 16,
    hospital: 'City Life Super Specialty Hospital',
    rating: 4.7,
    reviewsCount: 198,
    availableDays: ['Wed', 'Fri', 'Sun'],
    consultationFee: '₹1,400',
    pqcKeyFingerprint: 'SHA256:e104...77d3 (ML-KEM-768)',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80'
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-501',
    patientId: 'pat-001',
    patientName: 'Ananya Sharma',
    doctorId: 'doc-101',
    doctorName: 'Dr. Vikramaditya Sen',
    department: 'Cardiology',
    scheduledFor: '2026-10-30T10:30:00Z',
    status: 'confirmed',
    reason: 'Follow-up on cardiac stress markers and post-quantum lipid panel'
  },
  {
    id: 'apt-502',
    patientId: 'pat-001',
    patientName: 'Ananya Sharma',
    doctorId: 'doc-102',
    doctorName: 'Dr. Priya Nambiar',
    department: 'Endocrinology',
    scheduledFor: '2026-11-04T15:00:00Z',
    status: 'requested',
    reason: 'Consultation for endocrine biomarker stability evaluation'
  }
];

export const MOCK_LAB_ORDERS: LabOrder[] = [
  {
    id: 'ord-8801',
    patientId: 'pat-001',
    patientName: 'Ananya Sharma',
    doctorId: 'doc-101',
    doctorName: 'Dr. Vikramaditya Sen',
    labTechnicianId: 'lab-301',
    labTechnicianName: 'Rajesh Verma',
    testType: 'Cardiac Troponin I & High-Sensitivity CRP Panel',
    priority: 'urgent',
    clinicalNotes: 'Evaluate subtle micro-ischemic changes with post-quantum confidentiality protection for genomic markers.',
    status: 'completed',
    createdAt: '2026-10-27T08:15:00Z'
  },
  {
    id: 'ord-8802',
    patientId: 'pat-001',
    patientName: 'Ananya Sharma',
    doctorId: 'doc-102',
    doctorName: 'Dr. Priya Nambiar',
    labTechnicianId: 'lab-301',
    labTechnicianName: 'Rajesh Verma',
    testType: 'Next-Gen Endocrine & Thyroid Molecular Profiling',
    priority: 'routine',
    clinicalNotes: 'Screening for antibody-mediated resistance. Encrypt report with doctor and patient ML-KEM public keys.',
    status: 'in_analysis',
    createdAt: '2026-10-28T09:40:00Z'
  },
  {
    id: 'ord-8803',
    patientId: 'pat-002',
    patientName: 'Kavita Menon',
    doctorId: 'doc-101',
    doctorName: 'Dr. Vikramaditya Sen',
    labTechnicianId: undefined,
    testType: 'Complete Blood Count & Coagulation Profiling',
    priority: 'stat_emergency',
    clinicalNotes: 'Emergency pre-operative evaluation. Stat turnaround required.',
    status: 'pending',
    createdAt: '2026-10-28T13:10:00Z'
  }
];

export const MOCK_REPORTS: MedicalReport[] = [
  {
    id: 'rep-9901',
    orderId: 'ord-8801',
    patientId: 'pat-001',
    patientName: 'Ananya Sharma',
    doctorId: 'doc-101',
    doctorName: 'Dr. Vikramaditya Sen',
    technicianId: 'lab-301',
    technicianName: 'Rajesh Verma (NABL Certified)',
    testTitle: 'Cardiac Troponin I & High-Sensitivity CRP Panel',
    specimenType: 'Venous Whole Blood (Serum separator)',
    createdAt: '2026-10-27T16:45:20Z',
    decryptedData: {
      summary: 'Troponin-I within normal baseline (<0.01 ng/mL). hs-CRP slightly elevated at 2.4 mg/L indicating mild systemic inflammatory response.',
      biomarkers: [
        { name: 'High-Sensitivity Troponin I', value: '0.008', unit: 'ng/mL', referenceRange: '0.000 - 0.040', flag: 'normal' },
        { name: 'hs-CRP (Cardiac Risk)', value: '2.40', unit: 'mg/L', referenceRange: '< 1.00 (Low Risk)', flag: 'high' },
        { name: 'BNP (B-Type Natriuretic)', value: '45.2', unit: 'pg/mL', referenceRange: '< 100.0', flag: 'normal' },
        { name: 'Serum Creatinine', value: '0.85', unit: 'mg/dL', referenceRange: '0.60 - 1.20', flag: 'normal' },
        { name: 'eGFR', value: '98', unit: 'mL/min/1.73m²', referenceRange: '> 90', flag: 'normal' }
      ],
      clinicalImpression: 'No evidence of acute myocardial injury. Recommend lifestyle interventions for mild inflammatory elevation.',
      recommendations: 'Repeat hs-CRP test in 6 weeks. Maintain balanced diet and 150 mins weekly cardiovascular activity.'
    },
    cryptoEnvelope: {
      algorithmKem: 'ML-KEM-768 (NIST FIPS 203)',
      algorithmSymmetric: 'AES-256-GCM (NIST SP 800-38D)',
      algorithmSignature: 'ML-DSA-65 (NIST FIPS 204)',
      ciphertext: 'k3nRoJFdUQ7621QmAb/qe80nNrHy1l81sYVrbwn/hUGcyGfgMdMCqnX8fpaRIJ2VHFDAYABVQhn4AC9aZpNepPrgyM1fL1lGuD5nbu4MqgzcnLjD3XL+MQlP1b1DWe9fGOE8ekDV0CWwbXlcQ7ajr7mIu5XZ6D3u2xto18TaVuB4BoTmR6OaOsrgiGuA+04BjpEzteIe1b6nyUg0bTG9f8aAL8pSgqQEKKG1MowYoNyj6yMCqc8bAXxLta9tDHlpo+Bm4L3+R2FHosyFbSHP2YwAxaBm2F8IrTurNPe8iJhpmLu5XZbp2Hlp6/HWgsI8Nny4gyb1HBqaMpIi6oPxPxJswRGdBn3S84GaAvrqemXtief3Gzy2FhBRxHIEiAq1L0y3lzwCw9GC+CNnyflZkdvG9JVvr1zjmbEhVgLW5n04EInlexCAumewBjF2aQ/zAw6d8tForV/KODGJlH+b8FeVSWtzW+XlG9q3t8YDGg0QQtQp/3WYhpr88x+SVhGxCeKyBzZR+NjmLty+lhBqDBj44nK+YDmuFY0uHypA8zUo9hwd3Z8f+Q9ALa7N4yF1NjCW2XZvqI9p286Q4j3oRfRXDEpA0B/YiBXtLFniWu9YApojowWfodfWW6KCDTQ/+Y8clepFkggHwcLBanpBomQfYUaHR/Yuky8irgw8XT6Ux4jzfp741HOolkjbeyfoQQ4HeEstDNa3cL4m3YX5XJsgy5gAN/Cx4vcz0nipeqigvutsUk4nVGAaoITK6eZsg88Wj5DQxVjSDoUSZGK+hgpC2hmrRS+BI0nW7gRmJgJA9oHzPqnLfvaRdkK79JBu4H0WrbzcZNPMqK1Jubvi8eADQwPcY7GbSgDeIynXCMtaSniMV1TLqWGrGQh9ePTceJ4GMaamvgLqRqBH3OqoJRJ8IxRpL6kTO0KTmULjhoyjbKsgQ0xcU9idse7aN0eY10psYwFwXOIUnJ01QjLq4jSE4QNtzHvuCcI+XxdkBPfQgZgIJ1W4YAWTdGeQPyZke0mp+Un+IvRvH7p+AuTOdPle3GfYubbHqLSxejEqUr6sFhFFw2u/Dr/FkZ4UhfFJ1nU88BnybbXcDxLbDVA/4LVq14EMPOxOnCnSw7SuT/ScMcKxiE9avdaPxcL14Haiamdongr3J0e3E4Ad3Xu7kg3n8SHxY59nh2ctNMPVm+HfovXFtgh7Da0mFFkvIYEgMvVissZrKqFyn+8VUf7pD0YkZAh552azccJp+o+DR7nMTvX/ezYZJ78o',
      iv: 'hv0Iv3u00wthnBKXfZGN+w==',
      authTag: 'sI7oenQV5RUfT/r7KleSuA==',
      kemCiphertextDoctor: 'XR2met6eXn24koRtYzSZPzAsSjzacG0vDhEfFZVmN0Uci6aB2yuSIyGO5dy4eH+M9aTvG4zaH0/1ahLZFzEYV7KVv3kqaC1bKyuWbhDzzRfjnHrp2VH9cgSDSTJAXuInKfX42lGDMdBeulotCR3KofytPb8FRVVi3WujJ8fB9TOsb0BRYsEi9TSLBAG5NtXWXHM06MsYLz3L+uGhN5uVhUrho1VNp8hw1qaTDB8HsyKFHUAHF+dRm/iWemp7F+g2DiELdjvKVFSxuKWmytA471+8Lww4desdigauq09+bKs8/q/FhQehPVGniDEtlip32PjP64/K38fmxytyoAgxwhsxi5p9mZq0qzy5jvPPwUT4lJe9y6eu38CkeUw6nchuWawpgZin6GrbQmMes4Oo/l47IAYXvKfUrTfnmrAQaKbX52HakUbY5Dh0s/UJ0amJuCLbD2S3SMUVMzduzCipvlSN7oIuWJQHBdXcvFigWgrk76pmBSliTYSFSpc9vx71sub6c/d8oI+clDecmb32uXJvwLppWoRVWD5Ufu43ag2Cdr7G7fFFsW3/obAXaUmDMitS+YgZYv2FANFK34ygBSp7MxXiRNoCvT2Bgjaq2o4ILqPIQoqe4WORX5uCyfjmFPRNY5jQMPfD+YWauvNWwWN27YKidxhM6s0IIqsp1sidFw3ohr6aajiyLut7WhZrbRcuDMutIEfY1n7Lcd0cLKr9ogjc2jp6dXnP1eCsFV/Ua5kIC6we+265gChhEms4PKOa4b4/afsoXjPqfBZA6bCO7qJ+DC5ZSNm/Z/P636A2uUJFz8C+Zc+bFERPVLT+QMpwzD21PBCmCDQZslrSHma9ID6PJri3AjfcK9B89eT8zZJavozqok4KGJrzxyYNnLNTglAeAB8G2MRib+kmrJQSMRQXB16o1eHQRFb8CWJ0u6svJm9AuZysxvrDyAAKKAzuh35ZcHaqOjrC31ZnJrBayHxFxyqo8D3eCTYp2rPalpDqfZ/fCZ1T8sfddDKSzxwVzK6VjTavaCqLlVEmHb2S6396fwDiyDaE1Lj5XJPAxWnJtsINhyJPctBnxGxmN/NpuOGLpKnQvQVSBmYEUyag4Of0wSogcYPTbp48G2um1JjRwomGMGPgpZmo4jcF3LJnxkIZ0/632Y1p+GtT+h7zBhqNcZEZCbTsgI7bfuwK3oktzJHoDuuF+EddsrjWguBMMiu65HrScgs8fPxtrTRRRr9t6qz796S99eTQyJuxklWqkQ/hE3bbcdTo/cmD/CCAul1ARqNkHksu7O45fiHGaPrykAEgKcs3w/Dyowv6xa1w3iSXPFTgu5eP/5lb6YMOhBFxZd6il8M7LUJhkOLwDa/CGBAs+zvENul5SFoynj0VSXj7uRWBJR+ThwcfnMItz9QDVfZ3Qmo/Gz2JrczT4ICqMa3OV5ZSfJfxuFY=',
      kemCiphertextPatient: 'XR2met6eXn24koRtYzSZPzAsSjzacG0vDhEfFZVmN0Uci6aB2yuSIyGO5dy4eH+M9aTvG4zaH0/1ahLZFzEYV7KVv3kqaC1bKyuWbhDzzRfjnHrp2VH9cgSDSTJAXuInKfX42lGDMdBeulotCR3KofytPb8FRVVi3WujJ8fB9TOsb0BRYsEi9TSLBAG5NtXWXHM06MsYLz3L+uGhN5uVhUrho1VNp8hw1qaTDB8HsyKFHUAHF+dRm/iWemp7F+g2DiELdjvKVFSxuKWmytA471+8Lww4desdigauq09+bKs8/q/FhQehPVGniDEtlip32PjP64/K38fmxytyoAgxwhsxi5p9mZq0qzy5jvPPwUT4lJe9y6eu38CkeUw6nchuWawpgZin6GrbQmMes4Oo/l47IAYXvKfUrTfnmrAQaKbX52HakUbY5Dh0s/UJ0amJuCLbD2S3SMUVMzduzCipvlSN7oIuWJQHBdXcvFigWgrk76pmBSliTYSFSpc9vx71sub6c/d8oI+clDecmb32uXJvwLppWoRVWD5Ufu43ag2Cdr7G7fFFsW3/obAXaUmDMitS+YgZYv2FANFK34ygBSp7MxXiRNoCvT2Bgjaq2o4ILqPIQoqe4WORX5uCyfjmFPRNY5jQMPfD+YWauvNWwWN27YKidxhM6s0IIqsp1sidFw3ohr6aajiyLut7WhZrbRcuDMutIEfY1n7Lcd0cLKr9ogjc2jp6dXnP1eCsFV/Ua5kIC6we+265gChhEms4PKOa4b4/afsoXjPqfBZA6bCO7qJ+DC5ZSNm/Z/P636A2uUJFz8C+Zc+bFERPVLT+QMpwzD21PBCmCDQZslrSHma9ID6PJri3AjfcK9B89eT8zZJavozqok4KGJrzxyYNnLNTglAeAB8G2MRib+kmrJQSMRQXB16o1eHQRFb8CWJ0u6svJm9AuZysxvrDyAAKKAzuh35ZcHaqOjrC31ZnJrBayHxFxyqo8D3eCTYp2rPalpDqfZ/fCZ1T8sfddDKSzxwVzK6VjTavaCqLlVEmHb2S6396fwDiyDaE1Lj5XJPAxWnJtsINhyJPctBnxGxmN/NpuOGLpKnQvQVSBmYEUyag4Of0wSogcYPTbp48G2um1JjRwomGMGPgpZmo4jcF3LJnxkIZ0/632Y1p+GtT+h7zBhqNcZEZCbTsgI7bfuwK3oktzJHoDuuF+EddsrjWguBMMiu65HrScgs8fPxtrTRRRr9t6qz796S99eTQyJuxklWqkQ/hE3bbcdTo/cmD/CCAul1ARqNkHksu7O45fiHGaPrykAEgKcs3w/Dyowv6xa1w3iSXPFTgu5eP/5lb6YMOhBFxZd6il8M7LUJhkOLwDa/CGBAs+zvENul5SFoynj0VSXj7uRWBJR+ThwcfnMItz9QDVfZ3Qmo/Gz2JrczT4ICqMa3OV5ZSfJfxuFY=',
      pqcSignature: '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',
      signerPublicKey: 'ZRMc9lc5pZtoNlMPatbw+G/syBG3aard6T8ezt+WZzImZzRkF+ONmSP9N3LoSyQwV1KzkbsDDygJNAX9N/0ygQi0XZ6/UuEyb5RopvbMrly/qEAl/qlxc16ihxJXQLvdQCN5T/NRIngAftKSFua3HIlb6JlP8WFef99n/uUpPPfu3se6DfXDl7ySDqBLYrLWGHDO9UOH0kta1HxV+ZihPsjIY6UNwRRYRfDGTw9TJnJrJFvEuPSyIfOTipJqeCTvRPbtir3Z5cb9c2QfqXMKaNNYFhCG37OvWXpBz2s3+kC7dx5Rk70CbOzbapwbig0RWRiUU9fumg+8P4K6Vx+bXrIoC/tbNQ+b/ROyteZ8FF21/eJchWyIsCG8ZvbNMTFTGuxbUIcuB2h1zZoleC1ZBqRrgUgEm2zcvTp0AJ33GyJ/c4dQ2g2G8TDfDiUiF9GhxphW/PQkY5GSIlstCPbrzW5Fq9uc4Dqw9ZVqxjwGP6mGo/K4j98ahIfNYp5JVldDV8UaV7I7i3Gs6keFRddxYxW+JTzrwd5vW69ARCGuyWxeGGJV4/sFFq+D8Ap2q4R0inos+x0aSuqXXf//poEi8R9619opArzzY+yAY9k2Y3xaOVYRbvCr9qIrBx31diR4wCtGf9X5tSCcsEc7LYEizndXnySKmKS/MCR+kYU8Jx+a8sJvVs9Y+r88ZQQ2eVaA8kqUBq9b95I8NVhVD4hR/3b3+KHCXmoGEbvWwdPFZ6tKXkz77QXa7eHFwIAqkEZEY2S6tTRzjWctgfTFDLlPtenTdmApFu9n/L9RjMZRGRXujUoYY5TDpa2MEi6j3fKVyQ0tQ9S7dhlx24KmV9NbguhsxSfLIazS8q4NXZOyFL2awqdS5BIWzv5aYQLi0VpPMWE5hc+8ropsaNYW3LKEWfo0h1lkBOR6gVIe2BJuWVQftbvDkyPCuaU3icqdWx0B80be7r3rzERPov3BzggAheYZwZjW38WqD+wU2E8iKrn0wZxbN5cCeKdiLHcBOrlk0dC1L1afgnYlqM1vUsIUJuYMiDZ3ISI1YAFn0VEplFnQ4SuL5fxBWhp0Gev7M+H6mUJxmL61sLGSaAtHm+smeOUZ2eCn2zuETvJQPggLRHlrYecHRNZ0Ets+hGIZFWkwJ41M9i5YebAwKwsTyVRr3tStnXL18Y+cDIJC3tPZMX5UuiTCIqGaJaKMvn6YWFUlSaUYFUrbgABFOaSebnr5NNmHXF/Pau3NnrcyspWEuUNdhC0DJ4ccDSt+HYOdxqnjXtiyzZ/ZA+rOJl0FkIVEQLY9feVRd5yK1Cq05G7k6yV9pxbYZduKv8+mRVUm4b/oxadK/THOAzZlttvixeZYHy91gmSxo56YUTG4UTV1JvQj7s0UE4jTVFbmoZqeg4xqLaa/dSQIctguQn7fx9hi5ZNxVOnN78lcCITHrpByn/9zaF2Zkd6slSBwtA77RpmpMqhhtTl1H6C4tru6t0RY3F3+rjD1XBX3vrRSYMh4ZPZfOLsRzK4C+Q4klEvSNVHVkmvOt6E8SjdNm3UKm2qmSoyKTqGZKbvzAaEgk2vRD6QIHhxKNY+lgKEHsUHkEeXwMMPsz2A2s+yn6/G6hb3iUObQ+DXUqn43rpdWQlk0UFG6vu0IMRMTKfpOa3zQQ+WfCZ5mz9KBbMJMhb2da9e/8R/d4q0fYEliorVTdd41EFXe2sWgkVSv5gAp5qXDoUngvcyw3c3uvqRKCD+Wn4vEwwEUETn5ANYBq/MMLETjpUfAffdsihrcGAEbAC4kEArs0SFscgFOBfk8oCIZqRVWECe/Wl8jcLIB7TAsgcsZdzTK8od+nZpJcPXs9i6AvSnz5sl0lCO8VlJ5K6YkEEH9f3CJ9uiUdaywhYykAcsdVLjB4hlHV1Q4aLXmbQuRJSYe48SwNA2qIZawNiixF6PsehVcC4jCbYYIEvb7FXpMa2T4K1zqWQwqbGevOzjoLb01BmBKCAFnGkgMl5tIAJXdqwr39KXcYArbyP3eznuLkUofqdq9YAguPlrDeclvx8bj+Lr1Fl5y21xIhqRic9ZzpZeI2cp/OVP4r54EHanJlxcxDGma8rYEuKasgOxZN7UhZMJPMVc8bOObjwiLTu/KG1k4PR5wbvvvmzcDRoRBAXhTgw7LpUrDHzSLOJZTVnqDRb3RzgVWNuaQTqiOERKGzY6Zg+YVhxvzLqGruWI5UkmAjdu0g2HQ9ihst96PyzwLYar4t8obftEwkXTlXxSCn9eDfIv4Kn5/Yo6jMVuWhb0+C3gfYhH4qBZhmg9I0KUisTTmXxFB18/cK21Qkm5U5LWuds48MXOI8rau7d88HfjrkbqfHhOKTiD4D5fXPyLzGOeoWGlELt6mcPBsjHsZPMNigVLRyqegyNfj+tD78I2gv6G8KetWZP6HXoQu3UQobKwVRfayqdBZ33depo3NzXeXLWIYsfR+Hic9rv+MD8hoAlwMlWbI5OHJCEA/sXdQIXZ224NWSDE6kQfitvHqhR8zAlnuHrnk+0hWuwioaa2uGMU/DPKDtjTBRjwSZY5XzxFO39uTQ4MS4mJ4WZVSOGcXelIhDmAiHwkTBFHWcnM=',
      associatedData: 'rec_id:rep-9901|sender:lab-301|recipient:pat-001|ts:2026-10-27T16:45:20Z',
      verified: true
    }
  }
];

export const MOCK_DOCUMENTS: MedicalDocument[] = [
  {
    id: 'doc-scan-001',
    patientId: 'pat-001',
    patientName: 'Ananya Sharma',
    uploadedBy: 'doc-101',
    uploaderName: 'Dr. Vikramaditya Sen',
    uploaderRole: 'doctor',
    appointmentId: 'apt-001',
    title: 'High-Resolution Cardiac Echo & Doppler Scan',
    description: 'Transthoracic echocardiogram imaging showing normal ventricular ejection fraction (64%) and clear pericardium.',
    category: 'Medical Scan',
    storagePath: 'patients/pat-001/doc-scan-001.webp',
    mimeType: 'image/webp',
    fileSize: 428010,
    fileHashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    pqcSignature: 'MLDSA65_SIG_DOC_SEN_88120fa49b8109337ba12c',
    signerPublicKey: 'MLDSA65_PUB_DOC_SEN_11a87c',
    isVerified: true,
    createdAt: '2026-10-27T10:15:00Z',
    signedUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'doc-rx-002',
    patientId: 'pat-001',
    patientName: 'Ananya Sharma',
    uploadedBy: 'doc-101',
    uploaderName: 'Dr. Vikramaditya Sen',
    uploaderRole: 'doctor',
    appointmentId: 'apt-001',
    title: 'Digital Post-Consultation Prescription & Regimen',
    description: 'Signed digital prescription for cardioprotective therapy: Atorvastatin 20mg & Ramipril 2.5mg OD.',
    category: 'Prescription',
    storagePath: 'patients/pat-001/doc-rx-002.webp',
    mimeType: 'image/webp',
    fileSize: 312450,
    fileHashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    pqcSignature: 'MLDSA65_SIG_DOC_SEN_772091bbcd331002aa90',
    signerPublicKey: 'MLDSA65_PUB_DOC_SEN_11a87c',
    isVerified: true,
    createdAt: '2026-10-27T11:30:00Z',
    signedUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'doc-lab-003',
    patientId: 'pat-001',
    patientName: 'Ananya Sharma',
    uploadedBy: 'lab-301',
    uploaderName: 'Rajesh Verma (NABL Certified)',
    uploaderRole: 'lab_technician',
    orderId: 'ord-8801',
    title: 'Pathology Blood Chemistry & Biomarker Assay Sheet',
    description: 'NABL-accredited laboratory bench readout for Cardiac Troponin-I and serum electrolytes with calibrated control run.',
    category: 'Blood Test',
    storagePath: 'patients/pat-001/doc-lab-003.webp',
    mimeType: 'image/webp',
    fileSize: 512800,
    fileHashSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    pqcSignature: 'MLDSA65_SIG_LAB_VERMA_9921b7782100ae',
    signerPublicKey: 'MLDSA65_PUB_LAB_VERMA_9921',
    isVerified: true,
    createdAt: '2026-10-28T14:20:00Z',
    signedUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80'
  }
];
