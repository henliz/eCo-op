import React from "react";

export default function HowItWorks() {
  return (
    <section className="how-it-works">
      <div className="container">
        <div className="section-title">
          <h2>How It Works</h2>
          <p>SmartCart makes grocery shopping easier, faster, and more affordable in just a few simple steps.</p>
        </div>
        
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 className="step-title">Tell Us Your Preferences</h3>
            <p className="step-description">Let us know your dietary preferences, allergies, and favorite stores.</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">2</div>
            <h3 className="step-title">We Find The Deals</h3>
            <p className="step-description">Our system scans local flyers to find the best sales in your area.</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">3</div>
            <h3 className="step-title">Get Your Meal Plan</h3>
            <p className="step-description">Receive a customized meal plan based on what's on sale this week.</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">4</div>
            <h3 className="step-title">Shop & Save</h3>
            <p className="step-description">Use your organized shopping list to save time and money at the store.</p>
          </div>
        </div>
      </div>
    </section>
  );
}