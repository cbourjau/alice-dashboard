from collections import defaultdict

import csv
import json

from pony import orm

from parsers import parse_logbook, parse_trending
from file_iterators import trending_file_iter, logbook_file_iter
from trigger2bit import map_trigger_strings_to_bits
from filters import dashboard_keys, keep_keys

import models


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
    for fname in logbook_file_iter(2010, 2016):
        logbook_dicts += parse_logbook(fname)

    trending_dicts = []
    for fname in trending_file_iter(2010, 2016):
        print fname
        trending_dicts += parse_trending(fname)

    map_trigger_strings_to_bits()

    tb_runs = orm.select(tb.run for tb in models.TriggerBit)
    q = orm.select((te, lb)
                   for te in models.Trendentry
                   for lb in models.Logentry
                   if (te.run == lb.run and
                       lb.lhc_beam_mode == 'STABLE BEAMS' and
                       lb.run_quality == 'Good run' and
                       te.run in tb_runs))

    # Create generic csv
    run_dicts = []
    periods = set()
    for (te, lb) in q:
        run_dict = te.to_dict()
        periods.add(lb.lhc_period)
        run_dict.update(lb.to_dict())
        {}.update
        for tb in orm.select(tb for tb in models.TriggerBit if tb.run == te.run):
            run_dict["VEventBit{}".format(tb.bit)] = orm.sum(tb.triggerstrings.counts)
        run_dicts.append(run_dict)
    write_to_csv(run_dicts, 'trends.csv')
    filtered_run_dicts = []
    for run_dict in run_dicts:
        mini = keep_keys(run_dict, keys=dashboard_keys)
        filtered_run_dicts.append(mini)
    write_to_csv(filtered_run_dicts, 'trends.min.csv')

    # Triggers per run per period
    periods = orm.select(lb.lhc_period
                         for lb in models.Logentry
                         if (lb.lhc_beam_mode == 'STABLE BEAMS' and
                             lb.partition == 'PHYSICS_1' and
                             lb.run_quality == 'Good run'))
    lbs = orm.select((lb.lhc_period, lb.run)
                     for lb in models.Logentry
                     if (lb.lhc_beam_mode == 'STABLE BEAMS' and
                         lb.partition == 'PHYSICS_1' and
                         lb.run_quality == 'Good run'))

    t_strs = orm.select(t_strs
                        for t_strs in models.TriggerString
                        for lb in models.Logentry
                        if (lb.lhc_beam_mode == 'STABLE BEAMS' and
                            lb.run == t_strs.run and
                            lb.partition == 'PHYSICS_1' and
                            lb.run_quality == 'Good run'))

    for period in periods:
        run_dicts = []
        print period
        for _, run in [(p, r) for (p, r) in lbs if p == period]:
            for ts in t_strs.filter(run=run):
                if ts.counts > 0:
                    run_dicts.append({'run': run, 'trigger': ts.string, 'counts': ts.counts})
        write_to_csv(run_dicts, './triggers_period/triggers_per_run_{}.csv'.format(period))

    # Mapping of trigger bit to trigger strings
    bit2string_period = {}
    for period in orm.select(lb.lhc_period for lb in models.Logentry):
        bit2string = {}
        for run, tb in orm.select((lb.run, tb)
                                  for lb in models.Logentry
                                  for tb in models.TriggerBit if tb.run == lb.run):
            bit = "VEventBit{}".format(tb.bit)
            strings = set(tb.triggerstrings.string)
            if not bit2string.get(bit, False):
                bit2string[bit] = strings
            else:
                bit2string[bit].update(strings)
        bit2string_period[str(period)] = {"name": str(period),
                                          "children": [{"name": k, "children": list(v)}
                                                       for k, v in bit2string.items()]}
    with open("triggers.json", 'w') as f:
        json.dump(bit2string_period, f, sort_keys=True, indent=2)
