import requests
import bs4
import sqlite3
import asyncio
import re

from utils import *

TERMS = ["fall", "iap", "spring", "summer"]


def scrape(DB_LOCATION):
    """
    Updates the database by scraping the UROP postings board.
    """
    JOBS_BOARD_URL = "https://urop.mit.edu/jobs-board"

    # Get UROP URLs.
    board_soup = bs4.BeautifulSoup(
        requests.get(JOBS_BOARD_URL).text,
        "html.parser"
    )
    urop_doms = board_soup.select("div.site-search-contact")
    urop_urls = [
        "https://urop.mit.edu" +
        urop_dom.select("div.site-search-button>a")[0]["href"]
        for urop_dom in urop_doms
    ]

    # Fetch all UROP URLs.
    async def get_urop_responses(urop_urls):
        """
        Concurrently fetch all UROP URLs.
        """
        loop = asyncio.get_event_loop()
        futures = {
            urop_url: loop.run_in_executor(None, requests.get, urop_url)
            for urop_url in urop_urls
        }
        return {
            urop_url: await future
            for urop_url, future in futures.items()
        }

    loop = asyncio.get_event_loop()
    urop_responses = loop.run_until_complete(get_urop_responses(urop_urls))

    # Get soups for UROPs.
    info_soups = {
        urop_url: bs4.BeautifulSoup(urop_response.text, "html.parser")
        .select("div.page-intro")[0]
        for urop_url, urop_response in urop_responses.items()
    }

    EMAIL_REGEX = "((?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\]))"

    def process_urop_block_text(s):
        """
        Replace \r\n and \n with <br>. Highlight hyperlinks and emails. Bold hours and money.
        """
        LINK_REGEX = "((http|ftp|https)://([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?)"
        tmp = s.replace("\r\n", "<br>").replace("\n", "<br>")
        tmp = re.sub(LINK_REGEX, "<a href=\"\g<1>\">\g<1></a>", tmp)
        tmp = re.sub(EMAIL_REGEX, "<a href=\"mailto: \g<1>\">\g<1></a>", tmp)
        tmp = re.sub("(\d+ (hr|hour)s?)", "<b>\g<1></b>", tmp)
        return re.sub("$\d+(\.\d+)?", "<b>\g<1></b>", tmp)

    # Some preliminary parsing.
    urop_tdp_fields = {
        urop_url: {
            "title": str(info_soup.select("h2")[0].decode_contents())
            .strip(),
            "description": process_urop_block_text(
                info_soup.select("div.row+h3+p")[0]
                .decode_contents().strip()
            ),
            "prereqs": process_urop_block_text(
                info_soup.select("div.row+h3+p+h3+p")[0]
                .decode_contents().strip()
            ),
        }
        for urop_url, info_soup in info_soups.items()
    }

    # Parse other well-formed fields.
    urop_field_soups = {
        urop_url: info_soup.select("div.urop-content")
        for urop_url, info_soup in info_soups.items()
    }
    urop_default_fields = {
        urop_url: {
            field_soup.select("h3")[0]
            .decode_contents().strip().lower()
            .replace(" ", "_").replace(":", ""):
                field_soup.select("p")[0].decode_contents().strip()
            for field_soup in field_soups
        }
        for urop_url, field_soups in urop_field_soups.items()
    }

    # Correct some fields in the default field parsing.
    def parse_contact(s):
        """
        Catches exceptions in parsing the contact field.
        """
        try:
            return re.findall(EMAIL_REGEX, s)[0]
        except:
            return ""

    urop_corrected_fields = {
        urop_url: {
            "term": [
                term.lower()
                for term in default_fields["term"].split("/")
                if term.lower() in TERMS
            ],
            "apply_by": parse_datetime(default_fields["apply_by"]),
            "contact": parse_contact(default_fields["contact"]),
        }
        for urop_url, default_fields in urop_default_fields.items()
    }

    # Merge results from previous parsings.
    parsed_urops = {}
    for urop_url in urop_urls:
        parsed_urops[urop_url] = urop_tdp_fields[urop_url]
        parsed_urops[urop_url].update(urop_default_fields[urop_url])
        parsed_urops[urop_url].update(urop_corrected_fields[urop_url])

    # Add parsed UROPs to database. If already exists, update all fields and last_seen. posted should never be updated.
    db_connection = sqlite3.connect(DB_LOCATION)
    db_cursor = db_connection.cursor()
    now_datetime = datetime.datetime.now()
    for urop_url, parsed_urop in parsed_urops.items():
        db_cursor.execute("""
        INSERT OR REPLACE INTO urops VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            COALESCE((SELECT posted FROM urops WHERE url = ?), ?),
            ?
        );""", (
            urop_url,
            parsed_urop["title"],
            parsed_urop["description"],
            parsed_urop["prereqs"],
            int("".join([
                '1' if TERMS[a] in parsed_urop["term"] else '0'
                for a in range(0, len(TERMS))
            ]), 2),  # Term, one bit for each term.
            parsed_urop["department"],
            parsed_urop["faculty_supervisor"],
            parsed_urop["faculty_email"],
            parsed_urop["apply_by"],
            parsed_urop["contact"],
            urop_url,
            now_datetime,  # Default value for posted.
            now_datetime
        ))
    db_connection.commit()
    db_connection.close()
