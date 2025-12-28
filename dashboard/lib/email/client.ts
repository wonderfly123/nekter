import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY is not set. Email functionality will be disabled.');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export { sgMail };
