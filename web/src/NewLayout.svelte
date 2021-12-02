<script lang="ts">
	import axios, {AxiosError} from 'axios';
	import Animation from './Animation.svelte';
	import {pixelLayout, PixelLayout} from 'ledbetter-common';
	import {useFocus, Link, navigate} from 'svelte-navigator';

	const registerFocus = useFocus();

	const SAMPLE_LAYOUT_CODE =
		`SET PIXELS_PER_METER 60

STRIP AT -1m, 0m
TURN 90 degrees
SEGMENT 150 pixels

STRIP AT 1m, 0m
TURN 90 degrees
SEGMENT 150 pixels
`;
	let layoutCode = SAMPLE_LAYOUT_CODE;
	let layout: PixelLayout | null  = null;
	let layoutCodeError: Error | null;
	$: {
		try {
			layout = pixelLayout.parseCode(layoutCode);
			layoutCodeError = null;
		} catch (err) {
			layout = null;
			layoutCodeError = err;
		}
	}
	let creating = false;
	let name: string = '';
	let nameInput: HTMLInputElement;
	let bannerError: string | null = null;

	async function handleCreate(): Promise<void> {
		if (layout === null) {
			return;
		}
		bannerError = null;

		if (/^\s*$/.test(name)) {
			nameInput.focus();
			return;
		}

		creating = true;

		try {
			await axios.post('/api/layouts', {name, sourceCode: layoutCode});
		} catch (untypedErr) {
			const err = untypedErr as AxiosError;
			if (err.response.status === 422 &&
				err.response.data instanceof Object &&
				err.response.data.hasOwnProperty('error'))
			{
				let {error: errMessage} = err.response.data as {error: string};
				bannerError = errMessage
			}
			creating = false;
			return;
		}

		navigate('/layouts');
	}
</script>

<style>
	.layout-code-edit {
		font-family: monospace;
	}
	.layout-code-edit.layout-code-valid {
		height: 640px;
	}
	.layout-code-edit.layout-code-invalid {
		height: 320px;
	}
	.layout-code-error {
		height: 320px;
		font-family: monospace;
		background-color: #f5f5f5;
	}

	.action-buttons {
		text-align: right;
	}
</style>

<div class="container">
	<nav class="breadcrumb" aria-label="breadcrumbs">
		<ul>
			<li><Link to="/">LEDBetter Lights</Link></li>
			<li>Layouts</li>
			<li class="is-active"><Link to="/layouts/new" aria-current="page">New</Link></li>
		</ul>
	</nav>

	{#if bannerError}
		<div class="notification is-danger">
			<button class="delete" on:click|preventDefault={() => bannerError = null}></button>
			{bannerError}
		</div>
	{/if}

	<div class="block">
		<div class="columns">
			<div class="column is-three-quarters">
				{#if !creating}
					<input
							bind:this={nameInput}
							bind:value={name}
							use:registerFocus
							class="input is-large"
							type="text"
							placeholder="Layout name..."
					/>
				{:else}
					<h1 class="title is-1">{name}</h1>
				{/if}
			</div>
			<div class="column action-buttons">
				<button
						class="button is-large is-primary is-outlined"
						class:is-loading={creating}
						title="Create"
						disabled={layout === null ? true : null}
						on:click|preventDefault={handleCreate}
				>
          <span class="icon">
            <i class="fas fa-check"></i>
          </span>
				</button>
			</div>
		</div>
	</div>

	<div class="columns">
		<div class="column is-three-quarters">
			<Animation aspectRatio={1} {layout} />
		</div>
		<div class="column">
      <textarea
				class="textarea has-fixed-size layout-code-edit"
				class:layout-code-valid={layoutCodeError === null}
				class:layout-code-invalid={layoutCodeError !== null}
				bind:value={layoutCode}
				disabled={creating ? true : null}
			/>
			{#if layoutCodeError !== null}
      <textarea
				class="textarea layout-code-error has-fixed-size is-danger"
				readonly>
			  {layoutCodeError.message}
			</textarea>
			{/if}
		</div>
	</div>
</div>
