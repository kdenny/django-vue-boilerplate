# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from .models import Event, City, Category

# Register your models here.

admin.site.register(Event)
admin.site.register(City)
admin.site.register(Category)
