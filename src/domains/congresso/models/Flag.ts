/**
 * Flag model representing a state flag with associated dashboards
 */

import { DashboardConfig } from '../components/Dashboards/dashboardConfig';

/**
 * Interface for a Flag (bandeira) with associated dashboards
 */
export interface Flag {
  /** The state code (e.g., 'RJ', 'SP', 'BR') */
  code: string;
  
  /** The full name of the state */
  name: string;
  
  /** URL to the flag image */
  flagUrl: string;
  
  /** Associated dashboard keys */
  dashboardKeys: string[];
  
  /** Optional dashboard configurations */
  dashboardConfigs?: Record<string, DashboardConfig>;
}

/**
 * Create a flag with default dashboard keys based on state code
 * @param code State code
 * @param name State name
 * @param flagUrl URL to the flag image
 * @returns Flag object with default dashboard keys
 */
export function createFlag(code: string, name: string, flagUrl: string): Flag {
  const lowerCode = code.toLowerCase();
  
  return {
    code,
    name,
    flagUrl,
    dashboardKeys: [`cg-${lowerCode}`, `ale-${lowerCode}`, `gov-${lowerCode}`]
  };
}

/**
 * Get dashboard keys for a specific state code
 * @param stateCode State code
 * @returns Array of dashboard keys
 */
export function getDashboardKeysForState(stateCode: string): string[] {
  const lowerCode = stateCode.toLowerCase();
  return [`cg-${lowerCode}`, `ale-${lowerCode}`, `gov-${lowerCode}`];
}
