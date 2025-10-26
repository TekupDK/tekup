# TekUp Secure Platform (`apps/secure-platform`)

A comprehensive security and compliance platform designed specifically for Danish SMEs, providing NIS2 compliance, Microsoft 365 Copilot readiness, automated security assessments, and integrated backup solutions.

## 🏗️ Architecture Overview

The TekUp Secure Platform serves as a centralized security hub that monitors, assesses, and maintains the security posture of small and medium-sized businesses, with particular focus on Danish regulatory requirements and Microsoft 365 environments.

### Core Architecture

```mermaid
graph TB
    subgraph "Secure Platform Core"
        A[NestJS API] --> B[Compliance Engine]
        A --> C[Security Scanner]
        A --> D[Backup Manager]
        A --> E[Monitoring System]
    end
    
    subgraph "Compliance Modules"
        F[NIS2 Compliance] --> G[Risk Assessment]
        F --> H[Incident Response]
        F --> I[Audit Logging]
        J[GDPR Module] --> K[Data Protection]
        J --> L[Privacy Impact Assessment]
    end
    
    subgraph "Integration Layer"
        M[Microsoft 365 API] --> N[Copilot Readiness]
        M --> O[Security Center]
        P[Azure AD Integration] --> Q[Identity Management]
        R[Third-party Security Tools] --> S[SIEM Integration]
    end
    
    subgraph "Data Layer"
        T[PostgreSQL] --> U[Compliance Data]
        T --> V[Security Events]
        T --> W[Audit Trails]
    end
    
    B --> F
    B --> J
    C --> M
    C --> R
    D --> M
    E --> T
```

## 🚀 Tech Stack

- **Framework**: NestJS 10 (TypeScript)
- **Database**: PostgreSQL with compliance-grade audit logging
- **Security**: Advanced encryption, secure key management
- **Integrations**: Microsoft Graph API, Azure AD, Security APIs
- **Compliance**: NIS2, GDPR, ISO 27001 frameworks
- **Monitoring**: Real-time security event processing
- **Documentation**: OpenAPI/Swagger with security schemas

## ✨ Key Features

### 🛡️ NIS2 Compliance Management
- **Automated Risk Assessments** with Danish regulatory alignment
- **Incident Response Workflows** with mandatory reporting
- **Supply Chain Security** monitoring and assessment
- **Cybersecurity Measures** implementation and tracking
- **Governance Framework** with board-level reporting
- **Continuous Monitoring** of security posture

### 🔒 Microsoft 365 Copilot Readiness
- **Data Classification** and sensitivity labeling
- **Information Protection** policy enforcement
- **Access Control** optimization for AI features
- **Compliance Boundary** configuration and monitoring
- **Data Loss Prevention** (DLP) policy alignment
- **Audit and Monitoring** for AI interactions

### 📊 Security Assessment Engine
- **Automated Vulnerability Scanning** across IT infrastructure
- **Configuration Assessment** against security baselines
- **Penetration Testing** coordination and reporting
- **Security Metrics** and KPI tracking
- **Risk Scoring** with business impact analysis
- **Remediation Tracking** with priority management

### 💾 Integrated Backup Solutions
- **Microsoft 365 Backup** with point-in-time recovery
- **On-premises Data Protection** with encryption
- **Cloud Storage Integration** with multiple providers
- **Automated Backup Verification** and testing
- **Disaster Recovery Planning** with RTO/RPO targets
- **Compliance-grade Retention** policies

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# API Configuration
SECURE_PLATFORM_PORT=4002
SECURE_PLATFORM_URL=http://localhost:4002

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tekup_secure?schema=public

# Microsoft 365 Integration
MICROSOFT_TENANT_ID=your_tenant_id
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
GRAPH_API_SCOPE=https://graph.microsoft.com/.default

# Azure AD Integration
AZURE_AD_TENANT_ID=your_azure_tenant_id
AZURE_AD_CLIENT_ID=your_azure_client_id
AZURE_AD_CLIENT_SECRET=your_azure_client_secret

# Security Services
SECURITY_CENTER_API_KEY=your_security_center_key
DEFENDER_API_ENDPOINT=https://api.securitycenter.microsoft.com
SENTINEL_WORKSPACE_ID=your_sentinel_workspace_id

