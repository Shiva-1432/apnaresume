'use client';

type QuickActionsProps = {
  onAnalyze: () => void;
  onMatch: () => void;
  onTrack: () => void;
};

export default function QuickActions({ onAnalyze, onMatch, onTrack }: QuickActionsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <button
        onClick={onAnalyze}
        className="p-6 bg-linear-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg hover:shadow-lg transition"
      >
        <h3 className="text-2xl font-bold text-blue-600 mb-2">📄</h3>
        <p className="font-bold text-gray-900">Upload & Analyze Resume</p>
        <p className="text-xs text-gray-600 mt-1">Get ATS score (5 credits)</p>
      </button>

      <button
        onClick={onMatch}
        className="p-6 bg-linear-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg hover:shadow-lg transition"
      >
        <h3 className="text-2xl font-bold text-purple-600 mb-2">🎯</h3>
        <p className="font-bold text-gray-900">Match to Job</p>
        <p className="text-xs text-gray-600 mt-1">Paste JD, get optimized resume (3 credits)</p>
      </button>

      <button
        onClick={onTrack}
        className="p-6 bg-linear-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg hover:shadow-lg transition"
      >
        <h3 className="text-2xl font-bold text-green-600 mb-2">💼</h3>
        <p className="font-bold text-gray-900">Track Applications</p>
        <p className="text-xs text-gray-600 mt-1">Monitor status & get insights (free)</p>
      </button>
    </div>
  );
}
