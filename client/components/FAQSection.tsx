import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "Is MeritOne a freelancing platform?",
    answer:
      "No. MeritOne is primarily built for skill exchange and collaboration. Payments are optional and only happen if both parties agree as part of a trade.",
  },
  {
    id: 2,
    question: "Is money required to use MeritOne?",
    answer:
      "No. Most trades happen without money. Users can exchange skills purely through collaboration, but payments or tips are available if participants choose to include them.",
  },
  {
    id: 3,
    question: "When does payment come into a trade?",
    answer:
      "Payment is optional and decided by the users involved. A trade can be skill-for-skill, skill-plus-payment, or include tips after collaboration.",
  },
  {
    id: 4,
    question: "Why would someone pay if skill exchange exists?",
    answer:
      "Some collaborations involve uneven effort or urgency. Optional payments and tips allow flexibility without turning the platform into a pay-only marketplace.",
  },
  {
    id: 5,
    question: "How is this different from freelancing sites then?",
    answer:
      "Freelancing platforms are payment-first. MeritOne is collaboration-first. Skills, contribution, and intent come before money.",
  },
  {
    id: 6,
    question: "What if one person doesn’t complete their part of the trade?",
    answer:
      "User reliability is reflected through activity, completed trades, and collaboration history. Poor participation affects credibility and future opportunities.",
  },
  {
    id: 7,
    question: "Can beginners still use MeritOne if payments exist?",
    answer:
      "Yes. Beginners can collaborate through skill exchange without paying. Payments are optional and do not block access to collaboration.",
  },
  {
    id: 8,
    question: "How does tipping work?",
    answer:
      "After collaboration, users can optionally tip others to appreciate effort or contribution. Tips are voluntary and not required to participate.",
  },
];

const FAQSection: React.FC = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(1); // First FAQ open by default

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <section className="bg-black text-white py-16 lg:py-24">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div className="space-y-8 lg:sticky lg:top-8">
            <div className="flex justify-center lg:justify-start">
              <div className="w-20 h-20 bg-green-400/10 rounded-2xl flex items-center justify-center border border-green-400/20">
                <div className="w-12 h-12 bg-green-400 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-7 h-7 text-black stroke-[2.5px]" />
                </div>
              </div>
            </div>

            <div className="text-center lg:text-left space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                You have different
                <br />
                <span className="text-green-400">questions?</span>
              </h2>

              <p className="text-gray-300 text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                Our team will answer all your questions. We ensure a quick
                response.
              </p>

            </div>
          </div>

          {/* Right FAQ Content */}
          <div className="space-y-6">
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-green-400 text-sm font-semibold tracking-wider">
                  📋 FAQs
                </span>
              </div>
              <h3 className="text-3xl lg:text-4xl font-bold leading-tight">
                Let us address your{" "}
                <span className="text-green-400">questions</span> today!
              </h3>
            </div>

            <div className="space-y-4">
              {faqData.map((faq) => (
                <div
                  key={faq.id}
                  className={cn(
                    "border-2 rounded-lg transition-all duration-300 cursor-pointer overflow-hidden",
                    openFAQ === faq.id
                      ? "border-green-400 bg-gray-900/50 shadow-lg shadow-green-400/20"
                      : "border-white/20 bg-gray-900/30 hover:border-white/40",
                  )}
                  onClick={() => toggleFAQ(faq.id)}
                >
                  {/* Question */}
                  <div className="p-6 flex items-center justify-between">
                    <h4 className="text-white font-semibold text-lg pr-4">
                      {faq.question}
                    </h4>
                    <div
                      className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                        openFAQ === faq.id
                          ? "bg-green-400 text-black rotate-45"
                          : "bg-gray-700 text-white hover:bg-gray-600",
                      )}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Answer */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-500 ease-in-out",
                      openFAQ === faq.id
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0",
                    )}
                  >
                    <div className="px-6 pb-6">
                      <div
                        className={cn(
                          "text-gray-300 leading-relaxed transition-all duration-300 delay-100",
                          openFAQ === faq.id
                            ? "translate-y-0"
                            : "translate-y-2",
                        )}
                      >
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
