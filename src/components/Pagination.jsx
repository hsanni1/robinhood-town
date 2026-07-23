function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Build the visible page tokens with collapsed ranges represented by "ellipsis".
 * siblingCount neighbours around the current page, plus first & last always shown.
 */
function getPageItems(current, total, siblingCount = 1) {
  const totalNumbers = siblingCount * 2 + 5; // first, last, current, 2 ellipses, siblings
  if (total <= totalNumbers) return range(1, total);

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    return [...range(1, 3 + 2 * siblingCount), "ellipsis", total];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    return [1, "ellipsis", ...range(total - (2 + 2 * siblingCount), total)];
  }
  return [1, "ellipsis", ...range(leftSibling, rightSibling), "ellipsis", total];
}

export default function Pagination({ page, totalPages, onPageChange, label = "pagination" }) {
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  const go = (e, target) => {
    e.preventDefault();
    if (target >= 1 && target <= totalPages && target !== page) onPageChange(target);
  };

  return (
    <nav aria-label={label} className="pagination">
      <ul className="pagination-list">
        <li>
          <a
            href="#"
            className={`pagination-link pagination-edge ${atStart ? "is-disabled" : ""}`}
            aria-label="Go to previous page"
            aria-disabled={atStart || undefined}
            onClick={(e) => (atStart ? e.preventDefault() : go(e, page - 1))}
          >
            ‹ <span className="pagination-word">Prev</span>
          </a>
        </li>

        {items.map((item, i) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${i}`} className="pagination-ellipsis">
              <span aria-hidden="true">…</span>
              <span className="sr-only">More pages</span>
            </li>
          ) : (
            <li key={item}>
              <a
                href="#"
                className="pagination-link"
                aria-current={item === page ? "page" : undefined}
                aria-label={`Go to page ${item}`}
                onClick={(e) => go(e, item)}
              >
                {item}
              </a>
            </li>
          )
        )}

        <li>
          <a
            href="#"
            className={`pagination-link pagination-edge ${atEnd ? "is-disabled" : ""}`}
            aria-label="Go to next page"
            aria-disabled={atEnd || undefined}
            onClick={(e) => (atEnd ? e.preventDefault() : go(e, page + 1))}
          >
            <span className="pagination-word">Next</span> ›
          </a>
        </li>
      </ul>
    </nav>
  );
}
