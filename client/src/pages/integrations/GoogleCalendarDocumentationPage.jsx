import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import IntegrationLayout from "../../components/common-afterauth/IntegrationLayout";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  Zap,
  Shield,
  Users,
  Clock,
  Settings,
  RefreshCw,
} from "lucide-react";
import { SiGooglecalendar } from "react-icons/si";

const GoogleCalendarDocumentationPage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Zap,
      content: [
        {
          subtitle: "Step 1: Connect Your Account",
          description:
            "Click the 'Connect Google Calendar' button and authorize PlanCrest to access your Google Calendar.",
          steps: [
            "Navigate to the Google Calendar integration page",
            "Select your integration scope (Personal, Workspace, or Project)",
            "Click 'Connect Google Calendar'",
            "Sign in to your Google account",
            "Grant the necessary permissions",
          ],
        },
        {
          subtitle: "Step 2: Configure Sync Settings",
          description: "Choose how and when your calendars should sync",
          steps: [
            "Select sync direction (bidirectional, to Google, or from Google)",
            "Set your preferred sync frequency",
            "Configure advanced settings for past and future events",
            "Save your settings",
          ],
        },
      ],
    },
    {
      id: "features",
      title: "Key Features",
      icon: Calendar,
      content: [
        {
          subtitle: "Bidirectional Sync",
          description:
            "Events created in PlanCrest automatically appear in Google Calendar and vice versa.",
        },
        {
          subtitle: "Real-time Updates",
          description:
            "Changes are synced immediately, keeping all your calendars up to date.",
        },
        {
          subtitle: "Google Meet Integration",
          description:
            "Automatically create Google Meet links for meeting events.",
        },
        {
          subtitle: "Team Collaboration",
          description:
            "Share calendars with team members and see their availability.",
        },
      ],
    },
    {
      id: "permissions",
      title: "Required Permissions",
      icon: Shield,
      content: [
        {
          subtitle: "Calendar Access",
          description:
            "PlanCrest needs access to read and write your calendar events.",
          permissions: [
            "View and manage your calendar events",
            "Create new events",
            "Update existing events",
            "Delete events",
          ],
        },
        {
          subtitle: "Data Privacy",
          description:
            "Your calendar data is encrypted and never shared with third parties. We only use OAuth tokens which are stored securely.",
        },
      ],
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: AlertTriangle,
      content: [
        {
          subtitle: "Events Not Syncing",
          solutions: [
            "Check if your Google Calendar connection is active",
            "Verify sync settings and frequency",
            "Try manually syncing using the 'Sync Now' button",
            "Disconnect and reconnect your account",
            "Check your Google account permissions",
          ],
        },
        {
          subtitle: "Duplicate Events",
          solutions: [
            "Ensure you haven't connected multiple Google accounts",
            "Check sync direction settings",
            "Delete duplicate events and sync again",
          ],
        },
        {
          subtitle: "Permission Errors",
          solutions: [
            "Revoke PlanCrest access in your Google account settings",
            "Reconnect your Google Calendar",
            "Ensure all required permissions are granted",
          ],
        },
      ],
    },
    {
      id: "sync-settings",
      title: "Sync Settings Explained",
      icon: Settings,
      content: [
        {
          subtitle: "Sync Direction",
          options: [
            {
              name: "Bidirectional",
              description:
                "Events sync both ways - PlanCrest ↔ Google Calendar",
            },
            {
              name: "To Google",
              description:
                "Only PlanCrest events are synced to Google Calendar",
            },
            {
              name: "From Google",
              description:
                "Only Google Calendar events are imported to PlanCrest",
            },
          ],
        },
        {
          subtitle: "Sync Frequency",
          description:
            "Choose how often your calendars should sync automatically. More frequent syncing ensures better real-time updates but may use more resources.",
        },
      ],
    },
    {
      id: "best-practices",
      title: "Best Practices",
      icon: CheckCircle2,
      content: [
        {
          subtitle: "Tips for Optimal Sync",
          tips: [
            "Use bidirectional sync for seamless integration",
            "Set sync frequency to 15 minutes for real-time updates",
            "Enable both past and future events sync",
            "Regularly check sync status on the integration page",
            "Use consistent event naming across platforms",
          ],
        },
        {
          subtitle: "Team Collaboration",
          tips: [
            "Use workspace-level integration for team calendars",
            "Set up project-specific calendars for different teams",
            "Encourage team members to keep calendars updated",
            "Use color coding for different event types",
          ],
        },
      ],
    },
    {
      id: "faq",
      title: "Frequently Asked Questions",
      icon: Info,
      content: [
        {
          subtitle: "Can I connect multiple Google accounts?",
          description:
            "Yes! You can connect different Google accounts for personal, workspace, and project scopes.",
        },
        {
          subtitle: "Will syncing delete my existing events?",
          description:
            "No, syncing will never delete your events unless you explicitly delete them in either platform.",
        },
        {
          subtitle: "How far back does sync work?",
          description:
            "By default, we sync events from 30 days ago. You can enable 'Sync Past Events' for historical data.",
        },
        {
          subtitle: "Is there a sync limit?",
          description:
            "No hard limits, but we recommend keeping event counts reasonable for optimal performance.",
        },
      ],
    },
  ];

  return (
    <IntegrationLayout>
      <div className="w-full h-full p-6" style={{ backgroundColor: "#0a0a0b" }}>
        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/connectors/google-calendar")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors duration-200"
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Google Calendar</span>
        </motion.button>

        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <SiGooglecalendar className="w-10 h-10 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Google Calendar Integration
              </h1>
              <p className="text-gray-400">
                Complete guide to setting up and using Google Calendar with
                PlanCrest
              </p>
            </div>
          </div>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-bold text-white mb-4">
            Quick Navigation
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <motion.a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 p-3 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">{section.title}</span>
                </motion.a>
              );
            })}
          </div>
        </motion.div>

        {/* Documentation Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.id}
                id={section.id}
                className="bg-[#0d0d0e] border border-gray-800 rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-6">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex} className="space-y-3">
                      {item.subtitle && (
                        <h3 className="text-lg font-semibold text-white">
                          {item.subtitle}
                        </h3>
                      )}
                      {item.description && (
                        <p className="text-gray-400">{item.description}</p>
                      )}
                      {item.steps && (
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                          {item.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="text-gray-300">
                              {step}
                            </li>
                          ))}
                        </ol>
                      )}
                      {item.permissions && (
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          {item.permissions.map((permission, permIndex) => (
                            <li key={permIndex} className="text-gray-300">
                              {permission}
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.solutions && (
                        <ul className="space-y-2">
                          {item.solutions.map((solution, solIndex) => (
                            <li
                              key={solIndex}
                              className="flex items-start gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                              <span className="text-gray-300">{solution}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.tips && (
                        <ul className="space-y-2">
                          {item.tips.map((tip, tipIndex) => (
                            <li
                              key={tipIndex}
                              className="flex items-start gap-2"
                            >
                              <Zap className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                              <span className="text-gray-300">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.options && (
                        <div className="space-y-3">
                          {item.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className="p-3 bg-gray-900/50 rounded-lg border border-gray-800"
                            >
                              <h4 className="text-white font-medium mb-1">
                                {option.name}
                              </h4>
                              <p className="text-sm text-gray-400">
                                {option.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Support Contact */}
        <motion.div
          className="mt-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-xl font-bold text-white mb-3">Need More Help?</h3>
          <p className="text-gray-400 mb-4">
            If you're still having issues or have questions not covered here,
            our support team is here to help.
          </p>
          <div className="flex gap-3">
            <motion.button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Contact Support
            </motion.button>
            <motion.button
              onClick={() => navigate("/connectors/google-calendar")}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Back to Integration
            </motion.button>
          </div>
        </motion.div>
      </div>
    </IntegrationLayout>
  );
};

export default GoogleCalendarDocumentationPage;
