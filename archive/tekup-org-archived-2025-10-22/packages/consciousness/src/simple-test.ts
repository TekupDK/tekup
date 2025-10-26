import { TekupConsciousness } from './TekupConsciousness'
import { createLogger } from '@tekup/shared';
const logger = createLogger('packages-consciousness-src-sim');


async function simpleTest() {
  logger.info('🧠 Simple Consciousness Test...')
  
  try {
    const consciousness = new TekupConsciousness()
    
    logger.info('✅ Consciousness engine created')
    
    const status = consciousness.getStatus()
    logger.info('Initial status:', status.isBootstrapped)
    logger.info('Consciousness level:', status.consciousnessLevel)
    
    logger.info('✅ Test completed successfully')
    
  } catch (error) {
    logger.error('❌ Test failed:', error)
  }
}

simpleTest().catch(console.error)