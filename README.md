# Gestión Matrículas - Escala

Plataforma integral para la gestión académica y financiera de colegios privados en Soledad, Atlántico.

## Arquitectura del Sistema
El proyecto implementa **Clean Architecture** (Arquitectura Limpia) para garantizar el desacoplamiento y la testabilidad:

*   **src/Domain**: Núcleo del sistema. Contiene entidades POCO (Estudiante, Usuario, Cuota) y lógica de negocio pura.
*   **src/Application**: Casos de uso. Orquesta la lógica (Ej: Proceso de Matrícula, Generación de Cuotas).
*   **src/Infrastructure**: Detalles técnicos. Implementación de PostgreSQL con EF Core, repositorios y servicios externos.
*   **src/WebAPI**: Punto de entrada. Controladores REST que exponen los servicios al Frontend.

## Stack Tecnológico
*   **Backend:** .NET 8 + Entity Framework Core (PostgreSQL).
*   **Inteligencia Artificial:** FastAPI + Hugging Face (Validación de comprobantes).
*   **Frontend:** Angular 17+.
*   **Base de Datos:** PostgreSQL con soporte nativo para UUID v4.

## Módulos Principales
1.  **Identity & Flexibility**: Gestión de usuarios y roles con atributos dinámicos.
2.  **Academic Structure**: Control de periodos lectivos, grados, cursos y secciones.
3.  **Financial Engine (IA):** Motor de planes de pago y validación automática de comprobantes mediante visión artificial.
