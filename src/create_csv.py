from collections import defaultdict
import csv

from parsers import parse_logbook, parse_trending
from file_iterators import trending_file_iter, logbook_file_iter
from trigger2bit import augment_with_collision_trigger_class
import filters


def merge_dictionaries(*dicts):
    d = defaultdict(dict)
    for l in dicts:
        for elem in l:
            d[elem['run']].update(elem)
    merged = d.values()
    return merged


def write_to_csv(dicts, fname):
    with open('../docs/data/{}'.format(fname), 'w') as csvfile:
        keys = set()
        [[keys.add(k) for k in _d.keys()] for _d in dicts]
        writer = csv.DictWriter(csvfile, fieldnames=keys, restval='', extrasaction='ignore')
        writer.writeheader()
        for run_dict in dicts:
            writer.writerow(run_dict)


if __name__ == '__main__':
    logbook_dicts = []
    for fname in logbook_file_iter(2010, 2017):
        print fname
        logbook_dicts += parse_logbook(fname)

    trending_dicts = []
    for fname in trending_file_iter(2010, 2017):
        print fname
        trending_dicts += parse_trending(fname)

    merged = merge_dictionaries(logbook_dicts, trending_dicts)
    for run_dict in merged:
        augment_with_collision_trigger_class(run_dict)

    write_to_csv(merged, 'trends_full.csv')

    minimal = filter(lambda d: filters.has_required_keys(d, filters.dashboard_keys), merged)
    minimal = map(lambda d: filters.keep_keys(d, filters.dashboard_keys), minimal)
    write_to_csv(minimal, 'minimal.csv')
