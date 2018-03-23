# REST API boilerplate
## Django REST application with Vue frontend

See version running on server at http://globekit-cms.appspot.com/

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