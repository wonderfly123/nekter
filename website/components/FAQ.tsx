'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'What is Nekter?',
    answer:
      'Nekter is a customer success intelligence platform that helps you retain and grow accounts. It analyzes your customer interactions—calls, emails, tickets—to surface health risks and expansion opportunities before you\'d otherwise notice them.',
  },
  {
    question: 'Who is Nekter for?',
    answer:
      'Customer success teams, account managers, and revenue leaders at B2B SaaS companies who want to be proactive instead of reactive.',
  },
  {
    question: 'How does the AI work?',
    answer:
      'We use AI to analyze sentiment, detect churn signals, and identify expansion mentions in your call transcripts and communications. Barry, our AI assistant, lets you ask natural questions about any account.',
  },
  {
    question: 'What integrations do you support?',
    answer:
      'We currently integrate with Salesforce, call recording platforms, and support tools. More integrations coming soon.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes! You can explore the demo environment to see how Nekter works before committing.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'We offer flexible pricing based on your team size and needs. Reach out for a custom quote.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
          Questions? We've got answers.
        </h2>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
