module.exports = {
  clearMocks: true,
  coverageProvider: "v8",
  moduleFileExtensions: ["ts", "js", "json", "node"],
  preset: "ts-jest",
  setupFilesAfterEnv: ["<rootDir>/setup.js"],
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  testPathIgnorePatterns: ["/node_modules/", ".d.ts", ".js"],
};
