<script lang="ts">
	import LayoutEdit from "./LayoutEdit.svelte";
	import LoadingIcon from "./LoadingIcon.svelte";

	import type {PixelLayout} from "ledbetter-common";
	import axios from "axios";

	import {Link} from "svelte-navigator";
	import type {NavigateFn} from 'svelte-navigator';

	export let layoutId: string;
	export let navigate: NavigateFn;

	let layoutCode: string = '';
	let layout: PixelLayout | null  = null;
	let focusNameInput: () => void;
	let bannerError: string | null = null;

	let saving: boolean = false;
	let name: string = '';

	async function loadLayout() {
		const response = await axios.get(`/api/layouts/${layoutId}`);
		name = response.data.name;
		layoutCode = response.data.sourceCode;
	}

	async function handleSave() {
	}

	async function handleDelete() {
		await axios.delete(`/api/layouts/${layoutId}`);
		navigate('/');
	}
</script>

<style>
	.action-buttons {
		float: right;
	}
</style>

<div class="container">
	{#await loadLayout()}
		<LoadingIcon/>
	{:then _}
		<div class="action-buttons">
			<button
				class="button is-small is-outlined"
				class:is-loading={saving}
				title="Save"
				disabled={layout === null}
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
				<li class="is-active"><Link to="">Layouts</Link></li>
				<li class="is-active"><Link to={`/layouts/${layoutId}`} aria-current="page">{name}</Link></li>
			</ul>
		</nav>

		<LayoutEdit
			bind:name
			bind:layout
			bind:layoutCode
			bind:focusNameInput
			bind:bannerError
			bind:saving={saving}
		/>
	{/await}
</div>