import { useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { datadogRum } from '@datadog/browser-rum';
import type { UserContext } from '../types';

interface MonitoringHookResult {
  /**
   * Track a user action
   */
  trackAction: (name: string, context?: Record<string, unknown>) => void;

  /**
   * Track an error
   */
  trackError: (error: Error, context?: Record<string, unknown>) => void;

  /**
   * Track a timing measurement
   */
  trackTiming: (name: string, time?: number) => void;

  /**
   * Set user information
   */
  setUser: (user: UserContext) => void;

  /**
   * Start a performance measurement
   */
  startMeasure: (name: string, context?: Record<string, unknown>) => {
    stop: () => number;
  };

  /**
   * Add custom context to the current view
   */
  addViewContext: (key: string, value: unknown) => void;

  /**
   * Add custom context to the current session
   */
  addSessionContext: (key: string, value: unknown) => void;

  /**
   * Add properties to the current page
   */
  addPageProperties: (properties: Record<string, unknown>) => void;
}

/**
 * Hook for monitoring capabilities
 */
export function useMonitoring(): MonitoringHookResult {
  const trackAction = useCallback((name: string, context?: Record<string, unknown>) => {
    try {
      // Track in both systems for better coverage
      datadogRum.addAction(name, context);
      Sentry.addBreadcrumb({
        category: 'action',
        message: name,
        data: context,
      });
    } catch (error) {
      console.error('Failed to track action:', error);
    }
  }, []);

  const trackError = useCallback((error: Error, context?: Record<string, unknown>) => {
    try {
      // Track in both systems
      datadogRum.addError(error, context);
      Sentry.withScope(scope => {
        if (context) {
          scope.setExtras(context);
        }
        Sentry.captureException(error);
      });
    } catch (e) {
      console.error('Failed to track error:', e);
    }
  }, []);

  const trackTiming = useCallback((name: string, time?: number) => {
    try {
      datadogRum.addTiming(name, time);
      Sentry.addBreadcrumb({
        category: 'timing',
        message: name,
        data: { duration: time },
      });
    } catch (error) {
      console.error('Failed to track timing:', error);
    }
  }, []);

  const setUser = useCallback((user: UserContext) => {
    try {
      const { id, email, username, ...rest } = user;
      
      // Set in both systems
      datadogRum.setUser({
        id,
        email,
        name: username,
        ...rest,
      });
      
      Sentry.setUser({
        id,
        email,
        username,
        ...rest,
      });
    } catch (error) {
      console.error('Failed to set user:', error);
    }
  }, []);

  const startMeasure = useCallback((name: string, context?: Record<string, unknown>) => {
    const startTime = performance.now();
    
    return {
      stop: () => {
        const duration = performance.now() - startTime;
        trackTiming(name, duration);
        
        if (context) {
          trackAction(name, {
            ...context,
            duration,
          });
        }
        
        return duration;
      },
    };
  }, [trackTiming, trackAction]);

  const addViewContext = useCallback((key: string, value: unknown) => {
    try {
      datadogRum.addAction('view_context', {
        [key]: value,
      });
      
      Sentry.addBreadcrumb({
        category: 'view',
        message: `View context: ${key}`,
        data: { [key]: value },
      });
    } catch (error) {
      console.error('Failed to add view context:', error);
    }
  }, []);

  const addSessionContext = useCallback((key: string, value: unknown) => {
    try {
      datadogRum.setGlobalContext({
        [key]: value,
      });
      
      Sentry.setTag(key, String(value));
    } catch (error) {
      console.error('Failed to add session context:', error);
    }
  }, []);

  const addPageProperties = useCallback((properties: Record<string, unknown>) => {
    try {
      // Add to DataDog RUM
      datadogRum.addAction('page_properties', properties);
      
      // Add to Sentry breadcrumbs
      Sentry.addBreadcrumb({
        category: 'page',
        message: 'Page properties updated',
        data: properties,
      });
    } catch (error) {
      console.error('Failed to add page properties:', error);
    }
  }, []);

  return {
    trackAction,
    trackError,
    trackTiming,
    setUser,
    startMeasure,
    addViewContext,
    addSessionContext,
    addPageProperties,
  };
}