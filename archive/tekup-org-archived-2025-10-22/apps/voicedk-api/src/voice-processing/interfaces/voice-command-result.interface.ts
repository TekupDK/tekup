export interface VoiceCommandResult {
  /**
   * Whether the command was processed successfully
   */
  success: boolean;

  /**
   * Human-readable response message in Danish
   */
  message: string;

  /**
   * Confidence score from 0 to 1
   */
  confidence: number;

  /**
   * Processing time in milliseconds
   */
  processingTime: number;

  /**
   * Structured data returned by the command (optional)
   */
  data?: Record<string, any>;

  /**
   * Suggested follow-up actions (optional)
   */
  suggestions?: string[];

  /**
   * Error details if processing failed (optional)
   */
  error?: {
    code: string;
    details: string;
    recoverable: boolean;
  };

  /**
   * Metadata about the processing
   */
  metadata?: {
    intentRecognized: string;
    parametersExtracted: Record<string, any>;
    businessContext: string;
    languageUsed: string;
    commandType: string;
  };
}