// Gobble Admin — dependency-free RFC 4180 CSV serialize/parse.
// Handles quoted fields with embedded commas, quotes ("") and newlines —
// required because curator notes contain commas, quotes, emojis and line
// breaks. Server- and client-safe (pure string work).

/** Quote a field only when it contains a delimiter, quote, or newline. */
function escapeField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialize a header row + data rows to CSV text (CRLF line endings). */
export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((row) =>
    row.map((f) => escapeField(f ?? "")).join(",")
  );
  return lines.join("\r\n") + "\r\n";
}

/**
 * Parse CSV text into a matrix of strings. Handles quoted fields (with
 * embedded `,`, CR/LF and escaped `""`), strips a leading BOM, and drops a
 * single trailing empty line. Accepts \r\n, \n and lone \r as row breaks.
 */
export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < src.length) {
    const c = src[i];

    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (c === "\r") {
      // Consume \r or \r\n as a single row break.
      pushRow();
      i += src[i + 1] === "\n" ? 2 : 1;
      continue;
    }
    if (c === "\n") {
      pushRow();
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }

  // Flush the last field/row (unless the input ended exactly on a row break).
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  // Drop a trailing empty row (single empty field from a final newline).
  if (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 1 && last[0] === "") rows.pop();
  }

  return rows;
}
