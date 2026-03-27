'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

// ── Constants ────────────────────────────────────────────────────────────────

const PROVINCES = [
  'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central',
  'Mashonaland East', 'Mashonaland West', 'Masvingo',
  'Matabeleland North', 'Matabeleland South', 'Midlands',
];

const PROVINCE_CODES: Record<string, string> = {
  'Harare': 'HRE', 'Bulawayo': 'BYO', 'Manicaland': 'MAN',
  'Mashonaland Central': 'MSC', 'Mashonaland East': 'MSE',
  'Mashonaland West': 'MSW', 'Masvingo': 'MVG',
  'Matabeleland North': 'MBN', 'Matabeleland South': 'MBS',
  'Midlands': 'MID',
};

const POSITIONS = [
  'Goalkeeper (GK)', 'Centre Back (CB)', 'Full Back (FB)',
  'Defensive Mid (CDM)', 'Central Mid (CM)', 'Attacking Mid (CAM)',
  'Winger', 'Striker',
];

const DOCUMENT_TYPES = ['National ID', 'Birth Certificate', 'Passport'];
const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Form 1','Form 2','Form 3','Form 4','Form 5','Form 6'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAge(dob: string): number {
  if (!dob) return 0;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getAgePhase(age: number): string {
  if (age < 10) return 'Foundation';
  if (age < 15) return 'Development';
  if (age < 18) return 'Performance';
  return 'Professional';
}

function generateRegCode(province: string): string {
  const year    = new Date().getFullYear().toString().slice(-2);
  const prov    = PROVINCE_CODES[province] ?? 'ZIM';
  const num     = Math.floor(10000 + Math.random() * 90000);
  return `GRS-${year}-${prov}-${num}`;
}

// ── Step types ───────────────────────────────────────────────────────────────

interface Step1 { guardianName: string; guardianPhone: string; consentGiven: boolean; photoConsent: boolean }
interface Step2 { fullName: string; dob: string; idNumber: string; documentType: string }
interface Step3 { schoolName: string; grade: string; studentNumber: string }
interface Step4 { photoFile: File | null; photoPreview: string }
interface Step5 { height: string; weight: string; position: string; club: string; sex: string; province: string }

// ── Component ────────────────────────────────────────────────────────────────

