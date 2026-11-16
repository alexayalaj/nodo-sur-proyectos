// Variables comunes de las pruebas (se ejecuta antes de cada archivo de prueba)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-solo-para-pruebas';
process.env.JWT_EXPIRES_IN = '30m';
process.env.CORS_ORIGIN = '*';
process.env.LIMITE_INTENTOS = '1000';
