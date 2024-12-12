<script lang="ts">
	// actual hacked together abomination
	// https://github.com/hperrin/svelte-material-ui/blob/master/packages/autocomplete/src/Autocomplete.svelte
	// https://github.com/gyurielf/svelte-tel-input/blob/main/apps/site/src/lib/components/examples/AdvancedPhoneInput.svelte

	import { TelInput, isSelected, normalizedCountries } from 'svelte-tel-input';
	import type { DetailedValue, CountryCode, E164Number, TelInputOptions, Country } from 'svelte-tel-input/types';
	import 'svelte-tel-input/styles/flags.css';

	import Textfield from '@smui/textfield';
	import Menu from '@smui/menu';
	// import type { SMUIListAccessor, SMUIListItemAccessor } from '@smui/list';
	import List, { Item, Text } from '@smui/list';
	import { Anchor } from '@smui/menu-surface';
	import { classMap } from '@smui/common/internal';

	interface Props {
		clickOutside?: boolean;
		closeOnClick?: boolean;
		// disabled?: boolean;
		detailedValue?: DetailedValue | null;
		value?: E164Number | null;
		searchPlaceholder?: string | null;
		selectedCountry?: CountryCode | null;
		valid?: boolean;
		options?: TelInputOptions;
		onsame?: (e: { option: CountryCode }) => void;
		onchange?: (e: { option: CountryCode }) => void;
	}

	let {
		// disabled = false,
		detailedValue = $bindable(null),
		value = $bindable(null),
		searchPlaceholder = null,
		selectedCountry = $bindable(null),
		valid = $bindable(false),
		options = {
			format: 'national',
			autoPlaceholder: true,
			spaces: true,
			invalidateOnCountryChange: true
		},
		onsame = () => {},
		onchange = () => {}
	}: Props = $props();

	let searchLabel = $state('Select country');
	let searchText = $state('');

	let focused = $state(false);

	const menuOpen = $derived(focused);

	let selectedCountryDetails = $derived(normalizedCountries.find((el) => el.iso2 === selectedCountry) || null);

	const selectClick = () => {
		focused = false;
		searchLabel = 'Change country';
	};

	const sortCountries = (countries: Country[], text: string) => {
		const normalizedText = text.trim().toLowerCase();
		let out;
		if (!normalizedText) {
			out = countries.sort((a, b) => a.label.localeCompare(b.label));

			// make us appear first
			const usIndex = out.findIndex((el) => el.iso2 === 'US');
			console.log(usIndex);
			out.unshift(out.splice(usIndex, 1)[0]);
		} else {
			out = countries.sort((a, b) => {
				const aNameLower = a.name.toLowerCase();
				const bNameLower = b.name.toLowerCase();
				const aStartsWith = aNameLower.startsWith(normalizedText);
				const bStartsWith = bNameLower.startsWith(normalizedText);
				if (aStartsWith && !bStartsWith) return -1;
				if (!aStartsWith && bStartsWith) return 1;
				const aIndex = aNameLower.indexOf(normalizedText);
				const bIndex = bNameLower.indexOf(normalizedText);
				if (aIndex === -1 && bIndex === -1) return a.id.localeCompare(b.id);
				if (aIndex === -1) return 1;
				if (bIndex === -1) return -1;
				const aWeight = aIndex + (aStartsWith ? 0 : 1);
				const bWeight = bIndex + (bStartsWith ? 0 : 1);
				return aWeight - bWeight;
			});
		}

		return out;
	};

	const handleSelect = (val: CountryCode, e?: Event) => {
		// if (disabled) return;
		e?.preventDefault();
		if (
			selectedCountry === undefined ||
			selectedCountry === null ||
			(typeof selectedCountry === typeof val && selectedCountry !== val)
		) {
			selectedCountry = val;
			onChange(val);
			selectClick();
		} else {
			onsame({ option: val });
			selectClick();
		}
	};

	const onChange = (selectedCountry: CountryCode) => {
		onchange({ option: selectedCountry });
	};

	// svelte-ignore non_reactive_update
	let element: HTMLDivElement;
</script>

<div>
	<div
		bind:this={element}
		aria-controls="tel"
		use:Anchor
		aria-expanded={menuOpen ? 'true' : 'false'}
		role="combobox"
		tabindex="0"
		onfocusin={() => {
			// if (!disabled)
			focused = true;
		}}
	>
		<!-- onkeydowncapture={handleTextfieldKeydown} -->
		<!-- todo: reimplement arrow key navigation from smui -->
		<Textfield label={searchLabel} placeholder={searchPlaceholder} bind:value={searchText} autocomplete="new-country" />
		<Menu
			managed
			neverRestoreFocus
			open={menuOpen}
			bind:anchorElement={element}
			anchor={false}
			anchorCorner="BOTTOM_START"
		>
			<List>
				{#each sortCountries(normalizedCountries, searchText) as country (country.id)}
					{@const isActive = isSelected(country.iso2, selectedCountry)}
					<Item
						selected={isActive}
						onSMUIAction={() => {
							handleSelect(country.iso2);
						}}
					>
						<Text
							><span class="flag flag-{country.iso2.toLowerCase()}"></span>
							{country.name} (+{country.dialCode})</Text
						>
					</Item>
				{/each}
			</List>
		</Menu>
	</div>

	<br />
	{#if selectedCountry && selectedCountry !== null}
		<div>
			<span class="flag flag-{selectedCountry.toLowerCase()}"></span>
			{#if options.format === 'national'}
				<span>{selectedCountryDetails?.name} (+{selectedCountryDetails?.dialCode})</span>
			{/if}
		</div>
	{:else}
		Please select a country above to proceed
	{/if}

	<label class="mdc-text-field smui-text-field--standard" class:disabled={!selectedCountry}>
		<span
			class={classMap({
				'mdc-floating-label': true,
				'mdc-floating-label--float-above': value // todo: make better with focus styling
			})}
			style="">Enter number</span
		>
		<TelInput
			bind:country={selectedCountry}
			bind:detailedValue
			bind:value
			bind:valid
			{options}
			autocomplete="new-number"
			required
			class="mdc-text-field__input"
			disabled={!selectedCountry}
		/>
		<div class="mdc-line-ripple" style=""></div>
	</label>
</div>

<style>
	.flag {
		vertical-align: text-top;
		margin-right: 3px;
		border-radius: 3px;
	}

	.disabled {
		pointer-events: none;
		opacity: 0.5;
	}
</style>
