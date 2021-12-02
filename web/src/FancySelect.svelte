<script lang="ts">
	import {createEventDispatcher} from 'svelte';
	import type {Option} from './types';

	export let defaultLabel: string = '';
	export let searchPlaceholder: string;
	export let loadOptions: (searchQuery: string) => Promise<Option[]>;
	export let selected: Option | null;

	let searchQuery: string | null = null;
	let options: Option[] = [];
	let dropdownElement: HTMLDivElement;
	let isActive: boolean = false;

	const dispatch = createEventDispatcher();

	function selectOption(option: Option | null) {
		isActive = false;
		dispatch('select', option);
	}

	function onFocusOut(event: FocusEvent) {
		const nowFocused = event.relatedTarget;
		if (!((nowFocused instanceof Node) && dropdownElement.contains(nowFocused)))	{
			isActive = false;
		}
	}

	async function onSearchQueryChange(searchQuery: string | null) {
		if (searchQuery !== null) {
			const newOptions = await loadOptions(searchQuery);
			if (isActive) {
				options = newOptions;
			}
		} else {
			options = [];
		}
	}

	$: searchQuery = isActive ? searchQuery : null;
	$: onSearchQueryChange(searchQuery);
</script>

<style>
	.dropdown.is-fullwidth {
		display: flex;
	}

  .dropdown.is-fullwidth .dropdown-trigger, .dropdown.is-fullwidth .dropdown-menu {
		width: 100%;
	}
</style>

<div
	class="dropdown is-fullwidth"
	class:is-active={isActive}
	bind:this={dropdownElement}
	on:focusout={onFocusOut}
>
	<div class="dropdown-trigger">
		<button
			class="button is-fullwidth"
			aria-haspopup="true"
			aria-controls="dropdown-menu"
			on:click={() => isActive = !isActive}
		>
			<span>{selected !== null ? selected.label : defaultLabel}</span>
			<span class="icon is-small">
        <i class="fas fa-angle-down" aria-hidden="true"></i>
      </span>
		</button>
	</div>
	<div class="dropdown-menu" role="menu">
		<div class="dropdown-content">
			{#if searchQuery === null}
				<slot/>
			{/if}
			<div class="dropdown-item">
				<div class="control has-icons-left has-icons-right">
					<input
						class="input is-rounded"
						type="text"
						placeholder={searchPlaceholder}
						bind:value={searchQuery}
						on:focusin={() => searchQuery = ''}
					/>
					<span class="icon is-small is-left">
						<i class="fas fa-search"></i>
					</span>
				</div>
			</div>
			{#if options.length > 0}
				<hr class="dropdown-divider"/>
			{/if}
			{#each options as option}
				<a
					class="dropdown-item"
					class:is-active={option.value === selected?.value}
					href={'#'}
					on:click|preventDefault={() => selectOption(option)}
				>
					{option.label}
				</a>
			{/each}
		</div>
	</div>
</div>
