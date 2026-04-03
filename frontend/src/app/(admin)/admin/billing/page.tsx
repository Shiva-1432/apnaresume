import BillingPage from "../../billing/page";
import { assertAdmin } from "@/lib/utils/assertAdmin";

export default async function AdminBillingRoute() {
	await assertAdmin();
	return <BillingPage />;
}
