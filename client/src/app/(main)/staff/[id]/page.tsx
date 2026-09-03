import StaffDetailsClient from "@/components/Staff/StaffDetailsClient";

export default async function StaffDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StaffDetailsClient userId={parseInt(id, 10)} />;
}
