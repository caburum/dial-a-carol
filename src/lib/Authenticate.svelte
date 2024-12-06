<script lang="ts">
	import Button, { Label } from '@smui/button';
	import * as D from '@smui/dialog';
	import Textfield from '@smui/textfield';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '../routes/$types';
	import { initialAuthPassword, reAuthenticateCallback } from './auth';

	interface Props {
		cancelable?: boolean;
	}

	let { cancelable = false }: Props = $props();

	let message: string | undefined = $state();
	const handler: SubmitFunction = ({ formData }) => {
		const password = formData.get('password');

		return async ({ result }) => {
			if ((result.type === 'success' || result.type === 'failure') && result.data && 'authenticated' in result.data) {
				message = result.data?.message;
				if (result.data?.authenticated) {
					if (typeof password !== 'string') return;
					else if (!$initialAuthPassword) {
						// used in +layout to gate entry
						$initialAuthPassword = password;
						invalidateAll();
					} else if ($reAuthenticateCallback !== undefined) {
						// used in dialog to confirm
						$reAuthenticateCallback(password);
					}
				}
			} else if (result.type === 'error') {
				message = String(result.error);
			}
		};
	};
</script>

<form method="POST" action="/?/auth" use:enhance={handler}>
	<D.Title>Access Restricted</D.Title>
	<D.Content style="width: 100%">
		<p style="margin-bottom: 0;">Enter your password to continue</p>
		<Textfield
			input$required={true}
			type="password"
			label="Password"
			input$name="password"
			value=""
			style="width: 100%"
		/>
		{#if message}<p class="message">{message}</p>{/if}
	</D.Content>
	<D.Actions>
		{#if cancelable}
			<Button variant="raised" action="close" type="button">
				<Label>Cancel</Label>
			</Button>
		{/if}
		<Button variant="raised" action="" data-mdc-dialog-button-default>
			<Label>Continue</Label>
		</Button>
	</D.Actions>
</form>
