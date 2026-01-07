export interface ExpansionOpportunityEmailData {
  accountName: string;
  interactionType: string;
  sentimentScore: number;
  expansionReasons: string[] | null;
  summary: string | null;
  interactionDate: string;
  accountUrl: string;
}

function getSentimentColor(score: number): { color: string; bgColor: string } {
  if (score >= 70) {
    return { color: '#16A34A', bgColor: '#DCFCE7' };
  } else if (score >= 50) {
    return { color: '#EA580C', bgColor: '#FED7AA' };
  } else {
    return { color: '#DC2626', bgColor: '#FEE2E2' };
  }
}

function formatInteractionType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

export function generateExpansionOpportunityEmail(data: ExpansionOpportunityEmailData): string {
  const sentiment = getSentimentColor(data.sentimentScore);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Expansion Opportunity</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">Expansion Opportunity</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">A growth opportunity was detected</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Account Name -->
              <h2 style="margin: 0 0 24px; font-size: 20px; font-weight: 600; color: #111827;">${data.accountName}</h2>

              <!-- Alert Badge -->
              <div style="margin-bottom: 24px;">
                <span style="display: inline-block; padding: 4px 12px; background-color: #DCFCE7; color: #16A34A; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; border-radius: 4px;">EXPANSION OPPORTUNITY</span>
              </div>

              <!-- Interaction Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 13px; color: #6b7280; font-weight: 500;">Type</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; color: #111827; font-weight: 500;">${formatInteractionType(data.interactionType)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 13px; color: #6b7280; font-weight: 500;">Date</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; color: #111827; font-weight: 500;">${data.interactionDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 13px; color: #6b7280; font-weight: 500;">Sentiment</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="display: inline-block; padding: 2px 8px; background-color: ${sentiment.bgColor}; color: ${sentiment.color}; font-size: 13px; font-weight: 600; border-radius: 4px;">${data.sentimentScore}/100</span>
                  </td>
                </tr>
              </table>

              ${data.expansionReasons && data.expansionReasons.length > 0 ? `
              <!-- Expansion Reasons -->
              <div style="margin-bottom: 24px; padding: 16px; background-color: #F0FDF4; border-left: 3px solid #16A34A; border-radius: 4px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #166534; font-weight: 600;">Expansion Signals:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  ${data.expansionReasons.slice(0, 3).map(reason => `
                  <li style="font-size: 14px; color: #15803D; line-height: 1.6;">${reason}</li>
                  `).join('')}
                </ul>
              </div>
              ` : ''}

              ${data.summary ? `
              <!-- Summary -->
              <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-left: 3px solid #e5e7eb; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${data.summary}</p>
              </div>
              ` : ''}

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${data.accountUrl}" style="display: inline-block; padding: 12px 32px; background-color: #16A34A; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">View Interaction</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">This is an automated alert from Nekter</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
