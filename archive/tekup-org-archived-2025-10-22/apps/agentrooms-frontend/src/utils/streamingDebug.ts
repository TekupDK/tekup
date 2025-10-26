/**
 * Streaming debug utilities for diagnosing cloud deployment issues
 */

export const STREAMING_DEBUG = import.meta.env.VITE_STREAMING_DEBUG === 'true';

export function debugStreamingPerformance(startTime: number, firstResponseTime?: number, endTime?: number) {
  if (!STREAMING_DEBUG) return;

  const now = Date.now();
  console.group('🌊 Streaming Performance Debug');
  
  if (firstResponseTime) {
    logger.info(`⏱️ Time to first response: ${firstResponseTime - startTime}ms`);
  }
  
  if (endTime) {
    logger.info(`⏱️ Total request time: ${endTime - startTime}ms`);
  } else {
    logger.info(`⏱️ Current request time: ${now - startTime}ms`);
  }
  
  console.groupEnd();
}

export function debugStreamingConnection(url: string, headers: HeadersInit) {
  if (!STREAMING_DEBUG) return;

  console.group('🔗 Streaming Connection Debug');
  logger.info(`📡 URL: ${url}`);
  logger.info(`📋 Headers:`, headers);
  console.groupEnd();
}

export function debugStreamingChunk(chunk: string, lineCount: number) {
  if (!STREAMING_DEBUG) return;

  console.group('📦 Streaming Chunk Debug');
  logger.info(`📏 Chunk size: ${chunk.length} bytes`);
  logger.info(`📝 Line count: ${lineCount}`);
  logger.info(`🔍 First 100 chars: ${chunk.substring(0, 100)}`);
  console.groupEnd();
}

export function debugStreamingLatency(messageType: string, timestamp: number) {
  if (!STREAMING_DEBUG) return;

  const now = Date.now();
  const latency = now - timestamp;
  
  if (latency > 1000) {
    logger.warn(`⚠️ High latency detected for ${messageType}: ${latency}ms`);
  } else {
    logger.info(`⚡ ${messageType} latency: ${latency}ms`);
  }
}

export function warnProxyBuffering(detectionTime: number) {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-agentrooms-frontend-src-u');

  console.group('⚠️ Streaming Issue Detected');
  logger.warn(`Proxy buffering suspected - no streaming detected within ${detectionTime}ms`);
  logger.info('💡 Possible solutions:');
  logger.info('  • Check NGINX/proxy configuration');
  logger.info('  • Verify CDN settings');
  logger.info('  • Check cloud platform streaming support');
  logger.info('  • See STREAMING_DEPLOYMENT.md for details');
  console.groupEnd();
}