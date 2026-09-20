import { redirect } from "next/navigation";

/** The book-wide ledger is now the Passbook tab. */
export default function StatementPage() {
  redirect("/admin/passbook");
}
