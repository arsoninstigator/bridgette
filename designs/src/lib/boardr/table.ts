export type TableMerge = { r: number; c: number; rs: number; cs: number }; // r = -1 for header row
export type TableAlign = "left" | "center" | "right";

export type TableData = {
  headers: string[];
  rows: string[][];
  merges?: TableMerge[];
  colWidths?: (number | null)[];
  aligns?: TableAlign[];
};

export function normalizeTable(raw: unknown): TableData {
  const d = (raw && typeof raw === "object" ? raw : {}) as Partial<TableData>;
  const headers = Array.isArray(d.headers) ? d.headers.map((h) => String(h ?? "")) : ["col 1", "col 2"];
  const cols = headers.length;
  const rows = Array.isArray(d.rows)
    ? d.rows.map((r) => {
        const arr = Array.isArray(r) ? r.map((c) => String(c ?? "")) : [];
        while (arr.length < cols) arr.push("");
        return arr.slice(0, cols);
      })
    : [["", ""]];
  const merges = Array.isArray(d.merges)
    ? d.merges.filter(
        (m) => m && typeof m.r === "number" && typeof m.c === "number" && (m.rs > 1 || m.cs > 1),
      )
    : [];
  const colWidths = Array.isArray(d.colWidths) ? d.colWidths.slice(0, cols) : [];
  const aligns = Array.isArray(d.aligns) ? (d.aligns.slice(0, cols) as TableAlign[]) : [];
  while (colWidths.length < cols) colWidths.push(null);
  while (aligns.length < cols) aligns.push("left");
  return { headers, rows, merges, colWidths, aligns };
}

/** Cells covered by a merge but not the anchor: key `${r}:${c}` */
export function coveredCells(merges: TableMerge[] | undefined): Set<string> {
  const set = new Set<string>();
  for (const m of merges ?? []) {
    for (let r = m.r; r < m.r + m.rs; r++) {
      for (let c = m.c; c < m.c + m.cs; c++) {
        if (r === m.r && c === m.c) continue;
        set.add(`${r}:${c}`);
      }
    }
  }
  return set;
}

export function mergeAt(merges: TableMerge[] | undefined, r: number, c: number): TableMerge | undefined {
  return (merges ?? []).find((m) => m.r === r && m.c === c);
}

/** Remap merges after a structural change; drops merges that no longer fit. */
export function clampMerges(t: TableData): TableMerge[] {
  const cols = t.headers.length;
  const rows = t.rows.length;
  return (t.merges ?? []).filter(
    (m) => m.c >= 0 && m.c + m.cs <= cols && m.r >= -1 && m.r + m.rs <= rows && (m.rs > 1 || m.cs > 1),
  );
}
