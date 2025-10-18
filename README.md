# School Scheduler Frontend

Este repositorio contiene **exclusivamente** el cliente web de School Scheduler, una aplicación React + Vite + TypeScript diseñada para consumir los microservicios del ecosistema School Scheduler (backend mantenido en un proyecto aparte).

## Características principales

- SPA desarrollada con React 18, Vite y TailwindCSS.
- Tipado completo en TypeScript y linting con ESLint + Prettier.
- Gestión de estado ligero con Zustand y consultas asíncronas con React Query.
- Mantenedores con datos persistidos en el navegador para trabajar sin backend durante las demos y soportar edición completa.
- Uso de una lista fija de niveles académicos (Parvulario, Básico y Media) compartida entre asignaturas, cursos y docentes.
- Previsualización de horarios que respeta configuraciones globales antes de confirmar la generación real.
- Reacomodo manual de bloques por drag & drop, ciclos académicos configurables y bloque de almuerzo visible en el calendario.
- Configuraciones de niveles y cargas horarias totalmente desconectadas de feriados/eventos (el mantenedor se concentra en académica pura).
- Ruteo con `react-router-dom` y componentes reutilizables para paneles, mantenedores y vistas de calendario.
- Integración prevista con un gateway/API externa protegida con JWT.

## Configuración dinámica desde el front

- **Ciclos académicos:** define nombre, niveles asociados y hora de término diaria para cada ciclo. Estos valores limitan automáticamente la cantidad de bloques que puede tener un curso por día y semana.
- **Asignaturas por ciclo:** configura cuántos bloques debe cursar cada ciclo para una asignatura específica y establece límites máximos diarios antes de generar los horarios.
- **Niveles predefinidos:** las pantallas de asignaturas, cursos y profesores utilizan siempre los niveles "Parvulario", "Básico" y "Media" para mantener consistencia con el backend y evitar configuraciones incongruentes.
- **Bloque de almuerzo:** especifica el inicio y duración del almuerzo. El bloque aparece resaltado en las previsualizaciones y se descuenta de la capacidad diaria disponible.
- **Previsualización editable:** antes de generar los horarios definitivos puedes arrastrar cada clase a otro día o bloque para ajustar manualmente la malla.
- Todas las configuraciones se guardan en el navegador (localStorage) cuando no hay backend disponible, permitiendo demos sin conexión.

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
│   ├── pages/           # Páginas principales (Dashboard, Configuración, Horario)
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
