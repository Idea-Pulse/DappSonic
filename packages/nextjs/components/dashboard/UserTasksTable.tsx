"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { formatDistanceToNow } from "date-fns";
import { useContractRead } from "~~/hooks/contracts/useContractRead";
import { useScaffoldWatchContractEvent } from "~~/hooks/scaffold-eth";

// Task status enum
enum TaskStatus {
  Open,
  Assigned,
  InProgress,
  Completed,
  Verified,
  Cancelled
}

// Task data type
type TaskData = {
  projectId: number;
  taskId: number;
  title: string;
  description: string;
  reward: bigint;
  deadline: number;
  status: TaskStatus;
  requiredSkills: string[];
  estimatedHours: number;
  assignee: string;
  createdAt: number;
  completedAt: number;
};

// Cache object
interface TaskCache {
  tasks: Record<string, TaskData>; // key: `${projectId}-${taskId}`
  projectTaskCounts: Record<number, number>; // key: projectId
  userTasks: string[]; // format: `${projectId}-${taskId}`
  timestamp: number;
}

// Global cache
const taskCache: TaskCache = {
  tasks: {},
  projectTaskCounts: {},
  userTasks: [],
  timestamp: 0
};

// Cache expiration time (milliseconds)
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Check if cache is expired
const isCacheExpired = (): boolean => {
  return Date.now() - taskCache.timestamp > CACHE_EXPIRY;
};

// Format amount, convert wei to USDC and format
const formatAmount = (amount: bigint): string => {
  const usdcAmount = Number(amount) / 1e18;
  return usdcAmount.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

// Get task status text
const getTaskStatusText = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.Open:
      return "Open";
    case TaskStatus.Assigned:
      return "Assigned";
    case TaskStatus.InProgress:
      return "In Progress";
    case TaskStatus.Completed:
      return "Completed";
    case TaskStatus.Verified:
      return "Verified";
    case TaskStatus.Cancelled:
      return "Cancelled";
    default:
      return "Unknown Status";
  }
};

// Get task status style
const getTaskStatusStyle = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.Open:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-opacity-20 dark:text-blue-400";
    case TaskStatus.Assigned:
    case TaskStatus.InProgress:
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:bg-opacity-20 dark:text-purple-400";
    case TaskStatus.Completed:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-20 dark:text-yellow-400";
    case TaskStatus.Verified:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-20 dark:text-green-400";
    case TaskStatus.Cancelled:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:bg-opacity-20 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:bg-opacity-20 dark:text-gray-400";
  }
};

