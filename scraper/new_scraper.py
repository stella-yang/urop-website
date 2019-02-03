from urllib.request import urlopen
from bs4 import BeautifulSoup
from dateutil.parser import parse
import sys
import os
import re

def toRelPath(origPath):
	'''Converts path to path relative to current script

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

urop_delinations= soup.find_all("hr")

urop_dictionary_list = []

for urop_entry in urop_delinations:
    urop_dict = {}
    date = ''
    term = 'Unspecified'
    department = 'Department Unlisted'
    supervisor = ''
    project_title = 'No Title'
    project_desc = ''
    contacts = []

    current_element = urop_entry.find_next_sibling()

    if (current_element != None):
        while(current_element.name != "hr"):

            current_text = current_element.get_text()

            if(current_element.name == "h4"):
                for c in current_text.split("\n"):
                    current_text = c

                    if (is_date(current_text)):
                        date = current_text

                    elif (is_term(current_text)):
                        term = parse_terms(current_text)

                    elif (is_dept(current_text)):
                        department = parse_dept(current_text)

                    elif ('MIT Faculty Supervisor' in current_text):
                        split = current_text.split(':')
                        supervisor = split[1]

            elif ('Project Title' in current_text):
                index = current_text.index(':')
                project_title = current_text[index+2:]

            elif ('Contact:' in current_text):
                index = current_text.index(':')
                contact = current_text[index+2:]
                contactArray = contact.split()

                for contactText in contactArray:
                    if '@' in contactText:
                        my_string = contactText.rstrip('.')
                        contacts.append(my_string)
            else:
                project_desc += str(current_element)

            current_element = current_element.find_next_sibling()
            if (current_element == None):
                break

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
    urop_dict['project_desc'] = project_desc
    urop_dict['contact'] = contact_str

    urop_dictionary_list.append(urop_dict)

orig_stdout = sys.stdout
f = open(toRelPath('../website/data.js'), 'w', encoding='utf-8')
sys.stdout = f

print('var data = ')
print(str(urop_dictionary_list), end=';')

sys.stdout = orig_stdout
f.close()
