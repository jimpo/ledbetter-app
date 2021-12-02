<script lang="ts">
	import axios from 'axios';
	import {Link} from 'svelte-navigator';
	import type {LEDDriver} from 'ledbetter-common';
	import type {Option} from './types';
	import FancySelect from './FancySelect.svelte';
	import {createEventDispatcher} from "svelte";

	const dispatch = createEventDispatcher();

	let drivers: Map<string, LEDDriver> = new Map<string, LEDDriver>();
	export let selected: LEDDriver | null = null;

	const defaultOption = {value: '', label: 'Browser demo'};
	let selectedOption: Option | null;

	function driverOption({id, name}: LEDDriver): Option {
		return {value: id, label: name};
	}

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
		newOptions.push(...newDrivers.map(driverOption));
		return newOptions;
	}

	function onSelect(option: Option | null) {
		const newSelected = (option.value && drivers.get(option.value)) || null;
		dispatch('select', newSelected);
		selected = newSelected;
	}

	$: selectedOption = selected ? driverOption(selected) : defaultOption;
</script>

<FancySelect
	defaultLabel={defaultOption.label}
	searchPlaceholder='Search LED drivers'
	loadOptions={loadOptions}
	selected={selectedOption}
	on:select={({detail}) => onSelect(detail)}
>
	<Link class="dropdown-item" to="/drivers/new">Register new driver</Link>
	<hr class="dropdown-divider"/>
</FancySelect>
