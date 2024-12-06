<script lang="ts">
	import Button, { Label } from '@smui/button';
	import * as C from '@smui/card';
	import * as D from '@smui/dialog';
	import Textfield from '@smui/textfield';
	import { autoGrowHeight } from '$lib/actions';
	import { editingForm, loading } from '$lib/form';
	import type { ActionData } from '../routes/$types';

	// pass page's form data to the editor

	interface Props {
		form: ActionData;
		action: string;
	}

	let { form, action }: Props = $props();

	let initialData = $editingForm;

	const ContentComponent = $derived(action === 'edit' ? D.Content : C.Content);
	const ActionsComponent = $derived(action === 'edit' ? D.Actions : C.Actions);
</script>

{#if action === 'edit'}
	<D.Title>Editing "{initialData?.title || ''}"</D.Title>
{/if}

<ContentComponent class="formContent">
	{#if form?.action === 'create' && form?.message}
		<p class="message">{form.message}</p>
	{/if}
	{#if action === 'edit'}
		<input type="hidden" name="id" value={initialData?.id} />
	{/if}
	<Textfield
		input$required={true}
		input$maxlength={120}
		label="Title"
		input$name="title"
		value={initialData?.title || ''}
	/>
	<Textfield
		textarea
		input$maxlength={50000}
		input$rows={4}
		label="Body"
		input$name="contentText"
		input$use={[autoGrowHeight]}
		value={initialData?.contentText || ''}
	/>
</ContentComponent>
<ActionsComponent>
	{#if action === 'edit'}
		<Button variant="raised" action="close" type="button">
			<Label>Cancel</Label>
		</Button>
		<Button variant="raised" type="submit" data-mdc-dialog-button-default>
			<Label>Edit</Label>
		</Button>
	{:else if action === 'create'}
		<Button variant="raised" type="submit" disabled={$loading}>
			<Label>Send Notification</Label>
		</Button>
	{/if}
</ActionsComponent>
