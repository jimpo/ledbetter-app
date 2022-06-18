<script lang="ts">
	import {createEventDispatcher} from "svelte";
	import {LEDBETTER_SERVICE_UUID} from "../driverControl";

	const dispatch = createEventDispatcher();

	export let device: BluetoothDevice | null = null;

	let defaultLabel: string = 'Browser demo';
	let dropdownElement: HTMLDivElement;
	let isActive: boolean = false;

	function onFocusOut(event: FocusEvent) {
		const nowFocused = event.relatedTarget;
		if (!((nowFocused instanceof Node) && dropdownElement.contains(nowFocused)))	{
			isActive = false;
		}
	}

	async function scanDrivers(): Promise<void> {
		device = await navigator.bluetooth.requestDevice({
			filters: [{services: [LEDBETTER_SERVICE_UUID]}],
		});
		dispatch('select', device);
	}

	function selectBrowserDemo(): void {
		device = null;
		dispatch('select', null);
	}
</script>

<style>
	.dropdown.is-fullwidth {
		display: flex;
	}

	.dropdown.is-fullwidth .dropdown-trigger, .dropdown.is-fullwidth .dropdown-menu {
		width: 100%;
	}
</style>

<div
	class="dropdown is-fullwidth"
	class:is-active={isActive}
	bind:this={dropdownElement}
	on:focusout={onFocusOut}
>
	<div class="dropdown-trigger">
		<button
			class="button is-fullwidth"
			aria-haspopup="true"
			aria-controls="dropdown-menu"
			on:click={() => isActive = !isActive}
		>
			<span>{device !== null ? device.name : defaultLabel}</span>
			<span class="icon is-small">
        <i class="fas fa-angle-down" aria-hidden="true"></i>
      </span>
		</button>
	</div>
	<div class="dropdown-menu" role="menu">
		<div class="dropdown-content">
			{#if device !== null}
				<a
					class="dropdown-item"
					href={'#'}
					on:click|preventDefault={selectBrowserDemo}
				>
					Browser demo
				</a>
			{/if}
			<a
				class="dropdown-item"
				href={'#'}
				on:click|preventDefault={scanDrivers}
			>
				Connect to driver
			</a>
		</div>
	</div>
</div>
