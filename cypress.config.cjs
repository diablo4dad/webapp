const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: false,
  e2e: {
    baseUrl: "http://127.0.0.1:5173",
    supportFile: false,
    video: false,
  },
});