# Compliance Configuration
NIS2_REPORTING_ENDPOINT=https://nis2.dk/api/reports
GDPR_DPA_ENDPOINT=https://datatilsynet.dk/api
COMPLIANCE_ENCRYPTION_KEY=your_encryption_key

# Backup Services
AZURE_STORAGE_ACCOUNT=your_storage_account
AZURE_STORAGE_KEY=your_storage_key
AWS_S3_BUCKET=your_backup_bucket
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret

# Monitoring
SIEM_ENDPOINT=https://your-siem.com/api
SECURITY_WEBHOOK_URL=https://your-webhook.com/security
ALERT_EMAIL=security@yourcompany.com
```

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18.18.0+
- PostgreSQL 14+
- Microsoft 365 tenant with appropriate licenses
- Azure AD application registration
- pnpm 9.9.0+

### Installation & Setup

```bash
# Install dependencies
pnpm install

# Setup database
pnpm --filter @tekup/secure-platform prisma:generate
pnpm --filter @tekup/secure-platform prisma:migrate

# Start development server
pnpm --filter @tekup/secure-platform dev
```

The platform will be available at `http://localhost:4002` with API documentation at `http://localhost:4002/api`.

## 🛡️ NIS2 Compliance Implementation

### Risk Assessment Framework

```typescript
// NIS2 risk assessment implementation
class NIS2RiskAssessment {
  async conductRiskAssessment(organizationId: string): Promise<NIS2Assessment> {
    const assessment = {
      organizationId,
      assessmentDate: new Date(),
      riskCategories: await this.assessRiskCategories(organizationId),
      cybersecurityMeasures: await this.evaluateCybersecurityMeasures(organizationId),
      incidentResponseCapability: await this.assessIncidentResponse(organizationId),
      supplyChainSecurity: await this.assessSupplyChain(organizationId),
      governanceFramework: await this.assessGovernance(organizationId),
    };
    
    const overallRiskScore = this.calculateOverallRisk(assessment);
    const recommendations = await this.generateRecommendations(assessment);
    
    return {
      ...assessment,
      overallRiskScore,
      recommendations,
      complianceStatus: this.determineComplianceStatus(overallRiskScore),
      nextAssessmentDate: this.calculateNextAssessmentDate(),
    };
  }
  
  private async assessRiskCategories(organizationId: string): Promise<RiskCategory[]> {
    const categories = [
      'network_security',
      'system_security',
      'data_protection',
      'access_control',
      'incident_management',
      'business_continuity',
      'supply_chain',
      'governance',
    ];
    
    const assessments = await Promise.all(
      categories.map(category => this.assessCategory(organizationId, category))
    );
    
    return assessments;
  }
  
  private async evaluateCybersecurityMeasures(organizationId: string): Promise<CybersecurityMeasures> {
    return {
      technicalMeasures: await this.assessTechnicalMeasures(organizationId),
      organizationalMeasures: await this.assessOrganizationalMeasures(organizationId),
      physicalMeasures: await this.assessPhysicalMeasures(organizationId),
      implementationStatus: await this.getImplementationStatus(organizationId),
    };
  }
}
```

### Incident Response System

```typescript
// NIS2-compliant incident response
class NIS2IncidentResponse {
  async reportIncident(incident: SecurityIncident): Promise<IncidentReport> {
    // Classify incident severity according to NIS2
    const severity = this.classifyIncidentSeverity(incident);
    
    // Create incident record
    const incidentRecord = await this.createIncidentRecord({
      ...incident,
      severity,
      reportingDeadline: this.calculateReportingDeadline(severity),
      nis2Classification: this.getNIS2Classification(incident),
    });
    
    // Immediate response actions
    if (severity === 'significant' || severity === 'substantial') {
      await this.triggerImmediateResponse(incidentRecord);
      
      // Notify relevant authorities within 24 hours for significant incidents
      if (severity === 'significant') {
        await this.notifyAuthorities(incidentRecord);
      }
    }
    
    // Start incident response workflow
    await this.initiateResponseWorkflow(incidentRecord);
    
    return {
      incidentId: incidentRecord.id,
      severity,
      reportingDeadline: incidentRecord.reportingDeadline,
      nextActions: await this.getNextActions(incidentRecord),
    };
  }
  
  private classifyIncidentSeverity(incident: SecurityIncident): IncidentSeverity {
    const impactFactors = {
      affectedUsers: incident.affectedUsers || 0,
      dataCompromised: incident.dataCompromised || false,
      serviceDisruption: incident.serviceDisruption || 0, // hours
      financialImpact: incident.estimatedFinancialImpact || 0,
      reputationalImpact: incident.reputationalImpact || 'low',
    };
    
    // NIS2 severity classification logic
    if (impactFactors.affectedUsers > 500000 || 
        impactFactors.serviceDisruption > 24 ||
        impactFactors.financialImpact > 1000000) {
      return 'significant';
    } else if (impactFactors.affectedUsers > 100000 ||
               impactFactors.serviceDisruption > 6 ||
               impactFactors.dataCompromised) {
      return 'substantial';
    } else {
      return 'minor';
    }
  }
}
```

