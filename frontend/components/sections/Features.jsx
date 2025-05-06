import React from "react";

export default function Features() {
  return (
    <section id="features"
      className="scroll-mt-15 py-20">
      <div className="container">
        <div className="section-title">
          <h2>Save Time, Money, and Food Waste</h2>
          <p>SmartCart uses artificial intelligence to build affordable meal plans around this week's grocery deals.</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3 className="feature-title">Flyer Deal Finder</h3>
            <p className="feature-description">We scan all local grocery store flyers to find the best deals in your area each week.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🍽️</div>
            <h3 className="feature-title">AI Meal Planning</h3>
            <p className="feature-description">Our AI creates delicious, budget-friendly meal plans using ingredients that are on sale.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Price History Tracking</h3>
            <p className="feature-description">Know if that "sale" is actually a good deal with our price history tracker.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3 className="feature-title">Smart Shopping List</h3>
            <p className="feature-description">Automatically organized by store aisle so you can get in and out faster.</p>
          </div>
        </div>
      </div>
    </section>
  );
}