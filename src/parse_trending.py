import csv
import collections
from datetime import datetime
import urllib

from rootpy.io import root_open
import ROOT


def find_mb_and_hm_triggers(fname):
    """
    Find relevant minimum bias and high multiplicity triggers.

    Parameters
    ----------
    fname : str
        Path to the respective trending.root file
    """
    with root_open(fname) as f:
        t = f.trending
        classes = []
        for el in t:
            classes += [c.GetName() for c in el.classes]
    cnter = collections.Counter(classes)
    mbs = [k for k in cnter.keys() if '-B-' in k and k.startswith('CINT7-')]
    hms = [k for k in cnter.keys() if '-B-' in k and 'HM' in k]
    return mbs + hms


def parse_run(run):
    """
    Parse one `run` (element) of the tree in trending.root files

    Parameters
    ----------
    run : TTree entry

    Returns
    -------
    dict : Dictionary with branch names as keys; triggers are at l2a level
    """
    keys = run.keys()
    triggers_in_run = [c.GetName() for c in run.classes]
    ret_dic = {}
    for key in keys:
        val = run.__getattr__(key)
        if key == 'classes':
            # This branch holds the triggers of the current run
            # We got those already above
            continue
        elif 'alias' in key:
            # Ignoring aliases for now
            continue
        elif 'class_l2a' == key:
            # Check the trigger counts at the l2a stage The Values are
            # in the same order as the trigger strings, but val has a
            # fixed length of 100. Therefore, we access by index
            for itrig, trig_str in enumerate(triggers_in_run):
                ret_dic[trig_str] = val[itrig]
        elif 'class_' in key:
            # Ignoring all other classes but l2a
            continue
        elif key in ['timeStart', 'timeEnd']:
            # convert time to datetime objects
            ret_dic[key] = datetime.fromtimestamp(val)
        else:
            if isinstance(val, ROOT.TObjString):
                # Trun funky root strings to normal strings and strip
                # spaces around them
                ret_dic[key] = val.GetName().strip()
            else:
                # Just save all other values that survived until here
                ret_dic[key] = val
    return ret_dic


def compute_keys_to_keep(fnames):
    """
    Compute the keys (column names) that we want to write to the csv file
    Parameters
    ----------
    fnames : list
        List of paths to 'trending.root' files

    Returns
    -------
    list : List of keys to keep
    """
    keys = set()
    triggers = set()

    for fname in fnames:
        # Keep the 20 most common triggers of the current year
        [triggers.add(trig) for trig in find_mb_and_hm_triggers(fname)]

        with root_open(fname) as f:
            t = f.trending
            # Find the branch names we want to keep
            ignore_keys = ['classes', 'class_', 'alias_']
            for b in t.branches:
                b_name = b.GetName()
                if not [bad_key for bad_key in ignore_keys if bad_key in b_name]:
                    keys.add(b_name)
    return list(keys) + list(triggers)


if __name__ == '__main__':
    with open('trends.csv', 'w') as csvfile:
        # Download relevant root files and find a common set of branch names
        years = range(2015, 2017)
        fnames = []
        for y in years:
            print "Downloading data for year {}...".format(y)
            fname, _resp = urllib.urlretrieve("http://aliqaevs.web.cern.ch/aliqaevs/data/{}/trending.root".format(y),
                                              "/tmp/{}_trending.root".format(y))
            fnames.append(fname)

        keys = compute_keys_to_keep(fnames)
        writer = csv.DictWriter(csvfile, fieldnames=keys, restval='', extrasaction='ignore')
        writer.writeheader()

        # loop over each year and parse the root file to the csv file
        for fname in fnames:
            with root_open(fname) as f:
                t = f.trending
                for idx, el in enumerate(t):
                    writer.writerow(parse_run(el))
