from rest_framework import serializers

from .models import Publisher, Organization

class PublisherReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publisher

        fields = ('aid', 'name', 'parentOrg', 'logoUrl', 'homepageUrl', 'integrationType', )
        depth = 1

class PublisherCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publisher

        fields = ('aid', 'name', 'parentOrg', 'homepageUrl', 'integrationType', )

class OrganizationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization

        fields = ('name', 'cs_id', 'account_manager', 'segment', )