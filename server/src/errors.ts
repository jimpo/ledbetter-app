export class UniquenessError extends Error {
	constructor(public field: string, message: string) {
		super(message);
	}
}

export class InvalidProgramSourcePathError extends Error {
	constructor(public filePath: string, message: string) {
		super(`invalid file path "${filePath}": ${message}`);
	}
}

export class CompilationError extends Error {
	constructor(public source: Error, public stderr: string) {
		super(`${source.message}\n${stderr}`);
	}
}