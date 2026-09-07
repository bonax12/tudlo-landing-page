# Tudlo email templates

## `inquiry-reply.html`

HTML email to reply to people who send an inquiry. Same branding as the landing
page: services, a "Schedule on Google Calendar" CTA, and Telegram / WhatsApp
buttons.

### Before sending

1. **Host the images.** Email clients can't use local files, and Gmail/Outlook
   block base64. Deploy this repo (e.g. GitHub Pages) so these become public:
   - `emails/assets/tudlo-logo.png`
   - `emails/assets/tudlo-logo-white.png`
2. In `inquiry-reply.html`, replace both `<img src="data:image/png;base64,…">`
   with the hosted URLs, e.g.
   `https://<username>.github.io/<repo>/emails/assets/tudlo-logo.png`.
3. Replace the other placeholders:
   - `https://calendar.app.google/REPLACE-WITH-YOUR-BOOKING-LINK`
   - `https://t.me/REPLACE_TELEGRAM_USERNAME`
   - `https://wa.me/REPLACE_WHATSAPP_NUMBER` (country code + number, digits only)
   - `https://YOUR-DOMAIN.com`, `hello@YOUR-DOMAIN.com`
   - `{{first_name}}` — leave it; the send script fills it in per client.

### Sending

Don't paste the HTML into the Gmail compose box — it sends blank. Use one of:

- **`apps-script/Code.gs`** — Google Apps Script. `sendTudloReply()` for one
  client, `sendBatch()` to send to every unsent row of a Google Sheet
  (`name`, `email`, `sent` columns). Set `TEMPLATE_URL` to the hosted
  `inquiry-reply.html`.
- A dedicated email service (Brevo, Mailchimp, MailerSend, …) — paste the HTML,
  upload the logos to its image library, send.

Gmail cap: ~500 recipients/day (consumer), 2,000 (Workspace).
