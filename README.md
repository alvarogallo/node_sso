Esta aplicacion crea el servicio SSO

le enviamos tipo POST email y password y el servidor nos regresa un token

En el encabezado debemos enviarle 

Content-Type: application/json
token-acceso: tu_valor_del_token



TOKEN_ACCESO=tu_token_secreto ->esto ira en el .env






las credenciales deben ir en el body

{
  "email": "tu_email",
  "password": "tu_password"
}


Las rutas son:

/ para mirar cuantos usuarios 
/api/login 
/api/register
/api/validar
/api/verify-token


