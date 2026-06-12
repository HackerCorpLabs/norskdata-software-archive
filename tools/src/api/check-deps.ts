/**
 * Dependency checker: validates that required tools are installed.
 */

import { execSync } from 'child_process';
import type { DepCheckResult } from '../types.js';

/**
 * Check a single dependency by running a version command.
 */
function checkOne(name: string, command: string): DepCheckResult {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return { name, found: true, version: result };
  } catch {
    return { name, found: false, version: null };
  }
}

/**
 * Check all required and optional dependencies.
 * Returns results grouped by category.
 */
export function checkAllDeps(): {
  required: DepCheckResult[];
  optional: DepCheckResult[];
  allOk: boolean;
} {
  const required: DepCheckResult[] = [
    checkOne('node', 'node --version'),
    checkOne('npm', 'npm --version'),
    checkOne('git', 'git --version'),
  ];

  const optional: DepCheckResult[] = [
    checkOne('python3', 'python3 --version'),
    checkOne('ia', 'ia --version'),
  ];

  const allOk = required.every(d => d.found);

  return { required, optional, allOk };
}

/**
 * Print dependency check results to stdout.
 */
export function printDepCheck(): void {
  console.log('Checking prerequisites...\n');

  const { required, optional, allOk } = checkAllDeps();

  console.log('Required:');
  for (const dep of required) {
    if (dep.found) {
      console.log(`  [OK]      ${dep.name} ${dep.version}`);
    } else {
      console.log(`  [MISSING] ${dep.name} -- not found`);
    }
  }

  console.log('\nInternet Archive operations:');
  for (const dep of optional) {
    if (dep.found) {
      console.log(`  [OK]      ${dep.name} ${dep.version}`);
    } else {
      console.log(`  [MISSING] ${dep.name} -- not found`);
    }
  }

  console.log('');
  if (allOk) {
    console.log('All required prerequisites are installed.');
  } else {
    console.log('Some prerequisites are missing. See INSTALL.md for setup instructions.');
  }
}
