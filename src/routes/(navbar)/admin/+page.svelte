<script lang="ts">
	import Button, { Label } from '@smui/button';
	import Card, * as C from '@smui/card';
	import Dialog from '@smui/dialog';
	import LayoutGrid, { Cell } from '@smui/layout-grid';
	import { handleSubmit, loading, editingForm } from '$lib/form';
	import type { PageData, ActionData } from './$types';
	import PostEditor from '$lib/PostEditor.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();
</script>

<form method="POST" action="?/edit" autocomplete="off" onsubmit={handleSubmit} class="form">
	<Dialog open={$editingForm !== undefined} scrimClickAction="" escapeKeyAction="" surface$style="min-width: 600px">
		{#key $editingForm}
			<PostEditor action="edit" {form} />
		{/key}
	</Dialog>
</form>

<h1>Log New Caller</h1>

<form method="POST" action="?/create" autocomplete="off" onsubmit={handleSubmit}>
	<Card class="form">
		<PostEditor action="create" {form} />
	</Card>
</form>

{#if !data.authenticated || !data.calls}
	<h1 style="margin-bottom: 0;">Loading previous calls</h1>
{:else}
	<h1 style="margin-bottom: 0;">
		{data.calls.length} previous call{data.calls.length == 1 ? '' : 's'}
	</h1>
	{#if (form?.action === 'remove' || form?.action === 'edit') && form?.message}
		<p class="message">{form.message}</p>
	{/if}
	<LayoutGrid>
		{#each data.calls as call}
			<Cell>
				<!-- todo: don't waste so much space -->
				<Card style="height: 100%;">
					<C.Content>
						<h3>{call.name}</h3>
					</C.Content>
					<C.Actions>
						<form
							class="mdc-card__action mdc-card__action--button"
							method="POST"
							action="?/remove"
							onsubmit={handleSubmit}
						>
							<input type="hidden" name="id" value={call._id} />
							<Button variant="raised" type="submit" disabled={$loading}>
								<Label>remove</Label>
							</Button>
						</form>
						<!-- <Button variant="raised" disabled={$loading} onclick={() => editingForm.set(call)}>
							<Label>edit</Label>
						</Button> -->
					</C.Actions>
				</Card>
			</Cell>
		{/each}
	</LayoutGrid>
{/if}
