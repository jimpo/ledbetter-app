<script lang="ts">
	import axios from 'axios';
	import {Link} from 'svelte-navigator';
	import type {Layout} from 'ledbetter-common';
	import type {Option} from './types';
	import FancySelect from './FancySelect.svelte';

	export let layout: Layout | null;

	let selectedOption: Option | null;
	let layouts: Layout[] = [];

	function layoutOption({id, name}: Layout): Option {
		return {value: id, label: name};
	}

	async function loadLayouts(searchQuery: string): Promise<void> {
		const response = await axios.get('/api/layouts', {params: {autocomplete: searchQuery}});
		layouts = response.data;
	}

	async function loadOptions(searchQuery: string): Promise<Option[]> {
		await loadLayouts(searchQuery);
		return layouts.map(layoutOption);
	}

	function onSelect(option: Option | null) {
		layout = layouts.find((layout) => layout.id === option?.value) || null;
	}

	$: selectedOption = layout && layoutOption(layout);
</script>

<FancySelect
	defaultLabel={'Select a layout'}
	searchPlaceholder='Search layouts'
	loadOptions={loadOptions}
	selected={selectedOption}
	on:select={({detail}) => onSelect(detail)}
>
	{#if layout}
		<Link class="dropdown-item" to={`/layouts/${layout.id}`}>
			Show Details
		</Link>
	{/if}
	<Link class="dropdown-item" to="/layouts/new">Create new layout</Link>
	<hr class="dropdown-divider"/>
</FancySelect>
