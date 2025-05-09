'use client';

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function MealPlan() {
  return (
    <motion.section
      id="weekly-meal-plan"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="container">
        <h2 className="section-title">
          This is What Your Meal Plan Could Look Like
        </h2>
        <p className="section-subtitle">
          Based on local grocery deals and prior meals we've served
        </p>

        <div className="meal-carousel">
          <div className="meal-track">
            {/* First set of meals */}
            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal1.png" alt="Ground Beef Tacos" />
              </div>
              <h3>Ground Beef Tacos</h3>
            </div>

            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal2.png" alt="Pork Stir Fry" />
              </div>
              <h3>Pork Stir Fry</h3>
            </div>

            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal3.png" alt="Tilapia and Veggies" />
              </div>
              <h3>Tilapia and Veggies</h3>
            </div>

            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal4.png" alt="Kale Soup and Toast" />
              </div>
              <h3>Kale Soup and Toast</h3>
            </div>

            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal5.png" alt="Egg Salad Sandwich" />
              </div>
              <h3>Egg Salad Sandwich</h3>
            </div>

            {/* Duplicate meals for seamless looping */}
            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal1.png" alt="Ground Beef Tacos" />
              </div>
              <h3>Ground Beef Tacos</h3>
            </div>

            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal2.png" alt="Pork Stir Fry" />
              </div>
              <h3>Pork Stir Fry</h3>
            </div>

            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal3.png" alt="Tilapia and Veggies" />
              </div>
              <h3>Tilapia and Veggies</h3>
            </div>

            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal4.png" alt="Kale Soup and Toast" />
              </div>
              <h3>Kale Soup and Toast</h3>
            </div>

            <div className="meal-card">
              <div className="meal-image">
                <img src="/Meal5.png" alt="Egg Salad Sandwich" />
              </div>
              <h3>Egg Salad Sandwich</h3>
            </div>
          </div>
        </div>

        <div className="view-all-meals">
          <Link href="/plan">
            <button className="btn-primary">View This Week's Menu</button>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
