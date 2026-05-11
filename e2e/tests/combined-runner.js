/**
 * Combined E2E Test Runner
 * - Playwright for API tests
 * - miniprogram-automator for UI tests
 *
 * Run: node tests/combined-runner.js
 */
const { execSync } = require('child_process');
const path = require('path');

const API_TEST_FILE = 'tests/api.spec.ts';
const UI_TEST_FILE = 'tests/miniapp-automator.spec.js';
const ASSESSMENT_TEST_FILE = 'tests/assessment.spec.ts';

let results = {
  api: { passed: 0, failed: 0, duration: 0 },
  ui: { passed: 0, failed: 0, duration: 0 },
  assessment: { passed: 0, failed: 0, duration: 0 }
};

console.log('============================================================');
console.log('FocusKids Combined E2E Test Suite');
console.log('============================================================\n');

// Helper to run command and parse results
function runCommand(cmd, label) {
  console.log(`\n📋 Running ${label} tests...`);
  const start = Date.now();
  try {
    const output = execSync(cmd, { encoding: 'utf8', cwd: __dirname });
    console.log(output);
    return { success: true, output, duration: Date.now() - start };
  } catch (error) {
    return { success: false, output: error.stdout || error.message, duration: Date.now() - start };
  }
}

// Run API Tests with Playwright
function runAPITests() {
  console.log('\n============================================================');
  console.log('Phase 1: API Tests (Playwright)');
  console.log('============================================================');
  const result = runCommand(`npx playwright test ${API_TEST_FILE} --reporter=list --timeout=60000`, 'API');

  // Parse passed/failed from output
  const output = result.output;
  const passedMatch = output.match(/(\d+) passed/);
  const failedMatch = output.match(/(\d+) failed/);

  results.api.passed = passedMatch ? parseInt(passedMatch[1]) : 0;
  results.api.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
  results.api.duration = result.duration;

  return result.success || results.api.failed === 0;
}

// Run UI Tests with miniprogram-automator
function runUITests() {
  console.log('\n============================================================');
  console.log('Phase 2: UI Tests (miniprogram-automator)');
  console.log('============================================================');
  const start = Date.now();

  try {
    // Check if WeChat DevTools is running
    execSync('wechat-cli status', { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    console.log('⚠️ WeChat DevTools not running. Starting...');
    try {
      execSync('wechat-cli auto', { encoding: 'utf8', stdio: 'pipe' });
      require('child_process').execSync('sleep 5');
    } catch (err) {
      console.log('Could not start WeChat DevTools automatically');
    }
  }

  try {
    const result = execSync(`node ${UI_TEST_FILE}`, { encoding: 'utf8', cwd: __dirname });
    console.log(result);
    return { success: true, duration: Date.now() - start };
  } catch (error) {
    console.log('UI Test Error:', error.message);
    return { success: false, duration: Date.now() - start, error: error.message };
  }
}

// Run Assessment Tests
function runAssessmentTests() {
  console.log('\n============================================================');
  console.log('Phase 3: Assessment Flow Tests (Playwright)');
  console.log('============================================================');
  const result = runCommand(`npx playwright test ${ASSESSMENT_TEST_FILE} --reporter=list --timeout=60000`, 'Assessment');

  const output = result.output;
  const passedMatch = output.match(/(\d+) passed/);
  const failedMatch = output.match(/(\d+) failed/);

  results.assessment.passed = passedMatch ? parseInt(passedMatch[1]) : 0;
  results.assessment.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
  results.assessment.duration = result.duration;

  return result.success || results.assessment.failed === 0;
}

// Print Final Summary
function printSummary() {
  const totalPassed = results.api.passed + results.ui.passed + results.assessment.passed;
  const totalFailed = results.api.failed + results.ui.failed + results.assessment.failed;
  const totalDuration = results.api.duration + results.ui.duration + results.assessment.duration;

  console.log('\n============================================================');
  console.log('📊 Combined Test Summary');
  console.log('============================================================');
  console.log(`\nAPI Tests (Playwright):`);
  console.log(`  Passed: ${results.api.passed}`);
  console.log(`  Failed: ${results.api.failed}`);
  console.log(`  Duration: ${(results.api.duration / 1000).toFixed(2)}s`);

  console.log(`\nUI Tests (miniprogram-automator):`);
  console.log(`  Passed: ${results.ui.passed}`);
  console.log(`  Failed: ${results.ui.failed}`);
  console.log(`  Duration: ${(results.ui.duration / 1000).toFixed(2)}s`);

  console.log(`\nAssessment Tests (Playwright):`);
  console.log(`  Passed: ${results.assessment.passed}`);
  console.log(`  Failed: ${results.assessment.failed}`);
  console.log(`  Duration: ${(results.assessment.duration / 1000).toFixed(2)}s`);

  console.log('\n============================================================');
  console.log(`Total: ${totalPassed + totalFailed} tests`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log('============================================================');

  return totalFailed === 0;
}

// Main execution
async function main() {
  console.log('Starting combined E2E test suite...\n');

  // Run all test phases
  const apiSuccess = runAPITests();
  const uiSuccess = runUITests().success !== false;
  const assessmentSuccess = runAssessmentTests();

  // Print summary and exit with appropriate code
  const allPassed = printSummary();

  if (!allPassed) {
    console.log('\n⚠️ Some tests failed. Please check the output above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

main();