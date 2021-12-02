<script lang="ts">
	import axios from 'axios';
	import {Link} from 'svelte-navigator';
	import type {ProgramBrief} from 'ledbetter-common';
	import type {Option} from './types';
	import FancySelect from './FancySelect.svelte';

	export let program: ProgramBrief | null;

	let selectedOption: Option | null;
	let programs: ProgramBrief[] = [];

	function programOption({id, name}: ProgramBrief): Option {
		return {value: id, label: name};
	}

	async function loadPrograms(searchQuery: string): Promise<void> {
		const response = await axios.get('/api/programs', {params: {autocomplete: searchQuery}});
		programs = response.data;
	}

	async function loadOptions(searchQuery: string): Promise<Option[]> {
		await loadPrograms(searchQuery);
		return programs.map(programOption);
	}

	function onSelect(option: Option | null) {
		program = programs.find((program) => program.id === option?.value) || null;
	}

	$: selectedOption = program && programOption(program);
</script>

<FancySelect
	defaultLabel={'Select a program'}
	searchPlaceholder='Search programs'
	loadOptions={loadOptions}
	selected={selectedOption}
	on:select={({detail}) => onSelect(detail)}
>
	{#if program}
	<Link class="dropdown-item" to={`/programs/${program.id}`}>Show Details</Link>
	{/if}
	<Link class="dropdown-item" to="/programs/new">Create new program</Link>
	<hr class="dropdown-divider"/>
</FancySelect>
