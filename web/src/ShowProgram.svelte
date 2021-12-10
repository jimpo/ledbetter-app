<script lang="ts">
	import {Link} from 'svelte-navigator';
	import type {NavigatorLocation, NavigateFn} from 'svelte-navigator';
	import axios, {AxiosError} from "axios";
	import {Layout, program as programLib} from "ledbetter-common";
	import LoadingIcon from "./LoadingIcon.svelte";
	import ProgramEdit from "./ProgramEdit.svelte";
	const {API_VERSION_LATEST, validateWasmBinary} = programLib;

	export let programId: string;
	export let location: NavigatorLocation<{layout?: Layout | null}>;
	export let navigate: NavigateFn;

	let name: string = '';
	let apiVersion: number = API_VERSION_LATEST;
	let programWasm: ArrayBuffer | null = null;

	let saving: boolean = false;
	let bannerError: string | null = null;
	let focusNameInput: () => void;
	let layout: Layout | null = location.state?.layout || null;

	async function loadProgram() {
		const briefResponse = await axios.get(`/api/programs/${programId}`);
		name = briefResponse.data.name;
		apiVersion = briefResponse.data.apiVersion;

		const wasmResponse = await axios.get(
			`/api/programs/${programId}/main.wasm`,
			{responseType: 'arraybuffer'}
		);
		programWasm = wasmResponse.data;
	}

	async function handleSave() {
		if (programWasm === null) {
			return;
		}
		bannerError = null;

		if (/^\s*$/.test(name)) {
			focusNameInput();
			return;
		}

		const programBrief = {id: programId, name, apiVersion};

		const formData = new FormData();
		formData.append('body', JSON.stringify(programBrief));
		formData.append('wasm', new Blob([programWasm], {type: 'application/wasm'}));

		saving = true;
		try {
			await axios.put(`/api/programs/${programId}`, formData);
		} catch (untypedErr) {
			const err = untypedErr as AxiosError;
			if (
				err.response.status === 422 &&
				err.response.data instanceof Object &&
				'error' in err.response.data &&
				typeof err.response.data.error === 'string'
			)
			{
				let {error: errMessage} = err.response.data;
				bannerError = errMessage
			}
			saving = false;
			return;
		}

		navigate('/', {state: {programBrief, programWasm, layout}});
	}

	async function handleDelete() {
		await axios.delete(`/api/programs/${programId}`);
		navigate('/');
	}
</script>

<style>
	.action-buttons {
		float: right;
	}
</style>

<div class="container">
	{#await loadProgram()}
		<LoadingIcon/>
	{:then _}
		<div class="action-buttons">
			<button
				class="button is-small is-outlined"
				class:is-loading={saving}
				title="Save"
				disabled={programWasm === null}
				on:click|preventDefault={handleSave}
			>
			<span class="icon">
				<i class="fas fa-save"></i>
			</span>
			</button>
			<button
				class="button is-small is-outlined is-danger"
				class:is-loading={saving}
				title="Delete"
				on:click|preventDefault={handleDelete}
			>
				<span class="icon">
					<i class="fas fa-trash-alt"></i>
				</span>
			</button>
		</div>

		<nav class="breadcrumb is-medium" aria-label="breadcrumbs">
			<ul>
				<li><Link to="/">LEDBetter Lights</Link></li>
				<li class="is-active"><Link to="">Programs</Link></li>
				<li class="is-active"><Link to="" aria-current="page">{name}</Link></li>
			</ul>
		</nav>

		<ProgramEdit
			bind:name
			bind:apiVersion
			bind:programWasm
			bind:layout
			bind:saving
			bind:bannerError
			bind:focusNameInput
		/>
	{/await}
</div>
