# TaskFlow Backend API

A comprehensive REST API for TaskFlow - an integrated project management, team chat, and documentation platform.

## Features

- **Workspace Management**: Create and manage workspaces with role-based permissions
- **Project Management**: Organize work into projects with boards and columns
- **Task Management**: Create, assign, and track tasks with subtasks and labels
- **Last Selected Items**: Automatically save and restore user's last selected workspace, project, task, board, and column
- **Real-time Chat**: Team communication with task-linked discussions
- **Documentation**: Notion-style collaborative documents
- **Client Portal**: External collaboration for clients
- **Analytics Dashboard**: Data insights and reporting
- **Integrations**: GitHub, Google Workspace, Figma, Slack, and more

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 5.0+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd taskflow-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   ```env
   DATABASE=mongodb://localhost:27017/taskflow
   JWT_SECRET=your-jwt-secret
   PORT=8000
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```

The API will be available at `http://localhost:8000`

## API Documentation

### Base URL

```
http://localhost:8000/api
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Last Selected Items Feature

The API automatically tracks and saves the user's last selected items to provide a seamless user experience. When a user reopens the application, their last selected workspace, project, task, board, and column are automatically restored.

### How It Works

1. **Automatic Tracking**: When a user accesses a workspace, project, task, board, or column, the API automatically updates their last selected items.

2. **Data Structure**: Each user has a `lastSelected` object in their profile containing:

   ```json
   {
     "workspace": {
       "id": "workspace_id",
       "name": "Workspace Name",
       "selectedAt": "2024-01-01T00:00:00.000Z"
     },
     "project": {
       "id": "project_id",
       "name": "Project Name",
       "workspaceId": "workspace_id",
       "selectedAt": "2024-01-01T00:00:00.000Z"
     },
     "task": {
       "id": "task_id",
       "title": "Task Title",
       "projectId": "project_id",
       "workspaceId": "workspace_id",
       "selectedAt": "2024-01-01T00:00:00.000Z"
     },
     "board": {
       "id": "board_id",
       "name": "Board Name",
       "projectId": "project_id",
       "selectedAt": "2024-01-01T00:00:00.000Z"
     },
     "column": {
       "id": "column_id",
       "name": "Column Name",
       "boardId": "board_id",
       "projectId": "project_id",
       "selectedAt": "2024-01-01T00:00:00.000Z"
     }
   }
   ```

3. **API Endpoint**: Get the user's last selected items:
   ```
   GET /api/last-selected
   ```

### Frontend Integration

To implement the last selected functionality in your frontend:

1. **On App Load**: Call the `/api/last-selected` endpoint to get the user's last selected items.

2. **Navigate to Last Selected**: Use the returned data to automatically navigate to the last selected workspace, project, task, etc.

3. **Update on Selection**: When a user selects a new workspace, project, or task, the API automatically updates their last selected items.

### Example Frontend Implementation

```javascript
// Get last selected items on app load
const getLastSelected = async () => {
  try {
    const response = await fetch("/api/last-selected", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();

    if (data.success) {
      const { workspace, project, task, board, column } = data.data;

      // Navigate to last selected items
      if (workspace) {
        navigateToWorkspace(workspace.id);
      }
      if (project) {
        navigateToProject(project.id);
      }
      if (task) {
        navigateToTask(task.id);
      }
    }
  } catch (error) {
    console.error("Error getting last selected items:", error);
  }
};

// Call on app initialization
useEffect(() => {
  getLastSelected();
}, []);
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Workspaces

- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces` - Get user workspaces
- `GET /api/workspaces/:id` - Get workspace details
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Archive workspace
- `GET /api/last-selected` - Get last selected items

### Projects

- `POST /api/workspaces/:id/projects` - Create project
- `GET /api/workspaces/:id/projects` - Get workspace projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Archive project

### Tasks

- `POST /api/projects/:id/tasks` - Create task
- `GET /api/projects/:id/tasks` - Get project tasks
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/status` - Update task status
- `PUT /api/tasks/:id/position` - Update task position
- `DELETE /api/tasks/:id` - Archive task

## Database Models

### User Model

The user model includes the `lastSelected` object for tracking last selected items:

```javascript
{
  // ... other user fields
  lastSelected: {
    workspace: {
      id: ObjectId,
      name: String,
      selectedAt: Date
    },
    project: {
      id: ObjectId,
      name: String,
      workspaceId: ObjectId,
      selectedAt: Date
    },
    task: {
      id: ObjectId,
      title: String,
      projectId: ObjectId,
      workspaceId: ObjectId,
      selectedAt: Date
    },
    board: {
      id: ObjectId,
      name: String,
      projectId: ObjectId,
      selectedAt: Date
    },
    column: {
      id: ObjectId,
      name: String,
      boardId: ObjectId,
      projectId: ObjectId,
      selectedAt: Date
    }
  }
}
```

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- workspace.test.js
```

### Test Coverage

The test suite covers:

- Authentication and authorization
- Workspace management
- Project management
- Task management
- Last selected items functionality
- Error handling
- Permission validation

## Development

### Project Structure

```
server/
├── controllers/     # Route handlers
├── models/         # Database models
├── routes/         # API routes
├── middlewares/    # Custom middlewares
├── utils/          # Utility functions
├── tests/          # Test files
└── postman/        # Postman collections
```

### Adding New Features

1. **Create Model**: Define the database schema in `models/`
2. **Create Controller**: Implement business logic in `controllers/`
3. **Create Routes**: Define API endpoints in `routes/`
4. **Add Middleware**: Implement authentication/authorization in `middlewares/`
5. **Write Tests**: Add comprehensive tests in `tests/`
6. **Update Documentation**: Update API documentation

### Code Style

- Use ES6+ features
- Follow RESTful API conventions
- Use async/await for asynchronous operations
- Implement proper error handling
- Add comprehensive JSDoc comments
- Write unit tests for all functions

## Deployment

### Environment Variables

```env
NODE_ENV=production
DATABASE=mongodb://localhost:27017/taskflow
JWT_SECRET=your-production-jwt-secret
PORT=8000
CLIENT_URL=https://your-frontend-domain.com
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use secure JWT secret
- [ ] Configure CORS for production domain
- [ ] Set up SSL/TLS
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure database backups
- [ ] Set up error tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Email: support@taskflow.com
- Documentation: [API Docs](https://docs.taskflow.com)

## Changelog

### v1.0.0

- Initial release
- Workspace management
- Project management
- Task management
- Last selected items functionality
- Authentication and authorization
- Comprehensive test suite
- API documentation
