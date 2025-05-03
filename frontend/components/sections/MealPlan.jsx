import React from "react";
import Link from "next/link";

export default function MealPlan() {
  return (
    <section id="weekly-meal-plan">
      <div className="container">
        <h2 className="section-title">This Week's Meal Plan</h2>
        <p className="section-subtitle">Based on local grocery deals and your preferences</p>
        
        <div className="meal-carousel">
          <div className="meal-track">
            {/* First set of meals */}
            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal1.png" alt="Teriyaki Chicken" />
              </div>
              <h3>Teriyaki Chicken</h3>
            </div>
            
            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal2.png" alt="Veggie Pasta" />
              </div>
              <h3>Veggie Pasta</h3>
            </div>
            
            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal3.png" alt="Fish Tacos" />
              </div>
              <h3>Fish Tacos</h3>
            </div>
            
            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal4.png" alt="Beef Stir Fry" />
              </div>
              <h3>Beef Stir Fry</h3>
            </div>
            
            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal5.png" alt="Vegetable Curry" />
              </div>
              <h3>Vegetable Curry</h3>
            </div>
            
            {/* Duplicate meals for seamless looping */}
            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal1.png" alt="Teriyaki Chicken" />
              </div>
              <h3>Teriyaki Chicken</h3>
            </div>
            
            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal2.png" alt="Veggie Pasta" />
              </div>
              <h3>Veggie Pasta</h3>
            </div>
            
            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal3.png" alt="Fish Tacos" />
              </div>
              <h3>Fish Tacos</h3>
            </div>
            
            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal4.png" alt="Beef Stir Fry" />
              </div>
              <h3>Beef Stir Fry</h3>
            </div>
            
            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal5.png" alt="Vegetable Curry" />
              </div>
              <h3>Vegetable Curry</h3>
            </div>
          </div>
        </div>
        
        <div className="view-all-meals">
          <Link href="/meal-planner">
            <button className="btn-primary">View Full Menu</button>
          </Link>
        </div>
      </div>
    </section>
  );
}