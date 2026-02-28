/**
 * MistralClient
 * HTTP client for Mistral AI API
 */

import { logger } from '../logging/logger.js';

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_RETRIES = 1;

export interface MistralConfig {
  feature1: { key?: string; model: string };
  feature2: { key?: string; model: string };
  feature3: { key?: string; model: string };
  brief: { key?: string; model: string };
}

export interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MistralRequest {
  model: string;
  messages: MistralMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export type FeatureKey = 'feature1' | 'feature2' | 'feature3' | 'brief';

export class MistralClient {
  private readonly config: MistralConfig;

  constructor(config: MistralConfig) {
    this.config = config;
  }

  /**
   * Check if API key is available for a feature
   */
  hasKey(feature: FeatureKey): boolean {
    const key = this.config[feature]?.key;
    return typeof key === 'string' && key.length > 0;
  }

  /**
   * Get the model for a feature
   */
  getModel(feature: FeatureKey): string {
    return this.config[feature]?.model || 'mistral-small-latest';
  }

  /**
   * Send a chat completion request to Mistral API
   */
  async chat(
    feature: FeatureKey,
    messages: MistralMessage[],
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<string> {
    const apiKey = this.config[feature]?.key;
    const model = this.getModel(feature);

    if (!apiKey) {
      logger.warn({ feature }, 'Mistral API key not configured');
      throw new Error(`Mistral API key not configured for ${feature}`);
    }

    const request: MistralRequest = {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    };

    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.info({
          feature,
          model,
          attempt: attempt + 1,
          messageCount: messages.length,
        }, 'Sending request to Mistral API');

        const response = await this.sendRequest(apiKey, request);

        const duration = Date.now() - startTime;
        logger.info({
          feature,
          model,
          duration,
          tokens: response.usage,
        }, 'Mistral API response received');

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from Mistral API');
        }

        return content;
      } catch (error) {
        lastError = error as Error;

        if (attempt < MAX_RETRIES && this.isRetryable(error)) {
          logger.warn({
            feature,
            attempt: attempt + 1,
            error: lastError.message,
          }, 'Retrying Mistral API request');
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }

    logger.error({
      feature,
      error: lastError?.message,
      duration: Date.now() - startTime,
    }, 'Mistral API request failed');

    throw lastError || new Error('Unknown error');
  }

  private async sendRequest(apiKey: string, request: MistralRequest): Promise<MistralResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(MISTRAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Mistral API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      return await response.json() as MistralResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof Error) {
      // Retry on 5xx errors or network errors
      return (
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT')
      );
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
