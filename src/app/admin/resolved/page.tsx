'use client';

import { useEffect, useState } from 'react';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';

type ResolvedReport = {
  reporter: string;
  reportee: string;
  date: string;
};

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

export default function ResolvedReportsPage() {
  const { user } = useListings();
  const [resolved, setResolved] = useState<ResolvedReport[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('panty_report_resolved');
      if (stored) {
        const parsed: ResolvedReport[] = JSON.parse(stored);
        parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setResolved(parsed);
      }
    }
  }, []);

  const saveResolved = (newResolved: ResolvedReport[]) => {
    setResolved(newResolved);
    localStorage.setItem('panty_report_resolved', JSON.stringify(newResolved));
  };

  const handleUndo = (entry: ResolvedReport, index: number) => {
    // Remove from resolved
    const updatedResolved = [...resolved];
    updatedResolved.splice(index, 1);
    saveResolved(updatedResolved);

    // Restore to active reports
    let thread: Message[] = [];
    const messagesRaw = localStorage.getItem('panty_messages');
    if (messagesRaw) {
      const allMessages = JSON.parse(messagesRaw);
      Object.values(allMessages as { [key: string]: any[] }).forEach((msgList) => {
        msgList.forEach((msg) => {
          const between = [msg.sender, msg.receiver];
          if (between.includes(entry.reporter) && between.includes(entry.reportee)) {
            thread.push(msg);
          }
        });
      });
    }

    // Always restore the report, even if no messages found
    const newReport: ReportLog = {
      reporter: entry.reporter,
      reportee: entry.reportee,
      messages: thread,
      date: entry.date,
    };

    const existingReportsRaw = localStorage.getItem('panty_report_logs');
    const existingReports = existingReportsRaw ? JSON.parse(existingReportsRaw) : [];
    existingReports.push(newReport);
    localStorage.setItem('panty_report_logs', JSON.stringify(existingReports));

    // Dispatch event to update report counter
    window.dispatchEvent(new Event('updateReports'));

    alert(`Restored report from ${entry.reporter} about ${entry.reportee}.`);
  };

  if (!user || (user.username !== 'oakley' && user.username !== 'gerome')) {
    return (
      <RequireAuth role="admin">
        <main className="p-8 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">🔒 Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth role="admin">
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">✅ Resolved Reports</h1>

        {resolved.length === 0 ? (
          <p className="text-gray-600">No resolved reports found.</p>
        ) : (
          <ul className="space-y-4">
            {resolved.map((entry, i) => (
              <li key={i} className="bg-white border rounded p-4 shadow">
                <p>
                  <strong>Reporter:</strong> {entry.reporter}
                </p>
                <p>
                  <strong>Reportee:</strong> {entry.reportee}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  <strong>Resolved on:</strong> {new Date(entry.date).toLocaleString()}
                </p>
                <button
                  onClick={() => handleUndo(entry, i)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  🔄 Undo
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </RequireAuth>
  );
}
