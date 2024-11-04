import bcrypt from "bcrypt";

export const hashPlainText = (plainText: string) => {
	return bcrypt.hashSync(plainText, 7);
};

export const compareHash = (plainText: string, hash: string) => {
	return bcrypt.compareSync(plainText, hash);
};
