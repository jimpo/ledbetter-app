<script lang="ts">
	export let errorMessage: string | null;
</script>

{#if errorMessage}
	<div class="notification is-danger">
		<button class="delete" on:click|preventDefault={() => errorMessage = null}></button>
		{errorMessage}
	</div>
{/if}
