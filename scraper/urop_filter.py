from urllib.request import urlopen
from bs4 import BeautifulSoup
from dateutil.parser import parse
import sys
import pymysql

orig_stdout = sys.stdout
f = open(toRelPath('../website/data.js'), 'w')
sys.stdout = f

print("var data = ")

def is_date(string):
    try:
        parse(string)
        return True
    except ValueError:
        return False

def is_term(string):
    s = string.lower()
    term_list = ["summer", "fall", "spring", "iap"]
    return (("term:" in s) or ("term urop is offered: " in s) or (s in term_list))

def parse_terms(string):
    s = string.lower()
    ret_list = []
    if ("summer" in s):
        ret_list.append("Summer")
    if ("fall" in s):
        ret_list.append("Fall")
    if ("spring" in s):
        ret_list.append("Spring")
    if ("iap" in s):
        ret_list.append("IAP")
    return ret_list

def is_dept(string):
    return (("UROP Department, Lab or Center: " in string) or ("Department/Lab/Center" in string))

def parse_dept(string):
    if ("UROP Department, Lab or Center: " in string):
        return string[32:]
    else:
        return string[23:]

#Website URL
link = "http://uaap.mit.edu/research-exploration/urop/apply/urop-advertised-opportunities"

#Query the website and return the html to the variable 'page'
page = urlopen(link)

soup = BeautifulSoup(page, "html.parser")

body_text = soup.get_text()

index1 = body_text.find('Available UROPs')
index2 = body_text.find('Find Projects & ApplyPreparing for ProjectsFindin')

body_text = body_text[index1+16:index2]

urop_list = []
prev_entry = ""
for eachLine in body_text.split('\n'):
    is_line_date = is_date(eachLine)

    if (is_line_date):
        urop_list.append(prev_entry)
        prev_entry = eachLine + '\n'
    else:
        prev_entry += eachLine + '\n'

urop_list = urop_list[1:]

urop_dictionary_list = []

for eachListing in urop_list:
    urop_dict = {}
    date = ""
    term = "No Term Specified"
    department = "Department Unlisted"
    supervisor = ""
    project_title = "No Title"
    project_desc = ""
    prereqs = "None"
    contact = ""
    relevant_url = ""
    contactString = ""

    last_section_header = ""
    for eachLine in eachListing.split('\n'):
        if (is_date(eachLine)):
            date = eachLine

        elif (is_term(eachLine)):
            term = parse_terms(eachLine)

        elif (is_dept(eachLine)):
            department = parse_dept(eachLine)

        elif ("MIT Faculty Supervisor" in eachLine):
            split = eachLine.split(":")
            supervisor = split[1]

        elif ("Project Title" in eachLine):
            index = eachLine.index(":")
            project_title = eachLine[index+2:]

        elif ("Project Description" in eachLine):
            index = eachLine.index(":")
            project_desc = eachLine[index+2:]
            last_section_header = "project_desc"

        elif ("Prerequisites:" in eachLine or "Requirements:" in eachLine):
            index = eachLine.index(":")
            prereqs = eachLine[index+2:]
            last_section_header = "project_desc"

        elif ("Relevant URL:" in eachLine):
            index = eachLine.index(":")
            relevant_url = eachLine[index+2:]
            last_section_header = "relevant_url"

        elif ("Contact:" in eachLine):
            index = eachLine.index(":")
            contact = eachLine[index+2:]
            contactArray = contact.split()

            for contactText in contactArray:
                if "@" in contactText:
                    my_string = contactText.rstrip('.')
                    contactString += my_string[1:-1]

        else:
            if (last_section_header == "project_desc"):
                project_desc += eachLine
            elif (last_section_header == "prereqs"):
                prereqs += eachLine
            elif (last_section_header == "relevant_url"):
                relevant_url += eachLine


    term_string = ""
    for each_term in term:
        term_string += each_term + ", "

    term_string = term_string[:-2]

    urop_dict["date"] = date
    urop_dict["term"] = term_string
    urop_dict["department"] = department
    urop_dict["supervisor"] = supervisor
    urop_dict["project_title"] = project_title
    urop_dict["project_desc"] = project_desc
    urop_dict["prereqs"] = prereqs
    urop_dict["contact"] = contactString
    urop_dict["relevant_url"] = relevant_url

    urop_dictionary_list.append(urop_dict)
print (urop_dictionary_list)
print (';')

sys.stdout = orig_stdout
f.close()

# connection.close()
