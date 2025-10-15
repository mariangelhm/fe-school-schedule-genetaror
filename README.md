# School Scheduler Platform

School Scheduler es una plataforma basada en microservicios diseñada para generar y administrar los horarios escolares de todo un año académico. El repositorio ya incluye varios servicios Spring Boot funcionales, una configuración Maven multimódulo y la estructura preparada para sumar los servicios restantes descritos en el enunciado original.

## Estructura del repositorio

```
school-scheduler/
├── config-service/        # Servicio de configuración centralizada
├── subject-service/       # CRUD de asignaturas
├── course-service/        # CRUD de cursos y endpoints de horario
├── teacher-service/       # CRUD de docentes y resúmenes de carga
├── holiday-service/       # CRUD de feriados
├── pom.xml                # POM padre (aggregator)
└── README.md
```

> **Módulos planificados**: `gateway-service`, `eureka-server`, `auth-service`, `event-service`, `schedule-service` y el cliente `frontend/` en React están declarados en el `pom.xml` padre, pero aún no cuentan con implementación. El plan es incorporarlos en iteraciones posteriores.

## Tecnologías principales

- Java 17 y Spring Boot 3.2
- Spring Data JPA + PostgreSQL
- Spring Cloud (preparado para Config Client)
- Springdoc OpenAPI para documentación Swagger (`/swagger-ui/index.html`)
- Dockerfiles individuales por microservicio (se añadirá `docker-compose.yml` cuando todos estén listos)

## Prerrequisitos

Instala o verifica que tienes disponibles en tu máquina de desarrollo:

- **Java 17** (Temurin u OpenJDK)
- **Maven 3.9+**
- **Docker y Docker Compose** (opcional pero recomendado)
- **PostgreSQL 15+** (solo si no usarás Docker para la base de datos)

## Configuración de la base de datos

Todos los microservicios esperan una base PostgreSQL llamada `school_scheduler` con las siguientes credenciales por defecto:

- Host: `postgres`
- Puerto: `5432`
- Usuario: `scheduler`
- Contraseña: `scheduler`

Si ejecutas los servicios de manera local (sin Docker) cambia el host a `localhost`. Puedes hacerlo exportando variables de entorno antes de lanzar cada servicio:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/school_scheduler
export SPRING_DATASOURCE_USERNAME=scheduler
export SPRING_DATASOURCE_PASSWORD=scheduler
```

También puedes ajustar el `spring.datasource.url` directamente en `application.yml`.

### Levantar PostgreSQL con Docker

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

Una vez levantada la base, cada microservicio puede conectarse utilizando esa red (`school-scheduler-net`) para resolver el host `postgres`.

## Compilación del proyecto

Desde la raíz del repositorio:

```bash
mvn clean install
```

El comando compila y empaqueta cada módulo disponible. Si necesitas construir un servicio específico:

```bash
mvn clean package -pl subject-service -am
```

## Ejecución de los microservicios (modo desarrollo)

Ejecuta cada servicio con `mvn spring-boot:run`. **Importante**: inicia primero el **Config Service** para que el resto pueda leer la configuración centralizada.

1. **Config Service**
   ```bash
   cd config-service
   mvn spring-boot:run
   ```
   - Puerto: `8888`
   - Swagger UI: `http://localhost:8888/swagger-ui/index.html`

2. **Subject Service**
   ```bash
   cd subject-service
   mvn spring-boot:run
   ```
   - Puerto: `8082`
   - Swagger UI: `http://localhost:8082/swagger-ui/index.html`

3. **Course Service**
   ```bash
   cd course-service
   mvn spring-boot:run
   ```
   - Puerto: `8083`
   - Swagger UI: `http://localhost:8083/swagger-ui/index.html`

4. **Teacher Service**
   ```bash
   cd teacher-service
   mvn spring-boot:run
   ```
   - Puerto: `8084`
   - Swagger UI: `http://localhost:8084/swagger-ui/index.html`

5. **Holiday Service**
   ```bash
   cd holiday-service
   mvn spring-boot:run
   ```
   - Puerto: `8085`
   - Swagger UI: `http://localhost:8085/swagger-ui/index.html`

> Si ejecutas los servicios fuera de Docker recuerda cambiar el host de la base a `localhost`, tal como se mencionó en la sección de configuración.

## Ejecución con Docker

Cada microservicio ya cuenta con un `Dockerfile`. Luego de generar el JAR (`mvn clean package`), construye la imagen y ejecútala conectándola a la red `school-scheduler-net`.

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

Repite el proceso para los demás servicios ajustando el puerto expuesto. Cuando todos los microservicios estén listos se añadirá un `docker-compose.yml` que automatice su despliegue.

## Resumen de servicios actuales

| Servicio         | Propósito                                              | Endpoints clave |
|------------------|---------------------------------------------------------|-----------------|
| Config Service    | Gestiona propiedades globales editables.               | `GET/PUT /api/config` |
| Subject Service   | Administra asignaturas (nombre, nivel, bloques, etc.). | `GET /api/subjects`, `POST /api/subjects` |
| Course Service    | Administra cursos y expone endpoints de horario.       | `GET /api/courses`, `GET /api/courses/{id}/schedule` |
| Teacher Service   | Administra docentes y entrega resúmenes de carga.      | `GET /api/teachers`, `GET /api/teachers/{id}/summary` |
| Holiday Service   | Registra feriados oficiales.                            | `GET /api/holidays`, `POST /api/holidays` |

## Próximos pasos

- Incorporar `auth-service`, `gateway-service`, `schedule-service`, `event-service` y `eureka-server`.
- Definir `docker-compose.yml` con todos los contenedores, incluyendo PostgreSQL y Zipkin.
- Añadir la aplicación `frontend/` en React + Vite.
- Implementar estrategia de mensajería (RabbitMQ) y trazabilidad (Spring Sleuth + Zipkin).
- Escribir pruebas unitarias y de integración para cada servicio.

## Contribuciones

Las contribuciones son bienvenidas. Abre un issue describiendo la mejora o el bug antes de crear un pull request. Procura seguir las convenciones de código establecidas y añadir pruebas cuando apliquen.

