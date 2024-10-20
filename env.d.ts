declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: string;
			DB_PORT: string;
			DB_HOST: string;
			DB_USER: string;
			DB_PASSWORD: string;
			DB_NAME: string;
			REDIS_HOST: string;
			REDIS_PORT: string;
			REDIS_PASSWORD: string;
			BINANCE_API_KEY: string;
			BINANCE_SECRET_KEY: string;
		}
	}
}

export {};
