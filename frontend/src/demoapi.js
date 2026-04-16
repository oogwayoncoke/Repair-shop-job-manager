// This wraps the real api.js and intercepts calls when demo_mode is active.
// Import this instead of api.js in components, or patch api.js to use this.

import realApi from "./api";

// We can't call useDemo() outside React — so we read localStorage directly
// and call the mockApi function stored on window (set by DemoProvider)
const demoApi = {
  get: (url, config) => dispatch("GET", url, null, config),
  post: (url, data, config) => dispatch("POST", url, data, config),
  put: (url, data, config) => dispatch("PUT", url, data, config),
  patch: (url, data, config) => dispatch("PATCH", url, data, config),
  delete: (url, config) => dispatch("DELETE", url, null, config),
};

function dispatch(method, url, data, config) {
  if (localStorage.getItem("demo_mode") === "true" && window.__demoMockApi) {
    return window.__demoMockApi(method, url, data);
  }
  // Fall through to real axios instance
  switch (method) {
    case "GET":
      return realApi.get(url, config);
    case "POST":
      return realApi.post(url, data, config);
    case "PUT":
      return realApi.put(url, data, config);
    case "PATCH":
      return realApi.patch(url, data, config);
    case "DELETE":
      return realApi.delete(url, config);
    default:
      return realApi.get(url, config);
  }
}

export default demoApi;
