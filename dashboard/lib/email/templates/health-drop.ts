import type { HealthStatus } from '../../supabase/types';

export interface HealthDropEmailData {
  accountName: string;
  previousStatus: HealthStatus;
  newStatus: HealthStatus;
  healthScore: number | null;
  accountUrl: string;
}

const statusColors: Record<HealthStatus, string> = {
  'Healthy': '#16A34A',
  'At Risk': '#EA580C',
  'Critical': '#DC2626',
};

const statusBgColors: Record<HealthStatus, string> = {
  'Healthy': '#DCFCE7',
  'At Risk': '#FED7AA',
  'Critical': '#FEE2E2',
};

export function generateHealthDropEmail(data: HealthDropEmailData): string {
  const prevColor = statusColors[data.previousStatus];
  const prevBgColor = statusBgColors[data.previousStatus];
  const newColor = statusColors[data.newStatus];
  const newBgColor = statusBgColors[data.newStatus];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">Health Alert</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Account health status has changed</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Account Name -->
              <h2 style="margin: 0 0 24px; font-size: 20px; font-weight: 600; color: #111827;">${data.accountName}</h2>

              <!-- Status Change -->
              <div style="margin-bottom: 24px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280; font-weight: 500;">STATUS CHANGE</p>
                <div style="display: flex; align-items: center;">
                  <span style="display: inline-block; padding: 6px 14px; background-color: ${prevBgColor}; color: ${prevColor}; font-size: 14px; font-weight: 600; border-radius: 6px;">${data.previousStatus}</span>
                  <span style="display: inline-block; margin: 0 12px; font-size: 20px; color: #9ca3af;">→</span>
                  <span style="display: inline-block; padding: 6px 14px; background-color: ${newBgColor}; color: ${newColor}; font-size: 14px; font-weight: 600; border-radius: 6px;">${data.newStatus}</span>
                </div>
              </div>

              ${data.healthScore !== null ? `
              <!-- Health Score -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 13px; color: #6b7280; font-weight: 500;">Health Score</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; color: #111827; font-weight: 500;">${data.healthScore}/100</span>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${data.accountUrl}" style="display: inline-block; padding: 12px 32px; background-color: #EA580C; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">View Account</a>
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
