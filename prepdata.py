import os
import pandas as pd

metadata_dir = '../libphonenumber/resources/metadata'

def process_csv(code):
	with open(f'{metadata_dir}/{code}/ranges.csv', 'r', encoding='utf-8') as input:
		df = pd.read_csv(input, sep='\\s*;\\s*', quotechar='"', header=0, engine='python')
		# df.rename(columns=lambda h: h.strip(), inplace=True)	
		headers = list(df.columns.values)

		geocode = 'Geocode:en' if 'Geocode:en' in headers else next((h for h in headers if h.startswith('Geocode')), None)
		if geocode:
			df.rename(columns={geocode: 'Geocode'}, inplace=True)
			df['Geocode'] = df['Geocode'].str.strip('"')
			df.fillna({'Geocode': ''}, inplace=True)
		else:
			print('No geocode column found for', code)

		df.drop(columns=[h for h in df.columns if h not in ['Prefix', 'Regions', 'Geocode']], inplace=True)

		df['Regions'] = df['Regions'].str.strip('"')

		# order columns
		if geocode:
			df = df.loc[:, ['Prefix', 'Regions', 'Geocode']]
		else:
			df = df.loc[:, ['Prefix', 'Regions']]

		# df.to_csv(index=False, sep=';')
		df.to_json(path_or_buf=f'./src/lib/geocoding/{code}.json', orient='values')

# for country in os.listdir(metadata_dir):
# 	if os.path.exists(f'{metadata_dir}/{country}/ranges.csv'):
# 		process_csv(country)

with open(f'{metadata_dir}/metadata.csv', 'r', encoding='utf-8') as input:
	df = pd.read_csv(input, sep='\\s*;\\s*', quotechar='"', header=0, engine='python')

	df.drop(columns=[h for h in df.columns if h not in ['Calling Code', 'Main Region']], inplace=True)

	df['Main Region'] = df['Main Region'].str.strip('"')

	# remove non countries
	df = df.loc[df['Main Region'].str.isalpha()]

	df.set_index('Calling Code')['Main Region'].to_json(path_or_buf=f'./src/lib/geocoding/countries.json', orient='columns')