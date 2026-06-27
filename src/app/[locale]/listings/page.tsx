import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingsClient from "@/components/listings/ListingsClient";

export default function ListingsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col">
        <ListingsClient />
      </main>
      <Footer />
    </>
  );
}
