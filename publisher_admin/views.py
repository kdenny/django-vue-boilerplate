# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render

from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Publisher, Organization, AccountManager
from .serializers import PublisherReadSerializer, PublisherCreateSerializer, OrganizationCreateSerializer

import json
from pprint import pprint

# Create your views here.

class PublisherList(APIView):

    def get(self, request):
        publishers = Publisher.objects.all().order_by('name')
        serializer = PublisherReadSerializer(publishers, many=True)
        return Response(serializer.data)

    def post(self, request):
        
        new_pub = {
            'aid': str(request.data['aid']),
            'name': str(request.data['name']),
            'homepageUrl': str(request.data['homepageUrl']),
            'integrationType': request.data['integrationType']
        }
        org_exists = Organization.objects.filter(name=str(request.data['parentOrg']))
        if len(org_exists) < 1:
            account_manager = AccountManager.objects.get(name=str(request.data['account_manager']))
            og = Organization.objects.create(name=str(request.data['parentOrg']), cs_id=str(request.data['cs_id']), account_manager=account_manager, segment=str(request.data['segment']))
            og.save()
            new_pub['parentOrg'] = og.cs_id
        else:
            new_pub['parentOrg'] = org_exists[0].cs_id
        pprint(new_pub)
        serializer = PublisherCreateSerializer(data=new_pub)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors)
