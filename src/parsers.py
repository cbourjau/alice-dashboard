from datetime import datetime
from rootpy.io import root_open
import ROOT

from pony import orm
import models
from models import Trendentry, convert, TriggerString


def parse_trending(fname):
    """
    Parse trending.root files to list of dicts

    Parameters
    ----------
    fname : Absolute path to `trending.root` file

    Returns
    -------
    dict : Dictionary with branch names as keys; triggers are at l2a level
    """
    with root_open(fname) as f:
        dicts = []
        for run in f.trending:
            trigger_strs_in_run = [c.GetName() for c in run.classes]
            # dictionary mapping trigger strings to their counts for the current run
            trigger_dict = {}
            d = {}
            trigger_dict
            for key in run.keys():
                val = run.__getattr__(key)
                if key == 'classes':
                    # This branch holds the triggers of the current run
                    # We got those already above
                    continue
                elif 'alias' in key:
                    # Ignoring aliases for now
                    continue
                elif 'class_l2a' == key:
                    pass
                    # Check the trigger counts at the l2a stage The Values are
                    # in the same order as the trigger strings, but val has a
                    # fixed length of 100. Therefore, we access by index
                    for itrig, trig_str in enumerate(trigger_strs_in_run):
                        trigger_dict[trig_str] = val[itrig]
                elif 'class_' in key:
                    # Ignoring all other classes but l2a
                    continue
                elif key in ['timeStart', 'timeEnd']:
                    # convert time to datetime objects
                    d[convert(key)] = datetime.fromtimestamp(val)
                else:
                    if isinstance(val, ROOT.TObjString):
                        # Turn funky root strings to normal strings and strip
                        # spaces around them
                        d[convert(key)] = val.GetName().strip()
                    else:
                        # Just save all other values that survived until here
                        d[convert(key)] = val
            with orm.db_session:
                try:
                    Trendentry(**d)
                except (TypeError, ValueError), e:
                    print d
                    raise e
                for t_string, val in trigger_dict.items():
                    TriggerString(string=t_string, run=d['run'], counts=val)

            dicts.append(d)
    return dicts


def parse_logbook(fname):
    """
    Parse `logbook.root` files
    """
    with root_open(fname) as f:
        t = f.__getattr__('logbook')
        dicts = []
        for idx, run in enumerate(t):
            keys = [el for el in run]
            d = {}
            for key in keys:
                val = run.__getattr__(key)
                d[convert(key)] = val
                # ROOT.string needs special treatment. If we don't
                # cast it hear, the content is set to an empty string
                # later on. Probably when the file is closed?
                # For the Logbook, all non string type are proper basic types
                if isinstance(val, ROOT.string):
                    d[convert(key)] = str(val)
            dicts.append(d)
            with orm.db_session:
                try:
                    models.Logentry(**d)
                except orm.core.TransactionIntegrityError:
                    # Skip if this run was already created
                    orm.rollback()

        return dicts


def parse_trigger_aliases(fname):
    """
    These trigger aliases are worthless! Most of the triggers don't
    exist in AliVEvent and some which are for sure in the data set are
    not shown in this list!
    """
    with root_open(fname) as f:
        t = f.__getattr__('logbook_trigger_alias')
        dicts = []
        for idx, run in enumerate(t):
            keys = [el for el in run]
            d = {}
            for key in keys:
                val = run.__getattr__(key)
                # is the value iterable?
                try:
                    d[key] = [_ for _ in val]
                except TypeError:
                    d[key] = val
            dicts.append(d)
        return dicts
