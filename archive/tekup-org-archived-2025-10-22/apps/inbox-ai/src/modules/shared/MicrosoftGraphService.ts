/**
 * Microsoft Graph Service
 * 
 * Handles Microsoft Graph API integration for security scanning
 * Provides authentication and data retrieval for NIS2 and Copilot assessments
 */

import { Client } from '@microsoft/microsoft-graph-client'
import { ClientSecretCredential } from '@azure/identity'
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client'
import { 
  AzureCredentials, 
  MFAStatusReport, 
  ConditionalAccessPolicy, 
  RiskyUser,
  SecurityPlatformError
} from './types.js'

interface GraphClientOptions {
  credentials: AzureCredentials
  debugMode?: boolean
}

interface UserAuthenticationMethod {
  id: string
  userPrincipalName: string
  methods: Array<{
    '@odata.type': string
    id: string
  }>
}

class AzureCredentialProvider implements AuthenticationProvider {
  private credential: ClientSecretCredential

  constructor(credentials: AzureCredentials) {
    this.credential = new ClientSecretCredential(
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret
    )
  }

  async getAccessToken(): Promise<string> {
    try {
      const scope = 'https://graph.microsoft.com/.default'
      const tokenResponse = await this.credential.getToken(scope)
      
      if (!tokenResponse || !tokenResponse.token) {
        throw new Error('Failed to obtain access token')
      }
      
      return tokenResponse.token
    } catch (error) {
      throw new SecurityPlatformError(
        `Authentication failed: ${(error as Error).message}`,
        'GRAPH_AUTH_FAILED'
      )
    }
  }
}

export class MicrosoftGraphService {
  private client: Client
  private credentials: AzureCredentials
  private debugMode: boolean

  constructor(options: GraphClientOptions) {
    this.credentials = options.credentials
    this.debugMode = options.debugMode || false
    
    const authProvider = new AzureCredentialProvider(this.credentials)
    
    this.client = Client.initWithMiddleware({
      authProvider: authProvider,
      debugLogging: this.debugMode
    })
  }

