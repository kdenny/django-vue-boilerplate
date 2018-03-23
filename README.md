# REST API boilerplate
## Django REST application with Vue frontend

See example app running on server at http://globekit-cms.appspot.com/

### Installing and running locally

1. clone and cd into the repo
2. npm install
3. pip install -r requirements.txt
4. ./node_modules/.bin/webpack
5. ./cloud_sql_proxy -instances="globekit-cms:us-east1:globekit-cms"=tcp:3306
6. python manage.py collectstatic
7. python manage.py runserver


### Steps to compile new changes with webpack

1. ./node_modules/.bin/webpack
2. python manage.py collectstatic

### Project Structure

1. Traditional Django REST framework app split across 2 apps, globekit_api and publisher_admin
2. A very lightweight, runtime-only Vue.js application that lives within the /assets/js folder


#### Thank you to:
- @michaelbukachi for the awesome tutorial that this is loosely based on: https://github.com/michaelbukachi/django-vuejs-tutorial/wiki/Django-Vue.js-Integration-Tutorial
- The django-webpack-loader package that enables the integration here