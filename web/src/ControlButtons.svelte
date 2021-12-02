<script lang="ts">
	import type {DriverStatus} from 'ledbetter-common';
	import axios, {AxiosResponse} from "axios";
	import type {RunPayload} from './types';

	export let ready: boolean = false;
	export let status: DriverStatus = 'NotPlaying';
	export let driverId: string | null = 	null;
	export let runPayload: RunPayload | null = null;

	let actionPending: boolean = false;

	async function disableWhilePending(promise: Promise<void>) {
		try {
			await promise;
		} finally {
			actionPending = false;
		}
	}

	async function play() {
		if (!ready) {
			return;
		}

		if (driverId) {
			let response: AxiosResponse;
			if (status === 'Paused') {
				response = await axios.post(`/api/drivers/${driverId}/play`, {});
			} else {
				if (!runPayload) {
					console.error('Play button pressed and unable to play');
					return;
				}
				response = await axios.post(`/api/drivers/${driverId}/run`, runPayload);
			}
			if (response.data.status !== 'Playing') {
				console.error("failed to play program", response.data);
			}
		}
		status = 'Playing';
	}

	async function pause() {
		if (driverId) {
			const response = await axios.post(`/api/drivers/${driverId}/pause`, {});
			if (response.data.status !== 'Paused') {
				console.error("failed to pause program", response.data);
			}
		}
		status = 'Paused';
	}

	async function stop() {
		if (driverId) {
			const response = await axios.post(`/api/drivers/${driverId}/stop`, {});
			if (response.data.status !== 'NotPlaying') {
				console.error("failed to stop program", response.data);
			}
		}
		status = 'NotPlaying';
	}
</script>

<button
	class="button is-success is-light"
	class:is-loading={actionPending}
	on:click|preventDefault={() => disableWhilePending(play())}
	disabled={status === 'Playing' || !ready}
>
	<span class="icon">
		<i class="fas fa-play"></i>
	</span>
</button>

<button
	class="button is-warning is-light"
	class:is-loading={actionPending}
	on:click|preventDefault={() => disableWhilePending(pause())}
	disabled={status !== 'Playing'}
>
	<span class="icon">
		<i class="fas fa-pause"></i>
	</span>
</button>

<button
	class="button is-danger is-light"
	class:is-loading={actionPending}
	on:click|preventDefault={() => disableWhilePending(stop())}
	disabled={status === 'NotPlaying'}
>
	<span class="icon">
		<i class="fas fa-stop"></i>
	</span>
</button>
