# InteliPlan

InteliPlan is an intelligent feature planning tool built on the Model Context Protocol (MCP). It helps developers create detailed feature plans, iterate on those plans with feedback, and manage the feature planning process.

## Features

- **Plan Feature**: Create a detailed plan for implementing a new feature with tasks and subtasks
- **Iterate on Plans**: Improve plans based on feedback and adjustments
- **Manage Plans**: List, view, and delete feature plans

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/inteliplan.git
   cd inteliplan
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   ```
   cp env.example .env
   ```
   Then edit the `.env` file as needed to configure your feature planning settings.

## Usage

### Build and Run

Build the TypeScript code:
```
npm run build
```

Start the server:
```
npm start
```

For development with auto-reload:
```
npm run dev
```

### Using the MCP Tools

InteliPlan exposes the following MCP tools:

1. `planFeature`: Create a new feature plan
   - Parameters: 
     - `featureName`: Name of the feature
     - `description`: Description of the feature
     - `complexity`: Low, medium, or high (optional)
     - `targetDate`: Target completion date (optional)
     - `technology`: Technologies to be used (optional)
     - `outputFormat`: json or markdown (optional)

2. `iterateFeaturePlan`: Iterate on an existing feature plan
   - Parameters:
     - `planId`: ID of the feature plan
     - `iterationNumber`: Current iteration number
     - `feedback`: Feedback on the current plan
     - `adjustments`: Tasks to add, remove, or modify (optional)

3. `getFeaturePlan`: Get a specific feature plan
   - Parameters:
     - `planId`: ID of the feature plan
     - `format`: Output format (optional)

4. `listFeaturePlans`: List all feature plans
   - Parameters:
     - `limit`: Maximum number of plans to return (optional)
     - `sort`: Sort order (newest, oldest, name) (optional)

5. `deleteFeaturePlan`: Delete a feature plan
   - Parameters:
     - `planId`: ID of the feature plan to delete

## Configuration

The following environment variables can be used to configure InteliPlan:

| Variable | Description | Default |
|----------|-------------|---------|
| FEATURE_PLANNING_ENABLED | Enable/disable feature planning | true |
| FEATURE_PLANNING_DEFAULT_FORMAT | Default output format | json |
| FEATURE_PLANNING_STORAGE_PATH | Path to store feature plans | ./feature-plans |
| FEATURE_PLANNING_MAX_PLANS | Maximum number of plans to keep | 50 |
| FEATURE_PLANNING_ITERATION_PATTERN | Pattern for iteration naming | Iteration {n}: {description} |
| FEATURE_PLANNING_MAX_ITERATIONS | Maximum allowed iterations | 10 |
| ALLOWED_TOOLS | Comma-separated list of allowed tools | All tools |

## License

MIT 