  /**
   * Initialize and validate the Graph connection
   */
  async initialize(): Promise<void> {
    try {
      // Test connection by getting organization info
      await this.client.api('/organization').get()
      
      if (this.debugMode) {
        logger.info('Microsoft Graph Service initialized successfully')
      }
    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to initialize Graph service: ${(error as Error).message}`,
        'GRAPH_INIT_FAILED'
      )
    }
  }

  /**
   * Get MFA status report for all users
   */
  async getMFAStatus(): Promise<MFAStatusReport> {
    try {
      // Get all users
      const usersResponse = await this.client
        .api('/users')
        .select(['id', 'userPrincipalName', 'displayName'])
        .top(999)
        .get()

      const totalUsers = usersResponse.value.length

      // Get authentication methods for all users
      const mfaPromises = usersResponse.value.map(async (user: any) => {
        try {
          const authMethods = await this.client
            .api(`/users/${user.id}/authentication/methods`)
            .get()
          
          return {
            userId: user.id,
            userPrincipalName: user.userPrincipalName,
            methods: authMethods.value || []
          }
        } catch (error) {
          // Some users might not have accessible auth methods
          return {
            userId: user.id,
            userPrincipalName: user.userPrincipalName,
            methods: []
          }
        }
      })

      const authMethodsResults = await Promise.all(mfaPromises)

      // Analyze MFA coverage
      let mfaEnabledUsers = 0
      const methodsBreakdown = {
        authenticatorApp: 0,
        sms: 0,
        call: 0,
        email: 0,
        fido2: 0
      }

      authMethodsResults.forEach(result => {
        const hasMFA = result.methods.some((method: any) => 
          method['@odata.type'] !== '#microsoft.graph.passwordAuthenticationMethod'
        )
        
        if (hasMFA) {
          mfaEnabledUsers++
        }

        // Count method types
        result.methods.forEach((method: any) => {
          switch (method['@odata.type']) {
            case '#microsoft.graph.microsoftAuthenticatorAuthenticationMethod':
              methodsBreakdown.authenticatorApp++
              break
            case '#microsoft.graph.smsAuthenticationMethod':
              methodsBreakdown.sms++
              break
            case '#microsoft.graph.phoneAuthenticationMethod':
              methodsBreakdown.call++
              break
            case '#microsoft.graph.emailAuthenticationMethod':
              methodsBreakdown.email++
              break
            case '#microsoft.graph.fido2AuthenticationMethod':
              methodsBreakdown.fido2++
              break
          }
        })
      })

      const coverage = totalUsers > 0 ? (mfaEnabledUsers / totalUsers) * 100 : 0

      return {
        totalUsers,
        mfaEnabledUsers,
        mfaDisabledUsers: totalUsers - mfaEnabledUsers,
        coverage: Math.round(coverage * 100) / 100,
        methodsBreakdown,
        lastUpdated: new Date()
      }

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to get MFA status: ${(error as Error).message}`,
        'MFA_SCAN_FAILED'
      )
    }
  }

  /**
   * Get Conditional Access policies
   */
  async getConditionalAccessPolicies(): Promise<ConditionalAccessPolicy[]> {
    try {
      const response = await this.client
        .api('/identity/conditionalAccess/policies')
        .get()

      return response.value.map((policy: any) => ({
        id: policy.id,
        displayName: policy.displayName,
        state: policy.state,
        conditions: {
          applications: policy.conditions?.applications?.includeApplications || [],
          users: policy.conditions?.users?.includeUsers || [],
          locations: policy.conditions?.locations?.includeLocations || [],
          platforms: policy.conditions?.platforms?.includePlatforms || [],
          riskLevels: policy.conditions?.signInRiskLevels || []
        },
        grantControls: {
          operator: policy.grantControls?.operator || 'AND',
          builtInControls: policy.grantControls?.builtInControls || [],
          customAuthenticationFactors: policy.grantControls?.customAuthenticationFactors || []
        },
        createdDateTime: new Date(policy.createdDateTime),
        modifiedDateTime: new Date(policy.modifiedDateTime)
      }))

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to get Conditional Access policies: ${(error as Error).message}`,
        'CA_POLICIES_FAILED'
      )
    }
  }

  /**
   * Get risky users from Identity Protection
   */
  async getRiskyUsers(): Promise<RiskyUser[]> {
    try {
      const response = await this.client
        .api('/identityProtection/riskyUsers')
        .get()

      const riskyUsersPromises = response.value.map(async (user: any) => {
        try {
          // Get risk detections for each user
          const detectionsResponse = await this.client
            .api(`/identityProtection/riskDetections`)
            .filter(`userId eq '${user.id}'`)
            .get()

          return {
            id: user.id,
            userPrincipalName: user.userPrincipalName,
            displayName: user.userDisplayName,
            riskLevel: user.riskLevel,
            riskState: user.riskState,
            riskDetections: detectionsResponse.value.map((detection: any) => ({
              id: detection.id,
              detectionTimingType: detection.detectionTimingType,
              riskType: detection.riskType,
              riskLevel: detection.riskLevel,
              location: detection.location ? {
                city: detection.location.city,
                state: detection.location.state,
                country: detection.location.countryOrRegion
              } : undefined,
              ipAddress: detection.ipAddress,
              detectedDateTime: new Date(detection.detectedDateTime)
            })),
            lastUpdated: new Date(user.riskLastUpdatedDateTime)
          }
        } catch (error) {
          // Return user without detections if we can't fetch them
          return {
            id: user.id,
            userPrincipalName: user.userPrincipalName,
            displayName: user.userDisplayName,
            riskLevel: user.riskLevel,
            riskState: user.riskState,
            riskDetections: [],
            lastUpdated: new Date(user.riskLastUpdatedDateTime)
          }
        }
      })

      return await Promise.all(riskyUsersPromises)

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to get risky users: ${(error as Error).message}`,
        'RISKY_USERS_FAILED'
      )
    }
  }

  /**
   * Get SharePoint sites for Copilot assessment
   */
  async getSharePointSites(): Promise<any[]> {
    try {
      const response = await this.client
        .api('/sites')
        .expand('drive')
        .get()

      return response.value || []

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to get SharePoint sites: ${(error as Error).message}`,
        'SHAREPOINT_SITES_FAILED'
      )
    }
  }

  /**
   * Get Teams information for Copilot assessment
   */
  async getTeamsData(): Promise<any[]> {
    try {
      const response = await this.client
        .api('/teams')
        .expand('channels')
        .get()

      return response.value || []

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to get Teams data: ${(error as Error).message}`,
        'TEAMS_DATA_FAILED'
      )
    }
  }

  /**
   * Get DLP policies
   */
  async getDLPPolicies(): Promise<any[]> {
    try {
      // Note: DLP policies require different permissions and endpoints
      // This is a placeholder implementation
      const response = await this.client
        .api('/security/informationProtection/labelPolicySettings')
        .get()

      return response.value || []

    } catch (error) {
      // DLP policies might not be accessible with current permissions
      logger.warn('DLP policies not accessible:', error)
      return []
    }
  }

  /**
   * Get organization information
   */
  async getOrganizationInfo(): Promise<any> {
    try {
      const response = await this.client
        .api('/organization')
        .get()

      return response.value?.[0] || {}

    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to get organization info: ${(error as Error).message}`,
        'ORG_INFO_FAILED'
      )
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.api('/me').get()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get current user context
   */
  async getCurrentUser(): Promise<any> {
    try {
      return await this.client.api('/me').get()
    } catch (error) {
      throw new SecurityPlatformError(
        `Failed to get current user: ${(error as Error).message}`,
        'CURRENT_USER_FAILED'
      )
    }
  }
}

export default MicrosoftGraphService
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-modules-shar');
