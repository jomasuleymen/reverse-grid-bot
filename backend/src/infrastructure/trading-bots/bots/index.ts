import { Provider } from '@nestjs/common';
import { BybitSpotReverseGridBot } from './bybit/spot-reverse-grid-bot';

export const TRADING_BOTS: Provider[] = [BybitSpotReverseGridBot];
