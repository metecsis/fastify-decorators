import { Initializer, Inject, Service } from '../decorators';
import { configureServiceTest } from './configure-service-test';
import { ServiceMock } from './service-mock';

describe('Testing: configure service test', () => {
    afterEach(() => jest.clearAllMocks());

    it('should be able to configure test for service without dependencies', () => {
        const service = configureServiceTest({ service: ServiceWithoutDependencies });

        const result = service.main();

        expect(result).toBe(true);
    });

    it(`should be able to configure service and all it's dependencies`, () => {
        const service = configureServiceTest({ service: ServiceWithDependencies });

        const result = service.main();

        expect(result).toBe(true);
    });

    it(`should be able to configure service and mock it's dependencies provided via constructor`, () => {
        const srv: ServiceMock = {
            provide: ServiceWithoutDependencies,
            useValue: {
                main() {
                    return false;
                },
            },
        };
        const service = configureServiceTest({ service: ServiceWithDependencies, mocks: [srv] });

        const result = service.main();

        expect(result).toBe(false);
    });

    it(`should be able to configure service and mock it's dependencies provided via @Inject`, () => {
        const srv: ServiceMock = {
            provide: ServiceWithoutDependencies, useValue: {
                main() {
                    return false;
                },
            },
        };
        const service = configureServiceTest({ service: ServiceWithInjection, mocks: [srv] });

        const result = service.main();

        expect(result).toBe(false);
    });

    it('should throw error when instantiating class without service decorator', () => {
        expect(() => configureServiceTest({
            service: class Service {
            }, mocks: [],
        })).toThrow();
    });

    describe('async service setup', () => {
        it(`should be able to configure async service`, async () => {
            const service = configureServiceTest({ service: AsyncService });

            expect(service.initialized).toBe(false);

            await service;

            expect(service.initialized).toBe(true);
        });

        it(`should not call initializer twice`, async () => {
            const service = configureServiceTest({ service: AsyncService });
            jest.spyOn(service, 'init');

            await service.then();
            await service.then();
            await service.then();

            expect(service.init).toHaveBeenCalledTimes(1);
        });

        it('should be able to catch error in async initializer', () =>
            new Promise((resolve, reject) =>
                configureServiceTest({ service: AsyncInvalidService })
                    .catch(() => resolve())
                    .finally(() => reject())));

        describe('Compatibility with Promise', () => {
            it('should support then with one argument', () =>
                new Promise((resolve, reject) =>
                    configureServiceTest({ service: AsyncService })
                        .then(() => resolve())
                        .finally(() => reject())));

            it('should support then with two arguments', () =>
                new Promise((resolve, reject) =>
                    configureServiceTest({ service: AsyncInvalidService })
                        .then(() => reject(), () => resolve())));

            it('should support catch', () =>
                new Promise((resolve, reject) =>
                    configureServiceTest({ service: AsyncInvalidService })
                        .catch(() => resolve())
                        .finally(() => reject())));

            it('should support finally', () =>
                new Promise((resolve) =>
                    configureServiceTest({ service: AsyncService })
                        .finally(() => resolve())));

            it('should not fail with services without initializer', () =>
                new Promise((resolve) =>
                    configureServiceTest({ service: ServiceWithoutDependencies })
                        .finally(() => resolve())));
        });
    });
});

@Service()
class ServiceWithoutDependencies {
    main() {
        return true;
    }
}

@Service()
class ServiceWithDependencies {
    constructor(private srv: ServiceWithoutDependencies) {
    }

    main() {
        return this.srv.main();
    }
}

@Service()
class ServiceWithInjection {
    @Inject(ServiceWithoutDependencies)
    private srv!: ServiceWithoutDependencies;

    main() {
        return this.srv?.main();
    }
}

@Service()
class AsyncService {
    initialized = false;

    @Initializer()
    async init() {
        this.initialized = true;
    }
}

@Service()
class AsyncInvalidService {
    @Initializer()
    async init() {
        throw new Error('Invalid');
    }
}
