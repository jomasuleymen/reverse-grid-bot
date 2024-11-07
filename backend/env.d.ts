declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: 'production' | 'development';
			SERVER_PORT: string;
		}
	}
}

export { };

