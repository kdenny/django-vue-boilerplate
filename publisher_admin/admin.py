# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from .models import Publisher, Organization, AccountManager

# Register your models here.

admin.site.register(Publisher)
admin.site.register(Organization)
admin.site.register(AccountManager)