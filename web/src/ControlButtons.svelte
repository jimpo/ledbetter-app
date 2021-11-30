<script lang="ts">
	import type {DriverStatus} from 'ledbetter-common';

	export let ready: boolean = false;
	export let status: DriverStatus = 'NotPlaying';
	export let onPlay: () => Promise<void>;
	export let onPause: () => Promise<void>;
	export let onStop: () => Promise<void>;

	async function play(): Promise<void> {
		await onPlay();
	}

	async function pause(): Promise<void> {
		await onPause();
	}

	async function stop(): Promise<void> {
		await onStop();
	}
</script>

<button
	class="button is-success is-light"
	on:click|preventDefault={play}
	disabled={status === 'Playing' || !ready}
>
	<span class="icon">
		<i class="fas fa-play"></i>
	</span>
</button>

<button
	class="button is-warning is-light"
	on:click|preventDefault={pause}
	disabled={status !== 'Playing'}
>
	<span class="icon">
		<i class="fas fa-pause"></i>
	</span>
</button>

<button
	class="button is-danger is-light"
	on:click|preventDefault={stop}
	disabled={status === 'NotPlaying'}
>
	<span class="icon">
		<i class="fas fa-stop"></i>
	</span>
</button>