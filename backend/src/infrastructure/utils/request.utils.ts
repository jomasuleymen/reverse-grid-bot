import sleep from 'sleep-promise';

interface IRetryWithFallbackOptions<T> {
	attempts?: number;
	delay?: number;
	checkIfSuccess?: (res: T) => { success: boolean; message: string };
}

type IRetryWillFallbackResult<T> =
	| { success: true; data: T }
	| { success: false; error: any };

const DEFAULT_ATTEMPTS = 2;
const DEFAULT_DELAY = 500;

export const retryWithFallback = async <T>(
	callback: () => Promise<T>,
	options: IRetryWithFallbackOptions<T> = {},
): Promise<IRetryWillFallbackResult<T>> => {
	const {
		attempts = DEFAULT_ATTEMPTS,
		delay = DEFAULT_DELAY,
		checkIfSuccess,
	} = options;

	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			const data = await callback();

			if (checkIfSuccess) {
				const { success, message } = checkIfSuccess(data);
				if (!success) {
					throw new Error(message);
				}
			}

			return { success: true, data };
		} catch (error: any) {
			if (attempt === attempts) {
				return { success: false, error };
			}

			await sleep(delay);
		}
	}

	return {
		success: false,
		error: 'Reached end of retryWithFallback without success',
	};
};
