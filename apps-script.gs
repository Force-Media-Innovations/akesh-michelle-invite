/**
 * RSVP receiver for the Akesh & Michelle invitation.
 *
 * 1. Create a Google Sheet, then Extensions > Apps Script, paste this file and Save.
 * 2. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 * 3. Copy the Web app URL into rsvpEndpoint in config.js and redeploy the site.
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Received', 'Name', 'Attending', 'Guests', 'Note', 'Invite link name']);
  }
  var p = e.parameter || {};
  sheet.appendRow([new Date(), p.name || '', p.attending || '', p.guests || '', p.note || '', p.link || '']);
  return ContentService.createTextOutput('ok');
}
