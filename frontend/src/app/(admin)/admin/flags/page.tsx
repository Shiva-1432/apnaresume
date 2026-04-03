import FlagsPage from "../../flags/page";
import { assertAdmin } from "@/lib/utils/assertAdmin";

export default async function AdminFlagsRoute() {
	await assertAdmin();
	return <FlagsPage />;
}
