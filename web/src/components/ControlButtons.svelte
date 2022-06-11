<script lang="ts">
	import type {DriverControl} from "../driverControl";

	export let driver: DriverControl;

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
	on:click|preventDefault={() => disableWhilePending(driver.play())}
	disabled={driver.status === 'Playing' || !driver.canPlay}
>
	<span class="icon">
		<i class="fas fa-play"></i>
	</span>
</button>

<button
	class="button is-warning is-light"
	class:is-loading={actionPending}
	on:click|preventDefault={() => disableWhilePending(driver.pause())}
	disabled={driver.status !== 'Playing'}
>
	<span class="icon">
		<i class="fas fa-pause"></i>
	</span>
</button>

<button
	class="button is-danger is-light"
	class:is-loading={actionPending}
	on:click|preventDefault={() => disableWhilePending(driver.stop())}
	disabled={driver.status === 'NotPlaying'}
>
	<span class="icon">
		<i class="fas fa-stop"></i>
	</span>
</button>
