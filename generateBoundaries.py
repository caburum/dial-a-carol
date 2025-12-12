import json

boundaries = []

sources = [
	('state', 'us_states.geojson', 'STATE_NAME'), # https://docs.mapbox.com/mapbox-gl-js/assets/us_states.geojson
	('country', 'world.geojson', 'NAME') # https://exploratory.io/map
]

i = 0

for group, file, name_key in sources:
	with open(f'./geojson/{file}') as f:
		data = json.load(f)

	for feature in data['features']:
		name = feature['properties'].get(name_key)
		if name == 'United States':
			continue
		boundaries.append({
			'type': 'Feature',
			'geometry': feature['geometry'],
			'properties': {
				'name': name
			},
			'id': i
		})
		i += 1

with open('./static/boundaries.geojson', 'w') as f:
	json.dump({
		'type': 'FeatureCollection',
		'features': boundaries
	}, f)