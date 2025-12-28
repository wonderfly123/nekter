export interface TaskReminderEmailData {
  taskTitle: string;
  taskDescription: string | null;
  accountName: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assigneeName: string;
  taskUrl: string;
  reminderType: '3_days_before' | '1_day_before' | 'overdue';
}

const priorityColors = {
  high: '#DC2626',
  medium: '#EA580C',
  low: '#2563EB'
};

const priorityLabels = {
  high: 'HIGH PRIORITY',
  medium: 'MEDIUM PRIORITY',
  low: 'LOW PRIORITY'
};

const reminderTitles = {
  '3_days_before': 'Task Due in 3 Days',
  '1_day_before': 'Task Due Tomorrow',
  'overdue': 'Task Overdue'
};

const reminderMessages = {
  '3_days_before': 'Your task is due in 3 days',
  '1_day_before': 'Your task is due tomorrow',
  'overdue': 'This task is now overdue'
};

const reminderColors = {
  '3_days_before': '#EA580C',
  '1_day_before': '#EA580C',
  'overdue': '#DC2626'
};

export function generateTaskReminderEmail(data: TaskReminderEmailData): string {
  const priorityColor = priorityColors[data.priority];
  const priorityLabel = priorityLabels[data.priority];
  const reminderTitle = reminderTitles[data.reminderType];
  const reminderMessage = reminderMessages[data.reminderType];
  const reminderColor = reminderColors[data.reminderType];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reminderTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e7eb; background-color: ${data.reminderType === 'overdue' ? '#FEF2F2' : '#FFF7ED'};">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: ${reminderColor};">${reminderTitle}</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">${reminderMessage}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Priority Badge -->
              <div style="margin-bottom: 24px;">
                <span style="display: inline-block; padding: 4px 12px; background-color: ${priorityColor}; color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; border-radius: 4px;">${priorityLabel}</span>
              </div>

              <!-- Task Title -->
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #111827;">${data.taskTitle}</h2>

              <!-- Task Description -->
              ${data.taskDescription ? `
              <div style="margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-left: 3px solid #e5e7eb; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${data.taskDescription}</p>
              </div>
              ` : ''}

              <!-- Task Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 13px; color: #6b7280; font-weight: 500;">Account</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; color: #111827; font-weight: 500;">${data.accountName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-size: 13px; color: #6b7280; font-weight: 500;">Due Date</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 14px; color: ${data.reminderType === 'overdue' ? '#DC2626' : '#111827'}; font-weight: ${data.reminderType === 'overdue' ? '700' : '500'};">${data.dueDate}${data.reminderType === 'overdue' ? ' (OVERDUE)' : ''}</span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${data.taskUrl}" style="display: inline-block; padding: 12px 32px; background-color: ${reminderColor}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">View Task</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">This is an automated reminder from Nekter Task Management System</p>
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
