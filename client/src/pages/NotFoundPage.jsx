import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { Contours } from "../components/ui";
import { BrandNav } from "../components/brand/BrandNav";

export default function NotFoundPage() {
  return (
    <div className="br" style={{ overflow: "hidden" }}>
      <BrandNav />
      <Contours />
      <main id="main" style={{ position: "relative", minHeight: "calc(100vh - 80px)", display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
        <div>
          <div className="display" style={{ fontSize: 96, fontWeight: 700, lineHeight: 1, background: "linear-gradient(90deg, #ffffff, #9b9b9b)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>404</div>
          <h1 style={{ fontSize: 30, margin: "8px 0", fontWeight: 700 }}>This page does not exist</h1>
          <p className="br-sub" style={{ margin: "0 auto 24px", maxWidth: 420 }}>The link may be broken, or the page may have moved. Go back to the home page and try again.</p>
          <Link to="/" className="br-btn primary">
            <ArrowLeft size={16} /> Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
