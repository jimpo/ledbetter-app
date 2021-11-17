<script lang="ts">
	import axios from 'axios';
	import {Link} from 'svelte-navigator';
	import type {Layout} from 'ledbetter-common';
	import type {Option} from './types';
	import FancySelect from './FancySelect.svelte';

	export let layout: Layout | null;

	let selectedOption: Option | null = null;
	let layouts: Layout[] = [];

	async function loadLayouts(searchQuery: string): Promise<void> {
		const response = await axios.get('/api/layouts', {params: {autocomplete: searchQuery}});
		layouts = response.data;
	}

	async function loadOptions(searchQuery: string): Promise<Option[]> {
		await loadLayouts(searchQuery);
		return layouts.map(({id, name}) => {
			return {value: id, label: name};
		});
	}

	$: layout = layouts.find((layout) => layout.id === selectedOption?.value);
</script>

<FancySelect
	defaultLabel={'Select a layout'}
	searchPlaceholder='Search layouts'
	loadOptions={loadOptions}
	bind:selected={selectedOption}
>
	<Link class="dropdown-item" to="/layouts/new">Create new layout</Link>
	<hr class="dropdown-divider"/>
</FancySelect>
