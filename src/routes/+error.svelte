<script lang="ts">
	import Button, { Label } from '@smui/button';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
</script>

<main style="text-align: center;">
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
