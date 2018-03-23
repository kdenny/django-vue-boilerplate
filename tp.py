# -*- coding: utf-8 -*-
import requests
import json
from pprint import pprint
import unicodecsv as csv

d = {
    'category': 'Adblocking',
    'animation': 'Takeover',
    'publisher': 'Grupo Abril',
    'text': 'Ad blocking ​reduction recoups over R $1mm the first year​',
    'origin': 'Sao Paulo',
    'side': 'right'
}

r = requests.post('http://127.0.0.1:8004/events/', data=d)
print(r.text)

# d = {
#     'category': 'Adblocking',
#     'animation': 'Takeover',
#     'publisher': 'Grupo Abril',
#     'text': 'Ad blocking ​reduction recoups over R $1mm the first year​',
#     'origin': 'Sao Paulo',
#     'side': 'right'
# }

# with open("/Users/kevindenny/Documents/globekit-cms/django-rest-boilerplate/publisher_list.csv", "rb") as fg:
#     rd = csv.DictReader(fg)
#     for row in rd:
#         print(row)
#         new_pub = {
#             'aid': row['aid'],
#             'name': row['name'],
#             'homepageUrl': row['website'],
#             'parentOrg': row['parent_org'],
#             'segment': row['segment'],
#             'account_manager': row['account_manager'],
#             'cs_id': row['cs_client_id'],
#             'integrationType': row['int_type']
#         }

#         r = requests.post('http://127.0.0.1:8000/publishers/', data=new_pub)
#         print(r.text)