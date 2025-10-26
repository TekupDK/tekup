import { Module, Provider } from '@nestjs/common';
import { SECRETS_PROVIDER } from './secrets.interface';
import { FileEnvSecretsProvider } from './file-env.secrets';

const provider: Provider = {
  provide: SECRETS_PROVIDER,
  useClass: FileEnvSecretsProvider,
};

@Module({
  providers: [provider],
  exports: [provider],
})
export class SecretsModule {}

