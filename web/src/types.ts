export interface Option {
	value: string;
	label: string;
}

export type Status = 'Playing' | 'Paused' | 'Not Playing';

export type RunPayload = {programId: string} | {wasm: string};
