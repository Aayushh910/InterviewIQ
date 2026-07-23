import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import WhyInterviewIQ from "../components/landing/WhyInterviewIQ";
import Stats from "../components/landing/Stats";
import Testimonials from "../components/landing/Testimonials";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <main className="grain-overlay">
      <Hero />
      <Features />
      <HowItWorks />
      <WhyInterviewIQ />
      <Stats />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
