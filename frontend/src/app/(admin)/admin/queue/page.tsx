import QueuePage from "../../queue/page";
import { assertAdmin } from "@/lib/utils/assertAdmin";

export default async function AdminQueueRoute() {
	await assertAdmin();
	return <QueuePage />;
}
