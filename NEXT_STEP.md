# Actualización de Perfil

He añadido los campos `phone_number` y `address`, y la posibilidad de editarlos en la página de perfil.

## Pasos Importantes

1.  **Ejecuta el script SQL en Supabase:**
    Para que los nuevos campos funcionen, necesitas añadir las columnas a la base de datos.
    ```bash
    cat /Users/miguel/.gemini/antigravity/brain/91dfdef7-d700-4a38-ba1d-7840929e0f6c/manual_add_contact_cols.sql
    ```
2.  **Prueba la Edición:**
    Visita `/profile` y usa el botón de editar (lápiz) para actualizar tu información.
