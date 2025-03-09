"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { NextPage } from "next";
import { FaChartLine, FaCode, FaCoins, FaLightbulb, FaRobot, FaUsers } from "react-icons/fa";
import { useAccount } from "wagmi";
import { IdeaPulseLogo } from "~~/components/assets/IdeaPulseLogo";
import { ParticlesBackground } from "~~/components/particles/ParticlesBackground";
import { ContractProjectCard } from "~~/components/shared/ContractProjectCard";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const totalProjects = 5; // Using fixed values or fetch from contract
  const totalRaised = 100000; // Using fixed values or fetch from contract
  const totalOpenTasks = 15; // Using fixed values or fetch from contract

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="flex overflow-hidden flex-col items-center pt-20 min-h-screen">
      {/* Hero Section with Enhanced Background */}
      <section className="relative px-4 py-12 md:py-20 w-full bg-gradient-to-b to-transparent from-base-200/50">
        {/* Enhanced Geometric SVG Background */}
        <div className="absolute inset-0 z-0 opacity-10 overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hexagonPattern" width="56" height="100" patternUnits="userSpaceOnUse">
                <path
                  d="M28,0 L56,16.6 L56,49.8 L28,66.4 L0,49.8 L0,16.6 Z M28,100 L0,83.4 L0,50.2 L28,33.6 L56,50.2 L56,83.4 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
              <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                <stop offset="50%" stopColor="var(--color-secondary)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.3" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagonPattern)" />
            <g filter="url(#glow)">
              {/* Glowing nodes at key intersections */}
              <circle cx="14%" cy="20%" r="3" fill="var(--color-primary)" />
              <circle cx="42%" cy="30%" r="2" fill="var(--color-secondary)" />
              <circle cx="75%" cy="15%" r="2.5" fill="var(--color-accent)" />
              <circle cx="25%" cy="60%" r="2" fill="var(--color-secondary)" />
              <circle cx="65%" cy="70%" r="3" fill="var(--color-primary)" />
              <circle cx="85%" cy="40%" r="2.5" fill="var(--color-accent)" />

              {/* Connection lines between nodes */}
              <path
                d="M14%,20% L42%,30% L75%,15% M42%,30% L25%,60% L65%,70% L85%,40% L42%,30%"
                stroke="url(#glowGradient)"
                strokeWidth="1"
                fill="none"
              />
            </g>
          </svg>
        </div>

        {/* Interactive Particles Background */}
        <div className="absolute inset-0 z-0">
          <ParticlesBackground />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="mb-12"
            >
              <div className="animate-float">
                <IdeaPulseLogo className="mx-auto w-36 h-36" />
              </div>
            </motion.div>
            <motion.h1
              {...fadeInUp}
              className="mb-4 text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r md:text-6xl from-primary via-secondary to-accent"
            >
              Web3 Innovation Hub
            </motion.h1>
            <motion.h2
              {...fadeInUp}
              className="mb-8 text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r md:text-3xl from-secondary to-accent"
            >
              Build with AI, Grow with Community, Tokenize with DAO
            </motion.h2>
            <motion.p {...fadeInUp} className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed opacity-80 md:text-xl">
              Join the future of decentralized innovation where AI and community collaborate to bring groundbreaking
              ideas to life through transparent funding and governance.
            </motion.p>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 gap-6 mb-16 md:gap-8 md:grid-cols-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="border shadow-lg backdrop-blur-lg transition-all card bg-base-100/70 hover:shadow-xl border-primary/20 animate-tech-pulse"
              >
                <div className="flex items-center p-6 text-center card-body">
                  <div className="px-0 stat">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full shadow-lg bg-primary/15 shadow-primary/20">
                        <FaLightbulb className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div className="opacity-60 stat-title">Total Projects</div>
                    <div className="stat-value text-primary">{totalProjects}</div>
                    <div className="stat-desc">Active innovations</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="border shadow-lg backdrop-blur-lg transition-all card bg-base-100/70 hover:shadow-xl border-secondary/20 animate-tech-pulse"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="flex items-center p-6 text-center card-body">
                  <div className="px-0 stat">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full shadow-lg bg-secondary/15 shadow-secondary/20">
                        <FaCoins className="w-8 h-8 text-secondary" />
                      </div>
                    </div>
                    <div className="opacity-60 stat-title">Total Raised</div>
                    <div className="stat-value text-secondary">${totalRaised.toLocaleString()}</div>
                    <div className="stat-desc">In USDT</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="border shadow-lg backdrop-blur-lg transition-all card bg-base-100/70 hover:shadow-xl border-accent/20 animate-tech-pulse"
                style={{ animationDelay: "1s" }}
              >
                <div className="flex items-center p-6 text-center card-body">
                  <div className="px-0 stat">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full shadow-lg bg-accent/15 shadow-accent/20">
                        <FaCode className="w-8 h-8 text-accent" />
                      </div>
                    </div>
                    <div className="opacity-60 stat-title">Open Tasks</div>
                    <div className="stat-value text-accent">{totalOpenTasks}</div>
                    <div className="stat-desc">Available opportunities</div>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div {...fadeInUp} className="flex flex-col gap-4 justify-center sm:flex-row md:gap-6">
              <Link
                href="/projects"
                className="px-10 font-semibold rounded-full shadow-lg transition-transform md:px-12 btn btn-primary btn-lg hover:scale-105 shadow-primary/20 hover:shadow-primary/30"
              >
                Explore Projects
              </Link>
              {!connectedAddress && (
                <button className="px-10 font-semibold rounded-full transition-transform md:px-12 btn btn-outline btn-lg hover:scale-105 border-primary/30 hover:border-primary/60">
                  Connect Wallet
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="relative py-24 w-full bg-gradient-to-b to-transparent from-base-200/30">
        {/* Hexagon SVG Pattern Background */}
        <div className="overflow-hidden absolute inset-0 z-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                <path
                  d="M25,0 L50,14.5 L50,38.5 L25,53 L0,38.5 L0,14.5 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons)" />
          </svg>
        </div>

        <div className="relative z-10 px-4 mx-auto max-w-7xl">
          <motion.div {...fadeInUp} className="mb-16 text-center">
            <h2 className="text-4xl font-bold">
              Key <span className="text-primary">Features</span>
            </h2>
            <div className="mx-auto mt-4 w-24 h-1 rounded-full bg-primary"></div>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 mb-16 md:grid-cols-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="border shadow-lg backdrop-blur-lg transition-all card bg-base-100/80 hover:shadow-xl border-primary/10"
            >
              <div className="p-8 text-center card-body">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-primary/10">
                    <FaRobot className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <h3 className="mb-4 text-xl font-bold">AI-Powered Innovation</h3>
                <p className="opacity-80">
                  Leverage AI agents for project evaluation, task management, and real-time code auditing
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="border shadow-lg backdrop-blur-lg transition-all card bg-base-100/80 hover:shadow-xl border-secondary/10"
            >
              <div className="p-8 text-center card-body">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-secondary/10">
                    <FaUsers className="w-10 h-10 text-secondary" />
                  </div>
                </div>
                <h3 className="mb-4 text-xl font-bold">Community Governance</h3>
                <p className="opacity-80">
                  Participate in transparent decision-making through DAO voting and reputation systems
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="border shadow-lg backdrop-blur-lg transition-all card bg-base-100/80 hover:shadow-xl border-accent/10"
            >
              <div className="p-8 text-center card-body">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-accent/10">
                    <FaChartLine className="w-10 h-10 text-accent" />
                  </div>
                </div>
                <h3 className="mb-4 text-xl font-bold">Dynamic Token Economy</h3>
                <p className="opacity-80">Earn rewards through staking, task completion, and community contributions</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="relative py-24 w-full bg-gradient-to-b to-transparent from-base-200/30">
        {/* Abstract curves background */}
        <div className="overflow-hidden absolute inset-0 z-0 opacity-10">
          <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0,1000 C300,800 400,600 500,400 C600,200 700,100 1000,0 L1000,1000 L0,1000 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="relative z-10 px-4 mx-auto max-w-7xl">
          <motion.div {...fadeInUp} className="mb-16 text-center">
            <h2 className="text-4xl font-bold">
              Featured <span className="text-primary">Projects</span>
            </h2>
            <div className="mx-auto mt-4 w-24 h-1 rounded-full bg-primary"></div>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 mb-16 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="[&>a]:!w-full [&>a>div]:!w-full [&>a]:h-full [&>a>div]:h-full"
            >
              <ContractProjectCard projectId={2} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="[&>a]:!w-full [&>a>div]:!w-full [&>a]:h-full [&>a>div]:h-full"
            >
              <ContractProjectCard projectId={3} />
            </motion.div>
          </div>

          <motion.div {...fadeInUp} className="text-center">
            <Link
              href="/projects"
              className="px-12 rounded-full transition-transform btn btn-outline btn-lg hover:scale-105"
            >
              View All Projects
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-24 w-full">
        {/* Circuit-like SVG background */}
        <div className="overflow-hidden absolute inset-0 z-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circuitPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="1" fill="currentColor" />
                <path
                  d="M50,0 L50,100 M0,50 L100,50 M25,25 L75,75 M75,25 L25,75"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  fill="none"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuitPattern)" />
          </svg>
        </div>

        <div className="relative z-10 px-4 mx-auto max-w-7xl">
          <motion.div {...fadeInUp} className="mb-16 text-center">
            <h2 className="text-4xl font-bold">
              How It <span className="text-primary">Works</span>
            </h2>
            <div className="mx-auto mt-4 w-24 h-1 rounded-full bg-primary"></div>
          </motion.div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="border shadow-lg backdrop-blur-lg transition-all card bg-base-100/80 hover:shadow-xl border-primary/10"
            >
              <div className="p-10 text-center card-body">
                <div className="flex justify-center mb-8">
                  <div className="p-5 rounded-full shadow-lg bg-primary/10 shadow-primary/20">
                    <FaCoins className="w-12 h-12 text-primary" />
                  </div>
                </div>
                <h3 className="mb-4 text-2xl font-bold">Support Through Funding</h3>
                <p className="leading-relaxed opacity-80">
                  Back innovative projects with USDT contributions. Get involved early in promising ventures and receive
                  project tokens as rewards through our dynamic staking mechanism.
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="border shadow-lg backdrop-blur-lg transition-all card bg-base-100/80 hover:shadow-xl border-secondary/10"
            >
              <div className="p-10 text-center card-body">
                <div className="flex justify-center mb-8">
                  <div className="p-5 rounded-full shadow-lg bg-secondary/10 shadow-secondary/20">
                    <FaCode className="w-12 h-12 text-secondary" />
                  </div>
                </div>
                <h3 className="mb-4 text-2xl font-bold">Contribute Through Tasks</h3>
                <p className="leading-relaxed opacity-80">
                  Apply your skills to AI-curated project tasks. Complete work with real-time AI assistance and earn
                  USDT rewards while helping projects succeed.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Call to action - Fixed syntax error here */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 text-center"
          >
            <Link
              href="/projects/new"
              className="px-12 font-semibold rounded-full shadow-lg transition-transform btn btn-primary btn-lg hover:scale-105 shadow-primary/20"
            >
              Start Your Project
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