export const UserTasksTable = () => {
  const { address } = useAccount();
  const { readMethod, isLoading: contractLoading, clearCache } = useContractRead();
  const [userTasks, setUserTasks] = useState<TaskData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Get user's associated task IDs
  const getUserTasks = useCallback(async (userAddress: string): Promise<number[]> => {
    try {
      // Get data from blockchain
      const taskIds = await readMethod("getUserTasks", [userAddress]);

      if (taskIds && Array.isArray(taskIds)) {
        const numericIds = taskIds.map(id => Number(id));
        return numericIds;
      }
    } catch (err) {
      console.error("Failed to get user tasks:", err);
      setError("Failed to get user tasks");
    }

    return [];
  }, [readMethod]);

  // Get project count
  const getProjectCount = useCallback(async (): Promise<number> => {
    try {
      const countResult = await readMethod("getProjectCount", []);
      if (countResult !== undefined) {
        return Number(countResult);
      }
    } catch (err) {
      console.error("Failed to get project count:", err);
    }
    return 0;
  }, [readMethod]);

  // Get project task count
  const getProjectTaskCount = useCallback(async (projectId: number): Promise<number> => {
    // Check cache
    if (!isCacheExpired() && taskCache.projectTaskCounts[projectId]) {
      return taskCache.projectTaskCounts[projectId];
    }

    try {
      const countResult = await readMethod("getProjectTaskCount", [projectId]);
      if (countResult !== undefined) {
        const count = Number(countResult);
        // Update cache
        taskCache.projectTaskCounts[projectId] = count;
        taskCache.timestamp = Date.now();
        return count;
      }
    } catch (err) {
      console.error(`Failed to get task count for project ${projectId}:`, err);
    }
    return 0;
  }, [readMethod]);

  // Get task details
  const getTask = useCallback(async (projectId: number, taskId: number): Promise<TaskData | null> => {
    const cacheKey = `${projectId}-${taskId}`;

    // Check cache
    if (!isCacheExpired() && taskCache.tasks[cacheKey]) {
      return taskCache.tasks[cacheKey];
    }

    try {
      const taskResult = await readMethod("getTask", [projectId, taskId]);

      if (taskResult && Array.isArray(taskResult)) {
        const task: TaskData = {
          projectId,
          taskId,
          title: taskResult[0],
          description: taskResult[1],
          reward: taskResult[2],
          deadline: Number(taskResult[3]),
          status: Number(taskResult[4]),
          requiredSkills: taskResult[5],
          estimatedHours: Number(taskResult[6]),
          assignee: taskResult[7],
          createdAt: Number(taskResult[8]),
          completedAt: Number(taskResult[9])
        };

        // Update cache
        taskCache.tasks[cacheKey] = task;
        taskCache.timestamp = Date.now();
        return task;
      }
    } catch (err) {
      console.error(`Failed to get task ${projectId}-${taskId}:`, err);
    }

    return null;
  }, [readMethod]);

  // Get all user tasks
  const fetchUserTasksData = useCallback(async () => {
    if (!address || contractLoading) return;

    setIsLoadingData(true);
    setError(null);

    try {
      // 1. Get user's associated task IDs
      const userTaskIds = await getUserTasks(address);

      // If user has no tasks, return immediately
      if (userTaskIds.length === 0) {
        setUserTasks([]);
        setIsLoadingData(false);
        return;
      }

      // 2. Get total project count
      const projectCount = await getProjectCount();

      // 3. Iterate through all projects to find user's tasks
      const foundTasks: TaskData[] = [];

      // Start from project ID 1 (contract project IDs start from 1)
      for (let projectId = 1; projectId <= projectCount; projectId++) {
        // Get task count for this project
        const taskCount = await getProjectTaskCount(projectId);

        // Iterate through all tasks in this project
        for (let taskId = 0; taskId < taskCount; taskId++) {
          // Get task details
          const task = await getTask(projectId, taskId);

          // If task exists and is assigned to current user
          if (task && task.assignee.toLowerCase() === address.toLowerCase()) {
            foundTasks.push(task);
          }
        }
      }

      // Update state
      if (isMountedRef.current) {
        setUserTasks(foundTasks);
        setIsLoadingData(false);
      }

    } catch (err) {
      console.error("Failed to fetch user task data:", err);
      if (isMountedRef.current) {
        setError("Failed to fetch user task data");
        setIsLoadingData(false);
      }
    }
  }, [address, contractLoading, getUserTasks, getProjectCount, getProjectTaskCount, getTask]);

  // Fetch data when component mounts
  useEffect(() => {
    isMountedRef.current = true;

    if (address) {
      fetchUserTasksData();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [address, fetchUserTasksData]);

  // Monitor task assignment event
  useScaffoldWatchContractEvent({
    contractName: "Diamond",
    eventName: "TaskAssigned" as any,
    onLogs: () => {
      if (isMountedRef.current) {
        clearCache();
        fetchUserTasksData();
      }
    },
  });

  // Monitor task status update event
  useScaffoldWatchContractEvent({
    contractName: "Diamond",
    eventName: "TaskUpdated" as any,
    onLogs: () => {
      if (isMountedRef.current) {
        clearCache();
        fetchUserTasksData();
      }
    },
  });

  // Monitor task completion event
  useScaffoldWatchContractEvent({
    contractName: "Diamond",
    eventName: "TaskCompleted" as any,
    onLogs: () => {
      if (isMountedRef.current) {
        clearCache();
        fetchUserTasksData();
      }
    },
  });

  // Monitor task verification event
  useScaffoldWatchContractEvent({
    contractName: "Diamond",
    eventName: "TaskVerified" as any,
    onLogs: () => {
      if (isMountedRef.current) {
        clearCache();
        fetchUserTasksData();
      }
    },
  });

  // Render loading state
  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="alert alert-error shadow-lg">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Render empty state
  if (userTasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No tasks found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Tasks</h2>
      </div>
      <table className="table w-full">
        <thead>
          <tr>
            <th>Project/Task</th>
            <th>Status</th>
            <th>Reward</th>
            <th>Deadline</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {userTasks.map((task) => (
            <tr key={`${task.projectId}-${task.taskId}`} className="hover">
              <td>
                <div>
                  <div className="font-bold">{task.title}</div>
                  <div className="text-sm opacity-70 truncate max-w-xs">{task.description}</div>
                </div>
              </td>
              <td>
                <span className={`badge ${getTaskStatusStyle(task.status)}`}>
                  {getTaskStatusText(task.status)}
                </span>
              </td>
              <td className="font-semibold">{formatAmount(task.reward)} USDC</td>
              <td>
                {task.deadline > 0
                  ? formatDistanceToNow(new Date(task.deadline * 1000), { addSuffix: true })
                  : "No deadline"}
              </td>
              <td>
                <Link
                  href={`/projects/${task.projectId}/tasks/${task.taskId}`}
                  className="btn btn-sm btn-outline"
                >
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};