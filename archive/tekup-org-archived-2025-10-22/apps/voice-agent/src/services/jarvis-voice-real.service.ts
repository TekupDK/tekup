/**
 * Jarvis Voice Real Adapter (safe)
 *
 * Provides a lightweight "real" mode that integrates with Flow-API's minimal
 * Jarvis endpoints when available, and gracefully falls back when not.
 *
 * No heavy AI dependencies are required. This keeps the UI contract identical
 * to the mock service while enabling end-to-end wiring.
 */

import { VoiceIntegrationService, VoiceIntegrationConfig } from './voice-integration.service'
import { createLogger } from '@tekup/shared'

const logger = createLogger('jarvis-voice-real-adapter')

export interface MultimodalVoiceRequest {
  audioData: ArrayBuffer
  screenCapture?: ArrayBuffer
  contextData?: {
    currentPage?: string
    dashboardData?: any
    conversationHistory?: any[]
  }
  tenantId: string
  userId: string
}

export interface MultimodalVoiceResponse {
  textResponse: string
  audioResponse?: ArrayBuffer
  visualInsights?: {
    objects: Array<{ label: string; confidence: number }>
    text: Array<{ content: string; language: string }>
    actionItems?: string[]
  }
  suggestedActions?: Array<{
    type: 'navigate' | 'execute' | 'display'
    description: string
    command: string
  }>
  confidence: number
}

export class JarvisVoiceService extends VoiceIntegrationService {
  private isJarvisInitialized = false
  private lastHealth: any = null
  private abortController: AbortController | null = null

  constructor(config: VoiceIntegrationConfig) {
    super(config)
    void this.initializeJarvis()
  }

  private async initializeJarvis() {
    try {
      logger.info('🤖 Initializing Jarvis (Flow-API adapter)...')
      const health = await this.fetchWithTimeout(`${(this as any).config.flowApiUrl}/jarvis/health`, {
        method: 'GET',
      })
      if (health && health.status === 'ok') {
        this.isJarvisInitialized = true
        this.lastHealth = health
        logger.info('✅ Jarvis health from backend:', health)
      } else {
        logger.warn('⚠️ Jarvis health not ok or missing; proceeding with graceful mode')
        this.isJarvisInitialized = false
      }
    } catch (err) {
      logger.warn('⚠️ Jarvis health probe failed; backend likely not wired. Falling back.', err)
      this.isJarvisInitialized = false
    }
  }

  async processMultimodalCommand(request: MultimodalVoiceRequest): Promise<MultimodalVoiceResponse> {
    // Try backend first if initialized; otherwise still try once (in case of race)
    try {
      const url = `${(this as any).config.flowApiUrl}/jarvis/leads/analyze`
      const payload = {
        // Minimal contract expected by stub controller in Flow-API
        lead: {
          id: undefined,
          name: request.contextData?.currentPage || 'Voice Command',
        },
        context: {
          tenantId: request.tenantId,
          userId: request.userId,
          hasScreen: Boolean(request.screenCapture),
        },
      }

      const result = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (result && result.enabled) {
        const textResponse = result.summary || 'Jarvis analyzed your request.'
        const response: MultimodalVoiceResponse = {
          textResponse,
          visualInsights: request.screenCapture ? await this.analyzeScreenContext(request.screenCapture) : undefined,
          suggestedActions: this.deriveSuggestedActions(result),
          confidence: typeof result.score === 'number' ? Math.max(0, Math.min(1, result.score)) : 0.8,
        }
        logger.info('✅ Jarvis backend response delivered')
        return response
      }

      // Backend reachable but disabled
      logger.warn('⚠️ Jarvis endpoint returned disabled; using graceful local response')
      return this.localGracefulResponse(request)
    } catch (err) {
      // Backend missing (404) or network failure
      logger.warn('⚠️ Jarvis backend call failed; using graceful local response', err)
      return this.localGracefulResponse(request)
    }
  }

  async analyzeScreenContext(screenData: ArrayBuffer): Promise<any> {
    // Lightweight client-side screen analysis placeholder
    // We cannot decode image here without DOM/canvas; return basic metadata
    const sizeKb = Math.round(screenData.byteLength / 1024)
    return {
      objects: [
        { label: 'screen', confidence: 0.95 },
        { label: 'ui-elements', confidence: 0.85 },
      ],
      text: [
        { content: 'Screen capture detected', language: 'en' },
      ],
      actionableItems: [
        'Navigate to leads page',
      ],
      meta: { sizeKb },
      confidence: 0.86,
    }
  }

  async getJarvisHealthStatus() {
    return {
      initialized: this.isJarvisInitialized,
      jarvis: this.isJarvisInitialized,
      backend: this.lastHealth || null,
      multimodal: true,
      vision: true,
      audio: false, // no TTS synthesis in this adapter
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.abortController) {
        this.abortController.abort()
        this.abortController = null
      }
      logger.info('🧹 Jarvis real adapter cleaned up')
    } catch (e) {
      logger.error('Cleanup error:', e)
    }
  }

  // Helpers
  private async fetchWithTimeout(url: string, init: RequestInit & { timeoutMs?: number } = {}) {
    const timeoutMs = init.timeoutMs ?? 4000
    this.abortController = new AbortController()
    const to = setTimeout(() => this.abortController?.abort(), timeoutMs)
    try {
      const res = await fetch(url, { ...init, signal: this.abortController.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json().catch(() => null)
      return data
    } finally {
      clearTimeout(to)
      this.abortController = null
    }
  }

  private deriveSuggestedActions(result: any): Array<{ type: 'navigate' | 'execute' | 'display'; description: string; command: string }> {
    const actions: Array<{ type: 'navigate' | 'execute' | 'display'; description: string; command: string }> = []
    if (result?.reasons?.length) {
      actions.push({ type: 'display', description: result.reasons[0], command: 'show_reason' })
    }
    actions.push({ type: 'navigate', description: 'Gå til leads', command: 'navigate:/leads' })
    return actions
  }

  private localGracefulResponse(request: MultimodalVoiceRequest): MultimodalVoiceResponse {
    const hasScreen = Boolean(request.screenCapture)
    return {
      textResponse: hasScreen
        ? 'Jarvis backend er ikke aktiv endnu. Skærm er registreret; jeg kan foreslå at gå til Leads siden.'
        : 'Jarvis backend er ikke aktiv endnu. Jeg kan hjælpe med standardkommandoer indtil videre.',
      visualInsights: hasScreen ? {
        objects: [ { label: 'screen', confidence: 0.95 } ],
        text: [ { content: 'Screen capture detected', language: 'en' } ],
        actionItems: [ 'Navigate to leads page' ],
      } : undefined,
      suggestedActions: [ { type: 'navigate', description: 'Gå til leads', command: 'navigate:/leads' } ],
      confidence: 0.5,
    }
  }
}

// Factory to match dynamic import usage in UI
export const createJarvisVoiceService = (config: VoiceIntegrationConfig) => new JarvisVoiceService(config)
