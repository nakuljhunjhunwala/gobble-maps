-- Gobble Maps — expanded area list (PRD §14.3: stations Borivali → Churchgate,
-- East + West, plus key neighbourhoods, Navi Mumbai and the Thane side).
-- Idempotent: existing labels are left untouched.

insert into public.filter_options (category, label, sort_order)
select 'area'::public.filter_category, v.label, 100 + v.ord
from (
  values
    -- Western line, north → south
    ('Borivali West', 1), ('Borivali East', 2),
    ('Kandivali West', 3), ('Kandivali East', 4),
    ('Malad West', 5), ('Malad East', 6),
    ('Goregaon West', 7), ('Goregaon East', 8),
    ('Jogeshwari West', 9), ('Jogeshwari East', 10),
    ('Andheri East', 11), ('Versova', 12), ('Oshiwara', 13),
    ('Vile Parle West', 14), ('Vile Parle East', 15),
    ('Santacruz West', 16), ('Santacruz East', 17),
    ('Bandra East', 18), ('Mahim', 19),
    ('Dadar West', 20), ('Dadar East', 21), ('Prabhadevi', 22),
    ('Mahalaxmi', 23), ('Tardeo', 24), ('Grant Road', 25),
    ('Girgaon', 26), ('Marine Lines', 27), ('Kala Ghoda', 28),
    ('CSMT', 29), ('Byculla', 30),
    -- Central / Harbour side
    ('Sion', 31), ('Wadala', 32), ('Kurla West', 33),
    ('Ghatkopar West', 34), ('Ghatkopar East', 35),
    ('Vikhroli', 36), ('Kanjurmarg', 37), ('Bhandup', 38),
    ('Mulund West', 39), ('Mulund East', 40),
    ('Chembur', 41), ('Sakinaka', 42), ('Chandivali', 43),
    -- Thane side
    ('Thane West', 44), ('Thane East', 45),
    ('Ghodbunder Road', 46), ('Majiwada', 47),
    ('Hiranandani Estate Thane', 48), ('Kalwa', 49),
    -- Navi Mumbai
    ('Airoli', 50), ('Vashi', 51), ('Nerul', 52),
    ('Seawoods', 53), ('CBD Belapur', 54), ('Kharghar', 55)
) as v(label, ord)
on conflict (category, label) do nothing;
