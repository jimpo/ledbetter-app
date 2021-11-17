<script lang="ts">
	import axios from 'axios';
	import {Link} from 'svelte-navigator';
	import type {LEDDriver} from 'ledbetter-common';
	import type {Option} from './types';
	import FancySelect from './FancySelect.svelte';

	let drivers: Map<string, LEDDriver> = new Map<string, LEDDriver>();
	export let selected: LEDDriver | null = null;

	const defaultOption = {value: '', label: 'Browser demo'};
	let selectedOption: Option | null = defaultOption;

	async function loadDrivers(searchQuery: string): Promise<LEDDriver[]> {
		const params = {connected: true, autocomplete: searchQuery};
		const response = await axios.get('/api/drivers', {params});
		const newDrivers: LEDDriver[] = response.data;
		drivers = new Map(newDrivers.map((driver) => [driver.id, driver]));
		return newDrivers;
	}

	async function loadOptions(searchQuery: string): Promise<Option[]> {
		const newOptions = []
		if (defaultOption.label.startsWith(searchQuery)) {
			newOptions.push(defaultOption);
		}
		const newDrivers = await loadDrivers(searchQuery);
		newOptions.push(...newDrivers.map((driver) => {
			return {value: driver.id, label: driver.name};
		}));
		return newOptions;
	}

	$: {
		if (!selectedOption.value) {
			selected = null;
		} else {
			const newSelected = drivers.get(selectedOption.value);
			if (newSelected) {
				selected = newSelected;
			}
		}
	}
</script>

<FancySelect
	defaultLabel={defaultOption.label}
	searchPlaceholder='Search LED drivers'
	loadOptions={loadOptions}
	bind:selected={selectedOption}
>
	<Link class="dropdown-item" to="/drivers/new">Register new driver</Link>
	<hr class="dropdown-divider"/>
</FancySelect>
