import { EnvironmentInfo } from '../../core/src';

export function getOS(): EnvironmentInfo['os'] {
  const userAgent = window.navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return 'iOS';
  } else if (/Mac/.test(userAgent)) {
    return 'MacOS';
  } else if (/Win/.test(userAgent)) {
    return 'Windows';
  } else if (/Android/.test(userAgent)) {
    return 'Android';
  } else if (/Linux/.test(userAgent)) {
    return 'Linux';
  }

  return 'Other';
}

function getBrowser(): EnvironmentInfo['browser'] {
  const userAgent = window.navigator.userAgent;
  if (/OPR/.test(userAgent)) {
    return 'Opera';
  } else if (/Edge|Edg/.test(userAgent)) {
    return 'Edge';
  } else if (/Chrome/.test(userAgent)) {
    return 'Chrome';
  } else if (/Firefox/.test(userAgent)) {
    return 'Firefox';
  } else if (/Safari/.test(userAgent)) {
    return 'Safari';
  } else if (/Trident/.test(userAgent)) {
    return 'IE';
  }

  return 'Other';
}

export function detectEnvironment(): EnvironmentInfo {
  return { os: getOS(), browser: getBrowser() };
}
