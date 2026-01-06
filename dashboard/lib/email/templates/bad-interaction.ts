export interface BadInteractionEmailData {
  accountName: string;
  interactionType: string;
  sentimentScore: number;
  churnRisk: boolean;
  churnReasons: string[] | null;
  summary: string | null;
  interactionDate: string;
  accountUrl: string;
}

function getSentimentColor(score: number): { color: string; bgColor: string; label: string } {
  if (score >= 70) {
    return { color: '#16A34A', bgColor: '#DCFCE7', label: 'Positive' };
  } else if (score >= 50) {
    return { color: '#EA580C', bgColor: '#FED7AA', label: 'Neutral' };
  } else {
    return { color: '#DC2626', bgColor: '#FEE2E2', label: 'Negative' };
  }
}

function formatInteractionType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

export function generateBadInteractionEmail(data: BadInteractionEmailData): string {
  const sentiment = getSentimentColor(data.sentimentScore);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interaction Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">Interaction Alert</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">A concerning interaction was detected</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Account Name -->
              <h2 style="margin: 0 0 24px; font-size: 20px; font-weight: 600; color: #111827;">${data.accountName}</h2>

              <!-- Alert Badges -->
              <div style="margin-bottom: 24px;">
                ${data.churnRisk ? `
                <span style="display: inline-block; padding: 4px 12px; background-color: #FEE2E2; color: #DC2626; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; border-radius: 4px; margin-right: 8px;">CHURN RISK</span>
                ` : ''}
                <span style="display: inline-block; padding: 4px 12px; background-color: ${sentiment.bgColor}; color: ${sentiment.color}; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; border-radius: 4px;">SENTIMENT: ${data.sentimentScore}/100</span>
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
              </table>

              ${data.churnReasons && data.churnReasons.length > 0 ? `
              <!-- Churn Reasons -->
              <div style="margin-bottom: 24px; padding: 16px; background-color: #FEF2F2; border-left: 3px solid #DC2626; border-radius: 4px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #991B1B; font-weight: 600;">Churn Signals Detected:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  ${data.churnReasons.slice(0, 3).map(reason => `
                  <li style="font-size: 14px; color: #7F1D1D; line-height: 1.6;">${reason}</li>
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
                    <a href="${data.accountUrl}" style="display: inline-block; padding: 12px 32px; background-color: #EA580C; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">View Interaction</a>
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
