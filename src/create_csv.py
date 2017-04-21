from collections import defaultdict
import csv

from parsers import parse_logbook, parse_trending
from file_iterators import trending_file_iter, logbook_file_iter
from trigger2bit import augment_with_collision_trigger_class


logbook_dicts = []
for fname in logbook_file_iter(2015, 2015):
    print fname
    logbook_dicts += parse_logbook(fname)

trending_dicts = []
for fname in trending_file_iter(2015, 2015):
    trending_dicts += parse_trending(fname)

d = defaultdict(dict)
for l in (logbook_dicts, trending_dicts):
    for elem in l:
        d[elem['run']].update(elem)
merged = d.values()

augmented = []
for run_dict in merged:
    augmented.append(augment_with_collision_trigger_class(run_dict))

keys = set()
[[keys.add(k) for k in _d.keys()] for _d in augmented]

with open('../docs/data/trends_test.csv', 'w') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=keys, restval='', extrasaction='ignore')
    writer.writeheader()
    for run_dict in merged:
        writer.writerow(run_dict)
