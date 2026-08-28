import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link, useLocation } from "react-router-dom";

const NAV = [
  { label: "WALL", to: "/" },
  { label: "EXPLORE", to: "/explore" },
  { label: "HOW IT WORKS", to: "/how-it-works" },
  { label: "ONCHAIN", to: "/onchain" },
  { label: "ABOUT", to: "/about" },
];

export default function Header() {
  const { pathname } = useLocation();
  return (
    <header className="flex items-center justify-between px-6 h-16 border-b border-border bg-graphite/95 backdrop-blur sticky top-0 z-40">
      <Link to="/" className="font-mono font-bold text-ink tracking-tight">
        100K BLOCK WALL
      </Link>

      <nav className="hidden md:flex gap-8 font-mono text-xs">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={pathname === item.to ? "text-signal" : "text-muted hover:text-ink"}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-[10px] font-mono text-muted border border-border px-2 py-1">
          ROBINHOOD CHAIN
        </span>
        <ConnectButton
          chainStatus="none"
          accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
          showBalance={false}
        />
      </div>
    </header>
  );
}
