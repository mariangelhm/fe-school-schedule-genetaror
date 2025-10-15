# School Scheduler Platform

School Scheduler is a microservice-oriented platform intended to generate and manage annual class schedules for a school. The current codebase focuses on the backend Spring Boot services and lays the groundwork for additional services and a React frontend that will be added in future iterations.

## Repository structure

```
school-scheduler/
├── config-service/        # Centralized configuration server (Spring Cloud Config style)
├── subject-service/       # CRUD for subjects
├── course-service/        # CRUD for courses and schedule placeholder endpoints
├── teacher-service/       # CRUD for teachers and availability summaries
├── holiday-service/       # CRUD for holidays
├── pom.xml                # Maven parent aggregator
└── README.md
```

> **Planned modules**: `gateway-service`, `eureka-server`, `auth-service`, `event-service`, `schedule-service`, and a `frontend/` React client are declared in the parent `pom.xml` but still pending implementation.

## Technology stack

- Java 17, Spring Boot 3.2
- Spring Data JPA + PostgreSQL
- Spring Cloud (Config client hooks already in place)
- Springdoc OpenAPI for Swagger documentation (`/swagger-ui/index.html`)
- Dockerfiles for each microservice (Docker Compose file to be provided later)

## Prerequisites

Make sure the following tools are available locally:

- **Java 17** (e.g., Temurin/OpenJDK 17)
- **Maven 3.9+**
- **Docker & Docker Compose** (to run PostgreSQL or containerize the services)
- **PostgreSQL 15+** (if running the database locally without Docker)

## Database setup

All microservices expect a PostgreSQL database named `school_scheduler` reachable with the following defaults:

- Host: `postgres`
- Port: `5432`
- Username: `scheduler`
- Password: `scheduler`

When running services locally without Docker networking, override the datasource host to `localhost`. You can do this either by exporting environment variables before launching the service:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/school_scheduler
export SPRING_DATASOURCE_USERNAME=scheduler
export SPRING_DATASOURCE_PASSWORD=scheduler
```

Or by editing the `spring.datasource.url` property in the corresponding `application.yml`.

### Starting PostgreSQL with Docker

```bash
docker network create school-scheduler-net || true

docker run \
  --name school-scheduler-db \
  --network school-scheduler-net \
  -e POSTGRES_DB=school_scheduler \
  -e POSTGRES_USER=scheduler \
  -e POSTGRES_PASSWORD=scheduler \
  -p 5432:5432 \
  -d postgres:15
```

Each Spring Boot container can then join the same network (see the Docker instructions below).

## Building the project

From the repository root:

```bash
mvn clean install
```

This command compiles and packages each available service. You can also build a specific module:

```bash
mvn clean package -pl subject-service -am
```

## Running the microservices (development mode)

Each service can be executed with `spring-boot:run`. Always start the **Config Service** first so that other services can fetch shared properties.

1. **Config Service**
   ```bash
   cd config-service
   mvn spring-boot:run
   ```
   - Port: `8888`
   - Swagger UI: `http://localhost:8888/swagger-ui/index.html`

2. **Subject Service**
   ```bash
   cd subject-service
   mvn spring-boot:run
   ```
   - Port: `8082`
   - Swagger UI: `http://localhost:8082/swagger-ui/index.html`

3. **Course Service**
   ```bash
   cd course-service
   mvn spring-boot:run
   ```
   - Port: `8083`
   - Swagger UI: `http://localhost:8083/swagger-ui/index.html`

4. **Teacher Service**
   ```bash
   cd teacher-service
   mvn spring-boot:run
   ```
   - Port: `8084`
   - Swagger UI: `http://localhost:8084/swagger-ui/index.html`

5. **Holiday Service**
   ```bash
   cd holiday-service
   mvn spring-boot:run
   ```
   - Port: `8085`
   - Swagger UI: `http://localhost:8085/swagger-ui/index.html`

> When running outside Docker, remember to override the datasource host as described earlier.

## Running services with Docker

Each microservice already includes a simple `Dockerfile`. After building the JAR (`mvn clean package`), you can build and run the container, making sure to attach it to the `school-scheduler-net` network so that it can reach PostgreSQL at the `postgres` hostname.

```bash
cd subject-service
mvn clean package

docker build -t schoolscheduler/subject-service .
docker run --rm \
  --network school-scheduler-net \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/school_scheduler \
  -e SPRING_DATASOURCE_USERNAME=scheduler \
  -e SPRING_DATASOURCE_PASSWORD=scheduler \
  -p 8082:8082 \
  schoolscheduler/subject-service
```

Repeat the same pattern for the other services, adjusting exposed ports as needed. A consolidated `docker-compose.yml` will be added once all services are available.

## Service overview

| Service           | Purpose                                           | Key endpoints |
|-------------------|---------------------------------------------------|----------------|
| Config Service    | Stores editable global configuration properties.  | `GET/PUT /api/config` |
| Subject Service   | Manages subjects (name, level, weekly blocks, etc.) | `GET /api/subjects`, `POST /api/subjects` |
| Course Service    | Manages courses and exposes placeholder schedule endpoints. | `GET /api/courses`, `GET /api/courses/{id}/schedule` |
| Teacher Service   | Manages teachers and provides assignment summaries. | `GET /api/teachers`, `GET /api/teachers/{id}/summary` |
| Holiday Service   | Manages holidays that affect scheduling.          | `GET /api/holidays`, `POST /api/holidays` |

All services expose comprehensive OpenAPI specs at `/v3/api-docs` and Swagger UI at `/swagger-ui/index.html`.

## Example requests

```bash
# List all subjects
curl http://localhost:8082/api/subjects

# Create a new teacher
curl -X POST http://localhost:8084/api/teachers \
  -H 'Content-Type: application/json' \
  -d '{
        "name": "Jane Doe",
        "contractType": "FULL",
        "weeklyHours": 30,
        "availableBlocks": ["MONDAY_1", "MONDAY_2"],
        "subjects": [1, 2]
      }'
```

Refer to each service's DTO classes for the expected payloads.

## Testing

Automated tests are not yet implemented. The standard Spring Boot test lifecycle can be triggered with:

```bash
mvn test
```

## Next steps / roadmap

- Implement the remaining microservices (auth, schedule, events, gateway, Eureka).
- Provide Docker Compose orchestration for the full stack (including PostgreSQL and RabbitMQ).
- Add seed data scripts and automated database migrations.
- Deliver the React + Vite frontend client.
- Add CI pipelines and automated tests (JUnit on the backend, Jest/React Testing Library on the frontend).

## Contributing

1. Fork the repository and create a feature branch.
2. Commit descriptive changes and open a Pull Request.
3. Ensure services build locally before submitting changes.

## License

This project is licensed under the Apache 2.0 License (see individual module configurations).
