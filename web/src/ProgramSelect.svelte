<script lang="ts">
	import axios from 'axios';
	import {Link} from 'svelte-navigator';
	import type {ProgramBrief} from 'ledbetter-common';
	import type {Option} from './types';
	import FancySelect from './FancySelect.svelte';

	export let program: ProgramBrief | null;

	let selectedOption: Option | null = null;
	let programs: ProgramBrief[] = [];

	async function loadPrograms(searchQuery: string): Promise<void> {
		const response = await axios.get('/api/programs', {params: {autocomplete: searchQuery}});
		programs = response.data;
		//programWasm = decodeBase64(response.data.wasm);
	}

	async function loadOptions(searchQuery: string): Promise<Option[]> {
		await loadPrograms(searchQuery);
		return programs.map(({id, name}) => {
			return {value: id, label: name};
		});
	}

	$: program = programs.find((program) => program.id === selectedOption?.value) || null;
</script>

<FancySelect
	defaultLabel={'Select a program'}
	searchPlaceholder='Search programs'
	loadOptions={loadOptions}
	bind:selected={selectedOption}
>
	{#if program}
	<Link class="dropdown-item" to={`/programs/${program.id}`}>Show Details</Link>
	{/if}
	<Link class="dropdown-item" to="/programs/new">Create new program</Link>
	<hr class="dropdown-divider"/>
</FancySelect>
