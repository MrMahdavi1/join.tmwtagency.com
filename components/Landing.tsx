import Quiz from "./Quiz";

const PILLARS = [
  {
    title: "Faith-Focused Culture",
    body: "We believe that purpose leads profit. Our work is rooted in integrity, service, and legacy.",
    icon: (
      <path d="M12 21s-7-4.35-9.5-8.5C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.4.8-1.2 2-2.4 4-2.4 3.5 0 5 3.5 3.5 7C19 16.65 12 21 12 21z" />
    ),
  },
  {
    title: "Family-Oriented Leadership",
    body: "You'll be surrounded by mentors and leaders who live what they teach — in business and at home.",
    icon: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="10" r="2.4" />
        <path d="M2.5 20c0-3.3 2.6-5.5 5.5-5.5s5.5 2.2 5.5 5.5M14.5 20c0-2.3 1.4-4 3.2-4 1.6 0 3 1.2 3.5 3" />
      </>
    ),
  },
  {
    title: "Unmatched Opportunity",
    body: "Through our partnerships, our agents access cutting-edge technology, training, leadership, and global expansion.",
    icon: (
      <>
        <path d="M5 16c-1.5 1.5-2 5-2 5s3.5-.5 5-2c.9-.9.9-2.1 0-3s-2.1-.9-3 0z" />
        <path d="M9 15l-2-2c1-4 4-8 9-9 0 5-4 8-9 9z" />
        <circle cx="14.5" cy="9.5" r="1.3" />
      </>
    ),
  },
  {
    title: "Proven Pathways",
    body: "Whether you're brand new or a seasoned builder, we offer the training, systems, and support you need to win.",
    icon: (
      <>
        <path d="M4 18c3 0 3-12 8-12 3 0 4 2.5 4 5" />
        <path d="M14 9l2.5 2L19 8" />
        <circle cx="4" cy="18" r="1.6" />
      </>
    ),
  },
];

const PERSONAS = [
  {
    tag: "Just getting started",
    title: "New to the Industry",
    body: "You're new to financial services — maybe even unlicensed — but you're coachable, driven, and hungry to make a difference. We'll help you get licensed, trained, and earning fast. You bring the work ethic; we'll bring the blueprint.",
  },
  {
    tag: "Established",
    title: "Ready for More",
    body: "You've had success as an independent agent or team builder — but you're craving more income, more impact, and a culture that matches your values. We'll help you level up with optimized comp, growth tools, and leadership opportunities.",
  },
  {
    tag: "Agency owner",
    title: "Ready to Scale or Relocate",
    body: "You've built something solid — an agency, a team, a vision. Tired of limited contracts, outdated tech, or being boxed in? TMWT (powered by GFI) offers a new foundation built on transparency and long-term value.",
  },
];

export default function Landing() {
  return (
    <div className="lp">
      {/* ---------- Header ---------- */}
      <header className="site-header">
        <div className="container site-header-inner">
          <a className="brand" href="#top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Talk Money With Tish & Associates" />
            <span>Talk Money With Tish &amp; Associates</span>
          </a>
          <a className="btn btn-primary btn-sm" href="#quiz">
            Find your path →
          </a>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="hero" id="top">
        <div className="container hero-inner">
          <span className="eyebrow">TMWT Agency · Join Our Team</span>
          <h1 className="hero-title">
            Your Future in Finance <span className="accent">Starts Here</span>
          </h1>
          <p className="hero-sub">
            Be part of a movement that's redefining what it means to build wealth,
            serve families, and leave a legacy.
          </p>
          <p className="hero-support">
            Whether you're just getting started, growing fast, or building something
            to last — we've created a home for you. You're not just joining a team;
            you're stepping into a movement of heart-driven leaders transforming
            communities through faith, family, and financial education.
          </p>
          <div className="hero-cta">
            <a className="btn btn-primary btn-lg" href="#quiz">
              Take the 2-minute fit check →
            </a>
            <span className="hero-microcopy">
              8 quick questions · no résumé required · book instantly
            </span>
          </div>
        </div>
      </section>

      {/* ---------- Why + Pillars ---------- */}
      <section className="band band-light">
        <div className="container">
          <div className="band-head">
            <span className="eyebrow eyebrow-dark">Why TMWT Agency?</span>
            <h2 className="band-title">More than a financial services firm.</h2>
            <p className="band-lead">
              We're a mission-driven team committed to helping families build real,
              lasting wealth — and empowering the people who make that happen.
              Here's what sets us apart.
            </p>
          </div>

          <div className="pillars-grid">
            {PILLARS.map((p) => (
              <div className="pillar" key={p.title}>
                <span className="pillar-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    {p.icon}
                  </svg>
                </span>
                <h3 className="pillar-title">{p.title}</h3>
                <p className="pillar-body">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Personas ---------- */}
      <section className="band">
        <div className="container">
          <div className="band-head">
            <span className="eyebrow">Who Thrives With Us</span>
            <h2 className="band-title light">There's a seat at the table for you.</h2>
            <p className="band-lead light">
              We're looking for committed, purpose-driven professionals ready to grow
              inside a proven, people-first system — whether you're solo or leading a
              full agency.
            </p>
          </div>

          <div className="personas-grid">
            {PERSONAS.map((p) => (
              <div className="persona" key={p.title}>
                <span className="persona-tag">{p.tag}</span>
                <h3 className="persona-title">{p.title}</h3>
                <p className="persona-body">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Quiz ---------- */}
      <section className="band band-light quiz-section" id="quiz">
        <div className="container">
          <div className="band-head">
            <span className="eyebrow eyebrow-dark">Find your path</span>
            <h2 className="band-title">Let's find your right next step.</h2>
            <p className="band-lead">
              Answer a few quick questions and we'll point you to the best way to
              begin — a group presentation, a 1:1 interview, or a conversation with
              Tish — and hold your spot on the spot.
            </p>
          </div>
          <Quiz />
        </div>
      </section>

      {/* ---------- Closing ---------- */}
      <section className="closing">
        <div className="container closing-inner">
          <h2>Ready to grow with a team that's rooted in purpose?</h2>
          <p>
            Whether you're just getting licensed or leading an agency, we'll help you
            build with integrity, impact, and long-term value.
          </p>
          <a className="btn btn-onlight btn-lg" href="#quiz">
            Start your fit check →
          </a>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="site-footer">
        <div className="container">
          © 2026 Talk Money With Tish &amp; Associates. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
