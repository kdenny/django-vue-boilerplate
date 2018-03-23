from rest_framework import serializers

from .models import Event, Category, City

class EventReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event

        fields = ('id', 'category', 'animation', 'publisher', 'text', 'origin', 'arc_connections', 'side', )
        depth = 1

class CategoryReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category

        fields = ('name', 'order', )

class CityReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = City

        fields = ('city_id', 'name', 'region', 'latitude', 'longitude', )

class EventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event

        fields = ('category', 'animation', 'publisher', 'text', 'origin', 'arc_connections', 'side', )