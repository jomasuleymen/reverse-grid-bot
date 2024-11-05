import { Injectable } from '@nestjs/common';
import { WebsocketClient } from 'bybit-api';

@Injectable()
export class BybitService {
	private wsClient: WebsocketClient;
	private publicWsClient: WebsocketClient;
	
	constructor() {}
}
