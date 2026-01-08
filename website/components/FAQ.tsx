'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How does the free trial work?',
    answer:
      'Start with a 14-day free trial with full access to all features. No credit card required. At the end of your trial, choose a plan that fits your team.',
  },
  {
    question: 'Can I switch plans later?',
    answer:
      'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    question: 'What integrations do you support?',
    answer:
      'We integrate with Salesforce, HubSpot, Gong, Chorus, Intercom, Zendesk, and more. Our API also allows custom integrations for enterprise customers.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. We\'re SOC 2 Type II compliant with enterprise-grade security. All data is encrypted in transit and at rest. We also support SSO and SAML.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'We offer a 30-day money-back guarantee for all new customers. If you\'re not satisfied, contact us for a full refund.',
  },
  {
    question: 'Can I import data from my current tool?',
    answer:
      'Yes! We offer free migration support for all customers. Our team will help you import historical data from your existing CS platform.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently asked{' '}
            <span className="text-gradient">questions</span>
          </h2>
          <p className="text-xl text-gray-600">
            Got questions? We've got answers.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
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
