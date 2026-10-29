import { useEffect, useRef, useState } from "react";

/** Fades and lifts its children in once, the first time they scroll into view. */
export function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return setShown(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold: 0.12 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`br-reveal ${shown ? "in" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/** A large statement whose words light up one by one as they cross the viewport. */
export function TaglineReveal({ text }) {
  const words = text.split(" ");
  const refs = useRef([]);
  const [lit, setLit] = useState(() => new Set());

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return setLit(new Set(words.keys()));
    const observer = new IntersectionObserver(
      (entries) =>
        setLit((prev) => {
          const next = new Set(prev);
          for (const e of entries) if (e.isIntersecting) next.add(Number(e.target.dataset.i));
          return next;
        }),
      // Words count as lit once they pass the lower third of the screen
      { rootMargin: "0px 0px -35% 0px" }
    );
    refs.current.forEach((n) => n && observer.observe(n));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="br-tagline" aria-label={text}>
      <p aria-hidden="true">
        {words.map((w, i) => (
          <span key={i} data-i={i} ref={(n) => (refs.current[i] = n)} className={lit.has(i) ? "on" : ""} style={{ transitionDelay: `${(i % 6) * 30}ms` }}>
            {w}{" "}
          </span>
        ))}
      </p>
    </section>
  );
}
