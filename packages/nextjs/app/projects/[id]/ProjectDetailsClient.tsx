"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { useContractRead, useContractWrite } from "~~/hooks/contracts";
import { notification } from "~~/utils/scaffold-eth";
import { useAccount } from "wagmi";

// Define project data type
type ProjectData = {
  id: number;
  creator: string;
  title: string;
  description: string;
  tags: string[];
  metadata: {
    aiEvaluation: string;
    marketScore: number;
    techFeasibility: string;
    minValuation: number;
    maxValuation: number;
  };
  status: number;
  createdAt: number;
  updatedAt: number;
};

// Define funding info type
type FundingInfo = {
  fundingGoal: bigint;
  raisedAmount: bigint;
  startTime: number;
  endTime: number;
  hasMetFundingGoal: boolean;
  paymentToken: string;
};

// Define task type
type TaskInfo = {
  id: number;
  title: string;
  description: string;
  reward: bigint;
  deadline: number;
  status: number;
  skills: string[];
};

// Create simple cache objects
const projectCache: Record<string, ProjectData> = {};
const fundingCache: Record<string, FundingInfo> = {};
const taskCountCache: Record<string, number> = {};

// Parse project data from contract response
const parseProjectData = (data: any[]): ProjectData => {
  return {
    id: Number(data[0]),
    creator: data[1],
    title: data[2],
    description: data[3],
    tags: data[4],
    metadata: {
      aiEvaluation: data[5].aiEvaluation,
      marketScore: Number(data[5].marketScore),
      techFeasibility: data[5].techFeasibility,
      minValuation: Number(data[5].minValuation),
      maxValuation: Number(data[5].maxValuation),
    },
    status: Number(data[6]),
    createdAt: Number(data[7]),
    updatedAt: Number(data[8]),
  };
};

// Parse funding info from contract response
const parseFundingInfo = (data: any[]): FundingInfo => {
  return {
    fundingGoal: data[0],
    raisedAmount: data[1],
    startTime: Number(data[2]),
    endTime: Number(data[3]),
    hasMetFundingGoal: data[4],
    paymentToken: data[5],
  };
};

