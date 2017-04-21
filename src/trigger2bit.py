import os

from rootpy.io import root_open

file_path = '$ALICE_PHYSICS/OADB/COMMON/PHYSICSSELECTION/data/physicsSelection.root'
physSel = root_open(os.path.expandvars(file_path)).physSel


def _get_ps_for_run(run_dict):
    run = run_dict['run']
    try:
        if run_dict['lhcState'] != 'STABLE BEAMS':
            raise ValueError("Not a stable beam")
    except KeyError:
        raise ValueError("No LHC status for this run")

    # not all runs are automatically recognized. If it is not
    # found, the returned index is 1 :P
    # If thats the case, fish out the default config depending on the beam type
    if physSel.GetIndexForRun(run) >= 0:
        return physSel.GetObjArray()[physSel.GetIndexForRun(run)]
    else:
        defaults = [el for el in physSel.GetDefaultList()]
        try:
            # Beam type is populated form the logbook
            if run_dict.get('beamType') == 'Pb-Pb':
                default = next(el for el in defaults if 'PbPb' in el.GetName())
                return default
            elif run_dict.get('beamType') == 'p-p':
                # Yes, these are upper case "P"s, don't act surprised!
                return next(el for el in defaults if 'PP' in el.GetName())
            else:
                raise ValueError(
                    "No defaults found for run {} of type".format(run, run_dict['beamType']))
        except KeyError:
            raise KeyError("`beamType` field is not present in the given dict")


def augment_with_collision_trigger_class(run_dict):
    """
    Add AliVEvent trigger alias information to a run.

    Dict containing a `run` and a `beamType` (used for fall-back to
    defaults) field and trigger-string fields which should be
    translated to trigger alias bits. The translation works as
    follows: The run number is used to retrive the mapping between
    strings and trigger bits.  Then, for each trigger bit, the
    recorded number of events is queried via the corresponding trigger
    strings in the given `run_dict`. The numbers from the trigger
    strings is **added**. This might not be the correct way to go
    about it since the trigger strings are not necessarily
    orthogonal(?)

    Parameters
    ----------
    run_dict : dict
        Probably parsed from the `trending.root` files and `logbook.root`.

    Returns
    -------
    dict :
        Input dictionary augmented with aliased trigger information
    """
    try:
        ps_run = _get_ps_for_run(run_dict)
    except:
        return run_dict

    n_trg_bits = ps_run.GetNTriggerBits()

    for ibit in range(n_trg_bits):
        # The provided TList seems to always have one element;
        # _one_ comma separated string of triggers
        # eg '+CEMC7-B-NOPF-CENTNOPMD,CDMC7-B-NOPF-CENTNOPMD &1024 *9'
        triggers_in_run = []
        trigger_alias = 'VEventBit{}'.format(ibit)
        run_dict[trigger_alias] = 0
        for s in ps_run.GetCollTrigClass(ibit):
            # TObjString to str
            s = str(s)
            ss = s.split('&')[0].split(',')
            ss = [s_dirty.strip(' ').strip('+') for s_dirty in ss]
            triggers_in_run += ss

        # Are any of this bit's trigger strings in the given run?
        for trg_string in triggers_in_run:
            run_dict[trigger_alias] += run_dict.get(trg_string, 0)

    return run_dict
