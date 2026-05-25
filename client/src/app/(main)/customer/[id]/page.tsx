import CustomerDetailsClient from "../../../../../components/Customer/CustomerDetailsClient";

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetailsClient customerId={parseInt(id, 10)} />;
}
