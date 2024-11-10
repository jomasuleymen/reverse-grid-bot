import sleep from 'sleep-promise';

interface IRetryWithFallbackOptions<T> {
	attempts: number;
	delay: number;
	checkIfSuccess?: (res: T) => { success: boolean; message: string };
}

type IRetryWillFallbackResult<T> =
	| {
			success: true;
			data: T;
	  }
	| {
			success: false;
			error: any;
	  };

export const retryWithFallback = async <T>(
	callback: () => Promise<T>,
	options: IRetryWithFallbackOptions<T> = {
		attempts: 2,
		delay: 500,
	},
): Promise<IRetryWillFallbackResult<T>> => {
	let { attempts, delay } = options;

	while (attempts > 0) {
		try {
			const data = await callback();

			if (options.checkIfSuccess) {
				const isSuccessRes = options.checkIfSuccess(data);
				if (!isSuccessRes.success)
					throw new Error(isSuccessRes.message);
			}

			return { success: true, data };
		} catch (error: any) {
			attempts -= 1;
			if (attempts === 0) {
				return { success: false, error };
			}

			await sleep(delay); // delay before retry
		}
	}

	return { success: false, error: 'Reached at the end of retryWithFallback' };
};
