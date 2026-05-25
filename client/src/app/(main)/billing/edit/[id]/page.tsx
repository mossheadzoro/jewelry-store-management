import BillingPage from "../../../../../../components/Billing/BillingPage";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const invoiceId = parseInt(resolvedParams.id);
  return <BillingPage invoiceId={invoiceId} />;
}
