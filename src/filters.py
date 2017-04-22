
# Keys which are used by the dashboard
dashboard_keys = [
    'run',
    'fill',
    'timeStart',
    'timeEnd',
    'run_duration',
    'partition',
    'lhcPeriod',
    'lhcState',
    'activeDetectors',
    'lumi_seen',
    'beamType',
    'beamEnergy',
] + ['VEventBit{}'.format(i) for i in range(31)]


def has_required_keys(d, req_keys):
    """
    Check if the given dictionary has all the fields reqired by the dashboard
    """
    # for key in req_keys:
    #     if key not in d.keys():
    #         print "{} not found in {}".format(key, d.keys())
    return set(req_keys).issubset(d.keys())


def keep_keys(d, keys):
    """
    Return a new dict wich only contains the values for the given keys.
    """
    return {key: d[key] for key in keys}
