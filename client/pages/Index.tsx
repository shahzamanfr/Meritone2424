import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import ServicesShowcase from "@/components/ServicesShowcase";
import FAQSection from "@/components/FAQSection";
import { motion } from "framer-motion";
import {
  useScrollAnimation,
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  staggerContainer,
} from "@/hooks/use-scroll-animation";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useNavigate, Link } from "react-router-dom";


export default function Index() {
  const { isAuthenticated, isEmailVerified } = useAuth();
  const { hasProfile, loading } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGetStartedClick = () => {
    if (!isAuthenticated) {
      navigate("/signin");
    } else if (!isEmailVerified) {
      // Show message about email verification
      toast({
        title: "Email Verification Required",
        description: "Please check your inbox and verify your email to continue.",
        variant: "destructive"
      });
    } else if (!hasProfile) {
      navigate("/create-profile");
    } else {
      navigate("/feed");
    }
  };

  const handleCollabHubClick = () => {
    toast({
      title: "Coming Soon",
      description: "Our Collab Hub is under construction!",
      duration: 3000
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12 lg:py-16">
        <motion.div
          className="grid lg:grid-cols-2 gap-8 items-center"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Left Content */}
          <motion.div className="space-y-7" variants={fadeInLeft}>
            {/* Main Headline */}
            <div className="space-y-5">
              <p className="text-base text-gray-500 leading-relaxed">
                Most work fails before it begins because the right people never meet
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-snug">
                A platform for <span className="block sm:inline">skill exchange</span> and collaborative work
              </h1>

              <p className="text-base text-gray-600 max-w-lg leading-relaxed">
                Post what you can do or what you need.<br />
                Relevant people and opportunities surface automatically.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                onClick={handleGetStartedClick}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base font-semibold rounded-md transition-all duration-300 shadow-sm active:scale-95"
              >
                <span className="relative z-10">
                  {!isAuthenticated
                    ? "Get Started"
                    : loading
                      ? "Loading..."
                      : !hasProfile
                        ? "Create Profile"
                        : "Start Trading"}
                </span>
              </Button>
              <Button
                onClick={handleCollabHubClick}
                variant="outline"
                className="bg-white/50 backdrop-blur-sm border border-gray-300 text-gray-700 hover:bg-gray-100/80 hover:border-gray-400 px-8 py-6 text-base font-semibold rounded-md transition-all duration-300 active:scale-95 shadow-sm"
              >
                Collab Hub
              </Button>
            </div>
          </motion.div>

          {/* Right Illustration */}
          <motion.div className="relative" variants={fadeInRight}>
            <div className="flex items-center justify-center">
              <img
                src="/hero-illustration.png"
                alt="MeritOne skill exchange illustration showing people collaborating"
                className="w-full h-auto max-w-2xl rounded-lg"
              />
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Stats Section */}
      <motion.section
        className="bg-black text-white py-12 lg:py-16"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-6">
          {/* Sliding Text Animation - At top of about us */}
          <div className="overflow-hidden whitespace-nowrap border-b border-gray-800 pb-6 mb-10">
            <div className="animate-slide-left inline-flex space-x-16 text-3xl lg:text-4xl font-bold opacity-30">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 drop-shadow-lg">
                MeritOne
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 drop-shadow-lg">
                MeritOne
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 drop-shadow-lg">
                MeritOne
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 drop-shadow-lg">
                MeritOne
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 drop-shadow-lg">
                MeritOne
              </span>
            </div>
          </div>

          <motion.div
            className="grid lg:grid-cols-2 gap-8 items-center"
            variants={staggerContainer}
          >
            {/* Left Video */}
            <motion.div className="relative" variants={fadeInLeft}>
              <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
                <video
                  className="w-full h-auto rounded-2xl"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source
                    src="https://cdn.builder.io/o/assets%2F53e4fd32dd724f51a2e513f718e61215%2F36d2d06960074999aa6c1d75686fd1a5?alt=media&token=ed6ec426-e811-4392-8730-4b358233ff10&apiKey=53e4fd32dd724f51a2e513f718e61215"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>

            {/* Right Content */}
            <motion.div className="space-y-4" variants={fadeInRight}>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-primary">✓</span>
                <span className="text-gray-300">ABOUT US</span>
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                Collaboration is based on ability
              </h2>
              <p className="text-gray-300 text-base leading-relaxed">
                MeritOne connects people through skills rather than money. Users collaborate by trading expertise, completing real work, and building experience through contribution.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Join Community Section */}
      <motion.section
        className="bg-black text-white py-12 lg:py-16"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-6">
          <motion.div
            className="grid lg:grid-cols-2 gap-8 items-center"
            variants={staggerContainer}
          >
            {/* Left Content */}
            <motion.div className="space-y-7" variants={fadeInLeft}>
              {/* Success Metric Removed */}
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-primary font-bold text-base">✓</span>
                <span className="text-gray-200 font-medium">
                  Verified Skill Exchange Network
                </span>
              </div>

              {/* Main Headline */}
              <div className="space-y-5">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-snug">
                  Find collaborators through skills
                </h1>

                <p className="text-base text-gray-300 max-w-lg leading-relaxed">
                  Post what you can do, discover what others need, and collaborate through skill-based trades.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  onClick={handleGetStartedClick}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base font-semibold rounded-md transition-all duration-300 shadow-sm active:scale-95"
                >
                  Join the Community
                </Button>
                <Button
                  onClick={() => {
                    if (!isAuthenticated) navigate("/signin");
                    else navigate("/feed");
                  }}
                  variant="outline"
                  className="bg-white/5 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black hover:border-white px-8 py-6 text-base font-semibold rounded-md transition-all duration-300 active:scale-95"
                >
                  Browse Skills
                </Button>
              </div>
            </motion.div>

            {/* Right Illustration */}
            <motion.div className="relative" variants={fadeInRight}>
              <div className="flex items-center justify-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F5bdae9b2904d4e6f8e00b8c0f2e5670e%2F2a09d0e9c02848efb3eac0ac53678054?format=webp&width=800"
                  alt="Professionals collaborating and sharing skills in a modern workspace"
                  className="w-full h-auto max-w-lg rounded-lg"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Services Showcase Section */}
      <ServicesShowcase />

      {/* AI Trade-Matching Section */}
      <motion.section
        className="bg-black text-white py-12 lg:py-16"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-6">
          <motion.div
            className="grid lg:grid-cols-2 gap-8 items-center"
            variants={staggerContainer}
          >
            {/* Left Image */}
            <motion.div className="relative" variants={fadeInLeft}>
              <div className="flex items-center justify-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F5bdae9b2904d4e6f8e00b8c0f2e5670e%2Fb7836dc880764791bff4469dbed7278b?format=webp&width=800"
                  alt="AI-powered skill matching connecting professionals for seamless collaboration"
                  className="w-full h-auto max-w-lg rounded-lg"
                />
              </div>
            </motion.div>

            {/* Right Content */}
            <motion.div className="space-y-6" variants={fadeInRight}>
              {/* Success Metric */}
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-primary">✓</span>
                <span className="text-gray-300">
                  AI-Assisted Skill Matching
                </span>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                  Find relevant trades without searching
                </h1>

                <p className="text-base text-gray-300 max-w-lg leading-relaxed">
                  MeritOne uses AI to surface trades and collaborators based on your skills and activity. The system highlights people who need what you offer or offer what you need, making collaboration faster and more relevant.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  onClick={() => {
                    toast({
                      title: "Coming Soon",
                      description: "AI Matching is under construction!",
                      duration: 3000
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base font-semibold rounded-md transition-all duration-300 shadow-sm active:scale-95"
                >
                  Try AI Matching
                </Button>
                <Button
                  onClick={() => {
                    if (isAuthenticated) {
                      navigate("/feed");
                    } else {
                      navigate("/signup");
                    }
                  }}
                  variant="outline"
                  className="bg-white/5 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black hover:border-white px-8 py-6 text-base font-semibold rounded-md transition-all duration-300 active:scale-95"
                >
                  See How It Works
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <footer className="bg-white text-gray-900 py-12 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img
                  src="/meritone-logo.png"
                  alt="MeritOne"
                  className="w-10 h-10 object-contain"
                />
                <span className="text-2xl font-bold tracking-tight text-gray-900">
                  MeritOne
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs font-medium">
                Connect through skills. Collaborate through work.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900">
                Quick Links
              </h3>
              <ul className="space-y-1.5 text-gray-700 text-sm font-medium">
                <li>
                  <Link
                    to="/skills"
                    className="hover:text-primary transition-colors"
                  >
                    Browse Skills
                  </Link>
                </li>
                <li>
                  <Link
                    to="/trades"
                    className="hover:text-primary transition-colors"
                  >
                    Active Trades
                  </Link>
                </li>
                <li>
                  <Link
                    to="/trades?view=new"
                    className="hover:text-primary transition-colors"
                  >
                    Create a Trade
                  </Link>
                </li>
                <li>
                  <Link
                    to="/feed"
                    className="hover:text-primary transition-colors"
                  >
                    Community
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="hover:text-primary transition-colors"
                  >
                    About MeritOne
                  </Link>
                </li>
              </ul>
            </div>

            {/* Platform */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900">
                Platform
              </h3>
              <ul className="space-y-1.5 text-gray-700 text-sm font-medium">
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    Skill Exchange
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    AI-Assisted Matching
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    Project-Based Trades
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    Collaboration Help
                  </span>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900">
                Contact
              </h3>
              <div className="space-y-2 text-gray-700 text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <span>Email:</span>
                </div>
                <a
                  href="mailto:mohammedzama9024@gmail.com"
                  className="text-primary hover:text-primary/80 transition-colors block break-all font-semibold"
                >
                  mohammedzama9024@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 mt-8 pt-6">
            <div className="text-center space-y-1 font-medium">
              <div className="text-gray-600 text-sm">
                © 2026 MeritOne. All rights reserved.
              </div>
              <div className="text-gray-600 text-sm">
                Built by Mohammed Shahzaman
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
