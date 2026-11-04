// Modal, drawer and dropdown menu with focus handling, Escape and outside-click.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "./utils";

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

function useLockScroll(open) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

export function Modal({ open, onClose, title, size = "", footer, children, closeOnOverlay = true, top = false }) {
  const ref = useRef(null);
  useEscape(open, onClose);
  useLockScroll(open);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className={cn("pc-overlay", top && "top")} onMouseDown={(e) => closeOnOverlay && e.target === e.currentTarget && onClose?.()}>
      <div className={cn("pc-modal", size)} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        {title && (
          <header className="pc-modal-head">
            <h2>{title}</h2>
            <button className="pc-iconbtn" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </header>
        )}
        <div className="pc-modal-body">{children}</div>
        {footer && <footer className="pc-modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

export function Drawer({ open, onClose, title, children }) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <>
      <div className="pc-overlay" style={{ zIndex: 79, placeItems: "stretch" }} onMouseDown={onClose} />
      <aside className="pc-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header className="pc-modal-head">
          <h2>{title}</h2>
          <button className="pc-iconbtn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>
        <div className="pc-modal-body" style={{ flex: 1 }}>
          {children}
        </div>
      </aside>
    </>,
    document.body
  );
}

/** Closes when clicking outside or pressing Escape. The parent owns `open`. */
export function Menu({ open, onClose, className = "", align = "left", direction = "down", children }) {
  const ref = useRef(null);
  useEscape(open, onClose);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className={cn("pc-menu", align === "right" && "right", direction, className)} role="menu" onClick={() => onClose?.()}>
      {children}
    </div>
  );
}
