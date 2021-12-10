<script lang="ts">
	import type {DriverStatus} from 'ledbetter-common';
	import type {DriverControl} from "../driverControl";

	export let status: DriverStatus;
	export let driverControl: DriverControl;

	let actionPending: boolean = false;

	async function disableWhilePending(promise: Promise<void>) {
		try {
			await promise;
		} finally {
			actionPending = false;
		}
	}
</script>

<button
	class="button is-success is-light"
	class:is-loading={actionPending}
	on:click|preventDefault={() => disableWhilePending(driverControl.play())}
	disabled={status === 'Playing' || !driverControl.canPlay}
>
	<span class="icon">
		<i class="fas fa-play"></i>
	</span>
</button>

<button
	class="button is-warning is-light"
	class:is-loading={actionPending}
	on:click|preventDefault={() => disableWhilePending(driverControl.pause())}
	disabled={status !== 'Playing'}
>
	<span class="icon">
		<i class="fas fa-pause"></i>
	</span>
</button>

<button
	class="button is-danger is-light"
	class:is-loading={actionPending}
	on:click|preventDefault={() => disableWhilePending(driverControl.stop())}
	disabled={status === 'NotPlaying'}
>
	<span class="icon">
		<i class="fas fa-stop"></i>
	</span>
</button>
