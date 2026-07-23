import { useEffect, useState } from "react";

/**
 * 1-based pagination state with a single source of truth for the
 * 1-based -> 0-based offset conversion (startOffset below is the ONE place
 * we subtract 1 and multiply by pageSize). Whenever the totals or page size
 * change, totalPages is recomputed and the current page is clamped back into
 * range - both in render (via `current`) and in state (via the effect).
 */
export function usePagination(totalItems, pageSize) {
  const [page, setPage] = useState(1); // 1-based, what the UI shows

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = Math.min(Math.max(1, page), totalPages); // clamped for render

  // Keep state in sync when totals / page size shrink under the current page.
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  // --- the single 1-based -> 0-based conversion in the whole app ---
  const startOffset = (current - 1) * pageSize;
  const endOffset = startOffset + pageSize;

  const paginate = (items) => items.slice(startOffset, endOffset);

  return { page: current, setPage, totalPages, startOffset, endOffset, paginate };
}
