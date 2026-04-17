# GestionMatriculas
Plataforma para gestión de matrículas y mensualidades para colegios privados de Soledad, Atlántico.

## Reestructuración del Proyecto (Abril 2026)
El proyecto ha entrado en una fase de **rediseño total a microservicios y arquitectura limpia**. El objetivo es transformar la lógica inicial en un sistema escalable, seguro y automatizado.

### Arquitectura y Diseño
* **Arquitectura de Software:** Basada en N-Capas (Clean Architecture) para separar la lógica de negocio de la infraestructura.
* **Modelo de Datos:** Implementación de un MER extensible con **UUID (v4)** y soporte para atributos dinámicos (EAV), permitiendo que el sistema se adapte a diferentes requisitos escolares sin cambios en el esquema.
* **Motor Financiero:** Gestión de deudas mediante planes de pago y cuotas flexibles (1-24 cuotas).

### Stack Tecnológico
* **Backend:** .NET 8 (C#) con Entity Framework Core.
* **Base de Datos:** PostgreSQL (Npgsql).
* **Servicios de IA:** FastAPI (Python) para la validación inteligente de comprobantes de pago mediante procesamiento de imágenes.
* **Servicios Externos:** Node.js para microservicios de soporte.
* **Frontend:** Angular (Interfaz moderna).

### Hitos de la Fase Actual
- [x] Definición del MER y Script de Base de Datos.
- [x] Configuración del entorno de desarrollo .NET y paquetes NuGet.
- [x] Creación de la estructura base de carpetas (`Data`, `Models`, `Services`).
- [ ] Implementación de Entidades y Contexto de Base de Datos.
- [ ] Desarrollo del módulo de validación con IA.

---
