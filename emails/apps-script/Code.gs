/**
 * Tudlo — send the HTML inquiry-reply email from Gmail via Google Apps Script.
 *
 * WHY: pasting HTML into the Gmail compose box (even via devtools) strips the
 * document and often sends blank. Apps Script sends a real text/html message,
 * so <style>, media queries and hosted images all survive.
 *
 * ONE-TIME SETUP
 *   1. Host emails/inquiry-reply.html publicly (e.g. GitHub Pages) and put its
 *      URL in TEMPLATE_URL below.
 *   2. In that HTML, make sure the two logo <img src> values are hosted URLs,
 *      NOT data:image/base64 (Gmail blocks base64 images).
 *   3a. Single send: use this file as a standalone script at script.google.com.
 *   3b. Bulk send:   create a Google Sheet, then Extensions -> Apps Script and
 *       paste this file there (see sendBatch notes).
 *   4. First Run -> "Authorization required" -> Review permissions -> your
 *      account -> Advanced -> Go to (project) -> Allow.
 *
 * Gmail daily send cap: ~500 recipients/day on consumer Gmail (2,000 on
 * Workspace). For more, use a dedicated email service with the same HTML.
 */

// ---------------------------------------------------------------------------
// CONFIG — edit these
// ---------------------------------------------------------------------------
const TEMPLATE_URL =
  'https://YOUR-USERNAME.github.io/YOUR-REPO/emails/inquiry-reply.html';
const SUBJECT = 'Thanks for reaching out to Tudlo';
const FROM_NAME = 'Tudlo';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fetch the template once and swap {{first_name}} (tolerates {{ first_name }}). */
function buildEmail_(firstName) {
  const name = String(firstName || 'there').trim() || 'there';
  const html = UrlFetchApp.fetch(TEMPLATE_URL).getContentText()
    .replace(/\{\{\s*first_name\s*\}\}/g, name);
  const text =
    'Hi ' + name + ', thanks for your interest in Tudlo. ' +
    'View this message in an HTML-capable email client.';
  return { html: html, text: text, name: name };
}

// ---------------------------------------------------------------------------
// 1) SINGLE SEND — edit the two values, then Run this function
// ---------------------------------------------------------------------------
function sendTudloReply() {
  const recipientName = 'Maria';               // client's first name
  const recipientEmail = 'maria@example.com';  // client's email

  const msg = buildEmail_(recipientName);
  GmailApp.sendEmail(recipientEmail, SUBJECT, msg.text, {
    htmlBody: msg.html,
    name: FROM_NAME,
  });
  Logger.log('Sent to %s <%s>', msg.name, recipientEmail);
}

// ---------------------------------------------------------------------------
// 2) BULK SEND — from a Google Sheet
//
// Sheet layout (row 1 = headers, exactly these words):
//     A: name      B: email                 C: sent
//     Maria        maria@example.com        (leave blank)
//     John         john@company.com         (leave blank)
//
// Paste this file into the Sheet's Apps Script (Extensions -> Apps Script),
// then run sendBatch. It emails every row whose "sent" cell is empty and
// writes a timestamp there, so re-running never double-sends. Add new clients
// to the bottom and run again.
// ---------------------------------------------------------------------------
function sendBatch() {
  const template = UrlFetchApp.fetch(TEMPLATE_URL).getContentText();

  const sheet = SpreadsheetApp.getActiveSheet();
  const values = sheet.getDataRange().getValues();
  const header = values.shift();

  const iName = header.indexOf('name');
  const iMail = header.indexOf('email');
  const iSent = header.indexOf('sent');
  if (iName < 0 || iMail < 0 || iSent < 0) {
    throw new Error('Header row must contain: name, email, sent');
  }

  let sent = 0;
  values.forEach(function (row, r) {
    const email = String(row[iMail] || '').trim();
    if (row[iSent] || !email) return; // already sent or no address

    const name = String(row[iName] || 'there').trim() || 'there';
    const html = template.replace(/\{\{\s*first_name\s*\}\}/g, name);
    const text =
      'Hi ' + name + ', thanks for your interest in Tudlo. ' +
      'View this message in an HTML-capable email client.';

    GmailApp.sendEmail(email, SUBJECT, text, {
      htmlBody: html,
      name: FROM_NAME,
    });

    sheet.getRange(r + 2, iSent + 1).setValue(new Date()); // +2: header + 1-index
    SpreadsheetApp.flush();
    sent++;
    Utilities.sleep(1200); // be gentle with Gmail's rate limits
  });

  Logger.log('Batch done. Emails sent: %s', sent);
}

/** Optional: adds a "Tudlo" menu to the Sheet so you can run sendBatch by click. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tudlo')
    .addItem('Send batch (unsent rows)', 'sendBatch')
    .addToUi();
}
