from parsers import parse_logbook, parse_trending
from file_iterators import trending_file_iter, logbook_file_iter
from trigger2bit import map_trigger_strings_to_bits


def create_db():
    """
    Create the database with information from various sources.
    """
    for fname in logbook_file_iter(2010, 2016):
        parse_logbook(fname)
    for fname in trending_file_iter(2010, 2016):
        parse_trending(fname)
    map_trigger_strings_to_bits()


if __name__ == '__main__':
    create_db()