## 🤖 Microsoft 365 Copilot Readiness

### Data Classification Service

```typescript
// Microsoft 365 Copilot readiness assessment
class CopilotReadinessService {
  private graphClient: Client;
  
  constructor() {
    this.graphClient = Client.init({
      authProvider: this.getAuthProvider(),
    });
  }
  
  async assessCopilotReadiness(tenantId: string): Promise<CopilotReadinessReport> {
    const assessment = {
      dataClassification: await this.assessDataClassification(),
      informationProtection: await this.assessInformationProtection(),
      accessControls: await this.assessAccessControls(),
      complianceBoundaries: await this.assessComplianceBoundaries(),
      auditingCapabilities: await this.assessAuditingCapabilities(),
      dataLossPrevention: await this.assessDLPPolicies(),
    };
    
    const readinessScore = this.calculateReadinessScore(assessment);
    const recommendations = this.generateCopilotRecommendations(assessment);
    
    return {
      tenantId,
      assessmentDate: new Date(),
      readinessScore,
      assessment,
      recommendations,
      estimatedTimeToReadiness: this.estimateTimeToReadiness(recommendations),
    };
  }
  
  private async assessDataClassification(): Promise<DataClassificationAssessment> {
    // Get sensitivity labels
    const sensitivityLabels = await this.graphClient
      .api('/security/informationProtection/sensitivityLabels')
      .get();
    
    // Assess data classification coverage
    const classificationCoverage = await this.assessClassificationCoverage();
    
    // Check auto-labeling policies
    const autoLabelingPolicies = await this.graphClient
      .api('/security/informationProtection/labelPolicies')
      .get();
    
    return {
      sensitivityLabelsConfigured: sensitivityLabels.value.length,
      classificationCoverage,
      autoLabelingEnabled: autoLabelingPolicies.value.length > 0,
      recommendedActions: this.getDataClassificationRecommendations(
        sensitivityLabels.value,
        classificationCoverage
      ),
    };
  }
  
  private async assessInformationProtection(): Promise<InformationProtectionAssessment> {
    // Check DLP policies
    const dlpPolicies = await this.graphClient
      .api('/security/informationProtection/dlpPolicies')
      .get();
    
    // Assess encryption policies
    const encryptionPolicies = await this.assessEncryptionPolicies();
    
    // Check rights management
    const rightsManagement = await this.assessRightsManagement();
    
    return {
      dlpPoliciesActive: dlpPolicies.value.filter(p => p.status === 'active').length,
      encryptionCoverage: encryptionPolicies.coverage,
      rightsManagementEnabled: rightsManagement.enabled,
      protectionScore: this.calculateProtectionScore({
        dlpPolicies: dlpPolicies.value,
        encryptionPolicies,
        rightsManagement,
      }),
    };
  }
}
```

### Compliance Boundary Management

```typescript
// Compliance boundary configuration for Copilot
class ComplianceBoundaryService {
  async configureComplianceBoundaries(
    tenantId: string,
    boundaryConfig: ComplianceBoundaryConfig
  ): Promise<ComplianceBoundaryResult> {
    // Create information barriers
    const informationBarriers = await this.createInformationBarriers(boundaryConfig);
    
    // Configure sensitivity labels for boundaries
    const sensitivityLabels = await this.configureBoundarySensitivityLabels(boundaryConfig);
    
    // Set up conditional access policies
    const conditionalAccess = await this.configureConditionalAccess(boundaryConfig);
    
    // Configure data loss prevention for boundaries
    const dlpPolicies = await this.configureBoundaryDLP(boundaryConfig);
    
    return {
      informationBarriers,
      sensitivityLabels,
      conditionalAccess,
      dlpPolicies,
      boundaryStatus: 'configured',
      validationResults: await this.validateBoundaryConfiguration(tenantId),
    };
  }
  
  private async createInformationBarriers(
    config: ComplianceBoundaryConfig
  ): Promise<InformationBarrier[]> {
    const barriers = [];
    
    for (const boundary of config.boundaries) {
      const barrier = await this.graphClient
        .api('/security/informationBarriers')
        .post({
          displayName: boundary.name,
          description: boundary.description,
          state: 'active',
          segments: boundary.segments.map(segment => ({
            displayName: segment.name,
            description: segment.description,
            userGroupFilter: segment.userFilter,
          })),
        });
      
      barriers.push(barrier);
    }
    
    return barriers;
  }
}
```

