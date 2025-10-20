# School Scheduler Frontend

Este repositorio contiene **exclusivamente** el cliente web de School Scheduler, una aplicación React + Vite + TypeScript diseñada para consumir los microservicios del ecosistema School Scheduler (backend mantenido en un proyecto aparte).

## Características principales

- SPA desarrollada con React 18, Vite y TailwindCSS.
- Tipado completo en TypeScript y linting con ESLint + Prettier.
- Gestión de estado ligero con Zustand y consultas asíncronas con React Query.
- Mantenedores con datos persistidos en el navegador para trabajar sin backend durante las demos y soportar edición completa.
- Uso de una lista fija de niveles académicos (Parvulario, Básico y Media) compartida entre asignaturas, cursos y docentes.
- Gestión completa de aulas, cursos, asignaturas y profesores desde el Dashboard con accesos rápidos y tablas actualizadas en vivo.
- Previsualización de horarios por nivel con pestañas de cursos/profesores, filtros, etiquetas de docentes y exportación profesional a PDF por curso/profesor en orientación horizontal.
- Distribución automática que respeta preferencia horaria de asignaturas, bloques administrativos y bloque de almuerzo visible en la grilla.
- Configuración visualmente diferenciada por nivel (Parvulario, Básico y Media) con recreos por nivel, validación de horas administrativas (incluye opción "No aplica") y control del nombre del colegio mostrado en los horarios.
- Configuraciones de niveles y cargas horarias totalmente desconectadas de feriados/eventos (el mantenedor se concentra en académica pura).
- Ruteo con `react-router-dom` y componentes reutilizables para paneles, mantenedores y vistas de calendario.
- Integración prevista con un gateway/API externa protegida con JWT.

## Configuración dinámica desde el front

- **Niveles predefinidos:** las pantallas de asignaturas, cursos, profesores y aulas utilizan siempre los niveles "Parvulario", "Básico" y "Media". En la configuración se distinguen con colores y cada uno define su hora de término diaria.
- **Recreos por nivel:** añade uno o más recreos (en minutos) entre bloques. El generador los respeta en la distribución semanal y se muestran como filas amarillas en las previsualizaciones/exportaciones.
- **Horas administrativas:** marca "No aplica" o define bloques administrativos por día. Se valida que no se crucen con el almuerzo y es obligatorio seleccionar una de las dos opciones para poder generar horarios.
- **Bloque de almuerzo:** especifica inicio y duración del almuerzo; aparece resaltado en las tablas y se excluye de la carga académica.
- **Contrato tiempo completo:** configura cuántas horas semanales representa un contrato full-time y se asignan automáticamente a los profesores con ese tipo de contrato.
- **Preferencias horarias de asignaturas:** cada asignatura puede indicar si prefiere jornada mañana o tarde y el generador intentará respetarlo en la asignación.
- **Previsualización enriquecida:** antes de confirmar puedes revisar tablas por curso o profesor, filtrar rápidamente, ver resúmenes (horas clase/administrativas, detalle por asignatura) y descargar un PDF por curso/profesor con encabezado institucional.
- Todas las configuraciones se guardan en el navegador (localStorage) cuando no hay backend disponible, permitiendo demos sin conexión.

## Reglas funcionales de los mantenedores

- **Cursos:** cada curso debe tener un aula asignada (no se pueden compartir aulas entre cursos) y su nivel se determina automáticamente según la configuración global. Si el curso pertenece al nivel Media, se exige seleccionar un profesor jefe registrado previamente.
- **Profesores:** cada docente pertenece a un único nivel, debe indicar la carga horaria semanal y elegir al menos un curso existente. El mantenedor queda bloqueado cuando no hay cursos creados y solo los profesores que imparten asignaturas especiales pueden quedar asociados a más de un curso.
- **Asignaturas:** definen la carga semanal por nivel, el límite máximo de bloques diarios y solo pueden registrarse una vez por nivel (no se permiten duplicar nombres en el mismo nivel).
- **Aulas:** se gestionan por nivel para garantizar compatibilidad, no permiten nombres duplicados y cada aula solo puede quedar asociada a un curso a la vez.
- **Validación de formularios:** todos los campos de texto permiten hasta 50 caracteres, alineados con los requisitos de datos del backend.

## Requisitos previos

- **Node.js 20+**
- **npm** (viene con Node) o **pnpm** si prefieres un gestor alternativo

> **Nota:** No necesitas Java, Maven ni Docker para trabajar con este repositorio. Todos los servicios backend viven en otro proyecto y se consumen vía HTTP.

## Configuración inicial

1. Clona el repositorio y accede al directorio raíz:
   ```bash
   git clone <url-del-repo>
   cd fe-school-schedule-genetaror
   ```
2. Instala las dependencias del frontend:
   ```bash
   cd frontend
   npm install
   ```

## Variables de entorno

El frontend utiliza variables prefijadas con `VITE_`. Crea un archivo `.env` dentro de `frontend/` para personalizar los endpoints del backend externo:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_AUTH_URL=http://localhost:8080/auth
```

Ajusta los valores según la URL expuesta por tu gateway o microservicio de autenticación.

## Scripts disponibles

Desde la carpeta `frontend/` puedes ejecutar:

- `npm run dev`: levanta el servidor de desarrollo de Vite en `http://localhost:5173` con recarga en caliente.
- `npm run build`: genera los artefactos optimizados en `dist/` listos para desplegarse en un servidor estático.
- `npm run preview`: sirve localmente la build optimizada para verificación final.
- `npm run lint`: ejecuta ESLint para validar estilo y reglas de TypeScript/React.

> El servidor de desarrollo está configurado para escuchar en `0.0.0.0`, por lo que podrás acceder desde tu máquina anfitriona
> aunque ejecutes el proyecto dentro de Docker, WSL o un contenedor de desarrollo remoto.

## Estructura del proyecto

```
frontend/
├── public/              # Recursos estáticos (favicon, manifest, etc.)
├── src/
│   ├── components/      # Componentes UI reutilizables (navegación, paneles, formularios)
│   ├── pages/           # Páginas principales (Dashboard, Configuración, Horario, Mantenedores)
│   ├── services/        # Clientes HTTP para los microservicios externos
│   ├── store/           # Hooks Zustand con datos demo persistidos en localStorage
│   ├── styles.css       # Estilos globales con Tailwind + utilidades personalizadas
│   └── main.tsx         # Punto de entrada de la aplicación
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Flujo de desarrollo recomendado

1. Levanta los microservicios backend en su proyecto correspondiente (por ejemplo, mediante docker-compose o Maven).
2. Verifica que el gateway exponga los endpoints REST requeridos (`/api/*`, `/auth/*`).
3. Configura las variables `VITE_API_BASE_URL` y `VITE_AUTH_URL` para apuntar al backend.
4. Ejecuta `npm run dev` y comienza a desarrollar o probar las vistas.

## Despliegue

El resultado de `npm run build` es una aplicación estática que puedes hospedar en cualquier CDN, bucket S3, Netlify, Vercel o incluso detrás del mismo gateway del backend.

## Próximos pasos sugeridos

- Añadir pruebas unitarias con Vitest + Testing Library.
- Integrar autenticación real con JWT y refresco de tokens.
- Consumir los microservicios reales para mostrar datos en el Dashboard, mantenedores y calendario.
- Configurar CI/CD (por ejemplo, GitHub Actions) para lint + build automáticos.

## Licencia

Define la licencia que prefieras (MIT, Apache-2.0, etc.) y documenta las restricciones de uso según las necesidades del proyecto.
