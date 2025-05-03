import React from "react";

export default function Features() {
  return (
    <section className="features">
      <div className="container">
        <div className="section-title">
          <h2>Save Time, Money, and Food Waste</h2>
          <p>SmartCart helps you maximize savings and minimize waste with these powerful features</p>
        </div>
        
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Flyer Deal Finder</h3>
            <p>Automatically scans this week's deals from all your local grocery stores</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🍽️</div>
            <h3>AI Meal Planning</h3>
            <p>Creates personalized meal plans that use ingredients on sale this week</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Price History Tracking</h3>
            <p>Know if that "sale" is really a good deal with historical price tracking</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Smart Shopping List</h3>
            <p>Automatically organized by store aisle to make shopping quick and efficient</p>
          </div>
        </div>
      </div>
    </section>
  );
}