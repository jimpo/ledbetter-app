<script lang="ts">
	import axios from 'axios';
	import {Link} from 'svelte-navigator';
	import {LEDDriver} from 'ledbetter-common';

	let isActive: boolean = false;
	let searchQuery: string | null = null;
	let drivers: LEDDriver[] = [];
	export let selected: LEDDriver | null = null;

	function selectDriver(driver: LEDDriver | null) {
		selected = driver;
		isActive = false;
	}

	async function loadDrivers(searchQuery: string | null): Promise<void> {
		if (searchQuery !== null) {
			const newDrivers = []
			if ('Browser demo'.startsWith(searchQuery)) {
				newDrivers.push(null);
			}
			const params = {connected: true, autocomplete: searchQuery};
			const response = await axios.get('/api/drivers', {params});
			newDrivers.push(...response.data);
			drivers = newDrivers;
		} else {
			drivers = [];
		}
	}

	$: searchQuery = isActive ? searchQuery : null;
	$: loadDrivers(searchQuery);
</script>

<style>
	.dropdown.is-fullwidth {
	  display: flex;
  }

  .dropdown.is-fullwidth .dropdown-trigger, .dropdown.is-fullwidth .dropdown-menu {
	  width: 100%;
	}
</style>

<div class="dropdown is-fullwidth" class:is-active={isActive}>
	<div class="dropdown-trigger">
		<button
			class="button is-fullwidth"
			aria-haspopup="true"
			aria-controls="dropdown-menu"
			on:click={() => isActive = !isActive}
		>
			{#if selected === null}
			<span>Browser demo</span>
			{:else}
			<span>{selected.name}</span>
			{/if}
			<span class="icon is-small">
        <i class="fas fa-angle-down" aria-hidden="true"></i>
      </span>
		</button>
	</div>
	<div class="dropdown-menu" role="menu">
		<div class="dropdown-content">
			{#if searchQuery === null}
			<Link class="dropdown-item" to="/drivers/new">Register new driver</Link>
			<hr class="dropdown-divider"/>
			{/if}
			<div class="dropdown-item">
				<div class="control has-icons-left has-icons-right">
					<input
						class="input is-rounded"
						type="text"
						placeholder="Search LED drivers"
						bind:value={searchQuery}
						on:focusin={() => searchQuery = ''}
					/>
					<span class="icon is-small is-left">
						<i class="fas fa-search"></i>
					</span>
				</div>
			</div>
			{#if drivers.length > 0}
				<hr class="dropdown-divider"/>
			{/if}
			{#each drivers as driver}
			<a
				class="dropdown-item"
				class:is-active={driver?.id === selected?.id}
				href="#"
				on:click|preventDefault={() => selectDriver(driver)}
			>
				{driver !== null ? driver.name : 'Browser demo'}
			</a>
			{/each}
		</div>
	</div>
</div>