// Format amount, convert wei to ETH
const formatAmount = (amount: bigint): string => {
  const ethAmount = Number(amount) / 1e18;
  return ethAmount.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

// Convert ETH to wei
const parseAmount = (amount: string): bigint => {
  try {
    // Convert ETH amount to wei (1 ETH = 10^18 wei)
    const ethAmount = parseFloat(amount);
    if (isNaN(ethAmount) || ethAmount <= 0) {
      throw new Error("Please enter a valid amount");
    }
    return BigInt(Math.floor(ethAmount * 1e18));
  } catch (error) {
    throw new Error("Invalid amount format");
  }
};

// Project status mapping
const statusMap: Record<number, { label: string; color: string }> = {
  0: { label: "Active", color: "bg-green-100 text-green-800" },
  1: { label: "Completed", color: "bg-blue-100 text-blue-800" },
  2: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

// Task status mapping
const taskStatusMap: Record<number, { label: string; color: string }> = {
  0: { label: "Open", color: "bg-secondary text-white" },
  1: { label: "Assigned", color: "bg-primary text-white" },
  2: { label: "In Progress", color: "bg-info text-white" },
  3: { label: "Completed", color: "bg-warning text-white" },
  4: { label: "Verified", color: "bg-success text-white" },
  5: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

type TabType = "details" | "roadmap" | "tasks";

export function ProjectDetailsClient({ projectId }: { projectId: string }) {
  const numericProjectId = parseInt(projectId);
  const { readMethod, isLoading } = useContractRead();
  const { writeMethod } = useContractWrite();
  const { address } = useAccount();
  const [project, setProject] = useState<ProjectData | null>(() => projectCache[projectId] || null);
  const [fundingInfo, setFundingInfo] = useState<FundingInfo | null>(() => fundingCache[projectId] || null);
  const [taskCount, setTaskCount] = useState<number | null>(() => taskCountCache[projectId] || null);
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Contribution related state
  const [contributionAmount, setContributionAmount] = useState("");
  const [isContributing, setIsContributing] = useState(false);

  // Task related state
  const [projectTasks, setProjectTasks] = useState<TaskInfo[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Token claim related state
  const [claimedAmount, setClaimedAmount] = useState<bigint>(0n);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoadingClaimData, setIsLoadingClaimData] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [tokenContribution, setTokenContribution] = useState<bigint>(0n);
  const [tokenInfo, setTokenInfo] = useState<{
    tokenAddress: string;
    totalSupply: bigint;
    crowdfundingPool: bigint;
    teamPool: bigint;
    ecosystemPool: bigint;
    vestingStart: number;
    vestingDuration: number;
  } | null>(null);
  const [unlockedAmount, setUnlockedAmount] = useState<bigint>(0n);
  const [unlockPercentage, setUnlockPercentage] = useState<number>(0);

  // Refresh funding info
  const refreshFundingInfo = async () => {
    try {
      const fundingResult = await readMethod("getFundingInfo", [numericProjectId]);

      if (fundingResult) {
        const parsedFunding = parseFundingInfo(fundingResult as any[]);

        // Update cache
        fundingCache[projectId] = parsedFunding;

        setFundingInfo(parsedFunding);
      }
    } catch (err) {
      console.error("Failed to fetch funding info:", err);
    }
  };

  // Handle contribution submission
  const handleContribute = async () => {
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      notification.error("Please enter a valid amount");
      return;
    }

    try {
      setIsContributing(true);

      // Convert ETH to wei
      const amountInWei = parseAmount(contributionAmount);

      // Show loading notification
      const notificationId = notification.loading("Processing your contribution transaction...");

      // Call contract method
      const result = await writeMethod("contribute", [numericProjectId, amountInWei], {
        onSuccess: (txHash) => {
          // Remove loading notification
          notification.remove(notificationId);

          // Show success notification
          notification.success(
            <div>
              <p>Contribution successful!</p>
              <p className="text-xs mt-1">Transaction hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}</p>
            </div>,
            { duration: 5000 }
          );

          // Clear input
          setContributionAmount("");

          // Refresh funding info
          setTimeout(() => {
            refreshFundingInfo();
          }, 2000);
        },
        onError: (error) => {
          // Remove loading notification
          notification.remove(notificationId);

          // Show error notification
          notification.error(`Contribution failed: ${error.message}`);
        }
      });

      if (result.error) {
        throw result.error;
      }
    } catch (error: any) {
      console.error("Contribution failed:", error);
      notification.error(`Contribution failed: ${error.message}`);
    } finally {
      setIsContributing(false);
    }
  };

  // Fetch project tasks
  const fetchProjectTasks = async () => {
    if (taskCount && taskCount > 0) {
      setIsLoadingTasks(true);
      try {
        const tasks: TaskInfo[] = [];
        // Fetch each task by ID, starting from 0
        for (let i = 0; i < taskCount; i++) {
          try {
            const taskResult = await readMethod("getTask", [numericProjectId, i]);
            if (taskResult) {
              tasks.push({
                id: i,
                title: taskResult[0],
                description: taskResult[1],
                reward: taskResult[2],
                deadline: Number(taskResult[3]),
                status: Number(taskResult[4]),
                skills: taskResult[5],
              });
            }
          } catch (err) {
            console.error(`Failed to fetch task ${i}:`, err);
          }
        }
        setProjectTasks(tasks);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      } finally {
        setIsLoadingTasks(false);
      }
    }
  };

  // Handle token claim
  const handleClaimTokens = async () => {
    if (!address) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      setIsClaiming(true);

      // Show loading notification
      const notificationId = notification.loading("Processing your token claim transaction...");

      // Call contract method
      const result = await writeMethod("claimTokens", [numericProjectId], {
        onSuccess: (txHash) => {
          // Remove loading notification
          notification.remove(notificationId);

          // Show success notification
          notification.success(
            <div>
              <p>Tokens claimed successfully!</p>
              <p className="text-xs mt-1">Transaction hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}</p>
            </div>,
            { duration: 5000 }
          );

          // Refresh claim data
          setTimeout(() => {
            fetchClaimData();
          }, 2000);
        },
        onError: (error) => {
          // Remove loading notification
          notification.remove(notificationId);

          // Show error notification
          notification.error(`Token claim failed: ${error.message}`);
        }
      });

      if (result.error) {
        throw result.error;
      }
    } catch (error: any) {
      console.error("Token claim failed:", error);
      notification.error(`Token claim failed: ${error.message}`);
    } finally {
      setIsClaiming(false);
    }
  };

  // Fetch claim data
  const fetchClaimData = async () => {
    if (!address || !fundingInfo) return;

    setIsLoadingClaimData(true);
    try {
      // Get claimed amount
      const claimedResult = await readMethod("getClaimedAmount", [numericProjectId, address]);
      if (claimedResult !== null) {
        setClaimedAmount(BigInt(claimedResult.toString()));
      }

      // Get token contribution
      const contributionResult = await readMethod("getTokenContribution", [numericProjectId, address]);
      if (contributionResult !== null) {
        setTokenContribution(BigInt(contributionResult.toString()));
      }

      // Get project token info
      const tokenInfoResult = await readMethod("getProjectToken", [numericProjectId]);
      if (tokenInfoResult) {
        const parsedTokenInfo = {
          tokenAddress: tokenInfoResult[0],
          totalSupply: BigInt(tokenInfoResult[1].toString()),
          crowdfundingPool: BigInt(tokenInfoResult[2].toString()),
          teamPool: BigInt(tokenInfoResult[3].toString()),
          ecosystemPool: BigInt(tokenInfoResult[4].toString()),
          vestingStart: Number(tokenInfoResult[5]),
          vestingDuration: Number(tokenInfoResult[6]),
        };
        setTokenInfo(parsedTokenInfo);

        // Calculate unlocked amount based on vesting schedule
        if (tokenContribution > 0n && parsedTokenInfo.vestingStart > 0) {
          const now = Math.floor(Date.now() / 1000);
          const vestingEnd = parsedTokenInfo.vestingStart + parsedTokenInfo.vestingDuration;

          if (now >= vestingEnd) {
            // Fully vested
            setUnlockedAmount(tokenContribution);
            setUnlockPercentage(100);
          } else if (now <= parsedTokenInfo.vestingStart) {
            // Vesting not started
            setUnlockedAmount(0n);
            setUnlockPercentage(0);
          } else {
            // Partially vested - linear vesting
            const timeElapsed = now - parsedTokenInfo.vestingStart;
            const vestingProgress = timeElapsed / parsedTokenInfo.vestingDuration;
            const percentage = Math.min(100, Math.floor(vestingProgress * 100));

            setUnlockPercentage(percentage);
            setUnlockedAmount(tokenContribution * BigInt(percentage) / BigInt(100));
          }
        }
      }

      // Check if funding is complete and tokens can be claimed
      const now = new Date();
      const endDate = new Date(fundingInfo.endTime * 1000);
      const isFundingComplete = fundingInfo.hasMetFundingGoal || now > endDate;

      // Can claim if funding is complete, user has tokens, and there are unlocked tokens not yet claimed
      setCanClaim(isFundingComplete && tokenContribution > 0n && unlockedAmount > claimedAmount);
    } catch (err) {
      console.error("Failed to fetch claim data:", err);
    } finally {
      setIsLoadingClaimData(false);
    }
  };

  // Fetch project data
  useEffect(() => {
    // If we already have cached data, use it
    if (projectCache[projectId]) {
      setProject(projectCache[projectId]);
    }

    if (fundingCache[projectId]) {
      setFundingInfo(fundingCache[projectId]);
    }

    if (taskCountCache[projectId]) {
      setTaskCount(taskCountCache[projectId]);
    }

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch project data
        if (!project) {
          const projectResult = await readMethod("getProject", [numericProjectId]);

          if (projectResult) {
            const parsedProject = parseProjectData(projectResult as any[]);

            // Update cache
            projectCache[projectId] = parsedProject;

            setProject(parsedProject);
          }
        }

        // Fetch funding info
        if (!fundingInfo) {
          const fundingResult = await readMethod("getFundingInfo", [numericProjectId]);

          if (fundingResult) {
            const parsedFunding = parseFundingInfo(fundingResult as any[]);

            // Update cache
            fundingCache[projectId] = parsedFunding;

            setFundingInfo(parsedFunding);
          }
        }

        // Fetch task count
        if (taskCount === null) {
          const taskCountResult = await readMethod("getProjectTaskCount", [numericProjectId]);

          if (taskCountResult !== null && taskCountResult !== undefined) {
            const count = Number(taskCountResult);

            // Update cache
            taskCountCache[projectId] = count;

            setTaskCount(count);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (!isLoading) {
      fetchData();
    }
  }, [readMethod, projectId, numericProjectId, isLoading, project, fundingInfo, taskCount]);

  // Fetch tasks when active tab is "tasks"
  useEffect(() => {
    if (activeTab === "tasks" && taskCount && projectTasks.length === 0 && !isLoadingTasks) {
      fetchProjectTasks();
    }
  }, [activeTab, taskCount, projectTasks.length, isLoadingTasks]);

  // Fetch claim data when funding info is available
  useEffect(() => {
    if (fundingInfo && address && !isLoadingData) {
      fetchClaimData();
    }
  }, [fundingInfo, address, isLoadingData]);

  if (isLoading || isLoadingData || !project) {
    return (
      <div className="container mx-auto px-4 pt-20 pb-8 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-8"></div>
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="h-40 bg-gray-200 rounded mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-60 bg-gray-200 rounded lg:col-span-2"></div>
          <div className="h-60 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate funding progress and days left
  let fundingProgress = 0;
  let daysLeft = 0;
  let isFundingClosed = false;

  if (fundingInfo) {
    // Calculate funding progress percentage
    fundingProgress = fundingInfo.fundingGoal > 0n
      ? Number((fundingInfo.raisedAmount * 100n) / fundingInfo.fundingGoal)
      : 0;

    // Calculate days left
    const now = new Date();
    const endDate = new Date(fundingInfo.endTime * 1000);
    daysLeft = Math.max(0, differenceInDays(endDate, now));

    // Determine if funding is closed
    isFundingClosed = fundingInfo.hasMetFundingGoal || now > endDate;
  }

  const status = statusMap[project.status] || { label: "Unknown", color: "bg-gray-100 text-gray-800" };
  const createdTime = formatDistanceToNow(new Date(project.createdAt * 1000), { addSuffix: true });

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 mt-4 sm:pt-28 sm:mt-6">
      {/* Project title and status */}
      <div className="p-6 mb-8 rounded-2xl shadow-lg bg-base-100 relative overflow-hidden border border-transparent before:absolute before:inset-0 before:p-[1px] before:rounded-2xl before:bg-gradient-to-r before:from-primary/40 before:via-secondary/40 before:to-accent/40 before:-z-10 after:absolute after:inset-0 after:rounded-2xl after:bg-base-100 after:-z-10">
        {/* Add aurora effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-full blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-tr from-accent/10 via-primary/10 to-secondary/10 rounded-full blur-xl opacity-60 animate-pulse" style={{ animationDelay: "2s" }}></div>

        <div className="relative z-10">
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3 sm:gap-2 sm:mb-4">
            {project.tags.map((tag, index) => (
              <span key={index} className="badge badge-primary badge-sm sm:badge-md bg-primary/10 border-0 text-primary">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">{project.title}</h1>
              <p className="flex flex-wrap items-center gap-2 text-sm opacity-70">
                <span>Created {createdTime}</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center">
                  Created by <span className="ml-1 px-2 py-0.5 text-xs font-medium text-primary border border-primary rounded-md hover:bg-primary/10">agent@IdeaPlusesAI</span>
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                {status.label}
              </span>
              {taskCount !== null && (
                <span className="badge badge-outline badge-secondary">
                  {taskCount} Tasks
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="tabs tabs-boxed mb-8">
        <button
          className={`tab ${activeTab === "details" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          Project Details
        </button>
        <button
          className={`tab ${activeTab === "roadmap" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("roadmap")}
        >
          Roadmap
        </button>
        <button
          className={`tab ${activeTab === "tasks" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          Tasks ({taskCount || 0})
        </button>
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content area */}
        <div className="lg:col-span-2">
          {activeTab === "details" && (
            <>
              <div className="p-4 shadow-lg card bg-base-100 sm:p-6 relative overflow-hidden border border-transparent before:absolute before:inset-0 before:p-[1px] before:rounded-2xl before:bg-gradient-to-r before:from-primary/30 before:via-secondary/30 before:to-accent/30 before:-z-10 after:absolute after:inset-0 after:rounded-2xl after:bg-base-100 after:-z-10">
                <div className="relative z-10">
                  <h2 className="mb-3 text-lg font-bold sm:text-xl sm:mb-4">
                    <span className="material-icons text-primary text-sm align-text-bottom mr-1">description</span>
                    Project Description
                  </h2>
                  <div className="whitespace-pre-line text-sm sm:text-base opacity-80">{project.description}</div>

                  <h3 className="mt-8 mb-3 text-base font-bold sm:text-lg sm:mb-4">
                    <span className="material-icons text-primary text-sm align-text-bottom mr-1">psychology</span>
                    AI Evaluation
                  </h3>
                  <div className="p-4 rounded-lg bg-base-200/50 border border-base-300/50">
                    <p className="text-sm sm:text-base italic">{project.metadata.aiEvaluation}</p>
                  </div>
                </div>
              </div>

              {/* Move Project Tokens card here */}
              {fundingInfo && address && (
                <div className="p-4 shadow-lg card bg-base-100 sm:p-6 relative overflow-hidden border border-transparent before:absolute before:inset-0 before:p-[1px] before:rounded-2xl before:bg-gradient-to-r before:from-primary/30 before:via-secondary/30 before:to-accent/30 before:-z-10 after:absolute after:inset-0 after:rounded-2xl after:bg-base-100 after:-z-10">
                  {/* Add aurora effect */}
                  <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-full blur-xl opacity-60 animate-pulse"></div>

                  <div className="relative z-10">
                    <h2 className="mb-3 text-lg font-bold sm:text-xl sm:mb-4">
                      <span className="material-icons text-primary text-sm align-text-bottom mr-1">token</span>
                      Project Tokens
                    </h2>

                    {isLoadingClaimData ? (
                      <div className="flex justify-center py-4">
                        <span className="loading loading-spinner loading-md"></span>
                      </div>
                    ) : (
                      <>
                        {tokenInfo && (
                          <div className="mb-4">
                            <p className="text-xs opacity-70 sm:text-sm mb-2">Token Allocation</p>
                            <div className="w-full bg-base-200 rounded-full h-4 mb-2">
                              <div className="flex h-4 rounded-full overflow-hidden">
                                <div
                                  className="bg-primary h-4"
                                  style={{ width: "60%" }}
                                  title="Crowdfunding Pool (60%)"
                                ></div>
                                <div
                                  className="bg-secondary h-4"
                                  style={{ width: "25%" }}
                                  title="Task & DAO Pool (25%)"
                                ></div>
                                <div
                                  className="bg-accent h-4"
                                  style={{ width: "15%" }}
                                  title="Ecosystem Pool (15%)"
                                ></div>
                              </div>
                            </div>
                            <div className="flex justify-between text-xs opacity-70">
                              <span>Crowdfunding: 60%</span>
                              <span>Task & DAO: 25%</span>
                              <span>Ecosystem: 15%</span>
                            </div>
                            <div className="p-3 rounded-lg bg-base-200/50 border border-base-300/50 mt-4">
                              <p className="text-xs opacity-70 sm:text-sm">
                                <span className="material-icons text-primary text-xs align-text-bottom mr-1">inventory_2</span>
                                Total Supply
                              </p>
                              <p className="mt-1 text-base font-semibold sm:text-lg">{formatAmount(tokenInfo.totalSupply)} Tokens</p>
                            </div>
                          </div>
                        )}

                        <div className="space-y-4 mt-4">
                          {tokenContribution > 0n ? (
                            <>
                              <div className="p-3 rounded-lg bg-base-200/50 border border-base-300/50">
                                <p className="text-xs opacity-70 sm:text-sm">
                                  <span className="material-icons text-primary text-xs align-text-bottom mr-1">account_balance_wallet</span>
                                  Your Token Allocation
                                </p>
                                <p className="mt-1 text-base font-semibold sm:text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                  {formatAmount(tokenContribution)} Tokens
                                </p>
                              </div>

                              {tokenInfo && tokenInfo.vestingDuration > 0 && (
                                <div className="mt-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs opacity-70 sm:text-sm">
                                      <span className="material-icons text-primary text-xs align-text-bottom mr-1">lock_open</span>
                                      Unlock Progress
                                    </p>
                                    <span className="text-xs font-medium">{unlockPercentage}%</span>
                                  </div>
                                  <div className="w-full bg-base-200 rounded-full h-2.5">
                                    <div
                                      className="bg-primary h-2.5 rounded-full transition-all duration-500"
                                      style={{ width: `${unlockPercentage}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between text-xs opacity-70 mt-1">
                                    <span>Unlocked: {formatAmount(unlockedAmount)}</span>
                                    <span>Total: {formatAmount(tokenContribution)}</span>
                                  </div>
                                  <p className="text-xs opacity-60 mt-2 italic">
                                    Tokens unlock linearly over 180 days
                                  </p>
                                </div>
                              )}

                              {claimedAmount > 0n && (
                                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                                  <p className="text-xs opacity-70 sm:text-sm">
                                    <span className="material-icons text-success text-xs align-text-bottom mr-1">check_circle</span>
                                    Already Claimed
                                  </p>
                                  <p className="mt-1 text-base font-semibold sm:text-lg text-success">{formatAmount(claimedAmount)} Tokens</p>
                                </div>
                              )}

                              <div className="mt-4">
                                <button
                                  className={`btn btn-primary w-full btn-sm sm:btn-md ${isClaiming ? 'loading' : ''} ${!canClaim ? 'btn-disabled' : ''}`}
                                  onClick={handleClaimTokens}
                                  disabled={isClaiming || !canClaim}
                                >
                                  {isClaiming ? (
                                    <>
                                      <span className="loading loading-spinner loading-xs"></span>
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <span className="material-icons text-sm align-text-bottom mr-1">redeem</span>
                                      Claim Tokens
                                    </>
                                  )}
                                </button>

                                {!canClaim && tokenContribution > 0n && (
                                  <p className="text-xs text-center mt-2 opacity-60 italic">
                                    {claimedAmount >= tokenContribution
                                      ? 'You have already claimed all your tokens'
                                      : unlockedAmount <= claimedAmount
                                        ? 'No tokens available for claiming yet'
                                        : 'Tokens not yet available for claiming'}
                                  </p>
                                )}
                              </div>
                            </>
                          ) : (
                            <p className="text-sm opacity-70 italic">You have not contributed to this project yet</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "roadmap" && (
            <div className="p-4 shadow-lg card bg-base-100 sm:p-6 relative overflow-hidden border border-transparent before:absolute before:inset-0 before:p-[1px] before:rounded-2xl before:bg-gradient-to-r before:from-primary/30 before:via-secondary/30 before:to-accent/30 before:-z-10 after:absolute after:inset-0 after:rounded-2xl after:bg-base-100 after:-z-10">
              <div className="relative z-10">
                <h2 className="mb-3 text-lg font-bold sm:text-xl sm:mb-4">
                  <span className="material-icons text-primary text-sm align-text-bottom mr-1">map</span>
                  Project Roadmap
                </h2>

                <div className="p-6 text-center opacity-70 italic">
                  <span className="material-icons text-4xl mb-2">timeline</span>
                  <p>Roadmap data is not yet available from the contract. This section will display the project&apos;s development plan and milestones.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="p-4 shadow-lg card bg-base-100 sm:p-6 relative overflow-hidden border border-transparent before:absolute before:inset-0 before:p-[1px] before:rounded-2xl before:bg-gradient-to-r before:from-primary/30 before:via-secondary/30 before:to-accent/30 before:-z-10 after:absolute after:inset-0 after:rounded-2xl after:bg-base-100 after:-z-10">
              <div className="relative z-10">
                <h2 className="mb-3 text-lg font-bold sm:text-xl sm:mb-4">
                  <span className="material-icons text-primary text-sm align-text-bottom mr-1">assignment</span>
                  Project Tasks
                </h2>

                {isLoadingTasks ? (
                  <div className="flex justify-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </div>
                ) : taskCount && taskCount > 0 ? (
                  <div className="mt-4 space-y-4">
                    {projectTasks.map(task => {
                      const statusStyle = taskStatusMap[task.status]?.color || "bg-base-200 text-base-content";
                      const statusLabel = taskStatusMap[task.status]?.label || "Unknown";

                      return (
                        <div key={task.id} className="p-4 rounded-lg bg-base-200/50 border border-base-300/50 hover:bg-base-200/70 transition-all">
                          <div className="flex justify-between items-start">
                            <h3 className="text-base font-semibold sm:text-lg">{task.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle} border-0`}>
                              {statusLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-sm opacity-70 line-clamp-2">{task.description}</p>
                          <div className="flex flex-wrap gap-1 mt-3">
                            {task.skills.slice(0, 3).map((skill: string, index: number) => (
                              <span key={index} className="badge badge-sm bg-primary/10 border-0 text-primary">
                                {skill}
                              </span>
                            ))}
                            {task.skills.length > 3 && (
                              <span className="badge badge-sm bg-base-300/80 border-0">+{task.skills.length - 3} more</span>
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center">
                              <span className="material-icons text-primary text-sm mr-1">payments</span>
                              <span className="text-sm font-medium">{formatAmount(task.reward)} USDC</span>
                            </div>
                            <a
                              href={`/projects/${projectId}/tasks/${task.id}`}
                              className="btn btn-primary btn-sm sm:btn-md h-10 min-h-10"
                            >
                              <span className="material-icons text-xs mr-1">visibility</span>
                              View Details
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center opacity-70 italic">
                    <span className="material-icons text-4xl mb-2">assignment_late</span>
                    <p>This project has no tasks yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Funding info card */}
          {fundingInfo && (
            <div className="p-4 shadow-lg card bg-base-100 sm:p-6 relative overflow-hidden border border-transparent before:absolute before:inset-0 before:p-[1px] before:rounded-2xl before:bg-gradient-to-r before:from-primary/30 before:via-secondary/30 before:to-accent/30 before:-z-10 after:absolute after:inset-0 after:rounded-2xl after:bg-base-100 after:-z-10">
              {/* Add aurora effect */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-full blur-xl opacity-60 animate-pulse"></div>

              <div className="relative z-10">
                <h2 className="mb-3 text-lg font-bold sm:text-xl sm:mb-4">
                  <span className="material-icons text-primary text-sm align-text-bottom mr-1">payments</span>
                  Funding Information
                </h2>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs opacity-70 sm:text-sm">Funding Progress</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-medium">{daysLeft} days{daysLeft > 0 ? " remaining" : " ended"}</span>
                    {isFundingClosed && (
                      <span className="badge badge-sm badge-success text-xs border-0">Funding Completed</span>
                    )}
                  </div>
                </div>

                <div className="w-full bg-base-200 rounded-full h-2.5 mb-2 sm:h-3">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500 sm:h-3"
                    style={{ width: `${Math.min(100, fundingProgress)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs sm:text-sm mb-4">
                  <span className="font-medium">{formatAmount(fundingInfo.raisedAmount)} USDC</span>
                  <span className="opacity-70">Goal: {formatAmount(fundingInfo.fundingGoal)} USDC</span>
                </div>

                <div className="p-3 rounded-lg bg-base-200/50 border border-base-300/50 mb-4">
                  <p className="text-xs opacity-70 sm:text-sm">
                    <span className="material-icons text-primary text-xs align-text-bottom mr-1">trending_up</span>
                    Funding Status
                  </p>
                  <p className="mt-1 text-base font-semibold sm:text-lg">
                    {fundingProgress >= 100 ? (
                      <span className="text-success">Funding Goal Achieved!</span>
                    ) : (
                      <span>Completed {fundingProgress.toFixed(1)}%</span>
                    )}
                  </p>
                </div>

                <div className="mt-4">
                  <div className="form-control">
                    <label className="flex justify-between mb-2">
                      <span className="text-xs opacity-70 sm:text-sm">Contribution Amount (USDC)</span>
                      {isFundingClosed && (
                        <span className="text-xs text-error">Funding Completed</span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="0.1"
                        className="input input-bordered input-sm sm:input-md w-full"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        disabled={isContributing || isFundingClosed}
                        min="0"
                        step="0.01"
                      />
                      <button
                        className={`btn btn-sm sm:btn-md ${isFundingClosed ? 'btn-disabled' : 'btn-primary'} ${isContributing ? 'loading' : ''}`}
                        onClick={handleContribute}
                        disabled={isContributing || isFundingClosed || !contributionAmount || parseFloat(contributionAmount) <= 0}
                      >
                        {isContributing ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <span className="material-icons text-sm align-text-bottom mr-1">send</span>
                            Contribute
                          </>
                        )}
                      </button>
                    </div>
                    <label className="label">
                      <span className="text-xs opacity-60">Minimum Amount: 0.01 USDC</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Project evaluation card */}
          <div className="p-4 shadow-lg card bg-base-100 sm:p-6 relative overflow-hidden border border-transparent before:absolute before:inset-0 before:p-[1px] before:rounded-2xl before:bg-gradient-to-r before:from-primary/30 before:via-secondary/30 before:to-accent/30 before:-z-10 after:absolute after:inset-0 after:rounded-2xl after:bg-base-100 after:-z-10">
            {/* Add aurora effect */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-full blur-xl opacity-60 animate-pulse"></div>

            <div className="relative z-10">
              <h2 className="mb-3 text-lg font-bold sm:text-xl sm:mb-4">
                <span className="material-icons text-primary text-sm align-text-bottom mr-1">analytics</span>
                Project Evaluation
              </h2>

              <div className="space-y-4 sm:space-y-5">
                <div>
                  <p className="text-xs opacity-70 sm:text-sm">Market Score</p>
                  <div className="flex items-center mt-1">
                    <div className="rating rating-sm">
                      {[...Array(10)].map((_, i) => (
                        <input
                          key={i}
                          type="radio"
                          name="rating-2"
                          title={`Rating ${i+1}`}
                          className={`mask mask-star-2 ${i < project.metadata.marketScore ? 'bg-primary' : 'bg-base-300'}`}
                          disabled
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-base font-semibold sm:text-lg">{project.metadata.marketScore}/10</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-base-200/50 border border-base-300/50">
                  <p className="text-xs opacity-70 sm:text-sm">
                    <span className="material-icons text-primary text-xs align-text-bottom mr-1">build</span>
                    Technical Feasibility
                  </p>
                  <p className="mt-1 text-base font-semibold sm:text-lg">{project.metadata.techFeasibility}</p>
                </div>

                <div className="p-3 rounded-lg bg-base-200/50 border border-base-300/50">
                  <p className="text-xs opacity-70 sm:text-sm">
                    <span className="material-icons text-primary text-xs align-text-bottom mr-1">attach_money</span>
                    Valuation Range
                  </p>
                  <p className="mt-1 text-base font-semibold sm:text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    ${(project.metadata.minValuation / 1000).toFixed(1)}K - ${(project.metadata.maxValuation / 1000).toFixed(1)}K
                  </p>
                </div>

                <div className="text-xs italic opacity-60 sm:text-sm">
                  AI-powered evaluation based on market trends, technical complexity, and potential ROI.
                </div>
              </div>
            </div>
          </div>

          {/* Task info card */}
          {taskCount !== null && taskCount > 0 && (
            <div className="card bg-base-100 shadow-md hover:shadow-lg transition-all">
              <div className="card-body">
                <h2 className="card-title">Task Information</h2>
                <p className="text-sm">This project has <strong>{taskCount}</strong> available tasks</p>
                <div className="card-actions justify-end mt-4">
                  <button
                    className="btn btn-outline btn-secondary"
                    onClick={() => setActiveTab("tasks")}
                  >
                    View Tasks
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
