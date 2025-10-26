import { TekupConsciousness } from '../TekupConsciousness'

describe('TekupConsciousness', () => {
  let consciousness: TekupConsciousness

  beforeEach(() => {
    consciousness = new TekupConsciousness()
  })

  describe('Initialization', () => {
    it('should create consciousness engine instance', () => {
      expect(consciousness).toBeInstanceOf(TekupConsciousness)
    })

    it('should have initial status', () => {
      const status = consciousness.getStatus()
      expect(status.isBootstrapped).toBe(false)
      expect(status.consciousnessLevel).toBe(0.1)
      expect(status.evolutionStatus).toBe('inactive')
    })
  })

  describe('Bootstrap', () => {
    it('should bootstrap successfully', async () => {
      await expect(consciousness.bootstrap()).resolves.not.toThrow()
      
      const status = consciousness.getStatus()
      expect(status.isBootstrapped).toBe(true)
      expect(status.consciousnessLevel).toBe(0.3)
      expect(status.evolutionStatus).toBe('active')
    })

    it('should not bootstrap twice', async () => {
      await consciousness.bootstrap()
      await consciousness.bootstrap() // Should not throw
      
      const status = consciousness.getStatus()
      expect(status.isBootstrapped).toBe(true)
    })
  })

  describe('Natural Language Processing', () => {
    beforeEach(async () => {
      await consciousness.bootstrap()
    })

    it('should process English requests', async () => {
      const request = {
        id: 'test-1',
        description: 'Create a simple calculator service',
        language: 'en',
        context: {
          domain: 'calculator',
          requirements: ['basic-operations']
        },
        priority: 'medium'
      }

      const result = await consciousness.processNaturalLanguage(request)
      
      expect(result).toBeDefined()
      expect(result.generatedCode).toBeDefined()
      expect(result.tests).toBeInstanceOf(Array)
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should process Danish requests', async () => {
      const request = {
        id: 'test-2',
        description: 'Opret en simpel lommeregner service',
        language: 'da',
        context: {
          domain: 'calculator',
          requirements: ['basic-operations']
        },
        priority: 'medium'
      }

      const result = await consciousness.processNaturalLanguage(request)
      
      expect(result).toBeDefined()
      expect(result.generatedCode).toBeDefined()
      expect(result.tests).toBeInstanceOf(Array)
      expect(result.confidence).toBeGreaterThan(0)
    })
  })

  describe('Collective Problem Solving', () => {
    beforeEach(async () => {
      await consciousness.bootstrap()
    })

    it('should solve problems collectively', async () => {
      const problem = {
        id: 'test-prob-1',
        description: 'Optimize database queries for user management',
        complexity: 6,
        domain: 'performance-optimization',
        constraints: ['maintain-compatibility'],
        urgency: 7
      }

      const solutions = await consciousness.solveProblemCollectively(problem)
      
      expect(solutions).toBeInstanceOf(Array)
      expect(solutions.length).toBeGreaterThan(0)
      
      solutions.forEach(solution => {
        expect(solution.approach).toBeDefined()
        expect(solution.confidence).toBeGreaterThan(0)
        expect(solution.contributors).toBeInstanceOf(Array)
      })
    })
  })

  describe('Evolution', () => {
    beforeEach(async () => {
      await consciousness.bootstrap()
    })

    it('should evolve successfully', async () => {
      const beforeStatus = consciousness.getStatus()
      const beforeLevel = beforeStatus.consciousnessLevel

      await expect(consciousness.evolve()).resolves.not.toThrow()
      
      const afterStatus = consciousness.getStatus()
      expect(afterStatus.consciousnessLevel).toBeGreaterThan(beforeLevel)
    })

    it('should not evolve before bootstrap', async () => {
      const unBootstrapped = new TekupConsciousness()
      
      await expect(unBootstrapped.evolve()).rejects.toThrow(
        'System must be bootstrapped before evolution can begin'
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle natural language processing before bootstrap', async () => {
      const request = {
        id: 'test-error-1',
        description: 'Create a service',
        language: 'en',
        context: { domain: 'test' },
        priority: 'low'
      }

      await expect(consciousness.processNaturalLanguage(request)).rejects.toThrow(
        'System must be bootstrapped before processing requests'
      )
    })

    it('should handle problem solving before bootstrap', async () => {
      const problem = {
        id: 'test-error-2',
        description: 'Test problem',
        complexity: 1,
        domain: 'test',
        constraints: [],
        urgency: 1
      }

      await expect(consciousness.solveProblemCollectively(problem)).rejects.toThrow(
        'System must be bootstrapped before solving problems'
      )
    })
  })
})