## 🔍 Security Assessment Engine

### Automated Vulnerability Scanning

```typescript
// Comprehensive security assessment
class SecurityAssessmentEngine {
  async conductSecurityAssessment(organizationId: string): Promise<SecurityAssessment> {
    const assessment = {
      organizationId,
      assessmentDate: new Date(),
      infrastructureAssessment: await this.assessInfrastructure(organizationId),
      applicationAssessment: await this.assessApplications(organizationId),
      networkAssessment: await this.assessNetwork(organizationId),
      identityAssessment: await this.assessIdentityManagement(organizationId),
      dataProtectionAssessment: await this.assessDataProtection(organizationId),
      complianceAssessment: await this.assessCompliance(organizationId),
    };
    
    const overallScore = this.calculateSecurityScore(assessment);
    const criticalFindings = this.identifyCriticalFindings(assessment);
    const recommendations = await this.generateSecurityRecommendations(assessment);
    
    return {
      ...assessment,
      overallScore,
      criticalFindings,
      recommendations,
      nextAssessmentDate: this.scheduleNextAssessment(overallScore),
    };
  }
  
  private async assessInfrastructure(organizationId: string): Promise<InfrastructureAssessment> {
    // Scan for vulnerabilities
    const vulnerabilities = await this.scanForVulnerabilities(organizationId);
    
    // Check patch management
    const patchStatus = await this.assessPatchManagement(organizationId);
    
    // Evaluate configuration security
    const configurationSecurity = await this.assessConfigurationSecurity(organizationId);
    
    // Check endpoint protection
    const endpointProtection = await this.assessEndpointProtection(organizationId);
    
    return {
      vulnerabilities: {
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        medium: vulnerabilities.filter(v => v.severity === 'medium').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length,
      },
      patchManagement: {
        upToDateSystems: patchStatus.upToDate,
        outdatedSystems: patchStatus.outdated,
        patchingScore: patchStatus.score,
      },
      configurationSecurity: {
        secureConfigurations: configurationSecurity.secure,
        insecureConfigurations: configurationSecurity.insecure,
        configurationScore: configurationSecurity.score,
      },
      endpointProtection: {
        protectedEndpoints: endpointProtection.protected,
        unprotectedEndpoints: endpointProtection.unprotected,
        protectionScore: endpointProtection.score,
      },
    };
  }
}
```

### Risk Scoring Algorithm

```typescript
// Advanced risk scoring with business context
class RiskScoringEngine {
  calculateRiskScore(
    vulnerability: Vulnerability,
    businessContext: BusinessContext
  ): RiskScore {
    // Base CVSS score
    const baseCVSS = vulnerability.cvssScore || 0;
    
    // Business impact multipliers
    const businessImpactMultiplier = this.calculateBusinessImpact(
      vulnerability,
      businessContext
    );
    
    // Threat intelligence factor
    const threatIntelligence = this.getThreatIntelligenceFactor(vulnerability);
    
    // Exploitability factor
    const exploitability = this.getExploitabilityFactor(vulnerability);
    
    // Asset criticality
    const assetCriticality = this.getAssetCriticality(
      vulnerability.affectedAssets,
      businessContext
    );
    
    // Calculate final risk score
    const riskScore = (
      baseCVSS * 
      businessImpactMultiplier * 
      threatIntelligence * 
      exploitability * 
      assetCriticality
    ) / 10; // Normalize to 0-10 scale
    
    return {
      score: Math.min(riskScore, 10),
      severity: this.categorizeSeverity(riskScore),
      factors: {
        baseCVSS,
        businessImpactMultiplier,
        threatIntelligence,
        exploitability,
        assetCriticality,
      },
      recommendations: this.generateRiskRecommendations(riskScore, vulnerability),
    };
  }
  
  private calculateBusinessImpact(
    vulnerability: Vulnerability,
    context: BusinessContext
  ): number {
    let multiplier = 1.0;
    
    // Critical business systems
    if (context.criticalSystems.includes(vulnerability.systemId)) {
      multiplier *= 1.5;
    }
    
    // Customer-facing systems
    if (context.customerFacingSystems.includes(vulnerability.systemId)) {
      multiplier *= 1.3;
    }
    
    // Compliance-critical systems
    if (context.complianceCriticalSystems.includes(vulnerability.systemId)) {
      multiplier *= 1.4;
    }
    
    // Revenue-generating systems
    if (context.revenueGeneratingSystems.includes(vulnerability.systemId)) {
      multiplier *= 1.6;
    }
    
    return Math.min(multiplier, 2.0); // Cap at 2x multiplier
  }
}
```

