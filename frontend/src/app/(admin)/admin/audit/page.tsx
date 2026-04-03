import AuditPage from "../../audit/page";
import { assertAdmin } from "@/lib/utils/assertAdmin";

export default async function AdminAuditRoute() {
  await assertAdmin();
  return <AuditPage />;
}
