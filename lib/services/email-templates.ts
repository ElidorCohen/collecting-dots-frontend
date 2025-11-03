const commonStyles = `
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
  .header { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
  .content { padding: 20px; }
  .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; }
  .highlight { background-color: #e8f5e8; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }
`;

export function getDemoSubmissionConfirmation(
  labelName: string,
  artistName: string,
  trackTitle: string,
  demoId: string
): { subject: string; htmlBody: string; textBody: string } {
  const subject = `Demo Submission Confirmation - ${trackTitle}`;

  const htmlBody = `
    <html>
    <head><style>${commonStyles}</style></head>
    <body>
      <div class="header">
        <h1>${labelName}</h1>
      </div>
      <div class="content">
        <h2>Thank you for your submission!</h2>
        <p>Dear ${artistName},</p>
        <p>Thank you for sharing your demo "<strong>${trackTitle}</strong>" with ${labelName}.</p>
        <p>We appreciate your interest and the time you took to submit your music.</p>
        <p>Our team carefully reviews all submissions.</p>
        <p>While we can't provide individual feedback due to the high volume of demos, please know that we listen to everything we receive.</p>
        <div class="highlight">
          <h3>📋 Submission Guidelines</h3>
          <ul>
            <li><strong>Full tracks only</strong> - complete versions work best</li>
            <li><strong>Maximum 3 tracks</strong> - quality over quantity</li>
            <li><strong>Clear file naming</strong> - include artist name and track title</li>
          </ul>
        </div>
        <p>If your track fits our vision, we'll contact you to discuss next steps.</p>
        <p>Best regards,<br><strong>${labelName} Family</strong></p>
      </div>
      <div class="footer">
        <p>&copy; 2024 ${labelName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const textBody = `
${labelName}

Thank you for your submission!

Dear ${artistName},

Thank you for sharing your demo "${trackTitle}" with ${labelName}.
We appreciate your interest and the time you took to submit your music.

Our team carefully reviews all submissions.

While we can't provide individual feedback due to the high volume of demos, please know that we listen to everything we receive.

Submission Guidelines:
• Full tracks only - complete versions work best
• Maximum 3 tracks - quality over quantity
• Clear file naming - include artist name and track title

If your track fits our vision, we'll contact you to discuss next steps.

Best regards,
${labelName} Family
  `;

  return { subject, htmlBody, textBody };
}
