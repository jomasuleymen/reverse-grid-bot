export interface IProxy {
	id: number;
	ip: string;
	login: string;
	password: string;
	port: {
		http: number;
		socket: number;
	};
}
