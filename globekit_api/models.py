# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from publisher_admin.models import Publisher

# Create your models here.

class Category(models.Model):
    name = models.CharField(max_length=50, primary_key=True)
    order = models.IntegerField()

        # Returns the string representation of the model.
    def __unicode__(self):              # __unicode__ on Python 2
        return str(self.name)

class City(models.Model):
    city_id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __unicode__(self):
        return unicode(self.city_id)

    def __str__(self):
        return unicode(self.city_id)

class Event(models.Model):
    text = models.TextField()
    category = models.ForeignKey(Category)
    animation = models.CharField(max_length=20)
    publisher = models.ForeignKey(Publisher)
    origin = models.ForeignKey(City, related_name='origin')
    arc_connections = models.ManyToManyField(City, related_name='cities', blank=True)
    side = models.CharField(max_length=20)

    def __unicode__(self):
        return unicode(self.publisher.name + ' - ' + self.text)

    def __str__(self):
        return unicode(self.publisher.name + ' - ' + self.text)