# PlanPie
planpie app with (django + react + react native)



docker down
- docker compose -f docker-compose.dev.yaml down

docker build
- docker compose -f docker-compose.dev.yaml build

docker run
- docker compose -f docker-compose.dev.yaml up


db migrations

docker exec it django_dev python manage.py makemigrations


