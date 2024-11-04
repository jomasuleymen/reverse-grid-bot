import { Context, Scenes } from 'telegraf';

export class MyContext<S = any> extends Context {
	user: {
		id: number;
	};
	scene: Scenes.SceneContextScene<MyContext<S>, Scenes.WizardSessionData & S>;
	wizard: Scenes.WizardContextWizard<MyContext<S>>;
}

export interface ITelegramBotButton {
	text: string;
	callbackData: string;
}

export const WIZARDS = {
	TRADING_EDIT_CONFIG: 'TRADING_EDIT_CONFIG',
};
