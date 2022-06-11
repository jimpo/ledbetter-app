/** Logic for sending run, play, pause, stop, etc. commands to drivers */

import type {Writable} from 'svelte/store';
import type {DriverStatus, Layout} from 'ledbetter-common';

const ECHO_SERVICE_UUID = '00000000-0000-0000-000f-eedc0de00002';
const ECHO_CHARACTERISTIC_UUID = '00000000-0000-0000-000f-00dc0de00002';

export class DriverControl {
	readonly canPlay: boolean;

	constructor(
		private device: DeviceDriver,
		public status: DriverStatus,
		private programWasm: BufferSource | null,
	) {
		this.canPlay = device.canPlay && (status === 'Paused' || programWasm !== null);
	}

	async play(): Promise<void> {
		if (this.status === 'Paused') {
			await this.device.unpause();
		} else {
			await this.device.play(this.programWasm);
		}
	}

	async pause(): Promise<void> {
		await this.device.pause();
	}

	async stop(): Promise<void> {
		await this.device.stop();
	}
}

export interface DeviceDriver {
	readonly canPlay: boolean;

	play(programWasm: BufferSource): Promise<void>;
	unpause(): Promise<void>;
	pause(): Promise<void>;
	stop(): Promise<void>;

	disconnect(): Promise<void>;
}

export class BrowserAnimationDriver {
	private _canPlay: boolean;

	constructor(
		public layout: Layout | null,
		private statusStore: Writable<DriverStatus>,
	) {
		this._canPlay = layout !== null;
	}

	get canPlay(): boolean {
		return this._canPlay;
	}

	async play(_programWasm: BufferSource): Promise<void> {
		if (this.canPlay) {
			this.statusStore.set('Playing');
		}
	}

	async unpause(): Promise<void> {
		this.statusStore.set('Playing');
	}

	async pause(): Promise<void> {
		this.statusStore.set('Paused');
	}

	async stop(): Promise<void> {
		this.statusStore.set('NotPlaying');
	}

	async disconnect(): Promise<void> {
		this._canPlay = false;
	}
}

// export class ExternalDriver {
// 	public readonly canPlay: boolean;
//
// 	constructor(
// 		private driverId: string,
// 		private runPayload: RunPayload | null,
// 		private status: DriverStatus,
// 		private statusStore: Writable<DriverStatus>,
// 	) {
// 		this.canPlay = this.status === 'Paused' || this.runPayload !== null;
// 	}
//
// 	async play(): Promise<void> {
// 		let response: AxiosResponse;
// 		if (this.status === 'Paused') {
// 			response = await axios.post(`/api/drivers/${this.driverId}/play`, {});
// 		} else if (!this.runPayload) {
// 			console.error('Play button pressed and unable to play');
// 			return;
// 		} else if ('programId' in this.runPayload) {
// 			response = await axios.post(`/api/drivers/${this.driverId}/run-prog`, this.runPayload);
// 		} else {
// 			const {wasm} = this.runPayload;
// 			const formData = new FormData();
// 			formData.append('body', JSON.stringify(null));
// 			formData.append('wasm', new Blob([wasm], {type: 'application/wasm'}));
// 			response = await axios.post(`/api/drivers/${this.driverId}/run-wasm`, formData);
// 		}
// 		if (response.data.status !== 'Playing') {
// 			console.error("failed to play program", response.data);
// 		}
// 		this.statusStore.set('Playing');
// 	}
//
// 	async pause(): Promise<void> {
// 		const response = await axios.post(`/api/drivers/${this.driverId}/pause`, {});
// 		if (response.data.status !== 'Paused') {
// 			console.error("failed to pause program", response.data);
// 		}
// 		this.statusStore.set('Paused');
// 	}
//
// 	async stop(): Promise<void> {
// 		const response = await axios.post(`/api/drivers/${this.driverId}/stop`, {});
// 		if (response.data.status !== 'NotPlaying') {
// 			console.error("failed to stop program", response.data);
// 		}
// 		this.statusStore.set('NotPlaying');
// 	}
// }

export class BluetoothDriver {
	private _canPlay: boolean;

	constructor(
		public device: BluetoothDevice,
	) {
		this._canPlay = true;
	}

	get canPlay(): boolean {
		return this._canPlay;
	}

	async play(): Promise<void> {
		const service = await this.device.gatt.getPrimaryService(ECHO_SERVICE_UUID);
		const characteristic = await service.getCharacteristic(ECHO_CHARACTERISTIC_UUID);

		let resolve = () => {};
		const origCallback = characteristic.oncharacteristicvaluechanged;
		characteristic.oncharacteristicvaluechanged = (event) => {
			origCallback.call(this, event);
			resolve();
		};

		for (let i = 0; i < 100; i++) {
			const receivePromise = new Promise((resolve_) => {
				resolve = () => resolve_(undefined);
			});
			const buffer = new ArrayBuffer(512);
			console.log('writing');
			await characteristic.writeValueWithoutResponse(buffer);
			await receivePromise;
		}

		characteristic.oncharacteristicvaluechanged = origCallback;
	}

	async unpause(): Promise<void> {

	}

	async pause(): Promise<void> {

	}

	async stop(): Promise<void> {

	}

	async disconnect(): Promise<void> {
		this._canPlay = false;
		const service = await this.device.gatt.getPrimaryService(ECHO_SERVICE_UUID);
		const characteristic = await service.getCharacteristic(ECHO_CHARACTERISTIC_UUID);

		await characteristic.stopNotifications();
		this.device.gatt.disconnect();
	}
}

export async function connectBluetoothDevice(
	device: BluetoothDevice,
	statusStore: Writable<DriverStatus>,
): Promise<DeviceDriver> {
	const gatt = await device.gatt.connect();
	const service = await gatt.getPrimaryService(ECHO_SERVICE_UUID);
	const statusCharacteristic = await service.getCharacteristic(ECHO_CHARACTERISTIC_UUID);

	statusCharacteristic.oncharacteristicvaluechanged = (_event) => {
		statusStore.set('Playing');
	};

	await statusCharacteristic.startNotifications();
	return new BluetoothDriver(device);
}
