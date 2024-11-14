import { IProxy } from '@/domain/interfaces/proxy.interface';
import * as fs from 'fs';
import * as path from 'path';

export async function readProxies(): Promise<IProxy[]> {
	const filePath = path.resolve('proxy', 'proxies.json');

	try {
		if (fs.existsSync(filePath)) {
			const data = await fs.promises.readFile(filePath, 'utf-8');
			const jsonData = JSON.parse(data);

			return Array.isArray(jsonData) ? jsonData : [];
		} else {
			return [];
		}
	} catch (error) {
		return [];
	}
}
