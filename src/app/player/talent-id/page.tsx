// Add after the existing stats row
{/* Biometric Score Card */}
{avgScore && (
  <div className="rounded-2xl bg-gradient-to-r from-emerald-900/40 to-blue-900/40 p-5 border border-emerald-800/30">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-emerald-500" />
        <p className="text-xs font-bold text-white">Biometric Profile</p>
      </div>
      <Link href="/player/training/progress" className="text-[10px] text-emerald-400 hover:text-emerald-300">
        View Full History →
      </Link>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-[9px] text-gray-500">Overall Form</p>
        <p className={`text-2xl font-bold ${avgScore >= 80 ? 'text-emerald-500' : avgScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
          {avgScore}
        </p>
      </div>
      <div>
        <p className="text-[9px] text-gray-500">Fatigue Index</p>
        <p className="text-2xl font-bold text-white">—</p>
      </div>
    </div>
  </div>
)}