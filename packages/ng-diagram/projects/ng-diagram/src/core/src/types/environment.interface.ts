/**
 * Interface representing environment information
 *
 * @category Types
 */
export interface EnvironmentInfo {
  /**
   * User Operating system name
   */
  os: 'MacOS' | 'Windows' | 'Linux' | 'iOS' | 'Android' | 'Other';
  /**
   * User Browser name
   */
  browser: 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Opera' | 'IE' | 'Other';
}
