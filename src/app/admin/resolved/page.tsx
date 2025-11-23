// src/app/admin/resolved/page.tsx
import { redirect } from 'next/navigation';

export default function ResolvedReportsRedirectPage() {
  redirect('/admin/reports');
  return null;
}