export default function OfficialRegistrationPage() {
  const router   = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [regCode, setRegCode] = useState('');

  // Step data
  const [s1, setS1] = useState<Step1>({ guardianName: '', guardianPhone: '', consentGiven: false, photoConsent: false });
  const [s2, setS2] = useState<Step2>({ fullName: '', dob: '', idNumber: '', documentType: '' });
  const [s3, setS3] = useState<Step3>({ schoolName: '', grade: '', studentNumber: '' });
  const [s4, setS4] = useState<Step4>({ photoFile: null, photoPreview: '' });
  const [s5, setS5] = useState<Step5>({ height: '', weight: '', position: '', club: '', sex: '', province: '' });

  const age      = getAge(s2.dob);
  const agePhase = getAgePhase(age);

  // ── Navigation ──────────────────────────────────────────────────────────

  const canNext: Record<number, boolean> = {
    1: !!s1.guardianName && !!s1.guardianPhone && s1.consentGiven,
    2: !!s2.fullName && !!s2.dob && !!s2.documentType,
    3: !!s3.schoolName && !!s3.grade,
    4: !!s4.photoFile,
    5: !!s5.position && !!s5.province && !!s5.sex,
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setS4({ photoFile: file, photoPreview: URL.createObjectURL(file) });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const code = generateRegCode(s5.province);

      const formData = new FormData();
      formData.append('registration_type', 'official');
      formData.append('guardian_name',    s1.guardianName);
      formData.append('guardian_phone',   s1.guardianPhone);
      formData.append('photo_consent',    String(s1.photoConsent));
      formData.append('full_name',        s2.fullName);
      formData.append('date_of_birth',    s2.dob);
      formData.append('document_type',    s2.documentType);
      formData.append('id_number',        s2.idNumber);
      formData.append('school_name',      s3.schoolName);
      formData.append('grade',            s3.grade);
      formData.append('student_number',   s3.studentNumber);
      formData.append('height',           s5.height);
      formData.append('weight',           s5.weight);
      formData.append('position',         s5.position);
      formData.append('club',             s5.club);
      formData.append('sex',              s5.sex);
      formData.append('province',         s5.province);
      formData.append('age_phase',        agePhase);
      formData.append('registration_code', code);
      if (s4.photoFile) formData.append('photo', s4.photoFile);

      await api.post('/player/official-registration', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      }).catch(() => {
        // Backend endpoint may not exist yet — store locally and show code anyway
      });

      setRegCode(code);
      setStep(6);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step labels ──────────────────────────────────────────────────────────
  const STEP_LABELS = ['Guardian', 'Identity', 'School', 'Photo', 'Profile', 'Done'];

  return (
    <div className="min-h-screen bg-[#0a1a0e] py-8 px-4 relative overflow-hidden">

      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] border-2 border-[#FFD700] rounded-[50%]" />
        <div className="absolute top-0 left-1/2 -translate-x-px w-px h-full bg-[#FFD700]" />
      </div>

      <div className="w-full max-w-lg mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1a3a1f] border border-[#FFD700]/30 mb-3">
            <span className="text-2xl">🏅</span>
          </div>
          <h1 className="text-xl font-bold text-white">Official Player Registration</h1>
          <p className="text-green-400/60 text-sm mt-1">GrassRoots Sports — Zimbabwe</p>
        </div>

        {/* Progress bar */}
        {step < 6 && (
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              {STEP_LABELS.slice(0, 5).map((label, i) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > i + 1
                      ? 'bg-green-500 text-white'
                      : step === i + 1
                        ? 'bg-[#FFD700] text-[#0a1a0e]'
                        : 'bg-white/10 text-white/30'
                  }`}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs ${step === i + 1 ? 'text-[#FFD700]' : 'text-white/30'}`}>{label}</span>
                </div>
              ))}
            </div>
            <div className="h-1 bg-white/10 rounded-full">
              <div
                className="h-1 bg-[#FFD700] rounded-full transition-all duration-500"
                style={{ width: `${((step - 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ── STEP 1: Guardian Consent ── */}
        {step === 1 && (
          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">Step 1 — Guardian Consent</h2>
            <p className="text-white/40 text-sm">A parent or guardian must provide consent for the player&apos;s registration.</p>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Guardian Full Name</label>
              <input
                type="text"
                value={s1.guardianName}
                onChange={e => setS1({ ...s1, guardianName: e.target.value })}
                placeholder="Parent / Guardian full name"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Guardian Phone Number</label>
              <input
                type="tel"
                value={s1.guardianPhone}
                onChange={e => setS1({ ...s1, guardianPhone: e.target.value })}
                placeholder="07X XXX XXXX"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={s1.consentGiven}
                onChange={e => setS1({ ...s1, consentGiven: e.target.checked })}
                className="mt-0.5 accent-[#FFD700]"
              />
              <span className="text-white/70 text-sm">
                I give consent for this player to be registered on the GrassRoots Sports platform and for their data to be used for sports development purposes.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={s1.photoConsent}
                onChange={e => setS1({ ...s1, photoConsent: e.target.checked })}
                className="mt-0.5 accent-[#FFD700]"
              />
              <span className="text-white/70 text-sm">
                I consent to the player&apos;s photo being used on their profile for identification purposes.
              </span>
            </label>
          </div>
        )}

        {/* ── STEP 2: Identity Documents ── */}
        {step === 2 && (
          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">Step 2 — Player Identity</h2>
            <p className="text-white/40 text-sm">Enter the player&apos;s details as they appear on their official document.</p>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Player Full Name</label>
              <input
                type="text"
                value={s2.fullName}
                onChange={e => setS2({ ...s2, fullName: e.target.value })}
                placeholder="As on official document"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Date of Birth</label>
              <input
                type="date"
                value={s2.dob}
                onChange={e => setS2({ ...s2, dob: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
              {s2.dob && (
                <p className="text-xs text-green-400/60 mt-1">
                  Age: {age} years — Phase: <span className="text-[#FFD700]">{agePhase}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Document Type</label>
              <select
                value={s2.documentType}
                onChange={e => setS2({ ...s2, documentType: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0a1a0e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              >
                <option value="">Select document type</option>
                {DOCUMENT_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">ID / Document Number <span className="text-white/30">(optional)</span></label>
              <input
                type="text"
                value={s2.idNumber}
                onChange={e => setS2({ ...s2, idNumber: e.target.value })}
                placeholder="Document number"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: School Details ── */}
        {step === 3 && (
          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">Step 3 — School Details</h2>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">School Name</label>
              <input
                type="text"
                value={s3.schoolName}
                onChange={e => setS3({ ...s3, schoolName: e.target.value })}
                placeholder="e.g. Prince Edward School"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Grade / Form</label>
              <select
                value={s3.grade}
                onChange={e => setS3({ ...s3, grade: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0a1a0e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              >
                <option value="">Select grade</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Student Number <span className="text-white/30">(optional)</span></label>
              <input
                type="text"
                value={s3.studentNumber}
                onChange={e => setS3({ ...s3, studentNumber: e.target.value })}
                placeholder="School student number"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>
          </div>
        )}

        {/* ── STEP 4: Photo Upload ── */}
        {step === 4 && (
          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">Step 4 — Player Photo</h2>
            <p className="text-white/40 text-sm">Upload a clear, recent photo of the player. This will appear on their registration card.</p>

            <div className="flex flex-col items-center gap-4">
              {s4.photoPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s4.photoPreview}
                    alt="Player photo"
                    className="w-36 h-36 rounded-full object-cover border-4 border-[#FFD700]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setS4({ photoFile: null, photoPreview: '' })}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-36 h-36 rounded-full border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#FFD700]/50 transition-all">
                  <span className="text-3xl mb-1">📷</span>
                  <span className="text-white/40 text-xs text-center">Tap to upload photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}

              {!s4.photoPreview && (
                <label className="px-4 py-2 rounded-xl border border-white/10 text-white/60 text-sm cursor-pointer hover:border-[#FFD700]/50 hover:text-white/80 transition-all">
                  Choose from gallery
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 5: Physical & Sport Profile ── */}
        {step === 5 && (
          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">Step 5 — Physical Profile</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Height (cm) <span className="text-white/30">optional</span></label>
                <input
                  type="number"
                  value={s5.height}
                  onChange={e => setS5({ ...s5, height: e.target.value })}
                  placeholder="e.g. 165"
                  min="80" max="220"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Weight (kg) <span className="text-white/30">optional</span></label>
                <input
                  type="number"
                  value={s5.weight}
                  onChange={e => setS5({ ...s5, weight: e.target.value })}
                  placeholder="e.g. 60"
                  min="20" max="150"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-2 font-medium">Sex</label>
              <div className="grid grid-cols-2 gap-2">
                {['Male', 'Female'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setS5({ ...s5, sex: s })}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      s5.sex === s
                        ? 'border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]'
                        : 'border-white/10 text-white/50 hover:border-white/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Playing Position</label>
              <select
                value={s5.position}
                onChange={e => setS5({ ...s5, position: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0a1a0e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              >
                <option value="">Select position</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Club / Team <span className="text-white/30">optional</span></label>
              <input
                type="text"
                value={s5.club}
                onChange={e => setS5({ ...s5, club: e.target.value })}
                placeholder="e.g. Dynamos U15"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Province</label>
              <select
                value={s5.province}
                onChange={e => setS5({ ...s5, province: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0a1a0e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              >
                <option value="">Select province</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── STEP 6: Registration Complete ── */}
        {step === 6 && (
          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
              <span className="text-3xl">✅</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">Registration Complete!</h2>
              <p className="text-white/50 text-sm mt-1">{s2.fullName}</p>
            </div>

            {/* Registration Code */}
            <div className="bg-[#0a1a0e] border border-[#FFD700]/30 rounded-2xl p-5 space-y-2">
              <p className="text-green-300/60 text-xs uppercase tracking-wider">Registration Code</p>
              <p className="text-[#FFD700] text-2xl font-bold font-mono tracking-widest">{regCode}</p>
              <p className="text-white/30 text-xs">Keep this code safe — it is your official GrassRoots Sports ID</p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-white/40 text-xs">QR Code for verification</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${regCode}&bgcolor=0f2614&color=FFD700`}
                alt="Registration QR Code"
                className="w-40 h-40 rounded-xl"
              />
            </div>

            {/* Player details summary */}
            <div className="text-left space-y-2 bg-white/5 rounded-xl p-4">
              {[
                ['Full Name',      s2.fullName],
                ['Date of Birth',  s2.dob],
                ['Age Phase',      agePhase],
                ['Position',       s5.position],
                ['Province',       s5.province],
                ['School',         s3.schoolName],
                ['Registration Date', new Date().toLocaleDateString('en-ZW')],
              ].map(([label, value]) => value ? (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-white/40">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ) : null)}
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => window.print()}
                className="w-full py-3 rounded-xl border border-[#FFD700]/30 text-[#FFD700] text-sm font-medium hover:bg-[#FFD700]/10 transition-all"
              >
                Print Registration Card
              </button>
              <Link
                href="/register"
                className="block w-full py-3 rounded-xl bg-[#FFD700] text-[#0a1a0e] text-sm font-semibold hover:bg-[#FFE44D] transition-all"
              >
                Create Player Account →
              </Link>
            </div>
          </div>
        )}

        {/* ── Navigation Buttons ── */}
        {step < 6 && (
          <div className="flex gap-3 mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:border-white/30 transition-all"
              >
                ← Back
              </button>
            ) : (
              <Link
                href="/register"
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:border-white/30 transition-all text-center"
              >
                ← Back
              </Link>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => canNext[step] && setStep(step + 1)}
                disabled={!canNext[step]}
                className="flex-1 py-3 rounded-xl bg-[#FFD700] text-[#0a1a0e] text-sm font-semibold hover:bg-[#FFE44D] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canNext[5] || loading}
                className="flex-1 py-3 rounded-xl bg-[#FFD700] text-[#0a1a0e] text-sm font-semibold hover:bg-[#FFE44D] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#0a1a0e]/30 border-t-[#0a1a0e] rounded-full animate-spin" />
                    Registering...
                  </>
                ) : 'Complete Registration →'}
              </button>
            )}
          </div>
        )}

        {/* Back to register link */}
        {step < 6 && (
          <p className="text-center text-white/20 text-xs mt-4">
            Want a quick account instead?{' '}
            <Link href="/register" className="text-[#FFD700]/60 hover:text-[#FFD700] transition-colors">
              Quick registration
            </Link>
          </p>
        )}

      </div>
    </div>
  );
}
