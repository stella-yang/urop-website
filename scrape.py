import requests
import bs4
import re
import datetime
from dateutil import parser

JOBS_BOARD = "https://urop.mit.edu/jobs-board"
VALID_TERMS = ["fall", "iap", "spring", "summer"]
TIME_FORMAT = "%m/%d/%y"
EMAIL_REGEX = "((?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\]))"


def br_newlines(s):
    return s.replace("\r\n", "<br>").replace("\n", "<br>")


def hyperlink_links(s):
    return re.sub("((http|ftp|https)://([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?)", "<a href=\"\g<1>\">\g<1></a>", s)


def mailto_emails(s):
    return re.sub(EMAIL_REGEX, "<a href=\"mailto: \g<1>\">\g<1></a>", s)


def bold_hours(s):
    return re.sub("(\d+ (hr|hour)s?)", "<b>\g<1></b>", s)


def bold_money(s):
    return re.sub("$\d+(\.\d+)?", "<b>\g<1></b>", s)


def first_email(s):
    return re.findall(EMAIL_REGEX, s)[0]


def run(old_data):
    """
    run returns a tuple
    the first element in the tuple is dict of urops, each a dictionary with the fields

    detail_url (as key)

    title
    description
    prereqs

    term
    department
    faculty_supervisor & supervisor
    faculty_email
    apply_by
    contact

    posted

    valid (0 if not on the job postings site anymore, otherwise 1)

    the second element in the tuple is a set of keys of URLs, which specify which entries in the dict are new entries
    """

    urop_infos = {}
    new_entries = set()

    print("[" + str(datetime.datetime.now()) +
          "] Scraping...")

    try:
        # deepcopy and mark everything as expired
        for url in old_data.keys():
            urop_infos[url] = old_data[url].copy()
            urop_infos[url]["valid"] = 0

        # query the general jobs board
        board_soup = bs4.BeautifulSoup(requests.get(
            JOBS_BOARD, timeout=60).text, "html.parser")
        urop_entries = board_soup.select("div.site-search-contact")
        for urop_entry in urop_entries:
            # for each urop entry, go to its detail page and get relevant info
            more_info_dom = urop_entry.select("div.site-search-button>a")[0]
            more_info_url = "https://urop.mit.edu" + more_info_dom["href"]

            # if already exists, then don't set the posted date
            # but do scrape again, just in case
            if more_info_url not in urop_infos.keys():
                urop_infos[more_info_url] = {
                    "posted": datetime.datetime.now().strftime(TIME_FORMAT)
                }
                new_entries.add(more_info_url)
            info = urop_infos[more_info_url]
            info["valid"] = 1

            # get the website data
            urop_soup = bs4.BeautifulSoup(requests.get(
                more_info_url, timeout=60).text, "html.parser")
            info_soup = urop_soup.select("div.page-intro")[0]

            # parse the detail page
            info["title"] = str(info_soup.select("h2")
                                [0].decode_contents()).strip()
            info["description"] = info_soup.select(
                "div.row+h3+p")[0].decode_contents().strip()
            info["prereqs"] = info_soup.select("div.row+h3+p+h3+p")[
                0].decode_contents().strip()

            # parse the raw fields
            urop_content_soups = info_soup.select("div.urop-content")
            for field_soup in urop_content_soups:
                unparsed_field_name = field_soup.select(
                    "h3")[0].decode_contents().strip()
                field_name = unparsed_field_name.lower().replace(
                    " ", "_").replace(":", "")

                field_content = field_soup.select(
                    "p")[0].decode_contents().strip()
                info[field_name] = field_content

            # try to normalize the fields, parse links and times

            # title
            # typically well-formed

            # description
            info["description"] = br_newlines(info["description"])
            info["description"] = hyperlink_links(info["description"])
            info["description"] = bold_hours(info["description"])
            info["description"] = bold_money(info["description"])
            info["description"] = mailto_emails(info["description"])

            # prereqs
            info["prereqs"] = br_newlines(info["prereqs"])
            info["prereqs"] = hyperlink_links(info["prereqs"])
            info["prereqs"] = bold_hours(info["prereqs"])
            info["prereqs"] = bold_money(info["prereqs"])
            info["prereqs"] = mailto_emails(info["prereqs"])

            # term
            # replace with a list of "fall", "iap", "spring", and "summer", or empty if invalid
            terms = info["term"].split("/")
            info["term"] = []
            for term in terms:
                if term.lower() in VALID_TERMS:
                    info["term"].append(term.lower())

            # department
            # typically well-formed

            # faculty_supervisor
            # typically well-formed

            # faculty_email
            # not used

            # apply_by
            # parse into mm/dd/yy or "" if unparsable
            try:
                info["apply_by"] = parser.parse(
                    info["apply_by"]).strftime(TIME_FORMAT)
            except:
                info["apply_by"] = ""

            # contact
            # parse first email, or "" if unparsable
            try:
                info["contact"] = first_email(info["contact"])
            except:
                info["contact"] = ""

        print("[" + str(datetime.datetime.now()) +
              "] Success.")
    except:
        # something went wrong, preserve the last working state
        print("[" + str(datetime.datetime.now()) +
              "] Failed.")
        import traceback
        traceback.print_exc()
        return (old_data, set())

    return (urop_infos, new_entries)
