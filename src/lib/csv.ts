/**
 * CSV書き出しユーティリティ。
 * 先頭にBOMを付けるので、ExcelやGoogleスプレッドシートで開いても日本語が化けない。
 */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined): string => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers, ...rows].map((r) => r.map(escape).join(","));
  return "﻿" + lines.join("\r\n");
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