## 💾 Backup and Recovery System

### Microsoft 365 Backup Service

```typescript
// Comprehensive Microsoft 365 backup solution
class Microsoft365BackupService {
  private graphClient: Client;
  private storageService: BackupStorageService;
  
  async createBackupJob(
    tenantId: string,
    backupConfig: BackupConfiguration
  ): Promise<BackupJob> {
    const job = await this.backupJobRepository.create({
      tenantId,
      type: backupConfig.type,
      schedule: backupConfig.schedule,
      retentionPolicy: backupConfig.retentionPolicy,
      encryptionEnabled: true,
      status: 'scheduled',
    });
    
    // Schedule backup execution
    await this.scheduleBackupExecution(job);
    
    return job;
  }
  
  async executeBackup(jobId: string): Promise<BackupResult> {
    const job = await this.backupJobRepository.findById(jobId);
    
    try {
      await this.updateJobStatus(jobId, 'running');
      
      const backupData = await this.collectBackupData(job);
      const encryptedData = await this.encryptBackupData(backupData);
      const storageLocation = await this.storageService.store(encryptedData, job);
      
      const result = {
        jobId,
        status: 'completed',
        backupSize: encryptedData.length,
        storageLocation,
        completedAt: new Date(),
        itemsBackedUp: backupData.itemCount,
        verificationStatus: await this.verifyBackup(storageLocation),
      };
      
      await this.updateJobResult(jobId, result);
      return result;
      
    } catch (error) {
      await this.updateJobStatus(jobId, 'failed', error.message);
      throw error;
    }
  }
  
  private async collectBackupData(job: BackupJob): Promise<BackupData> {
    const data = {
      emails: [],
      files: [],
      sites: [],
      teams: [],
      itemCount: 0,
    };
    
    switch (job.type) {
      case 'exchange':
        data.emails = await this.backupExchangeData(job);
        break;
      case 'sharepoint':
        data.files = await this.backupSharePointData(job);
        data.sites = await this.backupSharePointSites(job);
        break;
      case 'teams':
        data.teams = await this.backupTeamsData(job);
        break;
      case 'full':
        data.emails = await this.backupExchangeData(job);
        data.files = await this.backupSharePointData(job);
        data.sites = await this.backupSharePointSites(job);
        data.teams = await this.backupTeamsData(job);
        break;
    }
    
    data.itemCount = data.emails.length + data.files.length + 
                    data.sites.length + data.teams.length;
    
    return data;
  }
  
  private async backupExchangeData(job: BackupJob): Promise<EmailBackupItem[]> {
    const emails = [];
    const users = await this.graphClient.api('/users').get();
    
    for (const user of users.value) {
      const userEmails = await this.graphClient
        .api(`/users/${user.id}/messages`)
        .top(1000) // Batch size
        .get();
      
      for (const email of userEmails.value) {
        emails.push({
          id: email.id,
          subject: email.subject,
          from: email.from,
          to: email.toRecipients,
          body: email.body,
          attachments: await this.getEmailAttachments(user.id, email.id),
          receivedDateTime: email.receivedDateTime,
          userId: user.id,
        });
      }
    }
    
    return emails;
  }
}
```

### Disaster Recovery Planning

