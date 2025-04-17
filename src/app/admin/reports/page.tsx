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

  if (!user || (user.username !== 'oakley' && user.username !== 'gerome')) {
    return (
      <RequireAuth>
        <main className="p-8 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">🔒 Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <main className="p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🚨 Reported Users & Threads</h1>

        {reports.length === 0 ? (
          <p className="text-gray-600">No reports found.</p>
        ) : (
          <div className="space-y-8">
            {reports.map((report, index) => (
              <div key={index} className="bg-white border rounded-lg shadow p-4">
                <div className="mb-2 text-sm text-gray-500">
                  <strong>Reporter:</strong> {report.reporter} |{' '}
                  <strong>Reportee:</strong> {report.reportee} |{' '}
                  <strong>Reported:</strong> {new Date(report.date).toLocaleString()}
                </div>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
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
              </div>
            ))}
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
