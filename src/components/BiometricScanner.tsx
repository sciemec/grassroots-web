'use client';

export interface ScanEntry {
  mode: string;
  score?: number;
  level?: string;
  asymmetry_score?: number;
  asymmetry_diff?: number;
  weak_side?: string | null;
  frames_analysed: number;
  session_date: string;
  mode_label: string;
}

interface BiometricScannerProps {
  onScanComplete?: (data: ScanEntry) => void;
}

export function BiometricScanner({ onScanComplete: _onScanComplete }: BiometricScannerProps = {}) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Biometric Scanner</h3>
      <p className="text-sm text-gray-600">This feature is coming soon.</p>
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-xs text-gray-400 text-center">Biometric scanning interface will appear here</p>
      </div>
    </div>
  );
}

export default BiometricScanner;