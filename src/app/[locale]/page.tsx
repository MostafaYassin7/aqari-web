import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import UserTypes from "@/components/UserTypes";
import Screenshots from "@/components/Screenshots";
import DownloadCTA from "@/components/DownloadCTA";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <UserTypes />
        <Screenshots />
        <DownloadCTA />
      </main>
      <Footer />
    </>
  );
}
