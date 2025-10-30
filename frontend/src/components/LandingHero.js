import { useRouter } from "next/router";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function LandingHero() {
  const router = useRouter();
  const { user } = useAuth();
  const [game, setGame] = useState("");

  const go = (e) => {
    e.preventDefault();
    const slug = game
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    if (slug) router.push(`/rooms/${slug}`);
  };

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand">PlayTogether</div>
        <nav className="links">
          <Link href="#games">Games</Link>
          {user ? (
            <span className="welcome">Hi, {user.username}</span>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register" className="primary">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="hero">
        <section className="hero-copy">
          <div className="pill-row">
            <span className="pill">All Platforms</span>
            <span className="pill">All Games</span>
          </div>
          <h1 className="hero-title">Game Together</h1>
          <p className="hero-sub">
            Match with players who love your games and jump into voice + chat
            instantly.
          </p>

          <form onSubmit={go} className="hero-search">
            <input
              aria-label="Enter game name"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              placeholder="Enter a game (e.g., valorant)"
            />
            <button type="submit">Join Room</button>
          </form>
        </section>

        <aside className="hero-visual" aria-hidden>
          <div className="gaming-setup">
            <img
              src="https://plus.unsplash.com/premium_photo-1679177183778-d2f70b65c51f?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Gaming setup with keyboard and mouse"
              className="gaming-image"
            />
          </div>
        </aside>
      </main>
    </div>
  );
}
