'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Ticket, Users, Target, Mail } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import { formatDate } from '@/lib/utils/date-utils';
import type { AccountDetailData } from '@/lib/supabase/types';

interface AccountSidebarProps {
  data: AccountDetailData;
}

export function AccountSidebar({ data }: AccountSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    tickets: true,
    contacts: true,
    opportunities: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const { openTickets, contacts, opportunities } = data;

  return (
    <div className="w-96 min-w-[320px] max-w-[400px] bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
      <div className="p-6 space-y-6">
        {/* Open Tickets */}
        <div>
          <button
            onClick={() => toggleSection('tickets')}
            className="w-full flex items-center justify-between mb-3 hover:text-amber-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-gray-900">Open Tickets</h3>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {openTickets.length}
              </span>
            </div>
            {expandedSections.tickets ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {expandedSections.tickets && (
            <div className="space-y-2">
              {openTickets.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  No open tickets
                </div>
              ) : (
                openTickets.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-amber-500 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1 truncate">
                      {ticket.subject || 'No subject'}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          ticket.priority === 'urgent' || ticket.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {ticket.priority || 'normal'}
                      </span>
                      <span className="text-gray-500">
                        {ticket.created_at && formatDate(ticket.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Contacts */}
        <div>
          <button
            onClick={() => toggleSection('contacts')}
            className="w-full flex items-center justify-between mb-3 hover:text-amber-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-gray-900">Contacts</h3>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {contacts.length}
              </span>
            </div>
            {expandedSections.contacts ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {expandedSections.contacts && (
            <div className="space-y-2">
              {contacts.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  No contacts
                </div>
              ) : (
                contacts.slice(0, 5).map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-amber-500 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {contact.first_name?.[0] || ''}
                        {contact.last_name?.[0] || ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {contact.first_name} {contact.last_name}
                        </div>
                        {contact.title && (
                          <div className="text-xs text-gray-600 truncate">
                            {contact.title}
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <div className="text-xs text-gray-500 truncate">
                              {contact.email}
                            </div>
                          </div>
                        )}
                        {contact.customer_role && (
                          <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            {contact.customer_role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Opportunities */}
        <div>
          <button
            onClick={() => toggleSection('opportunities')}
            className="w-full flex items-center justify-between mb-3 hover:text-amber-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-gray-900">Opportunities</h3>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {opportunities.length}
              </span>
            </div>
            {expandedSections.opportunities ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {expandedSections.opportunities && (
            <div className="space-y-2">
              {opportunities.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  No open opportunities
                </div>
              ) : (
                opportunities.slice(0, 5).map((opp) => (
                  <div
                    key={opp.id}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-amber-500 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1 truncate">
                      {opp.name}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      {opp.amount && (
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(opp.amount)}
                        </div>
                      )}
                      {opp.stage && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {opp.stage}
                        </span>
                      )}
                    </div>
                    {opp.close_date && (
                      <div className="text-xs text-gray-500">
                        Close: {formatDate(opp.close_date)}
                      </div>
                    )}
                    {opp.type && (
                      <span className="inline-block mt-1 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                        {opp.type}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
