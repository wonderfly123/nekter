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
    <div className="w-96 min-w-[320px] max-w-[400px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0">
      <div className="p-6 space-y-6">
        {/* Open Tickets */}
        <div>
          <button
            onClick={() => toggleSection('tickets')}
            className="w-full flex items-center justify-between mb-3 hover:text-amber-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Open Tickets</h3>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
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
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No open tickets
                </div>
              ) : (
                openTickets.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-amber-500 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1 truncate">
                      {ticket.subject || 'No subject'}
                    </div>
                    {ticket.description && (
                      <div className="group relative mb-2">
                        <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 cursor-help">
                          {ticket.description}
                        </div>
                        <div className="absolute left-0 top-full mt-1 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                          {ticket.description}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          ticket.priority === 'urgent' || ticket.priority === 'high'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {ticket.priority || 'normal'}
                      </span>
                      {ticket.status && (
                        <span
                          className={`px-2 py-0.5 rounded ${
                            ticket.status === 'open'
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              : ticket.status === 'pending'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      )}
                      <span className="text-gray-500 dark:text-gray-400 ml-auto">
                        Created {ticket.created_at && formatDate(ticket.created_at)}
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
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Contacts</h3>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
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
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No contacts
                </div>
              ) : (
                contacts.slice(0, 5).map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-amber-500 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {contact.first_name?.[0] || ''}
                        {contact.last_name?.[0] || ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {contact.first_name} {contact.last_name}
                        </div>
                        {contact.title && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {contact.title}
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {contact.email}
                            </div>
                          </div>
                        )}
                        {contact.customer_role && (
                          <span className="inline-block mt-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded">
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
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Opportunities</h3>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
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
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No open opportunities
                </div>
              ) : (
                opportunities.slice(0, 5).map((opp) => (
                  <div
                    key={opp.id}
                    className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-amber-500 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1 truncate">
                      {opp.name}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      {opp.amount && (
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(opp.amount)}
                        </div>
                      )}
                      {opp.stage && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                          {opp.stage}
                        </span>
                      )}
                    </div>
                    {opp.close_date && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Close: {formatDate(opp.close_date)}
                      </div>
                    )}
                    {opp.type && (
                      <span className="inline-block mt-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
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
