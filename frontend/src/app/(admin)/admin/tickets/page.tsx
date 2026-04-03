import TicketsPage from "../../tickets/page";
import { assertAdmin } from "@/lib/utils/assertAdmin";

export default async function AdminTicketsRoute() {
	await assertAdmin();
	return <TicketsPage />;
}
