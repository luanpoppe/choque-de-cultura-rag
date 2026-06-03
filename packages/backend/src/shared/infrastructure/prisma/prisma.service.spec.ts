import { Test, TestingModule } from '@nestjs/testing';
import { EnvService } from '@core/env.service';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: EnvService,
          useValue: {
            getEnvs: () => ({
              DATABASE_URL:
                'postgresql://choque:choque@localhost:6017/choque_rag',
              PORT: 3000,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect on module init', async () => {
    const connect = jest
      .spyOn(service, '$connect')
      .mockResolvedValue(undefined);
    await service.onModuleInit();
    expect(connect).toHaveBeenCalledTimes(1);
    connect.mockRestore();
  });

  it('should disconnect on module destroy', async () => {
    const disconnect = jest
      .spyOn(service, '$disconnect')
      .mockResolvedValue(undefined);
    await service.onModuleDestroy();
    expect(disconnect).toHaveBeenCalledTimes(1);
    disconnect.mockRestore();
  });
});
