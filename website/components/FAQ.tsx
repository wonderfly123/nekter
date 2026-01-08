'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'What exactly does Nekter do?',
    answer:
      'Nekter analyzes all your customer interactions, including calls, emails, and support tickets, to surface churn risks and expansion opportunities before you would notice them yourself. It gives every account a health score and tells you exactly which accounts need attention and why.',
  },
  {
    question: 'How does the AI detect churn signals?',
    answer:
      'Our AI analyzes sentiment patterns, engagement trends, and specific language in customer conversations. It picks up on things like frustration, competitor mentions, declining usage, and negative sentiment shifts that humans often miss when reviewing hundreds of accounts.',
  },
  {
    question: 'Who is Nekter built for?',
    answer:
      'Customer success teams, account managers, and revenue leaders at B2B SaaS companies. If you manage a portfolio of accounts and want to be proactive instead of reactive, Nekter is for you.',
  },
  {
    question: 'How is this different from my CRM?',
    answer:
      'Your CRM stores data. Nekter interprets it. We connect to your existing tools and layer intelligence on top, surfacing insights you would never find by clicking through Salesforce. Think of it as a CS analyst that never sleeps.',
  },
  {
    question: 'What integrations do you support?',
    answer:
      'We integrate with Salesforce, HubSpot, Gong, Chorus, Intercom, Zendesk, and most major CRM and communication platforms. If you have call recordings and customer data, we can analyze it.',
  },
  {
    question: 'How quickly can I get started?',
    answer:
      'Most teams are up and running within a few weeks. Connect your integrations, and Nekter starts analyzing your historical data to build health scores and surface insights.',
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
