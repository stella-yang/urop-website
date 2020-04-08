import datetime
from dateutil import parser

TIME_FORMAT = "%m/%d/%y"


def parse_datetime(s):
    """
    Convert a time string into a central format.
    """
    try:
        return parser.parse(s).strftime(TIME_FORMAT)
    except:
        return ""


def unparse_datetime(s):
    """
    Parse central format into datetime object.
    """
    return datetime.datetime.strptime(s, TIME_FORMAT)


def print_with_datetime(s):
    print("[" + str(datetime.datetime.now()) + "]", s)
