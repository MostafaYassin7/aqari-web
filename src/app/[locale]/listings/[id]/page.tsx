import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingDetailClient from "@/components/listings/ListingDetailClient";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <Navbar />
      <ListingDetailClient id={id} />
      <Footer />
    </>
  );
}
