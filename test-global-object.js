/**
 * Test file to demonstrate how the PluginGoGlobal object can be accessed
 * from within evaluated code using new Function()
 */

// This simulates the global object that would be available
const PluginGoGlobal = {
  log: (...args) => console.log("[PluginGoGlobal]", ...args),
  warn: (...args) => console.warn("[PluginGoGlobal]", ...args),
  error: (...args) => console.error("[PluginGoGlobal]", ...args),
  // Example utility function
  sum: (a, b) => a + b,
  // Example data
  version: "1.0.0"
};

// Test case 1: Simple array that can access global functions
const testCode1 = `[{name: "test", value: PluginGoGlobal.sum(1, 2)}]`;
console.log("Test 1 - Accessing global function:");
try {
  const func1 = new Function('PluginGoGlobal', `return ${testCode1}`);
  const result1 = func1(PluginGoGlobal);
  console.log("Result:", result1);
} catch (error) {
  console.error("Error:", error.message);
}

// Test case 2: Using global object methods
const testCode2 = `[{name: "log test", init: () => PluginGoGlobal.log("Hello from evaluated code!")}]`;
console.log("\nTest 2 - Using global log method:");
try {
  const func2 = new Function('PluginGoGlobal', `return ${testCode2}`);
  const result2 = func2(PluginGoGlobal);
  console.log("Result:", result2);
  // Call the init function to see the log
  if (result2[0].init) result2[0].init();
} catch (error) {
  console.error("Error:", error.message);
}

// Test case 3: Complex object with global access
const testCode3 = `{
  items: [1, 2, 3].map(x => x * 2),
  globalVersion: PluginGoGlobal.version,
  customFunc: (x) => PluginGoGlobal.sum(x, 10)
}`;
console.log("\nTest 3 - Complex object with global access:");
try {
  const func3 = new Function('PluginGoGlobal', `return ${testCode3}`);
  const result3 = func3(PluginGoGlobal);
  console.log("Result:", result3);
  console.log("Custom function test:", result3.customFunc(5));
} catch (error) {
  console.error("Error:", error.message);
}

console.log("\nAll tests completed!");