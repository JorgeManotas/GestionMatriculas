# Sistema de Gestion de Matriculas y Mensualidades

Aplicacion web para un colegio privado que centraliza usuarios, roles, matriculas, mensualidades y pagos. El sistema esta dividido en un backend con FastAPI y PostgreSQL, y un frontend Angular para consumir la API.

## Arquitectura

```text
GestionMatriculas/
  backend/
    app/
      routers/
      config.py
      crud.py
      database.py
      main.py
      models.py
      schemas.py
    .env
    .env.example
    requirements.txt
  database/
    schema.sql
  frontend/
    src/
      app/
        components/
        services/
    angular.json
    package.json
  .gitignore
  README.md
```

## Base de datos

La base de datos usa PostgreSQL en Neon. El diseno principal evita duplicar personas en tablas separadas:

- `users`: una unica tabla para profesores, secretarias, acudientes, estudiantes y administradores.
- `roles`: catalogo de roles.
- `user_roles`: tabla intermedia para que un usuario pueda tener varios roles.
- `role_attributes JSONB`: campo flexible en `users` para atributos particulares de cada rol.

Ejemplo de `role_attributes`:

```json
{
  "guardian": {
    "phone": "+57 300 123 4567",
    "relationship": "Madre"
  },
  "teacher": {
    "specialty": "Matematicas",
    "contract_type": "Tiempo completo"
  }
}
```

Esta estrategia permite que una secretaria tambien sea acudiente, o que un profesor tenga otro rol, sin crear multiples registros de persona ni columnas nulas para atributos que no aplican.

## Requisitos

- Python 3.11+
- Node.js 20+
- Angular CLI 17+
- PostgreSQL remoto en Neon

## Backend

1. Entra a la carpeta:

```bash
cd backend
```

2. Crea y activa el entorno virtual:

```bash
python -m venv .venv
.venv\Scripts\activate
```

3. Instala dependencias:

```bash
pip install -r requirements.txt
```

4. Revisa `backend/.env`. Ya contiene la URL real de Neon en tu maquina local. Ese archivo esta protegido por `.gitignore`.

5. Ejecuta el SQL de `database/schema.sql` en Neon.

6. Levanta la API:

```bash
uvicorn app.main:app --reload
```

La API quedara en:

```text
http://127.0.0.1:8000
```

Documentacion interactiva:

```text
http://127.0.0.1:8000/docs
```

## Frontend

1. Entra a la carpeta:

```bash
cd frontend
```

2. Instala dependencias:

```bash
npm install
```

3. Ejecuta Angular:

```bash
npm start
```

La aplicacion quedara en:

```text
http://localhost:4200
```

## Endpoints principales

- `GET /health`: estado basico de la API.
- `GET /api/roles`: lista roles.
- `GET /api/users`: lista usuarios.
- `POST /api/users`: crea usuario con roles.
- `GET /api/guardians/{guardian_id}/payments`: obtiene estudiantes y mensualidades asociadas a un acudiente.
- `POST /api/payments`: registra un pago.

## Seguridad de credenciales

El archivo real `backend/.env` no debe subirse a Git. El repositorio solo debe compartir `backend/.env.example`, que contiene una URL falsa de ejemplo.

Contenido clave del `.gitignore`:

```gitignore
.env
backend/.env
.venv/
venv/
node_modules/
dist/
.angular/
```

## Usuarios de prueba

Los usuarios de prueba del SQL usan correos `@colegiosol.edu.co` y contrasenas mockeadas con el patron `User12345*`. En un sistema productivo estas contrasenas deben almacenarse con hashing real usando `bcrypt` o Argon2, nunca en texto plano.
