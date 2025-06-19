import { init as initAmplitude } from '@amplitude/analytics-browser';
import posthog from 'posthog-js';
import type { UserContext } from '../types';

interface AnalyticsConfig {
  amplitude?: {
    apiKey: string;
  };
  posthog?: {
    apiKey: string;
    apiHost?: string;
  };
}

/**
 * Initialize analytics services
 */
export function initAnalytics(config: AnalyticsConfig) {
  // Initialize Amplitude
  if (config.amplitude?.apiKey) {
    try {
      initAmplitude(config.amplitude.apiKey, {
        defaultTracking: {
          sessions: true,
          pageViews: true,
          formInteractions: true,
          fileDownloads: true,
        },
      });
    } catch (error) {
      console.error('Failed to initialize Amplitude:', error);
    }
  }

  // Initialize PostHog
  if (config.posthog?.apiKey) {
    try {
      posthog.init(config.posthog.apiKey, {
        api_host: config.posthog.apiHost || 'https://app.posthog.com',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
      });
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }
}

/**
 * Track an event across all analytics services
 */
export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
) {
  try {
    // Track in Amplitude
    if (window.amplitude) {
      window.amplitude.track(name, properties);
    }

    // Track in PostHog
    posthog.capture(name, properties);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/**
 * Set user identity across all analytics services
 */
export function identifyUser(user: UserContext) {
  try {
    const { id, email, username, ...properties } = user;

    // Identify in Amplitude
    if (window.amplitude) {
      window.amplitude.setUserId(id);
      window.amplitude.setUserProperties({
        email,
        username,
        ...properties,
      });
    }

    // Identify in PostHog
    posthog.identify(id, {
      email,
      username,
      ...properties,
    });
  } catch (error) {
    console.error('Failed to identify user:', error);
  }
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(
  flagKey: string,
  defaultValue: boolean = false
): boolean {
  try {
    return posthog.isFeatureEnabled(flagKey) ?? defaultValue;
  } catch (error) {
    console.error('Failed to check feature flag:', error);
    return defaultValue;
  }
}

/**
 * Reset user identity across all analytics services
 */
export function resetUser() {
  try {
    // Reset Amplitude
    if (window.amplitude) {
      window.amplitude.reset();
    }

    // Reset PostHog
    posthog.reset();
  } catch (error) {
    console.error('Failed to reset user:', error);
  }
}

/**
 * Add properties to the current page view
 */
export function addPageProperties(
  properties: Record<string, unknown>
) {
  try {
    // Add to PostHog
    posthog.register(properties);
  } catch (error) {
    console.error('Failed to add page properties:', error);
  }
}

// Add type definitions for window.amplitude
declare global {
  interface Window {
    amplitude?: {
      track: (name: string, properties?: Record<string, unknown>) => void;
      setUserId: (id: string | null) => void;
      setUserProperties: (properties: Record<string, unknown>) => void;
      reset: () => void;
    };
  }
}