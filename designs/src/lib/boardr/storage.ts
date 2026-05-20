import type { Board, PublishedSnapshot } from "./types";

const BOARDS_KEY = "boardr:boards";
const KEY_INDEX = "boardr:keyIndex"; // hash -> boardId
const PUBLISHED_KEY = "boardr:published"; // 5digit -> snapshot
const LAST_BOARD = "boardr:lastBoardId";

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomKey(len = 24): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, len);
}

export function randomFiveDigit(): string {
  // 5-char base36 — short and friendly
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let n = 0;
  for (const b of bytes) n = n * 256 + b;
  return n.toString(36).padStart(5, "0").slice(-5);
}

export function allBoards(): Record<string, Board> {
  return read<Record<string, Board>>(BOARDS_KEY, {});
}
export function saveBoards(b: Record<string, Board>) {
  write(BOARDS_KEY, b);
}
export function saveBoard(board: Board) {
  const boards = allBoards();
  boards[board.id] = board;
  saveBoards(boards);
  const idx = read<Record<string, string>>(KEY_INDEX, {});
  idx[board.editKeyHash] = board.id;
  write(KEY_INDEX, idx);
  write(LAST_BOARD, board.id);
}
export function getBoard(id: string): Board | null {
  return allBoards()[id] ?? null;
}
export async function getBoardByEditKey(key: string): Promise<Board | null> {
  const hash = await sha256Hex(key);
  const idx = read<Record<string, string>>(KEY_INDEX, {});
  const id = idx[hash];
  if (!id) return null;
  return getBoard(id);
}
export function getLastBoardId(): string | null {
  return read<string | null>(LAST_BOARD, null);
}

export function publishBoard(board: Board): string {
  let key = board.publishedKey || randomFiveDigit();
  const published = read<Record<string, PublishedSnapshot>>(PUBLISHED_KEY, {});
  // ensure uniqueness if generating new
  if (!board.publishedKey) {
    while (published[key]) key = randomFiveDigit();
  }
  const snap: PublishedSnapshot = {
    boardId: board.id,
    kind: board.kind,
    name: board.name,
    assets: board.assets,
    strings: board.strings,
    publishedAt: Date.now(),
  };
  published[key] = snap;
  write(PUBLISHED_KEY, published);
  board.publishedKey = key;
  saveBoard(board);
  return key;
}

export function getPublished(key: string): PublishedSnapshot | null {
  const published = read<Record<string, PublishedSnapshot>>(PUBLISHED_KEY, {});
  return published[key] ?? null;
}

export async function createBoard(name: string, kind: Board["kind"]): Promise<Board> {
  const id = randomKey(12);
  const editKey = randomKey(20);
  const editKeyHash = await sha256Hex(editKey);
  const board: Board = {
    id,
    name,
    kind,
    assets: [],
    strings: [],
    editKey,
    editKeyHash,
    updatedAt: Date.now(),
    createdAt: Date.now(),
  };
  saveBoard(board);
  return board;
}