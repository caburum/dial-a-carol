<script lang="ts">
	import IconButton from '@smui/icon-button';
	import Button, { Label } from '@smui/button';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { isOnline } from '$lib/stores';

	onMount(() => {
		setInterval(() => {
			if ($isOnline) {
				location.reload();
			}
		}, 5000);
	});
</script>

<main style="text-align: center;">
	{#if !$isOnline}
		<IconButton class="material-icons" aria-label="Offline" title="Offline">cloud_off</IconButton>
	{/if}

	<h1>Error {$page.status}: {$page.error?.message}</h1>

	<Button
		variant="raised"
		onclick={() =>
			goto('/', {
				invalidateAll: true
			})}
	>
		<Label>Try Again</Label>
	</Button>
</main>
