import ProjectTemplate from "../models/projectTemplate.js";

const defaultTemplates = [
  {
    name: "Agile Sprint Board",
    key: "AGILE_SPRINT",
    description: "Manage agile sprints with user stories, tasks, and sprint planning",
    category: "software",
    icon: "Zap",
    color: "#3b82f6",
    isGlobal: true,
    defaultColumns: [
      { name: "To Do", position: 0, color: "#64748b" },
      { name: "In Progress", position: 1, color: "#3b82f6", limit: 5 },
      { name: "Review", position: 2, color: "#f59e0b" },
      { name: "Done", position: 3, color: "#10b981" },
    ],
    defaultTasks: [
      {
        title: "Sprint Planning Meeting",
        description: "Plan the upcoming sprint and assign tasks",
        columnIndex: 0,
        priority: "high",
        position: 0,
      },
      {
        title: "Setup Sprint Board",
        description: "Configure your sprint board and add team members",
        columnIndex: 0,
        priority: "medium",
        position: 1,
      },
    ],
  },
  {
    name: "Bug Tracking",
    key: "BUG_TRACKING",
    description: "Track and resolve bugs efficiently with proper workflow",
    category: "software",
    icon: "Bug",
    color: "#ef4444",
    isGlobal: true,
    defaultColumns: [
      { name: "New", position: 0, color: "#64748b" },
      { name: "Assigned", position: 1, color: "#f59e0b" },
      { name: "In Progress", position: 2, color: "#3b82f6" },
      { name: "Testing", position: 3, color: "#8b5cf6" },
      { name: "Fixed", position: 4, color: "#10b981" },
    ],
    defaultTasks: [
      {
        title: "Setup Bug Tracking System",
        description: "Configure bug severity levels and assignees",
        columnIndex: 0,
        priority: "high",
        position: 0,
      },
    ],
  },
  {
    name: "Marketing Campaign",
    key: "MARKETING",
    description: "Plan and execute marketing campaigns from ideation to launch",
    category: "marketing",
    icon: "Megaphone",
    color: "#f59e0b",
    isGlobal: true,
    defaultColumns: [
      { name: "Planning", position: 0, color: "#64748b" },
      { name: "Designing", position: 1, color: "#8b5cf6" },
      { name: "Launching", position: 2, color: "#3b82f6" },
      { name: "Review", position: 3, color: "#10b981" },
    ],
    defaultTasks: [
      {
        title: "Define Campaign Goals",
        description: "Set clear objectives and KPIs for the campaign",
        columnIndex: 0,
        priority: "high",
        position: 0,
      },
      {
        title: "Identify Target Audience",
        description: "Research and define your target market",
        columnIndex: 0,
        priority: "high",
        position: 1,
      },
      {
        title: "Create Content Calendar",
        description: "Plan content posting schedule",
        columnIndex: 0,
        priority: "medium",
        position: 2,
      },
    ],
  },
  {
    name: "Product Roadmap",
    key: "PRODUCT_ROADMAP",
    description: "Plan and track product features from backlog to release",
    category: "product",
    icon: "Map",
    color: "#8b5cf6",
    isGlobal: true,
    defaultColumns: [
      { name: "Backlog", position: 0, color: "#64748b" },
      { name: "Upcoming", position: 1, color: "#f59e0b" },
      { name: "In Progress", position: 2, color: "#3b82f6" },
      { name: "Released", position: 3, color: "#10b981" },
    ],
    defaultTasks: [
      {
        title: "Product Vision Document",
        description: "Define product vision and long-term goals",
        columnIndex: 0,
        priority: "high",
        position: 0,
      },
      {
        title: "User Research",
        description: "Gather insights from users and stakeholders",
        columnIndex: 0,
        priority: "high",
        position: 1,
      },
    ],
  },
  {
    name: "Content Creation",
    key: "CONTENT_CREATION",
    description: "Manage content from ideation to publication",
    category: "content",
    icon: "PenTool",
    color: "#06b6d4",
    isGlobal: true,
    defaultColumns: [
      { name: "Ideas", position: 0, color: "#64748b" },
      { name: "Writing", position: 1, color: "#3b82f6" },
      { name: "Editing", position: 2, color: "#f59e0b" },
      { name: "Published", position: 3, color: "#10b981" },
    ],
    defaultTasks: [
      {
        title: "Content Strategy Meeting",
        description: "Define content themes and topics",
        columnIndex: 0,
        priority: "high",
        position: 0,
      },
      {
        title: "SEO Keyword Research",
        description: "Research keywords for better discoverability",
        columnIndex: 0,
        priority: "medium",
        position: 1,
      },
    ],
  },
  {
    name: "Design Sprint",
    key: "DESIGN_SPRINT",
    description: "5-day process for answering critical business questions through design",
    category: "design",
    icon: "Palette",
    color: "#ec4899",
    isGlobal: true,
    defaultColumns: [
      { name: "Research", position: 0, color: "#64748b" },
      { name: "Ideation", position: 1, color: "#f59e0b" },
      { name: "Prototype", position: 2, color: "#3b82f6" },
      { name: "Test", position: 3, color: "#8b5cf6" },
      { name: "Deliver", position: 4, color: "#10b981" },
    ],
    defaultTasks: [
      {
        title: "User Research & Insights",
        description: "Gather user pain points and requirements",
        columnIndex: 0,
        priority: "high",
        position: 0,
      },
      {
        title: "Competitive Analysis",
        description: "Analyze competitor solutions",
        columnIndex: 0,
        priority: "medium",
        position: 1,
      },
    ],
  },
  {
    name: "HR Onboarding",
    key: "HR_ONBOARDING",
    description: "Streamline employee onboarding process",
    category: "hr",
    icon: "Users",
    color: "#10b981",
    isGlobal: true,
    defaultColumns: [
      { name: "Applicants", position: 0, color: "#64748b" },
      { name: "Shortlisted", position: 1, color: "#f59e0b" },
      { name: "Interview", position: 2, color: "#3b82f6" },
      { name: "Hired", position: 3, color: "#10b981" },
    ],
    defaultTasks: [
      {
        title: "Prepare Job Description",
        description: "Create detailed JD with requirements",
        columnIndex: 0,
        priority: "high",
        position: 0,
      },
      {
        title: "Setup Interview Process",
        description: "Define interview rounds and criteria",
        columnIndex: 0,
        priority: "high",
        position: 1,
      },
    ],
  },
  {
    name: "Client Project Tracker",
    key: "CLIENT_PROJECT",
    description: "Manage client projects with clear deliverable tracking",
    category: "operations",
    icon: "BarChart3",
    color: "#6366f1",
    isGlobal: true,
    defaultColumns: [
      { name: "Requirements", position: 0, color: "#64748b" },
      { name: "Development", position: 1, color: "#3b82f6" },
      { name: "Review", position: 2, color: "#f59e0b" },
      { name: "Delivery", position: 3, color: "#10b981" },
    ],
    defaultTasks: [
      {
        title: "Kickoff Meeting",
        description: "Initial meeting with client to gather requirements",
        columnIndex: 0,
        priority: "high",
        position: 0,
      },
      {
        title: "Project Scope Document",
        description: "Create detailed scope and timeline",
        columnIndex: 0,
        priority: "high",
        position: 1,
      },
    ],
  },
];

export const seedProjectTemplates = async () => {
  try {
    const existingCount = await ProjectTemplate.countDocuments({ isGlobal: true });
    
    if (existingCount > 0) {
      console.log(`✓ ${existingCount} project templates already exist`);
      return;
    }

    await ProjectTemplate.insertMany(defaultTemplates);
    console.log(`✓ Successfully seeded ${defaultTemplates.length} project templates`);
  } catch (error) {
    console.error("Error seeding project templates:", error);
  }
};

export default defaultTemplates;

