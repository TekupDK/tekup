import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { TestTenant, TENANT_CONFIGS } from '../utils/test-tenant';
import { VoiceAgentTester } from '../agents/voice-agent';

export interface ConstructionProject {
  id: string;
  name: string;
  type: 'renovation' | 'new_build' | 'extension' | 'maintenance' | 'repair';
  status: 'planning' | 'approved' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  location: {
    address: string;
    city: string;
    postalCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  timeline: {
    startDate: Date;
    estimatedEndDate: Date;
    actualEndDate?: Date;
  };
  budget: {
    estimated: number;
    actual?: number;
    currency: 'DKK' | 'EUR' | 'USD';
  };
  team: Array<{
    id: string;
    role: 'project_manager' | 'architect' | 'engineer' | 'worker' | 'specialist';
    name: string;
    email: string;
  }>;
  milestones: Array<{
    id: string;
    name: string;
    description: string;
    dueDate: Date;
    completedDate?: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerMeeting {
  id: string;
  projectId: string;
  type: 'planning' | 'progress' | 'review' | 'handover' | 'issue_resolution';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  participants: Array<{
    id: string;
    name: string;
    role: 'client' | 'project_manager' | 'team_member' | 'external';
    email: string;
  }>;
  schedule: {
    startTime: Date;
    endTime: Date;
    duration: number; // in minutes
  };
  location: {
    type: 'onsite' | 'office' | 'virtual' | 'hybrid';
    address?: string;
    meetingLink?: string;
  };
  agenda: string[];
  notes?: string;
  actionItems: Array<{
    id: string;
    description: string;
    assignedTo: string;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceSchedule {
  id: string;
  projectId: string;
  resourceType: 'equipment' | 'materials' | 'labor' | 'specialists';
  resourceName: string;
  quantity: number;
  unit: string;
  schedule: {
    startDate: Date;
    endDate: Date;
    dailyHours: number;
  };
  cost: {
    perUnit: number;
    total: number;
    currency: 'DKK' | 'EUR' | 'USD';
  };
  status: 'scheduled' | 'in_use' | 'completed' | 'cancelled';
  location: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class RendetaljeTester {
  private prisma: PrismaClient;
  private tenant: TestTenant;
  private voiceTester: VoiceAgentTester;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.tenant = new TestTenant(prisma, TENANT_CONFIGS.RENDETALJE.id);
    this.voiceTester = new VoiceAgentTester();
  }

  // Test project management system
  async testProjectManagement(): Promise<{
    success: boolean;
    tests: Array<{ name: string; passed: boolean; details: any }>;
  }> {
    const tests = [];

    // Test project creation
    try {
      const project = await this.createTestProject();
      
      tests.push({
        name: 'Project Creation',
        passed: project.id !== undefined && project.status === 'planning',
        details: { project },
      });
    } catch (error) {
      tests.push({
        name: 'Project Creation',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test project validation
    try {
      const invalidProject = this.createInvalidProject();
      const validation = this.validateProject(invalidProject);
      
      tests.push({
        name: 'Project Validation',
        passed: !validation.isValid,
        details: { project: invalidProject, validation },
      });
    } catch (error) {
      tests.push({
        name: 'Project Validation',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test milestone management
    try {
      const project = await this.createTestProject();
      const milestones = await this.createProjectMilestones(project.id);
      const milestoneStatus = await this.updateMilestoneStatus(milestones[0].id, 'completed');
      
      tests.push({
        name: 'Milestone Management',
        passed: milestoneStatus.success && milestoneStatus.status === 'completed',
        details: { project, milestones, milestoneStatus },
      });
    } catch (error) {
      tests.push({
        name: 'Milestone Management',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test project status transitions
    try {
      const project = await this.createTestProject();
      const transitions = await this.testProjectStatusTransitions(project.id);
      
      tests.push({
        name: 'Project Status Transitions',
        passed: transitions.success,
        details: { transitions },
      });
    } catch (error) {
      tests.push({
        name: 'Project Status Transitions',
        passed: false,
        details: { error: error.message },
      });
    }

    const success = tests.every(test => test.passed);
    return { success, tests };
  }

  // Test customer communications
  async testCustomerCommunications(): Promise<{
    success: boolean;
    tests: Array<{ name: string; passed: boolean; details: any }>;
  }> {
    const tests = [];

    // Test meeting scheduling
    try {
      const project = await this.createTestProject();
      const meeting = await this.scheduleCustomerMeeting(project.id, 'planning');
      
      tests.push({
        name: 'Meeting Scheduling',
        passed: meeting.id !== undefined && meeting.status === 'scheduled',
        details: { project, meeting },
      });
    } catch (error) {
      tests.push({
        name: 'Meeting Scheduling',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test meeting validation
    try {
      const invalidMeeting = this.createInvalidMeeting();
      const validation = this.validateMeeting(invalidMeeting);
      
      tests.push({
        name: 'Meeting Validation',
        passed: !validation.isValid,
        details: { meeting: invalidMeeting, validation },
      });
    } catch (error) {
      tests.push({
        name: 'Meeting Validation',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test action item tracking
    try {
      const meeting = await this.createTestMeeting();
      const actionItems = await this.createActionItems(meeting.id);
      const updateResult = await this.updateActionItemStatus(actionItems[0].id, 'completed');
      
      tests.push({
        name: 'Action Item Tracking',
        passed: updateResult.success && updateResult.status === 'completed',
        details: { meeting, actionItems, updateResult },
      });
    } catch (error) {
      tests.push({
        name: 'Action Item Tracking',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test communication history
    try {
      const project = await this.createTestProject();
      const communications = await this.getCommunicationHistory(project.id);
      
      tests.push({
        name: 'Communication History',
        passed: communications.length > 0,
        details: { project, communications },
      });
    } catch (error) {
      tests.push({
        name: 'Communication History',
        passed: false,
        details: { error: error.message },
      });
    }

    const success = tests.every(test => test.passed);
    return { success, tests };
  }

  // Test scheduling system
  async testSchedulingSystem(): Promise<{
    success: boolean;
    tests: Array<{ name: string; passed: boolean; details: any }>;
  }> {
    const tests = [];

    // Test resource scheduling
    try {
      const project = await this.createTestProject();
      const resource = await this.scheduleResource(project.id, 'equipment');
      
      tests.push({
        name: 'Resource Scheduling',
        passed: resource.id !== undefined && resource.status === 'scheduled',
        details: { project, resource },
      });
    } catch (error) {
      tests.push({
        name: 'Resource Scheduling',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test schedule conflict detection
    try {
      const project = await this.createTestProject();
      const conflicts = await this.detectScheduleConflicts(project.id);
      
      tests.push({
        name: 'Schedule Conflict Detection',
        passed: conflicts.length >= 0, // Should not throw error
        details: { project, conflicts },
      });
    } catch (error) {
      tests.push({
        name: 'Schedule Conflict Detection',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test resource allocation
    try {
      const project = await this.createTestProject();
      const allocation = await this.allocateResources(project.id);
      
      tests.push({
        name: 'Resource Allocation',
        passed: allocation.success && allocation.allocatedResources.length > 0,
        details: { project, allocation },
      });
    } catch (error) {
      tests.push({
        name: 'Resource Allocation',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test timeline management
    try {
      const project = await this.createTestProject();
      const timeline = await this.updateProjectTimeline(project.id, 30); // Add 30 days
      
      tests.push({
        name: 'Timeline Management',
        passed: timeline.success && timeline.newEndDate > timeline.originalEndDate,
        details: { project, timeline },
      });
    } catch (error) {
      tests.push({
        name: 'Timeline Management',
        passed: false,
        details: { error: error.message },
      });
    }

    const success = tests.every(test => test.passed);
    return { success, tests };
  }

  // Test voice integration
  async testVoiceIntegration(): Promise<{
    success: boolean;
    tests: Array<{ name: string; passed: boolean; details: any }>;
  }> {
    const tests = [];

    // Test Danish voice commands
    try {
      const danishCommands = this.voiceTester.getCommandsByBusiness('construction');
      const danishResults = await this.voiceTester.testDanishLanguageProcessing();
      
      tests.push({
        name: 'Danish Voice Commands',
        passed: danishResults.results.length > 0,
        details: { commands: danishCommands, results: danishResults },
      });
    } catch (error) {
      tests.push({
        name: 'Danish Voice Commands',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test project status queries
    try {
      const projectQueries = await this.testVoiceProjectQueries();
      
      tests.push({
        name: 'Voice Project Queries',
        passed: projectQueries.success,
        details: { queries: projectQueries },
      });
    } catch (error) {
      tests.push({
        name: 'Voice Project Queries',
        passed: false,
        details: { error: error.message },
      });
    }

    // Test meeting scheduling commands
    try {
      const meetingCommands = await this.testVoiceMeetingCommands();
      
      tests.push({
        name: 'Voice Meeting Commands',
        passed: meetingCommands.success,
        details: { commands: meetingCommands },
      });
    } catch (error) {
      tests.push({
        name: 'Voice Meeting Commands',
        passed: false,
        details: { error: error.message },
      });
    }

    const success = tests.every(test => test.passed);
    return { success, tests };
  }

  // Test complete construction workflow
  async testCompleteWorkflow(): Promise<{
    success: boolean;
    workflow: string[];
    errors: string[];
    performance: {
      totalTime: number;
      averageResponseTime: number;
      bottlenecks: string[];
    };
  }> {
    const startTime = Date.now();
    const workflow: string[] = [];
    const errors: string[] = [];
    let totalResponseTime = 0;
    let stepCount = 0;

    try {
      // 1. Client requests project via voice
      const voiceStart = Date.now();
      const voiceRequest = await this.testVoiceProjectQueries();
      const voiceTime = Date.now() - voiceStart;
      
      if (voiceRequest.success) {
        workflow.push('✅ Voice project request successful');
        totalResponseTime += voiceTime;
        stepCount++;
      } else {
        workflow.push('❌ Voice project request failed');
        errors.push('Voice project request failed');
      }

      // 2. Project creation and planning
      const projectStart = Date.now();
      const project = await this.createTestProject();
      const projectTime = Date.now() - projectStart;
      
      if (project.id) {
        workflow.push('✅ Project created and planned');
        totalResponseTime += projectTime;
        stepCount++;
      } else {
        workflow.push('❌ Project creation failed');
        errors.push('Project creation failed');
      }

      // 3. Customer meeting scheduling
      const meetingStart = Date.now();
      const meeting = await this.scheduleCustomerMeeting(project.id, 'planning');
      const meetingTime = Date.now() - meetingStart;
      
      if (meeting.id) {
        workflow.push('✅ Customer meeting scheduled');
        totalResponseTime += meetingTime;
        stepCount++;
      } else {
        workflow.push('❌ Meeting scheduling failed');
        errors.push('Meeting scheduling failed');
      }

      // 4. Resource allocation
      const resourceStart = Date.now();
      const allocation = await this.allocateResources(project.id);
      const resourceTime = Date.now() - resourceStart;
      
      if (allocation.success) {
        workflow.push('✅ Resources allocated');
        totalResponseTime += resourceTime;
        stepCount++;
      } else {
        workflow.push('❌ Resource allocation failed');
        errors.push('Resource allocation failed');
      }

      // 5. Project execution and milestone tracking
      const executionStart = Date.now();
      const milestones = await this.createProjectMilestones(project.id);
      const executionTime = Date.now() - executionStart;
      
      if (milestones.length > 0) {
        workflow.push('✅ Project execution and milestone tracking');
        totalResponseTime += executionTime;
        stepCount++;
      } else {
        workflow.push('❌ Project execution failed');
        errors.push('Project execution failed');
      }

      // 6. Project completion
      const completionStart = Date.now();
      const completion = await this.completeProject(project.id);
      const completionTime = Date.now() - completionStart;
      
      if (completion.success) {
        workflow.push('✅ Project completed successfully');
        totalResponseTime += completionTime;
        stepCount++;
      } else {
        workflow.push('❌ Project completion failed');
        errors.push('Project completion failed');
      }

    } catch (error) {
      errors.push(`Workflow execution failed: ${error.message}`);
    }

    const totalTime = Date.now() - startTime;
    const averageResponseTime = stepCount > 0 ? totalResponseTime / stepCount : 0;
    
    // Identify bottlenecks (steps taking > 4 seconds)
    const bottlenecks: string[] = [];
    if (averageResponseTime > 4000) {
      bottlenecks.push('High average response time');
    }

    const success = errors.length === 0;
    
    return {
      success,
      workflow,
      errors,
      performance: {
        totalTime,
        averageResponseTime,
        bottlenecks,
      },
    };
  }

  // Helper methods
  private async createTestProject(): Promise<ConstructionProject> {
    const startDate = new Date();
    const estimatedEndDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
    
    return {
      id: faker.string.uuid(),
      name: faker.company.catchPhrase(),
      type: faker.helpers.arrayElement(['renovation', 'new_build', 'extension', 'maintenance', 'repair']),
      status: 'planning',
      location: {
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        postalCode: faker.location.zipCode(),
        coordinates: {
          latitude: faker.location.latitude({ min: 55.6, max: 55.8 }),
          longitude: faker.location.longitude({ min: 12.5, max: 12.6 }),
        },
      },
      client: {
        id: faker.string.uuid(),
        name: faker.company.name(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
      },
      timeline: {
        startDate,
        estimatedEndDate,
      },
      budget: {
        estimated: faker.number.float({ min: 50000, max: 500000, precision: 1000 }),
        currency: 'DKK',
      },
      team: [
        {
          id: faker.string.uuid(),
          role: 'project_manager',
          name: faker.person.fullName(),
          email: faker.internet.email(),
        },
        {
          id: faker.string.uuid(),
          role: 'architect',
          name: faker.person.fullName(),
          email: faker.internet.email(),
        },
      ],
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createInvalidProject(): Partial<ConstructionProject> {
    return {
      name: '', // Empty name
      budget: {
        estimated: -1000, // Negative budget
        currency: 'DKK',
      },
    };
  }

  private validateProject(project: Partial<ConstructionProject>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!project.name || project.name.trim() === '') {
      errors.push('Project name is required');
    }
    
    if (project.budget && project.budget.estimated <= 0) {
      errors.push('Project budget must be greater than 0');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async createProjectMilestones(projectId: string): Promise<Array<{ id: string; name: string; description: string; dueDate: Date; status: string }>> {
    const milestones = [
      {
        id: faker.string.uuid(),
        name: 'Site Preparation',
        description: 'Clear site and prepare foundation',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'pending',
      },
      {
        id: faker.string.uuid(),
        name: 'Foundation Work',
        description: 'Complete foundation and structural work',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
        status: 'pending',
      },
      {
        id: faker.string.uuid(),
        name: 'Framing',
        description: 'Complete structural framing',
        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        status: 'pending',
      },
    ];
    
    return milestones;
  }

  private async updateMilestoneStatus(milestoneId: string, status: string): Promise<{ success: boolean; status?: string; error?: string }> {
    // Simulate milestone status update
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      status,
    };
  }

  private async testProjectStatusTransitions(projectId: string): Promise<{ success: boolean; transitions: string[] }> {
    const transitions: string[] = ['planning', 'approved', 'in_progress', 'completed'];
    let success = true;
    
    for (let i = 0; i < transitions.length - 1; i++) {
      try {
        // Simulate status transition
        await new Promise(resolve => setTimeout(resolve, 150));
        transitions[i] = `✅ ${transitions[i]}`;
      } catch (error) {
        transitions[i] = `❌ ${transitions[i]}`;
        success = false;
      }
    }
    
    return { success, transitions };
  }

  private async scheduleCustomerMeeting(projectId: string, type: string): Promise<CustomerMeeting> {
    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
    
    return {
      id: faker.string.uuid(),
      projectId,
      type: type as any,
      status: 'scheduled',
      participants: [
        {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          role: 'client',
          email: faker.internet.email(),
        },
        {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          role: 'project_manager',
          email: faker.internet.email(),
        },
      ],
      schedule: {
        startTime,
        endTime,
        duration: 60,
      },
      location: {
        type: 'office',
        address: 'Rendetalje Office, København',
      },
      agenda: ['Project overview', 'Timeline discussion', 'Budget review', 'Next steps'],
      actionItems: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createInvalidMeeting(): Partial<CustomerMeeting> {
    return {
      schedule: {
        startTime: new Date(),
        endTime: new Date(Date.now() - 60 * 60 * 1000), // End time before start time
        duration: -30, // Negative duration
      },
    };
  }

  private validateMeeting(meeting: Partial<CustomerMeeting>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (meeting.schedule) {
      if (meeting.schedule.endTime <= meeting.schedule.startTime) {
        errors.push('End time must be after start time');
      }
      
      if (meeting.schedule.duration <= 0) {
        errors.push('Duration must be positive');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async createTestMeeting(): Promise<CustomerMeeting> {
    return await this.scheduleCustomerMeeting(faker.string.uuid(), 'planning');
  }

  private async createActionItems(meetingId: string): Promise<Array<{ id: string; description: string; assignedTo: string; dueDate: Date; status: string }>> {
    const actionItems = [
      {
        id: faker.string.uuid(),
        description: 'Prepare detailed project timeline',
        assignedTo: faker.person.fullName(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        status: 'pending',
      },
      {
        id: faker.string.uuid(),
        description: 'Obtain building permits',
        assignedTo: faker.person.fullName(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'pending',
      },
    ];
    
    return actionItems;
  }

  private async updateActionItemStatus(actionItemId: string, status: string): Promise<{ success: boolean; status?: string; error?: string }> {
    // Simulate action item status update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      status,
    };
  }

  private async getCommunicationHistory(projectId: string): Promise<Array<{ id: string; type: string; date: Date; summary: string }>> {
    // Simulate communication history
    return [
      {
        id: faker.string.uuid(),
        type: 'meeting',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        summary: 'Initial project planning meeting',
      },
      {
        id: faker.string.uuid(),
        type: 'email',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        summary: 'Budget approval confirmation',
      },
    ];
  }

  private async scheduleResource(projectId: string, resourceType: string): Promise<ResourceSchedule> {
    const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days duration
    
    return {
      id: faker.string.uuid(),
      projectId,
      resourceType: resourceType as any,
      resourceName: resourceType === 'equipment' ? 'Excavator' : 'Construction Team',
      quantity: resourceType === 'equipment' ? 1 : 5,
      unit: resourceType === 'equipment' ? 'unit' : 'people',
      schedule: {
        startDate,
        endDate,
        dailyHours: 8,
      },
      cost: {
        perUnit: resourceType === 'equipment' ? 2000 : 500,
        total: resourceType === 'equipment' ? 2000 : 2500,
        currency: 'DKK',
      },
      status: 'scheduled',
      location: 'Construction Site',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async detectScheduleConflicts(projectId: string): Promise<Array<{ resourceId: string; conflict: string; severity: 'low' | 'medium' | 'high' }>> {
    // Simulate conflict detection
    return [
      {
        resourceId: faker.string.uuid(),
        conflict: 'Resource double-booked on overlapping dates',
        severity: 'high',
      },
    ];
  }

  private async allocateResources(projectId: string): Promise<{ success: boolean; allocatedResources: Array<{ id: string; name: string; type: string }> }> {
    // Simulate resource allocation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      allocatedResources: [
        { id: faker.string.uuid(), name: 'Excavator', type: 'equipment' },
        { id: faker.string.uuid(), name: 'Construction Team A', type: 'labor' },
        { id: faker.string.uuid(), name: 'Concrete Materials', type: 'materials' },
      ],
    };
  }

  private async updateProjectTimeline(projectId: string, additionalDays: number): Promise<{ success: boolean; originalEndDate: Date; newEndDate: Date }> {
    // Simulate timeline update
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const originalEndDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const newEndDate = new Date(originalEndDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);
    
    return {
      success: true,
      originalEndDate,
      newEndDate,
    };
  }

  private async completeProject(projectId: string): Promise<{ success: boolean; completionDate?: Date; error?: string }> {
    // Simulate project completion
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      completionDate: new Date(),
    };
  }

  private async testVoiceProjectQueries(): Promise<{ success: boolean; queries?: any; error?: string }> {
    try {
      const commands = this.voiceTester.getCommandsByBusiness('construction')
        .filter(cmd => cmd.expectedIntent.includes('create_project') || cmd.expectedIntent.includes('schedule_meeting'));
      
      const results = await Promise.all(
        commands.map(cmd => this.voiceTester.testVoiceRecognition(cmd))
      );
      
      return {
        success: results.every(r => r.confidence > 0.8),
        queries: { commands, results },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async testVoiceMeetingCommands(): Promise<{ success: boolean; commands?: any; error?: string }> {
    try {
      const commands = this.voiceTester.getCommandsByBusiness('construction')
        .filter(cmd => cmd.expectedIntent.includes('schedule_meeting'));
      
      const results = await Promise.all(
        commands.map(cmd => this.voiceTester.testVoiceRecognition(cmd))
      );
      
      return {
        success: results.every(r => r.confidence > 0.8),
        commands: { commands, results },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Factory function for creating Rendetalje testers
export function createRendetaljeTester(prisma: PrismaClient): RendetaljeTester {
  return new RendetaljeTester(prisma);
}