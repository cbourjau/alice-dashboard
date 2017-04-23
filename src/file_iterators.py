import string
import requests
import logging

# Disable silly logging
logging.getLogger("requests").setLevel(logging.WARNING)


def logbook_file_iter(start_year, end_year):
    """
    Download logbook files and yield the abs path
    """
    years = range(start_year, end_year + 1)
    for y in years:
        print "Downloading data for year {}...".format(y)
        for char in string.lowercase:
            period = 'LHC{}{}'.format(y - 2000, char)
            url = "http://aliqamodafs.web.cern.ch/aliqamodafs/data/{}/{}/".format(y, period)
            online_fname = "logbook.root"
            r = requests.get(url + online_fname)
            if r.status_code != 200:
                # Some periods leave out a letter...
                continue
            with open("/tmp/{}_{}".format(period, online_fname), 'wb') as f:
                f.write(r.content)
                fname = (f.name)
            yield fname


def trending_file_iter(start_year, end_year):
    """
    Download trending.root files and yield the abs path
    """
    years = range(start_year, end_year + 1)
    for y in years:
        print "Downloading data for year {}...".format(y)
        online_fname = "trending.root"
        url = "http://aliqaevs.web.cern.ch/aliqaevs/data/{}/".format(y)
        r = requests.get(url + online_fname)
        if r.status_code == 200:
            with open("/tmp/{}_{}".format(y, online_fname), 'wb') as f:
                f.write(r.content)
                fname = (f.name)
            yield fname
        else:
            # Periods befor 2013 have one file per period and different passes
            for char in string.lowercase:
                period = 'LHC{}{}'.format(y - 2000, char)
                # The pass is either 2 or 4
                for pass_num in range(5, 0, -1):
                    url_period = url + '{}/pass{}/'.format(period, pass_num)
                    r = requests.get(url_period + online_fname)
                    if r.status_code == 200:
                        with open("/tmp/{}_{}".format(y, online_fname), 'wb') as f:
                            f.write(r.content)
                            fname = (f.name)
                        yield fname
                        break
