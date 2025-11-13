import React, { useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import IntegrationLayout from "../../components/common-afterauth/IntegrationLayout";
import {
  ArrowLeft,
  GitBranch,
  CheckCircle2,
  RefreshCw,
  Users,
  Building2,
  User,
  Shield,
  Link as LinkIcon,
  Unlink,
  GitCommit,
  GitPullRequest,
  AlertTriangle,
  Code,
  Loader2,
  Activity,
  Filter,
  Sparkles,
  Globe,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Star,
  BarChart3,
  TrendingUp,
  PieChart,
  Clock,
  Zap,
  Settings,
  Bell,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  GitMerge,
  FileCode,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Folder,
  Tag,
  Search,
  Download,
  Copy,
  Share2,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import connectorService from "../../services/connectorService";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useProject } from "../../contexts/ProjectContext";
import { useAuth } from "../../contexts/AuthContext";
import SkeletonLoader from "../../components/loaders/SkeletonLoader";

const PRIORITY_COLOR_MAP = {
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  normal: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  low: "text-gray-400 bg-gray-600/10 border-gray-700",
};

const GITHUB_NOTIFICATION_LABEL = {
  github_pull_request: "Pull Request",
  github_commit: "Commit",
  github_issue: "Issue",
  github_push: "Push",
  integration_event: "Integration Event",
  integration_connected: "Integration",
};

const formatRelativeTime = (value) => {
  if (!value) return "moments ago";
  const timestamp =
    typeof value === "string" ? new Date(value).getTime() : value;
  if (!timestamp) return "moments ago";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

// ==================== TAB COMPONENTS ====================

const StatisticsTab = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  statistics,
  loading,
  onLoad,
  scope,
}) => {
  const repoList =
    scope === "personal"
      ? repositories
      : repositories.map((r) => ({
          full_name: r.repositoryFullName || r.fullName,
          id: r.repositoryId,
        }));

  return (
    <div className="space-y-6">
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Repository Statistics
          </h2>
          <select
            value={selectedRepo}
            onChange={(e) => {
              onSelectRepo(e.target.value);
              if (e.target.value) onLoad(e.target.value);
            }}
            className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="">Select a repository</option>
            {repoList.map((repo) => (
              <option
                key={repo.id || repo.repositoryId}
                value={
                  repo.full_name || repo.repositoryFullName || repo.fullName
                }
              >
                {repo.full_name || repo.repositoryFullName || repo.fullName}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <SkeletonLoader key={idx} variant="card" className="h-24" />
              ))}
            </div>
            <SkeletonLoader variant="card" count={3} />
          </div>
        ) : statistics ? (
          <div className="space-y-6">
            {/* Basic Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Stars</p>
                <p className="text-2xl font-semibold text-white">
                  {statistics.basic?.stars || 0}
                </p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Forks</p>
                <p className="text-2xl font-semibold text-white">
                  {statistics.basic?.forks || 0}
                </p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Watchers</p>
                <p className="text-2xl font-semibold text-white">
                  {statistics.basic?.watchers || 0}
                </p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Open Issues</p>
                <p className="text-2xl font-semibold text-white">
                  {statistics.basic?.openIssues || 0}
                </p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Open PRs</p>
                <p className="text-2xl font-semibold text-white">
                  {statistics.basic?.openPRs || 0}
                </p>
              </div>
            </div>

            {/* Languages */}
            {statistics.languages && statistics.languages.length > 0 && (
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Languages
                </h3>
                <div className="space-y-2">
                  {statistics.languages.slice(0, 10).map((lang, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-300">{lang.name}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, lang.percentage || 0)
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right">
                          {lang.percentage?.toFixed(1) || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contributors */}
            {statistics.contributors && statistics.contributors.length > 0 && (
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Top Contributors
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {statistics.contributors.slice(0, 10).map((contrib, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
                    >
                      <img
                        src={contrib.avatar}
                        alt={contrib.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {contrib.username}
                        </p>
                        <p className="text-xs text-gray-400">
                          {contrib.contributions} contributions
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Branches */}
            {statistics.branches && (
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Branches
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                    <span className="text-sm text-gray-300">
                      Default: {statistics.branches.default}
                    </span>
                  </div>
                  {statistics.branches.protected &&
                    statistics.branches.protected.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">
                          Protected Branches
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {statistics.branches.protected.map((branch, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs border border-red-500/20"
                            >
                              <Lock className="w-3 h-3 inline mr-1" />
                              {branch}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* License & Topics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statistics.license && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">
                    License
                  </h3>
                  <p className="text-sm text-gray-300">
                    {statistics.license.name || statistics.license.spdxId}
                  </p>
                </div>
              )}
              {statistics.topics && statistics.topics.length > 0 && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {statistics.topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              Select a repository to view statistics
            </p>
          </div>
        )}
      </Motion.div>
    </div>
  );
};

const AnalyticsTab = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  analytics,
  loading,
  onLoad,
  scope,
}) => {
  const [period, setPeriod] = useState("weekly");
  const repoList =
    scope === "personal"
      ? repositories
      : repositories.map((r) => ({
          full_name: r.repositoryFullName || r.fullName,
          id: r.repositoryId,
        }));

  useEffect(() => {
    if (selectedRepo && period) {
      onLoad(selectedRepo, period);
    }
  }, [period, selectedRepo]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-white">
            Activity Analytics
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedRepo}
              onChange={(e) => {
                onSelectRepo(e.target.value);
                if (e.target.value) onLoad(e.target.value, period);
              }}
              className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="">Select a repository</option>
              {repoList.map((repo) => (
                <option
                  key={repo.id || repo.repositoryId}
                  value={
                    repo.full_name || repo.repositoryFullName || repo.fullName
                  }
                >
                  {repo.full_name || repo.repositoryFullName || repo.fullName}
                </option>
              ))}
            </select>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <SkeletonLoader variant="card" className="h-64" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonLoader key={idx} variant="card" className="h-32" />
              ))}
            </div>
            <SkeletonLoader variant="card" count={2} />
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Commit Activity Chart */}
            {analytics.commits && (
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <GitCommit className="w-4 h-4" />
                  Commit Activity
                </h3>
                {analytics.commits.byDate &&
                Object.keys(analytics.commits.byDate).length > 0 ? (
                  <div className="h-64 w-full overflow-x-auto">
                    <div className="h-64 flex items-end justify-between space-x-1 min-w-full">
                      {Object.entries(analytics.commits.byDate)
                        .slice(-30)
                        .map(([date, count], idx) => {
                          const allCounts = Object.values(
                            analytics.commits.byDate
                          );
                          const maxCount =
                            allCounts.length > 0
                              ? Math.max(
                                  ...allCounts.map((c) => Number(c) || 0)
                                )
                              : 1;
                          const heightPercent =
                            maxCount > 0 ? (Number(count) / maxCount) * 100 : 0;
                          return (
                            <div
                              key={`${date}-${idx}`}
                              className="flex-1 flex flex-col items-center min-w-[20px]"
                            >
                              <Motion.div
                                className="w-full bg-purple-500 rounded-t min-h-[2px]"
                                initial={{ height: 0 }}
                                animate={{ height: `${heightPercent}%` }}
                                transition={{
                                  duration: 0.5,
                                  delay: idx * 0.02,
                                }}
                              />
                              <p className="text-[10px] text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                                {new Date(date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-sm text-gray-400">
                      No commit activity data available
                    </p>
                  </div>
                )}
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Total Commits</p>
                    <p className="text-lg font-semibold text-white">
                      {analytics.commits.total || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Additions</p>
                    <p className="text-lg font-semibold text-green-400">
                      +{analytics.commits.additions || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Deletions</p>
                    <p className="text-lg font-semibold text-red-400">
                      -{analytics.commits.deletions || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PR Trends */}
            {analytics.pullRequests && (
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4" />
                  Pull Request Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Total PRs</p>
                    <p className="text-2xl font-semibold text-white">
                      {analytics.pullRequests.metrics?.total || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Open</p>
                    <p className="text-2xl font-semibold text-blue-400">
                      {analytics.pullRequests.metrics?.opened || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Merged</p>
                    <p className="text-2xl font-semibold text-green-400">
                      {analytics.pullRequests.metrics?.merged || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg Merge Time</p>
                    <p className="text-2xl font-semibold text-white">
                      {analytics.pullRequests.metrics?.averageMergeTime?.toFixed(
                        1
                      ) || 0}
                      h
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Issue Trends */}
            {analytics.issues && (
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Issue Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Issues</p>
                    <p className="text-2xl font-semibold text-white">
                      {analytics.issues.metrics?.total || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Open</p>
                    <p className="text-2xl font-semibold text-orange-400">
                      {analytics.issues.metrics?.opened || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg Resolution</p>
                    <p className="text-2xl font-semibold text-white">
                      {analytics.issues.metrics?.averageResolutionTime?.toFixed(
                        1
                      ) || 0}
                      h
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Contributors */}
            {analytics.contributors &&
              analytics.contributors.topContributors && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Top Contributors
                  </h3>
                  <div className="space-y-2">
                    {analytics.contributors.topContributors.map(
                      (contrib, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                        >
                          <span className="text-sm text-gray-300">
                            {contrib.username}
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {contrib.commits} commits
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              Select a repository to view analytics
            </p>
          </div>
        )}
      </Motion.div>
    </div>
  );
};

const CommitsTab = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  commits,
  onLoad,
  scope,
}) => {
  const [page, setPage] = useState(1);
  const repoList =
    scope === "personal"
      ? repositories
      : repositories.map((r) => ({
          full_name: r.repositoryFullName || r.fullName,
          id: r.repositoryId,
        }));

  useEffect(() => {
    if (selectedRepo) {
      onLoad(selectedRepo, page);
    }
  }, [selectedRepo, page]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Commit History</h2>
          <select
            value={selectedRepo}
            onChange={(e) => {
              onSelectRepo(e.target.value);
              if (e.target.value) onLoad(e.target.value, 1);
              setPage(1);
            }}
            className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="">Select a repository</option>
            {repoList.map((repo) => (
              <option
                key={repo.id || repo.repositoryId}
                value={
                  repo.full_name || repo.repositoryFullName || repo.fullName
                }
              >
                {repo.full_name || repo.repositoryFullName || repo.fullName}
              </option>
            ))}
          </select>
        </div>

        {commits && commits.length > 0 ? (
          <div className="space-y-3">
            {commits.map((commit, idx) => (
              <div
                key={commit.sha || idx}
                className="border border-gray-800 bg-gray-900/40 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-gray-800 rounded-lg">
                      <GitCommit className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white">
                          {commit.message?.split("\n")[0]}
                        </h3>
                        <a
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-400 hover:text-purple-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                        {commit.author && (
                          <div className="flex items-center gap-1">
                            {commit.author.avatar && (
                              <img
                                src={commit.author.avatar}
                                alt={commit.author.username}
                                className="w-4 h-4 rounded-full"
                              />
                            )}
                            <span>
                              {commit.author.username || commit.author.name}
                            </span>
                          </div>
                        )}
                        <span>
                          {formatRelativeTime(
                            commit.author?.date || commit.createdAt
                          )}
                        </span>
                        {commit.stats && (
                          <span className="flex items-center gap-1">
                            <span className="text-green-400">
                              +{commit.stats.additions}
                            </span>
                            <span className="text-red-400">
                              -{commit.stats.deletions}
                            </span>
                          </span>
                        )}
                      </div>
                      {commit.files && commit.files.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {commit.files.length} file
                          {commit.files.length !== 1 ? "s" : ""} changed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center gap-2 pt-4">
              <Motion.button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300 disabled:opacity-50"
                whileTap={{ scale: 0.97 }}
              >
                Previous
              </Motion.button>
              <span className="text-sm text-gray-400">Page {page}</span>
              <Motion.button
                onClick={() => setPage((p) => p + 1)}
                disabled={commits.length < 30}
                className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300 disabled:opacity-50"
                whileTap={{ scale: 0.97 }}
              >
                Next
              </Motion.button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitCommit className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              Select a repository to view commit history
            </p>
          </div>
        )}
      </Motion.div>
    </div>
  );
};

const TeamTab = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  insights,
  onLoad,
  scope,
}) => {
  const [period, setPeriod] = useState("monthly");
  const repoList =
    scope === "personal"
      ? repositories
      : repositories.map((r) => ({
          full_name: r.repositoryFullName || r.fullName,
          id: r.repositoryId,
        }));

  useEffect(() => {
    if (selectedRepo && period) {
      onLoad(selectedRepo, period);
    }
  }, [period, selectedRepo]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-white">Team Insights</h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedRepo}
              onChange={(e) => {
                onSelectRepo(e.target.value);
                if (e.target.value) onLoad(e.target.value, period);
              }}
              className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="">Select a repository</option>
              {repoList.map((repo) => (
                <option
                  key={repo.id || repo.repositoryId}
                  value={
                    repo.full_name || repo.repositoryFullName || repo.fullName
                  }
                >
                  {repo.full_name || repo.repositoryFullName || repo.fullName}
                </option>
              ))}
            </select>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>

        {insights ? (
          <div className="space-y-6">
            {/* Contributors Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Total Contributors</p>
                <p className="text-2xl font-semibold text-white">
                  {insights.contributors?.total || 0}
                </p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">
                  Active Contributors
                </p>
                <p className="text-2xl font-semibold text-green-400">
                  {insights.contributors?.active || 0}
                </p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Total Commits</p>
                <p className="text-2xl font-semibold text-white">
                  {insights.commits?.total || 0}
                </p>
              </div>
            </div>

            {/* PR Metrics */}
            {insights.pullRequests && (
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4" />
                  Pull Request Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-xl font-semibold text-white">
                      {insights.pullRequests.total}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Open</p>
                    <p className="text-xl font-semibold text-blue-400">
                      {insights.pullRequests.open}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Merged</p>
                    <p className="text-xl font-semibold text-green-400">
                      {insights.pullRequests.merged}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg Merge Time</p>
                    <p className="text-xl font-semibold text-white">
                      {insights.pullRequests.averageMergeTime}h
                    </p>
                  </div>
                </div>
                {insights.pullRequests.reviewStatus && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500 mb-2">Review Status</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
                        <p className="text-xs text-green-400">Approved</p>
                        <p className="text-lg font-semibold text-white">
                          {insights.pullRequests.reviewStatus.approved}
                        </p>
                      </div>
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2">
                        <p className="text-xs text-orange-400">
                          Changes Requested
                        </p>
                        <p className="text-lg font-semibold text-white">
                          {insights.pullRequests.reviewStatus.changesRequested}
                        </p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
                        <p className="text-xs text-blue-400">Commented</p>
                        <p className="text-lg font-semibold text-white">
                          {insights.pullRequests.reviewStatus.commented}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Top Contributors */}
            {insights.contributors?.topContributors &&
              insights.contributors.topContributors.length > 0 && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Top Contributors
                  </h3>
                  <div className="space-y-2">
                    {insights.contributors.topContributors.map(
                      (contrib, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={contrib.avatar}
                              alt={contrib.username}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="text-sm font-medium text-white">
                                {contrib.username}
                              </p>
                              <p className="text-xs text-gray-400">
                                {contrib.contributions} contributions
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* PRs by Author */}
            {insights.pullRequests?.byAuthor &&
              insights.pullRequests.byAuthor.length > 0 && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">
                    PRs by Author
                  </h3>
                  <div className="space-y-2">
                    {insights.pullRequests.byAuthor.map((author, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
                      >
                        <span className="text-sm text-gray-300">
                          {author.username}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {author.count} PRs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              Select a repository to view team insights
            </p>
          </div>
        )}
      </Motion.div>
    </div>
  );
};

const SecurityTab = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  security,
  onLoad,
  scope,
}) => {
  const repoList =
    scope === "personal"
      ? repositories
      : repositories.map((r) => ({
          full_name: r.repositoryFullName || r.fullName,
          id: r.repositoryId,
        }));

  useEffect(() => {
    if (selectedRepo) {
      onLoad(selectedRepo);
    }
  }, [selectedRepo]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Alerts
          </h2>
          <select
            value={selectedRepo}
            onChange={(e) => {
              onSelectRepo(e.target.value);
              if (e.target.value) onLoad(e.target.value);
            }}
            className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="">Select a repository</option>
            {repoList.map((repo) => (
              <option
                key={repo.id || repo.repositoryId}
                value={
                  repo.full_name || repo.repositoryFullName || repo.fullName
                }
              >
                {repo.full_name || repo.repositoryFullName || repo.fullName}
              </option>
            ))}
          </select>
        </div>

        {security ? (
          <div className="space-y-6">
            {/* Vulnerability Summary */}
            {security.vulnerabilities && (
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Vulnerabilities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-2xl font-semibold text-white">
                      {security.vulnerabilities.total}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Critical</p>
                    <p className="text-2xl font-semibold text-red-400">
                      {security.vulnerabilities.critical}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">High</p>
                    <p className="text-2xl font-semibold text-orange-400">
                      {security.vulnerabilities.high}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Medium</p>
                    <p className="text-2xl font-semibold text-yellow-400">
                      {security.vulnerabilities.medium}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Low</p>
                    <p className="text-2xl font-semibold text-blue-400">
                      {security.vulnerabilities.low}
                    </p>
                  </div>
                </div>
                {security.vulnerabilities.alerts &&
                  security.vulnerabilities.alerts.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {security.vulnerabilities.alerts
                        .slice(0, 10)
                        .map((alert, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border ${
                              alert.severity === "critical"
                                ? "bg-red-500/10 border-red-500/20"
                                : alert.severity === "high"
                                ? "bg-orange-500/10 border-orange-500/20"
                                : "bg-yellow-500/10 border-yellow-500/20"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                      alert.severity === "critical"
                                        ? "bg-red-500/20 text-red-400"
                                        : alert.severity === "high"
                                        ? "bg-orange-500/20 text-orange-400"
                                        : "bg-yellow-500/20 text-yellow-400"
                                    }`}
                                  >
                                    {alert.severity.toUpperCase()}
                                  </span>
                                  <span className="text-sm font-medium text-white">
                                    {alert.package}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                  {alert.summary}
                                </p>
                                {alert.cveId && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    CVE: {alert.cveId}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  alert.state === "open"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-gray-800 text-gray-400"
                                }`}
                              >
                                {alert.state}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
              </div>
            )}

            {/* Secrets & Licenses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-2">
                  Secret Scanning
                </h3>
                <p className="text-2xl font-semibold text-white">
                  {security.secrets?.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Alerts found</p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-2">
                  License Issues
                </h3>
                <p className="text-2xl font-semibold text-white">
                  {security.licenses?.total || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Alerts found</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              Select a repository to view security alerts
            </p>
          </div>
        )}
      </Motion.div>
    </div>
  );
};

const WorkflowsTab = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  workflowData,
  onLoad,
  scope,
}) => {
  const repoList =
    scope === "personal"
      ? repositories
      : repositories.map((r) => ({
          full_name: r.repositoryFullName || r.fullName,
          id: r.repositoryId,
        }));

  useEffect(() => {
    if (selectedRepo) {
      onLoad(selectedRepo);
    }
  }, [selectedRepo]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusColor = (status) => {
    if (status === "success")
      return "text-green-400 bg-green-500/10 border-green-500/20";
    if (status === "failure")
      return "text-red-400 bg-red-500/10 border-red-500/20";
    if (status === "cancelled")
      return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    if (status === "in_progress" || status === "queued")
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  };

  return (
    <div className="space-y-6">
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Code className="w-5 h-5" />
            GitHub Actions
          </h2>
          <select
            value={selectedRepo}
            onChange={(e) => {
              onSelectRepo(e.target.value);
              if (e.target.value) onLoad(e.target.value);
            }}
            className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="">Select a repository</option>
            {repoList.map((repo) => (
              <option
                key={repo.id || repo.repositoryId}
                value={
                  repo.full_name || repo.repositoryFullName || repo.fullName
                }
              >
                {repo.full_name || repo.repositoryFullName || repo.fullName}
              </option>
            ))}
          </select>
        </div>

        {workflowData ? (
          <div className="space-y-6">
            {/* Workflows List */}
            {workflowData.workflows && workflowData.workflows.length > 0 && (
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Workflows
                </h3>
                <div className="space-y-2">
                  {workflowData.workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {workflow.name}
                        </p>
                        <p className="text-xs text-gray-400">{workflow.path}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          workflow.state === "active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {workflow.state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Runs */}
            {workflowData.runs && workflowData.runs.length > 0 && (
              <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Recent Runs
                </h3>
                <div className="space-y-2">
                  {workflowData.runs.map((run) => (
                    <div
                      key={run.id}
                      className="border border-gray-800 bg-gray-800/50 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {run.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {run.headBranch} •{" "}
                            {formatRelativeTime(run.createdAt)}
                          </p>
                        </div>
                        <a
                          href={run.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-400 hover:text-purple-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded border ${getStatusColor(
                            run.status || run.conclusion
                          )}`}
                        >
                          {run.conclusion || run.status}
                        </span>
                        {run.actor && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <img
                              src={run.actor.avatar}
                              alt={run.actor.username}
                              className="w-4 h-4 rounded-full"
                            />
                            <span>{run.actor.username}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Code className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              Select a repository to view workflow runs
            </p>
          </div>
        )}
      </Motion.div>
    </div>
  );
};

const WebhooksTab = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  webhooks,
  onLoad,
  onSetup,
  onDelete,
  scope,
  scopeId,
}) => {
  const [showSetup, setShowSetup] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState(["push", "pull_request"]);
  const repoList =
    scope === "personal"
      ? repositories
      : repositories.map((r) => ({
          full_name: r.repositoryFullName || r.fullName,
          id: r.repositoryId,
        }));

  useEffect(() => {
    if (selectedRepo) {
      onLoad(selectedRepo);
    }
  }, [selectedRepo]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetup = async () => {
    if (!selectedRepo || !webhookUrl) {
      toast.error("Repository and webhook URL are required");
      return;
    }
    try {
      await onSetup({
        scope,
        scopeId,
        repositoryFullName: selectedRepo,
        events: webhookEvents,
        webhookUrl,
      });
      toast.success("Webhook setup successfully");
      setShowSetup(false);
      setWebhookUrl("");
      onLoad(selectedRepo);
    } catch (error) {
      toast.error(error.error || "Failed to setup webhook");
    }
  };

  const handleDelete = async (webhookId) => {
    if (!selectedRepo) return;
    if (!window.confirm("Are you sure you want to delete this webhook?"))
      return;
    try {
      await onDelete({
        scope,
        scopeId,
        repositoryFullName: selectedRepo,
        webhookId,
      });
      toast.success("Webhook deleted");
      onLoad(selectedRepo);
    } catch (error) {
      toast.error(error.error || "Failed to delete webhook");
    }
  };

  return (
    <div className="space-y-6">
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Webhooks
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedRepo}
              onChange={(e) => {
                onSelectRepo(e.target.value);
                if (e.target.value) onLoad(e.target.value);
              }}
              className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="">Select a repository</option>
              {repoList.map((repo) => (
                <option
                  key={repo.id || repo.repositoryId}
                  value={
                    repo.full_name || repo.repositoryFullName || repo.fullName
                  }
                >
                  {repo.full_name || repo.repositoryFullName || repo.fullName}
                </option>
              ))}
            </select>
            {selectedRepo && (
              <Motion.button
                onClick={() => setShowSetup(!showSetup)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-sm"
                whileTap={{ scale: 0.97 }}
              >
                <Plus className="w-4 h-4" />
                Setup Webhook
              </Motion.button>
            )}
          </div>
        </div>

        {showSetup && selectedRepo && (
          <Motion.div
            className="mb-6 p-4 bg-gray-900/40 border border-gray-800 rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <h3 className="text-sm font-semibold text-white mb-3">
              Setup New Webhook
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Webhook URL
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-domain.com/webhooks/github"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Events
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "push",
                    "pull_request",
                    "issues",
                    "issue_comment",
                    "release",
                    "deployment",
                  ].map((event) => (
                    <label
                      key={event}
                      className="flex items-center gap-2 text-xs text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={webhookEvents.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookEvents([...webhookEvents, event]);
                          } else {
                            setWebhookEvents(
                              webhookEvents.filter((e) => e !== event)
                            );
                          }
                        }}
                        className="rounded"
                      />
                      {event}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Motion.button
                  onClick={handleSetup}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-sm"
                  whileTap={{ scale: 0.97 }}
                >
                  Create Webhook
                </Motion.button>
                <Motion.button
                  onClick={() => {
                    setShowSetup(false);
                    setWebhookUrl("");
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </Motion.button>
              </div>
            </div>
          </Motion.div>
        )}

        {selectedRepo ? (
          webhooks && webhooks.length > 0 ? (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="border border-gray-800 bg-gray-900/40 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-medium text-white">
                          {webhook.url}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            webhook.active
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-800 text-gray-400"
                          }`}
                        >
                          {webhook.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {webhook.events.map((event, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Created {formatRelativeTime(webhook.createdAt)}
                      </p>
                    </div>
                    <Motion.button
                      onClick={() => handleDelete(webhook.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                      whileTap={{ scale: 0.97 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Motion.button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <LinkIcon className="w-8 h-8 text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">No webhooks configured</p>
              <p className="text-xs text-gray-500 mt-1">
                Setup a webhook to receive real-time updates
              </p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <LinkIcon className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              Select a repository to manage webhooks
            </p>
          </div>
        )}
      </Motion.div>
    </div>
  );
};

const FilesTab = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  fileTree,
  branches,
  selectedBranch,
  onSelectBranch,
  onLoadTree,
  onLoadBranches,
  onLoadFile,
  scope,
  scopeId,
}) => {
  const [currentPath, setCurrentPath] = useState("");
  const repoList =
    scope === "personal"
      ? repositories
      : repositories.map((r) => ({
          full_name: r.repositoryFullName || r.fullName,
          id: r.repositoryId,
        }));

  useEffect(() => {
    if (selectedRepo) {
      onLoadBranches(selectedRepo);
      onLoadTree(selectedRepo, "", selectedBranch);
    }
  }, [selectedRepo, selectedBranch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePathClick = (path) => {
    setCurrentPath(path);
    onLoadTree(selectedRepo, path, selectedBranch);
  };

  const handleFileClick = (file) => {
    if (file.type === "blob") {
      onLoadFile(selectedRepo, file.path, selectedBranch);
    } else if (file.type === "tree") {
      handlePathClick(file.path);
    }
  };

  const parentPath = currentPath.split("/").slice(0, -1).join("/");

  return (
    <div className="space-y-6">
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            Repository Files
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedRepo}
              onChange={(e) => {
                onSelectRepo(e.target.value);
                setCurrentPath("");
              }}
              className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="">Select a repository</option>
              {repoList.map((repo) => (
                <option
                  key={repo.id || repo.repositoryId}
                  value={
                    repo.full_name || repo.repositoryFullName || repo.fullName
                  }
                >
                  {repo.full_name || repo.repositoryFullName || repo.fullName}
                </option>
              ))}
            </select>
            {selectedRepo && branches.length > 0 && (
              <select
                value={selectedBranch}
                onChange={(e) => {
                  onSelectBranch(e.target.value);
                  setCurrentPath("");
                }}
                className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
              >
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                    {branch.protected && " 🔒"}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {selectedRepo ? (
          !fileTree ? (
            <SkeletonLoader variant="taskCard" count={5} />
          ) : fileTree && fileTree.length > 0 ? (
            <div className="space-y-2">
              {currentPath && (
                <Motion.button
                  onClick={() => {
                    const parent = currentPath
                      .split("/")
                      .slice(0, -1)
                      .join("/");
                    setCurrentPath(parent);
                    onLoadTree(selectedRepo, parent, selectedBranch);
                  }}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4"
                  whileTap={{ scale: 0.97 }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to {parentPath || "root"}
                </Motion.button>
              )}
              <div className="space-y-1">
                {fileTree.map((file, idx) => (
                  <Motion.div
                    key={idx}
                    onClick={() => handleFileClick(file)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      file.type === "tree"
                        ? "bg-gray-900/40 border border-gray-800 hover:bg-gray-800/50"
                        : "bg-gray-900/20 border border-gray-800/50 hover:bg-gray-800/30"
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {file.type === "tree" ? (
                      <Folder className="w-5 h-5 text-blue-400" />
                    ) : (
                      <FileCode className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-sm text-white flex-1">
                      {file.path.split("/").pop()}
                    </span>
                    {file.type === "blob" && file.size && (
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </span>
                    )}
                  </Motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileCode className="w-8 h-8 text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">No files found</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileCode className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              Select a repository to view files
            </p>
          </div>
        )}
      </Motion.div>
    </div>
  );
};

const ReleasesTab = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  releases,
  onLoad,
  scope,
}) => {
  const repoList =
    scope === "personal"
      ? repositories
      : repositories.map((r) => ({
          full_name: r.repositoryFullName || r.fullName,
          id: r.repositoryId,
        }));

  useEffect(() => {
    if (selectedRepo) {
      onLoad(selectedRepo);
    }
  }, [selectedRepo]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Releases
          </h2>
          <select
            value={selectedRepo}
            onChange={(e) => {
              onSelectRepo(e.target.value);
              if (e.target.value) onLoad(e.target.value);
            }}
            className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="">Select a repository</option>
            {repoList.map((repo) => (
              <option
                key={repo.id || repo.repositoryId}
                value={
                  repo.full_name || repo.repositoryFullName || repo.fullName
                }
              >
                {repo.full_name || repo.repositoryFullName || repo.fullName}
              </option>
            ))}
          </select>
        </div>

        {selectedRepo ? (
          releases && releases.length > 0 ? (
            <div className="space-y-4">
              {releases.map((release) => (
                <div
                  key={release.id}
                  className="border border-gray-800 bg-gray-900/40 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {release.name || release.tagName}
                        </h3>
                        {release.prerelease && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs border border-yellow-500/30">
                            Pre-release
                          </span>
                        )}
                        {release.draft && (
                          <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded text-xs border border-gray-500/30">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-3">
                        {release.body}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {release.tagName}
                        </span>
                        {release.author && (
                          <span className="flex items-center gap-1">
                            <img
                              src={release.author.avatar}
                              alt={release.author.username}
                              className="w-4 h-4 rounded-full"
                            />
                            {release.author.username}
                          </span>
                        )}
                        {release.publishedAt && (
                          <span>
                            Published {formatRelativeTime(release.publishedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={release.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                  {release.assets && release.assets.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-xs text-gray-500 mb-2">Assets</p>
                      <div className="flex flex-wrap gap-2">
                        {release.assets.map((asset) => (
                          <a
                            key={asset.id}
                            href={asset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 bg-gray-800 rounded border border-gray-700 text-gray-300 hover:bg-gray-700"
                          >
                            {asset.name} (
                            {(asset.size / 1024 / 1024).toFixed(2)} MB)
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Zap className="w-8 h-8 text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">No releases found</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              Select a repository to view releases
            </p>
          </div>
        )}
      </Motion.div>
    </div>
  );
};

// Modal Components
const PRDetailModal = ({ pr, onClose, onViewIssue }) => {
  if (!pr) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="sticky top-0 bg-[#0d0d0e] border-b border-gray-800 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-white">
                #{pr.number} {pr.title}
              </h2>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  pr.state === "open"
                    ? "bg-green-500/20 text-green-400"
                    : pr.merged
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {pr.merged ? "Merged" : pr.state}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <img
                  src={pr.author.avatar}
                  alt={pr.author.username}
                  className="w-5 h-5 rounded-full"
                />
                {pr.author.username}
              </span>
              <span>{formatRelativeTime(pr.createdAt)}</span>
              {pr.additions > 0 && (
                <span className="text-green-400">+{pr.additions}</span>
              )}
              {pr.deletions > 0 && (
                <span className="text-red-400">-{pr.deletions}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {pr.body && (
            <div className="prose prose-invert max-w-none">
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {pr.body}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Base Branch</p>
              <p className="text-sm font-semibold text-white">{pr.base.ref}</p>
            </div>
            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Head Branch</p>
              <p className="text-sm font-semibold text-white">{pr.head.ref}</p>
            </div>
          </div>

          {pr.files && pr.files.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Changed Files ({pr.files.length})
              </h3>
              <div className="space-y-2">
                {pr.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-900/40 border border-gray-800 rounded-lg"
                  >
                    <span className="text-sm text-gray-300">
                      {file.filename}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-400">+{file.additions}</span>
                      <span className="text-red-400">-{file.deletions}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pr.comments && pr.comments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Comments ({pr.comments.length})
              </h3>
              <div className="space-y-3">
                {pr.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 bg-gray-900/40 border border-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm font-medium text-white">
                        {comment.author.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{comment.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pr.reviews && pr.reviews.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Reviews ({pr.reviews.length})
              </h3>
              <div className="space-y-3">
                {pr.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 bg-gray-900/40 border border-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={review.reviewer.avatar}
                        alt={review.reviewer.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm font-medium text-white">
                        {review.reviewer.username}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          review.state === "APPROVED"
                            ? "bg-green-500/20 text-green-400"
                            : review.state === "CHANGES_REQUESTED"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {review.state}
                      </span>
                    </div>
                    {review.body && (
                      <p className="text-sm text-gray-300">{review.body}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
            <a
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-sm font-medium"
            >
              View on GitHub
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </Motion.div>
    </div>
  );
};

const IssueDetailModal = ({ issue, onClose, onViewPR }) => {
  if (!issue) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="sticky top-0 bg-[#0d0d0e] border-b border-gray-800 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-white">
                #{issue.number} {issue.title}
              </h2>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  issue.state === "open"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {issue.state}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <img
                  src={issue.author.avatar}
                  alt={issue.author.username}
                  className="w-5 h-5 rounded-full"
                />
                {issue.author.username}
              </span>
              <span>{formatRelativeTime(issue.createdAt)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {issue.body && (
            <div className="prose prose-invert max-w-none">
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {issue.body}
              </div>
            </div>
          )}

          {issue.labels && issue.labels.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Labels</h3>
              <div className="flex flex-wrap gap-2">
                {issue.labels.map((label, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: `#${label.color}20`,
                      color: `#${label.color}`,
                      border: `1px solid #${label.color}40`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {issue.assignees && issue.assignees.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">
                Assignees
              </h3>
              <div className="flex flex-wrap gap-2">
                {issue.assignees.map((assignee, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-gray-900/40 border border-gray-800 rounded-lg"
                  >
                    <img
                      src={assignee.avatar}
                      alt={assignee.username}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-gray-300">
                      {assignee.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {issue.comments && issue.comments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Comments ({issue.comments.length})
              </h3>
              <div className="space-y-3">
                {issue.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 bg-gray-900/40 border border-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm font-medium text-white">
                        {comment.author.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{comment.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {issue.events && issue.events.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Timeline
              </h3>
              <div className="space-y-2">
                {issue.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 bg-gray-900/20 border border-gray-800/50 rounded text-xs text-gray-400"
                  >
                    <span className="capitalize">{event.event}</span>
                    <span>by {event.actor.username}</span>
                    <span>{formatRelativeTime(event.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-sm font-medium"
            >
              View on GitHub
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </Motion.div>
    </div>
  );
};

const FileContentModal = ({ file, path, onClose }) => {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden m-4 flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="sticky top-0 bg-[#0d0d0e] border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">{path}</h2>
            {file.size && (
              <span className="text-xs text-gray-500">
                ({(file.size / 1024).toFixed(2)} KB)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {file.downloadUrl && (
              <a
                href={file.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-sm"
              >
                Download
              </a>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {file.type === "file" && file.content ? (
            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words">
              {file.content}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileCode className="w-8 h-8 text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">
                File content not available
              </p>
            </div>
          )}
        </div>
      </Motion.div>
    </div>
  );
};

const SearchTab = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  searchResults,
  searchLoading,
  onSearch,
  scope,
}) => {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("code");

  const repoList =
    scope === "personal"
      ? repositories
      : repositories.map((r) => ({
          full_name: r.repositoryFullName || r.fullName,
          id: r.repositoryId,
        }));

  const handleSearch = () => {
    if (!query.trim()) {
      return;
    }
    onSearch(query, searchType);
  };

  return (
    <div className="space-y-6">
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            Repository Search
          </h2>
          <select
            value={selectedRepo}
            onChange={(e) => onSelectRepo(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="">Select a repository</option>
            {repoList.map((repo) => (
              <option
                key={repo.id || repo.repositoryId}
                value={
                  repo.full_name || repo.repositoryFullName || repo.fullName
                }
              >
                {repo.full_name || repo.repositoryFullName || repo.fullName}
              </option>
            ))}
          </select>
        </div>

        {selectedRepo ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="Search code, commits, issues..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="code">Code</option>
                <option value="commits">Commits</option>
                <option value="issues">Issues</option>
              </select>
              <Motion.button
                onClick={handleSearch}
                disabled={searchLoading || !query.trim()}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-sm disabled:opacity-50"
                whileTap={{ scale: 0.97 }}
              >
                {searchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Motion.button>
            </div>

            {searchResults && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">
                  Found {searchResults.length} result
                  {searchResults.length !== 1 ? "s" : ""}
                </p>
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((result, idx) => (
                      <Motion.div
                        key={idx}
                        className="p-4 bg-gray-900/40 border border-gray-800 rounded-lg hover:bg-gray-800/50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileCode className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-white">
                                {result.path || result.name}
                              </span>
                            </div>
                            {result.text && (
                              <p className="text-xs text-gray-400 line-clamp-2">
                                {result.text}
                              </p>
                            )}
                            {result.snippet && (
                              <pre className="text-xs text-gray-500 mt-2 bg-gray-950 p-2 rounded overflow-x-auto">
                                {result.snippet}
                              </pre>
                            )}
                          </div>
                          {result.url && (
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </Motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="w-8 h-8 text-gray-600 mb-3" />
                    <p className="text-sm text-gray-400">No results found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              Select a repository to search
            </p>
          </div>
        )}
      </Motion.div>
    </div>
  );
};

const SettingsTab = ({
  notificationRules,
  onLoad,
  onCreate,
  onUpdate,
  onDelete,
  scope,
  scopeId,
  connector,
  onSyncIssues,
  projects,
}) => {
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [selectedProject, setSelectedProject] = useState("");
  const [ruleForm, setRuleForm] = useState({
    name: "",
    enabled: true,
    filters: {
      repositories: [],
      branches: [],
      filePaths: [],
      events: [],
    },
    priority: "normal",
    channels: {
      email: true,
      inApp: true,
      webhook: false,
      webhookUrl: "",
    },
  });

  useEffect(() => {
    onLoad();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateRule = async () => {
    try {
      await onCreate({
        scope,
        scopeId,
        rule: ruleForm,
      });
      toast.success("Notification rule created");
      setShowRuleForm(false);
      setRuleForm({
        name: "",
        enabled: true,
        filters: { repositories: [], branches: [], filePaths: [], events: [] },
        priority: "normal",
        channels: { email: true, inApp: true, webhook: false, webhookUrl: "" },
      });
      onLoad();
    } catch (error) {
      toast.error(error.error || "Failed to create rule");
    }
  };

  const handleSyncIssuesToTasks = async () => {
    if (!selectedProject) {
      toast.error("Select a project first");
      return;
    }
    try {
      const result = await onSyncIssues({
        repositoryFullName:
          connector?.linkedResources?.[0]?.repositoryFullName || "",
        projectId: selectedProject,
        scope,
        scopeId,
      });
      toast.success(
        `Created ${result.created} tasks, linked ${result.linked} existing tasks`
      );
    } catch (error) {
      toast.error(error.error || "Failed to sync issues");
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Rules */}
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Rules
          </h2>
          <Motion.button
            onClick={() => setShowRuleForm(!showRuleForm)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-sm"
            whileTap={{ scale: 0.97 }}
          >
            <Plus className="w-4 h-4" />
            Create Rule
          </Motion.button>
        </div>

        {showRuleForm && (
          <Motion.div
            className="mb-6 p-4 bg-gray-900/40 border border-gray-800 rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <h3 className="text-sm font-semibold text-white mb-3">
              Create Notification Rule
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, name: e.target.value })
                  }
                  placeholder="e.g., Critical PRs only"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Priority
                  </label>
                  <select
                    value={ruleForm.priority}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, priority: e.target.value })
                    }
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={ruleForm.enabled}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, enabled: e.target.checked })
                    }
                    className="rounded"
                  />
                  <label className="text-xs text-gray-400">Enabled</label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Motion.button
                  onClick={handleCreateRule}
                  disabled={!ruleForm.name}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-sm disabled:opacity-50"
                  whileTap={{ scale: 0.97 }}
                >
                  Create
                </Motion.button>
                <Motion.button
                  onClick={() => {
                    setShowRuleForm(false);
                    setRuleForm({
                      name: "",
                      enabled: true,
                      filters: {
                        repositories: [],
                        branches: [],
                        filePaths: [],
                        events: [],
                      },
                      priority: "normal",
                      channels: {
                        email: true,
                        inApp: true,
                        webhook: false,
                        webhookUrl: "",
                      },
                    });
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </Motion.button>
              </div>
            </div>
          </Motion.div>
        )}

        {notificationRules && notificationRules.length > 0 ? (
          <div className="space-y-3">
            {notificationRules.map((rule) => (
              <div
                key={rule.id}
                className="border border-gray-800 bg-gray-900/40 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-white">
                        {rule.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          rule.priority === "critical"
                            ? "bg-red-500/20 text-red-400"
                            : rule.priority === "high"
                            ? "bg-orange-500/20 text-orange-400"
                            : rule.priority === "normal"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {rule.priority}
                      </span>
                      {rule.enabled ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                          Enabled
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      {rule.filters.events &&
                        rule.filters.events.length > 0 && (
                          <p>Events: {rule.filters.events.join(", ")}</p>
                        )}
                      {rule.filters.repositories &&
                        rule.filters.repositories.length > 0 && (
                          <p>
                            Repositories: {rule.filters.repositories.length}
                          </p>
                        )}
                      <p>
                        Channels:{" "}
                        {[
                          rule.channels?.email && "Email",
                          rule.channels?.inApp && "In-App",
                          rule.channels?.webhook && "Webhook",
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Motion.button
                      onClick={() => {
                        setEditingRule(rule);
                        setRuleForm(rule);
                        setShowRuleForm(true);
                      }}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded"
                      whileTap={{ scale: 0.97 }}
                    >
                      <Edit className="w-4 h-4" />
                    </Motion.button>
                    <Motion.button
                      onClick={async () => {
                        if (window.confirm("Delete this rule?")) {
                          try {
                            await onDelete({ scope, scopeId, ruleId: rule.id });
                            toast.success("Rule deleted");
                            onLoad();
                          } catch (error) {
                            toast.error(error.error || "Failed to delete rule");
                          }
                        }
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                      whileTap={{ scale: 0.97 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Motion.button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="w-8 h-8 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              No notification rules configured
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Create rules to customize your notifications
            </p>
          </div>
        )}
      </Motion.div>

      {/* Task Sync Settings */}
      <Motion.div
        className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Task Integration
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">
              Sync GitHub Issues to Tasks
            </label>
            <div className="flex items-center gap-3">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Select a project</option>
                {projects?.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <Motion.button
                onClick={handleSyncIssuesToTasks}
                disabled={!selectedProject}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-sm disabled:opacity-50"
                whileTap={{ scale: 0.97 }}
              >
                Sync Issues
              </Motion.button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Automatically create tasks from open GitHub issues in the selected
              project
            </p>
          </div>
        </div>
      </Motion.div>
    </div>
  );
};

const GitHubPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentWorkspace, workspaces } = useWorkspace();
  const { projects } = useProject();
  const { user } = useAuth();

  const [selectedScope, setSelectedScope] = useState("personal");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    currentWorkspace?._id || ""
  );
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [connector, setConnector] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loadingConnector, setLoadingConnector] = useState(true);

  const [availableRepositories, setAvailableRepositories] = useState([]);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");
  const [linkedRepositories, setLinkedRepositories] = useState([]);
  const [linkInFlight, setLinkInFlight] = useState(false);
  const [showRepoSelection, setShowRepoSelection] = useState(false);
  const [pendingConnection, setPendingConnection] = useState(null);

  const [activity, setActivity] = useState([]);
  const [selectedActivityRepo, setSelectedActivityRepo] = useState("");
  const [syncInFlight, setSyncInFlight] = useState(false);
  const [syncSummary, setSyncSummary] = useState(null);
  const [showInfoDropdown, setShowInfoDropdown] = useState(false);

  // Advanced features state
  const [activeTab, setActiveTab] = useState("overview");
  const [repositoryStatistics, setRepositoryStatistics] = useState(null);
  const [activityAnalytics, setActivityAnalytics] = useState(null);
  const [commitHistory, setCommitHistory] = useState([]);
  const [teamInsights, setTeamInsights] = useState(null);
  const [securityAlerts, setSecurityAlerts] = useState(null);
  const [workflowRuns, setWorkflowRuns] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [notificationRules, setNotificationRules] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedRepoForDetails, setSelectedRepoForDetails] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [fileTree, setFileTree] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [releases, setReleases] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [showPRModal, setShowPRModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);

  const scopeOptions = useMemo(
    () => [
      {
        id: "personal",
        label: "Personal",
        icon: User,
        description: "Connect your GitHub account to view repos and activity",
        disabled: false,
      },
      {
        id: "project",
        label: "Project",
        icon: GitBranch,
        description: "Link repositories to projects for team collaboration",
        disabled: !projects?.length,
      },
    ],
    [projects]
  );

  const effectiveScopeId = useMemo(() => {
    if (selectedScope === "project") return selectedProjectId || undefined;
    return undefined;
  }, [selectedScope, selectedProjectId]);

  useEffect(() => {
    setSelectedWorkspaceId((prev) => prev || currentWorkspace?._id || "");
  }, [currentWorkspace?._id]);

  const resetState = () => {
    setConnector(null);
    setIsConnected(false);
    setLinkedRepositories([]);
    setSelectedActivityRepo("");
    setActivity([]);
    setSyncSummary(null);
  };

  const loadConnector = async () => {
    if (selectedScope === "project" && !selectedProjectId) {
      resetState();
      return;
    }

    try {
      setLoadingConnector(true);

      // For project scope, check personal GitHub connection
      if (selectedScope === "project") {
        const { connectors } = await connectorService.getAllConnectors(
          "personal",
          undefined
        );
        const personalGitHubConnector = connectors?.find(
          (c) => c.type === "github"
        );
        if (personalGitHubConnector) {
          setConnector(personalGitHubConnector);
          setIsConnected(true);
          // Load repositories from personal account
          await loadRepositories();
          const linked =
            personalGitHubConnector.linkedResources ||
            personalGitHubConnector.settings?.linkedRepositories ||
            [];
          // Filter linked repos for this project
          const projectLinked = linked.filter(
            (link) => link.project?.toString() === selectedProjectId
          );
          setLinkedRepositories(projectLinked);
          if (projectLinked.length) {
            setSelectedActivityRepo(projectLinked[0].repositoryFullName);
          } else {
            setSelectedActivityRepo("");
          }
        } else {
          resetState();
        }
      } else {
        const { connectors } = await connectorService.getAllConnectors(
          selectedScope,
          effectiveScopeId
        );
        const githubConnector = connectors?.find((c) => c.type === "github");
        if (githubConnector) {
          setConnector(githubConnector);
          setIsConnected(true);
          const linked =
            githubConnector.linkedResources ||
            githubConnector.settings?.linkedRepositories ||
            [];
          setLinkedRepositories(linked);
          if (linked.length) {
            setSelectedActivityRepo(linked[0].repositoryFullName);
          } else {
            setSelectedActivityRepo("");
          }
        } else {
          resetState();
        }
      }
    } catch (error) {
      console.error("Error loading GitHub connector:", error);
      toast.error(error.error || "Failed to load GitHub connector");
      resetState();
    } finally {
      setLoadingConnector(false);
    }
  };

  const loadRepositories = async () => {
    // For project scope, always use personal scope to fetch repositories
    const scopeToUse = selectedScope === "project" ? "personal" : selectedScope;
    const scopeIdToUse =
      selectedScope === "project" ? undefined : effectiveScopeId;

    // For project scope, we need personal GitHub to be connected
    if (selectedScope === "project") {
      try {
        const { connectors } = await connectorService.getAllConnectors(
          "personal",
          undefined
        );
        const personalGitHubConnector = connectors?.find(
          (c) => c.type === "github"
        );
        if (!personalGitHubConnector) {
          setAvailableRepositories([]);
          return;
        }
      } catch (error) {
        setAvailableRepositories([]);
        return;
      }
    } else if (!isConnected) {
      setAvailableRepositories([]);
      return;
    }

    try {
      const { repositories, linkedResources } =
        await connectorService.getGitHubRepositories(scopeToUse, scopeIdToUse);
      setAvailableRepositories(repositories || []);
      if (
        linkedResources &&
        linkedResources.length > 0 &&
        selectedScope !== "project"
      ) {
        setLinkedRepositories(linkedResources);
      }
    } catch (error) {
      console.error("Error fetching repositories:", error);
      if (error.requiresReconnect || error.status === 401) {
        toast.error(
          "GitHub authentication expired. Please reconnect your GitHub account."
        );
        // Reset connection state
        setIsConnected(false);
        setConnector(null);
      } else {
        toast.error(error.error || "Failed to fetch repositories");
      }
    }
  };

  const loadActivity = async (repoFullName) => {
    // For project scope, use personal scope for activity
    const scopeToUse = selectedScope === "project" ? "personal" : selectedScope;
    const scopeIdToUse =
      selectedScope === "project" ? undefined : effectiveScopeId;

    if (!isConnected) {
      setActivity([]);
      return;
    }
    try {
      const { data } = await connectorService.getGitHubActivity({
        scope: scopeToUse,
        scopeId: scopeIdToUse,
        repositoryFullName: repoFullName || undefined,
        limit: 40,
      });
      setActivity(data || []);
    } catch (error) {
      console.error("Error fetching GitHub activity:", error);
      toast.error(error.error || "Failed to load GitHub activity");
    }
  };

  useEffect(() => {
    loadConnector();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScope, selectedWorkspaceId, selectedProjectId]);

  useEffect(() => {
    if (isConnected) {
      loadRepositories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  useEffect(() => {
    if (selectedActivityRepo) {
      loadActivity(selectedActivityRepo);
    } else if (isConnected) {
      loadActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedActivityRepo, isConnected]);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      toast.success("GitHub connected successfully");
      loadConnector();
      window.history.replaceState({}, "", "/connectors/github");
    } else if (error === "true") {
      toast.error("Failed to connect GitHub");
      window.history.replaceState({}, "", "/connectors/github");
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Listen for OAuth success messages
    const handleMessage = (event) => {
      if (event.data.type === "oauth-success") {
        toast.success("GitHub connected successfully");
        loadConnector();
        // If project scope, show repository selection after connection
        if (selectedScope === "project" && selectedProjectId) {
          setTimeout(() => {
            loadRepositories();
            setShowRepoSelection(true);
          }, 1500);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [selectedScope, selectedProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async () => {
    try {
      if (selectedScope === "project" && !selectedProjectId) {
        toast.error("Select a project to continue");
        return;
      }

      // For project scope, check if personal GitHub is connected
      if (selectedScope === "project") {
        const { connectors } = await connectorService.getAllConnectors(
          "personal",
          undefined
        );
        const personalGitHubConnector = connectors?.find(
          (c) => c.type === "github"
        );
        if (!personalGitHubConnector) {
          toast.error(
            "Please connect your personal GitHub account first. Project repositories are linked from your personal GitHub account."
          );
          return;
        }

        // For project scope, we don't need OAuth - just use personal account
        const response = await connectorService.connectGitHub(
          selectedScope,
          effectiveScopeId
        );
        if (response.usesPersonalAccount) {
          toast.success(
            "You can now select repositories from your personal GitHub account"
          );
          await loadConnector();
          setShowRepoSelection(true);
        }
        return;
      }

      await connectorService.connectGitHub(selectedScope, effectiveScopeId);
      // Reload connector after successful connection
      setTimeout(() => {
        loadConnector();
      }, 1000);
    } catch (error) {
      console.error("Error connecting GitHub:", error);
      toast.error(error.error || "Failed to initiate GitHub connection");
    }
  };

  const handleDisconnect = async () => {
    if (!connector?._id) return;

    const proceed = window.confirm(
      "Disconnecting will remove access to linked repositories. Continue?"
    );
    if (!proceed) return;

    try {
      await connectorService.deleteConnector(connector._id);
      toast.success("GitHub disconnected");
      resetState();
    } catch (error) {
      console.error("Error disconnecting GitHub:", error);
      toast.error(error.error || "Failed to disconnect GitHub");
    }
  };

  const handleLinkRepository = async () => {
    if (!selectedRepositoryId) {
      toast.error("Select a repository to link");
      return;
    }
    if (!connector) {
      toast.error("Connect to GitHub before linking repositories");
      return;
    }

    // Convert selectedRepositoryId to number for comparison (repo.id is a number)
    const repoId =
      typeof selectedRepositoryId === "string"
        ? parseInt(selectedRepositoryId, 10)
        : selectedRepositoryId;

    const repository = availableRepositories.find(
      (repo) =>
        repo.id === repoId ||
        repo.id?.toString() === selectedRepositoryId?.toString()
    );
    if (!repository) {
      toast.error("Could not resolve repository");
      return;
    }

    try {
      setLinkInFlight(true);
      await connectorService.linkGitHubRepository({
        scope: selectedScope,
        scopeId: effectiveScopeId,
        repository: {
          id: repository.id,
          fullName: repository.full_name || repository.fullName,
        },
        projectId: selectedProjectId || undefined,
      });
      toast.success(`Linked ${repository.full_name || repository.fullName}`);
      setSelectedRepositoryId("");
      setShowRepoSelection(false);
      await loadConnector();
      await loadRepositories();
    } catch (error) {
      console.error("Error linking repository:", error);
      toast.error(error.error || "Failed to link repository");
    } finally {
      setLinkInFlight(false);
    }
  };

  const handleUnlinkRepository = async (resource) => {
    if (!connector?._id || !resource?.repositoryFullName) return;

    const proceed = window.confirm(
      `Unlink ${resource.repositoryFullName}? Notifications for this repo will stop.`
    );
    if (!proceed) return;

    try {
      await connectorService.unlinkGitHubRepository({
        connectorId: connector._id,
        repositoryFullName: resource.repositoryFullName,
        workspaceId: resource.workspace,
        projectId: resource.project,
      });
      toast.success(`Unlinked ${resource.repositoryFullName}`);
      await loadConnector();
      await loadRepositories();
    } catch (error) {
      console.error("Error unlinking repository:", error);
      toast.error(error.error || "Failed to unlink repository");
    }
  };

  const handleSyncRepository = async (resource) => {
    if (!resource?.repositoryFullName) return;
    try {
      setSyncInFlight(true);
      const { data } = await connectorService.syncGitHubActivity({
        scope: selectedScope,
        scopeId: effectiveScopeId,
        repositoryFullName: resource.repositoryFullName,
      });
      setSyncSummary(data);
      toast.success("Repository synced");
      setSelectedActivityRepo(resource.repositoryFullName);
      await loadActivity(resource.repositoryFullName);
    } catch (error) {
      console.error("Error syncing repository:", error);
      toast.error(error.error || "Failed to sync repository");
    } finally {
      setSyncInFlight(false);
    }
  };

  // Advanced features data loading
  const loadRepositoryStatistics = async (repositoryFullName) => {
    if (!repositoryFullName || !isConnected) return;
    try {
      setLoadingStats(true);
      const { statistics } = await connectorService.getRepositoryStatistics(
        selectedScope,
        effectiveScopeId,
        repositoryFullName
      );
      setRepositoryStatistics(statistics);
    } catch (error) {
      console.error("Error loading repository statistics:", error);
      if (error.requiresReconnect) {
        toast.error("Please reconnect your GitHub account");
      } else {
        toast.error(error.error || "Failed to load statistics");
      }
    } finally {
      setLoadingStats(false);
    }
  };

  const loadActivityAnalytics = async (
    repositoryFullName,
    period = "weekly"
  ) => {
    if (!repositoryFullName || !isConnected) return;
    try {
      setLoadingAnalytics(true);
      const { analytics } = await connectorService.getActivityAnalytics(
        selectedScope,
        effectiveScopeId,
        repositoryFullName,
        period,
        30
      );
      setActivityAnalytics(analytics);
    } catch (error) {
      console.error("Error loading activity analytics:", error);
      if (error.requiresReconnect) {
        toast.error("Please reconnect your GitHub account");
      } else {
        toast.error(error.error || "Failed to load analytics");
      }
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadCommitHistory = async (repositoryFullName, page = 1) => {
    if (!repositoryFullName || !isConnected) return;
    try {
      const { commits } = await connectorService.getCommitHistory(
        selectedScope,
        effectiveScopeId,
        repositoryFullName,
        { page, perPage: 30 }
      );
      setCommitHistory(commits);
    } catch (error) {
      console.error("Error loading commit history:", error);
      toast.error(error.error || "Failed to load commit history");
    }
  };

  const loadTeamInsights = async (repositoryFullName, period = "monthly") => {
    if (!repositoryFullName || !isConnected) return;
    try {
      const { insights } = await connectorService.getTeamInsights(
        selectedScope,
        effectiveScopeId,
        repositoryFullName,
        period
      );
      setTeamInsights(insights);
    } catch (error) {
      console.error("Error loading team insights:", error);
      toast.error(error.error || "Failed to load team insights");
    }
  };

  const loadSecurityAlerts = async (repositoryFullName) => {
    if (!repositoryFullName || !isConnected) return;
    try {
      const { security } = await connectorService.getSecurityAlerts(
        selectedScope,
        effectiveScopeId,
        repositoryFullName
      );
      setSecurityAlerts(security);
    } catch (error) {
      console.error("Error loading security alerts:", error);
      toast.error(error.error || "Failed to load security alerts");
    }
  };

  const loadWorkflowRuns = async (repositoryFullName) => {
    if (!repositoryFullName || !isConnected) return;
    try {
      const { workflows, runs } = await connectorService.getWorkflowRuns(
        selectedScope,
        effectiveScopeId,
        repositoryFullName
      );
      setWorkflowRuns({ workflows, runs });
    } catch (error) {
      console.error("Error loading workflow runs:", error);
      toast.error(error.error || "Failed to load workflow runs");
    }
  };

  const loadWebhooks = async (repositoryFullName) => {
    if (!repositoryFullName || !isConnected) return;
    try {
      const { webhooks: webhooksData } = await connectorService.getWebhooks(
        selectedScope,
        effectiveScopeId,
        repositoryFullName
      );
      setWebhooks(webhooksData || []);
    } catch (error) {
      console.error("Error loading webhooks:", error);
      toast.error(error.error || "Failed to load webhooks");
    }
  };

  const loadNotificationRules = async () => {
    if (!isConnected) return;
    try {
      const { rules } = await connectorService.getNotificationRules(
        selectedScope,
        effectiveScopeId
      );
      setNotificationRules(rules || []);
    } catch (error) {
      console.error("Error loading notification rules:", error);
      toast.error(error.error || "Failed to load notification rules");
    }
  };

  const loadFileTree = async (
    repositoryFullName,
    path = "",
    branch = "main"
  ) => {
    if (!repositoryFullName || !isConnected) return;
    try {
      const scopeToUse =
        selectedScope === "project" ? "personal" : selectedScope;
      const scopeIdToUse =
        selectedScope === "project" ? undefined : effectiveScopeId;
      const { tree } = await connectorService.getRepositoryTree(
        scopeToUse,
        scopeIdToUse,
        repositoryFullName,
        branch,
        path
      );
      setFileTree(tree || []);
    } catch (error) {
      console.error("Error loading file tree:", error);
      toast.error(error.error || "Failed to load file tree");
    }
  };

  const loadBranches = async (repositoryFullName) => {
    if (!repositoryFullName || !isConnected) return;
    try {
      const scopeToUse =
        selectedScope === "project" ? "personal" : selectedScope;
      const scopeIdToUse =
        selectedScope === "project" ? undefined : effectiveScopeId;
      const { branches: branchesData } = await connectorService.getBranches(
        scopeToUse,
        scopeIdToUse,
        repositoryFullName
      );
      setBranches(branchesData || []);
      if (branchesData && branchesData.length > 0 && !selectedBranch) {
        const defaultBranch =
          branchesData.find((b) => b.default) || branchesData[0];
        setSelectedBranch(defaultBranch?.name || "main");
      }
    } catch (error) {
      console.error("Error loading branches:", error);
      toast.error(error.error || "Failed to load branches");
    }
  };

  const loadFileContent = async (repositoryFullName, path, branch = "main") => {
    if (!repositoryFullName || !path || !isConnected) return;
    try {
      const scopeToUse =
        selectedScope === "project" ? "personal" : selectedScope;
      const scopeIdToUse =
        selectedScope === "project" ? undefined : effectiveScopeId;
      const { file } = await connectorService.getFileContent(
        scopeToUse,
        scopeIdToUse,
        repositoryFullName,
        path,
        branch
      );
      setFileContent(file);
      setSelectedFile(path);
      setShowFileModal(true);
    } catch (error) {
      console.error("Error loading file content:", error);
      toast.error(error.error || "Failed to load file content");
    }
  };

  const loadReleases = async (repositoryFullName) => {
    if (!repositoryFullName || !isConnected) return;
    try {
      const scopeToUse =
        selectedScope === "project" ? "personal" : selectedScope;
      const scopeIdToUse =
        selectedScope === "project" ? undefined : effectiveScopeId;
      const { releases: releasesData } = await connectorService.getReleases(
        scopeToUse,
        scopeIdToUse,
        repositoryFullName
      );
      setReleases(releasesData || []);
    } catch (error) {
      console.error("Error loading releases:", error);
      toast.error(error.error || "Failed to load releases");
    }
  };

  const handleSearch = async (query, type = "code") => {
    if (!query || !selectedRepoForDetails || !isConnected) {
      toast.error("Please select a repository and enter a search query");
      return;
    }
    try {
      setSearchLoading(true);
      const scopeToUse =
        selectedScope === "project" ? "personal" : selectedScope;
      const scopeIdToUse =
        selectedScope === "project" ? undefined : effectiveScopeId;
      const { results } = await connectorService.searchRepository(
        scopeToUse,
        scopeIdToUse,
        selectedRepoForDetails,
        query,
        type
      );
      setSearchResults(results || []);
    } catch (error) {
      console.error("Error searching repository:", error);
      toast.error(error.error || "Failed to search repository");
    } finally {
      setSearchLoading(false);
    }
  };

  // Load data when repository is selected for details
  useEffect(() => {
    if (selectedRepoForDetails && isConnected) {
      if (activeTab === "statistics") {
        loadRepositoryStatistics(selectedRepoForDetails);
      } else if (activeTab === "analytics") {
        loadActivityAnalytics(selectedRepoForDetails);
      } else if (activeTab === "commits") {
        loadCommitHistory(selectedRepoForDetails);
      } else if (activeTab === "team") {
        loadTeamInsights(selectedRepoForDetails);
      } else if (activeTab === "security") {
        loadSecurityAlerts(selectedRepoForDetails);
      } else if (activeTab === "workflows") {
        loadWorkflowRuns(selectedRepoForDetails);
      } else if (activeTab === "webhooks") {
        loadWebhooks(selectedRepoForDetails);
      } else if (activeTab === "files") {
        loadBranches(selectedRepoForDetails);
        loadFileTree(selectedRepoForDetails, "", selectedBranch);
      } else if (activeTab === "releases") {
        loadReleases(selectedRepoForDetails);
      }
    }
  }, [selectedRepoForDetails, activeTab, isConnected, selectedBranch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === "settings" && isConnected) {
      loadNotificationRules();
    }
  }, [activeTab, isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const pullRequests = activity.filter(
      (item) => item.type === "github_pull_request"
    ).length;
    const commits = activity.filter(
      (item) => item.type === "github_commit"
    ).length;
    const issues = activity.filter(
      (item) => item.type === "github_issue"
    ).length;

    return [
      {
        label: "Linked Repositories",
        value: linkedRepositories.length,
        icon: GitBranch,
        color: "text-purple-400",
      },
      {
        label: "Pull Requests",
        value: pullRequests,
        icon: GitPullRequest,
        color: "text-green-400",
      },
      {
        label: "Commits",
        value: commits,
        icon: GitCommit,
        color: "text-blue-400",
      },
      {
        label: "Issues",
        value: issues,
        icon: AlertTriangle,
        color: "text-orange-400",
      },
    ];
  }, [linkedRepositories.length, activity]);

  const scopeBadge = useMemo(() => {
    if (selectedScope === "personal") return "Personal";
    if (selectedScope === "project")
      return (
        projects.find((p) => p._id === selectedProjectId)?.name || "Project"
      );
    return "GitHub";
  }, [selectedScope, selectedProjectId, projects]);

  const renderActivityIcon = (type) => {
    switch (type) {
      case "github_pull_request":
        return <GitPullRequest className="w-4 h-4 text-green-400" />;
      case "github_commit":
      case "github_push":
        return <GitCommit className="w-4 h-4 text-blue-400" />;
      case "github_issue":
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default:
        return <Activity className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <IntegrationLayout>
      <div className="w-full h-full p-4" style={{ backgroundColor: "#0a0a0b" }}>
        <Motion.button
          onClick={() => navigate("/connectors")}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white mb-4 transition-colors duration-200"
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Back to Integrations</span>
        </Motion.button>

        <Motion.div
          className="mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-800 rounded-xl">
                <FaGithub className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-white">GitHub</h1>
                  <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-300">
                    {scopeBadge}
                  </span>
                </div>
                <p className="text-gray-400 text-xs">
                  Connect repositories, monitor pull requests, commits, and
                  issues.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                      isConnected
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected
                          ? "bg-green-400 animate-pulse"
                          : "bg-gray-500"
                      }`}
                    />
                    <span className="text-xs font-medium">
                      {isConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  {connector?.metadata?.connectedAt && (
                    <span className="text-xs text-gray-500">
                      Connected{" "}
                      {formatRelativeTime(connector.metadata.connectedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                {scopeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = selectedScope === option.id;
                  return (
                    <button
                      key={option.id}
                      disabled={option.disabled}
                      onClick={() => {
                        setSelectedScope(option.id);
                        if (option.id === "personal") {
                          setSelectedProjectId("");
                        }
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
                        isActive
                          ? "bg-purple-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      } ${
                        option.disabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {selectedScope === "project" && (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select project</option>
                  {projects?.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center gap-2">
                {selectedScope === "project" && !isConnected && (
                  <div className="text-xs text-gray-400 px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
                    Connect your personal GitHub account first
                  </div>
                )}
                {selectedScope !== "project" && (
                  <Motion.button
                    onClick={isConnected ? handleDisconnect : handleConnect}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isConnected
                        ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                        : "bg-purple-600 text-white hover:bg-purple-500"
                    }`}
                    whileTap={{ scale: 0.97 }}
                  >
                    {isConnected ? (
                      <>
                        <Unlink className="w-4 h-4" />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4" />
                        Connect
                      </>
                    )}
                  </Motion.button>
                )}
                {isConnected && (
                  <Motion.button
                    onClick={() =>
                      connectorService
                        .getGitHubRepositories(selectedScope, effectiveScopeId)
                        .then(loadRepositories)
                    }
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-700 text-gray-300 hover:bg-gray-800"
                    whileTap={{ scale: 0.97 }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Motion.button>
                )}
              </div>
            </div>
          </div>
        </Motion.div>

        {isConnected && (
          <Motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Motion.div
                  key={stat.label}
                  className="bg-[#0d0d0e] border border-[#1f2937] rounded-xl p-4 hover:border-[#4338ca] transition-colors duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs mb-1 uppercase tracking-wide">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-semibold text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/50">
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </Motion.div>
              );
            })}
          </Motion.div>
        )}

        {/* Tab Navigation */}
        {isConnected && (
          <Motion.div
            className="mb-6 border-b border-gray-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex flex-wrap items-center gap-1 pb-1">
              {[
                { id: "overview", label: "Overview", icon: Activity },
                { id: "statistics", label: "Statistics", icon: BarChart3 },
                { id: "analytics", label: "Analytics", icon: TrendingUp },
                { id: "commits", label: "Commits", icon: GitCommit },
                { id: "team", label: "Team", icon: Users },
                { id: "security", label: "Security", icon: Shield },
                { id: "workflows", label: "Workflows", icon: Code },
                { id: "webhooks", label: "Webhooks", icon: LinkIcon },
                { id: "files", label: "Files", icon: FileCode },
                { id: "releases", label: "Releases", icon: Tag },
                { id: "search", label: "Search", icon: Search },
                { id: "settings", label: "Settings", icon: Layers },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      isActive
                        ? "text-purple-400 border-purple-400"
                        : "text-gray-400 border-transparent hover:text-gray-300"
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Motion.div>
        )}

        {loadingConnector ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                  {!isConnected && selectedScope !== "project" && (
                    <Motion.div
                      className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <h2 className="text-lg font-semibold text-white mb-4">
                        Why connect GitHub?
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/40">
                          <Sparkles className="w-5 h-5 text-purple-400 mb-3" />
                          <h3 className="text-sm font-semibold text-white mb-1">
                            Unified Productivity
                          </h3>
                          <p className="text-xs text-gray-400">
                            Bring pull requests, commits, and issues into your
                            project inbox automatically with priority tagging.
                          </p>
                        </div>
                        <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/40">
                          <Users className="w-5 h-5 text-blue-400 mb-3" />
                          <h3 className="text-sm font-semibold text-white mb-1">
                            Role-aware Notifications
                          </h3>
                          <p className="text-xs text-gray-400">
                            Workspace owners and project admins receive
                            high-priority alerts for PRs and issues, while
                            members stay updated on commits.
                          </p>
                        </div>
                        <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/40">
                          <Globe className="w-5 h-5 text-green-400 mb-3" />
                          <h3 className="text-sm font-semibold text-white mb-1">
                            Inbox Enhancements
                          </h3>
                          <p className="text-xs text-gray-400">
                            GitHub events appear in the Overview inbox alongside
                            tasks, Google events, and project updates with rich
                            metadata.
                          </p>
                        </div>
                        <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/40">
                          <Shield className="w-5 h-5 text-red-400 mb-3" />
                          <h3 className="text-sm font-semibold text-white mb-1">
                            Secure & Scoped
                          </h3>
                          <p className="text-xs text-gray-400">
                            Link repositories per workspace or project with
                            fine-grained permissions and automatic email
                            summaries.
                          </p>
                        </div>
                      </div>
                    </Motion.div>
                  )}

                  {selectedScope === "project" && !isConnected && (
                    <Motion.div
                      className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                          <Info className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-lg font-semibold text-white mb-2">
                            Link Repository from Personal GitHub
                          </h2>
                          <p className="text-sm text-gray-400 mb-4">
                            To link a repository to this project, you need to
                            connect your personal GitHub account first. Project
                            repositories are linked from your personal GitHub
                            account, not a separate project account.
                          </p>
                          <Motion.button
                            onClick={() => {
                              setSelectedScope("personal");
                              setSelectedProjectId("");
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-sm font-medium"
                            whileTap={{ scale: 0.97 }}
                          >
                            <LinkIcon className="w-4 h-4" />
                            Go to Personal GitHub Connection
                          </Motion.button>
                        </div>
                      </div>
                    </Motion.div>
                  )}

                  {isConnected && (
                    <>
                      {selectedScope === "personal" && (
                        <Motion.div
                          className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6 space-y-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">
                              Your GitHub Repositories
                            </h2>
                            <Motion.button
                              onClick={loadRepositories}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-700 text-gray-300 hover:bg-gray-800"
                              whileTap={{ scale: 0.97 }}
                            >
                              <RefreshCw className="w-4 h-4" />
                              Refresh
                            </Motion.button>
                          </div>
                          {availableRepositories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <GitBranch className="w-8 h-8 text-gray-600 mb-3" />
                              <p className="text-sm text-gray-400 mb-2">
                                No repositories found
                              </p>
                              <p className="text-xs text-gray-500">
                                Make sure you have repositories in your GitHub
                                account.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {availableRepositories
                                .slice(0, 12)
                                .map((repo) => (
                                  <div
                                    key={repo.id}
                                    className="border border-gray-800 bg-gray-900/40 rounded-lg p-4 hover:border-gray-700 transition-colors"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Code className="w-4 h-4 text-purple-400" />
                                        <a
                                          href={repo.html_url || repo.htmlUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm font-semibold text-white hover:text-purple-400"
                                        >
                                          {repo.full_name || repo.fullName}
                                        </a>
                                      </div>
                                      {repo.private ? (
                                        <Shield className="w-3.5 h-3.5 text-gray-500" />
                                      ) : (
                                        <Globe className="w-3.5 h-3.5 text-gray-500" />
                                      )}
                                    </div>
                                    {repo.description && (
                                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                                        {repo.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      {repo.language && (
                                        <span className="flex items-center gap-1">
                                          <Code className="w-3 h-3" />
                                          {repo.language}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <GitBranch className="w-3 h-3" />
                                        {repo.default_branch || "main"}
                                      </span>
                                      {repo.stargazers_count > 0 && (
                                        <span className="flex items-center gap-1">
                                          <Star className="w-3 h-3" />
                                          {repo.stargazers_count}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </Motion.div>
                      )}

                      {selectedScope === "project" && (
                        <Motion.div
                          className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6 space-y-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">
                              Linked repositories
                            </h2>
                            <Filter className="w-4 h-4 text-gray-500" />
                          </div>

                          {linkedRepositories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <GitBranch className="w-8 h-8 text-gray-600 mb-3" />
                              <p className="text-sm text-gray-400 mb-2">
                                No repositories linked yet
                              </p>
                              <p className="text-xs text-gray-500">
                                Link a repository to start receiving activity
                                updates.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {linkedRepositories.map((resource) => (
                                <div
                                  key={`${resource.repositoryFullName}-${
                                    resource.workspace || "personal"
                                  }-${resource.project || "default"}`}
                                  className="border border-gray-800 bg-gray-900/40 rounded-lg p-4"
                                >
                                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <Code className="w-4 h-4 text-purple-400" />
                                        <p className="text-sm font-semibold text-white">
                                          {resource.repositoryFullName}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                          <GitBranch className="w-3.5 h-3.5" />
                                          {resource.defaultBranch || "main"}
                                        </span>
                                        {resource.visibility && (
                                          <span className="flex items-center gap-1">
                                            <Shield className="w-3.5 h-3.5" />
                                            {resource.visibility}
                                          </span>
                                        )}
                                        {resource.project && (
                                          <span className="flex items-center gap-1">
                                            <Layers className="w-3.5 h-3.5" />
                                            Project scoped
                                          </span>
                                        )}
                                        {resource.lastSyncedAt && (
                                          <span className="flex items-center gap-1">
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            Synced{" "}
                                            {formatRelativeTime(
                                              resource.lastSyncedAt
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Motion.button
                                        onClick={() =>
                                          handleSyncRepository(resource)
                                        }
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800"
                                        whileTap={{ scale: 0.97 }}
                                        disabled={syncInFlight}
                                      >
                                        {syncInFlight ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <RefreshCw className="w-3.5 h-3.5" />
                                        )}
                                        Sync
                                      </Motion.button>
                                      <Motion.button
                                        onClick={() =>
                                          handleUnlinkRepository(resource)
                                        }
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                        whileTap={{ scale: 0.97 }}
                                      >
                                        <Unlink className="w-3.5 h-3.5" />
                                        Unlink
                                      </Motion.button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Motion.div>
                      )}

                      {selectedScope === "project" && isConnected && (
                        <Motion.div
                          className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6 space-y-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-blue-400" />
                            <p className="text-xs text-gray-400">
                              Selecting from your personal GitHub account
                              repositories
                            </p>
                          </div>
                          <h2 className="text-lg font-semibold text-white">
                            {linkedRepositories.length === 0
                              ? "Select repository for this project"
                              : "Link repository to project"}
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                            <div className="md:col-span-2">
                              <select
                                value={selectedRepositoryId}
                                onChange={(e) =>
                                  setSelectedRepositoryId(e.target.value)
                                }
                                className="w-full bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                                disabled={availableRepositories.length === 0}
                              >
                                <option value="">
                                  {availableRepositories.length === 0
                                    ? "No repositories available"
                                    : "Select a repository"}
                                </option>
                                {availableRepositories.map((repo) => (
                                  <option key={repo.id} value={repo.id}>
                                    {repo.full_name || repo.fullName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <Motion.button
                              onClick={handleLinkRepository}
                              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              whileTap={{ scale: 0.97 }}
                              disabled={
                                linkInFlight ||
                                !selectedRepositoryId ||
                                availableRepositories.length === 0
                              }
                            >
                              {linkInFlight ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <LinkIcon className="w-4 h-4" />
                              )}
                              Link repository
                            </Motion.button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Repositories are selected from your personal GitHub
                            account. Each project can only have one linked
                            repository. Linking will send notifications to
                            project admins.
                          </p>
                        </Motion.div>
                      )}
                      <Motion.div
                        className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                          <div className="flex-1">
                            <h2 className="text-lg font-semibold text-white">
                              {selectedScope === "personal"
                                ? "Recent GitHub Activity"
                                : "Recent GitHub activity"}
                            </h2>
                            <p className="text-xs text-gray-500">
                              {selectedScope === "personal"
                                ? "Your recent pull requests, commits, and issues."
                                : "Pull requests, commits, and issues automatically flow into your inbox."}
                            </p>
                          </div>
                          {selectedRepoForDetails && (
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                  type="text"
                                  value={searchQuery}
                                  onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                  }
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      handleSearch(searchQuery);
                                    }
                                  }}
                                  placeholder="Search code..."
                                  className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 w-64"
                                />
                              </div>
                              {searchQuery && (
                                <Motion.button
                                  onClick={() => handleSearch(searchQuery)}
                                  disabled={searchLoading}
                                  className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 text-sm disabled:opacity-50"
                                  whileTap={{ scale: 0.97 }}
                                >
                                  {searchLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    "Search"
                                  )}
                                </Motion.button>
                              )}
                            </div>
                          )}
                          {selectedScope === "project" && (
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedActivityRepo}
                                onChange={(e) =>
                                  setSelectedActivityRepo(e.target.value)
                                }
                                className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                              >
                                <option value="">
                                  All linked repositories
                                </option>
                                {linkedRepositories.map((resource) => (
                                  <option
                                    key={`${resource.repositoryFullName}-${
                                      resource.workspace || "personal"
                                    }-${resource.project || "default"}`}
                                    value={resource.repositoryFullName}
                                  >
                                    {resource.repositoryFullName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {selectedScope === "personal" && (
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedActivityRepo}
                                onChange={(e) =>
                                  setSelectedActivityRepo(e.target.value)
                                }
                                className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                              >
                                <option value="">All repositories</option>
                                {availableRepositories.map((repo) => (
                                  <option
                                    key={repo.id}
                                    value={repo.full_name || repo.fullName}
                                  >
                                    {repo.full_name || repo.fullName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {activity.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Activity className="w-8 h-8 text-gray-600 mb-3" />
                            <p className="text-sm text-gray-400 mb-2">
                              No recent activity yet
                            </p>
                            <p className="text-xs text-gray-500">
                              Sync a repository to populate pull requests,
                              commits, and issues here.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {activity.map((item) => (
                              <div
                                key={
                                  item._id ||
                                  `${item.externalId}-${item.createdAt}`
                                }
                                className="border border-gray-800 bg-gray-900/40 rounded-lg p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-800 rounded-lg">
                                      {renderActivityIcon(item.type)}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h3
                                          className="text-sm font-semibold text-white cursor-pointer hover:text-purple-400"
                                          onClick={() => {
                                            if (
                                              item.type ===
                                                "github_pull_request" &&
                                              item.metadata?.number
                                            ) {
                                              handleViewPR(
                                                item.metadata.number
                                              );
                                            } else if (
                                              item.type === "github_issue" &&
                                              item.metadata?.number
                                            ) {
                                              handleViewIssue(
                                                item.metadata.number
                                              );
                                            }
                                          }}
                                        >
                                          {item.title ||
                                            GITHUB_NOTIFICATION_LABEL[
                                              item.type
                                            ] ||
                                            "GitHub Update"}
                                        </h3>
                                        <span
                                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                                            PRIORITY_COLOR_MAP[
                                              item.priority || "normal"
                                            ]
                                          }`}
                                        >
                                          {item.priority || "normal"}
                                        </span>
                                        {(item.type === "github_pull_request" ||
                                          item.type === "github_issue") &&
                                          item.metadata?.number && (
                                            <span className="text-xs text-gray-500">
                                              #{item.metadata.number}
                                            </span>
                                          )}
                                      </div>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {item.message}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-gray-500">
                                        {item.metadata?.repository && (
                                          <span className="flex items-center gap-1">
                                            <Code className="w-3 h-3" />
                                            {item.metadata.repository}
                                          </span>
                                        )}
                                        {item.metadata?.actor && (
                                          <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {item.metadata.actor}
                                          </span>
                                        )}
                                        {item.metadata?.branch && (
                                          <span className="flex items-center gap-1">
                                            <GitBranch className="w-3 h-3" />
                                            {item.metadata.branch}
                                          </span>
                                        )}
                                        <span>
                                          {formatRelativeTime(item.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {item.link && (
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-purple-400 hover:text-purple-300"
                                    >
                                      View on GitHub →
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Motion.div>
                      {syncSummary && (
                        <Motion.div
                          className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <h2 className="text-lg font-semibold text-white mb-2">
                            Last sync summary
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-300">
                            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3">
                              <p className="text-xs text-gray-500">
                                Pull Requests
                              </p>
                              <p className="text-lg font-semibold text-white">
                                {syncSummary.newPullRequests || 0}
                              </p>
                            </div>
                            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3">
                              <p className="text-xs text-gray-500">Commits</p>
                              <p className="text-lg font-semibold text-white">
                                {syncSummary.newCommits || 0}
                              </p>
                            </div>
                            <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-3">
                              <p className="text-xs text-gray-500">Issues</p>
                              <p className="text-lg font-semibold text-white">
                                {syncSummary.newIssues || 0}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-3">
                            Synced {formatRelativeTime(syncSummary.syncedAt)} •{" "}
                            {syncSummary.notificationsCreated || 0}{" "}
                            notifications delivered
                          </p>
                        </Motion.div>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-6">
                  {connector && (
                    <Motion.div
                      className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6 space-y-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Connection info
                      </h2>
                      <div className="grid grid-cols-1 text-sm gap-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            GitHub Account
                          </p>
                          <p className="text-gray-200">
                            {connector.metadata?.userInfo?.username ||
                              connector.config?.username ||
                              "Unknown"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Connected by
                          </p>
                          <p className="text-gray-200">
                            {connector.metadata?.userInfo?.name ||
                              connector.metadata?.userInfo?.email ||
                              user?.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <p className="text-green-400">Active</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Last synced
                          </p>
                          <p className="text-gray-200">
                            {connector.metadata?.lastSync
                              ? `${formatRelativeTime(
                                  connector.metadata.lastSync
                                )}`
                              : "Never"}
                          </p>
                        </div>
                      </div>
                    </Motion.div>
                  )}

                  <Motion.div
                    className="bg-[#0d0d0e] border border-gray-800 rounded-xl overflow-hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <button
                      onClick={() => setShowInfoDropdown(!showInfoDropdown)}
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-900/50 transition-colors"
                    >
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Permissions & Tips
                      </h2>
                      {showInfoDropdown ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {showInfoDropdown && (
                      <div className="px-6 pb-6 space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-3">
                            Permission rules
                          </h3>
                          <div className="space-y-3">
                            <div className="border border-gray-800 bg-gray-900/40 rounded-lg p-3">
                              <h4 className="text-xs font-semibold text-white mb-1">
                                Workspace integrations
                              </h4>
                              <p className="text-xs text-gray-400">
                                Only workspace owners and admins can link
                                repositories. Notifications are sent to
                                owners/admins for PRs and issues, while
                                employees receive commit updates.
                              </p>
                            </div>
                            <div className="border border-gray-800 bg-gray-900/40 rounded-lg p-3">
                              <h4 className="text-xs font-semibold text-white mb-1">
                                Project integrations
                              </h4>
                              <p className="text-xs text-gray-400">
                                Project admins can link repositories. GitHub
                                activity appears in the Overview inbox based on
                                membership roles. Each project can only have one
                                linked repository.
                              </p>
                            </div>
                            <div className="border border-gray-800 bg-gray-900/40 rounded-lg p-3">
                              <h4 className="text-xs font-semibold text-white mb-1">
                                Email digests
                              </h4>
                              <p className="text-xs text-gray-400">
                                Each event triggers emails to configured
                                recipients using their notification preferences.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-3">
                            Tips
                          </h3>
                          <ul className="space-y-2 text-xs text-gray-400">
                            <li>
                              • Link repositories per project to route
                              notifications directly to project admins.
                            </li>
                            <li>
                              • Use the Overview inbox filters to highlight
                              GitHub activity by priority.
                            </li>
                            <li>
                              • Combine Google Calendar and GitHub notifications
                              to keep deadlines aligned with code activity.
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </Motion.div>
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === "statistics" && isConnected && (
              <StatisticsTab
                repositories={
                  selectedScope === "personal"
                    ? availableRepositories
                    : linkedRepositories
                }
                selectedRepo={selectedRepoForDetails}
                onSelectRepo={setSelectedRepoForDetails}
                statistics={repositoryStatistics}
                loading={loadingStats}
                onLoad={loadRepositoryStatistics}
                scope={selectedScope}
              />
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && isConnected && (
              <AnalyticsTab
                repositories={
                  selectedScope === "personal"
                    ? availableRepositories
                    : linkedRepositories
                }
                selectedRepo={selectedRepoForDetails}
                onSelectRepo={setSelectedRepoForDetails}
                analytics={activityAnalytics}
                loading={loadingAnalytics}
                onLoad={loadActivityAnalytics}
                scope={selectedScope}
              />
            )}

            {/* Commits Tab */}
            {activeTab === "commits" && isConnected && (
              <CommitsTab
                repositories={
                  selectedScope === "personal"
                    ? availableRepositories
                    : linkedRepositories
                }
                selectedRepo={selectedRepoForDetails}
                onSelectRepo={setSelectedRepoForDetails}
                commits={commitHistory}
                onLoad={loadCommitHistory}
                scope={selectedScope}
              />
            )}

            {/* Team Tab */}
            {activeTab === "team" && isConnected && (
              <TeamTab
                repositories={
                  selectedScope === "personal"
                    ? availableRepositories
                    : linkedRepositories
                }
                selectedRepo={selectedRepoForDetails}
                onSelectRepo={setSelectedRepoForDetails}
                insights={teamInsights}
                onLoad={loadTeamInsights}
                scope={selectedScope}
              />
            )}

            {/* Security Tab */}
            {activeTab === "security" && isConnected && (
              <SecurityTab
                repositories={
                  selectedScope === "personal"
                    ? availableRepositories
                    : linkedRepositories
                }
                selectedRepo={selectedRepoForDetails}
                onSelectRepo={setSelectedRepoForDetails}
                security={securityAlerts}
                onLoad={loadSecurityAlerts}
                scope={selectedScope}
              />
            )}

            {/* Workflows Tab */}
            {activeTab === "workflows" && isConnected && (
              <WorkflowsTab
                repositories={
                  selectedScope === "personal"
                    ? availableRepositories
                    : linkedRepositories
                }
                selectedRepo={selectedRepoForDetails}
                onSelectRepo={setSelectedRepoForDetails}
                workflowData={workflowRuns}
                onLoad={loadWorkflowRuns}
                scope={selectedScope}
              />
            )}

            {/* Webhooks Tab */}
            {activeTab === "webhooks" && isConnected && (
              <WebhooksTab
                repositories={
                  selectedScope === "personal"
                    ? availableRepositories
                    : linkedRepositories
                }
                selectedRepo={selectedRepoForDetails}
                onSelectRepo={setSelectedRepoForDetails}
                webhooks={webhooks}
                onLoad={loadWebhooks}
                onSetup={connectorService.setupWebhook}
                onDelete={connectorService.deleteWebhook}
                scope={selectedScope}
                scopeId={effectiveScopeId}
              />
            )}

            {/* Files Tab */}
            {activeTab === "files" && isConnected && (
              <FilesTab
                repositories={
                  selectedScope === "personal"
                    ? availableRepositories
                    : linkedRepositories
                }
                selectedRepo={selectedRepoForDetails}
                onSelectRepo={setSelectedRepoForDetails}
                fileTree={fileTree}
                branches={branches}
                selectedBranch={selectedBranch}
                onSelectBranch={setSelectedBranch}
                onLoadTree={loadFileTree}
                onLoadBranches={loadBranches}
                onLoadFile={loadFileContent}
                scope={selectedScope}
                scopeId={effectiveScopeId}
              />
            )}

            {/* Releases Tab */}
            {activeTab === "releases" && isConnected && (
              <ReleasesTab
                repositories={
                  selectedScope === "personal"
                    ? availableRepositories
                    : linkedRepositories
                }
                selectedRepo={selectedRepoForDetails}
                onSelectRepo={setSelectedRepoForDetails}
                releases={releases}
                onLoad={loadReleases}
                scope={selectedScope}
              />
            )}

            {/* Search Tab */}
            {activeTab === "search" && isConnected && (
              <SearchTab
                repositories={
                  selectedScope === "personal"
                    ? availableRepositories
                    : linkedRepositories
                }
                selectedRepo={selectedRepoForDetails}
                onSelectRepo={setSelectedRepoForDetails}
                searchResults={searchResults}
                searchLoading={searchLoading}
                onSearch={handleSearch}
                scope={selectedScope}
              />
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && isConnected && (
              <SettingsTab
                notificationRules={notificationRules}
                onLoad={loadNotificationRules}
                onCreate={connectorService.createNotificationRule}
                onUpdate={connectorService.updateNotificationRule}
                onDelete={connectorService.deleteNotificationRule}
                scope={selectedScope}
                scopeId={effectiveScopeId}
                connector={connector}
                onSyncIssues={connectorService.syncIssuesToTasks}
                projects={projects}
              />
            )}
          </>
        )}

        {/* PR Detail Modal */}
        {showPRModal && selectedPR && (
          <PRDetailModal
            pr={selectedPR}
            onClose={() => {
              setShowPRModal(false);
              setSelectedPR(null);
            }}
            onViewIssue={handleViewIssue}
          />
        )}

        {/* Issue Detail Modal */}
        {showIssueModal && selectedIssue && (
          <IssueDetailModal
            issue={selectedIssue}
            onClose={() => {
              setShowIssueModal(false);
              setSelectedIssue(null);
            }}
            onViewPR={handleViewPR}
          />
        )}

        {/* File Content Modal */}
        {showFileModal && fileContent && selectedFile && (
          <FileContentModal
            file={fileContent}
            path={selectedFile}
            onClose={() => {
              setShowFileModal(false);
              setSelectedFile(null);
              setFileContent(null);
            }}
          />
        )}
      </div>
    </IntegrationLayout>
  );
};

export default GitHubPage;
