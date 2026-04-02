import ResumeABTestingDashboard from '../resume-ab-dashboard';
import { assertAdmin } from '@/lib/utils/assertAdmin';

export default async function Page() {
  await assertAdmin();
  return <ResumeABTestingDashboard />;
}
