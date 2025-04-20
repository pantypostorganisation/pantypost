'use client';

import { useEffect, useState } from 'react';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';

type Message = {
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
};

type ReportLog = {
  reporter: string;
  reportee: string;
  messages: Message[];
  date: string;
};

export default function AdminReportsPage() {
  const { user } = useListings();
  const [reports, setReports] = useState<ReportLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('panty_report_logs');
      if (stored) {
        const parsed: ReportLog[] = JSON.parse(stored);
        parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setReports(parsed);
      }
    }
  }, []);

  const saveReports = (newReports: ReportLog[]) => {
    setReports(newReports);
    localStorage.setItem('panty_report_logs', JSON.stringify(newReports));
    window.dispatchEvent(new Event('updateReports'));
  };

  const handleDelete = (index: number) => {
    const updated = [...reports];
    updated.splice(index, 1);
    saveReports(updated);
  };

  const handleBlockUser = (username: string) => {
    const stored = localStorage.getItem('panty_blocked');
    const blocked = stored ? JSON.parse(stored) : {};

    const admins = ['oakley', 'gerome'];
    admins.forEach((admin) => {
      blocked[admin] = Array.from(new Set([...(blocked[admin] || []), username]));
    });

    localStorage.setItem('panty_blocked', JSON.stringify(blocked));
    alert(`${username} has been globally blocked.`);
  };

  const handleMarkResolved = (report: ReportLog, index: number) => {
    const stored = localStorage.getItem('panty_report_resolved');
    const resolved = stored ? JSON.parse(stored) : [];

    resolved.push({
      reporter: report.reporter,
      reportee: report.reportee,
      date: report.date,
    });

    localStorage.setItem('panty_report_resolved', JSON.stringify(resolved));

    const updatedReports = [...reports];
    updatedReports.splice(index, 1);
    saveReports(updatedReports);

    alert(`Marked report from ${report.reporter} about ${report.reportee} as resolved.`);
  };

  return (
    <RequireAuth role="admin">
      <main className="p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🚨 Reported Users & Threads</h1>

        <input
          type="text"
          placeholder="Search by username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm mb-6 px-3 py-2 border border-gray-300 rounded"
        />

        {reports.length === 0 ? (
          <p className="text-gray-600">No reports found.</p>
        ) : (
          <div className="space-y-8">
            {reports
              .filter(
                (report) =>
                  report.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  report.reportee.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((report, index) => (
                <div key={index} className="bg-white border rounded-lg shadow p-4">
                  <div className="mb-2 text-sm text-gray-500">
                    <strong>Reporter:</strong> {report.reporter} |{' '}
                    <strong>Reportee:</strong> {report.reportee} |{' '}
                    <strong>Reported:</strong> {new Date(report.date).toLocaleString()}
                  </div>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 mb-3">
                    {report.messages.map((msg, i) => (
                      <div key={i} className="bg-gray-50 p-2 border rounded">
                        <p className="text-sm text-gray-500 mb-1">
                          <strong>{msg.sender}</strong> to <strong>{msg.receiver}</strong> on{' '}
                          {new Date(msg.date).toLocaleString()}
                        </p>
                        <p>{msg.content}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => handleDelete(index)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      🗑 Delete Report
                    </button>
                    <button
                      onClick={() => handleBlockUser(report.reportee)}
                      className="px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                    >
                      🚫 Block {report.reportee}
                    </button>
                    <button
                      onClick={() => handleMarkResolved(report, index)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      ✅ Mark as Resolved
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
