import type {Writable} from 'svelte/store';
import type {DriverStatus, Layout} from 'ledbetter-common';
import axios, {AxiosResponse} from "axios";
import type {RunPayload} from "./types";

export interface DriverControl {
	readonly canPlay: boolean;

	play(): Promise<void>;
	pause(): Promise<void>;
	stop(): Promise<void>;
}

export class BrowserAnimationDriver {
	public readonly canPlay: boolean;

	constructor(
		layout: Layout | null,
		programWasm: BufferSource | null,
		private statusStore: Writable<DriverStatus>,
	) {
		this.canPlay = layout !== null && programWasm !== null;
	}

	async play(): Promise<void> {
		if (this.canPlay) {
			this.statusStore.set('Playing');
		}
	}

	async pause(): Promise<void> {
		this.statusStore.set('Paused');
	}

	async stop(): Promise<void> {
		this.statusStore.set('NotPlaying');
	}
}

export class ExternalDriver {
	public readonly canPlay: boolean;

	constructor(
		private driverId: string,
		private runPayload: RunPayload | null,
		private status: DriverStatus,
		private statusStore: Writable<DriverStatus>,
	) {
		this.canPlay = this.status === 'Paused' || this.runPayload !== null;
	}

	async play(): Promise<void> {
		let response: AxiosResponse;
		if (this.status === 'Paused') {
			response = await axios.post(`/api/drivers/${this.driverId}/play`, {});
		} else {
			if (!this.runPayload) {
				console.error('Play button pressed and unable to play');
				return;
			}
			response = await axios.post(`/api/drivers/${this.driverId}/run`, this.runPayload);
		}
		if (response.data.status !== 'Playing') {
			console.error("failed to play program", response.data);
		}
		this.statusStore.set('Playing');
	}

	async pause(): Promise<void> {
		const response = await axios.post(`/api/drivers/${this.driverId}/pause`, {});
		if (response.data.status !== 'Paused') {
			console.error("failed to pause program", response.data);
		}
		this.statusStore.set('Paused');
	}

	async stop(): Promise<void> {
		const response = await axios.post(`/api/drivers/${this.driverId}/stop`, {});
		if (response.data.status !== 'NotPlaying') {
			console.error("failed to stop program", response.data);
		}
		this.statusStore.set('NotPlaying');
	}
}