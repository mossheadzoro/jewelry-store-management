import WholesalerProfileClient from "../../../../../components/Wholesaler/profile/WholesalerProfileClient";

export default async function WholesalerProfilePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  return <WholesalerProfileClient wholesalerId={id} />;
}
