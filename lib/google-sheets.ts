/**
 * Server-only Google Sheets API client.
 * Uses a service account with read-only scope.
 *
 * Required environment variables:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  — the service account email
 *   GOOGLE_PRIVATE_KEY            — the private key (with literal \n for newlines)
 */

import { google } from "googleapis";

/** Build a read-only JWT auth client from env vars. */
function buildAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      "Google Sheets integration is not configured. " +
        "Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env."
    );
  }

  // Cloud providers often store the key with literal \n — unescape them.
  const privateKey = rawKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

/**
 * Fetch all rows from a Google Sheet.
 *
 * @param spreadsheetId  The spreadsheet ID from the URL.
 * @param sheetName      The tab/sheet name (e.g. "Sheet1").
 * @param range          Optional A1 notation range (e.g. "A1:F200").
 *                       When omitted the full sheet is fetched.
 * @returns A 2-D array of cell values (first row = headers).
 */
export async function fetchSheetRows(
  spreadsheetId: string,
  sheetName: string,
  range?: string | null
): Promise<string[][]> {
  const auth = buildAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  // Build the A1 range: "SheetName!A1:Z" or just "SheetName"
  const fullRange = range?.trim()
    ? `${sheetName}!${range.trim()}`
    : sheetName;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: fullRange,
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  return (response.data.values as string[][]) ?? [];
}

/** Confirm credentials are configured without making a network call. */
export function isGoogleSheetsConfigured(): boolean {
  return (
    Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) &&
    Boolean(process.env.GOOGLE_PRIVATE_KEY)
  );
}
