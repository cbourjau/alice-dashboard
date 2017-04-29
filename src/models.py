import re
from datetime import datetime
from pony import orm
from pony.orm import Database, PrimaryKey, Optional, Required, Set

db = Database()


class Logentry(db.Entity):
    run = PrimaryKey(int)
    average_data_rate_event_builder = Required(float)
    average_data_rate_readout = Required(float)
    average_data_rate_recorded = Required(float)
    average_events_per_second = Required(float)
    average_sub_events_per_second = Required(float)
    beam_energy = Required(float)
    beam_type = Optional(str)
    calibration = Required(int)
    ctp_duration = Required(float)
    daq_success = Required(int)
    daq_time_end = Required(float)
    daq_time_start = Required(float)
    data_migrated = Optional(str)
    detector = Optional(str)
    detector_mask = Required(int)
    dipole_magnet_current = Required(float)
    ecs_iteration_current = Required(int)
    ecs_iteration_total = Required(int)
    ecs_success = Required(int)
    eor_reason = Optional(str)
    event_building = Required(int)
    force_lhc_reco = Optional(str)
    gd_clocal_recording = Required(int)
    gd_cm_stream_recording = Required(int)
    hl_tmode = Optional(str)
    l2a = Required(int, size=64)
    l3_magnet_current = Required(float)
    ld_clocal_recording = Required(int)
    lhc_period = Optional(str)
    lhc_beam_mode = Optional(str)
    lhc_beta_star = Required(float)
    lhc_fill_number = Required(int)
    lhc_filling_scheme_name = Optional(str)
    lhc_info_status = Optional(str)
    lhc_inst_intensity_interacting_beam1_avg = Required(float)
    lhc_inst_intensity_interacting_beam1_eor = Required(float)
    lhc_inst_intensity_interacting_beam1_sor = Required(float)
    lhc_inst_intensity_interacting_beam2_avg = Required(float)
    lhc_inst_intensity_interacting_beam2_eor = Required(float)
    lhc_inst_intensity_interacting_beam2_sor = Required(float)
    lhc_inst_intensity_non_interacting_beam1_avg = Required(float)
    lhc_inst_intensity_non_interacting_beam1_eor = Required(float)
    lhc_inst_intensity_non_interacting_beam1_sor = Required(float)
    lhc_inst_intensity_non_interacting_beam2_avg = Required(float)
    lhc_inst_intensity_non_interacting_beam2_eor = Required(float)
    lhc_inst_intensity_non_interacting_beam2_sor = Required(float)
    lhc_total_interacting_bunches = Required(int)
    lhc_total_non_interacting_bunches_beam1 = Required(int)
    lhc_total_non_interacting_bunches_beam2 = Required(int)
    log = Optional(str)
    number_of_detectors = Required(int)
    number_of_failed_par = Required(int)
    number_of_gd_cs = Required(int)
    number_of_ld_cs = Required(int)
    number_of_par = Required(int)
    number_of_streams = Required(int)
    partition = Optional(str)
    pause_duration = Required(int)
    run_duration = Required(int)
    run_quality = Optional(str)
    run_type = Optional(str)
    splitter_detector_mask = Required(int)
    time_completed = Required(float)
    time_created = Required(float)
    time_update = Required(datetime)
    total_data_event_builder = Required(float)
    total_data_readout = Required(float)
    total_data_recorded = Required(float)
    total_events = Required(int)
    total_events_calibration = Required(int)
    total_events_incomplete = Required(int)
    total_events_physics = Required(int)
    total_number_of_files_closed = Required(int)
    total_number_of_files_migrated = Required(int)
    total_number_of_files_migrating = Required(int)
    total_number_of_files_migration_requested = Required(int)
    total_number_of_files_waiting_migration = Required(int)
    total_number_of_files_writing = Required(int)
    total_sub_events = Required(int)
    trg_time_end = Required(float)
    trg_time_start = Required(float)


class Trendentry(db.Entity):
    run = PrimaryKey(int)
    active_detectors = Optional(str)
    bcs = Required(int)
    bcs_a = Optional(int, default=0)
    bcs_c = Optional(int, default=0)
    bcs_e = Optional(int, default=0)
    fill = Required(int)
    interaction_rate = Required(float)
    lhc_period = Optional(str)  # Not present pre 2013!
    lhc_state = Optional(str)   # Not present pre 2013!
    lumi_seen = Required(float)
    mu = Required(float)
    partition = Optional(str)
    ref_counts = Optional(float, default=0)
    ref_l0b = Optional(float, default=0)
    run_duration = Required(float)
    time_end = Optional(datetime)
    time_start = Optional(datetime)


class TriggerString(db.Entity):
    run = Required(int)
    string = Required(str)
    orm.PrimaryKey(run, string)
    counts = Required(int, size=64)
    triggerbits = Set("TriggerBit")

    @classmethod
    def get_or_create(cls, **kwargs):
        r = cls.get(**kwargs)
        if r is None:
            return cls(**kwargs), True
        else:
            return r, False


class TriggerBit(db.Entity):
    run = Required(int)
    bit = Required(int)
    orm.PrimaryKey(run, bit)
    triggerstrings = Set(TriggerString)

    @classmethod
    def get_or_create(cls, **kwargs):
        r = cls.get(**kwargs)
        if r is None:
            return cls(**kwargs), True
        else:
            return r, False


# class TriggerRun(db.Entity):
#     trigger = Required(Trigger)
#     run = Required(Trendentry)
#     orm.PrimaryKey(trigger, run)
#     counts = Required(int, size=64)
#     trigger_bits = Set(TriggerBit)


def convert(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    s1 = re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
    s1 = s1.replace('lh_c', 'lhc_')
    s1 = s1.replace('refl0', r'ref_l0')
    s1 = s1.replace('__', '_')
    return s1


db.bind('sqlite', ':memory:')
db.generate_mapping(create_tables=True)


# orm.count(tr for tr in orm.get(bit for bit in models.TriggerBit if bit.bit == '1').trigger_runs if tr.run in orm.select(te for te in models.Trendentry if '16e' in te.lhc_period))
