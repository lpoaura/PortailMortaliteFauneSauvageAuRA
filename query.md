
## Création  de la couche de donnée

### Requete PostgreSQL

```sql
drop
	table
		mortalite_ardeche;

create
	table
		mortalite_ardeche as select
			species.id,
			observations.id_species,
			french_name,
			date::date,
			comment,
			case
				extended_info_mortality_collision_near_element
				when 'FALAISE' then 'Falaises'
				when 'HARVEST' then 'Harvest'
				when 'Houses' then 'Habitations'
				when 'HUMIDE_ZONE' then 'Zone humide'
				when 'PFG' then 'PFG'
				when 'RAS' then 'R.A.S.'
				when 'UNKNOWN' then 'Inconnu'
				when 'WATER' then 'Milieu aquatique'
				when 'WOOD' then 'Milieu forestier'
				else null
			end as near_element,
			extended_info_mortality_collision_road_type as road_type,
			extended_info_mortality_collision_track_id as track_id,
			extended_info_mortality_comment as death_comment,
			st_transform(
				the_geom,
				4326
			) geom
		from
			evn.observations left join evn.species on
			observations.id_species = species.id
		where
			extended_info_mortality_cause like 'COLL_TRANS'and extract(year from date) > (extract(year from now())-11);

with bilan as (
select
		case
			extended_info_mortality_collision_near_element
			when 'FALAISE' then 'Falaises'
			when 'HARVEST' then 'Harvest'
			when 'HOUSES' then 'Habitations'
			when 'HUMIDE_ZONE' then 'Zone humide'
			when 'PFG' then 'PFG'
			when 'RAS' then 'R.A.S.'
			when 'UNKNOWN' then 'Inconnu'
			when 'WATER' then 'Milieu aquatique'
			when 'WOOD' then 'Milieu forestier'
			else null
		end as near_element,
		count(*)
from
	evn.observations
where
	extended_info_mortality_cause like 'COLL_TRANS'
group by
	extended_info_mortality_collision_near_element
order by
	count desc)
select row_to_json(row(near_element,count)) from bilan;


with "MortaAnnuelle" as (
select
	extract(year from date) years,
	count(*)
from evn.observations
where extended_info_mortality_cause like 'COLL_TRANS' and extract(year from date) > (extract(year from now())-11)
group by years
order by years asc)
select row_to_json(row(years, count)) from "MortaAnnuelle";

with especes as (
select
	french_name,
	count(*)
from
			evn.observations left join evn.species on
			observations.id_species = species.id
where
	extended_info_mortality_cause like 'COLL_TRANS'
group by
	french_name
order by
	count desc
limit 10)
select row_to_json(row(near_element,count)) from bilan;

/* centroid de la carte pour leaflet */

select
	st_x(
		st_transform(
			st_centroid(
				st_union(
					st_buffer(
						the_geom,
						1000
					)
				)
			),
		4326
	)) as x,
		st_y(
		st_transform(
			st_centroid(
				st_union(
					st_buffer(
						the_geom,
						1000
					)
				)
			),
		4326
	)) as y
from
	evn.places;


/*select distinct extended_info_mortality_collision_near_element, count(*) from evn.observations group by extended_info_mortality_collision_near_element order by count desc;*/
```


### Commande Bash pour la transformation de la table postgis en geoJson

```sh
ogr2ogr -f "GeoJSON" ~/public_html/mortalite_routiere/MortaliteD07.js PG:"host=localhost port=dbport dbname=dbname user=dbuser password=dbpassword" roadkill
```
