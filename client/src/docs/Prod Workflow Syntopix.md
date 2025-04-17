# Production Workflow for Syntopix-like Development

## Overview

This document outlines the steps to run production code using a workflow similar to the development process used for Syntopix. It ensures consistent builds and debugging capabilities while maintaining production-level optimizations.

---

## Steps to Run Production Code

### 1. **Build the Production Bundle**

Run the Vue CLI service with the desired mode (e.g., `production`):

```bash
vue-cli-service build --mode production
```

This generates the `dist` folder containing the minified production-ready files.

### 2. **Serve the Built Assets**

Use a static file server to serve the built assets:

- Using `serve`:
  ```bash
  npx serve -s dist
  ```
- Using `http-server`:
  ```bash
  npx http-server dist
  ```

Alternatively, configure your backend (e.g., Express.js) to serve the static files:

```javascript
const express = require('express')
const app = express()
const PORT = 3333

app.use(express.static('dist'))
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
```

---

### 3. **Launch the Server**

Ensure your production server file (e.g., `index.js`) is configured to use the correct `NODE_ENV` and port settings. Example launch configuration:

```json
{
  "name": "Server",
  "type": "node",
  "request": "launch",
  "skipFiles": ["<node_internals>/**"],
  "program": "${workspaceFolder}/srv/index.js",
  "env": {
    "NODE_ENV": "production",
    "PORT": "3333"
  }
}
```

---

### 4. **Debugging Setup**

#### Add Source Maps

Ensure source maps are generated for production builds by adding a `vue.config.js` file:

```javascript
module.exports = {
  productionSourceMap: true,
}
```

#### Chrome Debugging Configuration

Update your debugging configuration to use source maps for production:

```json
{
  "type": "chrome",
  "request": "launch",
  "name": "vuejs: chrome (prod)",
  "url": "http://localhost:3333",
  "webRoot": "${workspaceFolder}/src",
  "sourceMapPathOverrides": {
    "webpack:///src/*": "${webRoot}/*",
    "webpack:///src/components/*": "${webRoot}/components/*"
  }
}
```

---

### 5. **Test and Iterate**

- Run the production build and launch both the server and frontend in the configured environment.
- Verify proper communication between the frontend and backend.
- Debug any issues using source maps generated during the build process.

---

## Benefits of This Workflow

1. **Consistency**:
   - Mirrors the development workflow for familiarity while maintaining production-level optimizations.
2. **Debugging**:
   - Enables debugging production code using source maps.
3. **Efficiency**:
   - Ensures consistent builds and runtime environments.

---

## Notes

- **Hot Module Replacement (HMR)**: Not available in production. Rebuild after each change.
- **Source Maps**: Use in staging or development but disable for production deployments for security and performance.

---

By following this workflow, you can ensure smooth transitions from development to production while retaining robust debugging capabilities.
