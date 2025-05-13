import { datadogRum, RumInitConfiguration } from '@datadog/browser-rum';
import type { UserContext } from '../types';

interface DatadogConfig extends Omit<RumInitConfiguration, 'applicationId' | 'clientToken'> {
  applicationId: string;
  clientToken: string;
}

const DEFAULT_CONFIG: Partial<DatadogConfig> = {
  site: 'datadoghq.com',
  service: 'a-republica-brasileira',
  env: import.meta.env.MODE,
  version: import.meta.env.VITE_APP_VERSION,
  sessionSampleRate: 100,
  trackUserInteractions: true,
  defaultPrivacyLevel: 'mask-user-input',
};

/**
 * Check if a value is a placeholder
 */
function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return value.includes('placeholder') || value.includes('PLACEHOLDER');
}

/**
 * Initialize DataDog RUM
 */
export function initDatadog(config: DatadogConfig) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Check if credentials are missing or are placeholders
  if (!finalConfig.applicationId || !finalConfig.clientToken || 
      isPlaceholder(finalConfig.applicationId) || isPlaceholder(finalConfig.clientToken)) {
    // Em ambiente de desenvolvimento, não exibimos o aviso
    if (import.meta.env.PROD) {
      console.warn('DataDog applicationId or clientToken not provided or are placeholders. Monitoring will be disabled.');
    }
    return;
  }

  try {
    datadogRum.init({
      applicationId: finalConfig.applicationId,
      clientToken: finalConfig.clientToken,
      site: finalConfig.site,
      service: finalConfig.service,
      env: finalConfig.env,
      version: finalConfig.version,
      sessionSampleRate: finalConfig.sessionSampleRate,
      trackUserInteractions: finalConfig.trackUserInteractions,
      defaultPrivacyLevel: finalConfig.defaultPrivacyLevel,
      
      // Additional configuration
      trackResources: true,
      trackLongTasks: true,
      allowedTracingUrls: [window.location.origin],
    });

    // Start tracking
    datadogRum.startSessionReplayRecording();

    // Log successful initialization in development
    if (import.meta.env.DEV) {
      console.log('DataDog RUM initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize DataDog:', error);
  }
}

/**
 * Add a custom action to DataDog RUM
 */
export function addAction(
  name: string,
  context?: Record<string, unknown>
) {
  try {
    datadogRum.addAction(name, context);
  } catch (error) {
    console.error('Failed to add action to DataDog:', error);
  }
}

/**
 * Add a custom error to DataDog RUM
 */
export function addError(
  error: Error,
  context?: Record<string, unknown>
) {
  try {
    datadogRum.addError(error, context);
  } catch (error) {
    console.error('Failed to add error to DataDog:', error);
  }
}

/**
 * Set user information in DataDog RUM
 */
export function setUser(user: UserContext) {
  try {
    const { id, email, username, ...rest } = user;
    datadogRum.setUser({
      id,
      email,
      name: username,
      ...rest,
    });
  } catch (error) {
    console.error('Failed to set user in DataDog:', error);
  }
}

/**
 * Add a custom timing measurement
 */
export function addTiming(
  name: string,
  time?: number
) {
  try {
    datadogRum.addTiming(name, time);
  } catch (error) {
    console.error('Failed to add timing to DataDog:', error);
  }
}

/**
 * Add custom attributes to the current view
 */
export function addViewContext(
  key: string,
  value: unknown
) {
  try {
    datadogRum.addAction('view_context', {
      [key]: value,
    });
  } catch (error) {
    console.error('Failed to add view context to DataDog:', error);
  }
}

/**
 * Add custom attributes to the current session
 */
export function addSessionContext(
  key: string,
  value: unknown
) {
  try {
    datadogRum.setGlobalContext({
      [key]: value,
    });
  } catch (error) {
    console.error('Failed to add session context to DataDog:', error);
  }
}

/**
 * Start a performance measurement
 */
export function startMeasure(
  name: string,
  context?: Record<string, unknown>
) {
  const startTime = performance.now();
  
  return {
    stop: () => {
      const duration = performance.now() - startTime;
      addTiming(name, duration);
      
      if (context) {
        addAction(name, {
          ...context,
          duration,
        });
      }
      
      return duration;
    },
  };
}
