# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render

from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Event, Category, City
from .serializers import EventReadSerializer, EventCreateSerializer, CategoryReadSerializer, CityReadSerializer

import json
from pprint import pprint

# Create your views here.

def create_city(city_id, data):
    city_exists = City.objects.filter(city_id=city_id)
    alt_id = city_id + '-' + data['region']
    alt_city_exists = City.objects.filter(city_id=alt_id)
    if len(city_exists) < 1:
        City.objects.create(
            city_id=city_id, 
            name=data['name'], 
            region=data['region'], 
            latitude=data['latitude'], 
            longitude=data['longitude'])
        return city_id
    else:
        ctest = city_exists[0]
        print(ctest)
        lat_diff = float(ctest.latitude - data['latitude'])
        lon_diff = float(ctest.longitude - data['longitude'])
        if lat_diff < 0.25:
            print("City found!")
            return city_id
        else:
            if len(alt_city_exists) < 1:
                City.objects.create(
                    city_id=alt_id, 
                    name=data['name'], 
                    region=data['region'], 
                    latitude=data['latitude'], 
                    longitude=data['longitude'])
                return alt_id
            else:
                return alt_id

class EventList(APIView):

    def get(self, request):
        events = Event.objects.all()
        serializer = EventReadSerializer(events, many=True)
        return Response(serializer.data)

    def post(self, request):
        city_id = str(request.data['origin']['name']).lower().replace(" ","-")

        new_event = {
            'category': str(request.data['category']),
            'animation': str(request.data['animation']),
            'publisher': request.data['publisher']['aid'],
            'text': request.data['text'],
            'origin': city_id,
            'arc_connections': [],
            'side': str(request.data['side'])
        }
        
        new_event['origin'] = create_city(city_id, request.data['origin'])

        if len(request.data['arc_connections']) > 0:
            for arc in request.data['arc_connections']:
                cid = arc['name'].lower().replace(" ","-")
                new_event['arc_connections'].append(create_city(cid, arc))
        
        serializer = EventCreateSerializer(data=new_event)
        if serializer.is_valid():
            serializer.save()
            new_events = Event.objects.all()
            rserializer = EventReadSerializer(new_events, many=True)
            return Response(rserializer.data)
        else:
            return Response(serializer.errors)

class GlobekitData(APIView):

    def get(self, request):
        categories = Category.objects.all()
        cat_serializer = CategoryReadSerializer(categories, many=True)
        cities = City.objects.all()
        city_serializer = CityReadSerializer(cities, many=True)
        events = Event.objects.all()
        event_serializer = EventReadSerializer(events, many=True)

        data = {
            'categories': cat_serializer.data,
            'cities': city_serializer.data,
            'events': event_serializer.data
        }

        return Response(data)