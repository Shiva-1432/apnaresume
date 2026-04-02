import { redirect } from 'next/navigation';
import { isAdmin } from './isAdmin';

export async function assertAdmin() {
  const admin = await isAdmin();
  if (!admin) redirect('/dashboard');
}
