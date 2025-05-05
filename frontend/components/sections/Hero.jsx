import React from "react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Your groceries, but smarter.</h1>
        <p>SmartCart uses AI to help Canadians save money on groceries during the cost of living crisis by creating meal plans based on this week's local deals and flyers.</p>
        <div className="hero-btns">
          <Link href="/plan">
            <button className="btn-primary">Get My Free Meal Plan</button>
          </Link>
          <button className="btn-secondary">Get This Week's Groceries</button>
        </div>
        <br />
        <p><small><strong>We're coming to these platforms soon, stay tuned for launch day!</strong></small></p>
        <div className="download-app">
          <button className="app-store-btn">
            <span className="app-store-icon">📱</span>
            <div className="app-store-text">
              <small>Download on the</small>
              <strong>App Store</strong>
            </div>
          </button>
          <button className="app-store-btn">
            <span className="app-store-icon">▶️</span>
            <div className="app-store-text">
              <small>GET IT ON</small>
              <strong>Google Play</strong>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}