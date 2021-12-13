export class UniquenessError extends Error {
	constructor(public field: string, message: string) {
		super(message);
	}
}