```typescript
// Comprehensive disaster recovery management
class DisasterRecoveryService {
  async createRecoveryPlan(
    organizationId: string,
    planConfig: RecoveryPlanConfig
  ): Promise<RecoveryPlan> {
    const plan = {
      organizationId,
      name: planConfig.name,
      description: planConfig.description,
      rtoTargets: planConfig.rtoTargets, // Recovery Time Objectives
      rpoTargets: planConfig.rpoTargets, // Recovery Point Objectives
      criticalSystems: await this.identifyCriticalSystems(organizationId),
      recoveryProcedures: await this.generateRecoveryProcedures(planConfig),
      testSchedule: planConfig.testSchedule,
      contactList: planConfig.emergencyContacts,
      lastTested: null,
      nextTestDate: this.calculateNextTestDate(planConfig.testSchedule),
    };
    
    return this.recoveryPlanRepository.create(plan);
  }
  
  async executeRecoveryTest(planId: string): Promise<RecoveryTestResult> {
    const plan = await this.recoveryPlanRepository.findById(planId);
    const testResult = {
      planId,
      testDate: new Date(),
      testType: 'full', // or 'partial', 'tabletop'
      systemsTestedCount: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      rtoAchieved: {},
      rpoAchieved: {},
      issues: [],
      recommendations: [],
    };
    
    // Test each critical system
    for (const system of plan.criticalSystems) {
      const systemTest = await this.testSystemRecovery(system, plan);
      testResult.systemsTestedCount++;
      
      if (systemTest.success) {
        testResult.successfulRecoveries++;
        testResult.rtoAchieved[system.id] = systemTest.recoveryTime;
        testResult.rpoAchieved[system.id] = systemTest.dataLoss;
      } else {
        testResult.failedRecoveries++;
        testResult.issues.push({
          systemId: system.id,
          issue: systemTest.error,
          severity: 'high',
        });
      }
    }
    
    // Generate recommendations
    testResult.recommendations = await this.generateTestRecommendations(testResult);
    
    // Update plan with test results
    await this.updatePlanTestResults(planId, testResult);
    
    return testResult;
  }
}
```

## 📊 API Endpoints

### Compliance Management

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `GET` | `/compliance/nis2/assessment` | Get NIS2 compliance assessment | ✅ |
| `POST` | `/compliance/nis2/assessment` | Create new NIS2 assessment | ✅ |
| `GET` | `/compliance/gdpr/status` | Get GDPR compliance status | ✅ |
| `POST` | `/compliance/incident/report` | Report security incident | ✅ |
| `GET` | `/compliance/audit-logs` | Get compliance audit logs | ✅ |

### Security Assessment

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `GET` | `/security/assessment` | Get security assessment results | ✅ |
| `POST` | `/security/scan` | Initiate security scan | ✅ |
| `GET` | `/security/vulnerabilities` | List vulnerabilities | ✅ |
| `PATCH` | `/security/vulnerabilities/:id` | Update vulnerability status | ✅ |
| `GET` | `/security/risk-score` | Get overall risk score | ✅ |

### Microsoft 365 Integration

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `GET` | `/m365/copilot/readiness` | Get Copilot readiness assessment | ✅ |
| `POST` | `/m365/copilot/configure` | Configure Copilot settings | ✅ |
| `GET` | `/m365/security/score` | Get Microsoft Secure Score | ✅ |
| `GET` | `/m365/compliance/status` | Get M365 compliance status | ✅ |
| `POST` | `/m365/backup/create` | Create backup job | ✅ |

### Backup and Recovery

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `GET` | `/backup/jobs` | List backup jobs | ✅ |
| `POST` | `/backup/jobs` | Create backup job | ✅ |
| `GET` | `/backup/jobs/:id/status` | Get backup job status | ✅ |
| `POST` | `/recovery/test` | Execute recovery test | ✅ |
| `GET` | `/recovery/plans` | List recovery plans | ✅ |

## 🧪 Testing

### Compliance Testing

```typescript
// NIS2 compliance testing
describe('NIS2 Compliance', () => {
  let complianceService: NIS2ComplianceService;
  
  beforeEach(() => {
    complianceService = new NIS2ComplianceService();
  });
  
  it('should conduct comprehensive risk assessment', async () => {
    const organizationId = 'test-org-123';
    
    const assessment = await complianceService.conductRiskAssessment(organizationId);
    
    expect(assessment.organizationId).toBe(organizationId);
    expect(assessment.riskCategories).toHaveLength(8);
    expect(assessment.overallRiskScore).toBeGreaterThanOrEqual(0);
    expect(assessment.overallRiskScore).toBeLessThanOrEqual(10);
    expect(assessment.complianceStatus).toMatch(/compliant|non-compliant|partial/);
  });
  
  it('should classify incident severity correctly', async () => {
    const significantIncident = {
      affectedUsers: 600000,
      serviceDisruption: 30,
      dataCompromised: true,
    };
    
    const severity = complianceService.classifyIncidentSeverity(significantIncident);
    expect(severity).toBe('significant');
  });
});
```

