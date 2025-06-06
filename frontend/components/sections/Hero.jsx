"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const Hero = () => {
  const videoRefs = useRef([]);
  const videoContainerRefs = useRef([]);
  const buttonRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);
  const [transitioning, setTransitioning] = useState(false);


  const tabs = ["add-items", "compare", "optimize", "save"];
  const tabLabels = ["📋 Set", "🥪 Plan", "💸 Shop", "🍳 Cook"];

  useEffect(() => {
    // Force font loading - applying Montserrat Alternates explicitly
    const heading = document.querySelector('.montserrat-alt-heading');
    if (heading) {
      heading.style.fontFamily = "'Montserrat Alternates', sans-serif";
      heading.style.fontWeight = "700";
    }

    // Initialize video refs array
    videoRefs.current = videoRefs.current.slice(0, 4);
    videoContainerRefs.current = videoContainerRefs.current.slice(0, 4);

    // Make sure all videos start paused except the active one
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === activeTab) {
        // Reset current time and play the active video
        video.currentTime = 0;
        video.play().catch(e => console.log("Auto-play prevented:", e));
      } else {
        // Pause all other videos and reset them
        video.pause();
        video.currentTime = 0;
      }

      // Add event listener to detect when video ends
      video.addEventListener('ended', () => {
        // Only proceed if this is the active video and not already transitioning
        if (index === activeTab && !transitioning) {
          const nextTab = (activeTab + 1) % 4;
          transitionToTab(nextTab);
        }
      });
    });

    // Add button click animation
    const button = buttonRef.current;
    if (button) {
      button.addEventListener('mousedown', () => {
        button.classList.add('cta-button-clicked');
      });

      button.addEventListener('mouseup', () => {
        button.classList.remove('cta-button-clicked');
      });

      button.addEventListener('mouseleave', () => {
        button.classList.remove('cta-button-clicked');
      });
    }

    // Manual tab click functionality
    const tabElements = document.querySelectorAll('.tab');
    tabElements.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        // Only transition if not already transitioning
        if (!transitioning && index !== activeTab) {
          transitionToTab(index);
        }
      });
    });

    // Clean up event listeners on unmount
    return () => {
      videoRefs.current.forEach((video) => {
        if (video) {
          video.removeEventListener('ended', () => { });
        }
      });
    };
  }, [activeTab, transitioning]);

  // Function to handle smooth tab transitions - only affecting the video content
  const transitionToTab = (newTabIndex) => {
    if (transitioning) return;
    setTransitioning(true);

    // Prepare next video but keep it hidden
    const nextVideo = videoRefs.current[newTabIndex];
    const nextContainer = videoContainerRefs.current[newTabIndex];

    if (nextVideo) {
      nextVideo.currentTime = 0; // Reset next video to start
      nextVideo.pause(); // Make sure it's paused until we're ready
    }

    // Update tab indicators immediately (this won't cause flickering)
    document.querySelectorAll('.tab').forEach((t, i) => {
      if (i === newTabIndex) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    // First, make both videos visible with the next one having opacity 0
    if (nextContainer) {
      nextContainer.style.opacity = '0';
      nextContainer.style.display = 'block';
    }

    // Brief delay to ensure the display change has taken effect
    setTimeout(() => {
      // Start the crossfade
      if (nextContainer) {
        nextContainer.style.opacity = '1';
      }

      const currentContainer = videoContainerRefs.current[activeTab];
      if (currentContainer) {
        currentContainer.style.opacity = '0';
      }

      // Start playing the new video
      if (nextVideo) {
        nextVideo.play().catch(e => console.log("Video play error:", e));
      }

      // After the fade completes
      setTimeout(() => {
        // Hide the old container completely
        if (currentContainer) {
          currentContainer.style.display = 'none';
        }

        // Pause the old video
        const currentVideo = videoRefs.current[activeTab];
        if (currentVideo) {
          currentVideo.pause();
        }

        // Update the state
        setActiveTab(newTabIndex);
        setTransitioning(false);
      }, 300); // Duration of the crossfade
    }, 50);
  };

  return (
    <>
      <style jsx>{`
        /* Reset and base styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background-color: transparent;
          color: #333;
          font-family: 'Montserrat', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .bg-gradient {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -10;
          background: linear-gradient(135deg, #e6ffff 0%, #fff9f5 100%);
        }

        .bg-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          z-index: -5;
        }

        .bg-blob-1 {
          top: -10%;
          left: -10%;
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, rgba(135, 255, 255, 0.2) 0%, rgba(135, 255, 255, 0) 70%);
          animation: float 25s infinite alternate ease-in-out;
        }

        .bg-blob-2 {
          bottom: -20%;
          right: -20%;
          width: 70%;
          height: 70%;
          background: radial-gradient(circle, rgba(200, 255, 225, 0.2) 0%, rgba(200, 255, 225, 0) 70%);
          animation: float 30s infinite alternate-reverse ease-in-out;
        }

        .bg-blob-3 {
          top: 30%;
          right: 10%;
          width: 40%;
          height: 40%;
          background: radial-gradient(circle, rgba(160, 210, 255, 0.2) 0%, rgba(160, 210, 255, 0) 70%);
          animation: float 35s infinite alternate ease-in-out;
        }

        @keyframes float {
          0% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(3%, 3%) scale(1.05);
          }
          100% {
            transform: translate(-3%, -2%) scale(0.95);
          }
        }

        .wrapper {
          position: relative;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          background: transparent !important;
        }

        .wrapper::before,
        .wrapper::after {
          display: none !important;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
          position: relative;
          z-index: 1;
          background: transparent !important;
        }

        .container::before,
        .container::after {
          display: none !important;
        }

        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 3rem 0;
          position: relative;
          background: transparent !important;
        }

        .hero::before,
        .hero::after {
          display: none !important;
        }

        /* Side Images - Positioned relative to viewport, not content */
        .side-images {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .side-image {
          position: absolute;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          animation-duration: 6s;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          animation-timing-function: ease-in-out;
          opacity: 0.6;
        }

        .side-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .left-image {
          left: calc(50% - 850px);
          top: 15%;
          width: 350px;
          height: 350px;
          transform: rotate(-5deg);
          animation-name: float-left;
        }

        .right-image {
          right: calc(50% - 850px);
          top: 15%;
          width: 350px;
          height: 350px;
          transform: rotate(5deg);
          animation-delay: 2s;
          animation-name: float-right;
        }

        @media (max-width: 1600px) {
          .left-image {
            left: 5%;
          }

          .right-image {
            right: 5%;
          }
        }

        @media (max-width: 1400px) {
          .side-image {
            width: 300px;
            height: 300px;
          }
        }

        @media (max-width: 1200px) {
          .left-image {
            left: 2%;
          }

          .right-image {
            right: 2%;
          }
        }

        @media (max-width: 1000px) {
          .side-image {
            width: 200px;
            height: 200px;
          }
        }

        @media (max-width: 768px) {
          .side-image {
            display: none;
          }
        }

        @keyframes float-left {
          0% {
            transform: translateY(0) rotate(-5deg);
          }
          100% {
            transform: translateY(-20px) rotate(-3deg);
          }
        }

        @keyframes float-right {
          0% {
            transform: translateY(0) rotate(5deg);
          }
          100% {
            transform: translateY(-20px) rotate(7deg);
          }
        }

        /* Powered By Conrad School */
        .powered-by-wrapper {
          margin-bottom: 3rem;
          position: relative;
          display: inline-block;
        }

        .powered-by {
          background: rgba(0, 162, 162, 0.1);
          padding: 0.6rem 1.2rem;
          border-radius: 50px;
          font-size: 0.9rem;
          color: #00a2a2;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 162, 162, 0.15);
        }

        .powered-by strong {
          color: #00a2a2;
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
        }

        /* Border-only animation */
        .border-animation {
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          border-radius: 50px;
          pointer-events: none;
          border: 1px solid transparent;
          overflow: hidden;
        }

        .border-animation::before {
          content: '';
          position: absolute;
          height: 3px;
          width: 40%;
          top: 0;
          background: linear-gradient(90deg,
            transparent,
            rgba(0, 162, 162, 0.3),
            rgba(0, 162, 162, 0.7),
            rgba(0, 162, 162, 0.3),
            transparent
          );
          animation: border-trace-top 2s linear infinite;
        }

        .border-animation::after {
          content: '';
          position: absolute;
          height: 3px;
          width: 40%;
          bottom: 0;
          background: linear-gradient(90deg,
            transparent,
            rgba(0, 162, 162, 0.3),
            rgba(0, 162, 162, 0.7),
            rgba(0, 162, 162, 0.3),
            transparent
          );
          animation: border-trace-bottom 2s linear infinite;
        }

        @keyframes border-trace-top {
          0% {
            left: -40%;
          }
          100% {
            left: 100%;
          }
        }

        @keyframes border-trace-bottom {
          0% {
            right: -40%;
          }
          100% {
            right: 100%;
          }
        }

        /* Main Heading with Montserrat Alternates */
        .montserrat-alt-heading {
          font-family: 'Montserrat Alternates', sans-serif !important;
          font-weight: 700;
          font-size: 2.5rem;
          line-height: 1.3;
          margin-bottom: 1.5rem;
          max-width: 700px;
          color: #333;
        }

        /* Mobile responsive heading */
        @media (max-width: 768px) {
          .montserrat-alt-heading {
            font-size: 2rem;
          }
        }

        .highlight {
          font-family: 'Montserrat', sans-serif !important;
          font-style: italic !important;
          color: #00a2a2;
          font-weight: 600;
          position: relative;
          display: inline-block;
        }

        .highlight::after {
          content: '';
          position: absolute;
          bottom: 5px;
          left: 0;
          width: 100%;
          height: 8px;
          background: linear-gradient(90deg, rgba(0, 162, 162, 0.3), rgba(0, 162, 162, 0.1));
          border-radius: 4px;
        }

        .sub-heading {
          font-size: 1.25rem;
          color: #555;
          margin-bottom: 2rem;
          max-width: 600px;
          line-height: 1.5;
        }

        /* Mobile responsive subheading */
        @media (max-width: 768px) {
          .sub-heading {
            font-size: 1.1rem;
            padding: 0 1rem;
          }
        }

        /* Bright Attention-Grabbing CTA Button */
        .cta-button {
          background: linear-gradient(45deg, #FF9A7B, #FFB299);
          color: white;
          border: none;
          padding: 0.9rem 2rem;
          border-radius: 50px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 3rem;
          box-shadow: 0 8px 25px rgba(255, 154, 123, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.3);
          position: relative;
          overflow: hidden;
          z-index: 1;
          letter-spacing: 0.3px;
        }

        .cta-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, #FFB299, #FFC4B0);
          z-index: -1;
          transform: scaleX(0);
          transform-origin: 0 50%;
          transition: transform 0.5s ease;
        }

        .cta-button:hover::before {
          transform: scaleX(1);
        }

        .cta-button:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 12px 35px rgba(255, 154, 123, 0.6);
        }

        .cta-button-clicked {
          transform: translateY(2px) !important;
          box-shadow: 0 2px 10px rgba(255, 183, 153, 0.2) !important;
          transition: all 0.1s ease !important;
        }

        .cta-button span {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cta-button-icon {
          margin-left: 8px;
          transition: transform 0.3s ease;
        }

        .cta-button:hover .cta-button-icon {
          transform: translateX(4px);
        }

        /* Demo Tabs - Responsive */
        .demo-container {
          width: 100%;
          max-width: 800px;
          background: transparent;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 4rem;
          position: relative;
          z-index: 1;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          background: rgba(255, 255, 255, 0.8);
          position: relative;
          z-index: 2;
          border-radius: 16px 16px 0 0;
        }

        /* Mobile responsive tabs */
        @media (max-width: 768px) {
          .tabs {
            flex-wrap: wrap;
          }

          .tab {
            width: 50%;
            flex: none;
            font-size: 0.8rem;
            padding: 0.8rem 0;
          }
        }

        @media (max-width: 480px) {
          .tab {
            width: 100%;
            padding: 0.6rem 0;
          }
        }

        .tab {
          flex: 1;
          padding: 1rem 0;
          text-align: center;
          cursor: pointer;
          color: #555;
          font-weight: 500;
          position: relative;
          transition: color 0.3s;
        }

        .tab.active {
          color: #00a2a2;
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: #00a2a2;
        }

        /* Video content area */
        .videos-container {
          position: relative;
          height: 400px;
          z-index: 1;
          background: transparent;
        }

        .video-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: opacity 0.3s ease;
          opacity: 0;
          display: none;
          background: transparent;
          border-radius: 0 0 16px 16px;
          overflow: hidden;
        }

        .video-wrapper.active {
          opacity: 1;
          display: block;
        }

        /* Mobile responsive video height */
@media (max-width: 768px) {
  .videos-container {
    height: 350px; /* Increased height */
    width: 140%; /* Increased width for more zoom */
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: -20px; /* Pull down a bit to reduce bottom space */
  }

  .video-wrapper {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  .video-wrapper video {
    width: 100%;
    height: 100%;
    object-fit: cover; /* Changed from contain to cover to fill more space */
    object-position: center; /* Center the focus point */
  }
}

@media (max-width: 480px) {
  .videos-container {
    height: 300px; /* Adjusted height for smallest screens */
    width: 150%; /* Even more zoom for very small screens */
    margin-bottom: -15px;
  }
}
        /* Company Logos Section */
        .logos-section {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto 2rem;
          text-align: center;
        }

        .logos-heading {
          font-size: 1.8rem;
          margin-bottom: 2.5rem;
          color: #333;
        }

        .logos-container {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem 2.5rem;
        }

        .logo-item {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 40px;
          margin: 0 1rem;
        }

        .logo-image {
          max-height: 40px;
          max-width: 120px;
          object-fit: contain;
        }

        /* Button pulse animation - Updated for peach orange */
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 154, 123, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(255, 154, 123, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 154, 123, 0);
          }
        }

        .pulse {
          animation: pulse 2s infinite;
        }
      `}</style>

      {/* Background Elements */}
      <div className="bg-gradient"></div>
      <div className="bg-blob bg-blob-1"></div>
      <div className="bg-blob bg-blob-2"></div>
      <div className="bg-blob bg-blob-3"></div>

      <div className="wrapper">
        {/* Side Images - Positioned outside the content flow */}
        <div className="side-images">
          <div className="side-image left-image"><img src="/HeroSide1.png" alt="Description of Img1" /></div>
          <div className="side-image right-image"><img src="/HeroSide2.png" alt="Description of Img2" /></div>
        </div>

        <div className="container">
          <div className="hero">
            {/* Powered by Conrad School */}
            <div className="powered-by-wrapper">
              <div className="powered-by">
                Powered by <a href="https://uwaterloo.ca/conrad-school-entrepreneurship-business/" target="_blank" rel="noopener noreferrer"><strong>Conrad School</strong></a> 🚀
              </div>
              <div className="border-animation"></div>
            </div>

            {/* Main Text with GUARANTEED Montserrat Alternates */}
            <h1 className="montserrat-alt-heading">
              Let's make the cost of living feel <span className="highlight">livable</span>
            </h1>

            <p className="sub-heading">
              Skrimp is your personal AI sous chef, helping you plan meals and save money.
            </p>

            {/* Animated CTA Button with Link */}
            <Link href="/plan" passHref>
              <button ref={buttonRef} className="cta-button pulse">
                <span>
                  Start saving— it's free!
                  <svg
                    className="cta-button-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12H19M19 12L12 5M19 12L12 19"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </Link>

            {/* Demo Tabs - With seamless video transitions */}
            <div className="demo-container">
              {/* Tabs navigation */}
              <div className="tabs">
                {tabLabels.map((label, index) => (
                  <div
                    key={index}
                    className={`tab ${index === activeTab ? 'active' : ''}`}
                    data-tab={tabs[index]}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Videos container - all videos positioned absolutely for seamless transitions */}
              <div className="videos-container">
                {tabs.map((tab, index) => (
                  <div
                    key={index}
                    className={`video-wrapper ${index === activeTab ? 'active' : ''}`}
                    ref={el => videoContainerRefs.current[index] = el}
                  >
                    <video
                      ref={el => videoRefs.current[index] = el}
                      autoPlay={index === activeTab}
                      loop={false}
                      muted
                      playsInline
                      controls={false}
                    >
                      <source src={`/Step${index + 1}_Clip.mp4`} type="video/mp4" />
                    </video>
                  </div>
                ))}
              </div>
            </div>

            {/* Logo Bar - Similar to Simplify.com */}
            <div className="logos-section">
              <h2 className="logos-heading">Supported Grocery Stores</h2>
              <div className="logos-container">
                <div className="logo-item">
                  <img src="/NoFrills_Logo.png" alt="No Frills" className="logo-image" />
                </div>
                <div className="logo-item">
                  <img src="/Walmart_Logo.png" alt="Walmart" className="logo-image" />
                </div>
                <div className="logo-item">
                  <img src="/Zehrs_Logo.png" alt="Zehrs" className="logo-image" />
                </div>
                <div className="logo-item">
                  <img src="/FoodBasics_Logo.png" alt="Food Basics" className="logo-image" />
                </div>
                <div className="logo-item">
                  <img src="/FarmBoy_Logo.png" alt="FarmBoy" className="logo-image" />
                </div>
                <div className="logo-item">
                  <img src="/Sobeys_Logo.png" alt="Sobeys" className="logo-image" />
                </div>
                <div className="logo-item">
                  <img src="/Metro_Logo.png" alt="Metro" className="logo-image" />
                </div>
                <div className="logo-item">
                  <img src="/FreshCo_Logo.png" alt="FreshCo" className="logo-image" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;