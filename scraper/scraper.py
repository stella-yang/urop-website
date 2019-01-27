from urllib.request import urlopen
from bs4 import BeautifulSoup
from dateutil.parser import parse
import sys
import os
import re

def toRelPath(origPath):
	'''
    Converts path to path relative to current script

	origPath:	path to convert
	'''
	try:
		if not hasattr(toRelPath, '__location__'):
			toRelPath.__location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
		return os.path.join(toRelPath.__location__, origPath)
	except NameError:
		return origPath

def is_date(string):
    try:
        parse(string)
        return True
    except ValueError:
        return False

def is_term(string):
    s = string.lower()
    term_list = ['summer', 'fall', 'spring', 'iap']
    return (('term:' in s) or ('term urop is offered: ' in s) or (s in term_list))

def parse_terms(string):
    s = string.lower()
    ret_list = []
    if ('summer' in s):
        ret_list.append('Summer')
    if ('fall' in s):
        ret_list.append('Fall')
    if ('spring' in s):
        ret_list.append('Spring')
    if ('iap' in s):
        ret_list.append('IAP')
    return ret_list

def is_dept(string):
    return (('UROP Department, Lab or Center: ' in string) or ('Department/Lab/Center' in string))

def parse_dept(string):
    if ('UROP Department, Lab or Center: ' in string):
        return string[32:]
    else:
        return string[23:]

#Website URL
link = 'http://uaap.mit.edu/research-exploration/urop/apply/urop-advertised-opportunities'

#Query the website and return the html to the variable 'page'
page = urlopen(link)

soup = BeautifulSoup(page, 'html.parser')

body_text = soup.get_text()

index1 = body_text.find('Available UROPs')
index2 = body_text.find('Find Projects & ApplyPreparing for ProjectsFindin')

body_text = body_text[index1+16:index2]

urop_list = []
prev_entry = ''
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
    date = ''
    term = 'Unspecified'
    department = 'Department Unlisted'
    supervisor = ''
    project_title = 'No Title'
    project_desc = ''
    prereqs = 'None'
    relevant_url = ''
    contacts = []

    last_section_header = ''
    for eachLine in eachListing.split('\n'):
        if (is_date(eachLine)):
            date = eachLine

        elif (is_term(eachLine)):
            term = parse_terms(eachLine)

        elif (is_dept(eachLine)):
            department = parse_dept(eachLine)

        elif ('MIT Faculty Supervisor' in eachLine):
            split = eachLine.split(':')
            supervisor = split[1]

        elif ('Project Title' in eachLine):
            index = eachLine.index(':')
            project_title = eachLine[index+2:]

        elif ('Project Description' in eachLine):
            if (':' in eachLine):
                index = eachLine.index(':')
                project_desc = eachLine[index+2:] + '\n'
                last_section_header = 'project_desc'

        elif ('Prerequisites:' in eachLine or 'Requirements:' in eachLine):
            index = eachLine.index(':')
            prereqs = eachLine[index+2:]
            last_section_header = 'project_desc'

        elif ('Relevant URL:' in eachLine):
            index = eachLine.index(':')
            relevant_url = eachLine[index+2:]
            last_section_header = 'relevant_url'

        elif ('Contact:' in eachLine):
            index = eachLine.index(':')
            contact = eachLine[index+2:]
            contactArray = contact.split()

            for contactText in contactArray:
                if '@' in contactText:
                    my_string = contactText.rstrip('.')
                    contacts.append(my_string)

        else:
            if (last_section_header == 'project_desc'):
                project_desc += eachLine + '\n'
            elif (last_section_header == 'prereqs'):
                prereqs += eachLine + '\n'
            elif (last_section_header == 'relevant_url'):
                relevant_url += eachLine


    term_string = ''

    if term != 'Unspecified':
        for each_term in term:
            term_string += each_term + ', '

        term_string = term_string[:-2]
    else:
        term_string = 'Unspecified'

    #clean/concatenate contacts into a string
    contact_str = ''
    for contact in contacts:
        m = re.search('[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', contact)
        contact_str += m.group(0) + ', '
    contact_str = contact_str[:-2]

    urop_dict['date'] = date.rstrip()
    urop_dict['term'] = term_string
    urop_dict['department'] = department
    urop_dict['supervisor'] = supervisor
    urop_dict['project_title'] = project_title
    # todo: fix this in the js
    urop_dict['project_desc'] = project_desc + 'Prerequisites: ' + prereqs
    urop_dict['prereqs'] = prereqs
    urop_dict['contact'] = contact_str
    urop_dict['relevant_url'] = relevant_url
    # todo: fix this in the js
    urop_dict['search_text'] = project_title + ' ' + project_desc + prereqs + contact_str

    urop_dictionary_list.append(urop_dict)

orig_stdout = sys.stdout
f = open(toRelPath('../website/data.js'), 'w', encoding='utf-8')
sys.stdout = f

print('var data = ')
print(str(urop_dictionary_list), end=';')

sys.stdout = orig_stdout
f.close()