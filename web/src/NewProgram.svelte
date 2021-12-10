<script lang="ts">
	import {Link, navigate} from 'svelte-navigator';
	import axios, {AxiosError} from "axios";
	import {program as programLib} from "ledbetter-common";
	import ProgramEdit from "./ProgramEdit.svelte";
	const {API_VERSION_LATEST, validateWasmBinary} = programLib;

	let name: string = '';
	let apiVersion: number = API_VERSION_LATEST;
	let programWasm: ArrayBuffer | null = null;

	let creating: boolean = false;
	let bannerError: string | null = null;
	let focusNameInput: () => void;

	async function handleCreate() {
		if (programWasm === null) {
			return;
		}
		bannerError = null;

		if (/^\s*$/.test(name)) {
			focusNameInput();
			return;
		}

		const formData = new FormData();
		formData.append('body', JSON.stringify({name, apiVersion}));
		formData.append('wasm', new Blob([programWasm], {type: 'application/wasm'}));

		creating = true;
		try {
			await axios.post('/api/programs', formData);
		} catch (untypedErr) {
			const err = untypedErr as AxiosError;
			if (
				err.response.status === 422 &&
				err.response.data instanceof Object &&
				'error' in err.response.data &&
				typeof err.response.data.error === 'string'
			)
			{
				let {error: errMessage} = err.response.data as {error: string};
				bannerError = errMessage
			}
			creating = false;
			return;
		}

		navigate('/');
	}
</script>

<style>
	.action-buttons {
		float: right;
	}
</style>

<div class="container">
	<div class="action-buttons">
		<button
			class="button is-primary is-outlined is-small"
			class:is-loading={creating}
			title="Create"
			disabled={programWasm === null}
			on:click|preventDefault={handleCreate}
		>
			<span class="icon">
				<i class="fas fa-check"></i>
			</span>
		</button>
	</div>

	<nav class="breadcrumb is-medium" aria-label="breadcrumbs">
		<ul>
			<li><Link to="/">LEDBetter Lights</Link></li>
			<li class="is-active"><Link to="">Programs</Link></li>
			<li class="is-active"><Link to="" aria-current="page">New</Link></li>
		</ul>
	</nav>

	<ProgramEdit
		bind:name
		bind:apiVersion
		bind:programWasm
		bind:saving={creating}
		bind:bannerError
		bind:focusNameInput
	/>
</div>
