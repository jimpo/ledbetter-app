<script lang="ts">
	import axios from 'axios';
	import type {ProgramBrief} from 'ledbetter-common';

	export let program: ProgramBrief | null;

	let programId = '';
	let programs: ProgramBrief[] = [];

	async function loadPrograms(): Promise<void> {
		const response = await axios.get('/api/programs');
		programs = response.data;
		//programWasm = decodeBase64(response.data.wasm);
	}

	$: program = programs.find((program) => program.id === programId);
</script>

{#await loadPrograms()}
	<div class="select is-loading">
		<select>
			<option value="">Select program</option>
		</select>
	</div>
{:then _}
	<div class="select">
		<select bind:value={programId}>
			<option value="">Select program</option>
			{#each programs as programOption}
				<option value={programOption.id}>{programOption.name}</option>
			{/each}
		</select>
	</div>
{:catch err}
	<div class="notification is-danger">
		{err}
	</div>
{/await}
