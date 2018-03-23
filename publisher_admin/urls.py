from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^publishers/$', views.PublisherList.as_view())
]