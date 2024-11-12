import sleep from 'sleep-promise';

interface RetryWithFallbackOptions<T> {
	attempts?: number;
	delay?: number;
	checkIfSuccess?: (res: T) => CheckResult;
}

type CheckResult = {
	success: boolean;
	message: string;
	forceAbort?: boolean;
};

export type FallbackResult<T = any> =
	| { ok: true; data: T }
	| { ok: false; message: string; error?: Error };

const DEFAULT_ATTEMPTS = 2;
const DEFAULT_DELAY = 400;

export async function retryWithFallback<T>(
	callback: () => Promise<T>,
	options: RetryWithFallbackOptions<T> = {},
): Promise<FallbackResult<T>> {
	const {
		attempts = DEFAULT_ATTEMPTS,
		delay = DEFAULT_DELAY,
		checkIfSuccess,
	} = options;

	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			const data = await callback();

			if (checkIfSuccess) {
				const { success, message, forceAbort } = checkIfSuccess(data);

				if (forceAbort) {
					return {
						ok: false,
						message,
						error: new Error('Force abort triggered'),
					};
				}

				if (!success) {
					throw new Error(message);
				}
			}

			return { ok: true, data };
		} catch (error: any) {
			if (attempt === attempts) {
				return {
					ok: false,
					message:
						error instanceof Error
							? error.message
							: 'Unknown error occurred',
					error,
				};
			}

			await sleep(delay); // Wait before retrying
		}
	}

	return { ok: false, message: 'Unexpected end of retry loop' };
}
