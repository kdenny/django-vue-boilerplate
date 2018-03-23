# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

# Create your models here.

class AccountManager(models.Model):
    name = models.CharField(max_length=100)

        # Returns the string representation of the model.
    def __unicode__(self):              # __unicode__ on Python 2
        return unicode(self.name)

    def __str__(self):
        return unicode(self.name)

class Organization(models.Model):
    name = models.CharField(max_length=100)
    cs_id = models.CharField(max_length=50, primary_key=True)
    account_manager = models.ForeignKey(AccountManager)
    segment = models.CharField(max_length=20)

        # Returns the string representation of the model.
    def __unicode__(self):              # __unicode__ on Python 2
        return unicode(self.name)

    def __str__(self):
        return unicode(self.name)

class Publisher(models.Model):
    name = models.CharField(max_length=100)
    aid = models.CharField(max_length=50, primary_key=True)
    parentOrg = models.ForeignKey(Organization)
    logoUrl = models.CharField(max_length=50, blank=True)
    homepageUrl = models.CharField(max_length=200)
    integrationType = models.CharField(max_length=200)

        # Returns the string representation of the model.
    def __unicode__(self):              # __unicode__ on Python 2
        return unicode(self.name)
    
    def __str__(self):
        return unicode(self.name)