### Security Assessment Testing

```typescript
// Security assessment testing
describe('Security Assessment Engine', () => {
  let assessmentEngine: SecurityAssessmentEngine;
  
  beforeEach(() => {
    assessmentEngine = new SecurityAssessmentEngine();
  });
  
  it('should calculate accurate risk scores', async () => {
    const vulnerability = {
      cvssScore: 8.5,
      systemId: 'critical-system-1',
      affectedAssets: ['web-server', 'database'],
    };
    
    const businessContext = {
      criticalSystems: ['critical-system-1'],
      customerFacingSystems: ['web-server'],
      revenueGeneratingSystems: ['web-server'],
    };
    
    const riskScore = assessmentEngine.calculateRiskScore(vulnerability, businessContext);
    
    expect(riskScore.score).toBeGreaterThan(8.5); // Should be higher due to business impact
    expect(riskScore.severity).toBe('critical');
    expect(riskScore.recommendations).toBeDefined();
  });
});
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
# Dockerfile for Secure Platform
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
COPY . .
RUN npm run build

FROM base AS runtime
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
RUN npx prisma generate
EXPOSE 4002
CMD ["npm", "run", "start:prod"]
```

### Kubernetes Deployment

```yaml
# Kubernetes deployment for high availability
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tekup-secure-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tekup-secure-platform
  template:
    metadata:
      labels:
        app: tekup-secure-platform
    spec:
      containers:
      - name: secure-platform
        image: tekup/secure-platform:latest
        ports:
        - containerPort: 4002
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: secure-platform-secrets
              key: database-url
        - name: MICROSOFT_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: secure-platform-secrets
              key: microsoft-client-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

## 🔧 Development Scripts

```bash
# Development
pnpm --filter @tekup/secure-platform dev              # Start development server
pnpm --filter @tekup/secure-platform build            # Build for production
pnpm --filter @tekup/secure-platform start:prod       # Start production server

# Database
pnpm --filter @tekup/secure-platform prisma:generate  # Generate Prisma client
pnpm --filter @tekup/secure-platform prisma:migrate   # Run migrations
pnpm --filter @tekup/secure-platform prisma:studio    # Open Prisma Studio

# Testing
pnpm --filter @tekup/secure-platform test             # Run unit tests
pnpm --filter @tekup/secure-platform test:e2e         # Run E2E tests
pnpm --filter @tekup/secure-platform test:security    # Run security tests

# Compliance
pnpm --filter @tekup/secure-platform compliance:check # Check compliance status
pnpm --filter @tekup/secure-platform compliance:report # Generate compliance report

# Security
pnpm --filter @tekup/secure-platform security:scan    # Run security scan
pnpm --filter @tekup/secure-platform security:audit   # Security audit
```

## 🔄 Roadmap

### Phase 1: Core Security Platform ✅
- [x] NIS2 compliance framework
- [x] Basic security assessments
- [x] Microsoft 365 integration
- [x] Incident response system
- [x] Basic backup functionality

### Phase 2: Advanced Features 🚧
- [ ] Advanced threat intelligence integration
- [ ] Automated remediation workflows
- [ ] Advanced analytics and reporting
- [ ] Multi-cloud security assessment
- [ ] Enhanced disaster recovery testing

### Phase 3: Enterprise Features 📋
- [ ] Advanced SIEM integration
- [ ] Custom compliance frameworks
- [ ] Advanced AI-powered threat detection
- [ ] Enterprise-grade backup solutions
- [ ] Advanced governance and risk management

## 🤝 Contributing

1. Follow the [TekUp Development Guidelines](../../docs/CONTRIBUTING.md)
2. Ensure all security tests pass
3. Follow security coding best practices
4. Update compliance documentation
5. Maintain audit trail for all changes

## 📄 License

This project is part of the TekUp ecosystem and is proprietary software.

---

**Built with ❤️ by the TekUp Team**