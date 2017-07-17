import sys
import contextlib
import os
import io
import logging

from rootpy.io import root_open
import ROOT

import models
from pony import orm


# Suppress waring messages about runs not being found
logging.basicConfig(level=logging.ERROR)
logging.disable(level=logging.WARNING)
# logging.getLogger("W-AliOADBContainer").setLevel(logging.ERROR)

# Set the loglevel to kError
ROOT.AliLog.SetGlobalLogLevel(1)


@contextlib.contextmanager
def nostdout():
    save_stdout = sys.stdout
    sys.stdout = io.BytesIO()
    yield
    sys.stdout = save_stdout


file_path = '$ALICE_PHYSICS/OADB/COMMON/PHYSICSSELECTION/data/physicsSelection.root'
physSel = root_open(os.path.expandvars(file_path)).physSel


def _get_ps_for_run(run, lhc_beam_mode, beam_type):
    try:
        if lhc_beam_mode != 'STABLE BEAMS':
            raise ValueError("Not a stable beam")
    except KeyError:
        raise ValueError("No LHC status for this run")

    # not all runs are automatically recognized. If it is not
    # found, the returned index is 1 :P
    # If thats the case, fish out the default config depending on the beam type
    # with nostdout():
    ps_idx = physSel.GetIndexForRun(run)
    if ps_idx >= 0:
        return physSel.GetObjArray()[ps_idx]
    else:
        defaults = [el for el in physSel.GetDefaultList()]
        try:
            # Beam type is populated form the logbook
            if beam_type == 'Pb-Pb':
                default = next(el for el in defaults if 'PbPb' in el.GetName())
                return default
            elif beam_type == 'p-p':
                # Yes, these are upper case "P"s, don't act surprised!
                return next(el for el in defaults if 'PP' in el.GetName())
            else:
                raise ValueError(
                    ("No defaults found for run {} of type {}"
                     .format(run, beam_type)))
        except KeyError:
            raise KeyError("`beamType` field is not present in the given dict")


@orm.db_session
def map_trigger_strings_to_bits():
    def map_bits_to_strings(run, lhc_beam_mode, beam_type):
        try:
            ps_run = _get_ps_for_run(run, lhc_beam_mode, beam_type)
        except:
            return {}

        bit_to_string_map = {}
        n_trg_bits = ps_run.GetNTriggerBits()
        for ibit in range(n_trg_bits):
            # The provided TList seems to always have one element;
            # _one_ comma separated string of triggers
            # eg '+CEMC7-B-NOPF-CENTNOPMD,CDMC7-B-NOPF-CENTNOPMD &1024 *9'
            triggers_in_run = []
            for s in ps_run.GetCollTrigClass(ibit):
                # TObjString to str
                ss = str(s).split('&')[0].split(',')
                ss = [s_dirty.strip(' ').strip('+') for s_dirty in ss]
                triggers_in_run += ss
            if triggers_in_run:
                bit_to_string_map[ibit] = triggers_in_run
        return bit_to_string_map

    q = orm.select((l.run, l.lhc_beam_mode, l.beam_type)
                   for t in models.Trendentry
                   for l in models.Logentry if (t.run == l.run and
                                                "STABLE" in l.lhc_beam_mode))
    # cache some data. This is done in order to avoid a nested db_session
    for run, lhc_beam_mode, beam_type in q:
        t_strings = models.TriggerString.select(lambda ts: ts.run == run)
        # Each key has a list of trigger strings
        for t_bit, ss in map_bits_to_strings(run, lhc_beam_mode, beam_type).items():
            t_bit_inst = models.TriggerBit(bit=t_bit, run=run)
            # create relation between this bit and the trigger strings associated with it
            t_bit_inst.triggerstrings.add(t_strings.filter(lambda s_entry: s_entry.string in ss))
