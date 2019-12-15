import requests
import bs4
import datetime


def run():
    """
    run returns a list of urops, each a dictionary with the fields

    detail_url
    title
    term
    supervisor
    department
    email
    apply
    contact
    description
    prereqs
    """
    JOBS_BOARD = "https://urop.mit.edu/jobs-board"
    UROP_FIELDS = ["term", "department",
                   "supervisor", "email", "apply", "contact"]

    urop_infos = []

    print("[" + str(datetime.datetime.now()) + "] Running scraper...", end="\r")

    # query the general jobs board
    board_soup = bs4.BeautifulSoup(requests.get(
        JOBS_BOARD, timeout=60).text, "html.parser")
    urop_entries = board_soup.select("div.site-search-contact")
    for urop_entry in urop_entries:
        # for each urop entry, go to its detail page and get relevant info
        more_info_dom = urop_entry.select("div.site-search-button>a")[0]
        more_info_url = "https://urop.mit.edu" + more_info_dom["href"]
        urop_soup = bs4.BeautifulSoup(requests.get(
            more_info_url, timeout=60).text, "html.parser")
        info_soup = urop_soup.select("div.page-intro")[0]

        urop_infos.append({})
        urop_infos[-1]["detail_url"] = more_info_url

        # parse the detail page
        urop_infos[-1]["title"] = str(info_soup.select("h2")
                                      [0].decode_contents()).strip()
        urop_content_soups = info_soup.select("div.urop-content")
        for field_soup in urop_content_soups:
            unparsed_field_name = field_soup.select(
                "h3")[0].decode_contents().strip().lower()
            field_name = ""

            # find the field this unparsed field name corresponds to
            for field in UROP_FIELDS:
                if field in unparsed_field_name:
                    field_name = field
                    break

            field_content = field_soup.select("p")[0].decode_contents().strip()
            urop_infos[-1][field_name] = field_content
        urop_infos[-1]["description"] = info_soup.select(
            "div.row+h3+p")[0].decode_contents().strip()
        urop_infos[-1]["prereqs"] = info_soup.select("div.row+h3+p+h3+p")[
            0].decode_contents().strip()

    return urop_infos
